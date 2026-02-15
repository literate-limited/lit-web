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

async function testGeneration() {
  console.log('🧪 Testing question generation with one topic...\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.error('\nPlease set your OpenAI API key:');
    console.error('  export OPENAI_API_KEY="sk-..."');
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  try {
    // Get one French topic
    const topic = db.prepare(`
      SELECT id, name, curriculumId
      FROM topic
      WHERE language = 'fr'
        AND curriculumId IS NOT NULL
      LIMIT 1
    `).get();

    if (!topic) {
      console.error('❌ No French topics found. Run "npm run topics" first.');
      process.exit(1);
    }

    console.log(`Testing with topic: ${topic.name}\n`);

    // Get curriculum content
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

    console.log('Content Description:');
    console.log(`  ${content.description}\n`);
    console.log(`Elaborations: ${elaborations.length} found\n`);

    // Generate questions
    const prompt = `You are a French language teacher creating assessment questions based on the Australian Curriculum (ACARA).

Generate 5 questions for testing:

Topic: ${topic.name}
Content Description: ${content.description}

Elaboration examples:
${elaborations.slice(0, 3).map((e, i) => `${i + 1}. ${e.description}`).join('\n')}

Requirements:
- 3 MCQ questions (4 options each, labeled A, B, C, D)
- 2 fill-in-the-blank questions
- Include actual French phrases where possible
- Make questions appropriate for language learners

Output format: JSON array with this exact structure:
[{
  "prompt": "Question text here",
  "type": "mcq",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
  "correctAnswer": "B) Second option",
  "difficulty": "medium",
  "skillsTested": ["vocabulary"],
  "vocabularyFocus": ["word1"]
}]

IMPORTANT:
- Return ONLY valid JSON, no other text
- For MCQ type, include the letter prefix in both options and correctAnswer
`;

    console.log('Calling OpenAI API...');
    const startTime = Date.now();

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
      max_tokens: 2000,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ API call completed in ${duration}s\n`);

    const responseText = completion.choices[0].message.content.trim();

    // Try to extract JSON if wrapped in markdown
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    console.log('Raw response (first 200 chars):');
    console.log(responseText.substring(0, 200) + '...\n');

    const questions = JSON.parse(jsonText);

    console.log(`✅ Generated ${questions.length} questions\n`);

    // Display questions
    questions.forEach((q, i) => {
      console.log(`Question ${i + 1}:`);
      console.log(`  Type: ${q.type}`);
      console.log(`  Difficulty: ${q.difficulty}`);
      console.log(`  Prompt: ${q.prompt}`);
      if (q.type === 'mcq') {
        console.log(`  Options:`);
        q.options.forEach(opt => console.log(`    ${opt}`));
      }
      console.log(`  Correct Answer: ${q.correctAnswer}`);
      console.log('');
    });

    // Show token usage
    console.log('API Usage:');
    console.log(`  Prompt tokens: ${completion.usage.prompt_tokens}`);
    console.log(`  Completion tokens: ${completion.usage.completion_tokens}`);
    console.log(`  Total tokens: ${completion.usage.total_tokens}`);

    const inputCost = (completion.usage.prompt_tokens / 1000) * 0.01;
    const outputCost = (completion.usage.completion_tokens / 1000) * 0.03;
    const totalCost = inputCost + outputCost;

    console.log(`  Estimated cost: $${totalCost.toFixed(4)}`);
    console.log(`  Cost for 45 topics: $${(totalCost * 45).toFixed(2)}\n`);

    console.log('✅ Test successful! You can now run the full generation:');
    console.log('   npm run generate');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close();
  }
}

testGeneration();
