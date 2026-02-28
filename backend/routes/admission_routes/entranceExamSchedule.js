const express = require("express");
const { db, db3 } = require("../database/database");

const router = express.Router();

// ================== INSERT EXAM SCHEDULE ==================
router.post("/insert_exam_schedule", async (req, res) => {
  try {
    const {
      branch,
      day_description,
      building_description,
      room_description,
      start_time,
      end_time,
      proctor,
      room_quota,
      active_school_year_id,
    } = req.body;

    // Check for conflicts
    const [conflicts] = await db.query(
      `SELECT * 
       FROM entrance_exam_schedule 
       WHERE branch = ?
         AND day_description = ?
         AND building_description = ?
         AND room_description = ?
         AND active_school_year_id = ?
         AND (
              (start_time < ? AND end_time > ?) OR
              (start_time < ? AND end_time > ?) OR
              (start_time >= ? AND end_time <= ?)
         )`,
      [
        branch,
        day_description,
        building_description,
        room_description,
        active_school_year_id,
        end_time, start_time,
        end_time, start_time,
        start_time, end_time,
      ]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ error: "⚠️ Room already exists for this branch on this date." });
    }

    // Insert new schedule
    await db.query(
      `INSERT INTO entrance_exam_schedule 
         (branch, day_description, building_description, room_description,
          start_time, end_time, proctor, room_quota, active_school_year_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [branch, day_description, building_description, room_description,
        start_time, end_time, proctor, room_quota, active_school_year_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================== UPDATE EXAM SCHEDULE ==================
router.put("/update_exam_schedule/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branch,
      day_description,
      building_description,
      room_description,
      start_time,
      end_time,
      proctor,
      room_quota,
      active_school_year_id
    } = req.body;

    // Check for conflicts excluding current schedule
    const [conflicts] = await db.query(
      `SELECT * FROM entrance_exam_schedule
       WHERE schedule_id != ?
         AND branch = ?
         AND day_description = ?
         AND building_description = ?
         AND room_description = ?
         AND active_school_year_id = ?
         AND (
              (start_time < ? AND end_time > ?) OR
              (start_time < ? AND end_time > ?) OR
              (start_time >= ? AND end_time <= ?)
         )`,
      [
        id,
        branch,
        day_description,
        building_description,
        room_description,
        active_school_year_id,
        end_time, start_time,
        end_time, start_time,
        start_time, end_time,
      ]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ error: "⚠️ Conflict: Room already booked." });
    }

    // Update schedule
    await db.query(
      `UPDATE entrance_exam_schedule
       SET branch=?, day_description=?, building_description=?, room_description=?,
           start_time=?, end_time=?, proctor=?, room_quota=?, active_school_year_id = ?
       WHERE schedule_id=?`,
      [branch, day_description, building_description, room_description,
       start_time, end_time, proctor, room_quota, active_school_year_id, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ================== DELETE EXAM SCHEDULE ==================
router.delete("/delete_exam_schedule/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM entrance_exam_schedule WHERE schedule_id = ?`,
      [id]
    );

    res.json({ success: true, message: "Schedule deleted successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ================== GET SCHEDULES WITH COUNT ==================
router.get("/exam_schedules_with_count", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.schedule_id,
        s.branch,
        s.day_description,
        s.building_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.proctor,
        s.room_quota,
        COUNT(ea.applicant_id) AS current_occupancy,
        (s.room_quota - COUNT(ea.applicant_id)) AS remaining_slots
      FROM admission.entrance_exam_schedule s
      LEFT JOIN admission.exam_applicants ea
        ON ea.schedule_id = s.schedule_id
      LEFT JOIN enrollment.active_school_year_table sy ON s.active_school_year_id = sy.id
      WHERE sy.astatus = 1
      GROUP BY s.schedule_id
      ORDER BY s.day_description, s.start_time
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching schedules with count:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================== GET SCHEDULES BY YEAR AND SEMESTER ==================
router.get("/exam_schedules_with_count/:yearId/:semesterId", async (req, res) => {
  const { yearId, semesterId } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT
        ees.schedule_id,
        ees.branch,
        ees.day_description,
        ees.building_description,
        ees.room_description,
        ees.start_time,
        ees.end_time,
        ees.proctor,
        ees.room_quota,
        ees.created_at,
        sy.year_id,
        sy.semester_id,
        SUBSTRING(ea.applicant_id, 5, 1) AS middle_code,
        COUNT(ea.applicant_id) AS current_occupancy
      FROM admission.entrance_exam_schedule ees
      JOIN enrollment.active_school_year_table sy ON ees.active_school_year_id = sy.id
      LEFT JOIN admission.exam_applicants ea
        ON ees.schedule_id = ea.schedule_id
      WHERE sy.year_id = ? AND sy.semester_id = ?
      GROUP BY ees.schedule_id
      ORDER BY ees.day_description, ees.start_time;
    `,
      [yearId, semesterId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Server error");
  }
});

// ================== UNASSIGN ALL APPLICANTS FROM A SCHEDULE ==================
router.post("/unassign_all_from_schedule", async (req, res) => {
  const { schedule_id } = req.body;
  try {
    await db.execute(
      "UPDATE exam_applicants SET schedule_id = NULL WHERE schedule_id = ?",
      [schedule_id]
    );
    res.json({
      success: true,
      message: `All applicants unassigned from schedule ${schedule_id}`,
    });
  } catch (err) {
    console.error("Error unassigning all applicants:", err);
    res.status(500).json({ error: "Failed to unassign all applicants" });
  }
});

// ================== UNASSIGN SINGLE APPLICANT ==================
router.post("/unassign_schedule", async (req, res) => {
  const { applicant_number } = req.body;

  if (!applicant_number) {
    return res.status(400).json({ error: "Applicant number is required." });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM admission.exam_applicants WHERE applicant_id = ?`,
      [applicant_number]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: `Applicant ${applicant_number} unassigned.`,
      });
    } else {
      res.status(404).json({ error: "Applicant not found or not assigned." });
    }
  } catch (err) {
    console.error("Error unassigning schedule:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
