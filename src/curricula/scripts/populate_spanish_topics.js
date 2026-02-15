import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

/**
 * Extract year level from Spanish notation
 * AC9LSF2 → 'F-2'
 * AC9LS34 → '3-4'
 * AC9LS56 → '5-6'
 * AC9LS78 → '7-8'
 * AC9LS910 → '9-10'
 */
function extractYearLevel(notation) {
  if (notation.includes('F2') || notation.includes('F-2')) return 'F-2';
  if (notation.includes('34') || notation.includes('3-4')) return '3-4';
  if (notation.includes('56') || notation.includes('5-6')) return '5-6';
  if (notation.includes('78')) return '7-8';
  if (notation.includes('910')) return '9-10';
  return null;
}

/**
 * Generate topic name from notation
 * Spanish F-10 curriculum statements are broad year-level descriptions
 */
function getTopicNameFromNotation(notation, yearLevel) {
  // Create descriptive names for each year level
  const names = {
    'F-2': 'Foundation to Year 2 Spanish Language',
    '3-4': 'Years 3 and 4 Spanish Language',
    '5-6': 'Years 5 and 6 Spanish Language',
    '7-8': 'Years 7 and 8 Spanish Language',
    '9-10': 'Years 9 and 10 Spanish Language'
  };
  return names[yearLevel] || `Spanish Language ${yearLevel}`;
}

async function populateSpanishTopics() {
  console.log('📦 Opening database:', DB_PATH);
  const db = new Database(DB_PATH);

  try {
    console.log('\n🔧 Building Spanish topic hierarchy...\n');

    // Clear existing Spanish topics
    console.log('Clearing existing Spanish topics...');
    db.prepare('DELETE FROM question WHERE language = ?').run('es');
    db.prepare('DELETE FROM topic WHERE language = ?').run('es');

    // Create root topic
    const rootId = uuidv4();
    db.prepare(`
      INSERT INTO topic (id, name, curriculumId, parentId, language)
      VALUES (?, ?, ?, ?, ?)
    `).run(rootId, 'Spanish Language F-10', null, null, 'es');
    console.log('✅ Created root: Spanish Language F-10');

    // Get Spanish curriculum statements
    const contentDescriptions = db.prepare(`
      SELECT id, notation, label, description
      FROM curriculum_statements
      WHERE language = 'es'
        AND label = 'Content Description'
      ORDER BY notation
    `).all();

    console.log(`\nFound ${contentDescriptions.length} content descriptions\n`);

    // Group by year level
    const yearLevelMap = new Map();
    const yearLevelOrder = ['F-2', '3-4', '5-6', '7-8', '9-10'];

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
      const yearLevelName = `Years ${yearLevel}`;

      db.prepare(`
        INSERT INTO topic (id, name, curriculumId, parentId, language)
        VALUES (?, ?, ?, ?, ?)
      `).run(yearLevelId, yearLevelName, null, rootId, 'es');

      console.log(`📚 ${yearLevelName}`);
      totalTopics++;

      // Create one topic per curriculum statement
      // Spanish F-10 statements are broad year-level descriptions, not broken into competencies
      for (const cd of cds) {
        const topicName = getTopicNameFromNotation(cd.notation, yearLevel);
        const topicId = uuidv4();

        db.prepare(`
          INSERT INTO topic (id, name, curriculumId, parentId, language)
          VALUES (?, ?, ?, ?, ?)
        `).run(topicId, topicName, cd.id, yearLevelId, 'es');

        console.log(`  └─ ${topicName} (${cd.notation})`);
        totalTopics++;
      }

      console.log('');
    }

    // Validation
    console.log('📊 Summary:');
    const topicCount = db.prepare('SELECT COUNT(*) as count FROM topic WHERE language = ?').get('es');
    console.log(`Total topics created: ${topicCount.count}`);

    const linkedTopics = db.prepare(`
      SELECT COUNT(*) as count
      FROM topic
      WHERE language = 'es' AND curriculumId IS NOT NULL
    `).get();
    console.log(`Topics with curriculum links: ${linkedTopics.count}`);

    // Show breakdown
    console.log('\nTopics by year level:');
    const breakdown = db.prepare(`
      SELECT
        t2.name as year_level,
        COUNT(t3.id) as topic_count
      FROM topic t1
      JOIN topic t2 ON t2.parentId = t1.id
      LEFT JOIN topic t3 ON t3.parentId = t2.id
      WHERE t1.name = 'Spanish Language F-10'
        AND t2.language = 'es'
      GROUP BY t2.id, t2.name
      ORDER BY t2.name
    `).all();

    for (const row of breakdown) {
      console.log(`  ${row.year_level}: ${row.topic_count} topics`);
    }

    console.log('\n✅ Spanish topic population completed successfully!');

    return topicCount.count;

  } catch (error) {
    console.error('\n❌ Topic population failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    db.close();
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  populateSpanishTopics().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default populateSpanishTopics;
