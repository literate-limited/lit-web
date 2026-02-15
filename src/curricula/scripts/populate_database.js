import addLanguageFields from './add_language_fields.js';
import populateTopics from './populate_topics.js';
import generateAllQuestions from './generate_questions.js';
import validateQuestions from './validate_questions.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');
const BACKUP_PATH = join(__dirname, '../languages_curriculum.db.backup');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function populateDatabase() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  French Language Curriculum - Question Generation Pipeline ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.error('\nPlease set your OpenAI API key:');
    console.error('  export OPENAI_API_KEY="sk-..."');
    process.exit(1);
  }

  try {
    // Step 0: Backup database
    console.log('💾 Step 0: Creating database backup...');
    try {
      copyFileSync(DB_PATH, BACKUP_PATH);
      console.log(`✅ Backup created: ${BACKUP_PATH}\n`);
    } catch (err) {
      console.error(`⚠️  Could not create backup: ${err.message}\n`);
    }

    // Step 1: Schema migration
    console.log('═'.repeat(60));
    console.log('📝 Step 1: Schema Migration - Adding Language Fields');
    console.log('═'.repeat(60));
    await addLanguageFields();
    await sleep(1000);

    // Step 2: Populate topics
    console.log('\n' + '═'.repeat(60));
    console.log('📚 Step 2: Topic Extraction and Population');
    console.log('═'.repeat(60));
    const topicCount = await populateTopics();
    await sleep(1000);

    // Step 3: Generate questions
    console.log('\n' + '═'.repeat(60));
    console.log('🤖 Step 3: AI Question Generation');
    console.log('═'.repeat(60));
    console.log('⚠️  This step may take 60+ minutes due to API rate limiting');
    console.log('   Each topic requires ~1 second + API response time\n');

    await generateAllQuestions();

    // Step 4: Validate
    console.log('\n' + '═'.repeat(60));
    console.log('🔍 Step 4: Validation and Quality Assurance');
    console.log('═'.repeat(60));
    const isValid = await validateQuestions();

    // Final summary
    const endTime = Date.now();
    const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(1);

    console.log('\n\n' + '═'.repeat(60));
    console.log('✨ PIPELINE COMPLETE');
    console.log('═'.repeat(60));
    console.log(`⏱️  Total execution time: ${durationMinutes} minutes`);
    console.log(`📊 Topics created: ${topicCount}`);

    if (isValid) {
      console.log('✅ All validation checks passed!');
      console.log('\n🎉 Database successfully populated with French language questions!');
      console.log('\n📍 Database location:');
      console.log(`   ${DB_PATH}`);
    } else {
      console.log('⚠️  Some validation issues found (see above)');
      console.log('\n💡 You can restore from backup if needed:');
      console.log(`   cp ${BACKUP_PATH} ${DB_PATH}`);
    }

    console.log('\n💰 Estimated cost: ~$1-2 for OpenAI API calls');

  } catch (error) {
    console.error('\n\n❌ PIPELINE FAILED');
    console.error('═'.repeat(60));
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);

    console.error('\n💡 To restore from backup:');
    console.error(`   cp ${BACKUP_PATH} ${DB_PATH}`);

    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateDatabase().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default populateDatabase;
