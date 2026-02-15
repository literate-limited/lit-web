import Database from 'better-sqlite3';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract year level for difficulty distribution
 */
function getYearLevelFromTopic(topicName, parentPath) {
  const fullPath = parentPath.join(' > ') + ' > ' + topicName;

  if (fullPath.includes('Foundation to Year 2')) return 'F-2';
  if (fullPath.includes('Years 3-4')) return '3-4';
  if (fullPath.includes('Years 5-6')) return '5-6';
  if (fullPath.includes('Years 7-8')) return '7-8';
  if (fullPath.includes('Years 9-10')) return '9-10';
  if (fullPath.includes('Years 11-12')) return '11-12';

  return null;
}

/**
 * Get difficulty distribution based on year level
 */
function getDifficultyDistribution(yearLevel) {
  const distributions = {
    'F-2': { easy: 0.90, medium: 0.10, hard: 0.00 },
    '3-4': { easy: 0.70, medium: 0.30, hard: 0.00 },
    '5-6': { easy: 0.50, medium: 0.40, hard: 0.10 },
    '7-8': { easy: 0.30, medium: 0.60, hard: 0.10 },
    '9-10': { easy: 0.20, medium: 0.50, hard: 0.30 },
    '11-12': { easy: 0.10, medium: 0.40, hard: 0.50 }
  };

  return distributions[yearLevel] || distributions['7-8'];
}

/**
 * Get parent path for a topic
 */
function getTopicParentPath(db, topicId) {
  const path = [];
  let currentId = topicId;

  while (currentId) {
    const topic = db.prepare('SELECT name, parentId FROM topic WHERE id = ?').get(currentId);
    if (!topic) break;

    if (topic.name !== 'French Language F-10') {
      path.unshift(topic.name);
    }
    currentId = topic.parentId;
  }

  return path;
}

/**
 * Generate questions using OpenAI
 */
