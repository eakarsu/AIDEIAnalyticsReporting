const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Admin check middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM users');
    const byRole = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC');
    const recent = await pool.query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'");

    res.json({
      total: parseInt(total.rows[0].count),
      byRole: byRole.rows,
      recentSignups: parseInt(recent.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, name, hashedPassword, role || 'analyst']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, name, role, password } = req.body;
    const userId = req.params.id;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'UPDATE users SET email=$1, name=$2, role=$3, password=$4 WHERE id=$5 RETURNING id, email, name, role, created_at',
        [email, name, role, hashedPassword, userId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      'UPDATE users SET email=$1, name=$2, role=$3 WHERE id=$4 RETURNING id, email, name, role, created_at',
      [email, name, role, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
