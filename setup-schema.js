import fs from 'fs';
import db from './db/database.js';

const schema = fs.readFileSync('./schema.sql', 'utf-8');

try {
  db.exec(schema);
  console.log('✅ Database schema applied successfully!');
} catch (err) {
  console.error('❌ Error applying schema:', err.message);
}
