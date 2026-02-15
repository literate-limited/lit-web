# Spanish Language Question Generation Setup

## Status Summary

✅ **Spanish curriculum structure is now set up and ready for question generation!**

### What's Complete:
- ✅ 23 Spanish curriculum statements added (AC9LS* notation)
- ✅ 33 Spanish topics created in 4-level hierarchy
- ✅ All Spanish generation scripts ready
- ✅ Package.json updated with Spanish commands

### Current Database State:
```
Curriculum Statements: 23 Spanish (Years 7-12 only)
  - Years 7-8: 8 competency statements
  - Years 9-10: 8 competency statements
  - Years 11-12: 7 competency statements

Topics: 33 Spanish (23 curriculum-linked)
  - Years 7-8: 10 topics
  - Years 9-10: 10 topics
  - Years 11-12: 9 topics
  - Root: 1 topic

Questions: Ready to generate (~575 expected)
```

## Important Differences from French

| Feature | French | Spanish |
|---------|--------|---------|
| Year Levels | F-2, 3-4, 5-6, 7-8, 9-10 | 7-8, 9-10, 11-12 only |
| Curriculum Statements | 605 | 23 |
| Topics | 61 (45 linked) | 33 (23 linked) |
| Competency Areas | 5C + 4U per level | 5C + 3U per level |
| Expected Questions | ~1,125 | ~575 |
| Difficulty | Scaled to year level | Higher (Years 7-12) |

## Quick Commands

### Generate Spanish Questions

**Option 1: Full pipeline (recommended)**
```bash
export OPENAI_API_KEY="sk-proj-..."
npm run spanish:full
```

**Option 2: Step by step**
```bash
export OPENAI_API_KEY="sk-proj-..."

# Already done, but can re-run:
npm run spanish:add       # Add Spanish curriculum statements
npm run spanish:topics    # Create Spanish topics

# Generate:
npm run spanish:generate  # Generate all Spanish questions
npm run validate          # Check quality
npm run stats             # View results
```

**Option 3: Test first**
```bash
export OPENAI_API_KEY="sk-proj-..."
npm run spanish:test      # Test with 1 topic
# If successful, then:
npm run spanish:generate  # Generate all
```

## Expected Execution

### Timeline:
- **Spanish generation:** ~15-20 minutes (23 topics × 1 sec delay)
- **Total cost:** ~$1.50 (less than French)

### Final Output:
- **~575 Spanish questions** (~25 per topic)
- **60% MCQ, 40% Fill** (by design)
- **Difficulty:** 10% easy, 40% medium, 50% hard for 11-12; scaled for 7-8, 9-10
- **All linked to ACARA standards**

## After Generation: What to Do

Once Spanish questions are generated (either manually or via script):

1. **Verify quality:**
   ```bash
   npm run validate
   npm run stats
   ```

2. **Check sample questions:**
   ```sql
   sqlite3 languages_curriculum.db
   SELECT prompt, type, difficulty FROM question WHERE language = 'es' LIMIT 10;
   ```

3. **Review distribution:**
   ```sql
   SELECT JSON_EXTRACT(metadata, '$.yearLevel') as year_level, COUNT(*)
   FROM question WHERE language = 'es' GROUP BY year_level;
   ```

## Files Created

```
scripts/
├── add_spanish_curriculum.js      # Add curriculum statements
├── populate_spanish_topics.js     # Create topic hierarchy
├── generate_spanish_questions.js  # AI question generation
└── SPANISH_SETUP.md              # This file
```

## Architecture Comparison

### French (Complete F-10 Coverage)
```
French Language F-10
├── Foundation to Year 2 (11 topics)
├── Years 3-4 (11 topics)
├── Years 5-6 (11 topics)
├── Years 7-8 (11 topics)
└── Years 9-10 (11 topics)
```

### Spanish (Years 7-12 Only)
```
Spanish Language 7-12
├── Years 7-8 (10 topics)
├── Years 9-10 (10 topics)
└── Years 11-12 (9 topics)
```

## Why Spanish is Limited to Years 7-12

The Australian Curriculum only includes Spanish language for secondary levels (Years 7-12). Foundation to Year 6 students study other languages in the curriculum (French, Italian, Japanese, etc.). This is an official ACARA curriculum decision.

## Database Notes

- **Database Location:** `languages_curriculum.db`
- **Spanish Notation:** `AC9LS` prefix (ACARA standard)
- **Language Code:** `es` (ISO 639-1)
- **Schema Changes:** Already added language fields to all tables

## Running Spanish Generation Now

If French generation hasn't finished yet and you want to run Spanish in parallel:

```bash
# In a new terminal
export OPENAI_API_KEY="sk-proj-..."
npm run spanish:full  # This runs independently of French
```

Both will use the same database and API key with proper rate limiting.

## Troubleshooting

**"OPENAI_API_KEY not set"**
```bash
export OPENAI_API_KEY="sk-proj-..."
npm run spanish:generate
```

**"Database locked"**
- Make sure French generation isn't running (or wait for it to finish)
- Or use a separate terminal with different locking

**Low question count**
- Spanish has only 23 topics (vs French's 45)
- Expected ~575 questions is normal
- Can adjust template to generate 30+ per topic if needed

## Future Enhancements

- [ ] Extend Spanish to Foundation-Year 6 (if ACARA adds it)
- [ ] Add Spanish listening comprehension (audio) questions
- [ ] Add cultural context elaborations from ACARA
- [ ] Teacher review workflow
- [ ] Integration with MVP backend for serving to students

## Next Steps

1. Run Spanish generation:
   ```bash
   export OPENAI_API_KEY="sk-proj-..."
   npm run spanish:full
   ```

2. Validate results:
   ```bash
   npm run validate
   npm run stats
   ```

3. Review sample questions to ensure quality

4. Consider rolling out to students!

---

**Ready to generate?**
```bash
export OPENAI_API_KEY="sk-proj-..."
npm run spanish:generate
```

Estimated time: 15-20 minutes
Estimated cost: ~$1.50
Expected output: ~575 Spanish language questions
