import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');
const RDF_PATH = '/Users/ragnar/Downloads/result.rdf';

/**
 * Parse XML and extract Spanish curriculum data
 */
async function importSpanishFromRDF() {
  console.log('🇪🇸 Importing Spanish F-10 Curriculum from result.rdf\n');

  try {
    // Read RDF file
    console.log('Reading result.rdf...');
    const rdfContent = readFileSync(RDF_PATH, 'utf-8');
    console.log(`✅ Read ${(rdfContent.length / 1024 / 1024).toFixed(1)}MB RDF file\n`);

    // Parse XML
    console.log('Parsing RDF/XML...');
    const xml2js = await import('xml2js');
    const parser = new xml2js.default.Parser();
    const rdfData = await parser.parseStringPromise(rdfContent);

    console.log('✅ Parsed RDF\n');

    // Extract Spanish statements
    console.log('Extracting Spanish curriculum statements...');
    const descriptions = rdfData['rdf:RDF']['rdf:Description'] || [];

    let spanishCount = 0;
    let yearLevelStats = {};
    const spanishStatements = [];

    for (const desc of descriptions) {
      // Get description first
      const descArray = desc['dct:description'];
      if (!descArray || !Array.isArray(descArray)) continue;

      const description = descArray[0]?._;
      if (!description) continue;

      // Check if this is Spanish (look for Spanish language learning)
      if (!description.includes('Spanish language learning and use')) continue;

      // Get title to determine year level
      const titleArray = desc['dct:title'];
      let title = '';
      if (titleArray && Array.isArray(titleArray)) {
        title = titleArray[0]?._ || '';
      }

      // Determine year level from title or description
      let yearLevel = null;
      if (title.includes('Foundation') || title.includes('Year 2') || description.includes('By the end of Year 2')) {
        yearLevel = 'F-2';
      } else if (title.includes('Year 3') && title.includes('Year 4')) {
        yearLevel = '3-4';
      } else if (title.includes('Year 5') && title.includes('Year 6')) {
        yearLevel = '5-6';
      } else if (title.includes('Year 7') && title.includes('Year 8')) {
        yearLevel = '7-8';
      } else if (title.includes('Year 9') && title.includes('Year 10')) {
        yearLevel = '9-10';
      }

      if (!yearLevel) continue;

      // Get competency type from label
      const labelArray = desc['asn:statementLabel'];
      let competencyType = 'Content Description';
      if (labelArray && Array.isArray(labelArray)) {
        competencyType = labelArray[0]._ || 'Content Description';
      }

      // Get about attribute for ID
      const about = desc.$?.['rdf:about'];

      spanishCount++;
      yearLevelStats[yearLevel] = (yearLevelStats[yearLevel] || 0) + 1;

      spanishStatements.push({
        id: uuidv4(),
        notation: `AC9LS_${yearLevel.replace('-', '')}_${spanishCount}`, // Generate notation
        label: competencyType,
        description: description.substring(0, 4000), // Limit to 4000 chars
        yearLevel: yearLevel,
        about: about
      });
    }

    console.log(`✅ Found ${spanishCount} Spanish curriculum statements\n`);
    console.log('Spanish statements by year level:');
    for (const [year, count] of Object.entries(yearLevelStats).sort()) {
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
    console.log('\nNext steps:');
    console.log('  1. Run: npm run spanish:topics');
    console.log('  2. Run: npm run spanish:generate');

    return imported;

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run
importSpanishFromRDF().catch(err => {
  console.error(err);
  process.exit(1);
});
