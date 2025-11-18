const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- DB CONNECTION ----------
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'mydb',
  user: process.env.POSTGRES_USER || 'myuser',
  password: process.env.POSTGRES_PASSWORD || 'mypassword',
});

// ---------- MIDDLEWARE ----------
app.use(bodyParser.json());

// Serve input json files (if frontend needs them)
app.use('/input', express.static(path.join(__dirname, 'input')));

// ---------- ROUTES ----------

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'db-error' });
  }
});

// Save history into PostgreSQL (INSTEAD of history.json)
app.post('/api/save-history', async (req, res) => {
  try {
    await pool.query('INSERT INTO history (data) VALUES ($1)', [req.body]);
    console.log('History row saved into PostgreSQL.');
    res.status(200).send('Saved');
  } catch (err) {
    console.error('Error saving history to DB:', err);
    res.status(500).send('Failed to save history');
  }
});

// Get last N history items
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, data, created_at FROM history ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).send('Failed to fetch history');
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

