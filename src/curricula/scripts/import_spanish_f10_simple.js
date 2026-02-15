import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');
const RDF_PATH = '/Users/ragnar/Downloads/result.rdf';

/**
 * Extract Spanish F-10 curriculum from RDF using regex
 */
function importSpanishFromRDF() {
  console.log('🇪🇸 Importing Spanish F-10 Curriculum from result.rdf\n');

  try {
    // Read RDF file
    console.log('Reading result.rdf...');
    let rdfContent = readFileSync(RDF_PATH, 'utf-8');
    console.log(`✅ Read ${(rdfContent.length / 1024 / 1024).toFixed(1)}MB RDF file\n`);

    // Extract all rdf:Description blocks
    console.log('Extracting Spanish curriculum statements...');
    const descriptionRegex = /<rdf:Description[^>]*>([\s\S]*?)<\/rdf:Description>/g;
    const yearLevels = ['Foundation to Year 2', 'Years 3 and 4', 'Years 5 and 6', 'Years 7 and 8', 'Years 9 and 10'];
    const yearLevelMap = {
      'Foundation to Year 2': 'F-2',
      'Years 3 and 4': '3-4',
      'Years 5 and 6': '5-6',
      'Years 7 and 8': '7-8',
      'Years 9 and 10': '9-10'
    };

    const spanishStatements = [];
    let match;
    let statementCount = 0;

    while ((match = descriptionRegex.exec(rdfContent)) !== null) {
      const blockContent = match[1];

      // Check if this block contains Spanish language learning
      if (!blockContent.includes('Spanish language learning and use')) continue;

      // Extract title
      const titleMatch = blockContent.match(/<dct:title[^>]*>([^<]*)<\/dct:title>/);
      let title = titleMatch ? titleMatch[1] : '';

      // Extract description
      const descMatch = blockContent.match(/<dct:description[^>]*>([\s\S]*?)<\/dct:description>/);
      let description = descMatch ? descMatch[1] : '';

      // Decode HTML entities
      description = description
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");

      // Determine year level
      let yearLevel = null;
      for (const level of yearLevels) {
        if (title.includes(level)) {
          yearLevel = yearLevelMap[level];
          break;
        }
      }

      if (!yearLevel) continue;

      statementCount++;
      spanishStatements.push({
        id: uuidv4(),
        notation: `AC9LS${yearLevel.replace('-', '')}${String(statementCount).padStart(2, '0')}`,
        label: 'Content Description',
        description: description.substring(0, 4000),
        yearLevel: yearLevel
      });
    }

    console.log(`✅ Found ${spanishStatements.length} Spanish curriculum statements\n`);

    // Group by year level
    const yearStats = {};
    for (const stmt of spanishStatements) {
      yearStats[stmt.yearLevel] = (yearStats[stmt.yearLevel] || 0) + 1;
    }

    console.log('Spanish statements by year level:');
    for (const [year, count] of Object.entries(yearStats).sort()) {
      console.log(`  ${year}: ${count}`);
    }

    // Clear existing Spanish data
    console.log('\nClearing existing Spanish curriculum data...');
    const db = new Database(DB_PATH);
    db.prepare('DELETE FROM question WHERE language = ?').run('es');
    db.prepare('DELETE FROM topic WHERE language = ?').run('es');
    db.prepare('DELETE FROM curriculum_statements WHERE language = ?').run('es');
    console.log('✅ Cleared previous Spanish data\n');

    // Insert curriculum statements
    console.log('Importing curriculum statements...');
    const insertStmt = db.prepare(`
      INSERT INTO curriculum_statements (id, notation, label, description, language)
      VALUES (?, ?, ?, ?, 'es')
    `);

    const importTransaction = db.transaction(() => {
      let imported = 0;
      for (const stmt of spanishStatements) {
        insertStmt.run(
          stmt.id,
          stmt.notation,
          stmt.label,
          stmt.description
        );
        imported++;
      }
      return imported;
    });

    const imported = importTransaction();
    console.log(`✅ Imported ${imported} Spanish curriculum statements\n`);

    // Verify
    const result = db.prepare('SELECT COUNT(*) as count FROM curriculum_statements WHERE language = ?').get('es');
    console.log(`📊 Verification: ${result.count} Spanish statements in database`);

    db.close();

    console.log('\n✅ Spanish F-10 curriculum imported successfully!');
    console.log('\nNext: Create topics and generate questions');
    console.log('  npm run spanish:topics');
    console.log('  npm run spanish:generate');

    return imported;

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run
importSpanishFromRDF();
