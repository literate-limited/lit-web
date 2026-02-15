import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../languages_curriculum.db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateReplacementQuestions(topic, yearLevel, language, existingPrompts) {
  const existingText = existingPrompts.slice(0, 5).map(p => `- ${p}`).join('\n');
  const langName = language === 'es' ? 'Spanish' : 'French';

  const prompt = `You are a ${yearLevel} ${langName} language teacher. Generate 3 new, unique ${langName} language learning questions for the "${topic.name}" topic that are different from these existing ones:

Existing questions (avoid these):
${existingText}

Requirements:
- Create 3 completely different questions
- Mix question types (some MCQ with 4 options, some fill-in-the-blank)
- Appropriate difficulty for year level ${yearLevel}
- Valid ${langName} language content

Return ONLY valid JSON array with this exact structure:
[{"prompt":"question text","type":"mcq" or "fill","options":["A","B","C","D"],"correctAnswer":"B","difficulty":"easy/medium/hard"}]

For fill-type, omit options and correctAnswer should be the answer text.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        temperature: 0.8,
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `You are a ${langName} curriculum assessment expert. Generate high-quality language learning questions.`
          },
          { role: 'user', content: prompt }
        ]
      });

      let content = response.choices[0].message.content.trim();

      // Strip markdown formatting if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      let questions = JSON.parse(content);

      if (!Array.isArray(questions)) {
        questions = [questions];
      }

      return questions.filter(q => q && q.prompt).slice(0, 3);
    } catch (error) {
      if (attempt < 3) {
        console.log(`    ❌ Attempt ${attempt} failed: ${error.message}`);
        await sleep(2000);
      } else {
        throw error;
      }
    }
  }
}

async function deduplicateLanguage(db, language) {
  const langDisplay = language === 'es' ? '🇪🇸 SPANISH' : '🇫🇷 FRENCH';
  console.log(`\n${langDisplay}\n${'═'.repeat(50)}\n`);

  // Find duplicates
  const duplicates = db.prepare(`
    SELECT prompt, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM question
    WHERE language = ?
    GROUP BY prompt
    HAVING count > 1
    ORDER BY count DESC
  `).all(language);

  console.log(`Found ${duplicates.length} duplicate prompts\n`);

  let langRemoved = 0;
  let langRegenerated = 0;

  for (const dup of duplicates) {
    const count = dup.count;
    const ids = dup.ids.split(',');

    // Keep first, remove rest
    const keepId = ids[0];
    const removeIds = ids.slice(1);

    console.log(`Duplicate: "${dup.prompt.substring(0, 60)}..."`);
    console.log(`  Instances: ${count} | Keeping 1, removing ${removeIds.length}`);

    // Get the question to keep (to find its topic)
    const keepQuestion = db.prepare('SELECT topicId, curriculumId FROM question WHERE id = ?').get(keepId);
    const topicId = keepQuestion.topicId;

    // Get topic name
    const topic = db.prepare('SELECT name FROM topic WHERE id = ?').get(topicId);

    // Get year level from topic hierarchy
    const topicInfo = db.prepare(`
      SELECT t.name FROM topic t WHERE t.id = (
        SELECT DISTINCT t2.id FROM topic t1
        JOIN topic t2 ON t2.id = t1.parentId
        WHERE t1.id = ?
      )
    `).get(topicId);
    const yearLevel = topicInfo?.name || 'F-10';

    // Get all existing prompts for this topic (to avoid generating duplicates)
    const existingPrompts = db.prepare(`
      SELECT DISTINCT prompt FROM question WHERE topicId = ? AND id != ?
      LIMIT 10
    `).all(topicId, keepId).map(r => r.prompt);

    // Remove duplicates
    for (const removeId of removeIds) {
      db.prepare('DELETE FROM question WHERE id = ?').run(removeId);
      langRemoved++;
    }

    // Generate replacement questions
    try {
      console.log(`  🤖 Generating ${removeIds.length} replacement question(s)...`);
      const newQuestions = await generateReplacementQuestions(topic, yearLevel, language, existingPrompts);

      const insertStmt = db.prepare(`
        INSERT INTO question (id, prompt, type, correctAnswer, topicId, curriculumId, language, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const q of newQuestions) {
        insertStmt.run(
          uuidv4(),
          q.prompt,
          q.type,
          q.correctAnswer || q.answer || '',
          topicId,
          keepQuestion.curriculumId || null,
          language,
          JSON.stringify({
            type: q.type,
            difficulty: q.difficulty || 'medium',
            skillsTested: ['vocabulary', 'grammar'],
            vocabularyFocus: [],
            grammarPatterns: []
          })
        );
        langRegenerated++;
      }

      console.log(`  ✅ Generated and inserted ${newQuestions.length} replacement question(s)`);
    } catch (error) {
      console.log(`  ⚠️  Failed to regenerate: ${error.message}`);
    }

    // Rate limiting
    await sleep(1500);
  }

  return { removed: langRemoved, regenerated: langRegenerated };
}

async function deduplicateQuestions() {
  console.log('📦 Opening database:', DB_PATH);
  const db = new Database(DB_PATH);

  try {
    console.log('\n🔍 Finding duplicate questions across all languages...');

    // Check all languages with questions
    const languages = db.prepare(`
      SELECT DISTINCT language FROM question ORDER BY language
    `).all().map(r => r.language);

    let totalRemoved = 0;
    let totalRegenerated = 0;

    for (const lang of languages) {
      const result = await deduplicateLanguage(db, lang);
      totalRemoved += result.removed;
      totalRegenerated += result.regenerated;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Deduplication Summary:');
    console.log(`  Total duplicates removed: ${totalRemoved}`);
    console.log(`  Total replacements generated: ${totalRegenerated}`);

    const finalCount = db.prepare('SELECT COUNT(*) as count FROM question').get();
    console.log(`  Total questions after dedup: ${finalCount.count}`);

    // Verify no more duplicates across all languages
    const stillDuped = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT language, prompt FROM question
        GROUP BY language, prompt HAVING COUNT(*) > 1
      )
    `).get();

    if (stillDuped.count === 0) {
      console.log('\n✅ All duplicates removed!');
    } else {
      console.log(`\n⚠️  ${stillDuped.count} duplicate prompt(s) still exist`);
    }

  } catch (error) {
    console.error('\n❌ Deduplication failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    db.close();
  }
}

// Run
deduplicateQuestions().catch(err => {
  console.error(err);
  process.exit(1);
});
