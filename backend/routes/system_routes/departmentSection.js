const express = require("express");
const { db3 } = require("../database/database");

const router = express.Router();

// ACTIVE CURRICULUM
router.get("/get_active_curriculum", async (req, res) => {
  const readQuery = `
    SELECT ct.*, p.*, y.*
    FROM curriculum_table ct
    INNER JOIN program_table p ON ct.program_id = p.program_id
    INNER JOIN year_table y ON ct.year_id = y.year_id
    WHERE ct.lock_status = 1
  `;

  try {
    const [result] = await db3.query(readQuery);
    res.status(200).json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// SECTIONS - CREATE
router.post("/section_table", async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  try {
    const checkQuery = "SELECT * FROM section_table WHERE description = ?";
    const [exists] = await db3.query(checkQuery, [description]);

    if (exists.length > 0) {
      return res.status(409).json({ error: "Section already exists" });
    }

    const insertQuery = "INSERT INTO section_table (description) VALUES (?)";
    const [result] = await db3.query(insertQuery, [description]);

    res.status(201).json({
      message: "Section created successfully",
      sectionId: result.insertId,
    });
  } catch (err) {
    console.error("Error inserting section:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

// SECTIONS - UPDATE
router.put("/section_table/:id", async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  try {
    const checkQuery =
      "SELECT * FROM section_table WHERE description = ? AND id != ?";
    const [exists] = await db3.query(checkQuery, [description, id]);

    if (exists.length > 0) {
      return res.status(409).json({ error: "Section already exists" });
    }

    const updateQuery = "UPDATE section_table SET description = ? WHERE id = ?";
    await db3.query(updateQuery, [description, id]);

    res.status(200).json({ message: "Section updated successfully" });
  } catch (err) {
    console.error("Error updating section:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// SECTIONS - DELETE
router.delete("/section_table/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleteQuery = "DELETE FROM section_table WHERE id = ?";
    await db3.query(deleteQuery, [id]);

    res.status(200).json({ message: "Section deleted successfully" });
  } catch (err) {
    console.error("Error deleting section:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// SECTIONS - LIST
router.get("/section_table", async (req, res) => {
  try {
    const query = "SELECT * FROM section_table";
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching sections:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

// SECTIONS BY DEPARTMENT
router.get("/section_table/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `
      SELECT dst.id as dep_section_id, st.*, pt.*
      FROM dprtmnt_curriculum_table AS dct
      INNER JOIN dprtmnt_section_table AS dst ON dct.curriculum_id = dst.curriculum_id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN curriculum_table AS ct ON dct.curriculum_id = ct.curriculum_id
      INNER JOIN program_table AS pt ON ct.program_id = pt.program_id
      WHERE dct.dprtmnt_id = ?;
    `;

    const [results] = await db3.query(query, [dprtmnt_id]);
    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// DEPARTMENT SECTION - CREATE
router.post("/department_section", async (req, res) => {
  const { curriculum_id, section_id } = req.body;

  if (!curriculum_id || !section_id) {
    return res
      .status(400)
      .json({ error: "Curriculum ID and Section ID are required" });
  }

  try {
    const [existing] = await db3.query(
      `
      SELECT * FROM dprtmnt_section_table
      WHERE curriculum_id = ? AND section_id = ?
      `,
      [curriculum_id, section_id],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "This department-section combination already exists.",
      });
    }

    const query = `
      INSERT INTO dprtmnt_section_table (curriculum_id, section_id, dsstat)
      VALUES (?, ?, 0)
    `;

    const [result] = await db3.query(query, [curriculum_id, section_id]);

    res.status(201).json({
      message: "Department section created successfully",
      sectionId: result.insertId,
    });
  } catch (err) {
    console.error("Error inserting department section:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

// DEPARTMENT SECTION - LIST
router.get("/department_section", async (req, res) => {
  try {
    const query = `
      SELECT
        pt.program_code,
        pt.program_description,
        pt.major,
        yt.year_description,
        st.description AS section_description
      FROM dprtmnt_section_table dst
      INNER JOIN curriculum_table ct ON dst.curriculum_id = ct.curriculum_id
      INNER JOIN program_table pt ON ct.program_id = pt.program_id
      INNER JOIN year_table yt ON ct.year_id = yt.year_id
      INNER JOIN section_table st ON dst.section_id = st.id
    `;

    const [rows] = await db3.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
