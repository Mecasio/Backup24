const express = require("express");
const { db, db3 } = require("../database/database");

const router = express.Router();

// ASSIGN VERIFY DOCUMENTS SCHEDULE //
router.post("/create_verify_document_schedule", async (req, res) => {
  try {
    const {
      schedule_date,
      branch, // ✅ added
      building_description,
      room_description,
      start_time,
      end_time,
      evaluator,
      room_quota
    } = req.body;

    // ✅ Validate required fields
    if (
      !schedule_date ||
      !branch ||
      !building_description ||
      !room_description ||
      !start_time ||
      !end_time ||
      !room_quota
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // 🔍 CHECK DUPLICATE (NOW INCLUDING BRANCH)
    const [existing] = await db.query(
      `
      SELECT 1
      FROM verify_document_schedule
      WHERE schedule_date = ?
        AND branch = ?
        AND building_description = ?
        AND room_description = ?
      `,
      [schedule_date, branch, building_description, room_description]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "⚠️ Room already exists for this branch on this date."
      });
    }

    // ✅ INSERT
    const sql = `
      INSERT INTO verify_document_schedule
      (schedule_date, branch, building_description, room_description,
       start_time, end_time, evaluator, room_quota, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(sql, [
      schedule_date,
      branch,
      building_description,
      room_description,
      start_time,
      end_time,
      evaluator,
      room_quota
    ]);

    res.json({
      message: "Verify document schedule created successfully ✅",
      schedule_id: result.insertId
    });

  } catch (err) {
    console.error("❌ Error creating verify document schedule:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET verify document schedules
// GET verify document schedules
router.get("/verify_document_schedule_list", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        schedule_id,
        schedule_date,
        branch,   -- ✅ added
        building_description,
        room_description,
        start_time,
        end_time,
        evaluator,
        room_quota
      FROM verify_document_schedule
      ORDER BY schedule_date, start_time
    `);

    res.json(rows);

  } catch (err) {
    console.error("❌ Error fetching verify document schedules:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// UPDATE verify document schedule
// UPDATE verify document schedule
router.put("/update_verify_document_schedule/:schedule_id", async (req, res) => {
  try {
    const { schedule_id } = req.params;

    const {
      schedule_date,
      branch, // ✅ added
      building_description,
      room_description,
      start_time,
      end_time,
      evaluator,
      room_quota
    } = req.body;

    if (
      !schedule_date ||
      !branch ||
      !building_description ||
      !room_description ||
      !start_time ||
      !end_time ||
      !room_quota
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const sql = `
      UPDATE verify_document_schedule
      SET schedule_date = ?, 
          branch = ?,   -- ✅ added
          building_description = ?, 
          room_description = ?, 
          start_time = ?, 
          end_time = ?, 
          evaluator = ?, 
          room_quota = ?
      WHERE schedule_id = ?
    `;

    await db.query(sql, [
      schedule_date,
      branch,
      building_description,
      room_description,
      start_time,
      end_time,
      evaluator,
      room_quota,
      schedule_id
    ]);

    res.json({ message: "Schedule updated successfully ✅" });

  } catch (err) {
    console.error("❌ Error updating verify document schedule:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// DELETE verify document schedule
router.delete("/delete_verify_document_schedule/:schedule_id", async (req, res) => {
  try {
    const { schedule_id } = req.params;

    const [result] = await db.query(
      `DELETE FROM verify_document_schedule WHERE schedule_id = ?`,
      [schedule_id]
    );

    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/verified-for-verify-schedule", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT DISTINCT
        p.person_id,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.extension,
        p.emailAddress,
        p.program,
        p.created_at,
        a.applicant_number,
        SUBSTRING(a.applicant_number, 5, 1) AS middle_code,
        ea.schedule_id,
        ea.email_sent,
        ees.room_description,
        ees.start_time,
        ees.end_time
      FROM admission.person_table AS p
      LEFT JOIN admission.applicant_numbering_table AS a 
        ON p.person_id = a.person_id
      LEFT JOIN admission.verify_applicants AS ea 
        ON a.applicant_number = ea.applicant_id
      LEFT JOIN admission.verify_document_schedule AS ees
        ON ea.schedule_id = ees.schedule_id
      LEFT JOIN admission.person_status_table AS ps 
        ON p.person_id = ps.person_id
      WHERE p.person_id IN (
        SELECT ru.person_id
        FROM admission.requirement_uploads ru
        WHERE ru.document_status = 'Documents Verified & ECAT'
          AND ru.requirements_id IN (1,2,3,4)
        GROUP BY ru.person_id
        HAVING COUNT(DISTINCT ru.requirements_id) = 4
      )
      AND (ea.email_sent IS NULL OR ea.email_sent = 0)   -- ⬅️ only show those not yet emailed
      ORDER BY p.last_name ASC, p.first_name ASC;
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching verified ECAT applicants:", err);
    res.status(500).send("Server error");
  }
});

router.post("/unassign_verify", async (req, res) => {
  const { applicant_number } = req.body;

  try {
    await db.query(
      `UPDATE verify_applicants SET schedule_id = NULL WHERE applicant_id = ?`,
      [applicant_number]
    );

    res.json({
      success: true,
      message: `Applicant ${applicant_number} unassigned from verification.`,
    });
  } catch (err) {
    console.error("❌ Unassign verify error:", err);
    res.status(500).json({ error: "Failed to unassign applicant." });
  }
});

router.post("/unassign_all_from_verify", async (req, res) => {
  const { schedule_id } = req.body;

  try {
    await db.query(
      `UPDATE verify_applicants SET schedule_id = NULL WHERE schedule_id = ?`,
      [schedule_id]
    );

    res.json({
      success: true,
      message: `All applicants unassigned from verify schedule ${schedule_id}.`,
    });
  } catch (err) {
    console.error("❌ Unassign all verify error:", err);
    res.status(500).json({ error: "Failed to unassign all applicants." });
  }
});

router.get("/verify_document_schedules_with_count", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.schedule_id,
        s.branch,
        s.schedule_date,
        s.building_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.evaluator,
        s.room_quota,
        s.created_at,
        COUNT(va.applicant_id) AS current_occupancy,
        (s.room_quota - COUNT(va.applicant_id)) AS remaining_slots
      FROM verify_document_schedule s
      LEFT JOIN verify_applicants va
        ON s.schedule_id = va.schedule_id
      GROUP BY s.schedule_id
      ORDER BY s.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching verify schedules with count:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/mark-verify-email-sent", async (req, res) => {
  const { applicant_number } = req.body;

  try {
    await db.query(
      `UPDATE verify_applicants 
       SET email_sent = 1 
       WHERE applicant_id = ?`,
      [applicant_number]
    );

    res.json({
      success: true,
      message: "Email marked as sent",
    });

  } catch (err) {
    console.error("❌ Mark email sent error:", err);
    res.status(500).json({ error: "Failed to update email status" });
  }
});

router.get("/verify-document-applicants", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        schedule_id,
        applicant_id AS applicant_number,
        email_sent
      FROM verify_applicants
      WHERE email_sent = 0
      ORDER BY id DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/verify_schedules_with_count", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.schedule_id,
        s.schedule_date,
        s.building_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.evaluator,
        s.room_quota,
        IFNULL(COUNT(a.applicant_id), 0) AS current_occupancy,
        (s.room_quota - IFNULL(COUNT(a.applicant_id), 0)) AS remaining_slots
      FROM verify_document_schedule s
      LEFT JOIN verify_applicants a
        ON s.schedule_id = a.schedule_id
      GROUP BY 
        s.schedule_id,
        s.schedule_date,
        s.building_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.evaluator,
        s.room_quota
      ORDER BY s.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching verify schedules:", err);
    res.status(500).json({ error: "Failed to fetch verify schedules" });
  }
});

router.get("/evaluator-applicants", async (req, res) => {
  const { query, schedule_id } = req.query;

  try {
    const [schedules] = await db.query(
      `
      SELECT *
      FROM verify_document_schedule
      WHERE evaluator LIKE ?
      ${schedule_id ? "AND schedule_id = ?" : ""}
      `,
      schedule_id ? [`%${query}%`, schedule_id] : [`%${query}%`]
    );

    if (schedules.length === 0) return res.json([]);

    const results = await Promise.all(
      schedules.map(async (schedule) => {
        const [applicants] = await db.query(
          `
          SELECT 
            va.applicant_id AS applicant_number,
            va.email_sent,
            pt.last_name,
            pt.first_name,
            pt.middle_name,
            pt.program,
            s.building_description,
            s.room_description
          FROM verify_applicants va
          JOIN applicant_numbering_table an 
            ON an.applicant_number = va.applicant_id
          JOIN person_table pt 
            ON pt.person_id = an.person_id
          JOIN verify_document_schedule s
            ON s.schedule_id = va.schedule_id
        WHERE va.schedule_id = ?
AND (va.email_sent IS NULL OR va.email_sent = 1)

          `,
          [schedule.schedule_id]
        );

        return { schedule, applicants };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching evaluator applicants:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/unassign_verify_evaluator_applicant_list", async (req, res) => {
  const { applicant_number } = req.body;

  if (!applicant_number) {
    return res.status(400).json({ message: "Missing applicant_number" });
  }

  try {
    await db.query(
      `
      UPDATE verify_applicants
      SET schedule_id = NULL,
          email_sent = 0
      WHERE applicant_id = ?
      `,
      [applicant_number]
    );

    res.json({
      success: true,
      message: `Applicant ${applicant_number} removed from verify schedule.`,
    });
  } catch (err) {
    console.error("❌ Unassign verify error:", err);
    res.status(500).json({ error: "Failed to unassign applicant." });
  }
});

router.get("/verify_schedules", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.schedule_id,
        s.schedule_date,
        s.building_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.evaluator,
        s.room_quota,
        COUNT(va.applicant_id) AS assigned_count
      FROM verify_document_schedule s
      LEFT JOIN verify_applicants va
        ON s.schedule_id = va.schedule_id
      GROUP BY s.schedule_id
      ORDER BY s.schedule_id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching verify schedules:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/verify_schedules_with_count/:yearId/:semesterId", async (req, res) => {
  const { yearId, semesterId } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        s.schedule_id,
        s.schedule_date,
        s.building_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.evaluator,
        s.room_quota,
        s.created_at,
        sy.year_id,
        sy.semester_id,
        IFNULL(COUNT(a.applicant_id), 0) AS current_occupancy,
        (s.room_quota - IFNULL(COUNT(a.applicant_id), 0)) AS remaining_slots
      FROM verify_document_schedule s
      JOIN enrollment.active_school_year_table sy ON s.active_school_year_id = sy.id
      LEFT JOIN verify_applicants a
        ON s.schedule_id = a.schedule_id
      WHERE sy.year_id = ? AND sy.semester_id = ?
      GROUP BY s.schedule_id
      ORDER BY s.schedule_date, s.start_time
    `,
      [yearId, semesterId]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching verify schedules:", err);
    res.status(500).json({ error: "Failed to fetch verify schedules" });
  }
});

module.exports = router;