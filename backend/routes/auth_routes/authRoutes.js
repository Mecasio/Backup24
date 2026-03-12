const express = require('express')
const webtoken = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { db, db3 } = require('../database/database');
const router = express.Router()

let otpStore = {};
let loginAttempts = {};
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const calculateAge = (birthDate) => {
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
};

const AUTH_ACTION = "AUTH";

function buildAuthMessage({ outcome, role, actorId, reason }) {
  const safeActor = actorId || "unknown";
  const safeRole = role || "unknown";
  const base = `LOGIN ${outcome} - ${safeRole} (${safeActor})`;
  return reason ? `${base} | Reason: ${reason}` : base;
}

function getAuthSeverity({ outcome }) {
  if (outcome === "LOCKED") return "CRITICAL";
  if (outcome === "FAILED") return "WARN";
  if (outcome === "SUCCESS_AFTER_FAILURES") return "WARN";
  return "INFO";
}

async function getApplicantNumberByPersonId(personId) {
  if (!personId) return null;
  try {
    const [rows] = await db.query(
      "SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ? LIMIT 1",
      [personId],
    );
    return rows?.[0]?.applicant_number || null;
  } catch (err) {
    console.error("Applicant number lookup failed:", err);
    return null;
  }
}

async function insertAuditLog({
  actorId,
  role,
  resourceType,
  resource,
  outcome,
  reason,
  messageOverride,
}) {
  try {
    const message = messageOverride || buildAuthMessage({
      outcome,
      role,
      actorId,
      reason,
    });

    await db.query(
      `INSERT INTO audit_logs
        (actor_id, role, action, resource_type, resource, message, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        actorId || "unknown",
        role || "unknown",
        AUTH_ACTION,
        resourceType || "unknown",
        resource || "unknown",
        message,
        getAuthSeverity({ outcome }),
      ],
    );
  } catch (err) {
    console.error("Audit log insert failed:", err);
  }
}

// POST REGISTER (APPLICANT ONLY)
router.post("/register", async (req, res) => {
  const {
    email,
    password,
    campus,
    otp,
    firstName,
    middleName,
    lastName,
    birthday,
    academicProgram
  } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  const [existingPerson] = await db.query(
    `SELECT * FROM person_table 
   WHERE first_name = ? 
   AND last_name = ? 
   AND birthOfDate = ?`,
    [firstName.trim(), lastName.trim(), birthday]
  );

  if (existingPerson.length > 0) {
    await insertAuditLog({
      actorId: normalizedEmail || "unknown",
      role: "applicant",
      resourceType: "applicant",
      resource: normalizedEmail || "unknown",
      outcome: "FAILED",
      messageOverride: `REGISTER FAILED - ${normalizedEmail || "unknown"}`,
      reason: "Applicant already exists",
    });
    return res.status(400).json({
      success: false,
      message: "This applicant already exists in the system."
    });
  }

  if (!normalizedEmail || !password) {
    await insertAuditLog({
      actorId: normalizedEmail || "unknown",
      role: "applicant",
      resourceType: "applicant",
      resource: normalizedEmail || "unknown",
      outcome: "FAILED",
      messageOverride: `REGISTER FAILED - ${normalizedEmail || "unknown"}`,
      reason: "Missing required fields",
    });
    return res.json({ success: false, message: "Please fill up all required fields" });
  }

  // ⭐⭐⭐ OTP VALIDATION ⭐⭐⭐
  const stored = otpStore[normalizedEmail];
  const now = Date.now();

  if (!stored) {
    await insertAuditLog({
      actorId: normalizedEmail || "unknown",
      role: "applicant",
      resourceType: "applicant",
      resource: normalizedEmail || "unknown",
      outcome: "FAILED",
      messageOverride: `REGISTER FAILED - ${normalizedEmail || "unknown"}`,
      reason: "No OTP request found",
    });
    return res.status(400).json({ success: false, message: "No OTP request found for this email" });
  }

  if (stored.expiresAt < now) {
    delete otpStore[normalizedEmail];
    await insertAuditLog({
      actorId: normalizedEmail || "unknown",
      role: "applicant",
      resourceType: "applicant",
      resource: normalizedEmail || "unknown",
      outcome: "FAILED",
      messageOverride: `REGISTER FAILED - ${normalizedEmail || "unknown"}`,
      reason: "OTP expired",
    });
    return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
  }

  if (stored.otp !== otp.trim()) {
    await insertAuditLog({
      actorId: normalizedEmail || "unknown",
      role: "applicant",
      resourceType: "applicant",
      resource: normalizedEmail || "unknown",
      outcome: "FAILED",
      messageOverride: `REGISTER FAILED - ${normalizedEmail || "unknown"}`,
      reason: "Invalid OTP",
    });
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  delete otpStore[normalizedEmail];


  let person_id = null;

  try {
    const [[company]] = await db.query(
      "SELECT company_name FROM company_settings WHERE id = 1"
    );
    const companyName = company?.company_name || "Main Campus";

    const hashedPassword = await bcrypt.hash(password, 10);

    const [existingUser] = await db.query(
      "SELECT * FROM user_accounts WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUser.length > 0) {
      await insertAuditLog({
        actorId: normalizedEmail || "unknown",
        role: "applicant",
        resourceType: "applicant",
        resource: normalizedEmail || "unknown",
        outcome: "FAILED",
        messageOverride: `REGISTER FAILED - ${normalizedEmail || "unknown"}`,
        reason: "Email already registered",
      });
      return res.json({ success: false, message: "Email is already registered" });
    }

    // ⭐⭐⭐ FIX: STORE EMAIL INTO person_table.emailAddress ⭐⭐⭐
    const age = calculateAge(birthday);

    const [personResult] = await db.query(
      `INSERT INTO person_table 
(campus, emailAddress, first_name, middle_name, last_name, birthOfDate, age, academicProgram, termsOfAgreement, current_step)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [
        campus,
        normalizedEmail,
        firstName.trim(),
        middleName?.trim() || null,
        lastName.trim(),
        birthday,
        age,
        academicProgram
      ]
    );

    person_id = personResult.insertId;

    await db.query(
      `INSERT INTO user_accounts (person_id, email, password, role, status)
       VALUES (?, ?, ?, 'applicant', ?)`,
      [person_id, normalizedEmail, hashedPassword, 1]
    );

    // ------------------
    // Applicant Numbering
    // ------------------
    const [activeYearResult] = await db3.query(`
      SELECT yt.year_description, st.semester_code
      FROM active_school_year_table sy
      JOIN year_table yt ON yt.year_id = sy.year_id
      JOIN semester_table st ON st.semester_id = sy.semester_id
      WHERE sy.astatus = 1
      LIMIT 1
    `);

    if (activeYearResult.length === 0) {
      throw new Error("No active school year/semester found.");
    }

    const year = String(activeYearResult[0].year_description).split("-")[0];
    const semCode = activeYearResult[0].semester_code;

    const [countRes] = await db.query(
      "SELECT COUNT(*) AS count FROM applicant_numbering_table"
    );

    const padded = String(countRes[0].count + 1).padStart(5, "0");
    const applicant_number = `${year}${semCode}${padded}`;

    await db.query(
      "INSERT INTO applicant_numbering_table (applicant_number, person_id) VALUES (?, ?)",
      [applicant_number, person_id]
    );

    // QR Codes
    const qrData = `${process.env.DB_HOST_LOCAL}:5173/examination_profile/${applicant_number}`;
    const qrData2 = `${process.env.DB_HOST_LOCAL}:5173/applicant_profile/${applicant_number}`;
    const qrFilename = `${applicant_number}_qrcode.png`;
    const qrFilename2 = `${applicant_number}_qrcode2.png`;
    const qrPath = path.join(__dirname, "../../uploads/QrCodeGenerated", qrFilename);
    const qrPath2 = path.join(__dirname, "../../uploads/QrCodeGenerated", qrFilename2);

    await QRCode.toFile(qrPath, qrData, {
      color: { dark: "#000", light: "#FFF" },
      width: 300,
    });

    await QRCode.toFile(qrPath2, qrData2, {
      color: { dark: "#000", light: "#FFF" },
      width: 300,
    });

    await db.query(
      "UPDATE applicant_numbering_table SET qr_code = ? WHERE applicant_number = ?",
      [qrFilename, applicant_number]
    );

    await db.query(
      `INSERT INTO person_status_table 
       (person_id, applicant_id, exam_status, requirements, residency, student_registration_status, exam_result, hs_ave, qualifying_result, interview_result)
       VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`,
      [person_id, applicant_number]
    );

    await db.query(
      `INSERT INTO interview_applicants (schedule_id, applicant_id, email_sent, status)
       VALUES (?, ?, 0, 'Waiting List')`,
      [null, applicant_number]
    );

    res.status(201).json({
      success: true,
      message: "Registered Successfully",
      person_id,
      applicant_number,
      campus: campus,
    });

    await insertAuditLog({
      actorId: normalizedEmail || "unknown",
      role: "applicant",
      resourceType: "applicant",
      resource: normalizedEmail || "unknown",
      outcome: "SUCCESS",
      messageOverride: `REGISTER SUCCESS - ${normalizedEmail || "unknown"}`,
    });

  } catch (error) {
    if (person_id) {
      await db.query("DELETE FROM person_table WHERE person_id = ?", [person_id]);
    }
    console.log(error);
    await insertAuditLog({
      actorId: normalizedEmail || "unknown",
      role: "applicant",
      resourceType: "applicant",
      resource: normalizedEmail || "unknown",
      outcome: "FAILED",
      messageOverride: `REGISTER FAILED - ${normalizedEmail || "unknown"} `,
      reason: "Internal server error",
    });
    res.json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
});

