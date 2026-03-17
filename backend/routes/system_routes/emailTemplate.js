const express = require('express');
const { db, db3 } = require('../database/database');

const router = express.Router();

// GET all templates with department name
router.get("/api/email-templates", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT et.*, dpr.dprtmnt_name AS department_name
      FROM email_templates et
      LEFT JOIN enrollment.dprtmnt_table dpr
      ON et.department_id = dpr.dprtmnt_id
      ORDER BY et.updated_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// CREATE template
router.post("/api/email-templates", async (req, res) => {
  try {
    const { sender_name, department_id, is_active = 1 } = req.body;
    if (!sender_name || !department_id)
      return res
        .status(400)
        .json({ error: "Sender name and department are required" });

    const [result] = await db.query(
      "INSERT INTO email_templates (sender_name, department_id, is_active) VALUES (?, ?, ?)",
      [sender_name, department_id, is_active ? 1 : 0],
    );
    res.status(201).json({ template_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// UPDATE template
router.put("/api/email-templates/:id", async (req, res) => {
  try {
    const { sender_name, department_id, is_active } = req.body;

    const [result] = await db.query(
      `UPDATE email_templates
       SET sender_name = COALESCE(?, sender_name),
           department_id = COALESCE(?, department_id),
           is_active = COALESCE(?, is_active)
       WHERE template_id = ?`,
      [sender_name, department_id, is_active, req.params.id],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update template" });
  }
});

// DELETE template
router.delete("/api/email-templates/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM email_templates WHERE template_id = ?",
      [req.params.id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

router.get("/api/email-templates/active-senders", async (req, res) => {
  const { department_id } = req.query;
  console.log("Department ID: ", department_id);

  try {
    const [rows] = await db.query(
      "SELECT template_id, sender_name FROM email_templates WHERE is_active = 1 AND department_id = ?",
      [department_id],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch active senders" });
  }
});

module.exports = router;