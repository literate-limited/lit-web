import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

/**
 * Spanish curriculum structure (Years 7-12 only)
 * Based on ACARA Spanish Language F-10 Curriculum
 */
const SPANISH_CURRICULUM = [
  // Years 7-8 Competency Framework
  { notation: 'AC9LS78C01', label: 'Content Description', description: 'Socialising - initiate and sustain interactions in familiar and some unfamiliar contexts' },
  { notation: 'AC9LS78C02', label: 'Content Description', description: 'Informing - exchange factual and personal information on topics of interest and social importance' },
  { notation: 'AC9LS78C03', label: 'Content Description', description: 'Creating - create simple texts to entertain, express feelings and viewpoints' },
  { notation: 'AC9LS78C04', label: 'Content Description', description: 'Translating - translate familiar texts from Spanish to English and vice versa' },
  { notation: 'AC9LS78C05', label: 'Content Description', description: 'Reflecting on language use and cultural differences' },
  { notation: 'AC9LS78U01', label: 'Content Description', description: 'Understanding: Systems of language and cultural communication patterns' },
  { notation: 'AC9LS78U02', label: 'Content Description', description: 'Understanding: Language variation and change' },
  { notation: 'AC9LS78U03', label: 'Content Description', description: 'Understanding: Role of language and culture' },

  // Years 9-10 Competency Framework
  { notation: 'AC9LS910C01', label: 'Content Description', description: 'Socialising - develop sociolinguistic awareness through a range of social, recreational and formal contexts' },
  { notation: 'AC9LS910C02', label: 'Content Description', description: 'Informing - understand, discuss and present information on issues of local and global interest' },
  { notation: 'AC9LS910C03', label: 'Content Description', description: 'Creating - create varied texts for different purposes and audiences' },
  { notation: 'AC9LS910C04', label: 'Content Description', description: 'Translating - translate a range of texts from Spanish to English and vice versa' },
  { notation: 'AC9LS910C05', label: 'Content Description', description: 'Reflecting on own language learning and cultural awareness' },
  { notation: 'AC9LS910U01', label: 'Content Description', description: 'Understanding: Systems of language in extended contexts' },
  { notation: 'AC9LS910U02', label: 'Content Description', description: 'Understanding: Language variation and change across Spanish-speaking communities' },
  { notation: 'AC9LS910U03', label: 'Content Description', description: 'Understanding: Role of language and culture in shaping identity' },

  // Years 11-12 Competency Framework (senior secondary)
  { notation: 'AC9LS1112C01', label: 'Content Description', description: 'Developing cultural and sociolinguistic competence through sustained, authentic interactions' },
  { notation: 'AC9LS1112C02', label: 'Content Description', description: 'Analysing and producing complex texts for academic and professional communication' },
  { notation: 'AC9LS1112C03', label: 'Content Description', description: 'Translating and interpreting complex texts with nuance and cultural understanding' },
  { notation: 'AC9LS1112C04', label: 'Content Description', description: 'Reflecting on language learning and intercultural development' },
  { notation: 'AC9LS1112U01', label: 'Content Description', description: 'Understanding: Systems of language in complex, varied contexts' },
  { notation: 'AC9LS1112U02', label: 'Content Description', description: 'Understanding: Language variation and change in Spanish-speaking world' },
  { notation: 'AC9LS1112U03', label: 'Content Description', description: 'Understanding: Language and culture in personal, professional and global contexts' }
];

/**
 * Add Spanish curriculum to database
 */
function addSpanishCurriculum() {
  console.log('🇪🇸 Adding Spanish Curriculum Statements\n');
  console.log('Note: Spanish is available for Years 7-12 only (not F-6)\n');

  const db = new Database(DB_PATH);

  try {
    console.log('Adding Spanish curriculum structure...');

    const insertStmt = db.prepare(`
      INSERT INTO curriculum_statements (id, notation, label, description, language)
      VALUES (?, ?, ?, ?, 'es')
      ON CONFLICT(notation) DO NOTHING
    `);

    const insertTransaction = db.transaction(() => {
      let count = 0;
      for (const stmt of SPANISH_CURRICULUM) {
        try {
          const result = insertStmt.run(
            uuidv4(),
            stmt.notation,
            stmt.label,
            stmt.description
          );
          if (result.changes > 0) {
            count++;
          }
        } catch (err) {
          console.error(`⚠️  Error inserting ${stmt.notation}: ${err.message}`);
        }
      }
      return count;
    });

    const inserted = insertTransaction();
    console.log(`✅ Inserted ${inserted} Spanish curriculum statements\n`);

    // Verify
    console.log('📊 Verification:');
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN notation LIKE 'AC9LS78%' THEN 1 END) as years_78,
        COUNT(CASE WHEN notation LIKE 'AC9LS910%' THEN 1 END) as years_910,
        COUNT(CASE WHEN notation LIKE 'AC9LS1112%' THEN 1 END) as years_1112
      FROM curriculum_statements
      WHERE language = 'es'
    `).get();

    console.log(`  Total Spanish statements: ${stats.total}`);
    console.log(`  Years 7-8: ${stats.years_78}`);
    console.log(`  Years 9-10: ${stats.years_910}`);
    console.log(`  Years 11-12: ${stats.years_1112}`);

    console.log('\n✅ Spanish curriculum structure ready for topic creation');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  addSpanishCurriculum();
}

export default addSpanishCurriculum;
