// Build script for Vercel deployment
// Generates config.js from environment variables at deploy time
const fs = require('fs');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set.');
    process.exit(1);
}

const config = `// Auto-generated at build time — do not edit manually
const SUPABASE_URL = '${url}';
const SUPABASE_ANON_KEY = '${key}';
`;

fs.writeFileSync('config.js', config);
console.log('✓ config.js generated from environment variables');
