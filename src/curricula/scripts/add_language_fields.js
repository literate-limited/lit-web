import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

/**
 * Parse language code from notation
 * AC9LF* → 'fr' (French)
 * AC9LJ* → 'ja' (Japanese)
 * AC9LC* → 'zh' (Chinese)
 * AC9LI* → 'it' (Italian)
 * ASLAN* → 'auslan' (Australian Sign Language)
 */
function parseLanguageCode(notation) {
  if (!notation) return null;

  if (notation.startsWith('AC9LF')) return 'fr';
  if (notation.startsWith('AC9LJ')) return 'ja';
  if (notation.startsWith('AC9LC')) return 'zh';
  if (notation.startsWith('AC9LI')) return 'it';
  if (notation.startsWith('ASLAN')) return 'auslan';

  return null;
}

async function addLanguageFields() {
  console.log('📦 Opening database:', DB_PATH);
  const db = new Database(DB_PATH);

  try {
    console.log('\n🔧 Step 1: Adding language column to curriculum_statements...');

    // Check if column already exists
    const columns = db.prepare("PRAGMA table_info(curriculum_statements)").all();
    const hasLanguage = columns.some(col => col.name === 'language');

    if (!hasLanguage) {
      db.exec(`
        ALTER TABLE curriculum_statements
        ADD COLUMN language TEXT;
      `);
      console.log('✅ Added language column');
    } else {
      console.log('⚠️  Language column already exists, skipping...');
    }

    console.log('\n🔧 Step 2: Backfilling language data...');
    const updateStmt = db.prepare(`
      UPDATE curriculum_statements
      SET language = ?
      WHERE notation LIKE ?
    `);

    const languageMappings = [
      ['fr', 'AC9LF%'],
      ['ja', 'AC9LJ%'],
      ['zh', 'AC9LC%'],
      ['it', 'AC9LI%'],
      ['auslan', 'ASLAN%']
    ];

    const updateTransaction = db.transaction(() => {
      for (const [lang, pattern] of languageMappings) {
        const result = updateStmt.run(lang, pattern);
        console.log(`  - ${lang}: ${result.changes} records updated`);
      }
    });

    updateTransaction();

    console.log('\n🔧 Step 3: Creating index on curriculum_statements.language...');
    try {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_curriculum_language
        ON curriculum_statements(language);
      `);
      console.log('✅ Index created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⚠️  Index already exists, skipping...');
      } else {
        throw err;
      }
    }

    console.log('\n🔧 Step 4: Adding language column to question...');
    const questionColumns = db.prepare("PRAGMA table_info(question)").all();
    const questionHasLanguage = questionColumns.some(col => col.name === 'language');

    if (!questionHasLanguage) {
      db.exec(`
        ALTER TABLE question
        ADD COLUMN language TEXT NOT NULL DEFAULT 'fr';
      `);
      console.log('✅ Added language column to question table');
    } else {
      console.log('⚠️  Language column already exists in question table, skipping...');
    }

    console.log('\n🔧 Step 5: Creating index on question.language...');
    try {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_question_language
        ON question(language);
      `);
      console.log('✅ Index created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⚠️  Index already exists, skipping...');
      } else {
        throw err;
      }
    }

    console.log('\n🔧 Step 6: Adding language column to topic...');
    const topicColumns = db.prepare("PRAGMA table_info(topic)").all();
    const topicHasLanguage = topicColumns.some(col => col.name === 'language');

    if (!topicHasLanguage) {
      db.exec(`
        ALTER TABLE topic
        ADD COLUMN language TEXT;
      `);
      console.log('✅ Added language column to topic table');
    } else {
      console.log('⚠️  Language column already exists in topic table, skipping...');
    }

    console.log('\n🔧 Step 7: Creating index on topic.language...');
    try {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_topic_language
        ON topic(language);
      `);
      console.log('✅ Index created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⚠️  Index already exists, skipping...');
      } else {
        throw err;
      }
    }

    // Validation
    console.log('\n📊 Validation Report:');
    const stats = db.prepare(`
      SELECT
        language,
        COUNT(*) as count
      FROM curriculum_statements
      WHERE language IS NOT NULL
      GROUP BY language
      ORDER BY count DESC
    `).all();

    console.log('\nCurriculum statements by language:');
    let totalWithLanguage = 0;
    for (const stat of stats) {
      console.log(`  ${stat.language}: ${stat.count} records`);
      totalWithLanguage += stat.count;
    }

    const nullCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM curriculum_statements
      WHERE language IS NULL
    `).get();

    if (nullCount.count > 0) {
      console.log(`\n⚠️  Warning: ${nullCount.count} records without language`);
    } else {
      console.log(`\n✅ All ${totalWithLanguage} records have language assigned`);
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addLanguageFields().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default addLanguageFields;
