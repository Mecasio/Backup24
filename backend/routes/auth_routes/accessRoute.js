const express = require('express');
const { db3 } = require('../database/database');

const router = express.Router();

router.post("/access", async (req, res) => {
  const { access_description, access_page } = req.body;

  try {

    await db3.query(
      "INSERT INTO access_table (access_description, access_page) VALUES (?, ?)",
      [access_description, JSON.stringify(access_page)]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save access" });
  }

});

router.get("/access_table", async (req, res) => {
  try {
    const [rows] = await db3.query(
      "SELECT access_id, access_description, access_page FROM access_table ORDER BY access_id ASC"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch access levels" });
  }
});

router.get("/access_level/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const [rows] = await db3.query(
      `SELECT ua.access_level, at.access_description
       FROM user_accounts ua
       LEFT JOIN access_table at ON ua.access_level = at.access_id
       WHERE ua.employee_id = ?
       LIMIT 1`,
      [employee_id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch access level" });
  }
});


module.exports = router;
