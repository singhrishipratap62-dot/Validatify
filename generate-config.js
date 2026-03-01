// Build script for Vercel deployment
// Injects Supabase credentials directly into index.html as an inline script
const fs = require('fs');

const url = (process.env.SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_ANON_KEY || '').trim();

if (!url || !key) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set.');
  process.exit(1);
}

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace the external config.js script tag with an inline script
const configScript = `<script>const SUPABASE_URL='${url}';const SUPABASE_ANON_KEY='${key}';</script>`;

html = html.replace(
  '<!-- Credentials (gitignored — never committed) -->\n  <script src="config.js"></script>',
  configScript
);

fs.writeFileSync(htmlPath, html);
console.log('✓ Supabase credentials injected inline into index.html');
