const express = require('express');
const multer = require("multer");
const { db, db3 } = require('../database/database');

const router = express.Router();

router.get("/program_tagging_list", async (req, res) => {
  const readQuery = `
  SELECT 
  pt.program_tagging_id,
  pt.curriculum_id,
  c.program_id,
  dc.dprtmnt_id,
  pt.course_id,
  pt.year_level_id,
  pt.semester_id,
  pt.lec_fee,
  pt.lab_fee,
  pt.iscomputer_lab,
  pt.islaboratory_fee,
  pt.is_nstp,

  CONCAT(y.year_description, ' - ', p.program_description) AS curriculum_description,
  p.program_code,
  p.major, 

  co.course_code,
  co.course_description,
  co.course_unit,
  co.lab_unit,
  co.lec_unit,
  co.prereq,
  yl.year_level_description,
  s.semester_description
FROM program_tagging_table pt
JOIN curriculum_table c ON pt.curriculum_id = c.curriculum_id
LEFT JOIN dprtmnt_curriculum_table dc ON dc.curriculum_id = c.curriculum_id
JOIN year_table y ON c.year_id = y.year_id
JOIN program_table p ON c.program_id = p.program_id
JOIN course_table co ON pt.course_id = co.course_id
JOIN year_level_table yl ON pt.year_level_id = yl.year_level_id
JOIN semester_table s ON pt.semester_id = s.semester_id;


`;


  try {
    const [result] = await db3.query(readQuery);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching tagged programs:", error);
    res.status(500).json({ error: "Error fetching program tagging list" });
  }
});

async function getLatestTosf() {
  const [rows] = await db3.query(
    `SELECT *
     FROM tosf
     ORDER BY tosf_id DESC
     LIMIT 1`
  );

  if (!rows.length) {
    throw new Error("TOSF is empty");
  }

  return rows[0];
}

router.post("/program_tagging", async (req, res) => {
  const {
    curriculum_id,
    year_level_id,
    semester_id,
    course_id,
    lec_fee,
    lab_fee,
    iscomputer_lab,
    islaboratory_fee,
    is_nstp,
  } = req.body;

  try {
    const [existing] = await db3.query(
      `SELECT program_tagging_id
       FROM program_tagging_table
       WHERE curriculum_id = ?
         AND year_level_id = ?
         AND semester_id = ?
         AND course_id = ?`,
      [curriculum_id, year_level_id, semester_id, course_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Program tag already exists" });
    }

    const tosf = await getLatestTosf();

    let amount = 0;
    if (Number(iscomputer_lab) === 1) amount = Number(tosf.computer_fees);
    else if (Number(islaboratory_fee) === 1) amount = Number(tosf.laboratory_fees);
    else if (Number(is_nstp) === 1) amount = Number(tosf.nstp_fees);

    const [result] = await db3.query(
      `INSERT INTO program_tagging_table (
        curriculum_id,
        year_level_id,
        semester_id,
        course_id,
        lec_fee,
        lab_fee,
        iscomputer_lab,
        islaboratory_fee,
        is_nstp,
        amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        curriculum_id,
        year_level_id,
        semester_id,
        course_id,
        Number(lec_fee) || 0,
        Number(lab_fee) || 0,
        Number(iscomputer_lab) || 0,
        Number(islaboratory_fee) || 0,
        Number(is_nstp) || 0,
        amount
      ]
    );

    res.status(201).json({
      insertId: result.insertId,
      amount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.put("/program_tagging/:id", async (req, res) => {
  const { id } = req.params;
  const {
    curriculum_id,
    year_level_id,
    semester_id,
    course_id,
    lec_fee,
    lab_fee,
    iscomputer_lab,
    islaboratory_fee,
    is_nstp,
  } = req.body;

  try {
    const tosf = await getLatestTosf();

    let amount = 0;
    if (Number(iscomputer_lab) === 1) amount = Number(tosf.computer_fees);
    else if (Number(islaboratory_fee) === 1) amount = Number(tosf.laboratory_fees);
    else if (Number(is_nstp) === 1) amount = Number(tosf.nstp_fees);

    const [result] = await db3.query(
      `UPDATE program_tagging_table
       SET curriculum_id = ?,
           year_level_id = ?,
           semester_id = ?,
           course_id = ?,
           lec_fee = ?,
           lab_fee = ?,
           iscomputer_lab = ?,
           islaboratory_fee = ?,
           is_nstp = ?,
           amount = ?
       WHERE program_tagging_id = ?`,
      [
        curriculum_id,
        year_level_id,
        semester_id,
        course_id,
        Number(lec_fee) || 0,
        Number(lab_fee) || 0,
        Number(iscomputer_lab) || 0,
        Number(islaboratory_fee) || 0,
        Number(is_nstp) || 0,
        amount,
        id
      ]
    );

    res.json({ success: true, amount });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/program_tagging/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM program_tagging_table WHERE program_tagging_id = ?";
    const [result] = await db3.query(query, [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Program tag not found" });

    res.status(200).json({ message: "Program tag deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete program tag", details: err.message });
  }
});

module.exports = router;
