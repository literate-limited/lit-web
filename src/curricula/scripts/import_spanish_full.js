import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../languages_curriculum.db');

/**
 * Fetch RDF data from Australian Curriculum repository
 */
function fetchRDF(elementId) {
  return new Promise((resolve, reject) => {
    const url = `https://rdf.australiancurriculum.edu.au/elements/2018/05/${elementId}.rdf`;

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse N-Triples to extract key information
 */
function parseNTriples(ntriples) {
  const data = {
    title: null,
    notation: null,
    label: null,
    description: null,
    children: [],
    properties: {}
  };

  const lines = ntriples.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  for (const line of lines) {
    // Extract title
    let match = line.match(/<http:\/\/purl\.org\/dc\/terms\/title>\s+"([^"]+)"/);
    if (match) data.title = match[1];

    // Extract notation
    match = line.match(/<http:\/\/purl\.org\/ASN\/schema\/core\/notation>\s+"([^"]+)"/);
    if (match) data.notation = match[1];

    // Extract statement label
    match = line.match(/<http:\/\/purl\.org\/ASN\/schema\/core\/statementLabel>\s+"([^"]+)"/);
    if (match) data.label = match[1];

    // Extract description
    match = line.match(/<http:\/\/purl\.org\/ASN\/schema\/core\/statement>\s+"([^"]+)"/);
    if (match) data.description = match[1];

    // Extract child element IDs
    match = line.match(/<http:\/\/purl\.org\/gem\/qualifiers\/hasChild>\s+<http:\/\/rdf\.australiancurriculum\.edu\.au\/elements\/2018\/05\/([a-f0-9\-]+)>/);
    if (match) data.children.push(match[1]);
  }

  return data;
}

/**
 * Recursively fetch Spanish curriculum elements
 */
async function fetchSpanishCurriculum(elementId, depth = 0, maxDepth = 4) {
  const indent = '  '.repeat(depth);
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`${indent}Fetching ${elementId.substring(0, 8)}...`);
      const rdf = await fetchRDF(elementId);
      const parsed = parseNTriples(rdf);

      if (parsed.title) {
        console.log(`${indent}✓ ${parsed.title}`);
      }

      const result = {
        id: elementId,
        ...parsed,
        childData: []
      };

      // Recursively fetch children up to max depth
      if (depth < maxDepth && parsed.children.length > 0) {
        console.log(`${indent}  Found ${parsed.children.length} children, fetching...`);
        for (const childId of parsed.children) {
          try {
            const childData = await fetchSpanishCurriculum(childId, depth + 1, maxDepth);
            result.childData.push(childData);
          } catch (err) {
            console.error(`${indent}  ✗ Failed to fetch child ${childId}: ${err.message}`);
          }
        }
      }

      return result;

    } catch (error) {
      retries++;
      if (retries >= MAX_RETRIES) {
        throw error;
      }
      console.log(`${indent}⚠ Retry ${retries}/${MAX_RETRIES}...`);
      await new Promise(r => setTimeout(r, 1000 * retries));
    }
  }
}

/**
 * Flatten curriculum tree into individual statements
 */
function flattenCurriculum(node, statements = []) {
  if (node.notation) {
    statements.push({
      id: uuidv4(),
      notation: node.notation,
      label: node.label || node.title || 'Untitled',
      description: node.description || '',
      language: 'es'
    });
  }

  if (node.childData && Array.isArray(node.childData)) {
    for (const child of node.childData) {
      flattenCurriculum(child, statements);
    }
  }

  return statements;
}

/**
 * Import Spanish curriculum
 */
async function importSpanishCurriculum() {
  console.log('\n🇪🇸 Importing Spanish Curriculum\n');
  console.log('Spanish is available for Years 7-10 only in ACARA\n');

  const spanishRootId = '21023c47-1598-4f2d-b08f-779d374092cf';

  try {
    console.log('Downloading Spanish curriculum from RDF repository...\n');
    const spanishTree = await fetchSpanishCurriculum(spanishRootId, 0, 5);

    console.log('\nFlattening curriculum tree...');
    const statements = flattenCurriculum(spanishTree);

    console.log(`Found ${statements.length} Spanish curriculum statements\n`);

    if (statements.length === 0) {
      console.log('⚠️  No Spanish curriculum statements found');
      return 0;
    }

    // Import into database
    console.log('Importing into database...');
    const db = new Database(DB_PATH);

    const insertStmt = db.prepare(`
      INSERT INTO curriculum_statements (id, notation, label, description, language)
      VALUES (?, ?, ?, ?, ?)
    `);

    const count = db.transaction(() => {
      let imported = 0;
      for (const stmt of statements) {
        try {
          insertStmt.run(
            stmt.id,
            stmt.notation,
            stmt.label.substring(0, 255),
            stmt.description.substring(0, 2000),
            'es'
          );
          imported++;
        } catch (err) {
          console.error(`⚠️  Failed to insert ${stmt.notation}: ${err.message}`);
        }
      }
      return imported;
    })();

    db.close();

    console.log(`✅ Imported ${count} Spanish statements\n`);

    // Verify
    const db2 = new Database(DB_PATH);
    const result = db2.prepare(`
      SELECT COUNT(*) as total, COUNT(DISTINCT language) as languages
      FROM curriculum_statements
      WHERE language = 'es'
    `).get();

    console.log(`📊 Database now has ${result.total} Spanish statements`);
    db2.close();

    return count;

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    throw error;
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  importSpanishCurriculum().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default importSpanishCurriculum;
