import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

function showStats() {
  console.log('📊 Database Statistics\n');
  console.log('═'.repeat(60));

  const db = new Database(DB_PATH, { readonly: true });

  try {
    // Curriculum statements by language
    console.log('\n📚 Curriculum Statements by Language:');
    const curriculumStats = db.prepare(`
      SELECT
        COALESCE(language, 'NULL') as language,
        COUNT(*) as count
      FROM curriculum_statements
      GROUP BY language
      ORDER BY count DESC
    `).all();

    curriculumStats.forEach(stat => {
      console.log(`  ${stat.language}: ${stat.count}`);
    });

    // Topics by language
    console.log('\n🏷️  Topics by Language:');
    const topicStats = db.prepare(`
      SELECT
        COALESCE(language, 'NULL') as language,
        COUNT(*) as total,
        SUM(CASE WHEN curriculumId IS NOT NULL THEN 1 ELSE 0 END) as with_curriculum
      FROM topic
      GROUP BY language
      ORDER BY total DESC
    `).all();

    topicStats.forEach(stat => {
      console.log(`  ${stat.language}: ${stat.total} topics (${stat.with_curriculum} with curriculum links)`);
    });

    // Questions by language
    console.log('\n❓ Questions by Language:');
    const questionStats = db.prepare(`
      SELECT
        COALESCE(language, 'NULL') as language,
        COUNT(*) as total,
        SUM(CASE WHEN type = 'mcq' THEN 1 ELSE 0 END) as mcq,
        SUM(CASE WHEN type = 'fill' THEN 1 ELSE 0 END) as fill
      FROM question
      GROUP BY language
      ORDER BY total DESC
    `).all();

    if (questionStats.length > 0) {
      questionStats.forEach(stat => {
        const mcqPct = stat.total > 0 ? ((stat.mcq / stat.total) * 100).toFixed(1) : 0;
        const fillPct = stat.total > 0 ? ((stat.fill / stat.total) * 100).toFixed(1) : 0;
        console.log(`  ${stat.language}: ${stat.total} questions (MCQ: ${stat.mcq} [${mcqPct}%], Fill: ${stat.fill} [${fillPct}%])`);
      });
    } else {
      console.log('  No questions found.');
    }

    // French-specific details
    const frenchTopics = db.prepare(`
      SELECT COUNT(*) as count
      FROM topic
      WHERE language = 'fr' AND curriculumId IS NOT NULL
    `).get();

    if (frenchTopics.count > 0) {
      console.log('\n🇫🇷 French Language Details:');
      console.log(`  Topics with curriculum links: ${frenchTopics.count}`);

      const frenchQuestions = db.prepare(`
        SELECT COUNT(*) as count FROM question WHERE language = 'fr'
      `).get();

      console.log(`  Total questions: ${frenchQuestions.count}`);

      if (frenchQuestions.count > 0 && frenchTopics.count > 0) {
        const avg = (frenchQuestions.count / frenchTopics.count).toFixed(1);
        console.log(`  Average questions per topic: ${avg}`);
      }

      // Questions by year level
      const yearLevelStats = db.prepare(`
        SELECT
          JSON_EXTRACT(q.metadata, '$.yearLevel') as year_level,
          COUNT(*) as count
        FROM question q
        WHERE q.language = 'fr' AND q.metadata IS NOT NULL
        GROUP BY year_level
        ORDER BY
          CASE year_level
            WHEN 'F-2' THEN 1
            WHEN '3-4' THEN 2
            WHEN '5-6' THEN 3
            WHEN '7-8' THEN 4
            WHEN '9-10' THEN 5
            WHEN '11-12' THEN 6
            ELSE 7
          END
      `).all();

      if (yearLevelStats.length > 0) {
        console.log('\n  Questions by year level:');
        yearLevelStats.forEach(stat => {
          console.log(`    ${stat.year_level}: ${stat.count}`);
        });
      }

      // Difficulty distribution
      const difficultyStats = db.prepare(`
        SELECT
          JSON_EXTRACT(metadata, '$.difficulty') as difficulty,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM question WHERE language = 'fr'), 1) as percentage
        FROM question
        WHERE language = 'fr' AND metadata IS NOT NULL
        GROUP BY difficulty
        ORDER BY
          CASE difficulty
            WHEN 'easy' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'hard' THEN 3
            ELSE 4
          END
      `).all();

      if (difficultyStats.length > 0) {
        console.log('\n  Difficulty distribution:');
        difficultyStats.forEach(stat => {
          console.log(`    ${stat.difficulty || 'unknown'}: ${stat.count} (${stat.percentage}%)`);
        });
      }

      // Topics with fewest questions
      const lowTopics = db.prepare(`
        SELECT
          t.name,
          COUNT(q.id) as question_count
        FROM topic t
        LEFT JOIN question q ON q.topicId = t.id AND q.language = 'fr'
        WHERE t.language = 'fr' AND t.curriculumId IS NOT NULL
        GROUP BY t.id, t.name
        ORDER BY question_count ASC
        LIMIT 5
      `).all();

      if (lowTopics.length > 0) {
        console.log('\n  Topics with fewest questions:');
        lowTopics.forEach(t => {
          console.log(`    ${t.name}: ${t.question_count}`);
        });
      }
    }

    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

showStats();
