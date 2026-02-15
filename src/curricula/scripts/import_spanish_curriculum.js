import Database from 'better-sqlite3';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

/**
 * Parse N-Triples RDF format to extract Spanish curriculum statements
 */
function parseNTriples(ntriples) {
  const statements = new Map();
  const lines = ntriples.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  for (const line of lines) {
    // Parse N-Triples: <subject> <predicate> <object> .
    const match = line.match(/<([^>]+)>\s+<([^>]+)>\s+(?:<([^>]+)>|"([^"]*)"(?:@([a-z-]+))?)\s*\./);

    if (!match) continue;

    const subject = match[1];
    const predicate = match[2];
    const objectUri = match[3];
    const objectLiteral = match[4];
    const language = match[5];

    if (!statements.has(subject)) {
      statements.set(subject, {
        id: subject,
        properties: {}
      });
    }

    const stmt = statements.get(subject);

    if (!stmt.properties[predicate]) {
      stmt.properties[predicate] = [];
    }

    stmt.properties[predicate].push({
      value: objectUri || objectLiteral,
      isUri: !!objectUri,
      language
    });
  }

  return statements;
}

/**
 * Extract Spanish curriculum statements from parsed RDF
 */
function extractSpanishStatements(statements) {
  const spanishStmts = [];

  for (const [uri, stmt] of statements) {
    // Filter for Spanish: notation starts with AC9LS (if it exists) or contains 'Spanish'
    const notationProp = stmt.properties['http://purl.org/ASN/schema/core/notation'];
    const titleProp = stmt.properties['http://purl.org/dc/terms/title'];
    const descProp = stmt.properties['http://purl.org/ASN/schema/core/statementLabel'];

    if (!notationProp || !titleProp) continue;

    const notation = notationProp[0]?.value;
    const title = titleProp[0]?.value;
    const description = descProp?.[0]?.value || '';

    // Check if this is a Spanish curriculum item
    // Spanish should have notation like AC9LS*, but if not found, skip
    if (!notation || !notation.startsWith('AC9LS')) {
      continue;
    }

    const statement = {
      id: uuidv4(),
      notation: notation,
      label: title,
      description: description,
      uri: uri,
      properties: stmt.properties
    };

    spanishStmts.push(statement);
  }

  return spanishStmts;
}

/**
 * Import Spanish curriculum into database
 */
async function importSpanish() {
  console.log('🇪🇸 Importing Spanish Curriculum\n');
  console.log('Downloading Spanish curriculum data from ACARA RDF repository...');

  try {
    // Fetch the Languages curriculum which includes all languages
    const response = await fetch(
      'https://rdf.australiancurriculum.edu.au/elements/2018/05/5460b64c-2581-404d-a8c6-6aa2fff88275.rdf'
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const ntriples = await response.text();
    console.log(`✅ Downloaded ${(ntriples.length / 1024).toFixed(1)}KB of RDF data\n`);

    console.log('Parsing RDF/N-Triples format...');
    const statements = parseNTriples(ntriples);
    console.log(`✅ Found ${statements.size} total curriculum elements\n`);

    console.log('Extracting Spanish statements...');
    const spanishStmts = extractSpanishStatements(statements);
    console.log(`✅ Found ${spanishStmts.length} Spanish curriculum statements\n`);

    if (spanishStmts.length === 0) {
      console.log('⚠️  No Spanish curriculum found in RDF data.');
      console.log('   Spanish curriculum may not be available in this dataset.');
      console.log('   Available languages: French (AC9LF), Italian (AC9LIT), Japanese (AC9LJ), Chinese (AC9LC), Auslan (ASLAN)');
      return;
    }

    // Import into database
    console.log('Importing into database...');
    const db = new Database(DB_PATH);

    const insertStmt = db.prepare(`
      INSERT INTO curriculum_statements (id, notation, label, description, language)
      VALUES (?, ?, ?, ?, 'es')
    `);

    const insertTransaction = db.transaction(() => {
      let count = 0;
      for (const stmt of spanishStmts) {
        insertStmt.run(
          stmt.id,
          stmt.notation,
          stmt.label,
          stmt.description
        );
        count++;
      }
      return count;
    });

    const imported = insertTransaction();
    db.close();

    console.log(`✅ Imported ${imported} Spanish statements\n`);

    // Verify import
    console.log('Verifying import...');
    const db2 = new Database(DB_PATH, { readonly: true });
    const count = db2.prepare('SELECT COUNT(*) as count FROM curriculum_statements WHERE language = ?').get('es');
    console.log(`✅ Spanish curriculum statements in database: ${count.count}`);
    db2.close();

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  importSpanish().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default importSpanish;
