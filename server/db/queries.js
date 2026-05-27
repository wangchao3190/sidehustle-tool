const { getDb, saveDb } = require('./schema');

// ─── Helpers ───────────────────────────────────────────────

function queryAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function runQuery(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();

  // Get last inserted row id
  const result = db.exec('SELECT last_insert_rowid() as id');
  const lastId = result[0].values[0][0];
  saveDb();
  return { lastInsertRowid: lastId };
}

// ─── Quiz Queries ─────────────────────────────────────────

function insertQuiz(sessionId, answers) {
  const result = runQuery(
    'INSERT INTO quizzes (session_id, answers) VALUES (?, ?)',
    [sessionId, JSON.stringify(answers)]
  );
  return result.lastInsertRowid;
}

function updateQuizMatches(quizId, matches) {
  runQuery('UPDATE quizzes SET matches = ? WHERE id = ?', [JSON.stringify(matches), quizId]);
}

function getQuizById(id) {
  return queryOne('SELECT * FROM quizzes WHERE id = ?', [id]);
}

// ─── Playbook Queries ─────────────────────────────────────

function getPlaybookBySlug(slug) {
  return queryOne('SELECT * FROM playbooks WHERE slug = ?', [slug]);
}

function getAllPlaybooks() {
  return queryAll('SELECT slug, title, category, difficulty, income_range FROM playbooks');
}

function upsertPlaybook(slug, data) {
  const existing = getPlaybookBySlug(slug);
  if (existing) {
    runQuery(
      `UPDATE playbooks SET title = ?, category = ?, difficulty = ?, income_range = ?,
       suitable_for = ?, content = ?, preview_content = ?, updated_at = CURRENT_TIMESTAMP
       WHERE slug = ?`,
      [data.title, data.category, data.difficulty, data.income_range,
        JSON.stringify(data.suitable_for), data.content, data.preview_content, slug]
    );
  } else {
    runQuery(
      `INSERT INTO playbooks (slug, title, category, difficulty, income_range, suitable_for, content, preview_content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, data.title, data.category, data.difficulty, data.income_range,
        JSON.stringify(data.suitable_for), data.content, data.preview_content]
    );
  }
}

function getPlaybookCount() {
  const row = queryOne('SELECT COUNT(*) as count FROM playbooks');
  return row ? row.count : 0;
}

// ─── Order Queries ────────────────────────────────────────

function createOrder(sessionId, playbookSlug) {
  const result = runQuery(
    'INSERT INTO orders (session_id, playbook_slug, amount, status) VALUES (?, ?, 9.9, ?)',
    [sessionId, playbookSlug, 'pending']
  );
  return result.lastInsertRowid;
}

function getOrderById(orderId) {
  return queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
}

function updateOrderStatus(orderId, status) {
  if (status === 'paid') {
    runQuery(
      'UPDATE orders SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );
  } else {
    runQuery('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  }
}

function hasPaidOrder(sessionId, playbookSlug) {
  const row = queryOne(
    'SELECT COUNT(*) as count FROM orders WHERE session_id = ? AND playbook_slug = ? AND status = ?',
    [sessionId, playbookSlug, 'paid']
  );
  return row && row.count > 0;
}

function getOrderBySessionAndSlug(sessionId, playbookSlug) {
  return queryOne(
    'SELECT * FROM orders WHERE session_id = ? AND playbook_slug = ? AND status = ? ORDER BY paid_at DESC LIMIT 1',
    [sessionId, playbookSlug, 'paid']
  );
}

// ─── Feedback Queries ─────────────────────────────────────

function insertFeedback(playbookSlug, sessionId, rating, comment) {
  const result = runQuery(
    'INSERT INTO feedback (playbook_slug, session_id, rating, comment) VALUES (?, ?, ?, ?)',
    [playbookSlug, sessionId, rating, comment || null]
  );
  return result.lastInsertRowid;
}

function getFeedbackBySlug(playbookSlug) {
  return queryAll(
    'SELECT rating, comment, created_at FROM feedback WHERE playbook_slug = ? ORDER BY created_at DESC',
    [playbookSlug]
  );
}

function getAverageRating(playbookSlug) {
  return queryOne(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM feedback WHERE playbook_slug = ?',
    [playbookSlug]
  );
}

module.exports = {
  insertQuiz,
  updateQuizMatches,
  getQuizById,
  getPlaybookBySlug,
  getAllPlaybooks,
  upsertPlaybook,
  getPlaybookCount,
  createOrder,
  getOrderById,
  updateOrderStatus,
  hasPaidOrder,
  getOrderBySessionAndSlug,
  insertFeedback,
  getFeedbackBySlug,
  getAverageRating,
};
