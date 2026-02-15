import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

async function validateQuestions() {
  console.log('📦 Opening database:', DB_PATH);
  const db = new Database(DB_PATH);

  try {
    console.log('\n🔍 Running validation checks...\n');

    let totalIssues = 0;

    // 1. Schema validation
    console.log('1️⃣ Schema Validation');

    const nullPrompts = db.prepare(`
      SELECT COUNT(*) as count
      FROM question
      WHERE language = 'fr' AND (prompt IS NULL OR prompt = '')
    `).get();

    if (nullPrompts.count > 0) {
      console.log(`  ❌ ${nullPrompts.count} questions with null/empty prompt`);
      totalIssues += nullPrompts.count;
    } else {
      console.log('  ✅ All questions have prompts');
    }

    const invalidTypes = db.prepare(`
      SELECT COUNT(*) as count
      FROM question
      WHERE language = 'fr' AND type NOT IN ('mcq', 'fill')
    `).get();

    if (invalidTypes.count > 0) {
      console.log(`  ❌ ${invalidTypes.count} questions with invalid type`);
      totalIssues += invalidTypes.count;
    } else {
      console.log('  ✅ All questions have valid types');
    }

    const nullAnswers = db.prepare(`
      SELECT COUNT(*) as count
      FROM question
      WHERE language = 'fr' AND (correctAnswer IS NULL OR correctAnswer = '')
    `).get();

    if (nullAnswers.count > 0) {
      console.log(`  ❌ ${nullAnswers.count} questions with null/empty correctAnswer`);
      totalIssues += nullAnswers.count;
    } else {
      console.log('  ✅ All questions have correct answers');
    }

    // Check MCQ options in metadata
    const mcqWithoutOptions = db.prepare(`
      SELECT id, prompt
      FROM question
      WHERE language = 'fr'
        AND type = 'mcq'
        AND (
          metadata IS NULL
          OR JSON_EXTRACT(metadata, '$.options') IS NULL
          OR JSON_TYPE(JSON_EXTRACT(metadata, '$.options')) != 'array'
          OR JSON_ARRAY_LENGTH(JSON_EXTRACT(metadata, '$.options')) != 4
        )
      LIMIT 5
    `).all();

    if (mcqWithoutOptions.length > 0) {
      console.log(`  ❌ ${mcqWithoutOptions.length}+ MCQ questions without 4 options in metadata`);
      mcqWithoutOptions.forEach(q => {
        console.log(`     - ${q.prompt.substring(0, 60)}...`);
      });
      totalIssues += mcqWithoutOptions.length;
    } else {
      console.log('  ✅ All MCQ questions have 4 options');
    }

    // 2. Content validation
    console.log('\n2️⃣ Content Validation');

    const duplicates = db.prepare(`
      SELECT prompt, COUNT(*) as count
      FROM question
      WHERE language = 'fr'
      GROUP BY prompt
      HAVING count > 1
      LIMIT 5
    `).all();

    if (duplicates.length > 0) {
      console.log(`  ❌ ${duplicates.length}+ duplicate prompts found:`);
      duplicates.forEach(d => {
        console.log(`     - "${d.prompt.substring(0, 60)}..." (${d.count} times)`);
      });
      totalIssues += duplicates.length;
    } else {
      console.log('  ✅ No duplicate prompts');
    }

    const invalidTopics = db.prepare(`
      SELECT COUNT(*) as count
      FROM question q
      WHERE q.language = 'fr'
        AND q.topicId IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM topic t WHERE t.id = q.topicId)
    `).get();

    if (invalidTopics.count > 0) {
      console.log(`  ❌ ${invalidTopics.count} questions with invalid topicId`);
      totalIssues += invalidTopics.count;
    } else {
      console.log('  ✅ All topic assignments are valid');
    }

    const invalidCurriculum = db.prepare(`
      SELECT COUNT(*) as count
      FROM question q
      WHERE q.language = 'fr'
        AND q.curriculumId IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM curriculum_statements cs WHERE cs.id = q.curriculumId)
    `).get();

    if (invalidCurriculum.count > 0) {
      console.log(`  ❌ ${invalidCurriculum.count} questions with invalid curriculumId`);
      totalIssues += invalidCurriculum.count;
    } else {
      console.log('  ✅ All curriculum alignments are valid');
    }

    // 3. Distribution validation
    console.log('\n3️⃣ Distribution Validation');

    const questionsByTopic = db.prepare(`
      SELECT
        t.name,
        COUNT(q.id) as question_count
      FROM topic t
      LEFT JOIN question q ON q.topicId = t.id AND q.language = 'fr'
      WHERE t.language = 'fr' AND t.curriculumId IS NOT NULL
      GROUP BY t.id, t.name
      ORDER BY question_count ASC
    `).all();

    const lowQuestionTopics = questionsByTopic.filter(t => t.question_count < 15);

    if (lowQuestionTopics.length > 0) {
      console.log(`  ⚠️  ${lowQuestionTopics.length} topics with fewer than 15 questions:`);
      lowQuestionTopics.slice(0, 5).forEach(t => {
        console.log(`     - ${t.name}: ${t.question_count} questions`);
      });
      if (lowQuestionTopics.length > 5) {
        console.log(`     ... and ${lowQuestionTopics.length - 5} more`);
      }
    } else {
      console.log('  ✅ All topics have at least 15 questions');
    }

    const typeDistribution = db.prepare(`
      SELECT
        type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM question WHERE language = 'fr'), 1) as percentage
      FROM question
      WHERE language = 'fr'
      GROUP BY type
    `).all();

    console.log('\n  Question type distribution:');
    typeDistribution.forEach(t => {
      console.log(`     ${t.type}: ${t.count} (${t.percentage}%)`);
    });

    const mcqPct = typeDistribution.find(t => t.type === 'mcq')?.percentage || 0;
    if (mcqPct < 50 || mcqPct > 70) {
      console.log(`  ⚠️  MCQ ratio is ${mcqPct}% (expected 60% ±10%)`);
    } else {
      console.log('  ✅ MCQ:fill ratio is within expected range (60% ±10%)');
    }

    // Difficulty distribution
    const difficultyDistribution = db.prepare(`
      SELECT
        JSON_EXTRACT(metadata, '$.difficulty') as difficulty,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM question WHERE language = 'fr'), 1) as percentage
      FROM question
      WHERE language = 'fr' AND metadata IS NOT NULL
      GROUP BY difficulty
    `).all();

    console.log('\n  Difficulty distribution:');
    difficultyDistribution.forEach(d => {
      console.log(`     ${d.difficulty || 'unknown'}: ${d.count} (${d.percentage}%)`);
    });

    // 4. Sample questions
    console.log('\n4️⃣ Sample Questions');

    const samples = db.prepare(`
      SELECT
        q.prompt,
        q.type,
        q.correctAnswer,
        t.name as topic_name,
        JSON_EXTRACT(q.metadata, '$.difficulty') as difficulty
      FROM question q
      LEFT JOIN topic t ON t.id = q.topicId
      WHERE q.language = 'fr'
      ORDER BY RANDOM()
      LIMIT 3
    `).all();

    samples.forEach((s, i) => {
      console.log(`\n  Sample ${i + 1}:`);
      console.log(`    Topic: ${s.topic_name}`);
      console.log(`    Type: ${s.type} | Difficulty: ${s.difficulty}`);
      console.log(`    Q: ${s.prompt.substring(0, 80)}${s.prompt.length > 80 ? '...' : ''}`);
      console.log(`    A: ${s.correctAnswer.substring(0, 80)}${s.correctAnswer.length > 80 ? '...' : ''}`);
    });

    // Final summary
    console.log('\n\n📊 Validation Summary');
    console.log('═'.repeat(50));

    const totalQuestions = db.prepare('SELECT COUNT(*) as count FROM question WHERE language = ?').get('fr');
    const totalTopics = db.prepare('SELECT COUNT(*) as count FROM topic WHERE language = ? AND curriculumId IS NOT NULL').get('fr');

    console.log(`Total French questions: ${totalQuestions.count}`);
    console.log(`Total French topics: ${totalTopics.count}`);

    if (totalTopics.count > 0) {
      console.log(`Average questions per topic: ${(totalQuestions.count / totalTopics.count).toFixed(1)}`);
    }

    console.log(`\nTotal issues found: ${totalIssues}`);

    if (totalIssues === 0) {
      console.log('\n✅ All validation checks passed!');
    } else {
      console.log('\n⚠️  Some validation issues found. Review above for details.');
    }

    return totalIssues === 0;

  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateQuestions().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default validateQuestions;