async function generateQuestionsWithAI(topicData, yearLevel, retries = 3) {
  const distribution = getDifficultyDistribution(yearLevel);

  // Calculate question counts
  const totalQuestions = 25;
  const mcqCount = Math.round(totalQuestions * 0.6); // 60% MCQ
  const fillCount = totalQuestions - mcqCount; // 40% fill

  const easyCount = Math.round(totalQuestions * distribution.easy);
  const hardCount = Math.round(totalQuestions * distribution.hard);
  const mediumCount = totalQuestions - easyCount - hardCount;

  const prompt = `You are a French language teacher creating assessment questions based on the Australian Curriculum (ACARA).

Generate ${totalQuestions} questions for this curriculum objective:

Year Level: ${yearLevel}
Topic: ${topicData.topicName}
Content Description: ${topicData.description}

Elaboration examples:
${topicData.elaborations.map((e, i) => `${i + 1}. ${e.description}`).join('\n')}

Requirements:
- ${mcqCount} MCQ questions (4 options each, labeled A, B, C, D)
- ${fillCount} fill-in-the-blank questions
- Difficulty: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard
- Include actual French phrases from the elaborations where possible
- Test comprehension, vocabulary, grammar, and cultural context
- Make questions age-appropriate for ${yearLevel}
- For MCQ, ensure only one answer is clearly correct
- For fill-in-the-blank, provide the exact expected answer

Output format: JSON array with this exact structure:
[{
  "prompt": "Question text here (use French where appropriate)",
  "type": "mcq",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
  "correctAnswer": "B) Second option",
  "difficulty": "medium",
  "skillsTested": ["vocabulary", "grammar"],
  "vocabularyFocus": ["word1", "word2"]
}]

IMPORTANT:
- Return ONLY valid JSON, no other text
- For MCQ type, include the letter prefix in both options and correctAnswer (e.g., "A) ...")
- For fill type, correctAnswer should be the exact text expected
- Ensure correctAnswer exactly matches one of the options for MCQ
`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`    Calling OpenAI API (attempt ${attempt}/${retries})...`);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a French language curriculum expert. You always respond with valid JSON only, no explanatory text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      const responseText = completion.choices[0].message.content.trim();

      // Try to extract JSON if wrapped in markdown
      let jsonText = responseText;
      if (responseText.includes('```json')) {
        jsonText = responseText.split('```json')[1].split('```')[0].trim();
      } else if (responseText.includes('```')) {
        jsonText = responseText.split('```')[1].split('```')[0].trim();
      }

      const questions = JSON.parse(jsonText);

      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Validate questions
      const validQuestions = [];
      for (const q of questions) {
        if (!q.prompt || !q.type || !q.correctAnswer || !q.difficulty) {
          console.log(`    ⚠️  Skipping invalid question: ${JSON.stringify(q).substring(0, 100)}`);
          continue;
        }

        if (q.type === 'mcq' && (!q.options || q.options.length !== 4)) {
          console.log(`    ⚠️  Skipping MCQ without 4 options: ${q.prompt.substring(0, 50)}`);
          continue;
        }

        if (q.type === 'mcq') {
          // Ensure correctAnswer matches one of the options
          const matchingOption = q.options.find(opt => opt === q.correctAnswer);
          if (!matchingOption) {
            console.log(`    ⚠️  Fixing MCQ with mismatched answer: ${q.prompt.substring(0, 50)}`);
            // Try to find by letter
            const letter = q.correctAnswer.charAt(0);
            q.correctAnswer = q.options.find(opt => opt.startsWith(letter)) || q.options[0];
          }
        }

        validQuestions.push(q);
      }

      if (validQuestions.length < 15) {
        throw new Error(`Only got ${validQuestions.length} valid questions, expected at least 15`);
      }

      console.log(`    ✅ Generated ${validQuestions.length} questions`);
      return validQuestions;

    } catch (error) {
      console.error(`    ❌ Attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        console.error(`    ❌ All ${retries} attempts failed for topic`);
        return [];
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return [];
}

/**
 * Generate questions for all topics
 */
async function generateAllQuestions() {
  console.log('📦 Opening database:', DB_PATH);
  const db = new Database(DB_PATH);

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  try {
    console.log('\n🤖 Generating questions for French topics...\n');

    // Get all French topics with curriculum links
    const topics = db.prepare(`
      SELECT id, name, curriculumId, parentId
      FROM topic
      WHERE language = 'fr'
        AND curriculumId IS NOT NULL
      ORDER BY name
    `).all();

    console.log(`Found ${topics.length} topics to generate questions for\n`);

    let totalQuestionsGenerated = 0;
    let successfulTopics = 0;
    let failedTopics = 0;

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      console.log(`\n[${i + 1}/${topics.length}] Processing: ${topic.name}`);

      // Get parent path to determine year level
      const parentPath = getTopicParentPath(db, topic.parentId);
      const yearLevel = getYearLevelFromTopic(topic.name, parentPath);

      console.log(`  Year Level: ${yearLevel}`);
      console.log(`  Path: ${parentPath.join(' > ')}`);

      // Get curriculum content and elaborations
      const content = db.prepare(`
        SELECT description
        FROM curriculum_statements
        WHERE id = ?
      `).get(topic.curriculumId);

      const elaborations = db.prepare(`
        SELECT cs.description
        FROM curriculum_statements cs
        JOIN statement_relationships sr ON cs.id = sr.source_id
        WHERE sr.target_id = ?
          AND sr.relation_type = 'isChildOf'
          AND cs.notation LIKE '%_E%'
      `).all(topic.curriculumId);

      if (!content) {
        console.log(`  ⚠️  No content description found, skipping`);
        failedTopics++;
        continue;
      }

      const topicData = {
        topicName: topic.name,
        description: content.description,
        elaborations: elaborations
      };

      // Generate questions
      const questions = await generateQuestionsWithAI(topicData, yearLevel);

      if (questions.length === 0) {
        console.log(`  ❌ Failed to generate questions`);
        failedTopics++;
        continue;
      }

      // Insert questions into database
      const insertStmt = db.prepare(`
        INSERT INTO question (id, prompt, type, correctAnswer, topicId, curriculumId, language, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertTransaction = db.transaction(() => {
        for (const q of questions) {
          const metadata = {
            difficulty: q.difficulty,
            skillsTested: q.skillsTested || [],
            vocabularyFocus: q.vocabularyFocus || [],
            yearLevel: yearLevel,
            competencyArea: parentPath[1] || 'Unknown',
            options: q.type === 'mcq' ? q.options : undefined
          };

          insertStmt.run(
            uuidv4(),
            q.prompt,
            q.type,
            q.correctAnswer,
            topic.id,
            topic.curriculumId,
            'fr',
            JSON.stringify(metadata)
          );
        }
      });

      insertTransaction();

      totalQuestionsGenerated += questions.length;
      successfulTopics++;
      console.log(`  ✅ Inserted ${questions.length} questions`);

      // Rate limiting: wait 1 second between API calls
      if (i < topics.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final statistics
    console.log('\n📊 Generation Summary:');
    console.log(`  Topics processed: ${topics.length}`);
    console.log(`  Successful: ${successfulTopics}`);
    console.log(`  Failed: ${failedTopics}`);
    console.log(`  Total questions generated: ${totalQuestionsGenerated}`);

    if (successfulTopics > 0) {
      console.log(`  Average questions per topic: ${(totalQuestionsGenerated / successfulTopics).toFixed(1)}`);
    }

    // Verify database
    const dbStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type = 'mcq' THEN 1 ELSE 0 END) as mcq_count,
        SUM(CASE WHEN type = 'fill' THEN 1 ELSE 0 END) as fill_count
      FROM question
      WHERE language = 'fr'
    `).get();

    console.log('\n📊 Database Statistics:');
    console.log(`  Total questions in DB: ${dbStats.total}`);
    console.log(`  MCQ: ${dbStats.mcq_count} (${(dbStats.mcq_count / dbStats.total * 100).toFixed(1)}%)`);
    console.log(`  Fill: ${dbStats.fill_count} (${(dbStats.fill_count / dbStats.total * 100).toFixed(1)}%)`);

    console.log('\n✅ Question generation completed!');

  } catch (error) {
    console.error('\n❌ Question generation failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllQuestions().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default generateAllQuestions;
