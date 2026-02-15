import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

/**
 * Extract year level from notation
 * AC9LFF01 or AC9LF2 → 'F-2' (Foundation to Year 2)
 * AC9LF4 → '3-4'
 * AC9LF6 → '5-6'
 * AC9LF8 → '7-8'
 * AC9LF10 → '9-10'
 */
function extractYearLevel(notation) {
  // Match patterns like AC9LFF01, AC9LF2C01, AC9LF4C01, etc.
  if (notation.match(/AC9LFF\d/)) return 'F-2';
  if (notation.match(/AC9LF2[CU]/)) return 'F-2';
  if (notation.match(/AC9LF4[CU]/)) return '3-4';
  if (notation.match(/AC9LF6[CU]/)) return '5-6';
  if (notation.match(/AC9LF8[CU]/)) return '7-8';
  if (notation.match(/AC9LF10[CU]/)) return '9-10';
  return null;
}

/**
 * Extract competency area from notation
 * C = Communicating, U = Understanding
 */
function extractCompetency(notation) {
  // Check if it's a content description (ends with C## or U##)
  const match = notation.match(/([CU])(\d{2})(?:_E\d+)?$/);
  if (!match) return null;

  const [, type, number] = match;
  return { type, number: parseInt(number) };
}

/**
 * Get competency name based on type and number
 */
function getCompetencyName(type, number) {
  if (type === 'C') {
    const communicatingTopics = {
      1: 'Socialising',
      2: 'Informing',
      3: 'Creating',
      4: 'Translating',
      5: 'Identity and reflecting',
      6: 'Reflecting on intercultural language use'
    };
    return communicatingTopics[number] || `Communicating ${number}`;
  } else if (type === 'U') {
    const understandingTopics = {
      1: 'Systems of language',
      2: 'Language variation and change',
      3: 'Role of language and culture'
    };
    return understandingTopics[number] || `Understanding ${number}`;
  }
  return null;
}

async function populateTopics() {
  console.log('📦 Opening database:', DB_PATH);
  const db = new Database(DB_PATH);

  try {
    console.log('\n🔧 Building topic hierarchy for French language...\n');

    // Clear existing French topics
    console.log('Clearing existing French topics...');
    db.prepare('DELETE FROM question WHERE language = ?').run('fr');
    db.prepare('DELETE FROM topic WHERE language = ?').run('fr');

    // Create root topic
    const rootId = uuidv4();
    db.prepare(`
      INSERT INTO topic (id, name, curriculumId, parentId, language)
      VALUES (?, ?, ?, ?, ?)
    `).run(rootId, 'French Language F-10', null, null, 'fr');
    console.log('✅ Created root: French Language F-10');

    // Get all French content descriptions (not elaborations)
    const contentDescriptions = db.prepare(`
      SELECT id, notation, label, description
      FROM curriculum_statements
      WHERE language = 'fr'
        AND notation NOT LIKE '%_E%'
        AND label = 'Content Description'
      ORDER BY notation
    `).all();

    console.log(`\nFound ${contentDescriptions.length} content descriptions\n`);

    // Group by year level
    const yearLevelMap = new Map();
    const yearLevelOrder = ['F-2', '3-4', '5-6', '7-8', '9-10', '11-12'];

    for (const cd of contentDescriptions) {
      const yearLevel = extractYearLevel(cd.notation);
      if (!yearLevel) continue;

      if (!yearLevelMap.has(yearLevel)) {
        yearLevelMap.set(yearLevel, []);
      }
      yearLevelMap.get(yearLevel).push(cd);
    }

    let totalTopics = 1; // root

    // Create year level topics
    for (const yearLevel of yearLevelOrder) {
      const cds = yearLevelMap.get(yearLevel);
      if (!cds || cds.length === 0) continue;

      // Create year level topic
      const yearLevelId = uuidv4();
      const yearLevelName = yearLevel === 'F-2' ? 'Foundation to Year 2' : `Years ${yearLevel}`;

      db.prepare(`
        INSERT INTO topic (id, name, curriculumId, parentId, language)
        VALUES (?, ?, ?, ?, ?)
      `).run(yearLevelId, yearLevelName, null, rootId, 'fr');

      console.log(`📚 ${yearLevelName}`);
      totalTopics++;

      // Group by competency area (Communicating/Understanding)
      const competencyMap = new Map();
      competencyMap.set('C', []);
      competencyMap.set('U', []);

      for (const cd of cds) {
        const comp = extractCompetency(cd.notation);
        if (comp) {
          competencyMap.get(comp.type).push({ ...cd, comp });
        }
      }

      // Create competency area topics
      for (const [compType, compCds] of competencyMap.entries()) {
        if (compCds.length === 0) continue;

        const compAreaName = compType === 'C' ? 'Communicating' : 'Understanding';
        const compAreaId = uuidv4();

        db.prepare(`
          INSERT INTO topic (id, name, curriculumId, parentId, language)
          VALUES (?, ?, ?, ?, ?)
        `).run(compAreaId, compAreaName, null, yearLevelId, 'fr');

        console.log(`  ├─ ${compAreaName}`);
        totalTopics++;

        // Create specific competency topics
        for (const cd of compCds) {
          const topicName = getCompetencyName(cd.comp.type, cd.comp.number);
          const topicId = uuidv4();

          db.prepare(`
            INSERT INTO topic (id, name, curriculumId, parentId, language)
            VALUES (?, ?, ?, ?, ?)
          `).run(topicId, topicName, cd.id, compAreaId, 'fr');

          console.log(`  │  └─ ${topicName} (${cd.notation})`);
          totalTopics++;
        }
      }

      console.log('');
    }

    // Validation
    console.log('📊 Summary:');
    const topicCount = db.prepare('SELECT COUNT(*) as count FROM topic WHERE language = ?').get('fr');
    console.log(`Total topics created: ${topicCount.count}`);

    // Show topics with curriculum links
    const linkedTopics = db.prepare(`
      SELECT COUNT(*) as count
      FROM topic
      WHERE language = 'fr' AND curriculumId IS NOT NULL
    `).get();
    console.log(`Topics with curriculum links: ${linkedTopics.count}`);

    // Show breakdown by year level
    console.log('\nTopics by year level:');
    const breakdown = db.prepare(`
      SELECT
        t2.name as year_level,
        COUNT(t3.id) as topic_count
      FROM topic t1
      JOIN topic t2 ON t2.parentId = t1.id
      LEFT JOIN topic t3 ON t3.parentId = t2.id OR t3.parentId IN (
        SELECT id FROM topic WHERE parentId = t2.id
      )
      WHERE t1.name = 'French Language F-10'
        AND t2.language = 'fr'
      GROUP BY t2.id, t2.name
      ORDER BY t2.name
    `).all();

    for (const row of breakdown) {
      console.log(`  ${row.year_level}: ${row.topic_count} topics`);
    }

    console.log('\n✅ Topic population completed successfully!');

    return topicCount.count;

  } catch (error) {
    console.error('\n❌ Topic population failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateTopics().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default populateTopics;
