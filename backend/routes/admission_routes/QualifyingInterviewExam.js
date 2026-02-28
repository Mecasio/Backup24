const express = require("express");
const { db, db3 } = require("../database/database");

const router = express.Router();

// ================== INSERT INTERVIEW SCHEDULE ==================
router.post("/insert_interview_schedule", async (req, res) => {
  try {
    const {
      branch, // ✅ ADDED
      day_description,
      building_description,
      room_description,
      start_time,
      end_time,
      interviewer,
      room_quota,
      active_school_year_id, // optional if needed
    } = req.body;

    // Check conflicts for the same branch, building, room, and overlapping time
    const [conflicts] = await db.query(
      `SELECT *
       FROM interview_exam_schedule
       WHERE branch = ?
         AND day_description = ?
         AND building_description = ?
         AND room_description = ?
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
        end_time, start_time,
        end_time, start_time,
        start_time, end_time,
      ]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ error: "⚠️ Conflict: Room already booked for this branch." });
    }

    await db.query(
      `INSERT INTO interview_exam_schedule
       (branch, day_description, building_description, room_description, start_time, end_time, interviewer, room_quota, active_school_year_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch,
        day_description,
        building_description,
        room_description,
        start_time,
        end_time,
        interviewer,
        room_quota,
        active_school_year_id || null,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("INSERT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================== UPDATE INTERVIEW SCHEDULE ==================
router.put("/update_interview_schedule/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branch, // ✅ ADDED
      day_description,
      building_description,
      room_description,
      start_time,
      end_time,
      interviewer,
      room_quota,
    } = req.body;

    const [conflicts] = await db.query(
      `SELECT schedule_id
       FROM interview_exam_schedule
       WHERE schedule_id != ?
         AND branch = ?
         AND day_description = ?
         AND building_description = ?
         AND room_description = ?
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
        end_time, start_time,
        end_time, start_time,
        start_time, end_time,
      ]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ error: "⚠️ Conflict detected for this branch." });
    }

    await db.query(
      `UPDATE interview_exam_schedule
       SET branch = ?,
           day_description = ?,
           building_description = ?,
           room_description = ?,
           start_time = ?,
           end_time = ?,
           interviewer = ?,
           room_quota = ?
       WHERE schedule_id = ?`,
      [
        branch,
        day_description,
        building_description,
        room_description,
        start_time,
        end_time,
        interviewer,
        room_quota,
        id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ================== DELETE INTERVIEW SCHEDULE ==================
router.delete("/delete_interview_schedule/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM interview_exam_schedule WHERE schedule_id = ?",
      [id]
    );

    res.json({ success: true, message: "Schedule deleted successfully ✅" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET: interview schedules with applicant count, filtered by department if needed
router.get(
  "/interview_schedules_with_count/:yearId/:semesterId",
  async (req, res) => {
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
        ees.interviewer,
        ees.room_quota,
        ees.created_at,
        sy.year_id,
        sy.semester_id,
        COUNT(ea.applicant_id) AS current_occupancy
      FROM admission.interview_exam_schedule ees
      JOIN enrollment.active_school_year_table sy ON ees.active_school_year_id = sy.id
      LEFT JOIN admission.interview_applicants ea
        ON ees.schedule_id = ea.schedule_id
      WHERE sy.year_id = ? AND sy.semester_id = ?
      GROUP BY ees.schedule_id
      ORDER BY ees.day_description, ees.start_time;
    `,
        [yearId, semesterId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Interview Schedule Error:", err);
      res.status(500).send("Server error");
    }
  },
);

// 2. Get all interview schedules
router.get("/interview_schedules", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM interview_exam_schedule
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching interview schedules:", err);
    res.status(500).json({ error: "Failed to fetch interview schedules" });
  }
});

router.get("/interview_schedules_with_count", async (req, res) => {
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
        s.interviewer,
        s.room_quota,
        IFNULL(COUNT(ia.applicant_id), 0) AS current_occupancy,
        (s.room_quota - IFNULL(COUNT(ia.applicant_id), 0)) AS remaining_slots
      FROM interview_exam_schedule s
      LEFT JOIN interview_applicants ia
        ON s.schedule_id = ia.schedule_id
      GROUP BY
        s.schedule_id,
        s.day_description,
        s.building_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.interviewer,
        s.room_quota
      HAVING remaining_slots > 0      -- ✅ auto-hide full rooms
      ORDER BY s.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching interview schedules with count:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch interview schedules with count" });
  }
});

// 4. Unassign one applicant
router.post("/unassign_interview", async (req, res) => {
  const { applicant_number } = req.body;
  try {
    await db.query(
      `UPDATE interview_applicants
       SET schedule_id = NULL
       WHERE applicant_id = ?`,
      [applicant_number],
    );
    res.json({
      success: true,
      message: `Applicant ${applicant_number} unassigned.`,
    });
  } catch (err) {
    console.error("❌ Error unassigning interview applicant:", err);
    res.status(500).json({ error: "Failed to unassign applicant." });
  }
});

// 5. Unassign ALL applicants
router.post("/unassign_all_from_interview", async (req, res) => {
  const { schedule_id } = req.body;
  try {
    await db.query(
      `UPDATE interview_applicants
       SET schedule_id = NULL
       WHERE schedule_id = ?`,
      [schedule_id],
    );
    res.json({
      success: true,
      message: `All applicants unassigned from schedule ${schedule_id}.`,
    });
  } catch (err) {
    console.error("❌ Error unassigning all interview applicants:", err);
    res.status(500).json({ error: "Failed to unassign all applicants." });
  }
});

router.put("/api/interview_applicants/assign", async (req, res) => {
  const { applicant_numbers } = req.body;
  console.log(applicant_numbers);

  if (!Array.isArray(applicant_numbers) || applicant_numbers.length === 0) {
    return res.status(400).json({ message: "No applicant numbers provided" });
  }

  try {
    const [result] = await db3.query(
      `UPDATE admission.interview_applicants
       SET status = 'Accepted'
       WHERE applicant_id IN (?)`,
      [applicant_numbers],
    );

    res.json({
      message: `Updated ${result.affectedRows} applicants to Accepted.`,
      updated: applicant_numbers,
    });
  } catch (err) {
    console.error("Error accepting applicants:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put(
  "/api/interview_applicants/assign/:applicant_number",
  async (req, res) => {
    const { applicant_number } = req.params;

    if (!applicant_number) {
      return res.status(400).json({ message: "Missing applicant_number" });
    }

    try {
      const [result] = await db3.query(
        `UPDATE admission.interview_applicants
       SET status = 'Accepted'
       WHERE applicant_id = ?`,
        [applicant_number],
      );

      res.json({
        message: `Applicant ${applicant_number} updated to Accepted.`,
        affectedRows: result.affectedRows,
      });
    } catch (err) {
      console.error("Error accepting applicant:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.put(
  "/api/interview_applicants/unassign/:applicant_number",
  async (req, res) => {
    const { applicant_number } = req.params;

    if (!applicant_number) {
      return res.status(400).json({ message: "Missing applicant_number" });
    }

    try {
      const [result] = await db3.query(
        `UPDATE admission.interview_applicants
       SET status = 'Waiting List'
       WHERE applicant_id = ?`,
        [applicant_number],
      );

      res.json({
        message: `Applicant ${applicant_number} updated to Accepted.`,
        affectedRows: result.affectedRows,
      });
    } catch (err) {
      console.error("Error accepting applicant:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.put("/api/interview_applicants/unassign-all", async (req, res) => {
  const { applicant_numbers } = req.body;
  console.log(applicant_numbers);

  if (!Array.isArray(applicant_numbers) || applicant_numbers.length === 0) {
    return res.status(400).json({ message: "No applicant numbers provided" });
  }

  try {
    const [result] = await db3.query(
      `UPDATE admission.interview_applicants
       SET status = 'Waiting List'
       WHERE applicant_id IN (?)`,
      [applicant_numbers],
    );

    res.json({
      message: `Updated ${result.affectedRows} applicants to Accepted.`,
      updated: applicant_numbers,
    });
  } catch (err) {
    console.error("Error accepting applicants:", err);
    res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;
