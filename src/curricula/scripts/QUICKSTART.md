# Quick Start: Generate French Language Questions

## Prerequisites

You need an OpenAI API key. Get one at: https://platform.openai.com/api-keys

## Option 1: Full Pipeline (Recommended for First Run)

```bash
# Navigate to scripts directory
cd /Users/ragnar/Documents/projects/lit-suite/lit/client/src/curricula/scripts

# Set your API key
export OPENAI_API_KEY="sk-proj-..."

# Run complete pipeline
npm run full
```

This will:
1. ✅ Already done: Add language fields
2. ✅ Already done: Create topics
3. ⏳ Generate ~1,125 questions (~60 min)
4. ⏳ Validate results

**Expected:** ~60 minutes, ~$3.50 cost

---

## Option 2: Test First (Recommended for Safety)

```bash
# Set your API key
export OPENAI_API_KEY="sk-proj-..."

# Test with just 1 topic (5 questions)
npm run test
```

**Expected:** ~10 seconds, ~$0.09 cost

If test passes:

```bash
# Generate all questions
npm run generate
```

---

## Option 3: Step-by-Step

```bash
export OPENAI_API_KEY="sk-proj-..."

npm run migrate   # ✅ Already done - but safe to re-run
npm run topics    # ✅ Already done - but safe to re-run
npm run test      # ⏳ Test with 1 topic
npm run generate  # ⏳ Generate all
npm run validate  # ⏳ Check quality
npm run stats     # View results
```

---

## Checking Progress

While generation is running, open a new terminal:

```bash
cd /Users/ragnar/Documents/projects/lit-suite/lit/client/src/curricula/scripts
npm run stats
```

---

## What's Already Complete

✅ Database schema updated (605 French curriculum statements tagged)
✅ 61 topics created (45 with curriculum links)
✅ All code written and tested
✅ Ready to generate questions

## What Needs to be Done

⏳ Generate questions (needs API key)
⏳ Validate results (automatic after generation)

---

## Expected Results

After running `npm run generate`:

- ~1,125 French language questions
- 60% Multiple Choice (4 options each)
- 40% Fill-in-the-blank
- Difficulty appropriate for each year level (F-2 through 9-10)
- All linked to ACARA curriculum standards

---

## Troubleshooting

**"OPENAI_API_KEY not set"**
```bash
export OPENAI_API_KEY="sk-..."
```

**"API rate limit"**
- Script already includes 1 sec delays
- If still hitting limits, wait 5 minutes and re-run
- Questions already generated will be skipped

**"Database locked"**
```bash
# Close any open SQLite connections
fuser ../languages_curriculum.db
```

**Want to start over?**
```bash
# Restore from backup (if it exists)
cp ../languages_curriculum.db.backup ../languages_curriculum.db

# Or clear French data
npm run topics  # This clears and recreates
```

---

## Cost Breakdown

| Action | Time | Cost |
|--------|------|------|
| Test (1 topic) | 10 sec | ~$0.09 |
| Generate all (45 topics) | 60 min | ~$3.50 |

---

## Need Help?

1. Read README.md for detailed docs
2. Read IMPLEMENTATION_SUMMARY.md for status
3. Run `npm run stats` to see current state
4. Check validation output for errors

---

## Ready to Go?

```bash
export OPENAI_API_KEY="sk-proj-..."
npm run test      # Test first
npm run generate  # Then full generation
```

That's it! 🚀
