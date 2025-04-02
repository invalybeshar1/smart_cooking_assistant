import db from './db/database.js';

db.exec(`
  CREATE TABLE IF NOT EXISTS test_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT
  );
`);

console.log('✅ test_table created successfully!');