// POST LOGIN (FACULTY, ADMIN, STFF AND STUDENT)
router.post("/login", async (req, res) => {
  const { email: loginCredentials, password } = req.body;

  if (!loginCredentials || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const now = Date.now();
  const record = loginAttempts[loginCredentials] || { count: 0, lockUntil: null };

  if (record.lockUntil && record.lockUntil > now) {
    const sec = Math.ceil((record.lockUntil - now) / 1000);
    await insertAuditLog({
      actorId: loginCredentials,
      role: "unknown",
      resourceType: "unknown",
      resource: loginCredentials,
      outcome: "LOCKED",
      reason: `Account locked (Attempt ${record.count || 3} out of 3)`,
    });
    return res.json({ success: false, message: `Too many failed attempts. Try again in ${sec}s.` });
  }

  try {
    const query = `
      (
        SELECT 
          ua.id AS account_id,
          ua.person_id,
          ua.email,
          ua.password,
          ua.employee_id,
          snt.student_number AS student_number,
          ua.role,
          ua.require_otp,
          NULL AS profile_image,
          NULL AS fname,
          NULL AS mname,
          NULL AS lname,
          ua.status AS status,
          'user' AS source,
          ua.dprtmnt_id,
          dt.dprtmnt_name
        FROM user_accounts AS ua
        LEFT JOIN dprtmnt_table AS dt ON ua.dprtmnt_id = dt.dprtmnt_id
        LEFT JOIN student_numbering_table AS snt ON snt.person_id = ua.person_id
        WHERE (ua.email = ? OR snt.student_number = ?)
      )
      UNION ALL
      (
        SELECT 
          ua.prof_id AS account_id,
          ua.person_id,
          ua.email,
          ua.password,
          ua.employee_id,
          NULL AS student_number,
          ua.role,
          ua.require_otp,
          ua.profile_image,
          ua.fname,
          ua.mname,
          ua.lname,
          ua.status,
          'prof' AS source,
          NULL AS dprtmnt_id,
          NULL AS dprtmnt_name
        FROM prof_table AS ua
        WHERE ua.email = ?
      );
    `;

    const [results] = await db3.query(query, [
      loginCredentials,
      loginCredentials,
      loginCredentials,
    ]);

    if (results.length === 0) {
      record.count++;
      if (record.count >= 3) {
        record.lockUntil = now + 3 * 60 * 1000;
        loginAttempts[loginCredentials] = record;
        await insertAuditLog({
          actorId: loginCredentials,
          role: "unknown",
          resourceType: "unknown",
          resource: loginCredentials,
          outcome: "LOCKED",
          reason: `Invalid email or student number (Attempt ${record.count} out of 3)`,
        });
        return res.json({ success: false, message: "Too many failed attempts. Locked for 3 minutes." });
      }
      loginAttempts[loginCredentials] = record;
      await insertAuditLog({
        actorId: loginCredentials,
        role: "unknown",
        resourceType: "unknown",
        resource: loginCredentials,
        outcome: "FAILED",
        reason: `Invalid email or student number (Attempt ${record.count} out of 3)`,
      });
      return res.json({ success: false, message: "Invalid email or student number" });
    }

    const user = results[0];
    const actorId = user.employee_id || user.student_number || user.person_id || user.email;
    const resourceType = user.employee_id ? "employee" : "student";
    const resource = user.employee_id || user.student_number || user.person_id || user.email;

    // ======================================
    // 🔥 FIX: normalize require_otp properly
    // ======================================
    user.require_otp = Number(user.require_otp) === 1;

    // password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      record.count++;
      let remaining = 3 - record.count;

      if (record.count >= 3) {
        record.lockUntil = now + 3 * 60 * 1000;
        loginAttempts[loginCredentials] = record;
        await insertAuditLog({
          actorId,
          role: user.role,
          resourceType,
          resource,
          outcome: "LOCKED",
          reason: `Invalid password (Attempt ${record.count} out of 3)`,
        });
        return res.json({ success: false, message: "Too many failed attempts. Locked for 3 minutes." });
      }

      loginAttempts[loginCredentials] = record;
      await insertAuditLog({
        actorId,
        role: user.role,
        resourceType,
        resource,
        outcome: "FAILED",
        reason: `Invalid password (Attempt ${record.count} out of 3)`,
      });
      return res.json({
        success: false,
        message: `Invalid Password or Email, You have ${remaining} attempt(s) remaining.`,
        remaining,
      });
    }

    // status check
    if (user.status === 0) {
      await insertAuditLog({
        actorId,
        role: user.role,
        resourceType,
        resource,
        outcome: "FAILED",
        reason: "Inactive account",
      });
      return res.json({ success: false, message: "The user didn't exist or account is inactive" });
    }

    const [rows] = await db3.query(
      "SELECT * FROM page_access WHERE user_id = ?"
      , [user.employee_id])


    const accessList = rows.map(r => Number(r.page_id));
    const failureCount = record.count || 0;

    // JWT
    const token = webtoken.sign(
      {
        person_id: user.person_id,
        employee_id: user.employee_id,
        email: user.email,
        role: user.role,
        department: user.dprtmnt_id,
        accessList,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // ======================================
    // 🔥 FINAL FIX: correct OTP condition
    // ======================================
    if (user.require_otp === true) {
      const otp = generateOTP();

      otpStore[user.email] = {
        otp,
        expiresAt: now + 5 * 60 * 1000,
        cooldownUntil: now + 5 * 60 * 1000,
      };
      otpStore[user.email].authFailureCount = failureCount;
      otpStore[user.email].auditContext = {
        actorId,
        role: user.role,
        resourceType,
        resource,
      };
      delete loginAttempts[loginCredentials];

      try {
        const [companyResult] = await db.query("SELECT short_term FROM company_settings WHERE id = 1");
        const shortTerm = companyResult?.[0]?.short_term || "School";

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"${shortTerm} - OTP Verification" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `${shortTerm} OTP Code`,
          text: `Your OTP is: ${otp} (Valid for 5 minutes)`,
        });
      } catch (err) {
        console.error("OTP Email Error:", err.message);
      }

      const [rows] = await db3.query(
        "SELECT * FROM page_access WHERE user_id = ?"
        , [user.employee_id])

      const accessList = rows.map(r => Number(r.page_id));

      return res.json({
        success: true,
        requireOtp: true,
        message: "OTP sent to your email",
        token,
        email: user.email,
        role: user.role,
        person_id: user.person_id,
        employee_id: user.employee_id,
        department: user.dprtmnt_id,
        accessList,
      });
    }

    // NO OTP REQUIRED
    const successOutcome = failureCount >= 2 ? "SUCCESS_AFTER_FAILURES" : "SUCCESS";
    await insertAuditLog({
      actorId,
      role: user.role,
      resourceType,
      resource,
      outcome: successOutcome,
    });
    delete loginAttempts[loginCredentials];
    return res.json({
      success: true,
      requireOtp: false,
      message: "Login success. OTP not required.",
      token,
      email: user.email,
      role: user.role,
      person_id: user.person_id,
      employee_id: user.employee_id,
      department: user.dprtmnt_id,
      accessList,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});

// POST LOGIN (APPLICANT ONLY)
router.post("/login_applicant", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const loginKey = email.trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts[loginKey] || { count: 0, lockUntil: null };

  if (record.lockUntil && record.lockUntil > now) {
    const sec = Math.ceil((record.lockUntil - now) / 1000);
    await insertAuditLog({
      actorId: loginKey,
      role: "applicant",
      resourceType: "applicant",
      resource: loginKey,
      outcome: "LOCKED",
      reason: `Account locked (Attempt ${record.count || 3} out of 3)`,
    });
    return res.json({ success: false, message: `Too many failed attempts. Try again in ${sec}s.` });
  }

  try {
    // ✅ Fetch user
    const query = `
      SELECT * FROM user_accounts AS ua
      LEFT JOIN person_table AS pt ON pt.person_id = ua.person_id
      WHERE email = ?
    `;

    const [results] = await db.query(query, [email]);

    if (results.length === 0) {
      record.count++;
      if (record.count >= 3) {
        record.lockUntil = now + 3 * 60 * 1000;
        loginAttempts[loginKey] = record;
        await insertAuditLog({
          actorId: loginKey,
          role: "applicant",
          resourceType: "applicant",
          resource: loginKey,
          outcome: "LOCKED",
          reason: `Invalid email or password (Attempt ${record.count} out of 3)`,
        });
        return res.json({ success: false, message: "Too many failed attempts. Locked for 3 minutes." });
      }
      loginAttempts[loginKey] = record;
      await insertAuditLog({
        actorId: loginKey,
        role: "applicant",
        resourceType: "applicant",
        resource: loginKey,
        outcome: "FAILED",
        reason: `Invalid email or password (Attempt ${record.count} out of 3)`,
      });
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = results[0];
    const existingApplicantNumber = await getApplicantNumberByPersonId(user.person_id);
    const applicantActor = existingApplicantNumber || loginKey;
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      record.count++;
      if (record.count >= 3) {
        record.lockUntil = now + 3 * 60 * 1000;
        loginAttempts[loginKey] = record;
        await insertAuditLog({
          actorId: applicantActor,
          role: "applicant",
          resourceType: "applicant",
          resource: applicantActor,
          outcome: "LOCKED",
          reason: `Invalid password (Attempt ${record.count} out of 3)`,
        });
        return res.json({ success: false, message: "Too many failed attempts. Locked for 3 minutes." });
      }
      loginAttempts[loginKey] = record;
      await insertAuditLog({
        actorId: applicantActor,
        role: "applicant",
        resourceType: "applicant",
        resource: applicantActor,
        outcome: "FAILED",
        reason: `Invalid password (Attempt ${record.count} out of 3)`,
      });
      return res.json({ success: false, message: "Invalid Password or Email" });
    }
    if (user.status === 0) {
      await insertAuditLog({
        actorId: applicantActor,
        role: "applicant",
        resourceType: "applicant",
        resource: applicantActor,
        outcome: "FAILED",
        reason: "Inactive account",
      });
      return res.json({ success: false, message: "The user didn't exist or is inactive" });
    }

    const person_id = user.person_id;

    // ✅ Check if applicant_number already exists
    const [existing] = await db.query(
      "SELECT applicant_number, qr_code FROM applicant_numbering_table WHERE person_id = ?",
      [person_id]
    );

    let applicantNumber, qrFilename;

    if (existing.length === 0) {
      // ✅ No applicant_number yet → create one
      const [activeYear] = await db3.query(`
        SELECT yt.year_description, st.semester_description, st.semester_code
        FROM active_school_year_table AS sy
        JOIN year_table AS yt ON yt.year_id = sy.year_id
        JOIN semester_table AS st ON st.semester_id = sy.semester_id
        WHERE sy.astatus = 1
        LIMIT 1
      `);

      if (activeYear.length === 0) {
        return res.status(500).json({ message: "No active school year found" });
      }

      const year = String(activeYear[0].year_description).split("-")[0];
      const semCode = activeYear[0].semester_code;

      const [countRes] = await db.query("SELECT COUNT(*) AS count FROM applicant_numbering_table");
      const padded = String(countRes[0].count + 1).padStart(5, "0");
      applicantNumber = `${year}${semCode}${padded}`;

      // Insert applicant_number
      await db.query(
        "INSERT INTO applicant_numbering_table (applicant_number, person_id) VALUES (?, ?)",
        [applicantNumber, person_id]
      );

      // Generate QR code
      const qrData = `${process.env.DB_HOST_LOCAL}:5173/examination_profile/${applicantNumber}`;
      qrFilename = `${applicantNumber}_qrcode.png`;
      const qrPath = path.join(__dirname, "uploads", qrFilename);

      await QRCode.toFile(qrPath, qrData, {
        color: { dark: "#000", light: "#FFF" },
        width: 300
      });

      // Save QR in DB
      await db.query(
        "UPDATE applicant_numbering_table SET qr_code = ? WHERE applicant_number = ?",
        [qrFilename, applicantNumber]
      );
    } else {
      // ✅ Already has applicant_number + QR
      applicantNumber = existing[0].applicant_number;
      qrFilename = existing[0].qr_code;
    }

    // ✅ Generate JWT token
    const token = webtoken.sign(
      { person_id: user.person_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const successOutcome = record.count >= 2 ? "SUCCESS_AFTER_FAILURES" : "SUCCESS";
    await insertAuditLog({
      actorId: applicantNumber,
      role: user.role,
      resourceType: "applicant",
      resource: applicantNumber,
      outcome: successOutcome,
    });
    delete loginAttempts[loginKey];

    res.json({
      message: "Login successful",
      token,
      success: true,
      email: user.email,
      registered_email: user.emailAddress,
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name,
      birthday: user.birthOfDate,
      birthOfDate: user.birthOfDate,
      academicProgram: user.academicProgram,
      role: user.role,
      person_id: user.person_id,
      applicant_number: applicantNumber,
      qr_code: qrFilename
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// POST VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  const now = Date.now();
  const stored = otpStore[email];
  const record = loginAttempts[email] || { count: 0, lockUntil: null };

  if (record.lockUntil && record.lockUntil > now) {
    const secondsLeft = Math.ceil((record.lockUntil - now) / 1000);
    return res.status(429).json({
      message: `Too many failed attempts. Try again in ${secondsLeft}s.`,
    });
  }

  if (!stored) {
    return res.status(400).json({ message: "No OTP request found for this email" });
  }

  if (stored.expiresAt < now) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  if (stored.otp !== otp.trim()) {
    record.count++;
    if (record.count >= 3) {
      record.lockUntil = now + 3 * 60 * 1000;
      loginAttempts[email] = record;
      return res.status(429).json({
        message: "Too many failed OTP attempts. Locked for 3 minutes.",
      });
    }
    loginAttempts[email] = record;
    return res.status(400).json({ message: "Invalid OTP. Please try again." });
  }

  const failureCount = stored?.authFailureCount || 0;
  const auditContext = stored?.auditContext || {};
  const successOutcome = failureCount >= 2 ? "SUCCESS_AFTER_FAILURES" : "SUCCESS";
  await insertAuditLog({
    actorId: auditContext.actorId || email,
    role: auditContext.role || "unknown",
    resourceType: auditContext.resourceType || "unknown",
    resource: auditContext.resource || email,
    outcome: successOutcome,
  });

  delete otpStore[email];
  delete loginAttempts[email];

  res.json({ message: "OTP verified successfully" });
});

// POST REQUEST OTP 
router.post("/request-otp", async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required" });
  }

  // ❌ Prevent already registered emails
  const [existingUser] = await db.query(
    "SELECT * FROM user_accounts WHERE email = ?",
    [normalizedEmail]
  );

  if (existingUser.length > 0) {
    return res.status(400).json({ message: "This Account is already registered and cannot be used again." });
  }

  const now = Date.now();
  const existing = otpStore[normalizedEmail];

  if (existing && existing.cooldownUntil > now) {
    const secondsLeft = Math.ceil((existing.cooldownUntil - now) / 1000);
    return res.status(429).json({ message: `OTP already sent. Please wait ${secondsLeft}s.` });
  }

  const otp = generateOTP();
  otpStore[normalizedEmail] = {
    otp,
    expiresAt: now + 5 * 60 * 1000,
    cooldownUntil: now + 60 * 1000,
  };

  try {
    const [settings] = await db.query("SELECT short_term FROM company_settings LIMIT 1");
    const shortTerm = settings?.[0]?.short_term || "School";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${shortTerm} OTP Verification" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: `${shortTerm} OTP Code`,
      text: `Your ${shortTerm} OTP is: ${otp}. It is valid for 5 minutes.`,
    });

    console.log(`✅ OTP sent to ${normalizedEmail}: ${otp}`);
    res.json({ message: `${shortTerm} OTP sent to your email` });

  } catch (err) {
    console.error("⚠️ OTP email error:", err);
    delete otpStore[email];
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ========================== OTP SETTINGS ===========================

// GET OTP SETTING (1 or 0)
router.get("/get-otp-setting/:person_id", async (req, res) => {
  const { person_id } = req.params;

  try {
    const [rows] = await db3.query(
      "SELECT require_otp FROM user_accounts WHERE person_id = ?",
      [person_id]
    );

    if (rows.length === 0) {
      return res.json({ require_otp: 0 });
    }

    res.json({ require_otp: rows[0].require_otp });
  } catch (err) {
    console.error("OTP fetch error:", err);
    res.status(500).json({ message: "Server error loading OTP setting" });
  }
});

// GET OTP SETTING FOR ALL ROLES
router.get("/get-otp-setting/:type/:person_id", async (req, res) => {
  const { type, person_id } = req.params;

  if (!person_id || !type) return res.status(400).json({ message: "Missing parameters" });

  let table;
  if (type === "user") table = "user_accounts";
  else if (type === "prof") table = "prof_table";
  else return res.status(400).json({ message: "Invalid type" });

  try {
    const [rows] = await db3.query(
      `SELECT require_otp FROM ${table} WHERE person_id = ? LIMIT 1`,
      [person_id]
    );

    if (rows.length === 0) return res.json({ require_otp: 0 });

    res.json({ require_otp: Number(rows[0].require_otp) === 1 ? 1 : 0 });
  } catch (err) {
    console.error("OTP fetch error:", err);
    res.status(500).json({ message: "Server error loading OTP setting" });
  }
});

// POST TOGGLE ON/OFF OTP
router.post("/update-otp-setting", async (req, res) => {
  const { type, person_id, require_otp } = req.body;

  if (!person_id || !type) return res.status(400).json({ message: "Missing parameters" });

  let table;
  if (type === "user") table = "user_accounts";
  else if (type === "prof") table = "prof_table";
  else return res.status(400).json({ message: "Invalid type" });

  try {
    const [result] = await db3.query(
      `UPDATE ${table} SET require_otp = ? WHERE person_id = ?`,
      [require_otp, person_id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      message: require_otp == 1
        ? "OTP has been enabled for your account."
        : "OTP has been disabled for your account."
    });
  } catch (err) {
    console.error("Failed to update OTP:", err);
    res.status(500).json({ message: "Server error updating OTP setting" });
  }
});

module.exports = router;
