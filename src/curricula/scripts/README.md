# French Language Curriculum - Question Generation Scripts

This directory contains scripts to populate the ACARA languages curriculum database with AI-generated French language learning questions.

## Overview

The pipeline:
1. Adds language fields to database tables
2. Extracts and creates topic hierarchy from curriculum statements
3. Generates 20-30 questions per topic using OpenAI GPT-4
4. Validates data quality and distribution

## Prerequisites

- Node.js 18+ with ES modules support
- OpenAI API key
- SQLite3 installed (for manual queries)

## Setup

```bash
# Navigate to scripts directory
cd /Users/ragnar/Documents/projects/lit-suite/lit/client/src/curricula/scripts

# Install dependencies
npm install

# Set OpenAI API key
export OPENAI_API_KEY="sk-..."
```

## Usage

### Full Pipeline (Recommended)

Runs all steps in sequence:

```bash
npm run full
```

Expected output:
- ~60 French topics created
- ~1,200-1,800 questions generated
- ~60-90 minutes execution time
- ~$1-2 OpenAI API cost

### Individual Steps

Run steps separately for debugging:

```bash
# Step 1: Schema migration
npm run migrate

# Step 2: Topic extraction
npm run topics

# Step 3: Question generation (slow, ~60 min)
npm run generate

# Step 4: Validation
npm run validate
```

## Scripts

### `add_language_fields.js`

Adds `language` column to:
- `curriculum_statements` - Stores language code (fr, ja, zh, it, auslan)
- `question` - Stores question language
- `topic` - Stores topic language

Backfills data by parsing notation codes:
- AC9LF* → 'fr' (French)
- AC9LJ* → 'ja' (Japanese)
- AC9LC* → 'zh' (Chinese)
- AC9LI* → 'it' (Italian)
- ASLAN* → 'auslan' (Australian Sign Language)

### `populate_topics.js`

Creates hierarchical topic structure:

```
French Language F-10
  ├─ Foundation to Year 2
  │    ├─ Communicating
  │    │    ├─ Socialising
  │    │    ├─ Informing
  │    │    └─ Creating
  │    └─ Understanding
  │         ├─ Systems of language
  │         └─ Role of language and culture
  ├─ Years 3-4
  ├─ Years 5-6
  ├─ Years 7-8
  ├─ Years 9-10
  └─ Years 11-12
```

Each leaf topic is linked to ACARA curriculum content descriptions.

### `generate_questions.js`

Generates questions using OpenAI GPT-4 Turbo:

**Question Distribution:**
- 60% MCQ (multiple choice with 4 options)
- 40% Fill-in-the-blank

**Difficulty by Year Level:**
- F-2: 90% easy, 10% medium
- 3-4: 70% easy, 30% medium
- 5-6: 50% easy, 40% medium, 10% hard
- 7-8: 30% easy, 60% medium, 10% hard
- 9-10: 20% easy, 50% medium, 30% hard
- 11-12: 10% easy, 40% medium, 50% hard

**Metadata Structure:**
```json
{
  "difficulty": "medium",
  "skillsTested": ["vocabulary", "grammar"],
  "vocabularyFocus": ["word1", "word2"],
  "yearLevel": "7-8",
  "competencyArea": "Communicating",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."]
}
```

**Rate Limiting:**
- 1 second delay between API calls
- 3 retries with exponential backoff on failures

### `validate_questions.js`

Runs quality assurance checks:

1. **Schema validation**: All fields populated correctly
2. **Content validation**: No duplicates, valid foreign keys
3. **Distribution validation**: Question counts and type ratios
4. **Sample review**: Random question examples

### `populate_database.js`

Main orchestration script that:
- Creates database backup
- Runs all steps in sequence
- Shows progress and timing
- Reports final statistics

## Database Schema

### Tables Modified

**curriculum_statements:**
```sql
+ language TEXT          -- 'fr', 'ja', 'zh', 'it', 'auslan'
+ INDEX idx_curriculum_language
```

**question:**
```sql
+ language TEXT NOT NULL DEFAULT 'fr'
+ INDEX idx_question_language
```

**topic:**
```sql
+ language TEXT
+ INDEX idx_topic_language
```

## Expected Results

After completion:

| Metric | Expected Value |
|--------|---------------|
| Topics | ~60 |
| Questions | ~1,200-1,800 |
| Avg Questions/Topic | 20-30 |
| MCQ Ratio | 60% ±10% |
| Fill Ratio | 40% ±10% |
| Execution Time | 60-90 minutes |
| API Cost | $1-2 |

## Validation Queries

Check results manually:

```bash
# Connect to database
sqlite3 ../languages_curriculum.db

# Total questions by language
SELECT language, COUNT(*) FROM question GROUP BY language;

# Questions per topic
SELECT t.name, COUNT(q.id) as question_count
FROM topic t
LEFT JOIN question q ON q.topicId = t.id
WHERE t.language = 'fr'
GROUP BY t.id
ORDER BY question_count DESC;

# Sample questions
SELECT prompt, type, correctAnswer
FROM question
WHERE language = 'fr'
LIMIT 5;

# Difficulty distribution
SELECT
  JSON_EXTRACT(metadata, '$.difficulty') as difficulty,
  COUNT(*) as count
FROM question
WHERE language = 'fr'
GROUP BY difficulty;
```

## Troubleshooting

### Issue: "OPENAI_API_KEY not set"

```bash
export OPENAI_API_KEY="sk-..."
```

### Issue: API rate limit errors

The script includes automatic retry with exponential backoff. If persistent:
- Check your OpenAI account limits
- Wait a few minutes and re-run
- Use `npm run generate` to resume (existing questions won't be regenerated)

### Issue: Database locked

Close any SQLite connections:
```bash
fuser ../languages_curriculum.db  # Find processes
kill -9 <PID>  # Kill if needed
```

### Issue: Low-quality questions

The script validates automatically. If issues persist:
- Increase temperature in `generate_questions.js` (line 72) for more creativity
- Decrease temperature for more consistent output
- Modify the prompt template to be more specific

## Rollback

Restore from backup:

```bash
cp ../languages_curriculum.db.backup ../languages_curriculum.db
```

Or manually clear data:

```sql
DELETE FROM question WHERE language = 'fr';
DELETE FROM topic WHERE language = 'fr';
ALTER TABLE curriculum_statements DROP COLUMN language;
ALTER TABLE question DROP COLUMN language;
ALTER TABLE topic DROP COLUMN language;
```

## Future Enhancements

- Support for Japanese, Chinese, Italian, Auslan
- Teacher review/approval workflow
- Question difficulty auto-adjustment
- Media attachments (audio, images)
- Answer explanations and feedback

## Cost Estimation

Based on OpenAI GPT-4 Turbo pricing:
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens

For ~60 topics:
- ~60 API calls
- ~1,500 tokens input per call = 90K tokens input = $0.90
- ~2,000 tokens output per call = 120K tokens output = $3.60
- **Total: ~$4.50**

Actual cost may be lower due to shorter responses.

## Support

For issues or questions:
- Check validation output for specific errors
- Review OpenAI API logs for generation failures
- Examine sample questions in validation report
- Contact curriculum team for content questions
