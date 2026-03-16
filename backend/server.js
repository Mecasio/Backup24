const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const webtoken = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyparser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const puppeteer = require("puppeteer");

require("dotenv").config();
const app = express();
const http = require("http").createServer(app);

const { Server } = require("socket.io");

app.use(express.json());
app.use(bodyparser.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/Applicant1by1",
  express.static(path.join(__dirname, "uploads", "Applicant1by1")),
);
app.use(
  "/ApplicantOnlineDocuments",
  express.static(path.join(__dirname, "uploads", "ApplicantOnlineDocuments")),
);
app.use("/assets", express.static(path.join(__dirname, "assets")));

const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.50.77:5173',
  'http://192.168.50.62:5173',
  'http://192.168.50.211:5173',
  'http://136.239.248.62:5173',
  'http://192.168.50.62:5173',
  'http://192.168.50.53:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

const io = new Server(http, {
  cors: {
    origin: (origin, callback) => {
      // allow Postman / server-side requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by Socket.IO CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io", io);

const signatureDir = path.join(__dirname, "uploads", "signature");
const authRoute = require("./routes/auth_routes/authRoutes");
const applicantFormRoute = require("./routes/applicant_routes/applicantFormRoute");
const examPermit = require("./routes/applicant_routes/examPermitRoute");
const studentRoute = require("./routes/student_routes/studentRoute");
const adminRoute = require("./routes/admin_routes/registrarRoute");
const facultyRoute = require("./routes/faculty_routes/facultyRoute");
const programTagging = require("./routes/system_routes/programTaggingRoute");
const coursePanel = require("./routes/system_routes/coursePanelRoute");
const tosfPanel = require("./routes/system_routes/tosfRoute");
const paymentExporting = require("./routes/system_routes/paymentExportingRoute");
const corExporting = require("./routes/system_routes/corExportingRoute");

const entranceExamSchedule = require("./routes/admission_routes/entranceExamSchedule");
const verifyDocumentSchedule = require("./routes/admission_routes/verifyDocumentSchedule");
const QualifyingInterviewExam = require("./routes/admission_routes/QualifyingInterviewExam");
const medicalExamRoute = require("./routes/admission_routes/medicalExamRoute");
const qrCodeForStudents = require("./routes/qrCodeForStudents");
const studentPayment = require('./routes/payment/studentScholarship');
const receiptCounter = require('./routes/payment/receiptCounter');
const matriculationPayment = require('./routes/payment/matriculation');
const programRoute = require("./routes/system_routes/programRoute");
const applicantRoutes = require("./routes/reset_password_routes/applicantresetpasswordRoutes");
const studentRoutes = require("./routes/reset_password_routes/studentresetpasswordRoutes");
const facultyRoutes = require("./routes/reset_password_routes/facultyresetpasswordRoutes");
const registrarRoutes = require("./routes/reset_password_routes/registrarresetpasswordRoutes");
const announcementRoute = require("./routes/system_routes/announcement");
const programSlots = require("./routes/system_routes/programSlots");
const departmentRoute = require("./routes/system_routes/dprmntRoute");
const roomRegistrationRoute = require("./routes/system_routes/roomRegistrationRoute");
const importRoutes = require("./routes/import");
const accessRoutes = require("./routes/auth_routes/accessRoute");
const userPageAccess = require("./routes/auth_routes/userPageAccessRoute");

app.use("/", userPageAccess);
app.use("/", programRoute);
app.use("/auth/", authRoute);
app.use("/api/", accessRoutes);
app.use("/form/", applicantFormRoute);
app.use("/exampermit/", examPermit);
app.use("/student/", studentRoute);
app.use("/admin/", adminRoute);
app.use("/faculty/", facultyRoute);
app.use("/", programTagging);
app.use("/", coursePanel);
app.use("/", tosfPanel);
app.use("/", paymentExporting);
app.use("/", corExporting);
app.use("/", entranceExamSchedule);
app.use("/", verifyDocumentSchedule);
app.use("/", QualifyingInterviewExam);
app.use("/", medicalExamRoute);
app.use("/", qrCodeForStudents);
app.use("/", receiptCounter);
app.use("/", matriculationPayment);
app.use("/", studentPayment);
app.use("/", importRoutes);
app.use("/", applicantRoutes);
app.use("/", studentRoutes);
app.use("/", facultyRoutes);
app.use("/", registrarRoutes);
app.use("/api", announcementRoute);
app.use("/api", programSlots);
app.use("/", departmentRoute);
app.use("/", roomRegistrationRoute);

const uploadPath = path.join(__dirname, "uploads");

app.use("/uploads", express.static(uploadPath));

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

if (!fs.existsSync(signatureDir))
  fs.mkdirSync(signatureDir, { recursive: true });

app.get("/ecat_scores_template", (req, res) => {
  const filePath = path.join(
    __dirname,
    "excelfiles",
    "ECATScoresTemplate.xlsx",
  );
  res.download(filePath, "ECATScoresTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/qualifying_interview_template", (req, res) => {
  const filePath = path.join(
    __dirname,
    "excelfiles",
    "QualifyingInterviewScore.xlsx",
  );
  res.download(filePath, "QualifyingInterviewScore.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/grade_report_template", (req, res) => {
  const filePath = path.join(__dirname, "excelfiles", "GradeReport.xls");
  res.download(filePath, "GradeReport.xls", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/student_data", (req, res) => {
  const filePath = path.join(__dirname, "excelfiles", "StudentData.xlsx");
  res.download(filePath, "StudentData.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/curriculum_panel_template", (req, res) => {
  const filePath = path.join(__dirname, "excelfiles", "CurriculumPanelTemplate.xlsx");
  res.download(filePath, "CurriculumPanelTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/course_panel_template", (req, res) => {
  const filePath = path.join(__dirname, "excelfiles", "CoursePanelTemplate.xlsx");
  res.download(filePath, "CoursePanelTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/program_tagging_template", (req, res) => {
  const filePath = path.join(__dirname, "excelfiles", "ProgramTaggingTemplate.xlsx");
  res.download(filePath, "ProgramTaggingTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/program_panel_template", (req, res) => {
  const filePath = path.join(__dirname, "excelfiles", "ProgramPanelTemplate.xlsx");
  res.download(filePath, "ProgramPanelTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads", "signature"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `signature_${Date.now()}${ext}`);
  },
});

const uploadSignature = multer({ storage: signatureStorage });

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: async function (req, file, cb) {
    const person_id = req.body.person_id;
    const requirements_id = req.body.requirements_id;

    // Get requirement label from DB
    const [reqRows] = await db.query(
      "SELECT description FROM requirements_table WHERE id = ?",
      [requirements_id],
    );
    const description = reqRows[0]?.description || "Unknown";
    const shortLabel = getShortLabel(description);

    // Get applicant_number using person_id
    const [applicantRows] = await db.query(
      "SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?",
      [person_id],
    );
    const applicant_number =
      applicantRows[0]?.applicant_number || `PID${person_id}`;

    const timestamp = new Date().getFullYear();
    const ext = path.extname(file.originalname);

    const filename = `${applicant_number}_${shortLabel}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// ---------------- PROFILE UPLOAD (Registrar) ----------------
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: async (req, file, cb) => {
    const { id } = req.params;

    try {
      // ✅ Get registrar info
      const [rows] = await db3.query(
        "SELECT employee_id, role, profile_picture FROM user_accounts WHERE id = ?",
        [id],
      );

      if (!rows.length) return cb(new Error("Registrar not found"));

      const registrar = rows[0];
      const ext = path.extname(file.originalname).toLowerCase();

      // ✅ Get Philippine year
      const philTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
      });
      const year = new Date(philTime).getFullYear();

      // ✅ Construct filename based on employee_id + year
      const employeeID = registrar.employee_id || "unknown";
      const filename = `${employeeID}_profile_image_${year}${ext}`;

      cb(null, filename);
    } catch (err) {
      console.error("❌ Error generating filename:", err);
      cb(err);
    }
  },
});

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "uploads");
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, "temp_" + Date.now() + path.extname(file.originalname));
    },
  }),
});

const announcementStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads", "announcement");

    // ✅ CREATE FOLDER IF NOT EXISTS
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `temp_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const announcementUpload = multer({ storage: announcementStorage });


// Ito
const upload = multer({ storage: multer.memoryStorage() });

const nodemailer = require("nodemailer");
const { error } = require("console");

// Middleware to check if user can access a step
const checkStepAccess = (requiredStep) => {
  return async (req, res, next) => {
    const { id } = req.params; // person_id
    try {
      const [rows] = await db.execute(
        "SELECT current_step FROM person_table WHERE person_id = ?",
        [id],
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Person not found" });
      }

      const currentStep = rows[0].current_step;

      if (currentStep < requiredStep) {
        return res
          .status(403)
          .json({ error: "You cannot access this step yet." });
      }

      next();
    } catch (err) {
      console.error("Step check error:", err);
      res.status(500).json({ error: "Server error" });
    }
  };
};

// ---------------- TRANSPORTER ---------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify transporter at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter is ready");
  }
});



const getDbHost = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.DB_HOST_PUBLIC;
  } else if (process.env.NODE_ENV === "local") {
    return process.env.DB_HOST_LOCAL;
  } else {
    return "localhost"; // fallback for development
  }
};

//MYSQL CONNECTION FOR ADMISSION
const db = mysql.createPool({
  // host: "localhost",
  host: getDbHost(),
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME1 || "admission",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//MYSQL CONNECTION FOR ROOM MANAGEMENT AND OTHERS
const db3 = mysql.createPool({
  // host: "localhost",
  host: getDbHost(),
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME2 || "enrollment",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.query(`
  CREATE TABLE IF NOT EXISTS faculty_evaluation_table (
    eval_id INT AUTO_INCREMENT PRIMARY KEY,
    prof_id INT NOT NULL,
    course_id INT NOT NULL,
    curriculum_id INT NOT NULL,
    active_school_year_id INT NOT NULL,
    num1 INT DEFAULT 0,
    num2 INT DEFAULT 0,
    num3 INT DEFAULT 0,
    eval_status TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`);
//----------------------------Settings----------------------------//
const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf"];

const settingsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(
        new Error("Invalid file type. Only PNG, JPG, JPEG, or PDF allowed."),
      );
    }

    if (file.fieldname === "logo") cb(null, "Logo" + ext);
    else if (file.fieldname === "bg_image") cb(null, "Background" + ext);
    else cb(null, Date.now() + ext);
  },
});

const settingsUpload = multer({ storage: settingsStorage });

const deleteOldFile = (fileUrl) => {
  if (!fileUrl) return;
  const filePath = path.join(__dirname, fileUrl.replace(/^\//, ""));
  fs.unlink(filePath, (err) => {
    if (err) console.error(`Error deleting old file: ${err.message}`);
    else console.log(`Deleted old file: ${filePath}`);
  });
};

// ✅ GET Settings
// ✅ GET Settings
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM company_settings WHERE id = 1",
    );

    if (rows.length === 0) {
      return res.json({
        company_name: "",
        short_term: "",
        address: "",
        header_color: "#ffffff",
        footer_text: "",
        footer_color: "#ffffff",
        logo_url: null,
        bg_image: null,

        main_button_color: "#ffffff",
        sub_button_color: "#ffffff",
        border_color: "#000000",
        stepper_color: "#000000",
        sidebar_button_color: "#000000",

        title_color: "#000000",
        subtitle_color: "#555555",

        // ✅ NEW
        branches: [],
      });
    }

    const settings = rows[0];

    // ✅ parse JSON branches
    settings.branches = settings.branches
      ? JSON.parse(settings.branches)
      : [];

    res.json(settings);
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    res.status(500).json({ error: err.message });
  }
});



// ✅ POST Settings
app.post(
  "/api/settings",
  settingsUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "bg_image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        company_name,
        short_term,
        address,
        header_color,
        footer_text,
        footer_color,

        main_button_color,
        sub_button_color,
        border_color,
        stepper_color,
        sidebar_button_color,

        title_color,
        subtitle_color,

        // ✅ NEW
        branches,
      } = req.body;

      console.log("REQ.BODY:", req.body);
      console.log("BRANCHES RAW:", branches);

      const logoUrl = req.files["logo"]
        ? `/uploads/${req.files["logo"][0].filename}`
        : null;

      const bgImageUrl = req.files["bg_image"]
        ? `/uploads/${req.files["bg_image"][0].filename}`
        : null;

      const [rows] = await db.query(
        "SELECT * FROM company_settings WHERE id = 1",
      );

      if (rows.length > 0) {
        const currentSettings = rows[0];
        const oldLogo = rows[0].logo_url;
        const oldBg = rows[0].bg_image;
        let parsedBranches = currentSettings.branches || "[]";

        if (typeof branches !== "undefined") {
          try {
            parsedBranches = Array.isArray(branches)
              ? JSON.stringify(branches)
              : JSON.stringify(JSON.parse(branches));
          } catch (e) {
            parsedBranches = currentSettings.branches || "[]";
          }
        }

        let query = `
          UPDATE company_settings
          SET
            company_name=?,
            short_term=?,
            address=?,
            header_color=?,
            footer_text=?,
            footer_color=?,

            main_button_color=?,
            sub_button_color=?,
            border_color=?,
            stepper_color=?,
            sidebar_button_color=?,

            title_color=?,
            subtitle_color=?,

            branches=?`;

        const params = [
          company_name ?? currentSettings.company_name ?? "",
          short_term ?? currentSettings.short_term ?? "",
          address ?? currentSettings.address ?? "",
          header_color ?? currentSettings.header_color ?? "#ffffff",
          footer_text ?? currentSettings.footer_text ?? "",
          footer_color ?? currentSettings.footer_color ?? "#ffffff",

          main_button_color ??
          currentSettings.main_button_color ??
          "#ffffff",
          sub_button_color ?? currentSettings.sub_button_color ?? "#ffffff",
          border_color ?? currentSettings.border_color ?? "#000000",
          stepper_color ?? currentSettings.stepper_color ?? "#000000",
          sidebar_button_color ??
          currentSettings.sidebar_button_color ??
          "#000000",

          title_color ?? currentSettings.title_color ?? "#000000",
          subtitle_color ?? currentSettings.subtitle_color ?? "#555555",

          // ✅ NEW
          parsedBranches,
        ];

        if (logoUrl) {
          query += ", logo_url=?";
          params.push(logoUrl);
        }

        if (bgImageUrl) {
          query += ", bg_image=?";
          params.push(bgImageUrl);
        }

        query += " WHERE id = 1";

        await db.query(query, params);

        if (logoUrl && oldLogo && oldLogo !== logoUrl) deleteOldFile(oldLogo);
        if (bgImageUrl && oldBg && oldBg !== bgImageUrl) deleteOldFile(oldBg);

        return res.json({
          success: true,
          message: "Settings updated successfully.",
        });
      } else {
        const insertQuery = `
          INSERT INTO company_settings
          (
            company_name, short_term, address, header_color, footer_text, footer_color,
            logo_url, bg_image,
            main_button_color, sub_button_color, border_color, stepper_color, sidebar_button_color,
            title_color, subtitle_color,
            branches
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await db.query(insertQuery, [
          company_name || "",
          short_term || "",
          address || "",
          header_color || "#ffffff",
          footer_text || "",
          footer_color || "#ffffff",
          logoUrl,
          bgImageUrl,

          main_button_color || "#ffffff",
          sub_button_color || "#ffffff",
          border_color || "#000000",
          stepper_color || "#000000",
          sidebar_button_color || "#000000",

          title_color || "#000000",
          subtitle_color || "#555555",

          // ✅ NEW
          parsedBranches,
        ]);

        res.json({ success: true, message: "Settings created successfully." });
      }
    } catch (err) {
      console.error("❌ Error in /api/settings:", err);
      res.status(500).json({ error: err.message });
    }
  },
);



//----------------------------End Settings----------------------------//

/*---------------------------------START---------------------------------------*/
const ipAddress = getDbHost();
// ----------------- REGISTER -----------------
app.post("/register", async (req, res) => {
  const { email, password, campus, otp } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Please fill up all required fields",
    });
  }

  // ⭐⭐⭐ OTP VALIDATION ⭐⭐⭐
  const stored = otpStore[email];
  const now = Date.now();

  if (!stored) {
    return res
      .status(400)
      .json({ success: false, message: "No OTP request found for this email" });
  }

  if (stored.expiresAt < now) {
    delete otpStore[email];
    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new one.",
    });
  }

  if (stored.otp !== otp.trim()) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  delete otpStore[email];

  let person_id = null;

  try {
    const [[company]] = await db.query(
      "SELECT company_name FROM company_settings WHERE id = 1",
    );
    const companyName = company?.company_name || "Main Campus";

    const hashedPassword = await bcrypt.hash(password, 10);

    const [existingUser] = await db.query(
      "SELECT * FROM user_accounts WHERE email = ?",
      [email.trim().toLowerCase()],
    );

    if (existingUser.length > 0) {
      return res.json({
        success: false,
        message: "Email is already registered",
      });
    }

    const campusValue = campus?.trim()
      ? campus.trim()
      : `${companyName} - Main`;

    // ⭐⭐⭐ FIX: STORE EMAIL INTO person_table.emailAddress ⭐⭐⭐
    const [personResult] = await db.query(
      `INSERT INTO person_table (campus, emailAddress, termsOfAgreement, current_step)
       VALUES (?, ?, 1, 1)`,
      [campusValue, email.trim().toLowerCase()],
    );

    person_id = personResult.insertId;

    // Insert account
    await db.query(
      `INSERT INTO user_accounts (person_id, email, password, role)
       VALUES (?, ?, ?, 'applicant')`,
      [person_id, email.trim().toLowerCase(), hashedPassword],
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
      "SELECT COUNT(*) AS count FROM applicant_numbering_table",
    );

    const padded = String(countRes[0].count + 1).padStart(5, "0");
    const applicant_number = `${year}${semCode}${padded}`;

    await db.query(
      "INSERT INTO applicant_numbering_table (applicant_number, person_id) VALUES (?, ?)",
      [applicant_number, person_id],
    );

    // Ensure QrCodeGenerated folder exists
    const qrFolder = path.join(__dirname, "./uploads/QrCodeGenerated");
    if (!fs.existsSync(qrFolder)) {
      fs.mkdirSync(qrFolder, { recursive: true });
    }

    // QR Codes
    const qrData = `${process.env.DB_HOST_LOCAL}:5173/examination_profile/${applicant_number}`;
    const qrData2 = `${process.env.DB_HOST_LOCAL}:5173/applicant_profile/${applicant_number}`;
    const qrFilename = `${applicant_number}_qrcode.png`;
    const qrFilename2 = `${applicant_number}_qrcode2.png`;

    // Save QR codes in QrCodeGenerated folder
    const qrPath = path.join(qrFolder, qrFilename);
    const qrPath2 = path.join(qrFolder, qrFilename2);

    await QRCode.toFile(qrPath, qrData, {
      color: { dark: "#000", light: "#FFF" },
      width: 300,
    });

    await QRCode.toFile(qrPath2, qrData2, {
      color: { dark: "#000", light: "#FFF" },
      width: 300,
    });

    // Update DB with just the filename (or you can store relative path)
    await db.query(
      "UPDATE applicant_numbering_table SET qr_code = ? WHERE applicant_number = ?",
      [qrFilename, applicant_number],
    );

    await db.query(
      `INSERT INTO person_status_table
       (person_id, applicant_id, exam_status, requirements, residency, student_registration_status, exam_result, hs_ave, qualifying_result, interview_result)
       VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`,
      [person_id, applicant_number],
    );

    await db.query(
      `INSERT INTO interview_applicants (schedule_id, applicant_id, email_sent, status)
       VALUES (?, ?, 0, 'Waiting List')`,
      [null, applicant_number],
    );

    res.status(201).json({
      success: true,
      message: "Registered Successfully",
      person_id,
      applicant_number,
      campus: campusValue,
    });
  } catch (error) {
    if (person_id) {
      await db.query("DELETE FROM person_table WHERE person_id = ?", [
        person_id,
      ]);
    }
    res.json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

const ROLE_PAGE_ACCESS = {
  admission: [
    103, 92, 96, 73, 1, 2, 3, 4, 5, 7, 8, 9, 11, 33, 48, 52, 61, 66, 98, 115, 118,
  ],
  enrollment: [
    102, 96, 73, 6, 10, 12, 17, 36, 37, 43, 44, 45, 46, 47, 49, 60, 92, 108,
    109,
  ],
  clinic: [101, 92, 96, 73, 24, 25, 26, 27, 28, 29, 30, 31, 19, 32],
  registrar: [
    80, 104, 38, 73, 39, 40, 41, 42, 56, 13, 50, 62, 96, 92, 59, 105, 15, 101,
  ],
  head: [
    102, 94, 96, 73, 6, 10, 12, 17, 36, 37, 43, 44, 45, 46, 47, 49, 60, 92, 108,
  ],
  dean: [
    102, 94, 96, 73, 6, 10, 12, 17, 36, 37, 43, 44, 45, 46, 47, 49, 60, 92, 108,
  ],
  superadmin: "ALL",
};

app.post(
  "/register_registrar",
  upload.single("profile_picture"),
  async (req, res) => {
    try {
      const {
        employee_id,
        last_name,
        middle_name,
        first_name,
        role,
        email,
        password,
        status,
        dprtmnt_id,
      } = req.body;

      const file = req.file;

      // 🧩 Validate required fields
      if (
        !employee_id ||
        !last_name ||
        !first_name ||
        !role ||
        !email ||
        !password
      ) {
        return res
          .status(400)
          .json({ message: "All required fields must be filled" });
      }

      // 🧠 Normalize email before checking duplicates
      const normalizedEmail = email.toLowerCase().trim();

      // 🧩 Check for duplicate email
      const [existing] = await db3.query(
        "SELECT * FROM user_accounts WHERE LOWER(email) = ?",
        [normalizedEmail],
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // 🔒 Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 👤 Create person record first
      const [personInsert] = await db3.query(
        "INSERT INTO person_table () VALUES ()",
      );
      const person_id = personInsert.insertId;

      // 🖼️ Handle file upload
      let profilePicName = null;
      if (file) {
        profilePicName = `${employee_id}_profile_${Date.now()}${path.extname(file.originalname)}`;
        fs.writeFileSync(
          path.join(__dirname, "uploads", profilePicName),
          file.buffer,
        );
      }

      // 🏷 Department NULL allowed
      const deptValue = dprtmnt_id === "" ? null : dprtmnt_id;

      // 💾 Save registrar record
      await db3.query(
        `INSERT INTO user_accounts
       (person_id, employee_id, last_name, middle_name, first_name, role, email, password, status, dprtmnt_id, profile_picture)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          person_id,
          employee_id,
          last_name,
          middle_name,
          first_name,
          "registrar",
          normalizedEmail,
          hashedPassword,
          status || 1,
          deptValue,
          profilePicName,
        ],
      );

      // 📄 Page Access Assignment
      let pageIds = ROLE_PAGE_ACCESS[role];

      if (role === "superadmin") {
        pageIds = Array.from({ length: 100 }, (_, i) => i + 1);
      }

      const values = pageIds.map((pageId) => [1, pageId, employee_id]);

      await db3.query(
        "INSERT INTO page_access (page_privilege, page_id, user_id) VALUES ?",
        [values],
      );

      res
        .status(201)
        .json({ message: "Registrar account created successfully!" });
    } catch (error) {
      console.error("❌ Error creating registrar account:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

app.get("/api/registrars", async (req, res) => {
  try {
    const sql = `
      SELECT
        ua.id,
        ua.employee_id,
        ua.profile_picture,
        ua.first_name,
        ua.middle_name,
        ua.last_name,
        ua.email,
        ua.access_level,
        at.access_description,
        ua.role,
        ua.status,
        d.dprtmnt_name,
        d.dprtmnt_code
      FROM user_accounts ua
      LEFT JOIN access_table at ON ua.access_level = at.access_id
      LEFT JOIN dprtmnt_table d ON ua.dprtmnt_id = d.dprtmnt_id
      WHERE ua.role IN ('registrar', 'admission', 'enrollment', 'clinic', 'superadmin')
      ORDER BY ua.id DESC;
    `;

    const [results] = await db3.query(sql);
    res.json(results);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Actual upload + database update route
app.put(
  "/update_registrar/:id",
  profileUpload.single("profile_picture"),
  async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;
    console.log("hello");

    try {
      const [existing] = await db3.query(
        "SELECT * FROM user_accounts WHERE id = ?",
        [id],
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: "Registrar not found" });
      }

      const current = existing[0];

      // 🚫 Prevent duplicate email (except current email)
      if (
        data.email &&
        data.email.toLowerCase() !== current.email.toLowerCase()
      ) {
        const [emailExists] = await db3.query(
          "SELECT id FROM user_accounts WHERE LOWER(email)=? AND id!=?",
          [data.email.toLowerCase(), id],
        );

        if (emailExists.length > 0) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // 🖼 Handle profile picture
      let finalFilename = current.profile_picture;

      if (file) {
        const ext = path.extname(file.originalname);
        finalFilename = `${current.employee_id}_profile_${Date.now()}${ext}`;

        const uploadPath = path.join(__dirname, "uploads", finalFilename);

        // Delete old file
        if (current.profile_picture) {
          const old = path.join(__dirname, "uploads", current.profile_picture);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }

        // Save new one
        fs.writeFileSync(uploadPath, file.buffer);
      }

      // Allow NULL department
      const deptValue = data.dprtmnt_id === "" ? null : data.dprtmnt_id;

      // 🔄 Update user record
      await db3.query(
        `UPDATE user_accounts
       SET employee_id=?, last_name=?, middle_name=?, first_name=?, role=?, email=?, status=?, dprtmnt_id=?, profile_picture=?
       WHERE id=?`,
        [
          data.employee_id || current.employee_id,
          data.last_name || current.last_name,
          data.middle_name || current.middle_name,
          data.first_name || current.first_name,
          "registrar",
          data.email.toLowerCase(),
          data.status ?? current.status,
          deptValue,
          finalFilename,
          id,
        ],
      );

      // 🔄 Update page access if role changed
      if (data.role && data.role !== current.role) {
        await db3.query("DELETE FROM page_access WHERE user_id = ?", [
          current.employee_id,
        ]);

        let pages = ROLE_PAGE_ACCESS[data.role];

        if (data.role === "superadmin") {
          const [allPages] = await db3.query("SELECT id FROM page_table");
          for (const row of allPages) {
            await db3.query(
              "INSERT INTO page_access (page_privilege, page_id, user_id) VALUES (1, ?, ?)",
              [row.id, current.employee_id],
            );
          }
        } else {
          for (const pageId of pages) {
            await db3.query(
              "INSERT INTO page_access (page_privilege, page_id, user_id) VALUES (1, ?, ?)",
              [pageId, current.employee_id],
            );
          }
        }
      }

      res.json({
        success: true,
        message: "Registrar updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating registrar:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.post(
  "/update_registrar/:id",
  profileUpload.single("profile_picture"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const [existing] = await db3.query(
        "SELECT * FROM user_accounts WHERE id = ?",
        [id],
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: "Registrar not found" });
      }

      let finalFilename = existing[0].profile_picture;

      if (req.file) {
        finalFilename = req.file.filename;
      }

      await db3.query(`UPDATE user_accounts SET profile_picture=? WHERE id=?`, [
        finalFilename,
        id,
      ]);

      res.json({
        success: true,
        message: "Profile picture updated",
        filename: finalFilename,
      });
    } catch (error) {
      console.error("❌ Error updating registrar:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.get("/api/employee/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    // get all page_ids assigned to this employee
    const [rows] = await db3.query(
      "SELECT page_id FROM page_access WHERE user_id = ?",
      [employee_id],
    );

    const accessList = rows.map((r) => r.page_id);

    res.json({
      success: true,
      accessList,
    });
  } catch (err) {
    console.error("Error fetching employee access:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/update_registrar_status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db3.query("UPDATE user_accounts SET status=? WHERE id=?", [
      Number(status),
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ===============================
// SAVE EXAM SCORE - POST /api/exam/save
// ===============================
app.post("/api/exam/save", async (req, res) => {
  console.log("🔥 /api/exam/save HIT", req.body);

  try {
    const {
      applicant_number,
      english = null,
      science = null,
      filipino = null,
      math = null,
      abstract = null,
      final_rating = null,
      status = "",
    } = req.body;

    if (!applicant_number) {
      return res.status(400).json({ error: "applicant_number is required" });
    }

    // 1) applicant_number -> person_id
    const [rows] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ? LIMIT 1",
      [applicant_number],
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "Applicant number not found" });
    }

    const personId = rows[0].person_id;

    // 2) Old data (for notifications)
    const [oldRows] = await db.query(
      "SELECT English, Science, Filipino, Math, Abstract, status FROM admission_exam WHERE person_id = ? LIMIT 1",
      [personId],
    );
    const oldData = oldRows[0] || null;

    // 3) Ensure numeric values or NULL
    const e = english === null ? null : Number(english);
    const s = science === null ? null : Number(science);
    const f = filipino === null ? null : Number(filipino);
    const m = math === null ? null : Number(math);
    const a = abstract === null ? null : Number(abstract);
    const fr = final_rating === null ? null : Number(final_rating);

    // 4) INSERT or UPDATE
    await db.query(
      `INSERT INTO admission_exam
     (person_id, English, Science, Filipino, Math, Abstract, final_rating, status, date_created)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
   ON DUPLICATE KEY UPDATE
     English = VALUES(English),
     Science = VALUES(Science),
     Filipino = VALUES(Filipino),
     Math = VALUES(Math),
     Abstract = VALUES(Abstract),
     final_rating = VALUES(final_rating),
     status = VALUES(status),
     date_created = NOW()`,
      [personId, e, s, f, m, a, fr, status === "" ? null : status],
    );

    // 5) Notifications (only if changed)
    const actorEmail = "earistmis@gmail.com";
    const actorName = "SYSTEM";

    if (oldData) {
      const subjects = [
        { key: "English", label: "English", newVal: e },
        { key: "Science", label: "Science", newVal: s },
        { key: "Filipino", label: "Filipino", newVal: f },
        { key: "Math", label: "Math", newVal: m },
        { key: "Abstract", label: "Abstract", newVal: a },
      ];

      for (const subj of subjects) {
        const oldVal = oldData[subj.key];

        if ((oldVal ?? null) != (subj.newVal ?? null)) {
          const message = `📝 Entrance Exam updated (${subj.label}: ${oldVal ?? 0} → ${subj.newVal ?? 0}) for Applicant #${applicant_number}`;

          await db.query(
            `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp)
             SELECT ?, ?, ?, ?, ?, NOW()
             FROM DUAL
             WHERE NOT EXISTS (
               SELECT 1 FROM notifications
               WHERE applicant_number = ?
                 AND message = ?
                 AND DATE(timestamp) = CURDATE()
             )`,
            [
              "update",
              message,
              applicant_number,
              actorEmail,
              actorName,
              applicant_number,
              message,
            ],
          );

          if (io && io.emit) {
            io.emit("notification", {
              type: "update",
              message,
              applicant_number,
              actor_email: actorEmail,
              actor_name: actorName,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    // 6) Return fresh saved values (NORMALIZED TO LOWERCASE)
    const [savedRows] = await db.query(
      "SELECT person_id, English, Science, Filipino, Math, Abstract, final_rating, status, date_created FROM admission_exam WHERE person_id = ? LIMIT 1",
      [personId],
    );

    const saved = savedRows[0] || null;

    // 🔥 Normalize keys to lowercase so React UI updates instantly
    const normalized = {
      person_id: saved.person_id,
      english: Number(saved.English),
      science: Number(saved.Science),
      filipino: Number(saved.Filipino),
      math: Number(saved.Math),
      abstract: Number(saved.Abstract),
      final_rating: Number(saved.final_rating),
      status: saved.status,
      date_created: saved.date_created,
    };

    return res.json({
      success: true,
      message: "Exam data saved!",
      saved: normalized,
    });
  } catch (err) {
    console.error("🔥 ERROR saving exam:", err);
    return res.status(500).json({
      error: "Failed to save exam data",
      details: String(err.message || err),
    });
  }
});

// ✅ Unified Save or Update for Qualifying / Interview Scores (with duplicate-safe notifications)
app.post("/api/interview/save", async (req, res) => {
  try {
    const {
      applicant_number,
      qualifying_exam_score,
      qualifying_interview_score,
      user_person_id,
    } = req.body;

    // Find person_id
    const [rows] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
      [applicant_number],
    );
    if (rows.length === 0)
      return res.status(400).json({ error: "Applicant number not found" });
    const personId = rows[0].person_id;

    // Fetch old results
    const [oldRows] = await db.query(
      "SELECT qualifying_result, interview_result, exam_result FROM person_status_table WHERE person_id = ?",
      [personId],
    );
    const oldData = oldRows[0] || null;

    // Compute new scores
    const qExam = Number(qualifying_exam_score) || 0;
    const qInterview = Number(qualifying_interview_score) || 0;
    const totalAve = (qExam + qInterview) / 2;

    // Upsert
    await db.query(
      `INSERT INTO person_status_table (person_id, qualifying_result, interview_result, exam_result)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         qualifying_result = VALUES(qualifying_result),
         interview_result = VALUES(interview_result),
         exam_result = VALUES(exam_result)`,
      [personId, qExam, qInterview, totalAve],
    );

    // Get actor info
    let actorEmail = "earistmis@gmail.com";
    let actorName = "SYSTEM";
    if (user_person_id) {
      const [actorRows] = await db3.query(
        `SELECT email, role, employee_id, last_name, first_name, middle_name
         FROM user_accounts WHERE person_id = ? LIMIT 1`,
        [user_person_id],
      );
      if (actorRows.length > 0) {
        const u = actorRows[0];
        const role = u.role?.toUpperCase() || "UNKNOWN";
        const empId = u.employee_id || "";
        actorEmail = u.email || "earistmis@gmail.com";
        actorName =
          `${role} (${empId}) - ${u.last_name}, ${u.first_name} ${u.middle_name}`.trim();
      }
    }

    // Detect changes
    if (
      oldData &&
      (oldData.qualifying_result != qExam ||
        oldData.interview_result != qInterview)
    ) {
      const oldExam = oldData.qualifying_result ?? 0;
      const oldInterview = oldData.interview_result ?? 0;
      const oldFinal =
        oldData.exam_result ?? ((oldExam + oldInterview) / 2).toFixed(2);
      const newFinal = totalAve.toFixed(2);

      // Build message text showing both scores
      const message = `📝 Qualifying Exam: ${oldExam} → ${qExam} | Interview: ${oldInterview} → ${qInterview} | Final Rating: ${oldFinal} → ${newFinal} for Applicant #${applicant_number}`;

      // One single notification per applicant per day
      await db.query(
        `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp)
         SELECT ?, ?, ?, ?, ?, NOW()
         FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM notifications
           WHERE applicant_number = ?
             AND message = ?
             AND DATE(timestamp) = CURDATE()
         )`,
        [
          "update",
          message,
          applicant_number,
          actorEmail,
          actorName,
          applicant_number,
          message,
        ],
      );

      io.emit("notification", {
        type: "update",
        message,
        applicant_number,
        actor_email: actorEmail,
        actor_name: actorName,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: "Qualifying/Interview results saved successfully!",
    });
  } catch (err) {
    console.error("Error saving qualifying/interview results:", err);
    res
      .status(500)
      .json({ error: "Failed to save qualifying/interview results" });
  }
});



// ✅ Get user_accounts.id using person_id
app.get("/api/get_user_account_id/:person_id", async (req, res) => {
  const { person_id } = req.params;
  try {
    const [rows] = await db3.query(
      "SELECT id FROM user_accounts WHERE person_id = ? LIMIT 1",
      [person_id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ user_account_id: rows[0].id });
  } catch (err) {
    console.error("❌ Error fetching user_account_id:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//DISPLAY
app.get("/api/students", async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT
        ua.id AS user_id,
        ua.employee_id,
        ua.profile_picture,
        pt.first_name,
        pt.middle_name,
        pt.last_name,
        ua.email,
        ua.role,
        ua.status,
        ct.program_id,
        d.dprtmnt_id,
        d.dprtmnt_name,
        d.dprtmnt_code, snt.student_number, sct.curriculum_id, ct.program_id, pgt.program_description, pgt.program_code,
		ylt.year_level_description
      FROM user_accounts ua
      LEFT JOIN dprtmnt_curriculum_table dct ON ua.dprtmnt_id = dct.dprtmnt_id
      LEFT JOIN dprtmnt_table d ON dct.dprtmnt_id = d.dprtmnt_id
      INNER JOIN student_curriculum_table sct ON dct.curriculum_id = sct.curriculum_id
      LEFT JOIN curriculum_table ct ON sct.curriculum_id = ct.curriculum_id
      LEFT JOIN program_table pgt ON ct.program_id = pgt.program_id
      LEFT JOIN person_table pt ON ua.person_id = pt.person_id
      LEFT JOIN student_numbering_table snt ON pt.person_id = snt.person_id
      LEFT JOIN student_status_table sst ON snt.student_number = sst.student_number
      LEFT JOIN year_level_table ylt ON sst.year_level_id = ylt.year_level_id
      WHERE ua.role = 'student' ;
    `;

    // ✅ Since db3 is a promise-based connection, use await
    const [results] = await db3.query(sql);
    res.json(results);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//CREATE
app.post(
  "/register_student",
  profileUpload.single("profile_picture"),
  async (req, res) => {
    const {
      student_number,
      last_name,
      middle_name,
      first_name,
      email,
      password,
      status,
      dprtmnt_id,
      curriculum_id,
    } = req.body;
    console.log("Student Number: ", student_number);
    console.log("Last Name: ", last_name);
    console.log("Middle Name: ", middle_name);
    console.log("First Name: ", first_name);
    console.log("Email: ", email);
    console.log("Status: ", status);
    console.log("Departments: ", dprtmnt_id);
    console.log("Curriculum: ", curriculum_id);

    try {
      const [existing] = await db3.query(
        "SELECT * FROM user_accounts WHERE email = ?",
        [email],
      );
      if (existing.length > 0) {
        return res.json({ success: false, message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const [personInsert] = await db3.query(
        "INSERT INTO person_table (first_name, middle_name, last_name, emailAddress) VALUES (?, ?, ?, ?)",
        [first_name, middle_name || null, last_name, email],
      );
      const person_id = personInsert.insertId;

      await db3.query(
        `INSERT INTO user_accounts
       (person_id, role, last_name, middle_name, first_name, email, password, status, dprtmnt_id)
       VALUES (?, 'student', ?, ?, ?, ?, ?, ?, ?)`,
        [
          person_id,
          last_name,
          middle_name || null,
          first_name,
          email.toLowerCase(),
          hashedPassword,
          status || 1,
          dprtmnt_id,
        ],
      );

      const [studentNumInsert] = await db3.query(
        `
      INSERT INTO student_numbering_table (student_number, person_id) VALUES (?, ?)
    `,
        [student_number, person_id],
      );

      const student_numbering_id = studentNumInsert.insertId;

      await db3.query(
        `
      INSERT INTO student_curriculum_table (student_numbering_id, curriculum_id) VALUES (?, ?)
    `,
        [student_numbering_id, curriculum_id],
      );

      res
        .status(201)
        .json({ message: "Registrar account created successfully!" });
    } catch (error) {
      console.error("❌ Error creating registrar account:", error);
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  },
);

//UPDATE
app.put(
  "/update_student/:id",
  profileUpload.single("profile_picture"),
  async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;

    try {
      const [existing] = await db3.query(
        `
      SELECT DISTINCT
        ua.id AS user_id,
        ua.person_id,
        ua.employee_id,
        ua.profile_picture,
        pt.first_name,
        pt.middle_name,
        pt.last_name,
        ua.email,
        ua.role,
        ua.status,
        d.dprtmnt_name,
        d.dprtmnt_code, snt.student_number,ct.curriculum_id, ct.program_id, pgt.program_code,
		ylt.year_level_description
      FROM user_accounts ua
      LEFT JOIN dprtmnt_curriculum_table dct ON ua.dprtmnt_id = dct.dprtmnt_id
      LEFT JOIN dprtmnt_table d ON dct.dprtmnt_id = d.dprtmnt_id
      LEFT JOIN curriculum_table ct ON dct.curriculum_id = ct.curriculum_id
      LEFT JOIN program_table pgt ON ct.program_id = pgt.program_id
      LEFT JOIN person_table pt ON ua.person_id = pt.person_id
      LEFT JOIN student_numbering_table snt ON pt.person_id = snt.person_id
      LEFT JOIN student_status_table sst ON snt.student_number = sst.student_number
      LEFT JOIN year_level_table ylt ON sst.year_level_id = ylt.year_level_id
      WHERE ua.role = 'student' AND ua.id = ?;
      `,
        [id],
      );
      if (existing.length === 0)
        return res.json({ success: false, message: "Student not found" });

      const current = existing[0];

      const updated = {
        student_number: data.student_number ?? current.student_number,
        last_name: data.last_name ?? current.last_name,
        middle_name: data.middle_name ?? current.middle_name,
        first_name: data.first_name ?? current.first_name,
        email: data.email ?? current.email,
        dprtmnt_id: data.dprtmnt_id ?? current.dprtmnt_id,
        profile_picture: file ? file.filename : current.profile_picture,
        status: data.status != null ? Number(data.status) : current.status,
        curriculum_id: data.curriculum_id,
      };

      if (updated.email.toLowerCase() !== current.email.toLowerCase()) {
        const [existingEmail] = await db3.query(
          "SELECT id FROM user_accounts WHERE email = ? AND id != ?",
          [updated.email.toLowerCase(), id],
        );

        if (existingEmail.length > 0) {
          return res.json({ success: false, message: "Email already exists" });
        }
      }

      await db3.query(
        `UPDATE user_accounts
       SET email=?, status=?, dprtmnt_id=?, profile_picture=?
       WHERE id=?`,
        [
          updated.email.toLowerCase(),
          updated.status,
          updated.dprtmnt_id,
          updated.profile_picture,
          id,
        ],
      );

      // Optionally update person_table
      await db3.query(
        `UPDATE person_table
       SET first_name=?, middle_name=?, last_name=?
       WHERE person_id=?`,
        [
          updated.first_name,
          updated.middle_name,
          updated.last_name,
          current.person_id,
        ],
      );

      await db3.query(
        `UPDATE student_numbering_table
       SET student_number = ?
       WHERE person_id = ?
      `,
        [updated.student_number, current.person_id],
      );

      await db3.query(
        `
      UPDATE student_curriculum_table
      SET curriculum_id = ?
      WHERE student_numbering_id = (
        SELECT id FROM student_numbering_table WHERE person_id = ?
      )
    `,
        [updated.curriculum_id, current.person_id],
      );

      res.json({ success: true, message: "Student updated successfully!" });
    } catch (error) {
      console.error("❌ Error updating student:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

//TOGGLE STATUS
app.put("/update_student_status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log("User ID: ", id);
  try {
    await db3.query(`UPDATE user_accounts SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
    res.json({ success: true, message: `Student status updated to ${status}` });
  } catch (error) {
    console.error("❌ Error updating student status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//IMPORT


//GET ADMITTED USERS (UPDATED!)
app.get("/admitted_users", async (req, res) => {
  try {
    const query = "SELECT * FROM user_accounts";
    const [result] = await db.query(query);

    res.status(200).send(result);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ message: "INTERNAL SERVER ERROR!!" });
  }
});

//TRANSFER ENROLLED USER INTO ENROLLMENT (UPDATED!)
app.post("/transfer", async (req, res) => {
  const { person_id } = req.body;

  try {
    const fetchQuery = "SELECT * FROM user_accounts WHERE person_id = ?";
    const [result1] = await db.query(fetchQuery, [person_id]);

    if (result1.length === 0) {
      return res
        .status(404)
        .send({ message: "User not found in the database" });
    }

    const user = result1[0];

    const insertPersonQuery =
      "INSERT INTO person_table (first_name, middle_name, last_name) VALUES (?, ?, ?)";
    const [personResult] = await db3.query(insertPersonQuery, [
      user.first_name,
      user.middle_name,
      user.last_name,
    ]);

    const newPersonId = personResult.insertId;

    const insertUserQuery =
      "INSERT INTO user_accounts (person_id, email, password) VALUES (?, ?, ?)";
    await db3.query(insertUserQuery, [newPersonId, user.email, user.password]);

    console.log("User transferred successfully:", user.email);
    return res
      .status(200)
      .send({ message: "User transferred successfully", email: user.email });
  } catch (error) {
    console.error("ERROR: ", error);
    return res
      .status(500)
      .send({ message: "Something went wrong in the server", error });
  }
});

// Get applicant_number by person_id
app.get("/api/applicant_number/:person_id", async (req, res) => {
  const { person_id } = req.params;

  console.log("Recieved Person Id: ", person_id);

  try {
    const [rows] = await db.query(
      "SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?",
      [person_id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Applicant number not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching applicant number:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const getShortLabel = async (desc) => {
  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT short_label FROM requirements_table WHERE LOWER(description) LIKE CONCAT('%', LOWER(?), '%') LIMIT 1",
        [desc],
      );

    if (rows.length > 0) {
      return rows[0].short_label; // ✅ return short_label directly from DB
    } else {
      return "Unknown"; // no match found
    }
  } catch (error) {
    console.error("Error fetching short_label:", error);
    return "Unknown";
  }
};

app.post("/upload", upload.single("file"), async (req, res) => {
  const { requirements_id, person_id } = req.body;

  if (!req.file || !person_id || !requirements_id) {
    return res
      .status(400)
      .json({ message: "Missing file, person_id, or requirements_id" });
  }

  try {
    // ✅ Fetch description & short_label in one query
    const [rows] = await db.query(
      "SELECT description, short_label FROM requirements_table WHERE id = ?",
      [requirements_id],
    );

    if (!rows.length)
      return res.status(404).json({ message: "Requirement not found" });

    // ✅ Use short_label directly from DB
    const shortLabel = await getShortLabel(rows[0].description);

    const year = new Date().getFullYear();
    const ext = path.extname(req.file.originalname).toLowerCase();

    // ✅ Fetch applicant number
    const [appRows] = await db.query(
      "SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?",
      [person_id],
    );

    if (!appRows.length) {
      return res.status(404).json({
        message: `Applicant number not found for person_id ${person_id}`,
      });
    }

    const applicant_number = appRows[0].applicant_number;

    // ✅ Construct final filename using short_label from DB
    const filename = `${applicant_number}_${shortLabel}_${year}${ext}`;
    const finalPath = path.join(__dirname, "uploads", filename);

    // ✅ Remove existing file if exists
    const [existingFiles] = await db.query(
      `SELECT upload_id, file_path FROM requirement_uploads
       WHERE person_id = ? AND requirements_id = ? AND file_path LIKE ?`,
      [person_id, requirements_id, `%${shortLabel}_${year}%`],
    );

    for (const file of existingFiles) {
      const fullFilePath = path.join(__dirname, "uploads", file.file_path);
      try {
        await fs.promises.unlink(fullFilePath);
      } catch (err) {
        console.warn("File delete warning:", err.message);
      }
      await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [
        file.upload_id,
      ]);
    }

    // ✅ Write file to disk
    await fs.promises.writeFile(finalPath, req.file.buffer);

    const filePath = `${filename}`;
    const originalName = req.file.originalname;

    await db.query(
      "INSERT INTO requirement_uploads (requirements_id, person_id, file_path, original_name) VALUES (?, ?, ?, ?)",
      [requirements_id, person_id, filePath, originalName],
    );

    res.status(201).json({ message: "Upload successful", filename });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// 11:19AM 10-08-2025 --------------- APPLICANT SIDE ----------- THIS PART SHOULD BE NOT HARD CODED -------------- //

// REQUIREMENTS PANEL (UPDATED!) ADMIN
// ✅ REQUIREMENTS PANEL (UPDATED!) ADMIN
app.post("/requirements", async (req, res) => {
  const { requirements_description, category, short_label } = req.body;

  if (!requirements_description) {
    return res.status(400).json({ error: "Description required" });
  }

  const query = `
    INSERT INTO requirements_table
    (description, short_label, category)
    VALUES (?, ?, ?)
  `;

  try {
    const [result] = await db.execute(query, [
      requirements_description,
      short_label || null,
      category || "Regular",
    ]);

    res.status(201).json({ requirements_id: result.insertId });
  } catch (err) {
    console.error("Insert error:", err);
    return res.status(500).json({ error: "Failed to save requirement" });
  }
});

// GET THE REQUIREMENTS (UPDATED!)
app.get("/requirements", async (req, res) => {
  const query = "SELECT * FROM requirements_table";

  try {
    const [results] = await db.execute(query);
    res.json(results);
  } catch (err) {
    console.error("Fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch requirements" });
  }
});

// DELETE (REQUIREMENT PANEL)
app.delete("/requirements/:id", async (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM requirements_table WHERE id = ?";

  try {
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Requirement not found" });
    }

    res.status(200).json({ message: "Requirement deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete requirement" });
  }
});

// ✅ Upload Route

// 📌 Helper function to fetch actor info
async function getActorInfo(user_person_id) {
  let actorEmail = "earistmis@gmail.com";
  let actorName = "SYSTEM";

  if (user_person_id) {
    const [actorRows] = await db3.query(
      `SELECT email, role, last_name, first_name, middle_name
       FROM user_accounts
       WHERE person_id = ? LIMIT 1`,
      [user_person_id],
    );

    if (actorRows.length > 0) {
      const actor = actorRows[0];
      actorEmail = actor.email || actorEmail;
      actorName = actor.last_name
        ? `${actor.role.toUpperCase()} - ${actor.last_name}, ${actor.first_name || ""} ${actor.middle_name || ""}`.trim()
        : actor.role
          ? actor.role.toUpperCase()
          : actorName;
    }
  }

  return { actorEmail, actorName };
}

app.post("/api/upload", upload.single("file"), async (req, res) => {
  const { requirements_id, person_id, remarks } = req.body;

  if (!requirements_id || !person_id || !req.file) {
    return res.status(400).json({ error: "Missing required fields or file" });
  }

  try {
    // 🔹 Applicant info
    const [[appInfo]] = await db.query(
      `
      SELECT ant.applicant_number, pt.last_name, pt.first_name, pt.middle_name
      FROM applicant_numbering_table ant
      JOIN person_table pt ON ant.person_id = pt.person_id
      WHERE ant.person_id = ?
    `,
      [person_id],
    );

    const applicant_number = appInfo?.applicant_number || "Unknown";
    const fullName = `${appInfo?.last_name || ""}, ${appInfo?.first_name || ""} ${appInfo?.middle_name?.charAt(0) || ""}.`;

    // 🔹 Requirement description + short label
    const [descRows] = await db.query(
      "SELECT description, short_label FROM requirements_table WHERE id = ?",
      [requirements_id],
    );

    if (!descRows.length)
      return res.status(404).json({ message: "Requirement not found" });

    const { description, short_label } = descRows[0];

    // ✅ Use the short_label directly from DB
    const shortLabel = short_label || "Unknown";

    const year = new Date().getFullYear();
    const ext = path.extname(req.file.originalname).toLowerCase();

    // ✅ Construct filename
    const filename = `${applicant_number}_${shortLabel}_${year}${ext}`;
    const uploadDir = path.join(
      __dirname,
      "uploads",
      "ApplicantOnlineDocuments",
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const finalPath = path.join(uploadDir, filename);

    // 🔹 Delete any existing file for the same applicant + requirement
    const [existingFiles] = await db.query(
      `SELECT upload_id, file_path FROM requirement_uploads
       WHERE person_id = ? AND requirements_id = ?`,
      [person_id, requirements_id],
    );

    for (const file of existingFiles) {
      const oldPath = path.join(
        __dirname,
        "uploads",
        "ApplicantOnlineDocuments",
        file.file_path,
      );

      try {
        await fs.promises.unlink(oldPath);
      } catch (err) {
        if (err.code !== "ENOENT")
          console.warn("File delete warning:", err.message);
      }

      await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [
        file.upload_id,
      ]);
    }

    // 🔹 Save new file
    await fs.promises.writeFile(finalPath, req.file.buffer);

    await db.query(
      `INSERT INTO requirement_uploads
        (requirements_id, person_id, file_path, original_name, status, remarks)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [
        requirements_id,
        person_id,
        filename,
        req.file.originalname,
        remarks || null,
      ],
    );

    res.status(201).json({ message: "✅ Upload successful" });
  } catch (err) {
    console.error("Upload error:", err);
    res
      .status(500)
      .json({ error: "Failed to save upload", details: err.message });
  }
});

// ✅ ADMIN DELETE
app.delete("/admin/uploads/:uploadId", async (req, res) => {
  const { uploadId } = req.params;

  try {
    // 1️⃣ Get upload row (file + person_id)
    const [uploadRows] = await db.query(
      "SELECT person_id, file_path FROM requirement_uploads WHERE upload_id = ?",
      [uploadId],
    );
    if (!uploadRows.length) {
      return res.status(404).json({ error: "Upload not found." });
    }

    const { person_id: personId, file_path: filePath } = uploadRows[0];

    // 2️⃣ Applicant info
    const [[appInfo]] = await db.query(
      `
      SELECT ant.applicant_number, pt.last_name, pt.first_name, pt.middle_name
      FROM applicant_numbering_table ant
      JOIN person_table pt ON ant.person_id = pt.person_id
      WHERE ant.person_id = ?
    `,
      [personId],
    );

    const applicant_number = appInfo?.applicant_number || "Unknown";
    const fullName = `${appInfo?.last_name || ""}, ${appInfo?.first_name || ""} ${appInfo?.middle_name?.charAt(0) || ""}.`;

    // 3️⃣ Actor (admin performing the action)
    const user_person_id = req.headers["x-person-id"];
    const { actorEmail, actorName } = await getActorInfo(user_person_id);

    // 4️⃣ Delete physical file
    if (filePath) {
      const fullPath = path.join(applicantDocsDir, filePath);

      try {
        await fs.promises.unlink(fullPath);
        console.log("🗑️ File deleted:", fullPath);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.warn("⚠️ File already missing:", fullPath);
        } else {
          console.error("File delete error:", err);
        }
      }
    }

    // 5️⃣ Delete DB record
    await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [
      uploadId,
    ]);

    // 6️⃣ Log notification
    const message = `🗑️ Deleted document (Applicant #${applicant_number} - ${fullName})`;
    await db.query(
      "INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp) VALUES (?, ?, ?, ?, ?, NOW())",
      ["delete", message, applicant_number, actorEmail, actorName],
    );

    io.emit("notification", {
      type: "delete",
      message,
      applicant_number,
      actor_email: actorEmail,
      actor_name: actorName,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ message: "✅ Upload deleted successfully." });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete the upload." });
  }
});

// ✅ Updated: Return uploads joined with requirement details
app.get("/uploads/:personId", async (req, res) => {
  const personId = req.params.personId;
  if (!personId) return res.status(400).json({ error: "Missing person ID" });

  try {
    const [results] = await db.query(
      `
      SELECT
        ru.upload_id,
        ru.requirements_id,
        ru.person_id,
        ru.file_path,
        ru.original_name,
        ru.remarks,
        ru.status,
        rt.description,
        rt.short_label
      FROM requirement_uploads ru
      LEFT JOIN requirements_table rt ON ru.requirements_id = rt.id
      WHERE ru.person_id = ?
      ORDER BY ru.upload_id DESC
    `,
      [personId],
    );

    res.json(results);
  } catch (err) {
    console.error("Fetch uploads failed:", err);
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

app.get("/api/requirements/by-status/:status", async (req, res) => {
  const { status } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM requirements_table WHERE category = 'Regular'",
      [status],
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching requirements by status:", err);
    res.status(500).send("Server error");
  }
});

app.delete("/uploads/:id", async (req, res) => {
  const person_id = req.headers["x-person-id"];
  const { id } = req.params;

  if (!person_id) {
    return res.status(401).json({ message: "Unauthorized: Missing person ID" });
  }

  try {
    const [results] = await db.query(
      "SELECT file_path FROM requirement_uploads WHERE upload_id = ? AND person_id = ?",
      [id, person_id],
    );

    if (!results.length) {
      return res.status(403).json({ error: "Unauthorized or file not found" });
    }

    const fullPath = path.join(
      __dirname,
      "uploads",
      "ApplicantOnlineDocuments",
      results[0].file_path,
    );

    try {
      await fs.promises.unlink(fullPath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("File delete error:", err);
      }
    }

    await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [id]);

    res.json({ message: "Requirement deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete requirement" });
  }
});

app.put("/api/interview_applicants/:applicant_id/status", async (req, res) => {
  const { applicant_id } = req.params;
  const { status } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE interview_applicants SET status = ? WHERE applicant_id = ?",
      [status, applicant_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Error updating applicant status:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ UPDATE Remarks ONLY (no notification, no io.emit, no evaluator lookup)
// ✅ Update remarks only
app.put("/uploads/remarks/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { remarks, user_id } = req.body;

  try {
    await db.query(
      `UPDATE requirement_uploads
       SET remarks = ?, last_updated_by = ?
       WHERE upload_id = ?`,
      [remarks || null, user_id, upload_id],
    );

    res.json({ message: "Remarks updated successfully." });
  } catch (err) {
    console.error("Error updating remarks:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Update status only
app.put("/uploads/status/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { status, user_id } = req.body;

  try {
    await db.query(
      `UPDATE requirement_uploads
       SET status = ?, last_updated_by = ?
       WHERE upload_id = ?`,
      [status, user_id, upload_id],
    );

    res.json({ message: "Status updated successfully." });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/api/registrar-status/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const { registrar_status } = req.body;

  const allowed = [0, 1, 2];
  if (!allowed.includes(Number(registrar_status))) {
    return res
      .status(400)
      .json({ error: "registrar_status must be 0, 1, or 2" });
  }

  try {
    if (Number(registrar_status) === 1) {
      await db.query(
        `UPDATE admission.requirement_uploads
         SET registrar_status = 1,
             submitted_documents = 1,
             missing_documents = '[]'
         WHERE person_id = ?`,
        [person_id],
      );
    } else {
      await db.query(
        `UPDATE admission.requirement_uploads
         SET registrar_status = 0,
             submitted_documents = 0,
             missing_documents = NULL
         WHERE person_id = ?`,
        [person_id],
      );
    }

    res.json({
      message: "✅ Registrar status updated for all docs",
      registrar_status,
    });
  } catch (err) {
    console.error("❌ Error updating registrar status:", err);
    res.status(500).json({ error: "Failed to update registrar status" });
  }
});

// ✅ Update submitted_documents by upload_id (but apply to ALL docs of that applicant)
app.put("/api/submitted-documents/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { submitted_documents, user_person_id } = req.body;

  try {
    // 1️⃣ Find person_id
    const [[row]] = await db.query(
      "SELECT person_id FROM admission.requirement_uploads WHERE upload_id = ?",
      [upload_id],
    );
    if (!row) return res.status(404).json({ error: "Upload not found" });

    const person_id = row.person_id;

    // 2️⃣ Applicant info
    const [[appInfo]] = await db.query(
      `
      SELECT ant.applicant_number, pt.last_name, pt.first_name, pt.middle_name
      FROM applicant_numbering_table ant
      JOIN person_table pt ON ant.person_id = pt.person_id
      WHERE ant.person_id = ?
    `,
      [person_id],
    );

    const applicant_number = appInfo?.applicant_number || "Unknown";
    const fullName = `${appInfo?.last_name || ""}, ${appInfo?.first_name || ""} ${appInfo?.middle_name?.charAt(0) || ""}.`;

    // 3️⃣ Actor info (FULL FORMAT identical to exam/save)
    let actorEmail = "earistmis@gmail.com";
    let actorName = "SYSTEM";

    if (user_person_id) {
      const [actorRows] = await db3.query(
        `SELECT email, role, employee_id, last_name, first_name, middle_name
         FROM user_accounts
         WHERE person_id = ? LIMIT 1`,
        [user_person_id],
      );

      if (actorRows.length > 0) {
        const u = actorRows[0];
        const role = u.role?.toUpperCase() || "UNKNOWN";
        const empId = u.employee_id || "";
        const lname = u.last_name || "";
        const fname = u.first_name || "";
        const mname = u.middle_name || "";
        const email = u.email || "";

        actorEmail = email;
        actorName = `${role} (${empId}) - ${lname}, ${fname} ${mname}`.trim();
      }
    }

    // 4️⃣ Toggle + message
    let type, message;

    if (submitted_documents === 1) {
      await db.query(
        `
        UPDATE admission.requirement_uploads
        SET submitted_documents = 1,
            registrar_status = 1,
            remarks = 1,
            missing_documents = '[]'
        WHERE person_id = ?`,
        [person_id],
      );

      type = "submit";
      message = `✅ Requirements submitted by Applicant #${applicant_number} - ${fullName}`;
    } else {
      await db.query(
        `
        UPDATE admission.requirement_uploads
        SET submitted_documents = 0,
            registrar_status = 0,
            remarks = 0,
            missing_documents = NULL
        WHERE person_id = ?`,
        [person_id],
      );

      type = "unsubmit";
      message = `↩️ Requirements unsubmitted for Applicant #${applicant_number} - ${fullName}`;
    }

    // ✅ Prevent duplicate notifications per day (same as exam/save)
    await db.query(
      `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp)
       SELECT ?, ?, ?, ?, ?, NOW()
       FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications
         WHERE applicant_number = ?
           AND message = ?
           AND DATE(timestamp) = CURDATE()
       )`,
      [
        type,
        message,
        applicant_number,
        actorEmail,
        actorName,
        applicant_number,
        message,
      ],
    );

    // ✅ Emit socket event
    io.emit("notification", {
      type,
      message,
      applicant_number,
      actor_email: actorEmail,
      actor_name: actorName,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message });
  } catch (err) {
    console.error("❌ Error toggling submitted documents:", err);
    res.status(500).json({ error: "Failed to toggle submitted documents" });
  }
});

app.get("/api/verified-exam-applicants", async (req, res) => {
  try {
    // 1️⃣ Get all verifiable Regular requirement IDs dynamically
    const [reqRows] = await db.query(`
      SELECT id
      FROM requirements_table
      WHERE category = 'Regular'
      AND is_verifiable = 1
    `);

    // 2️⃣ Convert the list of IDs into an array
    const requirementIds = reqRows.map((r) => r.id);

    if (requirementIds.length === 0) {
      return res
        .status(400)
        .json({ error: "No verifiable Regular requirements found." });
    }

    // 3️⃣ Construct placeholders for the IN clause dynamically
    const placeholders = requirementIds.map(() => "?").join(",");

    // 4️⃣ Use those IDs in the main query
    const [rows] = await db.query(
      `
      SELECT
          ea.id AS exam_applicant_id,
          ea.applicant_id,
          ant.person_id,
          p.last_name,
          p.first_name,
          p.middle_name,
          p.emailAddress,
          p.program,
          ea.schedule_id
      FROM exam_applicants ea
      JOIN applicant_numbering_table ant
          ON ea.applicant_id = ant.applicant_number
      JOIN person_table p
          ON ant.person_id = p.person_id
      WHERE ant.person_id IN (
          SELECT person_id
          FROM requirement_uploads
          WHERE document_status = 'Documents Verified & ECAT'
            AND requirements_id IN (${placeholders}) AND ea.email_sent = 1  
          GROUP BY person_id
          HAVING COUNT(DISTINCT requirements_id) = ?
      )
      ORDER BY p.last_name ASC, p.first_name ASC
      `,
      [...requirementIds, requirementIds.length],
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching verified exam applicants:", err);
    res.status(500).json({ error: "Failed to fetch verified exam applicants" });
  }
});

// Update requirements when submitted documents are checked
app.put("/api/update-requirements/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const { requirements } = req.body;

  try {
    await db.query(
      "UPDATE admission.person_status_table SET requirements = ? WHERE person_id = ?",
      [requirements, person_id],
    );
    res.json({ success: true, message: "Requirements updated" });
  } catch (error) {
    console.error("❌ Error updating requirements:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update requirements" });
  }
});

app.put("/uploads/document-status/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { document_status, user_id } = req.body;

  if (!document_status || !user_id) {
    return res
      .status(400)
      .json({ error: "document_status and user_id are required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE requirement_uploads SET document_status = ?, last_updated_by = ? WHERE upload_id = ?",
      [document_status, user_id, upload_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Upload not found" });
    }

    res.json({ success: true, message: "Document status updated" });
  } catch (err) {
    console.error("❌ Failed to update document status:", err);
    res.status(500).json({ error: "Failed to update document status" });
  }
});

// Update person.document_status directly

// ✅ Fetch all applicant uploads (admin use)
app.get("/uploads/all", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT
        ru.upload_id,
        ru.requirements_id,
        ru.person_id,
        ru.file_path,
        ru.original_name,
        ru.remarks,
        ru.status,
        ru.document_status,
        ru.registrar_status,
        ru.created_at,
        rt.description,
        p.applicant_number,
        p.first_name,
        p.middle_name,
        p.last_name,
       ua.email AS evaluator_email,
       ua.role AS evaluator_role
      FROM requirement_uploads ru
      JOIN requirements_table rt ON ru.requirements_id = rt.id
      JOIN person_table p ON ru.person_id = p.person_id
    `);
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching all uploads:", err);
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

// Update document_status and store who updated it
app.put("/uploads/document-status/:id", async (req, res) => {
  const { document_status, user_id } = req.body;
  const uploadId = req.params.id;

  try {
    const sql = `
      UPDATE requirement_uploads
      SET document_status = ?, last_updated_by = ?
      WHERE upload_id = ?
    `;
    await db.query(sql, [document_status, user_id, uploadId]);

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating document status:", err);
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
});

// ✅ Get uploads by applicant_number (Admin use)
app.get("/uploads/by-applicant/:applicant_number", async (req, res) => {
  const applicant_number = req.params.applicant_number;

  try {
    const [personResult] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
      [applicant_number],
    );

    if (personResult.length === 0) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const person_id = personResult[0].person_id;

    const [uploads] = await db.query(
      `
      SELECT
        ru.upload_id,
        ru.requirements_id,
        ru.person_id,
        ru.file_path,
        ru.original_name,
        ru.remarks,
        ru.status,

        CASE
          WHEN ru.status = 1 THEN 'Approved'
          WHEN ru.status = 2 THEN 'Rejected'
          ELSE 'Pending'
        END AS status_label,

        ru.document_status,
        ru.registrar_status,
        ru.created_at,
        rt.description,

        CASE
          WHEN LOWER(rt.description) LIKE '%form 138%' THEN 'Form138'
          WHEN LOWER(rt.description) LIKE '%good moral%' THEN 'GoodMoralCharacter'
          WHEN LOWER(rt.description) LIKE '%birth certificate%' THEN 'BirthCertificate'
          WHEN LOWER(rt.description) LIKE '%graduating class%' THEN 'CertificateOfGraduatingClass'
          WHEN LOWER(rt.description) LIKE '%vaccine card%' THEN 'VaccineCard'
          ELSE 'Unknown'
        END AS short_label,

        ua.email AS evaluator_email,
        ua.role  AS evaluator_role,
        pr.lname AS evaluator_lname,
        pr.fname AS evaluator_fname,
        pr.mname AS evaluator_mname

      FROM requirement_uploads ru
      JOIN requirements_table rt
        ON ru.requirements_id = rt.id
      LEFT JOIN enrollment.user_accounts ua
        ON ru.last_updated_by = ua.person_id
      LEFT JOIN enrollment.prof_table pr
        ON ua.person_id = pr.person_id
      WHERE ru.person_id = ?
      `,
      [person_id],
    );

    res.status(200).json(uploads);
  } catch (err) {
    console.error("Error fetching uploads by applicant number:", err);
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
});

// ✅ Update document status and track who edited
app.put("/uploads/document-status/:uploadId", (req, res) => {
  const { document_status } = req.body;
  const { uploadId } = req.params;

  // 👇 Example: take user_id from authenticated user
  const registrarPersonId = req.user.person_id; // middleware should set this from JWT

  if (!document_status || !registrarPersonId) {
    return res
      .status(400)
      .json({ error: "document_status and registrar is required" });
  }

  const sql = `
    UPDATE requirement_uploads
    SET document_status = ?, last_updated_by = ?, registrar_status = 1, created_at = NOW()
    WHERE upload_id = ?
  `;

  db3.query(
    sql,
    [document_status, registrarPersonId, uploadId],
    (err, result) => {
      if (err) {
        console.error("❌ Failed to update document status:", err);
        return res
          .status(500)
          .json({ error: "Failed to update document status" });
      }
      res.json({ success: true, message: "Document status updated", result });
    },
  );
});

// ✅ Get uploads with evaluator info

// Add to server.js
// 📌 GET persons and their applicant numbers for AdminRequirementsPanel.jsx
app.get("/api/upload_documents", async (req, res) => {
  try {
    const [persons] = await db.query(`
      SELECT
        pt.person_id,
        pt.first_name,
        pt.middle_name,
        pt.last_name,
        pt.profile_img,
        pt.height,
        pt.generalAverage1,
        pt.emailAddress,
        ant.applicant_number
      FROM person_table pt
      LEFT JOIN applicant_numbering_table ant ON pt.person_id = ant.person_id
    `);

    res.status(200).json(persons);
  } catch (error) {
    console.error("❌ Error fetching upload documents:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications ORDER BY timestamp DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------------------------------- GET APPLICANT ADMISSION DATA ------------------------------------------------//
app.get("/api/medical-applicants", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        snt.student_number,
        p.person_id,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.extension,
        p.program,
        pgt.program_code,
        p.emailAddress,
        p.generalAverage,
        p.generalAverage1,
        p.campus,
        p.created_at,
        p.birthOfDate,
        p.gender,
        p.strand,
        a.applicant_number,
        SUBSTRING(a.applicant_number, 5, 1) AS middle_code,
        ea.schedule_id,
        ees.day_description AS exam_day,
        ees.room_description AS exam_room,
        ees.start_time AS exam_start_time,
        ees.end_time AS exam_end_time,

        /* latest prioritized upload id for this person */
        ruprio.upload_id AS upload_id,
        ruprio.submitted_medical,

        /* ✅ allow NULL values to pass through */
        ruprio.submitted_documents,
        ruprio.registrar_status,

        /* collect missing_documents across uploads if you still want to show aggregated missing docs */
        ruagg.all_missing_docs,

        ruprio.document_status,
        ruprio.created_at AS last_updated,
        ps.exam_status,

        /* ✅ NEW: how many required docs are verified */
        COALESCE(vdocs.verified_count, 0) AS required_docs_verified

      FROM admission.person_table AS p
      LEFT JOIN admission.applicant_numbering_table AS a
        ON p.person_id = a.person_id
      LEFT JOIN admission.exam_applicants AS ea
        ON a.applicant_number = ea.applicant_id
      LEFT JOIN admission.entrance_exam_schedule AS ees
        ON ea.schedule_id = ees.schedule_id
       LEFT JOIN enrollment.program_table AS pgt ON p.program = pgt.program_id
      INNER JOIN enrollment.person_table AS pst ON p.emailAddress = pst.emailAddress
      INNER JOIN enrollment.student_numbering_table AS snt
        ON pst.person_id = snt.person_id

      /* get aggregated missing_documents for display only */
      LEFT JOIN (
        SELECT
          person_id,
          GROUP_CONCAT(missing_documents SEPARATOR '||') AS all_missing_docs
        FROM admission.requirement_uploads
        GROUP BY person_id
      ) AS ruagg ON ruagg.person_id = p.person_id

      /* ✅ get the prioritized row per applicant */
      LEFT JOIN admission.requirement_uploads AS ruprio
        ON ruprio.upload_id = (
          SELECT ru2.upload_id
          FROM admission.requirement_uploads ru2
          WHERE ru2.person_id = p.person_id
          ORDER BY
            CASE
              WHEN ru2.document_status = 'Disapproved' THEN 1
              WHEN ru2.document_status = 'Program Closed' THEN 2
              WHEN ru2.document_status = 'Documents Verified & ECAT' THEN 3
              WHEN ru2.document_status = 'On process' THEN 4
              ELSE 5
            END ASC,
            ru2.upload_id DESC
          LIMIT 1
        )

      LEFT JOIN admission.person_status_table AS ps
        ON p.person_id = ps.person_id

      /* ✅ subquery: count verified docs for this applicant */
      LEFT JOIN (
        SELECT person_id, COUNT(DISTINCT requirements_id) AS verified_count
        FROM admission.requirement_uploads
        WHERE document_status = 'Documents Verified & ECAT'
          AND requirements_id IN (1,2,3,4)
        GROUP BY person_id
      ) AS vdocs ON vdocs.person_id = p.person_id

      ORDER BY p.last_name ASC, p.first_name ASC
    `);

    // Parse aggregated missing_documents into array (if present)
    const merged = rows.map((r) => {
      let mergedDocs = [];
      if (r.all_missing_docs) {
        const parts = r.all_missing_docs.split("||");
        const all = parts.flatMap((item) => {
          try {
            if (!item || item === "null") return [];
            return JSON.parse(item);
          } catch {
            return [];
          }
        });
        mergedDocs = [...new Set(all)];
      }
      return {
        ...r,
        missing_documents: mergedDocs,
      };
    });

    res.json(merged);
  } catch (err) {
    console.error("❌ Error fetching all applicants:", err);
    res.status(500).send("Server error");
  }
});


app.get("/api/all-applicants", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        snt.student_number,
        p.person_id,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.extension,
        p.program,
        pgt.program_code,
        p.emailAddress,
        p.generalAverage,
        p.generalAverage1,
        p.campus,
        p.created_at,
        p.birthOfDate,
        p.gender,
        p.strand,
        a.applicant_number,
        SUBSTRING(a.applicant_number, 5, 1) AS middle_code,
        ea.schedule_id,
        ees.day_description AS exam_day,
        ees.room_description AS exam_room,
        ees.start_time AS exam_start_time,
        ees.end_time AS exam_end_time,

        /* latest prioritized upload id for this person */
        ruprio.upload_id AS upload_id,
        ruprio.submitted_medical,

        /* ✅ allow NULL values to pass through */
        ruprio.submitted_documents,
        ruprio.registrar_status,

        /* collect missing_documents across uploads if you still want to show aggregated missing docs */
        ruagg.all_missing_docs,

        ruprio.document_status,
        ruprio.created_at AS last_updated,
        ps.exam_status,

        /* ✅ NEW: how many required docs are verified */
        COALESCE(vdocs.verified_count, 0) AS required_docs_verified

      FROM admission.person_table AS p
      LEFT JOIN admission.applicant_numbering_table AS a
        ON p.person_id = a.person_id
      LEFT JOIN admission.exam_applicants AS ea
        ON a.applicant_number = ea.applicant_id
      LEFT JOIN admission.entrance_exam_schedule AS ees
        ON ea.schedule_id = ees.schedule_id
       LEFT JOIN enrollment.program_table AS pgt ON p.program = pgt.program_id
      LEFT JOIN enrollment.student_numbering_table AS snt
        ON p.person_id = snt.person_id

      /* get aggregated missing_documents for display only */
      LEFT JOIN (
        SELECT
          person_id,
          GROUP_CONCAT(missing_documents SEPARATOR '||') AS all_missing_docs
        FROM admission.requirement_uploads
        GROUP BY person_id
      ) AS ruagg ON ruagg.person_id = p.person_id

      /* ✅ get the prioritized row per applicant */
      LEFT JOIN admission.requirement_uploads AS ruprio
        ON ruprio.upload_id = (
          SELECT ru2.upload_id
          FROM admission.requirement_uploads ru2
          WHERE ru2.person_id = p.person_id
          ORDER BY
            CASE
              WHEN ru2.document_status = 'Disapproved' THEN 1
              WHEN ru2.document_status = 'Program Closed' THEN 2
              WHEN ru2.document_status = 'Documents Verified & ECAT' THEN 3
              WHEN ru2.document_status = 'On process' THEN 4
              ELSE 5
            END ASC,
            ru2.upload_id DESC
          LIMIT 1
        )

      LEFT JOIN admission.person_status_table AS ps
        ON p.person_id = ps.person_id

      /* ✅ subquery: count verified docs for this applicant */
      LEFT JOIN (
        SELECT person_id, COUNT(DISTINCT requirements_id) AS verified_count
        FROM admission.requirement_uploads
        WHERE document_status = 'Documents Verified & ECAT'
          AND requirements_id IN (1,2,3,4)
        GROUP BY person_id
      ) AS vdocs ON vdocs.person_id = p.person_id

      ORDER BY p.last_name ASC, p.first_name ASC
    `);

    // Parse aggregated missing_documents into array (if present)
    const merged = rows.map((r) => {
      let mergedDocs = [];
      if (r.all_missing_docs) {
        const parts = r.all_missing_docs.split("||");
        const all = parts.flatMap((item) => {
          try {
            if (!item || item === "null") return [];
            return JSON.parse(item);
          } catch {
            return [];
          }
        });
        mergedDocs = [...new Set(all)];
      }
      return {
        ...r,
        missing_documents: mergedDocs,
      };
    });

    res.json(merged);
  } catch (err) {
    console.error("❌ Error fetching all applicants:", err);
    res.status(500).send("Server error");
  }
});

// UPDATED --------------------------------------------------------- 11/16/2025


// ================= VERIFIED & ECAT APPLICANTS =================
// ================= VERIFIED & ECAT APPLICANTS =================
app.get("/api/verified-ecat-applicants", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT DISTINCT
        p.person_id,
        p.last_name,
        p.campus,
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
        ees.day_description,
        ees.room_description,
        ees.start_time,
        ees.end_time,
        ps.exam_status
      FROM admission.person_table AS p
      LEFT JOIN admission.applicant_numbering_table AS a
        ON p.person_id = a.person_id
      LEFT JOIN admission.exam_applicants AS ea
        ON a.applicant_number = ea.applicant_id
      LEFT JOIN admission.entrance_exam_schedule AS ees
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

// ================= ENTRANCE EXAM SCHEDULE =================

// NEW API
app.post("/api/update-grade", async (req, res) => {
  const { course_id, student_number, final_grade } = req.body;
  console.log("Enrolled ID", course_id);
  console.log("Student Number", student_number);
  console.log("Final Grade", final_grade);

  if (!course_id || !student_number || final_grade === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [result] = await db3.execute(
      `UPDATE enrolled_subject
             SET final_grade = ?
             WHERE student_number = ? AND course_id = ?`,
      [final_grade, student_number, course_id],
    );

    res.json({ success: true, message: "Grade updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update grade" });
  }
});

app.get("/api/all-students", async (req, res) => {
  try {
    const [rows] = await db3.execute(`
      SELECT DISTINCT
        ru.requirements_id,
        yt.year_id,
        smt.semester_id,
        ylt.year_level_id,
        dt.dprtmnt_id,
        pgt.program_id,
        snt.student_number,
        pt.campus,
        es.en_remarks,
        rt.description,
        pt.first_name,
        pt.last_name,
        pt.middle_name,
        pt.emailAddress,
        cct.curriculum_id,
        dt.dprtmnt_code, pgt.program_description, pt.birthOfDate, pt.gender, yt.year_description, smt.semester_description, ylt.year_level_description  FROM enrolled_subject AS es
      LEFT JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
      LEFT JOIN person_table AS pt ON snt.person_id = pt.person_id
      INNER JOIN requirement_uploads AS ru ON snt.person_id = ru.person_id
      INNER JOIN requirements_table AS rt ON ru.requirements_id = rt.id
      LEFT JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
      LEFT JOIN program_table AS pgt ON cct.program_id = pgt.program_id
      LEFT JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
      LEFT JOIN year_table AS yt ON sy.year_id = yt.year_id
      LEFT JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      LEFT JOIN program_tagging_table AS ptt ON es.curriculum_id = ptt.curriculum_id
     		AND es.course_id = ptt.course_id AND sy.semester_id = ptt.semester_id
      LEFT JOIN year_level_table AS ylt ON ptt.year_level_id = ylt.year_level_id
      LEFT JOIN dprtmnt_curriculum_table AS dct ON cct.curriculum_id = dct.dprtmnt_curriculum_id
      LEFT JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id;`);

    res.json(rows);
    console.log("student list:", rows);
  } catch (err) {
    console.error("❌ Error fetching all students:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Import Excel to person_status_table + update interview_applicants.status (optimized)

app.post("/cancel-unscheduled-applicants", async (req, res) => {
  try {
    // 1️⃣ Get the short_term from company_settings
    const [[settings]] = await db.query(`
      SELECT short_term FROM company_settings WHERE id = 1
    `);
    const shortTerm = settings?.short_term || "EARIST"; // fallback

    // 2️⃣ Get all applicants with NO exam schedule
    const [rows] = await db.query(`
      SELECT
        ea.applicant_id,
        ant.person_id,
        pt.emailAddress AS email,
        pt.first_name,
        pt.last_name
      FROM exam_applicants ea
      JOIN applicant_numbering_table ant
        ON ant.applicant_number = ea.applicant_id
      JOIN person_table pt
        ON pt.person_id = ant.person_id
      WHERE ea.schedule_id IS NULL
    `);

    console.log("UNSCHEDULED:", rows);

    if (rows.length === 0) {
      return res.json({
        success: true,
        message: "No unscheduled applicants found.",
      });
    }

    let count = 0;

    for (const a of rows) {
      // 3️⃣ Update admission_exam → status = Cancelled
      await db.query(
        `UPDATE admission_exam
         SET status = 'CANCELLED'
         WHERE person_id = ?`,
        [a.person_id],
      );

      // 4️⃣ Email contents with short_term applied
      const mailOptions = {
        from: `"${shortTerm} - Admission Office" <${process.env.EMAIL_USER}>`,
        to: a.email,
        subject: `${shortTerm} Admission — Application Cancelled`,
        text: `
Good day ${a.first_name} ${a.last_name},

Thank you for applying to ${shortTerm}.

After a thorough evaluation of your submitted documents, we regret to inform you that your application was not selected to proceed to the next stage of the admission process.

We sincerely appreciate your interest in becoming part of ${shortTerm} and encourage you to explore opportunities that may best align with your academic goals.

Thank you once again for applying.

Sincerely,
${shortTerm} - Admission Office
        `,
      };

      // 5️⃣ Send email
      try {
        await transporter.sendMail(mailOptions);
        console.log("EMAIL SENT TO:", a.email);
      } catch (emailErr) {
        console.error("Email failed:", emailErr);
      }

      count++;
    }

    res.json({
      success: true,
      message: `${count} unscheduled applicants were cancelled and notified.`,
    });
  } catch (error) {
    console.error("❌ Error cancelling applicants:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api-applicant-scoring", async (req, res) => {
  try {
    const [rows] = await db.execute(`
     SELECT
        p.person_id,
        p.campus,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.extension,
        a.applicant_number,
        SUBSTRING(a.applicant_number, 5, 1) AS middle_code,
        p.program,
        p.created_at,

        -- Exam scores
        e.English AS english,
        e.Science AS science,
        e.Filipino AS filipino,
        e.Math AS math,
        e.Abstract AS abstract,
        COALESCE(
          e.final_rating,
          (COALESCE(e.English,0) + COALESCE(e.Science,0) + COALESCE(e.Filipino,0) + COALESCE(e.Math,0) + COALESCE(e.Abstract,0)) / 5
        ) AS final_rating,

        e.status AS status,

        COALESCE(ps.exam_result, 0)        AS total_ave,
        COALESCE(ps.qualifying_result, 0)  AS qualifying_exam_score,
        COALESCE(ps.interview_result, 0)   AS qualifying_interview_score,

        ia.status AS college_approval_status

      FROM admission.person_table p
      INNER JOIN admission.applicant_numbering_table a
        ON p.person_id = a.person_id
      LEFT JOIN admission.admission_exam e
        ON p.person_id = e.person_id
      LEFT JOIN admission.person_status_table ps
        ON p.person_id = ps.person_id
      LEFT JOIN admission.interview_applicants ia
        ON ia.applicant_id = a.applicant_number
      LEFT JOIN admission.exam_applicants ea ON a.applicant_number = ea.applicant_id
      WHERE ea.email_sent = 1
      ORDER BY p.person_id ASC;
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching applicants with number:", err);
    res.status(500).send("Server error");
  }
});

// Assign Max Slots
app.put("/api/interview_applicants/assign-max", async (req, res) => {
  try {
    const { dprtmnt_id, schoolYear, semester } = req.body;

    if (!dprtmnt_id || !schoolYear || !semester) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get top applicants for that dept, year, sem
    const [topApplicants] = await db.query(
      `SELECT ea.applicant_id
       FROM exam_applicants ea
       WHERE ea.dprtmnt_id = ? AND ea.school_year = ? AND ea.semester = ?
       ORDER BY ea.total_score DESC, ea.exam_date ASC`,
      [dprtmnt_id, schoolYear, semester],
    );

    if (!topApplicants.length) {
      return res.json({ success: false, message: "No applicants found" });
    }

    // Insert/update into interview_applicants with action = 1
    for (const applicant of topApplicants) {
      await db.query(
        `INSERT INTO interview_applicants (applicant_id, action, email_sent)
         VALUES (?, 1, 0)
         ON DUPLICATE KEY UPDATE action = 1`,
        [applicant.applicant_id],
      );
    }

    res.json({ success: true, count: topApplicants.length });
  } catch (err) {
    console.error("Error in assign-max:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Assign Custom Slots
app.put("/api/interview_applicants/assign-custom", async (req, res) => {
  try {
    const { dprtmnt_id, schoolYear, semester, count } = req.body;

    if (!dprtmnt_id || !schoolYear || !semester || !count) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get top N applicants
    const [topApplicants] = await db.query(
      `SELECT ea.applicant_id
       FROM exam_applicants ea
       WHERE ea.dprtmnt_id = ? AND ea.school_year = ? AND ea.semester = ?
       ORDER BY ea.total_score DESC, ea.exam_date ASC
       LIMIT ?`,
      [dprtmnt_id, schoolYear, semester, Number(count)],
    );

    if (!topApplicants.length) {
      return res.json({ success: false, message: "No applicants found" });
    }

    // Insert/update into interview_applicants with action = 1
    for (const applicant of topApplicants) {
      await db.query(
        `INSERT INTO interview_applicants (applicant_id, action, email_sent)
         VALUES (?, 1, 0)
         ON DUPLICATE KEY UPDATE action = 1`,
        [applicant.applicant_id],
      );
    }

    res.json({ success: true, count: topApplicants.length });
  } catch (err) {
    console.error("Error in assign-custom:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/applicants-with-number", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        p.person_id,
        p.emailAddress,
        p.campus,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.extension,
        a.applicant_number,
        SUBSTRING(a.applicant_number, 5, 1) AS middle_code,
        p.program,
        p.generalAverage1,
        p.created_at,
        ia.status AS interview_status,
        ia.action,
        ia.email_sent,
        -- Exam scores
        e.English AS english,
        e.Science AS science,
        e.Filipino AS filipino,
        e.Math AS math,
        e.Abstract AS abstract,
        COALESCE(
          e.final_rating,
          (COALESCE(e.English,0) + COALESCE(e.Science,0) + COALESCE(e.Filipino,0) + COALESCE(e.Math,0) + COALESCE(e.Abstract,0))
        ) AS final_rating,

        e.status AS exam_status,

        -- From person_status_table
        COALESCE(ps.exam_result, 0)        AS total_ave,
        COALESCE(ps.qualifying_result, 0)  AS qualifying_exam_score,
        COALESCE(ps.interview_result, 0)   AS qualifying_interview_score,

        -- College Approval
        ia.status AS college_approval_status

      FROM admission.person_table p
      INNER JOIN admission.applicant_numbering_table a
        ON p.person_id = a.person_id
      LEFT JOIN admission.admission_exam e
        ON p.person_id = e.person_id
      LEFT JOIN admission.person_status_table ps
        ON p.person_id = ps.person_id
      LEFT JOIN admission.interview_applicants ia
        ON ia.applicant_id = a.applicant_number

      ORDER BY p.person_id ASC;
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching applicants with number:", err);
    res.status(500).send("Server error");
  }
});

// Get full person info + applicant_number
app.get("/api/person_with_applicant/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [[person]] = await db.query(
      `
      SELECT
        pt.*,
        ant.applicant_number
      FROM person_table pt
      JOIN applicant_numbering_table ant ON pt.person_id = ant.person_id
      WHERE pt.person_id = ? OR ant.applicant_number = ?
      LIMIT 1
    `,
      [id, id],
    );

    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    // get latest document status + evaluator
    const [rows] = await db.query(
      `
      SELECT
        ru.document_status    AS upload_document_status,
        rt.id                 AS requirement_id,
        ua.email              AS evaluator_email,
        ua.role               AS evaluator_role,
        pr.fname              AS evaluator_fname,
        pr.mname              AS evaluator_mname,
        pr.lname              AS evaluator_lname,
        ru.created_at,
        ru.last_updated_by
      FROM requirement_uploads AS ru
      LEFT JOIN requirements_table AS rt ON ru.requirements_id = rt.id
      LEFT JOIN enrollment.user_accounts ua ON ru.last_updated_by = ua.person_id
      LEFT JOIN enrollment.prof_table pr   ON ua.person_id = pr.person_id
      WHERE ru.person_id = ?
      ORDER BY ru.created_at DESC
      LIMIT 1
    `,
      [person.person_id],
    );

    if (rows.length > 0) {
      person.document_status = rows[0].upload_document_status || "On process";
      person.evaluator = rows[0];
    } else {
      person.document_status = "On process";
      person.evaluator = null;
    }

    res.json(person);
  } catch (err) {
    console.error("❌ Error fetching person_with_applicant:", err);
    res.status(500).json({ error: "Failed to fetch person" });
  }
});

// Count how many applicants are enrolled
app.get("/api/enrolled-count", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM person_table WHERE classifiedAs = 'Freshman (First Year)' OR classifiedAs = 'Transferee' OR classifiedAs = 'Returnee'",
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error fetching enrolled count:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/notify-submission", async (req, res) => {
  const { person_id } = req.body;

  if (!person_id) {
    return res.status(400).json({ message: "Missing person_id" });
  }

  try {
    const [[appInfo]] = await db.query(
      `
      SELECT
        ant.applicant_number,
        pt.last_name,
        pt.first_name,
        pt.middle_name
      FROM applicant_numbering_table ant
      JOIN person_table pt ON ant.person_id = pt.person_id
      WHERE ant.person_id = ?
    `,
      [person_id],
    );

    const applicant_number = appInfo?.applicant_number || "Unknown";
    const fullName = `${appInfo?.last_name || ""}, ${appInfo?.first_name || ""} ${appInfo?.middle_name?.charAt(0) || ""}.`;

    const message = `✅ Applicant #${applicant_number} - ${fullName} submitted their form.`;

    // Save to notifications table
    await db.query(
      "INSERT INTO notifications (type, message, applicant_number) VALUES (?, ?, ?)",
      ["submit", message, applicant_number],
    );

    // Emit notification
    io.emit("notification", {
      type: "submit",
      message,
      applicant_number,
      timestamp: new Date().toISOString(),
      by: null, // prevents "Unknown - System" from being shown
    });

    res.json({ message: "Submission notification sent." });
  } catch (err) {
    console.error("Notification error:", err);
    res.status(500).json({ message: "Failed to notify", error: err.message });
  }
});

// ✅ GET person details by person_id
app.get("/api/person/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      `
      SELECT pt.*, ant.applicant_number
      FROM applicant_numbering_table AS ant
      LEFT JOIN person_table AS pt ON ant.person_id = pt.person_id
      WHERE pt.person_id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// 🛡 ALLOWED FIELDS IN person_table — prevents invalid updates
const allowedFields = new Set([
  "profile_img",
  "campus",
  "academicProgram",
  "classifiedAs",
  "applyingAs",
  "program",
  "program2",
  "program3",
  "yearLevel",
  "last_name",
  "first_name",
  "middle_name",
  "extension",
  "nickname",
  "height",
  "weight",
  "lrnNumber",
  "nolrnNumber",
  "gender",
  "pwdMember",
  "pwdType",
  "pwdId",
  "birthOfDate",
  "age",
  "birthPlace",
  "languageDialectSpoken",
  "citizenship",
  "religion",
  "civilStatus",
  "tribeEthnicGroup",
  "cellphoneNumber",
  "emailAddress",
  "presentStreet",
  "presentBarangay",
  "presentZipCode",
  "presentRegion",
  "presentProvince",
  "presentMunicipality",
  "presentDswdHouseholdNumber",
  "sameAsPresentAddress",
  "permanentStreet",
  "permanentBarangay",
  "permanentZipCode",
  "permanentRegion",
  "permanentProvince",
  "permanentMunicipality",
  "permanentDswdHouseholdNumber",
  "solo_parent",
  "father_deceased",
  "father_family_name",
  "father_given_name",
  "father_middle_name",
  "father_ext",
  "father_nickname",
  "father_education",
  "father_education_level",
  "father_last_school",
  "father_course",
  "father_year_graduated",
  "father_school_address",
  "father_contact",
  "father_occupation",
  "father_employer",
  "father_income",
  "father_email",
  "mother_deceased",
  "mother_family_name",
  "mother_given_name",
  "mother_middle_name",
  "mother_ext",
  "mother_nickname",
  "mother_education",
  "mother_education_level",
  "mother_last_school",
  "mother_course",
  "mother_year_graduated",
  "mother_school_address",
  "mother_contact",
  "mother_occupation",
  "mother_employer",
  "mother_income",
  "mother_email",
  "guardian",
  "guardian_family_name",
  "guardian_given_name",
  "guardian_middle_name",
  "guardian_ext",
  "guardian_nickname",
  "guardian_address",
  "guardian_contact",
  "guardian_email",
  "annual_income",
  "schoolLevel",
  "schoolLastAttended",
  "schoolAddress",
  "courseProgram",
  "honor",
  "generalAverage",
  "yearGraduated",
  "schoolLevel1",
  "schoolLastAttended1",
  "schoolAddress1",
  "courseProgram1",
  "honor1",
  "generalAverage1",
  "yearGraduated1",
  "strand",
  "cough",
  "colds",
  "fever",
  "asthma",
  "faintingSpells",
  "heartDisease",
  "tuberculosis",
  "frequentHeadaches",
  "hernia",
  "chronicCough",
  "headNeckInjury",
  "hiv",
  "highBloodPressure",
  "diabetesMellitus",
  "allergies",
  "cancer",
  "smokingCigarette",
  "alcoholDrinking",
  "hospitalized",
  "hospitalizationDetails",
  "medications",
  "hadCovid",
  "covidDate",
  "vaccine1Brand",
  "vaccine1Date",
  "vaccine2Brand",
  "vaccine2Date",
  "booster1Brand",
  "booster1Date",
  "booster2Brand",
  "booster2Date",
  "chestXray",
  "cbc",
  "urinalysis",
  "otherworkups",
  "symptomsToday",
  "remarks",
  "termsOfAgreement",
  "created_at",
  "current_step",
]);

// ✅ PUT update person details by person_id (SAFE VERSION)
app.put("/api/person/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    // 🧼 Clean + FILTER only allowed columns
    const cleanedEntries = Object.entries(req.body)
      .filter(([key, value]) => allowedFields.has(key)) // ❗ ignores applicant_number
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, value === "" ? null : value]);

    if (cleanedEntries.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const setClause = cleanedEntries.map(([key]) => `${key}=?`).join(", ");
    const values = cleanedEntries.map(([_, val]) => val);
    values.push(id);

    const sql = `UPDATE person_table SET ${setClause} WHERE person_id=?`;
    const [result] = await db.execute(sql, values);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Person not found or no changes made" });
    }

    res.json({ message: "✅ Person updated successfully" });
  } catch (error) {
    console.error("❌ Error updating person:", error);
    res.status(500).json({
      error: "Database error during update",
      details: error.message,
    });
  }
});



// ✅ Fetch full record
app.get("/api/person/enrollment_data/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const [rows] = await db3.query(
    `
    SELECT p.*, s.student_number
    FROM person_table p
    LEFT JOIN student_numbering_table s ON p.person_id = s.person_id
    WHERE p.person_id = ?
  `,
    [person_id],
  );
  if (!rows.length)
    return res.status(404).json({ message: "Person not found" });
  res.json(rows[0]);
});

// ✅ Update person in ENROLLMENT DB (db3)
app.put("/api/enrollment/person/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const updatedData = req.body;

  try {
    const [result] = await db3.query(
      "UPDATE person_table SET ? WHERE person_id = ?",
      [updatedData, person_id],
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ message: "Person not found in ENROLLMENT" });

    res.json({
      success: true,
      message: "Person updated successfully in ENROLLMENT DB3",
    });
  } catch (err) {
    console.error("❌ Error updating person in ENROLLMENT DB:", err);
    res.status(500).json({ error: "Failed to update person in ENROLLMENT DB" });
  }
});

// ===========================================================
// ✅ STUDENT — can update ONLY their own personal information
//     (db3 ENROLLMENT person_table)
// ===========================================================
app.put("/api/student/update_person/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const updatedData = req.body;

  try {
    // ❗ OPTIONAL: Prevent updating fields students should NOT touch
    const allowed = [
      "profile_img",
      "campus",
      "academicProgram",
      "classifiedAs",
      "applyingAs",
      "program",
      "program2",
      "program3",
      "yearLevel",
      "last_name",
      "first_name",
      "middle_name",
      "extension",
      "nickname",
      "height",
      "weight",
      "lrnNumber",
      "nolrnNumber",
      "gender",
      "pwdMember",
      "pwdType",
      "pwdId",
      "birthOfDate",
      "age",
      "birthPlace",
      "languageDialectSpoken",
      "citizenship",
      "religion",
      "civilStatus",
      "tribeEthnicGroup",
      "cellphoneNumber",
      "emailAddress",
      "presentStreet",
      "presentBarangay",
      "presentZipCode",
      "presentRegion",
      "presentProvince",
      "presentMunicipality",
      "presentDswdHouseholdNumber",
      "sameAsPresentAddress",
      "permanentStreet",
      "permanentBarangay",
      "permanentZipCode",
      "permanentRegion",
      "permanentProvince",
      "permanentMunicipality",
      "permanentDswdHouseholdNumber",
      "solo_parent",
      "father_deceased",
      "father_family_name",
      "father_given_name",
      "father_middle_name",
      "father_ext",
      "father_nickname",
      "father_education",
      "father_education_level",
      "father_last_school",
      "father_course",
      "father_year_graduated",
      "father_school_address",
      "father_contact",
      "father_occupation",
      "father_employer",
      "father_income",
      "father_email",
      "mother_deceased",
      "mother_family_name",
      "mother_given_name",
      "mother_middle_name",
      "mother_ext",
      "mother_nickname",
      "mother_education",
      "mother_education_level",
      "mother_last_school",
      "mother_course",
      "mother_year_graduated",
      "mother_school_address",
      "mother_contact",
      "mother_occupation",
      "mother_employer",
      "mother_income",
      "mother_email",
      "guardian",
      "guardian_family_name",
      "guardian_given_name",
      "guardian_middle_name",
      "guardian_ext",
      "guardian_nickname",
      "guardian_address",
      "guardian_contact",
      "guardian_email",
      "annual_income",
      "schoolLevel",
      "schoolLastAttended",
      "schoolAddress",
      "courseProgram",
      "honor",
      "generalAverage",
      "yearGraduated",
      "schoolLevel1",
      "schoolLastAttended1",
      "schoolAddress1",
      "courseProgram1",
      "honor1",
      "generalAverage1",
      "yearGraduated1",
      "strand",
      "cough",
      "colds",
      "fever",
      "asthma",
      "faintingSpells",
      "heartDisease",
      "tuberculosis",
      "frequentHeadaches",
      "hernia",
      "chronicCough",
      "headNeckInjury",
      "hiv",
      "highBloodPressure",
      "diabetesMellitus",
      "allergies",
      "cancer",
      "smokingCigarette",
      "alcoholDrinking",
      "hospitalized",
      "hospitalizationDetails",
      "medications",
      "hadCovid",
      "covidDate",
      "vaccine1Brand",
      "vaccine1Date",
      "vaccine2Brand",
      "vaccine2Date",
      "booster1Brand",
      "booster1Date",
      "booster2Brand",
      "booster2Date",
      "chestXray",
      "cbc",
      "urinalysis",
      "otherworkups",
      "symptomsToday",
      "remarks",
      "termsOfAgreement",
      "created_at",
      "current_step",
    ];

    // Remove all fields NOT allowed
    const cleanPayload = {};
    for (const key of Object.keys(updatedData)) {
      if (allowed.includes(key)) {
        cleanPayload[key] = updatedData[key];
      }
    }

    const [result] = await db3.query(
      "UPDATE person_table SET ? WHERE person_id = ?",
      [cleanPayload, person_id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Person not found in ENROLLMENT DB" });
    }

    res.json({
      success: true,
      message: "Student information updated successfully (DB3)",
    });
  } catch (err) {
    console.error("❌ Error updating student (DB3):", err);
    res.status(500).json({ error: "Failed to update student record" });
  }
});

// GET for Dashboard1
app.get("/api/dashboard1/:id", checkStepAccess(1), async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.execute(
    "SELECT * FROM person_table WHERE person_id = ?",
    [id],
  );
  res.json(rows[0]);
});

// GET for Dashboard2
app.get("/api/dashboard2/:id", checkStepAccess(2), async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.execute(
    "SELECT * FROM person_table WHERE person_id = ?",
    [id],
  );
  res.json(rows[0]);
});

// GET for Dashboard3
app.get("/api/dashboard3/:id", checkStepAccess(3), async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.execute(
    "SELECT * FROM person_table WHERE person_id = ?",
    [id],
  );
  res.json(rows[0]);
});

// GET for Dashboard4
app.get("/api/dashboard4/:id", checkStepAccess(4), async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.execute(
    "SELECT * FROM person_table WHERE person_id = ?",
    [id],
  );
  res.json(rows[0]);
});

// GET for Dashboard5
app.get("/api/dashboard5/:id", checkStepAccess(5), async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.execute(
    "SELECT * FROM person_table WHERE person_id = ?",
    [id],
  );
  res.json(rows[0]);
});

app.put("/api/person/:id/progress", async (req, res) => {
  const { id } = req.params;
  const { nextStep } = req.body;

  try {
    await db.execute(
      "UPDATE person_table SET current_step = ? WHERE person_id = ?",
      [nextStep, id],
    );
    res.json({ message: "Progress updated" });
  } catch (err) {
    console.error("Error updating progress:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// For Major
app.get("/api/programs", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT
        program_id,
        program_code,
        program_description,
        major
      FROM program_table
      ORDER BY program_description
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching programs:", err);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

app.post(
  "/api/upload-profile-picture",
  upload.single("profile_picture"),
  async (req, res) => {
    const { person_id } = req.body;
    if (!person_id || !req.file) {
      return res.status(400).send("Missing person_id or file.");
    }

    try {
      // ✅ Get applicant_number from person_id
      const [rows] = await db.query(
        "SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?",
        [person_id],
      );
      if (!rows.length) {
        return res.status(404).json({
          message: "Applicant number not found for person_id " + person_id,
        });
      }

      const applicant_number = rows[0].applicant_number;

      const ext = path.extname(req.file.originalname).toLowerCase();
      const year = new Date().getFullYear();
      const filename = `${applicant_number}_1by1_${year}${ext}`; // ✅ Use applicant number here
      const finalPath = path.join(__dirname, "uploads", filename);

      // ✅ Save file
      await fs.promises.writeFile(finalPath, req.file.buffer);

      // ✅ Save to DB (still use person_id here)
      await db3.query(
        "UPDATE person_table SET profile_img = ? WHERE person_id = ?",
        [filename, person_id],
      );

      res.status(200).json({ message: "Uploaded successfully", filename });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).send("Failed to upload image.");
    }
  },
);

// ✅ 2. Get person details by person_id
app.get("/api/person/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      "SELECT * FROM person_table WHERE person_id=?",
      [id],
    );

    if (!rows.length)
      return res.status(404).json({ error: "Person not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ 4. Upload & update profile_img
app.post(
  "/api/person/:id/upload-profile",
  upload.single("profile_img"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const filePath = req.file?.filename;

      if (!filePath) return res.status(400).json({ error: "No file uploaded" });

      // Remove old image if exists
      const [rows] = await db.execute(
        "SELECT profile_img FROM person_table WHERE person_id=?",
        [id],
      );
      const oldImg = rows[0]?.profile_img;

      if (oldImg) {
        const oldPath = path.join(__dirname, "uploads", oldImg);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await db.execute(
        "UPDATE person_table SET profile_img=? WHERE person_id=?",
        [filePath, id],
      );
      res.json({ message: "Profile image updated", profile_img: filePath });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Database error" });
    }
  },
);

// ✅ 5. Get applied programs list (sample, adjust db name/table)
// server.js
app.get("/api/applied_program", async (req, res) => {
  try {
    const [rows] = await db3.execute(`
      SELECT
        ct.curriculum_id,
        ct.year_id,
        yt.year_description,
        pt.program_id,
        pt.program_code,
        pt.program_description,
        pt.major,
        pt.components,
        pt.academic_program,
        d.dprtmnt_id,
        d.dprtmnt_name
      FROM curriculum_table AS ct
      INNER JOIN program_table AS pt ON pt.program_id = ct.program_id
      INNER JOIN dprtmnt_curriculum_table AS dc ON ct.curriculum_id = dc.curriculum_id
      INNER JOIN year_table AS yt ON ct.year_id = yt.year_id
      INNER JOIN dprtmnt_table AS d ON dc.dprtmnt_id = d.dprtmnt_id
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No curriculum data found" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching curriculum data:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Get all saved school years with semester info
app.get("/api/school_years", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT
        yt.year_description,
        st.semester_description,
        sy.astatus
      FROM school_year_table sy
      JOIN year_table yt ON sy.year_id = yt.year_id
      JOIN semester_table st ON sy.semester_id = st.semester_id
      ORDER BY yt.year_description DESC, st.semester_id ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching school years:", error);
    res.status(500).json({ message: "Database error" });
  }
});

// ✅ Get year list only
app.get("/api/year_table", async (req, res) => {
  try {
    const [rows] = await db3.query(
      `SELECT * FROM year_table ORDER BY year_description DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching year_table:", error);
    res.status(500).json({ message: "Database error" });
  }
});

// ✅ Get semester list only
app.get("/api/semester_table", async (req, res) => {
  try {
    const [rows] = await db3.query(`SELECT * FROM semester_table`);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching semester_table:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/search-person", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT
        p.*,
        a.applicant_number
      FROM person_table p
      LEFT JOIN applicant_numbering_table a ON p.person_id = a.person_id
      WHERE a.applicant_number LIKE ?
         OR p.first_name LIKE ?
         OR p.last_name LIKE ?
         OR p.emailAddress LIKE ?
      LIMIT 1
    `,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No matching applicant found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error searching person:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Update document_status for a person
// Update document_status for all uploads of a person
app.put("/api/uploads/person/:id/document-status", async (req, res) => {
  const { id } = req.params;
  const { document_status } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE requirement_uploads SET document_status = ? WHERE person_id = ?",
      [document_status, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Uploads for person not found" });
    }

    res.json({ success: true, document_status });
  } catch (err) {
    console.error("Error updating document_status:", err);
    res.status(500).json({ error: "Failed to update document_status" });
  }
});

// server.js
app.post("/api/requirement-uploads", async (req, res) => {
  const {
    requirements_id,
    person_id,
    file_path,
    original_name,
    status,
    document_status,
    missing_documents,
    remarks,
  } = req.body;

  try {
    await db.query(
      `INSERT INTO requirement_uploads
        (requirements_id, person_id, file_path, original_name, status, document_status, missing_documents, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        file_path = VALUES(file_path),
        original_name = VALUES(original_name),
        status = VALUES(status),
        document_status = VALUES(document_status),
        missing_documents = VALUES(missing_documents),
        remarks = VALUES(remarks),
        last_updated_by = VALUES(last_updated_by)`,
      [
        requirements_id,
        person_id,
        file_path,
        original_name,
        status,
        document_status,
        missing_documents,
        remarks,
      ],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving requirement:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update missing_documents for all rows of this person
app.put("/api/missing-documents/:person_id", async (req, res) => {
  const { person_id } = req.params;
  let { missing_documents, user_id } = req.body;

  try {
    if (!Array.isArray(missing_documents)) {
      missing_documents = [];
    }

    const jsonDocs = JSON.stringify(missing_documents);

    await db.query(
      `UPDATE admission.requirement_uploads
       SET missing_documents = ?, last_updated_by = ?
       WHERE person_id = ?`,
      [jsonDocs, user_id || null, person_id],
    );

    res.json({ success: true, message: "Missing documents updated" });
  } catch (err) {
    console.error("❌ Error updating missing_documents:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to update missing_documents" });
  }
});

// Update requirement upload (submitted + missing documents)
app.post("/api/update-requirement", async (req, res) => {
  const { person_id, requirements_id, submitted_documents } = req.body;
  let { missing_documents } = req.body;

  try {
    if (Array.isArray(missing_documents)) {
      missing_documents = JSON.stringify(missing_documents);
    } else if (typeof missing_documents !== "string") {
      missing_documents = "[]";
    }

    await db.query(
      `UPDATE requirement_uploads
       SET submitted_documents = ?, missing_documents = ?
       WHERE person_id = ? AND requirements_id = ?`,
      [submitted_documents, missing_documents, person_id, requirements_id],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating requirement:", err);
    res.status(500).json({ error: "Failed to update requirement" });
  }
});


// ----------------- VERIFY PASSWORD -----------------
app.post("/api/verify-password", async (req, res) => {
  const { person_id, password } = req.body;

  if (!person_id || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Person ID and password required" });
  }

  try {
    const [rows] = await db3.query(
      "SELECT * FROM user_accounts WHERE person_id = ?",
      [person_id],
    );

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("verify-password error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during password verification",
    });
  }
});

// Applicant Change Password
app.post("/applicant-change-password", async (req, res) => {
  const { person_id, currentPassword, newPassword } = req.body;

  if (!person_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user by person_id
    const [rows] = await db.query(
      "SELECT * FROM user_accounts WHERE person_id = ?",
      [person_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Password strength validation
    const strong =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!#$^*@]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({
        message: "New password does not meet complexity requirements",
      });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Debug log (optional)
    console.log("Updating password for person_id:", person_id);
    console.log("New password hash:", hashed);

    // Update password in DB
    await db.query(
      "UPDATE user_accounts SET password = ? WHERE person_id = ?",
      [hashed, person_id],
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Registrar Change Password
app.post("/registrar-change-password", async (req, res) => {
  const { person_id, currentPassword, newPassword } = req.body;

  if (!person_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user by person_id
    const [rows] = await db3.query(
      "SELECT * FROM user_accounts WHERE person_id = ?",
      [person_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Password strength validation
    const strong =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!#$^*@]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({
        message: "New password does not meet complexity requirements",
      });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Debug log (optional)
    console.log("Updating password for person_id:", person_id);
    console.log("New password hash:", hashed);

    // Update password in DB
    await db3.query(
      "UPDATE user_accounts SET password = ? WHERE person_id = ?",
      [hashed, person_id],
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Student Change Password
app.post("/student-change-password", async (req, res) => {
  const { person_id, currentPassword, newPassword } = req.body;

  if (!person_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user by person_id
    const [rows] = await db3.query(
      "SELECT * FROM user_accounts WHERE person_id = ?",
      [person_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Password strength validation
    const strong =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!#$^*@]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({
        message: "New password does not meet complexity requirements",
      });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Debug log (optional)
    console.log("Updating password for person_id:", person_id);
    console.log("New password hash:", hashed);

    // Update password in DB
    await db3.query(
      "UPDATE user_accounts SET password = ? WHERE person_id = ?",
      [hashed, person_id],
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Faculty Change Password
app.post("/faculty-change-password", async (req, res) => {
  const { person_id, currentPassword, newPassword } = req.body;

  if (!person_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user by person_id
    const [rows] = await db3.query(
      "SELECT * FROM prof_table WHERE person_id = ?",
      [person_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Password strength validation
    const strong =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!#$^*@]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({
        message: "New password does not meet complexity requirements",
      });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Debug log (optional)
    console.log("Updating password for person_id:", person_id);
    console.log("New password hash:", hashed);

    // Update password in DB
    await db3.query("UPDATE prof_table SET password = ? WHERE person_id = ?", [
      hashed,
      person_id,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

io.on("connection", (socket) => {
  console.log("✅ Socket.IO client connected");

  // ---------------------- Forgot Password: Applicant ----------------------
  socket.on("forgot-password-applicant", async (email) => {
    try {
      // ✅ 1️⃣ Check if applicant exists
      const [rows] = await db.query(
        `SELECT ua.email, p.campus
         FROM user_accounts ua
         JOIN person_table p ON ua.person_id = p.person_id
         WHERE ua.email = ?`,
        [email],
      );

      if (rows.length === 0) {
        return socket.emit("password-reset-result-applicant", {
          success: false,
          message: "Email not found.",
        });
      }

      // ✅ 2️⃣ Fetch short_term from company_settings table
      const [[company]] = await db.query(
        "SELECT short_term FROM company_settings WHERE id = 1",
      );
      const shortTerm = company?.short_term || "Institution";

      // ✅ 3️⃣ Generate new password
      const newPassword = Array.from({ length: 8 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 26) + 65),
      ).join("");

      const hashed = await bcrypt.hash(newPassword, 10);

      await db.query("UPDATE user_accounts SET password = ? WHERE email = ?", [
        hashed,
        email,
      ]);

      // ✅ 4️⃣ Configure email sender
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // ✅ 5️⃣ Send email with institutional short term (same as student/faculty)
      await transporter.sendMail({
        from: `"${shortTerm} - Information System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Password hasReset",
        text: `Your new temporary password is: ${newPassword}\n\nPlease change it after logging in.`,
      });

      // ✅ 6️⃣ Notify frontend that email was sent successfully
      socket.emit("password-reset-result-applicant", {
        success: true,
        message:
          "Password reset successfully. Check your email for the new password.",
      });
    } catch (error) {
      console.error("Reset error (applicant):", error);
      socket.emit("password-reset-result-applicant", {
        success: false,
        message: "Internal server error.",
      });
    }
  });

  // ---------------- Registrar: Reset Password ----------------
  // FORGOT PASSWORD (handles student, registrar, faculty)
  app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Generate uppercase temporary password (A–Z + 0–9)
    const generateTempPassword = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return Array.from({ length: 8 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length)),
      ).join("");
    };

    const newPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      // Fetch short_term from company_settings
      const [company] = await db.query(
        "SELECT short_term FROM company_settings WHERE id = 1",
      );
      const shortTerm = company?.[0]?.short_term || "Institution";

      // 1️⃣ Update Student or Registrar password
      const [userResult] = await db3.query(
        "UPDATE user_accounts SET password = ? WHERE email = ? AND (role = 'student' OR role = 'registrar')",
        [hashedPassword, email],
      );

      if (userResult.affectedRows > 0) {
        await sendResetEmail(email, newPassword, shortTerm);
        return res.json({
          message: `${shortTerm} password reset successfully. Please check your email.`,
        });
      }

      // 2️⃣ Update Faculty password
      const [profResult] = await db3.query(
        "UPDATE prof_table SET password = ? WHERE email = ? AND role = 'faculty'",
        [hashedPassword, email],
      );

      if (profResult.affectedRows > 0) {
        await sendResetEmail(email, newPassword, shortTerm);
        return res.json({
          message: `${shortTerm} password reset successfully. Please check your email.`,
        });
      }

      // 3️⃣ Not found
      return res.status(404).json({
        message: `${shortTerm} account not found. Please check your email address.`,
      });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------------- Email Sender (same message format as student/faculty/applicant) ----------------
  async function sendResetEmail(to, tempPassword, shortTerm) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"${shortTerm} - Information System" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Your Password has Reset",
        text: `Your new temporary password is: ${tempPassword}\n\nPlease change it after logging in.`,
      });

      console.log(`${shortTerm} reset email sent to ${to}`);
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }
  }

  // 🔹 Get exam scores for a person
  app.get("/api/exam/:personId", async (req, res) => {
    try {
      const { personId } = req.params;

      const [rows] = await db.query(
        `SELECT
         id,
         person_id,
         English,
         Science,
         Filipino,
         Math,
         Abstract,
         final_rating,
         user,
         DATE_FORMAT(date_created, '%Y-%m-%d') AS date_created
       FROM admission_exam
       WHERE person_id = ?`,
        [personId],
      );

      res.json(rows);
    } catch (err) {
      console.error("❌ GET exam error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get applicant exam schedule
  app.get("/api/exam-schedule/:applicant_number", async (req, res) => {
    const { applicant_number } = req.params;

    try {
      const [rows] = await db.query(
        `
      SELECT
        s.day_description AS date_of_exam,
        s.start_time,
        s.end_time,
        s.building_description,
        s.room_description,
        s.proctor,
        s.created_at AS schedule_created_at
      FROM exam_applicants ea
      JOIN entrance_exam_schedule s
        ON ea.schedule_id = s.schedule_id
      WHERE ea.applicant_id = ?
      LIMIT 1
    `,
        [applicant_number],
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "No exam schedule found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching exam schedule:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get person by applicant_number
  app.get("/api/person-by-applicant/:applicant_number", async (req, res) => {
    const { applicant_number } = req.params;

    try {
      const [rows] = await db.execute(
        `SELECT p.*, a.applicant_number, ae.final_rating
       FROM person_table p
       JOIN applicant_numbering_table a
         ON p.person_id = a.person_id
       JOIN admission_exam ae ON p.person_id = ae.person_id
       WHERE a.applicant_number = ? `,
        [applicant_number],
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Applicant not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching person by applicant_number:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/applicant-schedule/:applicantNumber", async (req, res) => {
    try {
      const { applicantNumber } = req.params;
      console.log("Receive Applicant Number: ", applicantNumber);

      const [rows] = await db.query(
        `SELECT
          s.schedule_id,
          s.day_description,
          s.building_description,
          s.room_description,
          s.start_time,
          s.end_time,
          s.proctor,
          s.room_quota,
          s.created_at,
          ea.email_sent   -- ✅ include email_sent
       FROM entrance_exam_schedule s
       INNER JOIN exam_applicants ea
         ON ea.schedule_id = s.schedule_id
       WHERE ea.applicant_id = ?`,
        [applicantNumber],
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: "No schedule found for this applicant." });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching applicant schedule:", err.message);
      res.status(500).json({ error: "Failed to fetch applicant schedule" });
    }
  });

  // Get applicants assigned to a proctor

  // Get applicants assigned to a proctor
  app.get("/api/proctor-applicants/:proctor_name", async (req, res) => {
    const { proctor_name } = req.params;
    try {
      const [rows] = await db.query(
        `
      SELECT
        ea.applicant_id,
        an.applicant_number,
        pt.first_name,
        pt.middle_name,
        pt.last_name,
        pt.program,
        ees.day_description,
        ees.room_description,
        ees.building_description,
        ees.start_time,
        ees.end_time,
        ees.proctor
      FROM exam_applicants ea
      JOIN applicant_numbering_table an ON ea.applicant_id = an.applicant_number
      JOIN person_table pt ON an.person_id = pt.person_id
      JOIN entrance_exam_schedule ees ON ea.schedule_id = ees.schedule_id
      WHERE ees.proctor = ?
    `,
        [proctor_name],
      );
      res.json(rows);
    } catch (err) {
      console.error("❌ Error fetching proctor applicants:", err);
      res.status(500).json({ error: "Failed to fetch applicants for proctor" });
    }
  });

  // Search proctor by name and return their assigned applicants
  app.get("/api/proctor-applicants", async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    try {
      // Find schedules where this proctor is assigned
      const [schedules] = await db.query(
        `SELECT schedule_id, day_description, room_description, building_description, start_time, end_time, proctor
FROM entrance_exam_schedule
WHERE proctor LIKE ?
`,
        [`%${query}%`],
      );

      if (schedules.length === 0) {
        return res
          .status(404)
          .json({ message: "Proctor not found in schedules" });
      }

      // For each schedule, get assigned applicants with email_sent
      const results = [];
      for (const sched of schedules) {
        const [applicants] = await db.query(
          `SELECT ea.applicant_id, ea.email_sent,
                an.applicant_number,
                p.last_name, p.first_name, p.middle_name, p.program
         FROM exam_applicants ea
         JOIN applicant_numbering_table an ON ea.applicant_id = an.applicant_number
         JOIN person_table p ON an.person_id = p.person_id
         WHERE ea.schedule_id = ?`,
          [sched.schedule_id],
        );

        results.push({
          schedule: sched,
          applicants,
        });
      }

      res.json(results);
    } catch (err) {
      console.error("❌ Error fetching proctor applicants:", err);
      res.status(500).json({ error: "Failed to fetch applicants for proctor" });
    }
  });

  // 🔹 Get Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT id, type, message, applicant_number, actor_email, actor_name, timestamp FROM notifications ORDER BY timestamp DESC",
      );
      res.json(rows);
    } catch (err) {
      console.error("❌ Fetch notifications error:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // ==================== INTERVIEW ROUTES ====================
  // ==============================
  // INTERVIEW ROUTES
  // ==============================

  // 1. Get interview by applicant_number
  app.get("/api/interview/:applicant_number", async (req, res) => {
    const { applicant_number } = req.params;

    try {
      const [rows] = await db.query(
        `
      SELECT
        a.applicant_number,
        a.person_id,
        ps.qualifying_result      AS qualifying_exam_score,
        ps.interview_result       AS qualifying_interview_score,
        ps.exam_result            AS total_ave
      FROM applicant_numbering_table a
      LEFT JOIN person_status_table ps ON ps.person_id = a.person_id
      WHERE a.applicant_number = ?
      `,
        [applicant_number],
      );

      if (!rows.length) return res.json(null);

      const row = rows[0];
      res.json({
        applicant_number: row.applicant_number,
        person_id: row.person_id,
        qualifying_exam_score: row.qualifying_exam_score ?? 0,
        qualifying_interview_score: row.qualifying_interview_score ?? 0,
        total_ave: row.total_ave ?? 0,
      });
    } catch (err) {
      console.error("❌ Error fetching interview:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // 2) PUT update (must exist)
  // 📌 Update single Qualifying/Interview scores + log notifications

  // ---------------------------------------------------------
  // 2) SAVE or UPDATE (UPSERT) using person_status_table
  //    Payload: { applicant_number, qualifying_exam_score, qualifying_interview_score }
  //    Mapping -> qualifying_result, interview_result, exam_result
  // ---------------------------------------------------------
  app.post("/api/interview", async (req, res) => {
    try {
      const {
        applicant_number,
        qualifying_exam_score,
        qualifying_interview_score,
      } = req.body;
      console.log("📥 Payload:", req.body);

      // 1️⃣ Find person_id of applicant
      const [rows] = await db.query(
        "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
        [applicant_number],
      );
      if (rows.length === 0) {
        return res.status(400).json({ error: "Applicant number not found" });
      }
      const person_id = rows[0].person_id;

      // 2️⃣ Compute new scores
      const qExam = Number(qualifying_exam_score) || 0;
      const qInterview = Number(qualifying_interview_score) || 0;
      const totalAve = (qExam + qInterview) / 2;

      // 3️⃣ Insert or update (Upsert)
      await db.query(
        `INSERT INTO person_status_table (person_id, qualifying_result, interview_result, exam_result)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         qualifying_result = VALUES(qualifying_result),
         interview_result = VALUES(interview_result),
         exam_result = VALUES(exam_result)`,
        [person_id, qExam, qInterview, totalAve],
      );

      // 4️⃣ Return success (no notification here)
      res.json({
        success: true,
        message: "Interview and exam scores saved successfully!",
      });
    } catch (err) {
      console.error("🔥 Error saving interview/exam scores:", err);
      res.status(500).json({ error: "Failed to save interview/exam scores" });
    }
  });

  // ---------------------------------------------------------
  // 3) Update by applicant_number (same mapping)
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // Save or Update Interview Scores
  // ---------------------------------------------------------
  async function insertNotificationOnce({
    type = "update",
    message,
    applicant_number,
    actorEmail,
    actorName,
  }) {
    // Prevent duplicates in two ways:
    // 1) If exact same message exists within last 5 seconds -> skip (protects against double-requests)
    // 2) Also skip if same message already exists today -> skip (daily dedupe)
    await db.query(
      `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp)
     SELECT ?, ?, ?, ?, ?, NOW()
     FROM DUAL
     WHERE NOT EXISTS (
       SELECT 1 FROM notifications
       WHERE applicant_number = ?
         AND message = ?
         AND (timestamp >= NOW() - INTERVAL 5 SECOND OR DATE(timestamp) = CURDATE())
     )`,
      [
        type,
        message,
        applicant_number,
        actorEmail,
        actorName,
        applicant_number,
        message,
      ],
    );
  }

  // ---------------------- Assign Student Number ----------------------

  socket.on("assign-student-number", async (person_id) => {
    try {
      // ✅ Fetch person info
      const [rows] = await db.query(
        `SELECT * FROM person_table AS pt WHERE person_id = ?`,
        [person_id],
      );

      if (rows.length === 0) {
        return socket.emit("assign-student-number-result", {
          success: false,
          message: "Person not found.",
        });
      }

      const person_data = rows[0];
      const { emailAddress, first_name, middle_name, last_name } = person_data;
      const student_number = `${new Date().getFullYear()}${String(person_id).padStart(5, "0")}`;
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      let studentProfileImg = person_data.profile_img;

      // Copy applicant 1x1 image to student 1x1 folder during student-number assignment.
      if (person_data.profile_img) {
        try {
          const applicantDir = path.join(__dirname, "uploads", "Applicant1by1");
          const studentDir = path.join(__dirname, "uploads", "Student1by1");
          const uploadRootDir = path.join(__dirname, "uploads");

          if (!fs.existsSync(studentDir)) {
            fs.mkdirSync(studentDir, { recursive: true });
          }

          const applicantPath = path.join(applicantDir, person_data.profile_img);
          const uploadRootPath = path.join(uploadRootDir, person_data.profile_img);
          const sourcePath = fs.existsSync(applicantPath)
            ? applicantPath
            : fs.existsSync(uploadRootPath)
              ? uploadRootPath
              : null;

          if (sourcePath) {
            const ext = path.extname(person_data.profile_img) || ".jpg";
            studentProfileImg = `${student_number}_profile_image${ext}`;
            const targetPath = path.join(studentDir, studentProfileImg);
            fs.copyFileSync(sourcePath, targetPath);
          } else {
            console.warn(
              `[assign-student-number] profile image not found for person_id=${person_id}: ${person_data.profile_img}`,
            );
          }
        } catch (imgErr) {
          console.error(
            `[assign-student-number] failed to copy profile image for person_id=${person_id}`,
            imgErr,
          );
        }
      }

      // ✅ Get uploaded requirements
      const [requirements] = await db.query(
        `SELECT * FROM requirement_uploads WHERE person_id = ?`,
        [person_id],
      );

      const [studentFuturePI] = await db3.query(
        `SELECT MAX(person_id) AS latest_person_id FROM user_accounts;`
      );

      const personIdForStudent = studentFuturePI[0].latest_person_id;

      // ✅ Save to student_numbering_table
      await db3.query(
        `INSERT INTO student_numbering_table (student_number, person_id) VALUES (?, ?)`,
        [student_number, personIdForStudent + 1],
      );

      await db3.query(
        `INSERT INTO person_status_table (person_id, exam_status, requirements, residency, student_registration_status, exam_result, hs_ave)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [personIdForStudent + 1, 0, 0, 0, 0, 0, 0],
      );

      // ✅ Copy requirements to db3
      for (const req of requirements) {
        await db3.query(
          `INSERT INTO requirement_uploads
          (requirements_id, person_id, submitted_documents, file_path, original_name, remarks, status, document_status, registrar_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.requirements_id,
            personIdForStudent + 1,
            req.submitted_documents,
            req.file_path,
            req.original_name,
            req.remarks,
            req.status,
            req.document_status,
            req.registrar_status,
            req.created_at,
          ],
        );
      }


      await db3.query(
        `INSERT INTO student_status_table
         (student_number, active_curriculum, enrolled_status, year_level_id, active_school_year_id, control_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [student_number, person_data.program, 0, 0, 0, 0],
      );

      // ✅ Update registration status
      await db3.query(
        `UPDATE person_status_table SET student_registration_status = 1 WHERE person_id = ?`,
        [personIdForStudent + 1],
      );

      await db3.query(
        `
      INSERT INTO person_table (person_id, student_number, profile_img, campus, academicProgram, classifiedAs, applyingAs, program, program2, program3, yearLevel, last_name, first_name, middle_name, extension, nickname, height, weight, lrnNumber, nolrnNumber, gender, pwdMember, pwdType, pwdId, birthOfDate, age, birthPlace, languageDialectSpoken, citizenship, religion, civilStatus, tribeEthnicGroup, cellphoneNumber, emailAddress, presentStreet, presentBarangay, presentZipCode, presentRegion, presentProvince, presentMunicipality, presentDswdHouseholdNumber, sameAsPresentAddress, permanentStreet, permanentBarangay, permanentZipCode, permanentRegion, permanentProvince, permanentMunicipality, permanentDswdHouseholdNumber, solo_parent, father_deceased, father_family_name, father_given_name, father_middle_name, father_ext, father_nickname, father_education, father_education_level, father_last_school, father_course, father_year_graduated, father_school_address, father_contact, father_occupation, father_employer, father_income, father_email, mother_deceased, mother_family_name, mother_given_name, mother_middle_name, mother_ext, mother_nickname, mother_education, mother_education_level, mother_last_school, mother_course, mother_year_graduated, mother_school_address, mother_contact, mother_occupation, mother_employer, mother_income, mother_email, guardian, guardian_family_name, guardian_given_name, guardian_middle_name, guardian_ext, guardian_nickname, guardian_address, guardian_contact, guardian_email, annual_income, schoolLevel, schoolLastAttended, schoolAddress, courseProgram, honor, generalAverage, yearGraduated, schoolLevel1, schoolLastAttended1, schoolAddress1, courseProgram1, honor1, generalAverage1, yearGraduated1, strand, cough, colds, fever, asthma, faintingSpells, heartDisease, tuberculosis, frequentHeadaches, hernia, chronicCough, headNeckInjury, hiv, highBloodPressure, diabetesMellitus, allergies, cancer, smokingCigarette, alcoholDrinking, hospitalized, hospitalizationDetails, medications, hadCovid, covidDate, vaccine1Brand, vaccine1Date, vaccine2Brand, vaccine2Date, booster1Brand, booster1Date, booster2Brand, booster2Date, chestXray, cbc, urinalysis, otherworkups, symptomsToday, remarks, termsOfAgreement, created_at, current_step)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          personIdForStudent + 1,
          student_number,
          studentProfileImg,
          person_data.campus,
          person_data.academicProgram,
          person_data.classifiedAs,
          person_data.applyingAs,
          person_data.program,
          person_data.program2,
          person_data.program3,
          person_data.yearLevel,
          person_data.last_name,
          person_data.first_name,
          person_data.middle_name,
          person_data.extension,
          person_data.nickname,
          person_data.height,
          person_data.weight,
          person_data.lrnNumber,
          person_data.nolrnNumber,
          person_data.gender,
          person_data.pwdMember,
          person_data.pwdType,
          person_data.pwdId,
          person_data.birthOfDate,
          person_data.age,
          person_data.birthPlace,
          person_data.languageDialectSpoken,
          person_data.citizenship,
          person_data.religion,
          person_data.civilStatus,
          person_data.tribeEthnicGroup,
          person_data.cellphoneNumber,
          person_data.emailAddress,
          person_data.presentStreet,
          person_data.presentBarangay,
          person_data.presentZipCode,
          person_data.presentRegion,
          person_data.presentProvince,
          person_data.presentMunicipality,
          person_data.presentDswdHouseholdNumber,
          person_data.sameAsPresentAddress,
          person_data.permanentStreet,
          person_data.permanentBarangay,
          person_data.permanentZipCode,
          person_data.permanentRegion,
          person_data.permanentProvince,
          person_data.permanentMunicipality,
          person_data.permanentDswdHouseholdNumber,
          person_data.solo_parent,
          person_data.father_deceased,
          person_data.father_family_name,
          person_data.father_given_name,
          person_data.father_middle_name,
          person_data.father_ext,
          person_data.father_nickname,
          person_data.father_education,
          person_data.father_education_level,
          person_data.father_last_school,
          person_data.father_course,
          person_data.father_year_graduated,
          person_data.father_school_address,
          person_data.father_contact,
          person_data.father_occupation,
          person_data.father_employer,
          person_data.father_income,
          person_data.father_email,
          person_data.mother_deceased,
          person_data.mother_family_name,
          person_data.mother_given_name,
          person_data.mother_middle_name,
          person_data.mother_ext,
          person_data.mother_nickname,
          person_data.mother_education,
          person_data.mother_education_level,
          person_data.mother_last_school,
          person_data.mother_course,
          person_data.mother_year_graduated,
          person_data.mother_school_address,
          person_data.mother_contact,
          person_data.mother_occupation,
          person_data.mother_employer,
          person_data.mother_income,
          person_data.mother_email,
          person_data.guardian,
          person_data.guardian_family_name,
          person_data.guardian_given_name,
          person_data.guardian_middle_name,
          person_data.guardian_ext,
          person_data.guardian_nickname,
          person_data.guardian_address,
          person_data.guardian_contact,
          person_data.guardian_email,
          person_data.annual_income,
          person_data.schoolLevel,
          person_data.schoolLastAttended,
          person_data.schoolAddress,
          person_data.courseProgram,
          person_data.honor,
          person_data.generalAverage,
          person_data.yearGraduated,
          person_data.schoolLevel1,
          person_data.schoolLastAttended1,
          person_data.schoolAddress1,
          person_data.courseProgram1,
          person_data.honor1,
          person_data.generalAverage1,
          person_data.yearGraduated1,
          person_data.strand,
          person_data.cough,
          person_data.colds,
          person_data.fever,
          person_data.asthma,
          person_data.faintingSpells,
          person_data.heartDisease,
          person_data.tuberculosis,
          person_data.frequentHeadaches,
          person_data.hernia,
          person_data.chronicCough,
          person_data.headNeckInjury,
          person_data.hiv,
          person_data.highBloodPressure,
          person_data.diabetesMellitus,
          person_data.allergies,
          person_data.cancer,
          person_data.smokingCigarette,
          person_data.alcoholDrinking,
          person_data.hospitalized,
          person_data.hospitalizationDetails,
          person_data.medications,
          person_data.hadCovid,
          person_data.covidDate,
          person_data.vaccine1Brand,
          person_data.vaccine1Date,
          person_data.vaccine2Brand,
          person_data.vaccine2Date,
          person_data.booster1Brand,
          person_data.booster1Date,
          person_data.booster2Brand,
          person_data.booster2Date,
          person_data.chestXray,
          person_data.cbc,
          person_data.urinalysis,
          person_data.otherworkups,
          person_data.symptomsToday,
          person_data.remarks,
          person_data.termsOfAgreement,
          person_data.created_at,
          person_data.current_step,
        ],
      );

      // ✅ Insert login credentials (or update if existing)
      const [existingUser] = await db3.query(
        `SELECT * FROM user_accounts WHERE person_id = ?`,
        [personIdForStudent + 1],
      );

      if (existingUser.length === 0) {
        await db3.query(
          `INSERT INTO user_accounts (person_id, email, password, role, status) VALUES (?, ?, ?, 'student', 1)`,
          [personIdForStudent + 1, person_data.emailAddress, hashedPassword],
        );
      } else {
        await db3.query(
          `UPDATE user_accounts SET email = ?, password = ?, role = 'student', status = 1 WHERE person_id = ?`,
          [person_data.emailAddress, hashedPassword, personIdForStudent + 1],
        );
      }

      const qrData = `${process.env.DB_HOST_LOCAL}:5173/student_qr_information/${student_number}`;
      const qrFilename = `${student_number}_qrcode.png`;
      const qrPath = path.join(__dirname, "./uploads/QrCodeGenerated", qrFilename);

      await QRCode.toFile(qrPath, qrData, {
        color: { dark: "#000", light: "#FFF" },
        width: 300,
      });

      // ✅ Emit success result
      socket.emit("assign-student-number-result", {
        success: true,
        student_number,
        message: "Student number assigned successfully.",
      });

      // ✅ Fetch company name dynamically
      const [[company]] = await db.query(
        "SELECT company_name FROM company_settings WHERE id = 1",
      );

      const companyName = company?.company_name || "Enrollment Office";
      const companyShort = company?.short_term || "";

      // ✅ Send welcome email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"${companyShort} Enrollment Office" <${process.env.EMAIL_USER}>`,
        to: emailAddress,
        subject: `🎓 Welcome to ${companyName} - Acceptance Confirmation`,
        text: `
Hi, ${first_name} ${middle_name || ""} ${last_name},

🎉 Congratulations! You are now officially accepted and part of the ${companyName} community.

Please visit your respective college offices to tag your schedule to your account and obtain your class schedule.

Your Student Number is: ${student_number}
Your Email Address is: ${emailAddress}

Your temporary password is: ${tempPassword}

You may change your password and keep it secure.

👉 Click the link below to log in:
${process.env.DB_HOST_LOCAL}:5173/login
`.trim(),
      };

      // ✅ Send email (non-blocking)
      transporter.sendMail(mailOptions).catch(console.error);
    } catch (error) {
      console.error("Error in assign-student-number:", error);
      socket.emit("assign-student-number-result", {
        success: false,
        message: "Internal server error.",
      });
    }
  });
});

// ============================
// GET - Day List (from schedule table)
// ============================
app.get("/day_list", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT DISTINCT day_description FROM entrance_exam_schedule ORDER BY FIELD(day_description, 'Monday','Tuesday','Wednesday','Thursday','Friday')",
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching days:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ============================
// POST - Insert Entrance Exam Schedule
// ============================
// ✅ Get all interview schedules
app.get("/interview_schedules", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.schedule_id,
        s.day_description,
        s.building_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.interviewer,
        s.room_quota,
        s.created_at
      FROM admission.interview_exam_schedule s
      ORDER BY s.day_description, s.start_time
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching interview schedules:", err);
    res.status(500).json({ error: "Failed to fetch interview schedules" });
  }
});

// ✅ Get interview schedules with applicant counts
// 3. Get interview schedules with occupancy count
// ================== INTERVIEW APPLICANTS API ==================

// 1. Get interview applicants with applicant_number + person info
app.get("/api/interview/applicants-with-number", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.person_id,
        a.applicant_number,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.extension,
        p.program,
        p.emailAddress,
        p.campus,
        ia.schedule_id,
        ia.email_sent
      FROM interview_applicants ia
      LEFT JOIN applicant_numbering_table a
        ON ia.applicant_id = a.applicant_number
      LEFT JOIN person_table p
        ON a.person_id = p.person_id
      ORDER BY p.last_name, p.first_name
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching interview applicants:", err);
    res.status(500).json({ error: "Failed to fetch interview applicants" });
  }
});

// ================== INTERVIEW APPLICANTS API ==================

// 1. Get not-emailed interview applicants
app.get("/api/interview/not-emailed-applicants", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.person_id,
        p.last_name,
        p.first_name,
        p.campus,
        p.middle_name,
        p.extension,
        p.emailAddress,
        p.program,
        p.created_at,
        a.applicant_number,
        SUBSTRING(a.applicant_number, 5, 1) AS middle_code,
        ia.schedule_id,
        ia.email_sent,
        ies.day_description,
        ies.room_description,
        ies.start_time,
        ies.end_time,
        ies.interviewer,
        ps.interview_status,
        -- ✅ exam scores
        ae.English,
        ae.Science,
        ae.Filipino,
        ae.Math,
        ae.Abstract,
        ae.final_rating   -- ✅ bring in the computed rating
      FROM interview_applicants ia
      LEFT JOIN applicant_numbering_table a
        ON ia.applicant_id = a.applicant_number
      LEFT JOIN person_table p
        ON a.person_id = p.person_id
      LEFT JOIN interview_exam_schedule ies
        ON ia.schedule_id = ies.schedule_id
      LEFT JOIN person_status_table ps
        ON ps.person_id = p.person_id
      LEFT JOIN admission_exam ae       -- ✅ join exam results
        ON ae.person_id = p.person_id
      WHERE (ia.email_sent = 0 OR ia.email_sent IS NULL)
      ORDER BY p.last_name ASC, p.first_name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching interview not-emailed applicants:", err);
    res.status(500).send("Server error");
  }
});

app.put("/api/exam/remove_applicant", async (req, res) => {
  try {
    const { applicant_id } = req.body;

    if (!applicant_id) {
      return res.status(400).json({ message: "Missing applicant_id" });
    }

    // 1️⃣ Reset exam_applicants table
    await db.query(
      `UPDATE exam_applicants
       SET schedule_id = NULL, email_sent = 0
       WHERE applicant_id = ?`,
      [applicant_id],
    );

    // 2️⃣ Reset person_status_table exam_status
    await db.query(
      `UPDATE person_status_table
       SET exam_status = NULL
       WHERE applicant_id = ?`,
      [applicant_id],
    );

    res.json({ message: "Applicant removed from exam schedule successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/interview/remove_applicant", async (req, res) => {
  try {
    const { applicant_id } = req.body;

    if (!applicant_id) {
      return res.status(400).json({ message: "Missing applicant_id" });
    }

    // 1️⃣ Reset interview_applicants table
    await db.query(
      `UPDATE interview_applicants
       SET schedule_id = NULL, email_sent = 0
       WHERE applicant_id = ?`,
      [applicant_id],
    );

    // 2️⃣ Reset person_status_table INTERVIEW STATUS
    await db.query(
      `UPDATE person_status_table
       SET interview_status = NULL
       WHERE applicant_id = ?`,
      [applicant_id],
    );

    res.json({ message: "Applicant interview schedule removed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



// ================== INTERVIEW SOCKET EVENTS ==================
io.on("connection", (socket) => {
  console.log("✅ New client connected for Interview Scheduling");

  // Assign applicants (single, 40, custom — all handled here)
  socket.on(
    "update_interview_schedule",
    async ({ schedule_id, applicant_numbers }) => {
      try {
        if (
          !Array.isArray(applicant_numbers) ||
          applicant_numbers.length === 0
        ) {
          socket.emit("update_schedule_result", {
            success: false,
            error: "No applicants provided.",
          });
          return;
        }

        // 🔍 1. Get schedule info (quota)
        const [[schedule]] = await db.query(
          `SELECT room_quota FROM interview_exam_schedule WHERE schedule_id = ?`,
          [schedule_id],
        );

        if (!schedule) {
          socket.emit("update_schedule_result", {
            success: false,
            error: "Schedule not found.",
          });
          return;
        }

        // 🔍 2. Get current occupancy
        const [[{ current_count }]] = await db.query(
          `SELECT COUNT(*) AS current_count FROM interview_applicants WHERE schedule_id = ?`,
          [schedule_id],
        );

        const availableSlots = schedule.room_quota - current_count;
        if (availableSlots <= 0) {
          socket.emit("update_schedule_result", {
            success: false,
            error: `⚠️ Schedule is already full (${schedule.room_quota} applicants).`,
          });
          return;
        }

        // 🔍 3. Trim applicant_numbers if more than available slots
        const toAssign = applicant_numbers.slice(0, availableSlots);

        // ✅ 4. Update only those applicants
        const [results] = await db.query(
          `UPDATE interview_applicants
         SET schedule_id = ?
         WHERE applicant_id IN (?)`,
          [schedule_id, toAssign],
        );

        socket.emit("update_schedule_result", {
          success: true,
          assigned: toAssign,
          updated: results.affectedRows,
          skipped: applicant_numbers.length - toAssign.length,
        });

        // 🔄 notify all clients
        io.emit("schedule_updated", { schedule_id });
      } catch (err) {
        console.error("❌ Error updating interview schedule:", err);
        socket.emit("update_schedule_result", {
          success: false,
          error: "Failed to update interview schedule.",
        });
      }
    },
  );

  // Unassign ALL
  socket.on("unassign_all_from_interview", async ({ schedule_id }) => {
    try {
      await db.query(
        `UPDATE interview_applicants
         SET schedule_id = NULL
         WHERE schedule_id = ?`,
        [schedule_id],
      );
      socket.emit("unassign_all_result", {
        success: true,
        message: "All applicants unassigned.",
      });
      io.emit("schedule_updated", { schedule_id });
    } catch (err) {
      console.error("❌ Error unassigning all interview applicants:", err);
      socket.emit("unassign_all_result", {
        success: false,
        error: "Failed to unassign all applicants.",
      });
    }
  });

  function formatTime(timeStr) {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":"); // ignore seconds
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12; // convert 0 -> 12
    return `${h}:${minutes} ${ampm}`;
  }

  // 📩 Handle sending interview schedule emails
  // 📩 Handle sending interview schedule emails
  socket.on(
    "send_interview_emails",
    async ({
      schedule_id,
      applicant_numbers,
      subject: finalSubject,
      senderName,
      message,
      user_person_id,
    }) => {
      try {
        // 🔹 Fetch applicants linked to the interview schedule
        const [rows] = await db.query(
          `SELECT
            ia.schedule_id,
            s.day_description,
            s.building_description,
            s.room_description,
            s.start_time,
            s.end_time,
            an.applicant_number,
            p.person_id,
            p.first_name,
            p.middle_name,
            p.last_name,
            p.emailAddress,
            dt.dprtmnt_name
          FROM interview_applicants ia
          JOIN interview_exam_schedule s 
            ON ia.schedule_id = s.schedule_id
          JOIN applicant_numbering_table an 
            ON ia.applicant_id = an.applicant_number
          JOIN person_table p 
            ON an.person_id = p.person_id
          JOIN enrollment.dprtmnt_curriculum_table dct 
            ON p.program = dct.curriculum_id
          JOIN enrollment.dprtmnt_table dt 
            ON dct.dprtmnt_id = dt.dprtmnt_id
          WHERE ia.schedule_id = ?
          AND an.applicant_number IN (?)`,
          [schedule_id, applicant_numbers]
        );

        if (rows.length === 0) {
          return socket.emit("send_schedule_emails_result", {
            success: false,
            error: "No applicants found for this interview schedule.",
          });
        }

        const [[company]] = await db.query(
          "SELECT short_term FROM company_settings WHERE id = 1"
        );

        const shortTerm = company?.short_term || "EARIST";

        const finalSubjectComputed =
          finalSubject || rows[0]?.dprtmnt_name || "Interview Schedule";


        // ✅ Use db3 (enrollment) → user_accounts instead of prof
        const [actorRows] = await db3.query(
          `SELECT
            email AS actor_email,
            role,
            employee_id,
            last_name,
            first_name,
            middle_name
          FROM user_accounts
          WHERE person_id = ?
          LIMIT 1`,
          [user_person_id],
        );

        const actor = actorRows[0] || null;

        // ✅ Format: ROLE (EMPLOYEE_ID) - LastName, FirstName MiddleName
        const actorEmail = actor?.actor_email || "earistmis@gmail.com";
        const actorName = actor
          ? `${actor.role.toUpperCase()} (${actor.employee_id || "N/A"}) - ${actor.last_name}, ${actor.first_name}${actor.middle_name ? " " + actor.middle_name : ""}`
          : "SYSTEM";

        const sent = [];
        const failed = [];

        const [userEmail] = await db.query(
          `SELECT sender_name FROM email_templates WHERE employee_id = ?`,
          [actor?.employee_id || null],
        );

        if (userEmail.length === 0) {
          throw new Error("User not assigned to college email.");
        }

        const user = userEmail[0];

        const senderAccountMap = {
          CCS_EMAIL_USER1: {
            user: process.env.CCS_EMAIL_USER1,
            pass: process.env.CCS_EMAIL_PASS1,
          },
          CCS_EMAIL_USER2: {
            user: process.env.CCS_EMAIL_USER2,
            pass: process.env.CCS_EMAIL_PASS2,
          },
        };

        const senderAccount =
          senderAccountMap[user.sender_name] || {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          };

        if (!senderAccount.user || !senderAccount.pass) {
          throw new Error("Email sender account is not configured.");
        }

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: senderAccount,
        });

        for (const row of rows) {
          if (!row.emailAddress) {
            failed.push(row.applicant_number);
            continue;
          }

          const formattedStart = formatTime(row.start_time);
          const formattedEnd = formatTime(row.end_time);

          const personalizedMsg = message
            .replace(/{first_name}/g, row.first_name || "")
            .replace(/{middle_name}/g, row.middle_name || "")
            .replace(/{last_name}/g, row.last_name || "")
            .replace(/{applicant_number}/g, row.applicant_number)
            .replace(/{day}/g, row.day_description)
            .replace(/{room}/g, row.room_description)
            .replace(/{start_time}/g, formattedStart)
            .replace(/{end_time}/g, formattedEnd);

          const mailOptions = {
            from: `${shortTerm} - ${row.dprtmnt_name} <${senderAccount.user}>`,
            to: row.emailAddress,
            subject: finalSubjectComputed,
            text: personalizedMsg,
          };

          await transporter.sendMail(mailOptions);

          try {


            // Mark applicant email sent
            await db.query(
              "UPDATE interview_applicants SET email_sent = 1 WHERE applicant_id = ?",
              [row.applicant_number],
            );

            // Insert notification log
            await db.query(
              `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp)
           VALUES (?, ?, ?, ?, ?, NOW())`,
              [
                "email",
                `📧 Interview schedule email sent for Applicant #${row.applicant_number} (Schedule #${row.schedule_id})`,
                row.applicant_number,
                actorEmail,
                actorName,
              ],
            );

            sent.push(row.applicant_number);
          } catch (err) {
            console.error(
              `❌ Failed to send interview email to ${row.emailAddress}:`,
              err.message,
            );
            await db.query(
              "UPDATE interview_applicants SET email_sent = -1 WHERE applicant_id = ?",
              [row.applicant_number],
            );
            failed.push(row.applicant_number);
          }
        }

        // Emit result to frontend
        socket.emit("send_schedule_emails_result", {
          success: true,
          sent,
          failed,
          message: `Interview emails processed: Sent=${sent.length}, Failed=${failed.length}`,
        });

        // Notify all clients to refresh
        io.emit("schedule_updated", { schedule_id });
      } catch (err) {
        console.error("Error in send_interview_emails:", err);
        socket.emit("send_schedule_emails_result", {
          success: false,
          error: "Server error sending interview emails.",
        });
      }
    },
  );
});

// ================== INSERT EXAM SCHEDULE ==================
app.get("/exam_schedules", async (req, res) => {
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
        COUNT(ea.applicant_id) AS assigned_count
      FROM entrance_exam_schedule s
      LEFT JOIN exam_applicants ea ON s.schedule_id = ea.schedule_id
      GROUP BY s.schedule_id
      ORDER BY s.schedule_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).json({ error: "Database error" });
  }
});



io.on("connection", (socket) => {
  console.log("✅ Socket.IO client connected");

  // ENTRANCE EXAM
  socket.on("update_schedule", async ({ schedule_id, applicant_numbers }) => {
    try {
      console.log(schedule_id);
      if (
        !schedule_id ||
        !applicant_numbers ||
        applicant_numbers.length === 0
      ) {
        return socket.emit("update_schedule_result", {
          success: false,
          error: "Schedule ID and applicants required.",
        });
      }

      // 🔎 Get room quota
      const [[scheduleInfo]] = await db.query(
        `SELECT room_quota FROM entrance_exam_schedule WHERE schedule_id = ?`,
        [schedule_id],
      );
      if (!scheduleInfo) {
        return socket.emit("update_schedule_result", {
          success: false,
          error: "Schedule not found.",
        });
      }
      const roomQuota = scheduleInfo.room_quota;

      // 🔎 Count how many are already assigned
      const [[{ currentCount }]] = await db.query(
        `SELECT COUNT(*) AS currentCount FROM exam_applicants WHERE schedule_id = ?`,
        [schedule_id],
      );

      // If total would exceed quota, reject
      if (currentCount + applicant_numbers.length > roomQuota) {
        return socket.emit("update_schedule_result", {
          success: false,
          error: `Room quota exceeded! Capacity: ${roomQuota}, Currently Assigned: ${currentCount}, Trying to add: ${applicant_numbers.length}.`,
        });
      }

      const assigned = [];
      const updated = [];
      const skipped = [];

      for (const applicant_number of applicant_numbers) {
        const [check] = await db.query(
          `SELECT * FROM exam_applicants WHERE applicant_id = ?`,
          [applicant_number],
        );

        if (check.length > 0) {
          if (check[0].schedule_id === schedule_id) {
            skipped.push(applicant_number); // already in this schedule
          } else {
            await db.query(
              `UPDATE exam_applicants SET schedule_id = ? WHERE applicant_id = ?`,
              [schedule_id, applicant_number],
            );
            updated.push(applicant_number);
          }
        } else {
          await db.query(
            `INSERT INTO exam_applicants (applicant_id, schedule_id) VALUES (?, ?)`,
            [applicant_number, schedule_id],
          );
          assigned.push(applicant_number);
        }
      }

      console.log("✅ Assigned:", assigned);
      console.log("✏️ Updated:", updated);
      console.log("⚠️ Skipped:", skipped);

      socket.emit("update_schedule_result", {
        success: true,
        assigned,
        updated,
        skipped,
      });
    } catch (error) {
      console.error("❌ Error assigning schedule:", error);
      socket.emit("update_schedule_result", {
        success: false,
        error: "Failed to assign schedule.",
      });
    }
  });

  // INTERVIEW EXAM
  socket.on(
    "update_schedule_for_interview",
    async ({ schedule_id, applicant_numbers }) => {
      try {
        console.log("For Interview: ", schedule_id);
        if (
          !schedule_id ||
          !applicant_numbers ||
          applicant_numbers.length === 0
        ) {
          return socket.emit("update_schedule_result", {
            success: false,
            error: "Schedule ID and applicants required.",
          });
        }

        // 🔎 Get room quota
        const [[scheduleInfo]] = await db.query(
          `SELECT room_quota FROM interview_exam_schedule WHERE schedule_id = ?`,
          [schedule_id],
        );
        if (!scheduleInfo) {
          return socket.emit("update_schedule_result", {
            success: false,
            error: "Schedule not found.",
          });
        }
        const roomQuota = scheduleInfo.room_quota;

        // 🔎 Count how many are already assigned
        const [[{ currentCount }]] = await db.query(
          `SELECT COUNT(*) AS currentCount FROM interview_applicants WHERE schedule_id = ?`,
          [schedule_id],
        );

        // If total would exceed quota, reject
        if (currentCount + applicant_numbers.length > roomQuota) {
          return socket.emit("update_schedule_result", {
            success: false,
            error: `Room quota exceeded! Capacity: ${roomQuota}, Currently Assigned: ${currentCount}, Trying to add: ${applicant_numbers.length}.`,
          });
        }

        const assigned = [];
        const updated = [];
        const skipped = [];

        for (const applicant_number of applicant_numbers) {
          const [check] = await db.query(
            `SELECT * FROM interview_applicants WHERE applicant_id = ?`,
            [applicant_number],
          );

          if (check.length > 0) {
            if (check[0].schedule_id === schedule_id) {
              skipped.push(applicant_number); // already in this schedule
            } else {
              await db.query(
                `UPDATE interview_applicants SET schedule_id = ? WHERE applicant_id = ?`,
                [schedule_id, applicant_number],
              );
              updated.push(applicant_number);
            }
          } else {
            await db.query(
              `INSERT INTO interview_applicants (applicant_id, schedule_id) VALUES (?, ?)`,
              [applicant_number, schedule_id],
            );
            assigned.push(applicant_number);
          }
        }

        console.log("✅ Assigned:", assigned);
        console.log("✏️ Updated:", updated);
        console.log("⚠️ Skipped:", skipped);

        socket.emit("update_schedule_result", {
          success: true,
          assigned,
          updated,
          skipped,
        });
      } catch (error) {
        console.error("❌ Error assigning schedule:", error);
        socket.emit("update_schedule_result", {
          success: false,
          error: "Failed to assign schedule.",
        });
      }
    },
  );

  function formatTime(timeStr) {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":"); // ignore seconds
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12; // convert 0 -> 12
    return `${h}:${minutes} ${ampm}`;
  }

  socket.on("send_schedule_emails", async (data) => {
    try {
      const { schedule_id, user_person_id, subject, message } = data;

      /* ================================
         1️⃣ Get Actor Info
      ================================= */
      const [actorRows] = await db3.query(
        `SELECT email, role, employee_id, last_name, first_name, middle_name
       FROM user_accounts
       WHERE person_id = ? LIMIT 1`,
        [user_person_id],
      );

      let actorEmail = "earistmis@gmail.com";
      let actorName = "SYSTEM";

      if (actorRows.length > 0) {
        const u = actorRows[0];
        actorEmail = u.email || actorEmail;

        actorName = `${(u.role || "").toUpperCase()} (${u.employee_id || ""}) -
      ${u.last_name || ""}, ${u.first_name || ""} ${u.middle_name || ""}`.trim();
      }

      /* ================================
         2️⃣ Office Name
      ================================= */
      const [[office]] = await db.query(
        "SELECT short_term FROM company_settings WHERE id = 1",
      );

      const shortTerm = office?.short_term || "EARIST";
      const officeName = `${shortTerm} - Admission Office`;

      /* ================================
         3️⃣ Get Applicants
         🔥 FIXED JOIN HERE
      ================================= */
      const [rows] = await db.query(
        `
        SELECT
          ea.schedule_id,

          s.day_description AS day,
          s.room_description AS room,
          s.start_time,
          s.end_time,

          an.applicant_number,

          p.person_id,
          p.first_name,
          p.last_name,
          p.emailAddress

        FROM exam_applicants ea

        JOIN entrance_exam_schedule s
          ON ea.schedule_id = s.schedule_id

        JOIN applicant_numbering_table an
          ON ea.applicant_id = an.applicant_number   -- ✅ CORRECT

        JOIN person_table p
          ON an.person_id = p.person_id

        WHERE ea.schedule_id = ?
        AND (ea.email_sent IS NULL OR ea.email_sent = 0)
        `,
        [schedule_id],
      );

      if (rows.length === 0) {
        return socket.emit("send_schedule_emails_result", {
          success: false,
          error: "No applicants found for this schedule.",
        });
      }

      /* ================================
         4️⃣ Helpers
      ================================= */
      const sent = [];
      const failed = [];
      const skipped = [];

      const formatTime = (timeStr) => {
        if (!timeStr) return "";
        const [h, m] = timeStr.split(":");
        let hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${m} ${ampm}`;
      };

      const applyTemplate = (template, row) => {
        return template
          .replace(/{first_name}/g, row.first_name || "")
          .replace(/{last_name}/g, row.last_name || "")
          .replace(/{applicant_number}/g, row.applicant_number || "")
          .replace(/{day}/g, row.day || "")
          .replace(/{room}/g, row.room || "")
          .replace(/{start_time}/g, formatTime(row.start_time))
          .replace(/{end_time}/g, formatTime(row.end_time))
          .replace(/{office}/g, officeName);
      };

      /* ================================
         5️⃣ Send Email
      ================================= */
      const sendEmail = async (row) => {
        if (!row.emailAddress) {
          skipped.push(row.applicant_number);
          return;
        }

        const finalMessage = applyTemplate(message, row);

        const mailOptions = {
          from: `"${officeName}" <${process.env.EMAIL_USER}>`,
          to: row.emailAddress,
          subject: subject || "Entrance Exam Schedule",
          text: finalMessage,
        };

        try {
          await transporter.sendMail(mailOptions);

          await db.query(
            `UPDATE exam_applicants
           SET email_sent = 1
           WHERE applicant_id = ?
           AND schedule_id = ?`,
            [row.applicant_number, row.schedule_id],
          );

          await db.query(
            `UPDATE person_status_table
           SET exam_status = 1
           WHERE person_id = ?`,
            [row.person_id],
          );

          const logMsg = `📧 Schedule email sent to Applicant #${row.applicant_number}`;

          await db.query(
            `INSERT INTO notifications
           (type, message, applicant_number, actor_email, actor_name, timestamp)
           VALUES (?, ?, ?, ?, ?, NOW())`,
            ["email", logMsg, row.applicant_number, actorEmail, actorName],
          );

          sent.push(row.applicant_number);
        } catch (err) {
          console.error("❌ Email failed:", err.message);
          failed.push(row.applicant_number);
        }
      };

      /* ================================
         6️⃣ Batch Sending
      ================================= */
      const batchSize = 5;
      const delayMs = 1000;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        await Promise.all(batch.map(sendEmail));

        if (i + batchSize < rows.length) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      /* ================================
         7️⃣ Result
      ================================= */
      socket.emit("send_schedule_emails_result", {
        success: true,
        sent,
        failed,
        skipped,
        message: `Sent=${sent.length}, Failed=${failed.length}, Skipped=${skipped.length}`,
      });

      io.emit("schedule_updated", { schedule_id });
    } catch (err) {
      console.error("send_schedule_emails ERROR:", err);

      socket.emit("send_schedule_emails_result", {
        success: false,
        error: "Server error sending emails.",
      });
    }
  });
});

app.post("/unassign_interview", async (req, res) => {
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

app.post("/unassign_all_from_interview", async (req, res) => {
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

// Get current number of applicants assigned to a schedule
app.get("/api/exam-schedule-count/:schedule_id", async (req, res) => {
  const { schedule_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM exam_applicants
       WHERE schedule_id = ?`,
      [schedule_id],
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error("Error fetching schedule count:", err);
    res.status(500).json({ error: "Database error" });
  }
});


//READ ENROLLED USERS (UPDATED!)
app.get("/enrolled_users", async (req, res) => {
  try {
    const query = "SELECT * FROM user_accounts";

    const [result] = await db3.query(query);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error Fetching data from the server" });
  }
});

// ------------------------- DEPARTMENT PANEL -------------------------------- //

app.post("/department", async (req, res) => {
  const { dep_name, dep_code } = req.body;
  const query =
    "INSERT INTO dprtmnt_table (dprtmnt_name, dprtmnt_code) VALUES (?, ?)";

  try {
    const normalized_code = dep_code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    const [rows] = await db3.query(
      "SELECT dprtmnt_id FROM dprtmnt_table WHERE dprtmnt_code = ?",
      [normalized_code],
    );

    if (rows.length > 0) {
      return res
        .status(400)
        .json({ message: "The department is already exists" });
    }

    const [result] = await db3.query(query, [dep_name, dep_code]);
    res.status(200).send({ insertId: result.insertId });
  } catch (err) {
    console.error("Error creating department:", err);
    res.status(500).send({ error: "Failed to create department" });
  }
});

// DEPARTMENT LIST (UPDATED!)
app.get("/get_department", async (req, res) => {
  const getQuery = "SELECT * FROM dprtmnt_table";

  try {
    const [result] = await db3.query(getQuery);
    res.status(200).send(result);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// UPDATE DEPARTMENT INFORMATION (SUPERADMIN) (UPDATED!)
app.put("/update_department/:id", async (req, res) => {
  const { id } = req.params; // Extract the department ID from the URL parameter
  const { dep_name, dep_code } = req.body; // Get the department name and code from the request body

  const updateQuery = `
      UPDATE dprtmnt_table
      SET dprtmnt_name = ?, dprtmnt_code = ?
      WHERE id = ?`;

  try {
    const [result] = await db3.query(updateQuery, [dep_name, dep_code, id]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Department not found" });
    }

    res.status(200).send({ message: "Department updated successfully" });
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// DELETE DEPARTMENT (SUPERADMIN) (UPDATED!)
app.delete("/delete_department/:id", async (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM dprtmnt_table WHERE id = ?";

  try {
    const [result] = await db3.query(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Department not found" });
    }

    res.status(200).send({ message: "Department deleted successfully" });
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


// -------------------------------- CURRICULUM PANEL ------------------------------------ //

app.post("/curriculum", async (req, res) => {
  const { year_id, program_id } = req.body;

  if (!year_id || !program_id) {
    return res
      .status(400)
      .json({ error: "Year ID and Program ID are required" });
  }

  try {
    const [rows] = await db3.query(
      "SELECT * FROM curriculum_table WHERE year_id = ? AND program_id = ?",
      [year_id, program_id],
    );
    if (rows.length > 0) {
      return res
        .status(400)
        .json({ message: "This curriculum is already existed" });
    }
    const sql =
      "INSERT INTO curriculum_table (year_id, program_id) VALUES (?, ?)";
    const [result] = await db3.query(sql, [year_id, program_id]);

    res.status(201).json({
      message: "Curriculum created successfully",
      curriculum_id: result.insertId,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
});

// CURRICULUM LIST (UPDATED!)
app.get("/get_curriculum", async (req, res) => {
  const readQuery = `
    SELECT ct.*, p.*, y.*
    FROM curriculum_table ct
    INNER JOIN program_table p ON ct.program_id = p.program_id
    INNER JOIN year_table y ON ct.year_id = y.year_id
  `;

  try {
    const [result] = await db3.query(readQuery);
    res.status(200).json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
});

// ✅ UPDATE Curriculum lock_status (0 = inactive, 1 = active)
app.put("/update_curriculum/:id", async (req, res) => {
  const { id } = req.params;
  const { lock_status } = req.body;

  try {
    // Ensure valid input
    if (lock_status !== 0 && lock_status !== 1) {
      return res
        .status(400)
        .json({ message: "Invalid status value (must be 0 or 1)" });
    }

    const sql =
      "UPDATE curriculum_table SET lock_status = ? WHERE curriculum_id = ?";
    const [result] = await db3.query(sql, [lock_status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Curriculum not found" });
    }

    res.status(200).json({ message: "Curriculum status updated successfully" });
  } catch (error) {
    console.error("❌ Error updating curriculum status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/update_curriculum_data/:id", async (req, res) => {
  const { id } = req.params;
  const { year_id, program_id } = req.body;

  try {
    const [result] = await db3.query(
      "UPDATE curriculum_table SET year_id = ?, program_id = ? WHERE curriculum_id = ?",
      [year_id, program_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Curriculum not found" });
    }

    res.json({ message: "Curriculum updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

app.delete("/delete_curriculum/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db3.query(
      "DELETE FROM curriculum_table WHERE curriculum_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Curriculum not found" });
    }

    res.json({ message: "Curriculum deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});


app.put("/update_program_units/:id", async (req, res) => {
  const { id } = req.params;
  const { lec_unit, lab_unit, course_unit } = req.body;

  try {
    const [result] = await db3.query(
      `UPDATE program_tagging_table SET
        lec_unit = ?,
        lab_unit = ?,
        course_unit = ?
       WHERE program_tagging_id = ?`,
      [lec_unit, lab_unit, course_unit, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tagging not found" });
    }

    res.json({ message: "Program units updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

app.get("/api/course/:courseId/all-fees", async (req, res) => {
  try {
    const [fees] = await db3.query(`
      SELECT fee_code, description, amount
      FROM fee_rules
      WHERE applies_to_all = 1
        AND fee_code IN (
          'COURSE_WITH_LAB_FEE',
          'COMPUTER_LABORATORY_FEE',
          'NSTP_SPECIAL_FEE'
        )
      ORDER BY fee_rule_id
    `);

    const total = fees.reduce((sum, f) => sum + Number(f.amount || 0), 0);

    res.json({
      breakdown: fees,
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to compute fees" });
  }
});

app.get("/api/coursepanel/fee_rules", async (req, res) => {
  try {
    const [rows] = await db3.query(`
    SELECT
  fee_rule_id,
  fee_code,
  description,
  amount,
  semester_id,
  year_level_id,
  dprtmnt_id,
  program_id,
  CAST(applies_to_all AS UNSIGNED) AS applies_to_all
FROM fee_rules;
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch course panel fees" });
  }
});

// =================== FEE RULES CRUD (using db3) ===================

// GET all fee rules (already exists)
app.get("/api/fee_rules", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT
        fee_rule_id,
        fee_code,
        description,
        amount,
        applies_to_all,
        iscomputer_lab,
        isnon_computer_lab,
        is_nstp,
        semester_id,
        year_level_id,
        dprtmnt_id,
        program_id
      FROM fee_rules
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch fee rules" });
  }
});

app.post("/insert_fee_rule", async (req, res) => {
  const {
    fee_code,
    description,
    amount,
    applies_to_all,
    semester_id,
    year_level_id,
    dprtmnt_id,
    program_id,
  } = req.body;

  try {
    await db3.query(
      `
      INSERT INTO fee_rules (
        fee_code,
        description,
        amount,
        applies_to_all,
        semester_id,
        year_level_id,
        dprtmnt_id,
        program_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        fee_code,
        description,
        amount,

        applies_to_all ? 1 : 0,
        applies_to_all ? null : semester_id || null,
        applies_to_all ? null : year_level_id || null,
        applies_to_all ? null : dprtmnt_id || null,
        applies_to_all ? null : program_id || null,
      ],
    );

    res.status(201).json({ message: "Fee rule inserted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to insert fee rule" });
  }
});

// =================== UPDATE an existing fee rule ===================
app.put("/update_fee_rule/:fee_rule_id", async (req, res) => {
  const { fee_rule_id } = req.params;
  const {
    description,
    amount,

    applies_to_all,
    semester_id,
    year_level_id,
    dprtmnt_id,
    program_id,
  } = req.body;

  try {
    const [result] = await db3.query(
      `
      UPDATE fee_rules
      SET
        description = ?,
        amount = ?,
        applies_to_all = ?,
        semester_id = ?,
        year_level_id = ?,
        dprtmnt_id = ?,
        program_id = ?
      WHERE fee_rule_id = ?
      `,
      [
        description,
        amount,
        applies_to_all ? 1 : 0,
        applies_to_all ? null : semester_id || null,
        applies_to_all ? null : year_level_id || null,
        applies_to_all ? null : dprtmnt_id || null,
        applies_to_all ? null : program_id || null,
        fee_rule_id,
      ],
    );

    res.json({
      message: "Fee rule updated",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

// =================== DELETE a fee rule ===================
app.delete("/delete_fee_rule/:fee_code", async (req, res) => {
  const { fee_code } = req.params;

  try {
    const [result] = await db3.query(
      `DELETE FROM fee_rules WHERE fee_code = ?`,
      [fee_code],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Fee rule not found" });
    }

    res.json({ message: "Fee rule deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete fee rule" });
  }
});

app.get("/api/misc_fee", async (req, res) => {
  const { year_level_id, semester_id, program_id, dprtmnt_id } = req.query;

  try {
    const [rows] = await db3.query(
      `
      SELECT fee_code, description, amount
      FROM fee_rules
      WHERE fee_code LIKE 'MISC%'
        AND year_level_id = ?
        AND semester_id = ?
        AND (program_id = ? OR program_id IS NULL)
        AND (dprtmnt_id = ? OR dprtmnt_id IS NULL)
      ORDER BY program_id DESC, dprtmnt_id DESC
      LIMIT 1
      `,
      [year_level_id, semester_id, program_id, dprtmnt_id],
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error("MISC FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch misc fee" });
  }
});

// UPDATE misc fee (save computed value)
// UPDATE misc fee (robust)
app.put("/api/misc_fee", async (req, res) => {
  const { amount, year_level_id, semester_id, program_id, dprtmnt_id } =
    req.body;

  try {
    const [result] = await db3.query(
      `
      UPDATE fee_rules
      SET amount = ?
      WHERE fee_code LIKE 'MISC%'
        AND year_level_id = ?
        AND semester_id = ?
        AND (program_id = ? OR program_id IS NULL)
        AND (dprtmnt_id = ? OR dprtmnt_id IS NULL)
      ORDER BY program_id DESC, dprtmnt_id DESC
      LIMIT 1
      `,
      [amount, year_level_id, semester_id, program_id, dprtmnt_id],
    );

    // 🔍 DEBUG GUARD
    if (result.affectedRows === 0) {
      console.warn("⚠️ No MISC row updated", {
        year_level_id,
        semester_id,
        program_id,
        dprtmnt_id,
      });
    }

    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error("MISC UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update misc fee" });
  }
});

app.get("/api/extra_fees", async (req, res) => {
  const { year_level_id, semester_id, dprtmnt_id, program_id } = req.query;

  try {
    const [rows] = await db3.query(
      `
      SELECT fee_rule_id, fee_code, description, amount
      FROM fee_rules
      WHERE (fee_code LIKE 'MISC%' OR fee_code = 'ID_FEE')
        AND (year_level_id = ? OR year_level_id IS NULL)
        AND (semester_id = ? OR semester_id IS NULL)
        AND (program_id = ? OR program_id IS NULL)
        AND (dprtmnt_id = ? OR dprtmnt_id IS NULL)
      ORDER BY
        program_id DESC,
        dprtmnt_id DESC,
        year_level_id DESC,
        semester_id DESC
      `,
      [year_level_id, semester_id, program_id, dprtmnt_id],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch extra fees" });
  }
});

// DELETE COURSE
// READ COURSE LIST (UPDATED!)
// ✅ FIXED: Works with your curriculum_table structure



// GET COURSES BY CURRICULUM ID (UPDATED!)
app.get("/get_courses_by_curriculum/:curriculum_id", async (req, res) => {
  const { curriculum_id } = req.params;

  const query = `
    SELECT c.*
    FROM program_tagging_table pt
    INNER JOIN course_table c ON pt.course_id = c.course_id
    WHERE pt.curriculum_id = ?
  `;

  try {
    const [result] = await db3.query(query, [curriculum_id]);
    res.status(200).json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Failed to retrieve courses",
      details: err.message,
    });
  }
});

app.get("/get_active_curriculum", async (req, res) => {
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

// COURSE TAGGING LIST (UPDATED!)
app.get("/get_course", async (req, res) => {
  const getCourseQuery = `
    SELECT
      yl.*, st.*, c.*
    FROM program_tagging_table pt
    INNER JOIN year_level_table yl ON pt.year_level_id = yl.year_level_id
    INNER JOIN semester_table st ON pt.semester_id = st.semester_id
    INNER JOIN course_table c ON pt.course_id = c.course_id
  `;

  try {
    const [results] = await db3.query(getCourseQuery);
    res.status(200).json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Failed to retrieve course tagging list",
      details: err.message,
    });
  }
});


// YEAR TABLE (UPDATED!)
app.post("/years", async (req, res) => {
  const { year_description } = req.body;

  if (!year_description) {
    return res.status(400).json({ error: "year_description is required" });
  }

  const query =
    "INSERT INTO year_table (year_description, status) VALUES (?, 0)";

  try {
    const [result] = await db3.query(query, [year_description]);
    res.status(201).json({
      year_id: result.insertId,
      year_description,
      status: 0,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({
      error: "Insert failed",
      details: err.message,
    });
  }
});

// YEAR LIST (UPDATED!)
app.get("/year_table", async (req, res) => {
  const query = "SELECT * FROM year_table";

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({
      error: "Query failed",
      details: err.message,
    });
  }
});

// UPDATE YEAR PANEL INFORMATION (UPDATED!)
app.put("/year_table/:id", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    if (status === 1) {
      // Deactivate all other years first
      const deactivateQuery = "UPDATE year_table SET status = 0";
      await db3.query(deactivateQuery);

      // Activate the selected year
      const activateQuery =
        "UPDATE year_table SET status = 1 WHERE year_id = ?";
      await db3.query(activateQuery, [id]);

      // Activate the selected year's 1st semester school year only
      await db3.query("UPDATE active_school_year_table SET astatus = 0");
      await db3.query(
        "UPDATE active_school_year_table SET astatus = 1 WHERE year_id = ? AND semester_id = 1",
        [id],
      );

      res.status(200).json({ message: "Year status updated successfully" });
    } else {
      // Deactivate the selected year
      const updateQuery = "UPDATE year_table SET status = 0 WHERE year_id = ?";
      await db3.query(updateQuery, [id]);

      // Deactivate all school years for this year
      await db3.query(
        "UPDATE active_school_year_table SET astatus = 0 WHERE year_id = ?",
        [id],
      );

      res.status(200).json({ message: "Year deactivated successfully" });
    }
  } catch (err) {
    console.error("Error updating year status:", err);
    res.status(500).json({
      error: "Failed to update year status",
      details: err.message,
    });
  }
});

// YEAR LEVEL PANEL (UPDATED!)
app.post("/years_level", async (req, res) => {
  const { year_level_description } = req.body;

  if (!year_level_description) {
    return res
      .status(400)
      .json({ error: "year_level_description is required" });
  }

  const query =
    "INSERT INTO year_level_table (year_level_description) VALUES (?)";

  try {
    const [result] = await db3.query(query, [year_level_description]);
    res.status(201).json({
      year_level_id: result.insertId,
      year_level_description,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Insert failed", details: err.message });
  }
});

// YEAR LEVEL TABLE (UPDATED!)
app.get("/get_year_level", async (req, res) => {
  const query = "SELECT * FROM year_level_table";

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({
      error: "Failed to retrieve year level data",
      details: err.message,
    });
  }
});

app.get("/get_active_semester", async (req, res) => {
  try {
    const semester = await db3.query(`
      SELECT smt.semester_id, smt.semester_description
      FROM active_school_year_table AS sy
      LEFT JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      WHERE sy.astatus = 1;
    `);

    res.json(semester[0]);
  } catch (err) {
    console.log("Internal Server Error");
    res.status(500).json(err);
  }
});

// SEMESTER PANEL (UPDATED!)
app.post("/semesters", async (req, res) => {
  const { semester_description } = req.body;

  if (!semester_description) {
    return res.status(400).json({ error: "semester_description is required" });
  }

  const query = "INSERT INTO semester_table (semester_description) VALUES (?)";

  try {
    const [result] = await db3.query(query, [semester_description]);
    res.status(201).json({
      semester_id: result.insertId,
      semester_description,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Insert failed", details: err.message });
  }
});

// SEMESTER TABLE (UPDATED!)
app.get("/get_semester", async (req, res) => {
  const query = "SELECT * FROM semester_table";

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Query failed", details: err.message });
  }
});

// GET SCHOOL YEAR
app.get("/school_years", async (req, res) => {
  const query = `
    SELECT sy.*, yt.year_description, s.semester_description
    FROM active_school_year_table sy
    JOIN year_table yt ON sy.year_id = yt.year_id
    JOIN semester_table s ON sy.semester_id = s.semester_id
    ORDER BY yt.year_description
  `;

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Fetch error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch school years", details: err.message });
  }
});

// CREATE SCHOOL YEAR
app.post("/school_years", async (req, res) => {
  const { year_id, semester_id, activator } = req.body;

  if (!year_id || !semester_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // Check if the school year already exists
    const checkQuery = `
      SELECT * FROM active_school_year_table
      WHERE year_id = ? AND semester_id = ?
    `;
    const [existing] = await db3.query(checkQuery, [year_id, semester_id]);

    if (existing.length > 0) {
      return res.status(400).json({ error: "This school year already exists" });
    }

    // Insert if not exists
    const insertQuery = `
      INSERT INTO active_school_year_table (year_id, semester_id, astatus, active)
      VALUES (?, ?, ?, 0)
    `;
    const [result] = await db3.query(insertQuery, [
      year_id,
      semester_id,
      activator,
    ]);

    res.status(201).json({ school_year_id: result.insertId });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      error: "Failed to process the school year",
      details: err.message,
    });
  }
});

// UPDATE SCHOOL YEAR (ACTIVATE/DEACTIVATE)
// UPDATE SCHOOL YEAR (ACTIVATE/DEACTIVATE)
app.put("/school_years/:id", async (req, res) => {
  const { id } = req.params;
  const { activator } = req.body;

  try {
    const [yearRows] = await db3.query(
      "SELECT year_id FROM active_school_year_table WHERE id = ? LIMIT 1",
      [id],
    );
    const yearId = yearRows[0]?.year_id;

    if (parseInt(activator) === 1) {
      await db3.query("UPDATE active_school_year_table SET astatus = 0");

      // Activate selected
      await db3.query(
        "UPDATE active_school_year_table SET astatus = 1 WHERE id = ?",
        [id],
      );

      if (yearId) {
        await db3.query("UPDATE year_table SET status = 0");
        await db3.query("UPDATE year_table SET status = 1 WHERE year_id = ?", [
          yearId,
        ]);
      }

      return res.status(200).json({ message: "School year activated" });
    } else {
      // Deactivate selected
      await db3.query(
        "UPDATE active_school_year_table SET astatus = 0 WHERE id = ?",
        [id],
      );

      // Unenroll all students tied to the deactivated school year
      await db3.query(
        "UPDATE student_status_table SET enrolled_status = 0 WHERE active_school_year_id = ?",
        [id],
      );

      if (yearId) {
        await db3.query("UPDATE year_table SET status = 0 WHERE year_id = ?", [
          yearId,
        ]);
      }

      return res.status(200).json({ message: "School year deactivated" });
    }
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ error: "Failed to update school year", details: err.message });
  }
});

// DELETE SCHOOL YEAR
app.delete("/school_years/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleteQuery = "DELETE FROM active_school_year_table WHERE id = ?";
    const [result] = await db3.query(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "School year not found" });
    }

    res.status(200).json({ message: "School year deleted successfully" });
  } catch (err) {
    console.error("Error deleting school year:", err);
    res
      .status(500)
      .json({ error: "Failed to delete school year", details: err.message });
  }
});


// ROOM LIST (UPDATED!)
app.get("/get_room", async (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).json({ error: "Department ID is required" });
  }

  const getRoomQuery = `
      SELECT r.room_id, r.room_description, d.dprtmnt_name
      FROM room_table r
      INNER JOIN dprtmnt_room_table drt ON r.room_id = drt.room_id
      INNER JOIN dprtmnt_table d ON drt.dprtmnt_id = d.dprtmnt_id
      WHERE drt.dprtmnt_id = ?
  `;

  try {
    const [result] = await db3.query(getRoomQuery, [department_id]);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch rooms", details: err.message });
  }
});

// DEPARTMENT ROOM PANEL (UPDATED!)
app.get("/api/assignments", async (req, res) => {
  const query = `
    SELECT
      drt.dprtmnt_room_id,
      drt.room_id,
      dt.dprtmnt_id,
      dt.dprtmnt_name,
      dt.dprtmnt_code,
      rt.room_description
    FROM dprtmnt_room_table drt
    INNER JOIN dprtmnt_table dt ON drt.dprtmnt_id = dt.dprtmnt_id
    INNER JOIN room_table rt ON drt.room_id = rt.room_id
  `;

  try {
    const [results] = await db3.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching assignments:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch assignments", details: err.message });
  }
});

// POST ROOM DEPARTMENT (UPDATED!)
app.post("/api/assign", async (req, res) => {
  const { dprtmnt_id, room_id } = req.body;

  if (!dprtmnt_id || !room_id) {
    return res
      .status(400)
      .json({ message: "Department and Room ID are required" });
  }

  try {
    // Check if the room is already assigned to the department
    const checkQuery = `
      SELECT * FROM dprtmnt_room_table
      WHERE dprtmnt_id = ? AND room_id = ?
    `;
    const [checkResults] = await db3.query(checkQuery, [dprtmnt_id, room_id]);

    if (checkResults.length > 0) {
      return res
        .status(400)
        .json({ message: "Room already assigned to this department" });
    }

    // Assign the room to the department
    const insertQuery = `
      INSERT INTO dprtmnt_room_table (dprtmnt_id, room_id)
      VALUES (?, ?)
    `;
    const [insertResult] = await db3.query(insertQuery, [dprtmnt_id, room_id]);

    return res.json({
      message: "Room successfully assigned to department",
      insertId: insertResult.insertId,
    });
  } catch (err) {
    console.error("Error assigning room:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

app.delete("/api/unassign/:dprtmnt_room_id", async (req, res) => {
  const { dprtmnt_room_id } = req.params;

  if (!dprtmnt_room_id) {
    return res.status(400).json({ message: "Assignment ID is required" });
  }

  try {
    const deleteQuery = `
      DELETE FROM dprtmnt_room_table WHERE dprtmnt_room_id = ?
    `;
    const [result] = await db3.query(deleteQuery, [dprtmnt_room_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Room assignment not found" });
    }

    return res.json({ message: "Room successfully unassigned" });
  } catch (err) {
    console.error("Error unassigning room:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// SECTIONS (UPDATED!)
// INSERT WITH DUPLICATE CHECK
app.post("/section_table", async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  try {
    // Check Duplicate
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

// UPDATE SECTION
app.put("/section_table/:id", async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  try {
    // Check duplicate
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

// DELETE SECTION
app.delete("/section_table/:id", async (req, res) => {
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

// SECTIONS LIST (UPDATED!)
app.get("/section_table", async (req, res) => {
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

// UPDATE SECTIONS (SUPERADMIN)

// DELETE SECTIONS (SUPERADMIN)

// ------------------------------ DEPARTMENT SECTION PANEL ------------------------------------ //

app.post("/department_section", async (req, res) => {
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

app.get("/department_section", async (req, res) => {
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

// Fetch all professors
app.get("/api/professors", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT
        pft.prof_id,
        pft.person_id,
        pft.fname,
        pft.mname,
        pft.lname,
        pft.email,
        pft.role,
        pft.status,
        pft.profile_image,
        MIN(dpt.dprtmnt_name) AS dprtmnt_name,
        MIN(dpt.dprtmnt_code) AS dprtmnt_code
      FROM dprtmnt_profs_table AS dpft
      INNER JOIN prof_table AS pft ON dpft.prof_id = pft.prof_id
      INNER JOIN dprtmnt_table AS dpt ON dpft.dprtmnt_id = dpt.dprtmnt_id
      GROUP BY pft.prof_id
    `);
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to retrieve professors", details: err.message });
  }
});

// ADD PROFESSOR ROUTE (Consistent with /api)
app.post(
  "/api/register_prof",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const {
        person_id,
        fname,
        mname,
        lname,
        email,
        password,
        dprtmnt_id,
        role,
      } = req.body;

      const [existingUser] = await db3.query(
        "SELECT * FROM prof_table WHERE email = ?",
        [email],
      );

      if (existingUser.length > 0) {
        return res.json({
          success: false,
          error: "Email already exists. Please use a different email.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let profileImage = null;
      if (req.file) {
        const year = new Date().getFullYear();
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `${person_id}_ProfessorProfile_${year}${ext}`;
        const filePath = path.join(__dirname, "uploads", filename);
        await fs.promises.writeFile(filePath, req.file.buffer);
        profileImage = filename;
      }

      const sql = `INSERT INTO prof_table (person_id, fname, mname, lname, email, password, role, profile_image)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        person_id,
        fname,
        mname,
        lname,
        email,
        hashedPassword,
        role,
        profileImage,
      ];

      const [result] = await db3.query(sql, values);
      const prof_id = result.insertId;

      const sql2 = `INSERT INTO dprtmnt_profs_table (dprtmnt_id, prof_id) VALUES (?, ?)`;
      await db3.query(sql2, [dprtmnt_id, prof_id]);

      res
        .status(201)
        .json({ success: true, message: "Professor added successfully" });
    } catch (err) {
      console.error("Insert error:", err);
      res.json({ success: false, error: "Failed to add professor" });
    }
  },
);

// Update professor info
app.put(
  "/api/update_prof/:id",
  upload.single("profileImage"),
  async (req, res) => {
    const id = req.params.id;
    const {
      person_id,
      fname,
      mname,
      lname,
      email,
      password,
      dprtmnt_id,
      role,
    } = req.body;

    try {
      const checkSQL = `SELECT * FROM prof_table WHERE email = ? AND prof_id != ?`;
      const [existingRows] = await db3.query(checkSQL, [email, id]);

      if (existingRows.length > 0) {
        return res.json({
          success: false,
          error: "Email already exists for another professor.",
        });
      }

      let profileImage = null;

      if (req.file) {
        const year = new Date().getFullYear();
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `${person_id}_ProfessorProfile_${year}${ext}`;
        const filePath = path.join(__dirname, "uploads", filename);
        await fs.promises.writeFile(filePath, req.file.buffer);
        profileImage = filename;
      }

      let updateSQL;
      let values;

      if (password && profileImage) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateSQL = `
        UPDATE prof_table
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, password = ?, role = ?, profile_image = ?
        WHERE prof_id = ?
      `;
        values = [
          person_id,
          fname,
          mname,
          lname,
          email,
          hashedPassword,
          role,
          profileImage,
          id,
        ];
      } else if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateSQL = `
        UPDATE prof_table
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, password = ?, role = ?
        WHERE prof_id = ?
      `;
        values = [
          person_id,
          fname,
          mname,
          lname,
          email,
          hashedPassword,
          role,
          id,
        ];
      } else if (profileImage) {
        updateSQL = `
        UPDATE prof_table
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, role = ?, profile_image = ?
        WHERE prof_id = ?
      `;
        values = [
          person_id,
          fname,
          mname,
          lname,
          email,
          role,
          profileImage,
          id,
        ];
      } else {
        updateSQL = `
        UPDATE prof_table
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, role = ?
        WHERE prof_id = ?
      `;
        values = [person_id, fname, mname, lname, email, role, id];
      }

      await db3.query(updateSQL, values);

      if (dprtmnt_id) {
        const [existing] = await db3.query(
          `SELECT * FROM dprtmnt_profs_table WHERE prof_id = ?`,
          [id],
        );

        if (existing.length > 0) {
          await db3.query(
            `UPDATE dprtmnt_profs_table SET dprtmnt_id = ? WHERE prof_id = ?`,
            [dprtmnt_id, id],
          );
        } else {
          await db3.query(
            `INSERT INTO dprtmnt_profs_table (dprtmnt_id, prof_id) VALUES (?, ?)`,
            [dprtmnt_id, id],
          );
        }
      }

      res.json({ success: true, message: "Professor updated successfully." });
    } catch (err) {
      res.json({ success: false, error: "Internal server error." });
    }
  },
);

// Toggle professor status (Active/Inactive)
app.put("/api/update_prof_status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [result] = await db3.query(
      "UPDATE prof_table SET status = ? WHERE prof_id = ?",
      [status, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Professor not found" });
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Status update error:", err);
    res
      .status(500)
      .json({ error: "Failed to update status", details: err.message });
  }
});

// GET ENROLLED STUDENTS (UPDATED!)
app.get(
  "/get_enrolled_students/:subject_id/:department_section_id/:active_school_year_id",
  async (req, res) => {
    const { subject_id, department_section_id, active_school_year_id } =
      req.params;

    // Validate the inputs
    if (!subject_id || !department_section_id || !active_school_year_id) {
      return res.status(400).json({
        message:
          "Subject ID, Department Section ID, and Active School Year ID are required.",
      });
    }

    const filterStudents = `
  SELECT
    person_table.*,
    enrolled_subject.*,
    time_table.*,
    section_table.description AS section_description,
    program_table.program_description,
    program_table.program_code,
    year_level_table.year_level_description,
    semester_table.semester_description,
    course_table.course_code,
    course_table.course_description,
    room_day_table.description AS day_description,
    room_table.room_description
  FROM time_table
  INNER JOIN enrolled_subject
    ON time_table.course_id = enrolled_subject.course_id
    AND time_table.department_section_id = enrolled_subject.department_section_id
    AND time_table.school_year_id = enrolled_subject.active_school_year_id
  INNER JOIN student_numbering_table
    ON enrolled_subject.student_number = student_numbering_table.student_number
  INNER JOIN person_table
    ON student_numbering_table.person_id = person_table.person_id
  INNER JOIN dprtmnt_section_table
    ON time_table.department_section_id = dprtmnt_section_table.id
  INNER JOIN section_table
    ON dprtmnt_section_table.section_id = section_table.id
  INNER JOIN curriculum_table
    ON dprtmnt_section_table.curriculum_id = curriculum_table.curriculum_id
  INNER JOIN program_table
    ON curriculum_table.program_id = program_table.program_id
  INNER JOIN program_tagging_table
    ON program_tagging_table.course_id = time_table.course_id
    AND program_tagging_table.curriculum_id = dprtmnt_section_table.curriculum_id
  INNER JOIN year_level_table
    ON program_tagging_table.year_level_id = year_level_table.year_level_id
  INNER JOIN semester_table
    ON program_tagging_table.semester_id = semester_table.semester_id
  INNER JOIN course_table
    ON program_tagging_table.course_id = course_table.course_id
  INNER JOIN active_school_year_table
    ON time_table.school_year_id = active_school_year_table.id
  INNER JOIN room_day_table
    ON time_table.room_day = room_day_table.id
  INNER JOIN dprtmnt_room_table
    ON time_table.department_room_id = dprtmnt_room_table.dprtmnt_room_id
  INNER JOIN room_table
    ON dprtmnt_room_table.room_id = room_table.room_id
  WHERE time_table.course_id = ?
    AND time_table.department_section_id = ?
    AND time_table.school_year_id = ?
    AND active_school_year_table.astatus = 1;

`;

    try {
      // Execute the query using promise-based `execute` method
      const [result] = await db3.execute(filterStudents, [
        subject_id,
        department_section_id,
        active_school_year_id,
      ]);

      // Check if no students were found
      if (result.length === 0) {
        return res.status(404).json({
          message: "No students found for this subject-section combination.",
        });
      }

      // Send the response with the result
      res.json({
        totalStudents: result.length,
        students: result,
      });
    } catch (err) {
      console.error("Query failed:", err);
      return res
        .status(500)
        .json({ message: "Server error while fetching students." });
    }
  },
);

app.get(
  "/get_subject_info/:subject_id/:department_section_id/:active_school_year_id",
  async (req, res) => {
    const { subject_id, department_section_id, active_school_year_id } =
      req.params;

    if (!subject_id || !department_section_id || !active_school_year_id) {
      return res.status(400).json({
        message:
          "Subject ID, Department Section ID, and School Year ID are required.",
      });
    }

    const sectionInfoQuery = `
  SELECT
    section_table.description AS section_description,
    course_table.course_code,
    course_table.course_description,
    year_level_table.year_level_description AS year_level_description,
    year_level_table.year_level_id,
    semester_table.semester_description,
    room_table.room_description,
    time_table.school_time_start,
    time_table.school_time_end,
    program_table.program_code,
    program_table.program_description,
    room_day_table.description AS day_description
  FROM time_table
  INNER JOIN dprtmnt_section_table
    ON time_table.department_section_id = dprtmnt_section_table.id
  INNER JOIN section_table
    ON dprtmnt_section_table.section_id = section_table.id
  LEFT JOIN curriculum_table
    ON dprtmnt_section_table.curriculum_id = curriculum_table.curriculum_id
  LEFT JOIN program_table
    ON curriculum_table.program_id = program_table.program_id
  INNER JOIN course_table
    ON time_table.course_id = course_table.course_id
  LEFT JOIN program_tagging_table
    ON program_tagging_table.course_id = time_table.course_id
  LEFT JOIN year_level_table
    ON program_tagging_table.year_level_id = year_level_table.year_level_id
  LEFT JOIN semester_table
    ON program_tagging_table.semester_id = semester_table.semester_id
  LEFT JOIN room_day_table
    ON time_table.room_day = room_day_table.id
  LEFT JOIN dprtmnt_room_table
    ON time_table.department_room_id = dprtmnt_room_table.dprtmnt_room_id
  LEFT JOIN room_table
    ON dprtmnt_room_table.room_id = room_table.room_id
  WHERE time_table.course_id = ?
    AND time_table.department_section_id = ?
    AND time_table.school_year_id = ?
  LIMIT 1;
`;

    try {
      const [result] = await db3.execute(sectionInfoQuery, [
        subject_id,
        department_section_id,
        active_school_year_id,
      ]);

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "No section information found for this mapping." });
      }

      res.json({ sectionInfo: result[0] });
    } catch (err) {
      console.error("Section info query error:", err);
      res
        .status(500)
        .json({ message: "Server error while fetching section info." });
    }
  },
);

app.get(
  "/get_class_details/:selectedActiveSchoolYear/:profID",
  async (req, res) => {
    const { selectedActiveSchoolYear, profID } = req.params;
    try {
      const query = `
    SELECT
        cst.course_id,
        cst.course_unit,
        cst.lab_unit,
        cst.course_description,
        cst.course_code,
        pt.program_code,
        st.description AS section_description,
        rt.room_description,
        tt.school_time_start,
        tt.school_time_end,
        rdt.description AS day,
        tt.department_section_id,
        tt.school_year_id,
        yr.year_description AS current_year,
        yr.year_description + 1 AS next_year,
        smt.semester_description,
        COUNT(DISTINCT es.student_number) AS enrolled_students
      FROM time_table AS tt
        INNER JOIN course_table AS cst ON tt.course_id = cst.course_id
        INNER JOIN dprtmnt_section_table AS dst ON tt.department_section_id = dst.id
        INNER JOIN curriculum_table AS ct ON dst.curriculum_id = ct.curriculum_id
        INNER JOIN section_table AS st ON dst.section_id = st.id
        INNER JOIN program_table AS pt ON ct.program_id = pt.program_id
        INNER JOIN dprtmnt_room_table AS drt ON drt.dprtmnt_room_id = tt.department_room_id
        INNER JOIN room_table AS rt ON drt.room_id = rt.room_id
        INNER JOIN room_day_table AS rdt ON tt.room_day = rdt.id
        LEFT JOIN enrolled_subject AS es ON es.course_id = tt.course_id
          AND es.active_school_year_id = tt.school_year_id
          AND es.department_section_id = tt.department_section_id
        WHERE tt.school_year_id = ? AND tt.professor_id = ?
      GROUP BY cst.course_id, cst.course_description, cst.course_code, pt.program_code, st.description;
    `;
      const [result] = await db3.query(query, [
        selectedActiveSchoolYear,
        profID,
      ]);
      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Server Error: ", err);
      res.status(500).send({ message: "Internal Error", err });
    }
  },
);

app.get(
  "/get_student_list/:course_id/:department_section_id/:school_year_id",
  async (req, res) => {
    const { course_id, department_section_id, school_year_id } = req.params;
    try {
      const query = `
    SELECT es.id as enrolled_id,snt.student_number,pst.first_name, pst.middle_name, pst.last_name, pt.program_code, st.description AS section_description, ct.course_description, ct.course_code FROM enrolled_subject AS es
      INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
      INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN curriculum_table AS cct ON dst.curriculum_id = cct.curriculum_id
      INNER JOIN program_table AS pt ON cct.program_id = pt.program_id
      INNER JOIN course_table AS ct ON es.course_id = ct.course_id
      INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
    WHERE es.course_id = ? AND es.department_section_id = ? AND es.active_school_year_id = ?
    `;
      const [result] = await db3.query(query, [
        course_id,
        department_section_id,
        school_year_id,
      ]);
      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Server Error: ", err);
      res.status(500).send({ message: "Internal Error", err });
    }
  },
);

// PROFESSOR LIST (UPDATED!)
app.get("/get_prof", async (req, res) => {
  const { department_id } = req.query;

  // Validate the input
  if (!department_id) {
    return res.status(400).json({ message: "Department ID is required." });
  }

  const getProfQuery = `
  SELECT p.*, d.dprtmnt_name
  FROM prof_table p
  INNER JOIN dprtmnt_profs_table dpt ON p.prof_id = dpt.prof_id
  INNER JOIN dprtmnt_table d ON dpt.dprtmnt_id = d.dprtmnt_id
  WHERE dpt.dprtmnt_id = ?
  `;

  try {
    // Execute the query using promise-based `execute` method
    const [result] = await db3.execute(getProfQuery, [department_id]);

    // Send the response with the result
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching professors:", err);
    return res
      .status(500)
      .json({ message: "Server error while fetching professors." });
  }
});

// prof filter
app.get("/prof_list/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `SELECT pt.* FROM dprtmnt_profs_table as dpt
                  INNER JOIN prof_table as pt
                  ON dpt.prof_id = pt.prof_id
                  INNER JOIN dprtmnt_table as dt
                  ON dt.dprtmnt_id = dpt.dprtmnt_id
                  WHERE dpt.dprtmnt_id = ? `;
    const [results] = await db3.query(query, [dprtmnt_id]);
    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/room_list/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `SELECT rt.* FROM dprtmnt_room_table as drt
                  INNER JOIN room_table as rt
                  ON drt.room_id = rt.room_id
                  INNER JOIN dprtmnt_table as dt
                  ON dt.dprtmnt_id = drt.dprtmnt_id
                  WHERE drt.dprtmnt_id = ? `;
    const [results] = await db3.query(query, [dprtmnt_id]);
    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/schedule-plotting/day_list", async (req, res) => {
  try {
    const query =
      "SELECT rdt.id AS day_id, rdt.description AS day_description FROM room_day_table AS rdt";
    const [result] = await db3.query(query);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.delete("/api/delete/schedule/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleteQuery = `DELETE FROM time_table WHERE id = ?`;
    const [result] = await db3.execute(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found." });
    }

    res.json({ message: "Schedule deleted successfully." });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ error: "Database error while deleting schedule." });
  }
});

//SCHEDULE CHECKER
app.post("/api/check-subject", async (req, res) => {
  const { section_id, school_year_id, subject_id, day_of_week } = req.body;

  if (!school_year_id || !subject_id || !day_of_week) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `
    SELECT * FROM time_table
    WHERE department_section_id = ?
      AND school_year_id = ?
      AND course_id = ?
      AND room_day = ?
  `;

  try {
    const [result] = await db3.query(query, [
      section_id,
      school_year_id,
      subject_id,
      day_of_week,
    ]);

    if (result.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//HELPER FUNCTION
function timeToMinutes(timeStr) {
  const parts = timeStr.trim().split(" ");
  let [hours, minutes] = parts[0].split(":").map(Number);
  const modifier = parts[1] ? parts[1].toUpperCase() : null;

  if (modifier) {
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
}

//CHECK CONFLICT
app.post("/api/check-conflict", async (req, res) => {
  const {
    day,
    start_time,
    end_time,
    section_id,
    school_year_id,
    prof_id,
    room_id,
    subject_id,
  } = req.body;

  try {
    const start_time_m = timeToMinutes(start_time);
    const end_time_m = timeToMinutes(end_time);

    const countQuery = `
      SELECT COUNT(*) AS subject_count
      FROM time_table
      WHERE department_section_id = ?
        AND school_year_id = ?
        AND professor_id = ?
        AND department_room_id = ?
        AND course_id = ?
    `;
    const [countResult] = await db3.query(countQuery, [
      section_id,
      school_year_id,
      prof_id,
      room_id,
      subject_id,
    ]);

    if (countResult[0].subject_count >= 2) {
      return res.status(409).json({
        conflict: true,
        message:
          "This subject is already assigned twice for the same section, room, school year, and professor.",
      });
    }

    const query = `
      SELECT * FROM time_table
      WHERE department_section_id = ?
        AND school_year_id = ?
        AND course_id = ?
        AND room_day = ?
    `;

    const [subjectResult] = await db3.query(query, [
      section_id,
      school_year_id,
      subject_id,
      day,
    ]);

    if (subjectResult.length > 0) {
      return res.status(409).json({
        conflict: true,
        message:
          "This subject is already assigned in this section and school year on the same day.",
      });
    }

    // Check for time conflicts (prof, section, room)
    const checkTimeQuery = `
      SELECT * FROM time_table
      WHERE room_day = ?
        AND school_year_id = ?
        AND (professor_id = ? OR department_section_id = ? OR department_room_id = ?)
        AND (
          (? > TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60
          AND ? < TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60)
          OR
          (? > TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60
          AND ? < TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 > ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 < ?)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 > ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 < ?)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 = ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 = ?)
        )
    `;

    const [timeResult] = await db3.query(checkTimeQuery, [
      day,
      school_year_id,
      prof_id,
      section_id,
      room_id,
      start_time_m,
      start_time_m,
      end_time_m,
      end_time_m,
      start_time_m,
      end_time_m,
      start_time_m,
      end_time_m,
      start_time_m,
      end_time_m,
    ]);

    if (timeResult.length > 0) {
      return res.status(409).json({
        conflict: true,
        message: "Schedule conflict detected! Please choose a different time.",
      });
    }

    return res
      .status(200)
      .json({ conflict: false, message: "Schedule is available." });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Check conflict API
app.post("/api/check-time", async (req, res) => {
  const { start_time, end_time } = req.body;

  try {
    let startMinutes = timeToMinutes(start_time);
    let endMinutes = timeToMinutes(end_time);
    const earliest = timeToMinutes("7:00 AM");
    const latest = timeToMinutes("9:00 PM");

    console.log({
      start_time,
      end_time,
      startMinutes,
      endMinutes,
      earliest,
      latest,
    });

    if (endMinutes <= startMinutes) {
      return res.status(409).json({
        conflict: true,
        message: "End time must be later than start time (same day only).",
      });
    }

    // ✅ Check validity
    if (startMinutes < earliest || endMinutes > latest) {
      return res.status(409).json({
        conflict: true,
        message: "Time must be between 7:00 AM and 9:00 PM (same day).",
      });
    }

    return res.status(200).json({
      conflict: false,
      message: "Valid schedule time",
    });
  } catch (err) {
    console.error("Error checking conflict:", err);
    return res
      .status(500)
      .json({ error: "Server error while checking conflict" });
  }
});

// ✅ Insert schedule API
app.post("/api/insert-schedule", async (req, res) => {
  const {
    day,
    start_time,
    end_time,
    section_id,
    subject_id,
    prof_id,
    room_id,
    school_year_id,
    ishonorarium,
  } = req.body;

  if (
    !day ||
    !start_time ||
    !end_time ||
    !school_year_id ||
    !prof_id ||
    !room_id ||
    !subject_id
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let startMinutes = timeToMinutes(start_time);
  let endMinutes = timeToMinutes(end_time);
  const earliest = timeToMinutes("7:00 AM");
  const latest = timeToMinutes("9:00 PM");

  // Validate times
  if (endMinutes <= startMinutes) {
    return res.status(409).json({
      conflict: true,
      message: "End time must be later than start time (same day only).",
    });
  }

  if (startMinutes < earliest || endMinutes > latest) {
    return res.status(409).json({
      conflict: true,
      message: "Time must be between 7:00 AM and 9:00 PM (same day).",
    });
  }

  try {
    const query = `
      SELECT * FROM time_table
      WHERE department_section_id = ?
        AND school_year_id = ?
        AND course_id = ?
        AND room_day = ?
    `;

    const [subjectResult] = await db3.query(query, [
      section_id,
      school_year_id,
      subject_id,
      day,
    ]);

    if (subjectResult.length > 0) {
      return res.status(409).json({
        conflict: true,
        message:
          "This subject is already assigned in this section and school year on the same day.",
      });
    }

    // Check for time conflicts (prof, section, room)
    const checkTimeQuery = `
      SELECT * FROM time_table
      WHERE room_day = ?
        AND school_year_id = ?
        AND (professor_id = ? OR department_section_id = ? OR department_room_id = ?)
        AND (
          (? > TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60
          AND ? < TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60)
          OR
          (? > TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60
          AND ? < TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 > ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 < ?)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 > ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 < ?)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 = ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 = ?)
        )
    `;

    const [timeResult] = await db3.query(checkTimeQuery, [
      day,
      school_year_id,
      prof_id,
      section_id,
      room_id,
      startMinutes,
      startMinutes,
      endMinutes,
      endMinutes,
      startMinutes,
      endMinutes,
      startMinutes,
      endMinutes,
      startMinutes,
      endMinutes,
    ]);

    if (timeResult.length > 0) {
      return res.status(409).json({
        conflict: true,
        message: "Schedule conflict detected! Please choose a different time.",
      });
    }

    // Insert schedule
    const insertQuery = `
      INSERT INTO time_table
      (room_day, school_time_start, school_time_end, department_section_id, course_id, ishonorarium, professor_id, department_room_id, school_year_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db3.query(insertQuery, [
      day,
      start_time,
      end_time,
      section_id,
      subject_id,
      ishonorarium,
      prof_id,
      room_id,
      school_year_id,
    ]);

    res.status(200).json({ message: "Schedule inserted successfully" });
  } catch (error) {
    console.error("Error inserting schedule:", error);
    res.status(500).json({ error: "Failed to insert schedule" });
  }
});

// GET STUDENTS THAT HAVE NO STUDENT NUMBER (UPDATED!)
app.get("/api/persons", async (req, res) => {
  try {
    // STEP 1: Get all eligible persons (from ENROLLMENT DB)
    const [persons] = await db.execute(`
      SELECT p.*
      FROM admission.person_table p
      JOIN admission.person_status_table ps ON p.person_id = ps.person_id
      WHERE ps.student_registration_status = 0
      AND p.person_id NOT IN (SELECT person_id FROM enrollment.student_numbering_table)
    `);

    if (persons.length === 0) return res.json([]);

    const personIds = persons.map((p) => p.person_id);

    // STEP 2: Get all applicant numbers for those person_ids (from ADMISSION DB)
    const [applicantNumbers] = await db.query(
      `
      SELECT applicant_number, person_id
      FROM applicant_numbering_table
      WHERE person_id IN (?)
    `,
      [personIds],
    );

    // Create a quick lookup map
    const applicantMap = {};
    for (let row of applicantNumbers) {
      applicantMap[row.person_id] = row.applicant_number;
    }

    // STEP 3: Merge applicant_number into each person object
    const merged = persons.map((person) => ({
      ...person,
      applicant_number: applicantMap[person.person_id] || null,
    }));

    res.json(merged);
  } catch (err) {
    console.error("❌ Error merging person + applicant ID:", err);
    res.status(500).send("Server error");
  }
});

// GET total number of accepted students
app.get("/api/accepted-students-count", async (req, res) => {
  try {
    const [rows] = await db3.execute(`
      SELECT COUNT(*) AS total
      FROM person_table p
      JOIN person_status_table ps ON p.person_id = ps.person_id
      WHERE ps.student_registration_status = 1
    `);

    res.json(rows[0]); // { total: 25 }
  } catch (err) {
    console.error("Error fetching accepted students count:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Corrected route with parameter (UPDATED!)
app.get("/courses/:currId", async (req, res) => {
  const { currId } = req.params;
  console.log("cURRICULUM ID: ", currId);

  const sql = `
    SELECT
      ctt.program_tagging_id,
      ctt.curriculum_id,
      ctt.course_id,
      ctt.year_level_id,
      ctt.semester_id,
      c.course_code,
      c.course_description,
      c.course_unit,
      c.lec_unit,
      c.lab_unit,
      c.prereq,
      c.corequisite
    FROM program_tagging_table ctt
    INNER JOIN course_table c
      ON c.course_id = ctt.course_id
    WHERE ctt.curriculum_id = ?
    ORDER BY c.course_code
  `;

  try {
    const [result] = await db3.query(sql, [currId]);
    res.json(result);
  } catch (err) {
    console.error("Error in /courses:", err);
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE THE CODE "/enrolled_courses/:userId/:currId", AND "/student-data/:studentNumber" WITH THIS CODE FOR COR

app.post("/add-all-to-enrolled-courses", async (req, res) => {
  const { subject_id, user_id, curriculumID, departmentSectionID, year_level } =
    req.body;
  console.log("Received request:", {
    subject_id,
    user_id,
    curriculumID,
    departmentSectionID,
  });

  try {
    const activeYearSql = `SELECT id, semester_id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;
    const activeSemesterId = yearResult[0].semester_id;
    console.log("Active semester ID:", activeSemesterId);

    const checkSql = `
      SELECT year_level_id, semester_id, curriculum_id
      FROM program_tagging_table
      WHERE course_id = ? AND curriculum_id = ?
      LIMIT 1
    `;

    const [checkResult] = await db3.query(checkSql, [subject_id, curriculumID]);

    if (!checkResult.length) {
      console.warn(`Subject ${subject_id} not found in tagging table`);
      return res.status(404).json({ message: "Subject not found" });
    }

    const { year_level_id, semester_id, curriculum_id } = checkResult[0];
    console.log("Year level found:", year_level_id);
    console.log("Subject semester:", semester_id);
    console.log("Active semester:", activeSemesterId);
    console.log("Curriculum found:", curriculum_id);

    if (
      year_level_id !== year_level ||
      semester_id !== activeSemesterId ||
      curriculum_id !== curriculumID
    ) {
      console.log(
        `Skipping subject ${subject_id} (not Year 1, not active semester ${activeSemesterId}, or wrong curriculum)`,
      );
      return res.status(200).json({
        message:
          "Skipped - Not Year 1 / Not Active Semester / Wrong Curriculum",
      });
    }

    const checkDuplicateSql = `
      SELECT * FROM enrolled_subject
      WHERE course_id = ? AND student_number = ? AND active_school_year_id = ?
    `;

    const [dupResult] = await db3.query(checkDuplicateSql, [
      subject_id,
      user_id,
      activeSchoolYearId,
    ]);

    if (dupResult.length > 0) {
      console.log(
        `Skipping subject ${subject_id}, already enrolled for student ${user_id}`,
      );
      return res.status(200).json({ message: "Skipped - Already Enrolled" });
    }

    const insertSql = `
      INSERT INTO enrolled_subject (course_id, student_number, active_school_year_id, curriculum_id, department_section_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db3.query(insertSql, [
      subject_id,
      user_id,
      activeSchoolYearId,
      curriculumID,
      departmentSectionID,
      1,
    ]);
    console.log(
      `Student ${user_id} successfully enrolled in subject ${subject_id}`,
    );

    const updateStatusSql = `
      UPDATE student_status_table
      SET enrolled_status = 1, active_curriculum = ?, year_level_id = ?, active_school_year_id = ?
      WHERE student_number = ?
    `;

    await db3.query(updateStatusSql, [
      curriculumID,
      year_level,
      activeSchoolYearId,
      user_id,
    ]);

    const [getStudentNUmber] = await db3.query(
      `
      SELECT id, person_id FROM student_numbering_table WHERE student_number = ?
    `,
      [user_id],
    );

    if (getStudentNUmber.length === 0) {
      console.log("Student number not found");
    }

    const student_numbering_id = getStudentNUmber[0].id;
    const person_id = getStudentNUmber[0].person_id;

    const [getDepartmentID] = await db3.query(
      `
      SELECT dprtmnt_id FROM dprtmnt_curriculum_table WHERE curriculum_id = ?
    `,
      [curriculumID],
    );

    if (getDepartmentID.length === 0) {
      console.log("Department ID not found");
    }

    const department_id = getDepartmentID[0].dprtmnt_id;

    const [checkExistingCurriculum] = await db3.query(
      `
      SELECT * FROM student_curriculum_table
      WHERE student_numbering_id = ? AND curriculum_id = ?
      `,
      [student_numbering_id, curriculum_id],
    );

    await db3.query(
      `
        UPDATE user_accounts SET dprtmnt_id = ? WHERE person_id = ?
      `,
      [department_id, person_id],
    );

    if (checkExistingCurriculum.length === 0) {
      await db3.query(
        `
        INSERT INTO student_curriculum_table (student_numbering_id, curriculum_id)
        VALUES (?, ?)
        `,
        [student_numbering_id, curriculum_id],
      );
    } else {
      console.log(
        `⚠️ Curriculum ${curriculum_id} already exists for student ${user_id}`,
      );
    }

    res.status(200).json({ message: "Course enrolled successfully" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

//(UPDATED!)
app.post("/add-to-enrolled-courses/:userId/:currId/", async (req, res) => {
  const { subject_id, department_section_id } = req.body;
  const { userId, currId } = req.params;

  try {
    const activeYearSql = `SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;

    const sql =
      "INSERT INTO enrolled_subject (course_id, student_number, active_school_year_id, curriculum_id, department_section_id) VALUES (?, ?, ?, ?, ?)";
    await db3.query(sql, [
      subject_id,
      userId,
      activeSchoolYearId,
      currId,
      department_section_id,
    ]);

    const [getStudentNUmber] = await db3.query(
      `
      SELECT id FROM student_numbering_table WHERE student_number = ?
    `,
      [userId],
    );

    if (getStudentNUmber.length === 0) {
      throw new Error("Student number not found");
    }

    const student_numbering_id = getStudentNUmber[0].id;

    const [checkExistingCurriculum] = await db3.query(
      `
      SELECT * FROM student_curriculum_table
      WHERE student_numbering_id = ? AND curriculum_id = ?
      `,
      [student_numbering_id, currId],
    );

    if (checkExistingCurriculum.length === 0) {
      await db3.query(
        `
        INSERT INTO student_curriculum_table (student_numbering_id, curriculum_id)
        VALUES (?, ?)
        `,
        [student_numbering_id, currId],
      );
    } else {
      console.log(
        `⚠️ Curriculum ${currId} already exists for student ${userId}`,
      );
    }

    res.json({ message: "Course enrolled successfully" });
  } catch (err) {
    return res.status(500).json(err);
  }
});

// Delete a single selected subject + its evaluations
app.delete("/courses/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 3. Delete the enrolled subject itself
    const sql = "DELETE FROM enrolled_subject WHERE id = ?";
    await db3.query(sql, [id]);

    res.json({
      message: "Course and related evaluations removed successfully",
    });
  } catch (err) {
    console.error("Error deleting subject:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// Delete all courses for user (UPDATED!)
app.delete("/courses/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const activeYearSql = `SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;

    const sql =
      "DELETE FROM enrolled_subject WHERE student_number = ? AND active_school_year_id = ?";
    await db3.query(sql, [userId, activeSchoolYearId]);

    res.json({ message: "All courses unenrolled successfully" });
  } catch (err) {
    return res.status(500).json(err);
  }
});

// Login User (UPDATED!)

// --------------------- FOR SEARCHBAR IN CORFORCOLLEGE AND COURSE TAGGING

app.post("/student-tagging", async (req, res) => {
  const { studentNumber } = req.body;
  console.log("Student NUmber", studentNumber);
  if (!studentNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const sql = `
      SELECT DISTINCT
        IFNULL(ss.id, "") AS student_status_id ,
        sn.student_number,
        ptbl.person_id,
        ptbl.first_name,
        ptbl.last_name,
        ptbl.middle_name,
        ptbl.age,
        ptbl.gender,
        ptbl.emailAddress,
        ptbl.program,
        ptbl.profile_img,
        ptbl.extension,
        ss.active_curriculum,
        pt.program_id,
        pt.major,
        pt.program_description,
        pt.program_code,
        yt.year_id,
        yt.year_description,
        es.status AS enrolled_status,
        es.department_section_id,
        st.description AS section_description,
        dt.dprtmnt_name,
        ylt.year_level_id,
        ylt.year_level_description,
        ss.active_school_year_id,
        sy.semester_id
    FROM student_numbering_table AS sn
    LEFT JOIN student_status_table AS ss ON sn.student_number = ss.student_number
    LEFT JOIN person_table AS ptbl ON sn.person_id = ptbl.person_id
    LEFT JOIN curriculum_table AS c ON ss.active_curriculum = c.curriculum_id
    LEFT JOIN program_table AS pt ON c.program_id = pt.program_id
    LEFT JOIN year_table AS yt ON c.year_id = yt.year_id
    LEFT JOIN enrolled_subject AS es ON ss.student_number = es.student_number
    LEFT JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
    LEFT JOIN section_table AS st ON dst.section_id = st.id
    LEFT JOIN dprtmnt_curriculum_table AS dct ON c.curriculum_id = dct.curriculum_id
    LEFT JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
    LEFT JOIN year_level_table AS ylt ON ss.year_level_id = ylt.year_level_id
    LEFT JOIN active_school_year_table AS sy ON ss.active_school_year_id = sy.id
    WHERE sn.student_number = ? AND (
        ss.active_school_year_id = 0
        OR sy.astatus = 1
      );
    `;

    const [results] = await db3.query(sql, [studentNumber]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid Student Number" });
    }

    const student = results[0];

    const feeSql = `
      SELECT
        COALESCE(SUM(lec_fee), 0) AS total_lec_fee,
        COALESCE(SUM(lab_fee), 0) AS total_lab_fee,
        COALESCE(SUM(total_nstp), 0) AS total_nstp,
        COALESCE(SUM(total_computer_lab), 0) AS total_computer_lab,
        COALESCE(SUM(total_laboratory), 0) AS total_laboratory
      FROM (
        SELECT
          course_id,
          MAX(lec_fee) AS lec_fee,
          MAX(lab_fee) AS lab_fee,
          MAX(is_nstp = 1) AS total_nstp,
          MAX(iscomputer_lab = 1) AS total_computer_lab,
          MAX(islaboratory_fee = 1) AS total_laboratory
        FROM program_tagging_table
        WHERE curriculum_id = ?
          AND year_level_id = ?
          AND semester_id = ?
        GROUP BY course_id
      ) fees;

    `;

    const [feeResult] = await db3.query(feeSql, [
      student.active_curriculum,
      student.year_level_id,
      student.semester_id,
    ]);

    const totalLecFee = Number(feeResult[0]?.total_lec_fee || 0);
    const totalLabFee = Number(feeResult[0]?.total_lab_fee || 0);
    const totalFees = totalLecFee + totalLabFee;
    const totalNstpCount = Number(feeResult[0]?.total_nstp || 0);
    const totalComputerLab = Number(feeResult[0]?.total_computer_lab || 0);
    const totalLaboratory = Number(feeResult[0]?.total_laboratory || 0);
    const isEnrolled = student.enrolled_status === 1;

    const effectiveProgram =
      student.active_curriculum && student.active_curriculum !== 0
        ? student.active_curriculum
        : student.program;

    const token2 = webtoken.sign(
      {
        id: student.student_status_id,
        person_id2: student.person_id,
        studentNumber: student.student_number,
        section: student.section_description,
        activeCurriculum: effectiveProgram,
        major: student.major,
        yearLevel: student.year_level_id,
        yearLevelDescription: student.year_level_description,
        courseCode: student.program_code,
        courseDescription: student.program_description,
        departmentName: student.dprtmnt_name,
        yearDesc: student.year_description,
        firstName: student.first_name,
        middleName: student.middle_name,
        lastName: student.last_name,
        age: student.age,
        gender: student.gender,
        email: student.emailAddress,
        program: student.program,
        profile_img: student.profile_img,
        extension: student.extension,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    console.log("Search response:", {
      token2,
      totalNstpCount,
      studentNumber: student.student_number,
      person_id2: student.person_id,
      activeCurriculum: student.active_curriculum,
      section: student.section_description,
      major: student.major,
      yearLevel: student.year_level_id,
      yearLevelDescription: student.year_level_description,
      courseCode: student.program_code,
      courseDescription: student.program_description,
      departmentName: student.dprtmnt_name,
      yearDesc: student.year_description,
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      age: student.age,
      gender: student.gender,
      email: student.emailAddress,
      program: student.program,
      profile_img: student.profile_img,
      extension: student.extension,
    });

    res.json({
      message: "Search successful",
      token2,
      isEnrolled,
      totalLecFee,
      totalLabFee,
      totalFees,
      totalComputerLab,
      totalLaboratory,
      totalNstpCount,
      studentNumber: student.student_number,
      person_id2: student.person_id,
      section: student.section_description,
      activeCurriculum: effectiveProgram,
      major: student.major,
      yearLevel: student.year_level_id,
      yearLevelDescription: student.year_level_description,
      courseCode: student.program_code,
      courseDescription: student.program_description,
      departmentName: student.dprtmnt_name,
      yearDesc: student.year_description,
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      age: student.age,
      gender: student.gender,
      email: student.emailAddress,
      program: student.program,
      profile_img: student.profile_img,
      extension: student.extension,
    });
  } catch (err) {
    console.error("SQL error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

app.post("/student-tagging/dprtmnt", async (req, res) => {
  const { studentNumber, dprtmntId } = req.body;

  if (!studentNumber || !dprtmntId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const sql = `
      SELECT DISTINCT
        IFNULL(ss.id, "") AS student_status_id ,
        sn.student_number,
        ptbl.person_id,
        ptbl.first_name,
        ptbl.last_name,
        ptbl.middle_name,
        ptbl.age,
        ptbl.gender,
        ptbl.emailAddress,
        ptbl.program,
        ptbl.profile_img,
        ptbl.extension,
        ss.active_curriculum,
        pt.program_id,
        pt.major,
        pt.program_description,
        pt.program_code,
        yt.year_id,
        yt.year_description,
        es.status AS enrolled_status,
        es.department_section_id,
        st.description AS section_description,
        dt.dprtmnt_name,
        ylt.year_level_id,
        ylt.year_level_description,
        ss.active_school_year_id,
        sy.semester_id
    FROM student_numbering_table AS sn
    LEFT JOIN student_status_table AS ss ON sn.student_number = ss.student_number
    LEFT JOIN person_table AS ptbl ON sn.person_id = ptbl.person_id
    LEFT JOIN curriculum_table AS c ON ss.active_curriculum = c.curriculum_id
    LEFT JOIN program_table AS pt ON c.program_id = pt.program_id
    LEFT JOIN year_table AS yt ON c.year_id = yt.year_id
    LEFT JOIN enrolled_subject AS es ON ss.student_number = es.student_number
    LEFT JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
    LEFT JOIN section_table AS st ON dst.section_id = st.id
    LEFT JOIN dprtmnt_curriculum_table AS dct ON c.curriculum_id = dct.curriculum_id
    LEFT JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
    LEFT JOIN year_level_table AS ylt ON ss.year_level_id = ylt.year_level_id
    LEFT JOIN active_school_year_table AS sy ON ss.active_school_year_id = sy.id
    WHERE sn.student_number = ? AND dt.dprtmnt_id = ? AND (
        ss.active_school_year_id = 0
        OR sy.astatus = 1
      );
    `;

    const [results] = await db3.query(sql, [studentNumber, dprtmntId]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid Student Number" });
    }

    const student = results[0];

    const feeSql = `
      SELECT
        COALESCE(SUM(lec_fee), 0) AS total_lec_fee,
        COALESCE(SUM(lab_fee), 0) AS total_lab_fee,
        COALESCE(SUM(total_nstp), 0) AS total_nstp,
        COALESCE(SUM(total_computer_lab), 0) AS total_computer_lab,
        COALESCE(SUM(total_laboratory), 0) AS total_laboratory
      FROM (
        SELECT
          course_id,
          MAX(lec_fee) AS lec_fee,
          MAX(lab_fee) AS lab_fee,
          MAX(is_nstp = 1) AS total_nstp,
          MAX(iscomputer_lab = 1) AS total_computer_lab,
          MAX(islaboratory_fee = 1) AS total_laboratory
        FROM program_tagging_table
        WHERE curriculum_id = ?
          AND year_level_id = ?
          AND semester_id = ?
        GROUP BY course_id
      ) fees;

    `;

    const [feeResult] = await db3.query(feeSql, [
      student.active_curriculum,
      student.year_level_id,
      student.semester_id,
    ]);

    const totalLecFee = Number(feeResult[0]?.total_lec_fee || 0);
    const totalLabFee = Number(feeResult[0]?.total_lab_fee || 0);
    const totalFees = totalLecFee + totalLabFee;
    const totalNstpCount = Number(feeResult[0]?.total_nstp || 0);
    const totalComputerLab = Number(feeResult[0]?.total_computer_lab || 0);
    const totalLaboratory = Number(feeResult[0]?.total_laboratory || 0);
    const isEnrolled = student.enrolled_status === 1;

    const effectiveProgram =
      student.active_curriculum && student.active_curriculum !== 0
        ? student.active_curriculum
        : student.program;

    const token2 = webtoken.sign(
      {
        id: student.student_status_id,
        person_id2: student.person_id,
        studentNumber: student.student_number,
        section: student.section_description,
        activeCurriculum: effectiveProgram,
        major: student.major,
        yearLevel: student.year_level_id,
        yearLevelDescription: student.year_level_description,
        courseCode: student.program_code,
        courseDescription: student.program_description,
        departmentName: student.dprtmnt_name,
        yearDesc: student.year_description,
        firstName: student.first_name,
        middleName: student.middle_name,
        lastName: student.last_name,
        age: student.age,
        gender: student.gender,
        email: student.emailAddress,
        program: student.program,
        profile_img: student.profile_img,
        extension: student.extension,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    console.log("Search response:", {
      token2,
      totalNstpCount,
      studentNumber: student.student_number,
      person_id2: student.person_id,
      activeCurriculum: student.active_curriculum,
      section: student.section_description,
      major: student.major,
      yearLevel: student.year_level_id,
      yearLevelDescription: student.year_level_description,
      courseCode: student.program_code,
      courseDescription: student.program_description,
      departmentName: student.dprtmnt_name,
      yearDesc: student.year_description,
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      age: student.age,
      gender: student.gender,
      email: student.emailAddress,
      program: student.program,
      profile_img: student.profile_img,
      extension: student.extension,
    });

    res.json({
      message: "Search successful",
      token2,
      isEnrolled,
      totalLecFee,
      totalLabFee,
      totalFees,
      totalComputerLab,
      totalLaboratory,
      totalNstpCount,
      studentNumber: student.student_number,
      person_id2: student.person_id,
      section: student.section_description,
      activeCurriculum: effectiveProgram,
      major: student.major,
      yearLevel: student.year_level_id,
      yearLevelDescription: student.year_level_description,
      courseCode: student.program_code,
      courseDescription: student.program_description,
      departmentName: student.dprtmnt_name,
      yearDesc: student.year_description,
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      age: student.age,
      gender: student.gender,
      email: student.emailAddress,
      program: student.program,
      profile_img: student.profile_img,
      extension: student.extension,
    });
  } catch (err) {
    console.error("SQL error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

app.post("/student-tagging-batch", async (req, res) => {
  const { studentNumbers } = req.body;
  console.log("Student Numbers", studentNumbers);

  if (!studentNumbers || !Array.isArray(studentNumbers) || studentNumbers.length === 0) {
    return res.status(400).json({ message: "Student numbers are required" });
  }

  try {
    // SQL: WHERE sn.student_number IN (?, ?, ?)
    const placeholders = studentNumbers.map(() => "?").join(",");
    const sql = `
      SELECT DISTINCT
        IFNULL(ss.id, "") AS student_status_id,
        sn.student_number,
        ptbl.person_id,
        ptbl.first_name,
        ptbl.last_name,
        ptbl.middle_name,
        ptbl.age,
        ptbl.gender,
        ptbl.emailAddress,
        ptbl.program,
        ptbl.profile_img,
        ptbl.extension,
        ss.active_curriculum,
        pt.program_id,
        pt.major,
        pt.program_description,
        pt.program_code,
        yt.year_id,
        yt.year_description,
        es.status AS enrolled_status,
        es.department_section_id,
        st.description AS section_description,
        dt.dprtmnt_name,
        ylt.year_level_id,
        ylt.year_level_description,
        ss.active_school_year_id,
        sy.semester_id
      FROM student_numbering_table AS sn
      LEFT JOIN student_status_table AS ss ON sn.student_number = ss.student_number
      LEFT JOIN person_table AS ptbl ON sn.person_id = ptbl.person_id
      LEFT JOIN curriculum_table AS c ON ss.active_curriculum = c.curriculum_id
      LEFT JOIN program_table AS pt ON c.program_id = pt.program_id
      LEFT JOIN year_table AS yt ON c.year_id = yt.year_id
      LEFT JOIN enrolled_subject AS es ON ss.student_number = es.student_number
      LEFT JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      LEFT JOIN section_table AS st ON dst.section_id = st.id
      LEFT JOIN dprtmnt_curriculum_table AS dct ON c.curriculum_id = dct.curriculum_id
      LEFT JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
      LEFT JOIN year_level_table AS ylt ON ss.year_level_id = ylt.year_level_id
      LEFT JOIN active_school_year_table AS sy ON ss.active_school_year_id = sy.id
      WHERE sn.student_number IN (${placeholders})
        AND (ss.active_school_year_id = 0 OR sy.astatus = 1);
    `;

    const [results] = await db3.query(sql, studentNumbers);

    if (!results.length) {
      return res.status(400).json({ message: "No valid student numbers found" });
    }


    const studentsWithFees = await Promise.all(
      results.map(async (student) => {
        const feeSql = `
          SELECT
            COALESCE(SUM(lec_fee), 0) AS total_lec_fee,
            COALESCE(SUM(lab_fee), 0) AS total_lab_fee,
            COALESCE(SUM(total_nstp), 0) AS total_nstp,
            COALESCE(SUM(total_computer_lab), 0) AS total_computer_lab,
            COALESCE(SUM(total_laboratory), 0) AS total_laboratory
          FROM (
            SELECT
              course_id,
              MAX(lec_fee) AS lec_fee,
              MAX(lab_fee) AS lab_fee,
              MAX(is_nstp = 1) AS total_nstp,
              MAX(iscomputer_lab = 1) AS total_computer_lab,
              MAX(islaboratory_fee = 1) AS total_laboratory
            FROM program_tagging_table
            WHERE curriculum_id = ?
              AND year_level_id = ?
              AND semester_id = ?
            GROUP BY course_id
          ) fees;
        `;
        const [feeResult] = await db3.query(feeSql, [
          student.active_curriculum,
          student.year_level_id,
          student.semester_id,
        ]);

        const totalLecFee = Number(feeResult[0]?.total_lec_fee || 0);
        const totalLabFee = Number(feeResult[0]?.total_lab_fee || 0);
        const totalNstpCount = Number(feeResult[0]?.total_nstp || 0);
        const totalComputerLab = Number(feeResult[0]?.total_computer_lab || 0);
        const totalLaboratory = Number(feeResult[0]?.total_laboratory || 0);

        const token2 = webtoken.sign(
          {
            id: student.student_status_id,
            person_id2: student.person_id,
            studentNumber: student.student_number,
            firstName: student.first_name,
            middleName: student.middle_name,
            lastName: student.last_name,
          },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        return {
          ...student,
          totalLecFee,
          totalLabFee,
          totalNstpCount,
          totalComputerLab,
          totalLaboratory,
          token2,
        };
      })
    );

    res.json({
      message: "Search successful",
      students: studentsWithFees,
    });
  } catch (err) {
    console.error("SQL error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});


app.get("/enrolled_courses/:userId/:currId", async (req, res) => {
  const { userId, currId } = req.params;

  try {
    // Step 1: Get the active_school_year_id
    const activeYearSql = `SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;

    const sql = `
      SELECT
        es.id,
        es.course_id,
        c.course_code,
        c.course_description,
        st.description,
        c.course_unit,
        c.lab_unit,
        c.lec_unit,
        ds.id AS department_section_id,
        IFNULL(pt.program_code, 'NOT') AS program_code,
        IFNULL(pt.program_description, 'CURRENTLY') AS program_description,
        IFNULL(st.description, 'ENROLLED') AS section,
        IFNULL(rd.description, 'TBA') AS day_description,
        IFNULL(tt.school_time_start, 'TBA') AS school_time_start,
        IFNULL(tt.school_time_end, 'TBA') AS school_time_end,
        IFNULL(rtbl.room_description, 'TBA') AS room_description,
        IFNULL(prof_table.lname, 'TBA') AS lname,
        (
          SELECT COUNT(*)
          FROM enrolled_subject es2
          WHERE es2.active_school_year_id = es.active_school_year_id
            AND es2.department_section_id = es.department_section_id
            AND es2.course_id = es.course_id
        ) AS number_of_enrolled

      FROM enrolled_subject AS es
      LEFT JOIN course_table AS c
        ON c.course_id = es.course_id
      LEFT JOIN dprtmnt_section_table AS ds
        ON ds.id = es.department_section_id
      LEFT JOIN section_table AS st
        ON st.id = ds.section_id
      LEFT JOIN curriculum_table AS cr
        ON cr.curriculum_id = ds.curriculum_id
      LEFT JOIN program_table AS pt
        ON pt.program_id = cr.program_id
      LEFT JOIN time_table AS tt
        ON tt.school_year_id = es.active_school_year_id
        AND tt.department_section_id = es.department_section_id
        AND tt.course_id = es.course_id
      LEFT JOIN room_day_table AS rd
        ON rd.id = tt.room_day
      LEFT JOIN dprtmnt_room_table as dr
        ON dr.dprtmnt_room_id = tt.department_room_id
      LEFT JOIN room_table as rtbl
        ON rtbl.room_id = dr.room_id
      LEFT JOIN prof_table
        ON prof_table.prof_id = tt.professor_id
      WHERE es.student_number = ?
        AND es.active_school_year_id = ?
        AND es.curriculum_id = ?
      ORDER BY c.course_id ASC;
    `;

    const [result] = await db3.query(sql, [userId, activeSchoolYearId, currId]);
    res.json(result);
  } catch (err) {
    console.error("Error in /enrolled_courses:", err);
    return res.status(500).json({ error: err.message });
  }
});

let lastSeenId = 0;

// GET /api/proctor-applicants
app.get("/api/proctor-applicants", async (req, res) => {
  const { query, schedule_id } = req.query;

  try {
    // Use db (admission) instead of db3 (enrollment)
    const [schedules] = await db.query(
      `SELECT * FROM entrance_exam_schedule
       WHERE proctor LIKE ? ${schedule_id ? "AND schedule_id = ?" : ""}`,
      schedule_id ? [`%${query}%`, schedule_id] : [`%${query}%`],
    );

    if (schedules.length === 0) return res.json([]);

    const results = await Promise.all(
      schedules.map(async (schedule) => {
        const [applicants] = await db.query(
          `SELECT ea.applicant_id, ea.schedule_id, ea.email_sent, ant.applicant_number,
                  pt.last_name, pt.first_name, pt.middle_name, pt.program,
                  s.building_description, s.room_description
           FROM exam_applicants ea
           JOIN applicant_numbering_table ant ON ant.applicant_number = ea.applicant_id
           JOIN person_table pt ON pt.person_id = ant.person_id
           JOIN entrance_exam_schedule s ON s.schedule_id = ea.schedule_id
           WHERE ea.schedule_id = ?`,
          [schedule.schedule_id],
        );

        return { schedule, applicants };
      }),
    );

    res.json(results);
  } catch (err) {
    console.error("Error fetching proctor applicants:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Updates year_level_id for a student
app.put("/api/update-student-year", async (req, res) => {
  const { student_number, year_level_id } = req.body;

  if (!student_number || !year_level_id) {
    return res
      .status(400)
      .json({ error: "Missing student_number or year_level_id" });
  }

  try {
    const sql = `UPDATE student_status_table SET year_level_id = ? WHERE student_number = ?`;
    const [result] = await db3.query(sql, [year_level_id, student_number]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Year level updated successfully" });
  } catch (err) {
    console.error("Error updating year level:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// (UPDATED!)
app.get("/check-new", async (req, res) => {
  try {
    const [results] = await db3.query(
      "SELECT * FROM enrolled_subject ORDER BY id DESC LIMIT 1",
    );

    if (results.length > 0) {
      const latest = results[0];
      const isNew = latest.id > lastSeenId;
      if (isNew) {
        lastSeenId = latest.id;
      }
      res.json({ newData: isNew, data: latest });
    } else {
      res.json({ newData: false });
    }
  } catch (err) {
    return res.status(500).json({ error: err });
  }
});

// (UPDATED!)
app.get("/api/department-sections", async (req, res) => {
  const { departmentId } = req.query;

  const query = `
    SELECT
      dt.dprtmnt_id,
      dt.dprtmnt_name,
      dt.dprtmnt_code,
      c.year_id,
      c.program_id,
      c.curriculum_id,
      ds.id as department_and_program_section_id,
      ds.section_id,
      pt.program_description,
      pt.program_code,
      pt.major,
      st.description
      FROM dprtmnt_table as dt
        INNER JOIN dprtmnt_curriculum_table as dc ON dc.dprtmnt_id  = dt.dprtmnt_id
        INNER JOIN curriculum_table as c ON c.curriculum_id = dc.curriculum_id
        INNER JOIN dprtmnt_section_table as ds ON ds.curriculum_id = c.curriculum_id
        INNER JOIN program_table as pt ON c.program_id = pt.program_id
        INNER JOIN section_table as st ON st.id = ds.section_id
      WHERE dt.dprtmnt_id = ?
    ORDER BY ds.id
  `;

  try {
    const [results] = await db3.query(query, [departmentId]);
    res.status(200).json(results);
    console.log(results);
  } catch (err) {
    console.error("Error fetching department sections:", err);
    return res
      .status(500)
      .json({ error: "Database error", details: err.message });
  }
});

app.get("/api/slot-monitoring-sections", async (req, res) => {
  const {
    departmentId,
    courseId,
    programId,
    yearId,
    semesterId,
    campus,
  } = req.query;

  if (
    !departmentId ||
    !courseId ||
    !programId ||
    !yearId ||
    !semesterId ||
    !campus
  ) {
    return res.status(400).json({
      error:
        "departmentId, courseId, programId, yearId, semesterId, and campus are required",
    });
  }

  const query = `
    SELECT
      dst.id AS department_section_id,
      ct.curriculum_id,
      pt.program_code,
      pt.program_description,
      st.description AS section_description,
      cst.course_code,
      GROUP_CONCAT(
        DISTINCT CONCAT(
          TIME_FORMAT(tt.school_time_start, '%h:%i %p'),
          ' - ',
          TIME_FORMAT(tt.school_time_end, '%h:%i %p')
        )
        ORDER BY tt.school_time_start
        SEPARATOR ', '
      ) AS schedule,
      dst.max_slots
    FROM dprtmnt_section_table dst
    INNER JOIN dprtmnt_curriculum_table dct ON dst.curriculum_id = dct.curriculum_id
    INNER JOIN section_table st ON dst.section_id = st.id
    LEFT JOIN time_table tt ON dst.id = tt.department_section_id
    INNER JOIN curriculum_table ct ON dct.curriculum_id = ct.curriculum_id
    INNER JOIN program_table pt ON ct.program_id = pt.program_id
    LEFT JOIN active_school_year_table sy ON tt.school_year_id = sy.id
    LEFT JOIN course_table cst ON tt.course_id = cst.course_id
    WHERE dct.dprtmnt_id = ?
      AND tt.course_id = ?
      AND pt.program_id = ?
      AND sy.year_id = ?
      AND sy.semester_id = ?
      AND pt.components = ?
    GROUP BY dst.id, ct.curriculum_id, pt.program_code, pt.program_description, st.description, cst.course_code, dst.max_slots
    ORDER BY st.description ASC
  `;

  try {
    const [rows] = await db3.query(query, [
      departmentId,
      courseId,
      programId,
      yearId,
      semesterId,
      campus,
    ]);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching slot monitoring sections:", err);
    return res.status(500).json({
      error: "Database error",
      details: err.message,
    });
  }
});

app.post("/api/slot-monitoring-enrolled-count", async (req, res) => {
  const { curriculumId, sectionIds, activeSchoolYearId, courseId } = req.body;

  if (!curriculumId || !activeSchoolYearId || !courseId) {
    return res.status(400).json({
      error: "curriculumId, activeSchoolYearId, and courseId are required",
    });
  }

  if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
    return res.status(200).json([]);
  }

  const sectionPlaceholders = sectionIds.map(() => "?").join(", ");

  const query = `
    SELECT
      es.department_section_id,
      COUNT(es.student_number) AS enrolled_student
    FROM enrolled_subject es
    INNER JOIN dprtmnt_section_table dst ON es.department_section_id = dst.id
    INNER JOIN active_school_year_table sy ON es.active_school_year_id = sy.id
    WHERE es.curriculum_id = ?
      AND es.department_section_id IN (${sectionPlaceholders})
      AND es.active_school_year_id = ?
      AND es.course_id = ?
    GROUP BY es.department_section_id
  `;

  try {
    const params = [curriculumId, ...sectionIds, activeSchoolYearId, courseId];
    const [rows] = await db3.query(query, params);
    console.log("Enrolled counts:", rows);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching slot monitoring enrolled counts:", err);
    return res.status(500).json({
      error: "Database error",
      details: err.message,
    });
  }
});

app.put(
  "/api/slot-monitoring-sections/:departmentSectionId/max-slots",
  async (req, res) => {
    const { departmentSectionId } = req.params;
    const { max_slots } = req.body;

    const parsedSlots = Number(max_slots);

    if (!departmentSectionId || Number.isNaN(parsedSlots) || parsedSlots < 0) {
      return res.status(400).json({
        error:
          "departmentSectionId is required and max_slots must be a non-negative number",
      });
    }

    try {
      const [result] = await db3.query(
        "UPDATE dprtmnt_section_table SET max_slots = ? WHERE id = ?",
        [parsedSlots, departmentSectionId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Department section not found" });
      }

      return res.status(200).json({ message: "Max slots updated successfully" });
    } catch (err) {
      console.error("Error updating slot monitoring max slots:", err);
      return res.status(500).json({
        error: "Database error",
        details: err.message,
      });
    }
  },
);

app.put("/api/update-active-curriculum", async (req, res) => {
  const { studentId, departmentSectionId } = req.body;

  if (!studentId || !departmentSectionId) {
    return res
      .status(400)
      .json({ error: "studentId and departmentSectionId are required" });
  }

  const fetchCurriculumQuery = `
    SELECT curriculum_id
    FROM dprtmnt_section_table
    WHERE id = ?
  `;

  try {
    const [curriculumResult] = await db3.query(fetchCurriculumQuery, [
      departmentSectionId,
    ]);

    if (curriculumResult.length === 0) {
      return res.status(404).json({ error: "Section not found" });
    }

    const curriculumId = curriculumResult[0].curriculum_id;

    const updateQuery = `
      UPDATE student_status_table
      SET active_curriculum = ?
      WHERE student_number = ?
    `;
    const result = await db3.query(updateQuery, [curriculumId, studentId]);
    const data = result[0];
    console.log(data);
    res.status(200).json({
      message: "Active curriculum updated successfully",
    });
  } catch (err) {
    console.error("Error updating active curriculum:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

app.get("/api/search-student/:sectionId", async (req, res) => {
  const { sectionId } = req.params;
  console.log("Section Id : ", sectionId);

  try {
    // 1️⃣ Get curriculum + program
    const [programResult] = await db3.query(
      `
      SELECT
        dst.curriculum_id,
        pt.program_description,
        pt.program_code
      FROM dprtmnt_section_table dst
      INNER JOIN curriculum_table ct ON dst.curriculum_id = ct.curriculum_id
      INNER JOIN program_table pt ON ct.program_id = pt.program_id
      WHERE dst.id = ?
      `,
      [sectionId],
    );

    if (!programResult.length) {
      return res.status(404).json({ message: "Section not found" });
    }

    const { curriculum_id } = programResult[0];

    // 2️⃣ Get ALL COURSES under curriculum (WITH MULTIPLE PREREQ)
    const [courses] = await db3.query(
      `
  SELECT
    c.course_id,
    c.course_code,
    c.course_description,
    c.course_unit,
    c.lab_unit,
    c.prereq,
    c.corequisite
  FROM curriculum_table ct
  INNER JOIN program_tagging_table ptt ON ct.curriculum_id = ptt.curriculum_id
  INNER JOIN program_table pt ON ct.program_id = pt.program_id
  INNER JOIN course_table c ON ptt.course_id = c.course_id
  WHERE ct.curriculum_id = ?
  ORDER BY c.course_code
  `,
      [curriculum_id],
    );

    // 3️⃣ Normalize prereq (STRING ➜ ARRAY)
    const formattedCourses = courses.map((c) => ({
      ...c,
      prereq_list: c.prereq ? c.prereq.split(",").map((p) => p.trim()) : [],
    }));

    // 4️⃣ FINAL RESPONSE
    res.status(200).json({
      ...programResult[0],
      courses: formattedCourses,
    });
  } catch (err) {
    console.error("Error fetching course tagging data:", err);
    res.status(500).json({
      error: "Database error",
      details: err.message,
    });
  }
});

// Express route (UPDATED!)
app.get("/departments", async (req, res) => {
  const sql = "SELECT dprtmnt_id, dprtmnt_code FROM dprtmnt_table";

  try {
    const [result] = await db3.query(sql);
    res.json(result);
  } catch (err) {
    console.error("Error fetching departments:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Count how many students enrolled per subject for a selected section (UPDATED!)
app.get("/subject-enrollment-count", async (req, res) => {
  const { sectionId } = req.query; // department_section_id

  try {
    const activeYearSql = `SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;

    const sql = `
      SELECT
        es.course_id,
        COUNT(*) AS enrolled_count
      FROM enrolled_subject AS es
      WHERE es.active_school_year_id = ?
        AND es.department_section_id = ?
      GROUP BY es.course_id
    `;

    const [result] = await db3.query(sql, [activeSchoolYearId, sectionId]);
    res.json(result); // [{ course_id: 1, enrolled_count: 25 }, { course_id: 2, enrolled_count: 30 }]
  } catch (err) {
    console.error("Error fetching enrolled counts:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Get user by person_id (UPDATED!)
app.get("/api/user/:person_id", async (req, res) => {
  const { person_id } = req.params;

  try {
    const sql = "SELECT profile_img FROM person_table WHERE person_id = ?";
    const [results] = await db3.query(sql, [person_id]);

    if (results.length === 0) {
      return res.status(404).send("User not found");
    }

    res.json(results[0]);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).send("Database error");
  }
});

// GET GRADING PERIOD (UPDATED!)
app.get("/get-grading-period", async (req, res) => {
  try {
    const sql = "SELECT * FROM period_status";
    const [result] = await db3.query(sql);

    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).send("Error fetching data");
  }
});

// ACTIVATOR API OF GRADING PERIOD (UPDATED!)
app.post("/grade_period_activate/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const sql1 = "UPDATE period_status SET status = 0";
    await db3.query(sql1);

    const sql2 = "UPDATE period_status SET status = 1 WHERE id = ?";
    await db3.query(sql2, [id]);

    res.status(200).json({ message: "Grading period activated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to activate grading period" });
  }
});

app.get("/designation_list", async (req, res) => {
  const query = "SELECT * FROM course_table WHERE office_duty = 1;";

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({
      error: "Query failed",
      details: err.message,
    });
  }
});

// UPDATE()
app.get(
  "/handle_section_of/:userID/:selectedCourse/:selectedActiveSchoolYear",
  async (req, res) => {
    const { userID, selectedCourse, selectedActiveSchoolYear } = req.params;

    try {
      const sql = `
    SELECT tt.department_section_id, ptbl.program_code, st.description AS section_description FROM time_table AS tt
      INNER JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
      INNER JOIN dprtmnt_section_table AS dst ON tt.department_section_id = dst.id
      INNER JOIN curriculum_table AS ct ON dst.curriculum_id = ct.curriculum_id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN program_table AS ptbl ON ct.program_id = ptbl.program_id
      INNER JOIN active_school_year_table AS sy ON tt.school_year_id = sy.id
      INNER JOIN year_table AS yt ON sy.year_id = yt.year_id
    WHERE pt.person_id = ? AND tt.course_id = ? AND sy.id = ? GROUP BY tt.department_section_id
    ORDER BY section_description
    `;
      const [result] = await db3.query(sql, [
        userID,
        selectedCourse,
        selectedActiveSchoolYear,
      ]);
      res.json(result);
    } catch (err) {
      console.error("Server Error: ", err);
      res.status(500).send({ message: "Internal Error", err });
    }
  },
);

// UPDATE ()
app.get("/course_assigned_to/:userID", async (req, res) => {
  const { userID } = req.params;

  try {
    const sql = `
    SELECT DISTINCT tt.course_id, ct.course_description, ct.course_code, yt.year_id, st.semester_id FROM time_table AS tt
      INNER JOIN course_table AS ct ON tt.course_id = ct.course_id
      INNER JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
      INNER JOIN active_school_year_table AS sy ON tt.school_year_id = sy.id
      INNER JOIN year_table AS yt ON sy.year_id = yt.year_id
      INNER JOIN semester_table AS st ON sy.semester_id = st.semester_id
    WHERE pt.person_id = ? AND ct.office_duty = 0 AND sy.astatus = 1
    `;
    const [result] = await db3.query(sql, [userID]);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

// UPDATE ()
app.get(
  "/course_assigned_to/:userID/:selectedSchoolYear/:selectedSchoolSemester",
  async (req, res) => {
    const { userID, selectedSchoolYear, selectedSchoolSemester } = req.params;

    try {
      const sql = `
    SELECT DISTINCT tt.course_id, ct.course_description, ct.course_code, yt.year_id, st.semester_id FROM time_table AS tt
      INNER JOIN course_table AS ct ON tt.course_id = ct.course_id
      INNER JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
      INNER JOIN active_school_year_table AS sy ON tt.school_year_id = sy.id
      INNER JOIN year_table AS yt ON sy.year_id = yt.year_id
      INNER JOIN semester_table AS st ON sy.semester_id = st.semester_id
    WHERE pt.person_id = ? AND ct.office_duty = 0 AND sy.year_id = ? AND sy.semester_id = ?
    `;
      const [result] = await db3.query(sql, [
        userID,
        selectedSchoolYear,
        selectedSchoolSemester,
      ]);
      res.json(result);
    } catch (err) {
      console.error("Server Error: ", err);
      res.status(500).send({ message: "Internal Error", err });
    }
  },
);


app.get("/get_school_year", async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        year_id,
        year_description AS current_year,
        year_description + 1 AS next_year
      FROM year_table ORDER BY current_year;
    `;
    const [result] = await db3.query(query);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get("/get_school_semester", async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        semester_id,semester_description, semester_code
      FROM semester_table ORDER BY semester_code;
    `;
    const [result] = await db3.query(query);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get("/active_school_year", async (req, res) => {
  try {
    const query = `
    SELECT
    asyt.id AS school_year_id,
    yt.year_id,
    st.semester_id,
    yt.year_description AS current_year,
    yt.year_description + 1 AS next_year,
    st.semester_description
  FROM active_school_year_table AS asyt
    INNER JOIN year_table AS yt ON asyt.year_id = yt.year_id
    INNER JOIN semester_table AS st ON asyt.semester_id = st.semester_id
  WHERE asyt.astatus = 1
    `;
    const [result] = await db3.query(query);
    res.json(result);
    console.log(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get(
  "/get_selecterd_year/:selectedSchoolYear/:selectedSchoolSemester",
  async (req, res) => {
    const { selectedSchoolYear, selectedSchoolSemester } = req.params;
    try {
      const query = `
    SELECT
    asyt.id AS school_year_id
  FROM active_school_year_table AS asyt
    INNER JOIN year_table AS yt ON asyt.year_id = yt.year_id
    INNER JOIN semester_table AS st ON asyt.semester_id = st.semester_id
  WHERE yt.year_id = ? AND st.semester_id = ?
    `;
      const [result] = await db3.query(query, [
        selectedSchoolYear,
        selectedSchoolSemester,
      ]);
      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Server Error: ", err);
      res.status(500).send({ message: "Internal Error", err });
    }
  },
);

// UPDATED 09/06/2025

app.get(
  "/enrolled_student_list/:userID/:selectedCourse/:department_section_id/:activeSchoolYear",
  async (req, res) => {
    const { userID, selectedCourse, department_section_id, activeSchoolYear } =
      req.params;

    try {
      const [rows] = await db3.query(
        "SELECT status FROM period_status WHERE description = 'Final Grading Period'",
      );

      if (!rows.length || rows[0].status !== 1) {
        return res.status(403).json({ message: "Grades not available yet" });
      }

      const sql = `
      SELECT DISTINCT
        es.student_number,
        ptbl.last_name,
        ptbl.first_name,
        ptbl.middle_name,
        ylt.year_description,
        smt.semester_description,
        es.midterm,
        es.finals,
        es.final_grade,
        es.en_remarks,
        st.description AS section_description,
        pgt.program_code,
        dst.id,
        smt.semester_id,
        es.active_school_year_id,
        ylt.year_id,
        ylt.year_description AS current_year,
        ylt.year_description + 1 AS next_year,
        cst.course_id,
        cst.course_description,
        cst.course_code,
        cst.course_unit,
        cst.lab_unit,
        dt.dprtmnt_name
      FROM enrolled_subject AS es
        INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
        INNER JOIN person_table AS ptbl ON snt.person_id = ptbl.person_id
        INNER JOIN time_table AS tt ON es.department_section_id = tt.department_section_id
        INNER JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
        INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
        INNER JOIN section_table AS st ON dst.section_id = st.id
        INNER JOIN curriculum_table AS ct ON es.curriculum_id = ct.curriculum_id
        INNER JOIN program_table AS pgt ON ct.program_id = pgt.program_id
        INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
        INNER JOIN year_table AS ylt ON sy.year_id = ylt.year_id
        INNER JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
        INNER JOIN course_table AS cst ON  es.course_id = cst.course_id
        INNER JOIN dprtmnt_curriculum_table AS dct ON ct.curriculum_id = dct.curriculum_id
        INNER JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
      WHERE pt.person_id = ? AND es.course_id = ? AND es.department_section_id = ? AND es.active_school_year_id = ?
    `;

      const [result] = await db3.query(sql, [
        userID,
        selectedCourse,
        department_section_id,
        activeSchoolYear,
      ]);
      res.json(result);
      console.log(result);
    } catch (err) {
      console.error("Server Error: ", err);
      res.status(500).send({ message: "Internal Error", err });
    }
  },
);

function getFormattedTimestamp() {
  const now = new Date();

  let month = now.getMonth() + 1; // Months start at 0
  let day = now.getDate();
  let year = now.getFullYear();

  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'

  // Add leading zeros
  const mm = month < 10 ? "0" + month : month;
  const dd = day < 10 ? "0" + day : day;
  const hh = hours < 10 ? "0" + hours : hours;
  const min = minutes < 10 ? "0" + minutes : minutes;
  const ss = seconds < 10 ? "0" + seconds : seconds;

  return `${mm}/${dd}/${year} ${hh}:${min}:${ss} ${ampm}`;
}

app.put("/add_grades", async (req, res) => {
  const {
    midterm,
    finals,
    final_grade,
    en_remarks,
    student_number,
    subject_id,
  } = req.body;
  console.log("Received data:", {
    midterm,
    finals,
    final_grade,
    en_remarks,
    student_number,
    subject_id,
  });

  try {
    const [rows] = await db3.execute(
      `SELECT id, description, status FROM period_status WHERE id = 3`,
    );
    if (!rows.length || rows[0].status !== 1) {
      return res
        .status(400)
        .json({ message: "The uploading of grades is still not open." });
    }

    const isIncomplete =
      String(midterm).toLowerCase() === "inc" ||
      String(midterm).toLowerCase() === "incomplete" ||
      String(finals).toLowerCase() === "inc" ||
      String(finals).toLowerCase() === "incomplete";

    if (isIncomplete) {
      const [result] = await db3.execute(
        `UPDATE enrolled_subject
        SET midterm = ?, finals = ? , final_grade= "0.00", grades_status = 'INC', en_remarks = 3
        WHERE student_number = ? AND course_id = ?`,
        [midterm, finals, student_number, subject_id],
      );

      return result.affectedRows > 0
        ? res
          .status(200)
          .json({ message: "Grades marked as INC successfully!" })
        : res
          .status(404)
          .json({ message: "No matching record found to update." });
    }

    const [result] = await db3.execute(
      `UPDATE enrolled_subject
      SET midterm = ?, finals = ?, final_grade = ?, grades_status = ?, en_remarks = ?
      WHERE student_number = ? AND course_id = ?`,
      [
        midterm,
        finals,
        final_grade,
        final_grade,
        en_remarks,
        student_number,
        subject_id,
      ],
    );

    return result.affectedRows > 0
      ? res.status(200).json({ message: "Grades updated successfully!" })
      : res
        .status(404)
        .json({ message: "No matching record found to update." });
  } catch (err) {
    console.error("Failed to update grades:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// API ROOM SCHEDULE
app.get("/get_room/:profID/:roomID", async (req, res) => {
  const { profID, roomID } = req.params;

  const query = `
    SELECT
      t.room_day,
      d.description as day,
      t.school_time_start AS start_time,
      t.school_time_end AS end_time,
      rt.room_description
    FROM time_table t
    JOIN room_day_table d ON d.id = t.room_day
    INNER JOIN dprtmnt_room_table drt ON drt.dprtmnt_room_id = t.department_room_id
    INNER JOIN room_table rt ON rt.room_id = drt.room_id
    INNER JOIN active_school_year_table asy ON t.school_year_id = asy.id
    WHERE t.professor_id = ? AND t.department_room_id = ? AND asy.astatus = 1
  `;
  try {
    const [result] = await db3.query(query, [profID, roomID]);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "ERROR:", error });
  }
});

app.delete("/upload/:id", async (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM requirement_uploads WHERE upload_id = ?";

  try {
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Requirement not found" });
    }

    res.status(200).json({ message: "Requirement deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete requirement" });
  }
});

app.get("/api/professor-schedule/:profId", async (req, res) => {
  const profId = req.params.profId;

  try {
    const [results] = await db3.execute(
      `
      SELECT
        t.room_day,
        d.description as day_description,
        t.school_time_start AS school_time_start,
        t.school_time_end AS school_time_end,
        pgt.program_code,
        st.description AS section_description,
        rt.room_description,
        cst.course_code,
        cst.course_id,
        t.department_section_id,
        st.id as section_id,
        t.school_year_id
      FROM time_table t
      LEFT JOIN room_day_table d ON d.id = t.room_day
      LEFT JOIN active_school_year_table asy ON t.school_year_id = asy.id
      LEFT JOIN dprtmnt_section_table AS dst ON t.department_section_id = dst.id
      LEFT JOIN section_table AS st ON dst.section_id = st.id
      LEFT JOIN curriculum_table AS cct ON dst.curriculum_id = cct.curriculum_id
      LEFT JOIN program_table AS pgt ON cct.program_id = pgt.program_id
      LEFT JOIN room_table AS rt ON t.department_room_id = rt.room_id
      LEFT JOIN course_table AS cst ON t.course_id = cst.course_id
      WHERE t.professor_id = ? AND asy.astatus = 1;
    `,
      [profId],
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  }
});

app.get("/api/student-dashboard/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `SELECT snt.student_number, pt.* FROM student_numbering_table as snt
      INNER JOIN person_table as pt ON snt.person_id = pt.person_id
      WHERE snt.person_id = ?
    `;
    const [result] = await db3.query(query, [id]);
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("DB ERROR");
  }
});

app.get("/student-data/:studentNumber", async (req, res) => {
  const studentNumber = req.params.studentNumber;

  const query = `
  SELECT
      sn.student_number,
      p.person_id,
      p.profile_img,
      p.lrnNumber,
      p.cellphoneNumber,
      p.last_name,
      p.middle_name,
      p.campus,
      p.first_name,
      p.extension,
      p.gender,
      p.age,
      p.emailAddress AS email,
      ss.active_curriculum AS curriculum,
      ss.year_level_id AS yearlevel,
      prog.program_description AS program,
      prog.program_code,
      d.dprtmnt_name AS college,
      es.active_school_year_id
  FROM student_numbering_table sn
  INNER JOIN person_table p ON sn.person_id = p.person_id
  INNER JOIN student_status_table ss ON ss.student_number = sn.student_number
  INNER JOIN curriculum_table c ON ss.active_curriculum = c.curriculum_id
  INNER JOIN program_table prog ON c.program_id = prog.program_id
  INNER JOIN dprtmnt_curriculum_table dc ON c.curriculum_id = dc.curriculum_id
  INNER JOIN year_table yt ON c.year_id = yt.year_id
  INNER JOIN dprtmnt_table d ON dc.dprtmnt_id = d.dprtmnt_id
  LEFT JOIN enrolled_subject es ON sn.student_number = es.student_number
  WHERE sn.student_number = ?;
`;

  try {
    const [results] = await db3.query(query, [studentNumber]);
    res.json(results[0] || {});
  } catch (err) {
    console.error("Failed to fetch student data:", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/payment-status/:studentNumber", async (req, res) => {
  const { studentNumber } = req.params;

  try {
    const [activeRows] = await db3.query(
      "SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1",
    );
    const activeSchoolYearId = activeRows[0]?.id;

    if (!activeSchoolYearId) {
      return res.json({
        success: true,
        saved_unifast: false,
        saved_matriculation: false,
      });
    }

    const [unifastRows] = await db3.query(
      "SELECT status FROM unifast WHERE student_number = ? AND status = 1 AND active_school_year_id = ? LIMIT 1",
      [studentNumber, activeSchoolYearId],
    );
    const [matricRows] = await db3.query(
      "SELECT status FROM matriculation WHERE student_number = ? AND status = 1 AND active_school_year_id = ? LIMIT 1",
      [studentNumber, activeSchoolYearId],
    );

    res.json({
      success: true,
      saved_unifast: unifastRows.length > 0,
      saved_matriculation: matricRows.length > 0,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ message: "Server error while fetching status" });
  }
});

app.post("/save_to_unifast", async (req, res) => {
  const {
    campus_name,
    student_number,
    learner_reference_number,
    last_name,
    given_name,
    middle_initial,
    degree_program,
    year_level,
    sex,
    email_address,
    phone_number,
    laboratory_units,
    computer_units,
    academic_units_enrolled,
    academic_units_nstp_enrolled,
    tuition_fees,
    nstp_fees,
    athletic_fees,
    computer_fees,
    cultural_fees,
    development_fees,
    guidance_fees,
    laboratory_fees,
    library_fees,
    medical_and_dental_fees,
    registration_fees,
    school_id_fees,
    total_tosf,
    remark,
    active_school_year_id,
    status,
  } = req.body;

  try {
    const statusValue = Number.isFinite(Number(status)) ? Number(status) : 1;
    const [unifastScholarships] = await db3.query(
      `SELECT id
       FROM scholarship_type
       WHERE UPPER(TRIM(scholarship_name)) LIKE '%UNIFAST%'
         AND scholarship_status = 1
       ORDER BY id ASC
       LIMIT 1`,
    );

    const unifastScholarshipId = unifastScholarships?.[0]?.id ?? null;
    if (!unifastScholarshipId) {
      return res.status(400).json({
        message:
          "Cannot save to UNIFAST because no active scholarship type containing 'UNIFAST' was found.",
      });
    }

    const query = `
      INSERT INTO unifast (
        campus_name, student_number, learner_reference_number, last_name, given_name, middle_initial,
        degree_program, year_level, sex, email_address, phone_number, scholarship_id, laboratory_units, computer_units,
        academic_units_enrolled, academic_units_nstp_enrolled, tuition_fees, nstp_fees, athletic_fees, computer_fees,
        cultural_fees, development_fees, guidance_fees, laboratory_fees, library_fees,
        medical_and_dental_fees, registration_fees, school_id_fees, total_tosf, remark, active_school_year_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      campus_name,
      student_number,
      learner_reference_number,
      last_name,
      given_name,
      middle_initial,
      degree_program,
      year_level,
      sex,
      email_address,
      phone_number,
      unifastScholarshipId,
      laboratory_units,
      computer_units,
      academic_units_enrolled,
      academic_units_nstp_enrolled,
      tuition_fees,
      nstp_fees,
      athletic_fees,
      computer_fees,
      cultural_fees,
      development_fees,
      guidance_fees,
      laboratory_fees,
      library_fees,
      medical_and_dental_fees,
      registration_fees,
      school_id_fees,
      total_tosf,
      remark,
      active_school_year_id,
      statusValue,
    ];

    const [result] = await db3.query(query, values);
    const unifast_id = result.insertId;

    res.json({
      success: true,
      unifast_id,
      message: "Data successfully saved to UNIFAST",
    });
  } catch (error) {
    console.error("Error saving to UNIFAST:", error);
    res.status(500).json({ message: "Server error while saving data" });
  }
});

app.post("/save_to_matriculation", async (req, res) => {
  const {
    campus_name,
    student_number,
    learner_reference_number,
    last_name,
    given_name,
    middle_initial,
    degree_program,
    year_level,
    sex,
    email_address,
    phone_number,
    laboratory_units,
    computer_units,
    academic_units_enrolled,
    academic_units_nstp_enrolled,
    tuition_fees,
    nstp_fees,
    athletic_fees,
    computer_fees,
    cultural_fees,
    development_fees,
    guidance_fees,
    laboratory_fees,
    library_fees,
    medical_and_dental_fees,
    registration_fees,
    school_id_fees,
    total_misc,
    total_tosf,
    scholarship_id,
    remark,
    matriculation_remark,
    active_school_year_id,
    status,
  } = req.body;

  try {
    const statusValue = Number.isFinite(Number(status)) ? Number(status) : 1;
    const query = `
      INSERT INTO matriculation (
        campus_name, student_number, learner_reference_number, last_name, given_name, middle_initial,
        degree_program, year_level, sex, email_address, phone_number, laboratory_units, computer_units,
        academic_units_enrolled, academic_units_nstp_enrolled, tuition_fees, nstp_fees, athletic_fees, computer_fees,
        cultural_fees, development_fees, guidance_fees, laboratory_fees, library_fees,
        medical_and_dental_fees, registration_fees, school_id_fees, total_misc, total_tosf, scholarship_id, remark, matriculation_remark, active_school_year_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      campus_name,
      student_number,
      learner_reference_number,
      last_name,
      given_name,
      middle_initial,
      degree_program,
      year_level,
      sex,
      email_address,
      phone_number,
      laboratory_units,
      computer_units,
      academic_units_enrolled,
      academic_units_nstp_enrolled,
      tuition_fees,
      nstp_fees,
      athletic_fees,
      computer_fees,
      cultural_fees,
      development_fees,
      guidance_fees,
      laboratory_fees,
      library_fees,
      medical_and_dental_fees,
      registration_fees,
      school_id_fees,
      total_misc,
      total_tosf,
      scholarship_id ?? null,
      remark,
      matriculation_remark || null,
      active_school_year_id,
      statusValue,
    ];

    const [result] = await db3.query(query, values);

    const matriculation_id = result.insertId;

    res.json({
      success: true,
      matriculation_id,
      message: "Data successfully saved to MATRICULATION",
    });
  } catch (error) {
    console.error("Error saving to MATRICULATION:", error);
    res.status(500).json({ message: "Server error while saving data" });
  }
});

// EXAM API ENDPOINTS

app.post("/applicant_schedule", async (req, res) => {
  const { applicant_id, exam_id } = req.body;

  if (!applicant_id || !exam_id) {
    return res
      .status(400)
      .json({ error: "Applicant ID and Exam ID are required." });
  }

  const query = `INSERT INTO exam_applicants (applicant_id, schedule_id) VALUES (?, ?)`;

  try {
    const [result] = await db.query(query, [applicant_id, exam_id]);
    res.json({
      message: "Applicant scheduled successfully",
      insertId: result.insertId,
    });
  } catch (err) {
    console.error("Database error adding applicant to schedule:", err);
    res
      .status(500)
      .json({ error: "Database error adding applicant to schedule" });
  }
});

app.get("/get_applicant_schedule", async (req, res) => {
  const query = `
    SELECT *
    FROM person_status_table
    WHERE exam_status = 0
      AND applicant_id NOT IN (
        SELECT applicant_id
        FROM exam_applicants
      )
  `;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error("Database error fetching unscheduled applicants:", err);
    res
      .status(500)
      .json({ error: "Database error fetching unscheduled applicants" });
  }
});

app.get("/slot_count/:exam_id", async (req, res) => {
  const exam_id = req.params.exam_id;
  const sql = `SELECT COUNT(*) AS count FROM exam_applicants WHERE schedule_id = ?`;

  try {
    const [results] = await db.query(sql, [exam_id]);
    res.json({ occupied: results[0].count });
  } catch (err) {
    console.error("Database error getting slot count:", err);
    res.status(500).json({ error: "Database error getting slot count" });
  }
});

// GET person details by person_id including program and student_number
app.get("/api/person/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      `
      SELECT
        p.*,
        st.student_number,
        ct.curriculum_id,
        pt.program_description AS program
        pt.major AS major
      FROM person_table AS p
      LEFT JOIN student_numbering_table AS st ON st.person_id = p.person_id
      LEFT JOIN curriculum_table AS ct ON ct.curriculum_id = p.program
      LEFT JOIN program_table AS pt ON pt.program_id = ct.program_id
      WHERE p.person_id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json(rows[0]); // ✅ Send single merged result
  } catch (err) {
    console.error("Error fetching person details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Program Display
app.get("/class_roster/ccs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT
        dct.dprtmnt_id, dt.dprtmnt_name, dt.dprtmnt_code,
        pt.program_id, pt.program_description, pt.program_code,
        ct.curriculum_id
      FROM dprtmnt_curriculum_table as dct
      INNER JOIN dprtmnt_table as dt ON dct.dprtmnt_id = dt.dprtmnt_id
      INNER JOIN curriculum_table as ct ON dct.curriculum_id = ct.curriculum_id
      INNER JOIN program_table as pt ON ct.program_id = pt.program_id
      -- LEFT JOIN year_table as yt ON ct.year_id = yt.year_id -- optional
      WHERE dct.dprtmnt_id = ?;
    `;

    const [programRows] = await db3.execute(query, [id]);

    if (programRows.length === 0) {
      return res.json([]); // empty array instead of error
    }

    res.json(programRows);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Curriculum Section
app.get("/class_roster/:cID", async (req, res) => {
  const { cID } = req.params;
  try {
    const query = `
      SELECT ct.curriculum_id, st.description, dst.id from dprtmnt_section_table AS dst
        INNER JOIN curriculum_table AS ct ON dst.curriculum_id = ct.curriculum_id
        INNER JOIN section_table AS st ON dst.section_id = st.id
      WHERE ct.curriculum_id = ?;
    `;

    const [sectionList] = await db3.execute(query, [cID]);

    res.json(sectionList);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// prof list base dun curriculum id tsaka sa section id
app.get("/class_roster/:cID/:dstID", async (req, res) => {
  const { cID, dstID } = req.params;
  try {
    const query = `
    SELECT DISTINCT cst.course_id, pft.prof_id, tt.department_section_id, pft.fname, pft.lname, pft.mname, cst.course_description, cst.course_code, st.description AS section_description, pgt.program_code FROM time_table AS tt
      INNER JOIN dprtmnt_section_table AS dst ON tt.department_section_id = dst.id
      INNER JOIN curriculum_table AS cmt ON dst.curriculum_id = cmt.curriculum_id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN course_table AS cst ON tt.course_id = cst.course_id
      INNER JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
      INNER JOIN program_table AS pgt ON cmt.program_id = pgt.program_id
      INNER JOIN active_school_year_table AS asyt ON tt.school_year_id = asyt.id
    WHERE dst.curriculum_id = ? AND tt.department_section_id = ? AND asyt.astatus = 1
    `;
    const [profList] = await db3.execute(query, [cID, dstID]);

    console.log(profList);
    res.json(profList);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Student Information
app.get(
  "/class_roster/student_info/:cID/:dstID/:courseID/:professorID",
  async (req, res) => {
    const { cID, dstID, courseID, professorID } = req.params;
    try {
      const query = `
    SELECT DISTINCT
      es.student_number,
      pst.first_name, pst.middle_name, pst.last_name,
      pgt.program_description, pgt.program_code
    FROM enrolled_subject AS es
      INNER JOIN time_table AS tt ON es.department_section_id = tt.department_section_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN active_school_year_table AS asyt ON es.active_school_year_id = asyt.id
      INNER JOIN student_status_table AS sst ON es.student_number = sst.student_number
      INNER JOIN student_numbering_table AS snt ON sst.student_number = snt.student_number
      INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
      INNER JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
      INNER JOIN program_tagging_table AS ptt ON es.course_id = ptt.course_id
      INNER JOIN program_table AS pgt ON cct.program_id = pgt.program_id
    WHERE es.curriculum_id = ? AND es.department_section_id = ? AND asyt.astatus = 1 AND es.course_id = ? AND tt.professor_id = ? ORDER BY pst.last_name
    `;

      const [studentList] = await db3.execute(query, [
        cID,
        dstID,
        courseID,
        professorID,
      ]);
      console.log(studentList);
      res.json(studentList);
    } catch (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Internal Server Error", err });
    }
  },
);

// Class Information
app.get(
  "/class_roster/classinfo/:cID/:dstID/:courseID/:professorID",
  async (req, res) => {
    const { cID, dstID, courseID, professorID } = req.params;
    try {
      const query = `
    SELECT DISTINCT
      st.description AS section_Description,
      pft.fname, pft.mname, pft.lname, pft.prof_id,
      smt.semester_description,
      ylt.year_level_description,
      ct.course_description, ct.course_code, ct.course_unit, ct.lab_unit, ct.course_id,
      yt.year_description,
      rdt.description as day,
      tt.school_time_start,
      tt.school_time_end
    FROM enrolled_subject AS es
      INNER JOIN time_table AS tt ON es.department_section_id = tt.department_section_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN active_school_year_table AS asyt ON es.active_school_year_id = asyt.id
      INNER JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
      INNER JOIN course_table AS ct ON es.course_id = ct.course_id
      INNER JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
      INNER JOIN program_tagging_table AS ptt ON es.course_id = ptt.course_id
      INNER JOIN program_table AS pgt ON cct.program_id = pgt.program_id
      INNER JOIN year_table AS yt ON cct.year_id = yt.year_id
      INNER JOIN year_level_table AS ylt ON ptt.year_level_id = ylt.year_level_id
      INNER JOIN semester_table AS smt ON ptt.semester_id = smt.semester_id
      INNER JOIN room_day_table AS rdt ON tt.room_day = rdt.id
    WHERE es.curriculum_id = ? AND es.department_section_id = ? AND asyt.astatus = 1 AND es.course_id = ? AND tt.professor_id = ?
    `;

      const [class_data] = await db3.execute(query, [
        cID,
        dstID,
        courseID,
        professorID,
      ]);
      console.log(class_data);
      res.json(class_data);
    } catch (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Internal Server Error", err });
    }
  },
);

app.get(
  "/statistics/student_count/department/:dprtmnt_id",
  async (req, res) => {
    const { dprtmnt_id } = req.params;

    try {
      const query = `
      SELECT COUNT(DISTINCT es.student_number) AS student_count
      FROM enrolled_subject AS es
      INNER JOIN curriculum_table AS ct ON es.curriculum_id = ct.curriculum_id
      INNER JOIN dprtmnt_curriculum_table AS dct ON ct.curriculum_id = dct.curriculum_id
      INNER JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
      INNER JOIN active_school_year_table AS asyt ON es.active_school_year_id = asyt.id
      INNER JOIN student_status_table AS sst ON es.student_number = sst.student_number
      INNER JOIN student_numbering_table AS snt ON sst.student_number = snt.student_number
      INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
      WHERE dt.dprtmnt_id = ?
        AND asyt.astatus = 1
        AND sst.enrolled_status = 1
    `;

      const [rows] = await db3.execute(query, [dprtmnt_id]);
      res.json({ count: rows[0]?.student_count || 0 });
    } catch (err) {
      console.error("Error fetching total student count by department:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.get("/api/departments/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;
  console.log(dprtmnt_id);
  try {
    const [departments] = await db3.execute(
      `
      SELECT dt.dprtmnt_id, dt.dprtmnt_name, dt.dprtmnt_code FROM dprtmnt_table AS dt WHERE dt.dprtmnt_id = ?
    `,
      [dprtmnt_id],
    );
    res.json(departments);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/departments", async (req, res) => {
  try {
    const [departments] = await db3.execute(`
      SELECT dt.dprtmnt_id, dt.dprtmnt_name, dt.dprtmnt_code FROM dprtmnt_table AS dt
    `);
    res.json(departments);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// NEW ENDPOINT: All Year Levels Count
app.get(
  "/statistics/student_count/department/:dprtmnt_id/by_year_level",
  async (req, res) => {
    const { dprtmnt_id } = req.params;

    try {
      const query = `
      SELECT ylt.year_level_id, ylt.year_level_description, COUNT(DISTINCT es.student_number) AS student_count
      FROM enrolled_subject AS es
      INNER JOIN curriculum_table AS ct ON es.curriculum_id = ct.curriculum_id
      INNER JOIN dprtmnt_curriculum_table AS dct ON ct.curriculum_id = dct.curriculum_id
      INNER JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
      INNER JOIN active_school_year_table AS asyt ON es.active_school_year_id = asyt.id
      INNER JOIN student_status_table AS sst ON es.student_number = sst.student_number
      INNER JOIN year_level_table AS ylt ON sst.year_level_id = ylt.year_level_id
      WHERE dt.dprtmnt_id = ?
        AND asyt.astatus = 1
        AND sst.enrolled_status = 1
      GROUP BY ylt.year_level_id
      ORDER BY ylt.year_level_id ASC;
    `;

      const [rows] = await db3.execute(query, [dprtmnt_id]);
      res.json(rows); // [{ year_level_id: 1, year_level_description: "1st Year", student_count: 123 }, ...]
    } catch (err) {
      console.error("Error fetching year-level counts:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.get("/get_active_school_years", async (req, res) => {
  const query = `
    SELECT sy.*, yt.year_description, s.semester_description
    FROM active_school_year_table sy
    JOIN year_table yt ON sy.year_id = yt.year_id
    JOIN semester_table s ON sy.semester_id = s.semester_id
    WHERE sy.astatus = 1
  `;

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Fetch error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch school years", details: err.message });
  }
});

// 09/06/2025 UPDATE - FIXED: search by EMAIL not student_number
app.post("/forgot-password-student", async (req, res) => {
  try {
    const { search } = req.body;

    if (!search) {
      return res
        .status(400)
        .json({ success: false, message: "Missing search value" });
    }

    const like = `%${search}%`;

    // 🔍 Allow reset via: student_number, name, person email, or user_accounts email
    const [rows] = await db3.query(
      `SELECT ua.email
       FROM user_accounts ua
       JOIN person_table pt ON ua.person_id = pt.person_id
       WHERE ua.role = 'student'
         AND (
            pt.student_number LIKE ?
            OR ua.email LIKE ?
            OR pt.emailAddress LIKE ?
            OR pt.first_name LIKE ?
            OR pt.middle_name LIKE ?
            OR pt.last_name LIKE ?
            OR CONCAT(pt.first_name, ' ', pt.last_name) LIKE ?
         )
       LIMIT 1`,
      [like, like, like, like, like, like, like],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    const email = rows[0].email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "No valid email found for this student.",
      });
    }

    // 🔹 Fetch short term from company settings
    const [settings] = await db.query(
      "SELECT short_term FROM company_settings WHERE id = 1",
    );
    const shortTerm = settings[0]?.short_term || "Institution";

    // 🔹 Generate new 8-letter password
    const newPassword = Array.from({ length: 8 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 65),
    ).join("");

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 🔹 Update student password
    await db3.query("UPDATE user_accounts SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    // 🔹 Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${shortTerm} - Information System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password has Reset",
      text: `Your new temporary password is: ${newPassword}\n\nPlease change it after logging in.`,
    });

    res.json({
      success: true,
      message: "Password reset successfully. Check email for the new password.",
    });
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/* Student Dashboard */
//GET All Needed Student Personl Data
app.get("/api/student/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db3.execute(
      `
      SELECT DISTINCT
        snt.person_id,
        pt.profile_img AS profile_image,
        ua.role,
        pt.extension,
        pt.last_name,
        pt.first_name,
        pt.middle_name,
        snt.student_number,
        sst.year_level_id,
        es.curriculum_id,
        sy.semester_id
      FROM student_numbering_table AS snt
      INNER JOIN person_table AS pt ON snt.person_id = pt.person_id
      INNER JOIN user_accounts AS ua ON pt.person_id = ua.person_id
      INNER JOIN enrolled_subject AS es ON snt.student_number = es.student_number
      INNER JOIN student_status_table AS sst ON snt.student_number = sst.student_number
      INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
      WHERE pt.person_id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    const { student_number, year_level_id, curriculum_id, semester_id } =
      rows[0];

    const checkTotalRequiredUnits = `
      SELECT COALESCE(SUM(ct.course_unit) + SUM(ct.lab_unit), 0) AS required_total_units
      FROM program_tagging_table AS ptt
      INNER JOIN course_table AS ct ON ptt.course_id = ct.course_id
      WHERE ptt.year_level_id = ? AND ptt.semester_id = ? AND ptt.curriculum_id = ?
    `;
    const [requiredUnits] = await db3.query(checkTotalRequiredUnits, [
      year_level_id,
      semester_id,
      curriculum_id,
    ]);

    const checkTotalEnrolledUnits = `
      SELECT COALESCE(SUM(ct.course_unit) + SUM(ct.lab_unit), 0) AS enrolled_total_units
      FROM enrolled_subject AS es
      INNER JOIN course_table AS ct ON es.course_id = ct.course_id
      INNER JOIN student_status_table AS sst ON es.student_number = sst.student_number
      INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
      WHERE sy.astatus = 1 AND es.student_number = ? AND sst.year_level_id = ?;
    `;
    const [enrolledUnits] = await db3.query(checkTotalEnrolledUnits, [
      student_number,
      year_level_id,
    ]);

    const requiredTotal = requiredUnits[0]?.required_total_units || 0;
    const enrolledTotal = enrolledUnits[0]?.enrolled_total_units || 0;

    const student_status =
      enrolledTotal === requiredTotal ? "Regular" : "Irregular";

    return res.json({
      ...rows[0],
      student_status,
    });
  } catch (error) {
    console.error("Error fetching person:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

//COUNT the Total Number of Courses the Student Enrolled
app.get("/api/course_count/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db3.execute(
      `
      SELECT
        COUNT(es.course_id) AS initial_course,
        CASE
          WHEN SUM(CASE WHEN es.fe_status = 1 THEN 1 ELSE 0 END) = COUNT(es.course_id)
          THEN SUM(CASE WHEN es.en_remarks = 1 THEN 1 ELSE 0 END)
          ELSE 0
        END AS passed_course,
        CASE
          WHEN SUM(CASE WHEN es.fe_status = 1 THEN 1 ELSE 0 END) = COUNT(es.course_id)
          THEN SUM(CASE WHEN es.en_remarks = 2 THEN 1 ELSE 0 END)
          ELSE 0
        END AS failed_course,
        CASE
          WHEN SUM(CASE WHEN es.fe_status = 1 THEN 1 ELSE 0 END) = COUNT(es.course_id)
          THEN SUM(CASE WHEN es.en_remarks = 3 THEN 1 ELSE 0 END)
          ELSE 0
        END AS inc_course
      FROM enrolled_subject AS es
      JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
      JOIN person_table AS pt ON snt.person_id = pt.person_id
      WHERE pt.person_id = ?
    `,
      [id],
    );

    res.json(rows[0] || { initial_course: 0 });
    console.log(rows);
  } catch (error) {
    console.error("Error fetching course count:", error);
    res.status(500).json({ error: "Database error" });
  }
});

//GET All Needed Student Academic Data (Program, etc...)
app.get("/api/student_details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log("Fetching student details for person_id:", id);
    const [rows] = await db3.execute(
      `
    SELECT DISTINCT
      IFNULL(pgt.program_description, 'Not Currently Enrolled') AS program_description,
      IFNULL(st.description, 'Not Currently Enrolled') AS section_description,
      IFNULL(pgt.program_code, 'Not Currently Enrolled') AS program_code,
      IFNULL(ylt.year_level_description, 'Not Currently Enrolled') AS year_level
    FROM enrolled_subject AS es
      INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
      INNER JOIN person_table AS pt ON snt.person_id = pt.person_id
      INNER JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
      INNER JOIN program_table AS pgt ON cct.program_id = pgt.program_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN student_status_table AS sst ON snt.student_number = sst.student_number
      INNER JOIN year_level_table AS ylt ON sst.year_level_id = ylt.year_level_id
      INNER JOIN active_school_year_table AS sy ON sst.active_school_year_id = sy.id
    WHERE pt.person_id = ?`,
      [id],
    );


    if (rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});


/* Student Schedule */
//GET Student Current Assigned Schedule
app.get("/api/student_schedule/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db3.execute(
      `
    SELECT DISTINCT
      ct.course_description,
      ct.course_code,
      ct.course_unit,
      ct.lab_unit,
      pgt.program_code,
      st.description AS section_description,
      IFNULL(pft.lname, 'TBA') AS prof_lastname,
      IFNULL(rdt.description, 'TBA') AS day_description,
      IFNULL(tt.school_time_start, 'TBA') AS school_time_start,
      IFNULL(tt.school_time_end, 'TBA') AS school_time_end,
      IFNULL(rt.room_description, 'TBA') AS room_description,
      IFNULL(pft.fname, 'TBA') AS fname,
      IFNULL(pft.lname, 'TBA') AS lname
     FROM enrolled_subject AS es
    JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
    JOIN person_table AS pt ON snt.person_id = pt.person_id
    JOIN course_table AS ct ON es.course_id = ct.course_id
    JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
    JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
    JOIN program_table AS pgt ON cct.program_id = pgt.program_id
    JOIN section_table AS st ON dst.section_id = st.id
    LEFT JOIN time_table AS tt
      ON tt.course_id = es.course_id
     AND tt.department_section_id = es.department_section_id
     AND tt.school_year_id = es.active_school_year_id
    LEFT JOIN room_day_table AS rdt ON tt.room_day = rdt.id
    LEFT JOIN room_table AS rt ON tt.department_room_id = rt.room_id
    LEFT JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
    JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
    WHERE pt.person_id = ? AND sy.astatus = 1;`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});

/* Student Grade Page */
//DISPLAY ALL Student's Grade
/* Student Grade Page */
//DISPLAY ALL Student's Grade
app.get("/api/student_grade/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 🔎 Check if there are professors not evaluated yet
    const [pending] = await db3.execute(
      `
      SELECT DISTINCT COUNT(*) AS total_professors
      FROM enrolled_subject AS es
      JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
      WHERE es.fe_status = 0 AND snt.person_id = ?
    `,
      [id],
    );

    // 🔎 Fetch all enrolled courses with details
    const [rows] = await db3.execute(
      `
      SELECT DISTINCT
        ct.course_description,
        ct.course_code,
        es.en_remarks,
        ct.course_unit,
        ct.lab_unit,
        pgt.program_code,
        pgt.program_description,
        st.description AS section_description,
        pft.lname AS prof_lastname,
        rdt.description AS day_description,
        tt.school_time_start,
        tt.school_time_end,
        rt.room_description,
        yt.year_description AS first_year,
        yt.year_description + 1 AS last_year,
        smt.semester_description,
        IFNULL(pft.fname, 'TBA') AS fname,
        IFNULL(pft.lname, 'TBA') AS lname,
        es.final_grade,
        es.fe_status,
        es.en_remarks
      FROM enrolled_subject AS es
        JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
        JOIN person_table AS pt ON snt.person_id = pt.person_id
        JOIN course_table AS ct ON es.course_id = ct.course_id
        JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
        JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
        JOIN program_table AS pgt ON cct.program_id = pgt.program_id
        JOIN section_table AS st ON dst.section_id = st.id
        LEFT JOIN time_table AS tt
          ON tt.course_id = es.course_id
          AND tt.department_section_id = es.department_section_id
          AND tt.school_year_id = es.active_school_year_id
        LEFT JOIN room_day_table AS rdt ON tt.room_day = rdt.id
        LEFT JOIN room_table AS rt ON tt.department_room_id = rt.room_id
        LEFT JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
        JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
        JOIN year_table AS yt ON sy.year_id = yt.year_id
        JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      WHERE pt.person_id = ? ORDER BY yt.year_description DESC, CASE smt.semester_description
        WHEN 'First Semester' THEN 1
        WHEN 'Second Semester' THEN 2
        ELSE 3
      END DESC
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    let responseRows = rows;
    res.json(responseRows);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});

//GET Grading Status Period
app.get("/api/grading_status", async (req, res) => {
  try {
    const [rows] = await db3.execute(
      "SELECT status FROM period_status WHERE description = 'Final Grading Period'",
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Grading period not found" });
    }

    res.json({ status: rows[0].status });
    console.log({ status: rows[0].status });
  } catch (err) {
    console.error("Error checking grading status:", err);
    res.status(500).json({ message: "Database error" });
  }
});

//DISPLAY Latest Data Only
app.get("/api/student/view_latest_grades/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [courses] = await db3.execute(
      `
      SELECT DISTINCT
        ct.course_description,
        ct.course_code,
        es.en_remarks,
        ct.course_unit,
        ct.lab_unit,
        pgt.program_code,
        pgt.program_description,
        st.description AS section_description,
        pft.lname AS prof_lastname,
        IFNULL(pft.fname, 'TBA') AS fname,
        IFNULL(pft.lname, 'TBA') AS lname,
        rdt.description AS day_description,
        tt.school_time_start,
        tt.school_time_end,
        rt.room_description,
        yt.year_description AS first_year,
        yt.year_description + 1 AS last_year,
        smt.semester_description,
        es.final_grade,
        es.fe_status,
        es.en_remarks
      FROM enrolled_subject AS es
        JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
        JOIN person_table AS pt ON snt.person_id = pt.person_id
        JOIN course_table AS ct ON es.course_id = ct.course_id
        JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
        JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
        JOIN program_table AS pgt ON cct.program_id = pgt.program_id
        JOIN section_table AS st ON dst.section_id = st.id
        LEFT JOIN time_table AS tt
          ON tt.course_id = es.course_id
        AND tt.department_section_id = es.department_section_id
        LEFT JOIN room_day_table AS rdt ON tt.room_day = rdt.id
        LEFT JOIN room_table AS rt ON tt.department_room_id = rt.room_id
        LEFT JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
        JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
        JOIN year_table AS yt ON sy.year_id = yt.year_id
        JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      WHERE pt.person_id = ?
    `,
      [id],
    );

    res.json({ status: "ok", grades: courses });
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Database error" });
  }
});

/* Faculty Evaluation (Student Side) */
app.get("/api/student_course/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db3.execute(
      `
      SELECT DISTINCT snt.student_number, pt.prof_id, cyt.year_description AS curriculum_year,cct.curriculum_id, sy.id AS active_school_year_id, ct.course_id, pt.fname, pt.mname, pt.lname, ct.course_description, ct.course_code, pt.fname, pt.mname, pt.lname, dt.dprtmnt_code AS department, ct.course_code,pgt.program_code, smt.semester_description, yrt.year_description AS current_year, yrt.year_description + 1 AS next_year FROM enrolled_subject AS es
        INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
        INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
        INNER JOIN course_table AS ct ON es.course_id = ct.course_id
        INNER JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
        LEFT JOIN time_table AS tt
          ON tt.course_id = es.course_id
          AND tt.department_section_id = es.department_section_id
        LEFT JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
        INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
        LEFT JOIN dprtmnt_curriculum_table AS dct ON es.curriculum_id = dct.curriculum_id
        LEFT JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
        LEFT JOIN program_table AS pgt ON cct.program_id = pgt.program_id
        LEFT JOIN year_table AS yrt ON sy.year_id = yrt.year_id
        LEFT JOIN year_table AS cyt ON cct.year_id = cyt.year_id
        LEFT JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      WHERE pst.person_id = ? AND sy.astatus = 1 AND es.fe_status = 0;
    `,
      [id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Professor Data are not found" });
    }

    res.json(rows);
  } catch (err) {
    console.error("Error checking grading status:", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/student_evaluation", async (req, res) => {
  const {
    student_number,
    school_year_id,
    prof_id,
    course_id,
    question_id,
    answer,
  } = req.body;

  try {
    await db3.execute(
      `
      INSERT INTO student_evaluation_table
      (student_number, school_year_id, prof_id, course_id, question_id, question_answer)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [student_number, school_year_id, prof_id, course_id, question_id, answer],
    );

    await db3.execute(
      `
      UPDATE enrolled_subject
      SET fe_status = 1
      WHERE student_number = ? AND course_id = ? AND active_school_year_id = ?
      `,
      [student_number, course_id, school_year_id],
    );

    res.status(200).send({ message: "Evaluation successfully recorded!" });
  } catch (err) {
    console.error("Database / Server Error:", err);
    res
      .status(500)
      .send({ message: "Database / Server Error", error: err.message });
  }
});

//DISPLAY the Student Answer After Submission
app.get(
  "/api/student/faculty_evaluation/answer/:course_id/:prof_id/:curriculum_id/:active_school_year_id",
  async (req, res) => {
    const { course_id, prof_id, curriculum_id, active_school_year_id } =
      req.params;

    try {
      const [rows] = await db3.execute(
        `SELECT num1, num2, num3, eval_status
         FROM faculty_evaluation_table
         WHERE prof_id = ? AND course_id = ? AND curriculum_id = ? AND active_school_year_id = ? LIMIT 1;`,
        [prof_id, course_id, curriculum_id, active_school_year_id],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching evaluation:", err);
      res.status(500).json({ message: "Database error" });
    }
  },
);

app.get("/api/get/all_schedule/:roomID", async (req, res) => {
  const { roomID } = req.params;

  try {
    const scheduleQuery = `
      SELECT
        tt.id,
        tt.room_day,
        rdt.description AS day_description,
        tt.school_time_start,
        tt.school_time_end,
        pft.lname AS prof_lastname,
        pft.fname AS prof_firstname,
        cst.course_code,
        rmt.room_description,
        pgt.program_code,
        pft.employee_id,
        tt.ishonorarium,
        yt.year_description AS current_year,
        yt.year_description + 1 AS next_year,
        smt.semester_description,
        st.description AS section_description
      FROM time_table AS tt
        LEFT JOIN room_day_table AS rdt ON tt.room_day = rdt.id
        LEFT JOIN dprtmnt_section_table AS dst ON tt.department_section_id = dst.id
        LEFT JOIN curriculum_table AS cct ON dst.curriculum_id = cct.curriculum_id
        LEFT JOIN program_table AS pgt ON cct.program_id = pgt.program_id
        LEFT JOIN course_table AS cst ON tt.course_id = cst.course_id
        LEFT JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
        LEFT JOIN active_school_year_table AS syt ON tt.school_year_id = syt.id
        LEFT JOIN room_table AS rmt ON tt.department_room_id = rmt.room_id
        LEFT JOIN section_table AS st ON dst.section_id = st.id
        LEFT JOIN active_school_year_table AS sy ON tt.school_year_id = sy.id
        LEFT JOIN year_table AS yt ON sy.year_id = yt.year_id
        LEFT JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      WHERE (rmt.room_id = ? OR tt.department_room_id IS NULL) AND sy.astatus = 1;
    `;
    const [schedule] = await db3.execute(scheduleQuery, [roomID]);

    if (schedule.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json(schedule);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/insert-schedule-designation", async (req, res) => {
  const { day, start_time, end_time, subject_id, prof_id, school_year_id } =
    req.body;

  if (!day || !start_time || !end_time || !school_year_id || !prof_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let startMinutes = timeToMinutes(start_time);
  let endMinutes = timeToMinutes(end_time);
  const earliest = timeToMinutes("7:00 AM");
  const latest = timeToMinutes("9:00 PM");

  // Validate times
  if (endMinutes <= startMinutes) {
    return res.status(409).json({
      conflict: true,
      message: "End time must be later than start time (same day only).",
    });
  }

  if (startMinutes < earliest || endMinutes > latest) {
    return res.status(409).json({
      conflict: true,
      message: "Time must be between 7:00 AM and 9:00 PM (same day).",
    });
  }

  try {
    // Check for time conflicts (prof, section, room)
    const checkTimeQuery = `
      SELECT * FROM time_table
      WHERE room_day = ?
        AND school_year_id = ?
        AND (professor_id = ? OR department_section_id = ?)
        AND (
          (? > TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60
          AND ? < TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60)
          OR
          (? > TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60
          AND ? < TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 > ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 < ?)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 > ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 < ?)
          OR
          (TIME_TO_SEC(STR_TO_DATE(school_time_start, '%l:%i %p'))/60 = ?
          AND TIME_TO_SEC(STR_TO_DATE(school_time_end, '%l:%i %p'))/60 = ?)
        )
    `;

    const [timeResult] = await db3.query(checkTimeQuery, [
      day,
      school_year_id,
      prof_id,
      startMinutes,
      startMinutes,
      endMinutes,
      endMinutes,
      startMinutes,
      endMinutes,
      startMinutes,
      endMinutes,
      startMinutes,
      endMinutes,
      startMinutes,
      endMinutes,
      startMinutes,
      endMinutes,
    ]);

    if (timeResult.length > 0) {
      return res.status(409).json({
        conflict: true,
        message: "Schedule conflict detected! Please choose a different time.",
      });
    }

    // Insert schedule
    const insertQuery = `
      INSERT INTO time_table
      (room_day, school_time_start, school_time_end, department_section_id, course_id, professor_id, department_room_id, school_year_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db3.query(insertQuery, [
      day,
      start_time,
      end_time,
      null,
      subject_id,
      prof_id,
      null,
      school_year_id,
    ]);

    res.status(200).json({ message: "Schedule inserted successfully" });
  } catch (error) {
    console.error("Error inserting schedule:", error);
    res.status(500).json({ error: "Failed to insert schedule" });
  }
});

app.delete("/api/delete/schedule/:scheduleId", async (req, res) => {
  const { scheduleId } = req.params;
  console.log("Room Id: ", scheduleId);

  try {
    const deleteQuery = `DELETE FROM time_table WHERE id = ?`;
    const [result] = await db3.execute(deleteQuery, [scheduleId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found." });
    }

    res.json({ message: "Schedule deleted successfully." });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ error: "Database error while deleting schedule." });
  }
});

//HELPER FUNCTION
function timeToMinutes(timeStr) {
  const parts = timeStr.trim().split(" ");
  let [hours, minutes] = parts[0].split(":").map(Number);
  const modifier = parts[1] ? parts[1].toUpperCase() : null;

  if (modifier) {
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
}

//Get Section List From Selected Department
app.get("/section_table/:dprtmnt_id", async (req, res) => {
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

//Get Program List From Selected Department
app.get("/program_list/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `
      SELECT pt.program_id, pt.program_description, pt.program_code, pt.major
      FROM dprtmnt_curriculum_table AS dct
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

// server.js (add or replace existing person_with_applicant route)
app.get("/api/person_with_applicant/:person_id", (req, res) => {
  const personId = req.params.person_id;
  const sql = `
    SELECT
      p.*,
      an.applicant_number,

      ps.qualifying_result   AS qualifying_exam_score,
      ps.interview_result    AS qualifying_interview_score,
      ps.exam_result         AS exam_score
    FROM person_table p
    LEFT JOIN applicant_numbering_table an ON an.person_id = p.person_id
    LEFT JOIN person_status_table ps ON ps.person_id = p.person_id
    WHERE p.person_id = ?
    LIMIT 1
  `;
  db.query(sql, [personId], (err, results) => {
    if (err) {
      console.error("person_with_applicant SQL error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (!results[0]) return res.status(404).json({ error: "Person not found" });
    res.json(results[0]);
  });
});

// server.js
app.get("/api/person_with_applicant/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT
      p.*,
      an.applicant_number,
      ps.qualifying_result   AS qualifying_exam_score,
      ps.interview_result    AS qualifying_interview_score,
      ps.exam_result         AS exam_score
    FROM person_table p
    LEFT JOIN applicant_numbering_table an ON an.person_id = p.person_id
    LEFT JOIN person_status_table ps ON ps.person_id = p.person_id
    WHERE p.person_id = ? OR an.applicant_number = ?
    LIMIT 1
  `;

  // bind the same param twice so the endpoint accepts either numeric person_id or applicant_number
  db.query(sql, [id, id], (err, results) => {
    if (err) {
      console.error("person_with_applicant SQL error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (!results[0]) return res.status(404).json({ error: "Person not found" });
    res.json(results[0]);
  });
});

// server.js
app.get("/api/person_status_by_applicant/:applicant_number", (req, res) => {
  const applicantNumber = req.params.applicant_number;
  const sql = `
    SELECT ps.*
    FROM person_status_table ps
    JOIN applicant_numbering_table an ON an.person_id = ps.person_id
    WHERE an.applicant_number = ?
    LIMIT 1
  `;
  db.query(sql, [applicantNumber], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0] || null);
  });
});

// GET all templates
// GET all templates with department name
app.get("/api/email-templates", async (req, res) => {
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
app.post("/api/email-templates", async (req, res) => {
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
app.put("/api/email-templates/:id", async (req, res) => {
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
app.delete("/api/email-templates/:id", async (req, res) => {
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

app.get("/api/email-templates/active-senders", async (req, res) => {
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

app.get("/api/admin_data/:email", async (req, res) => {
  const { email } = req.params; // 👈 now matches your frontend call
  console.log("Email: ", email);

  try {
    const [rows] = await db3.query(
      "SELECT ua.dprtmnt_id FROM user_accounts AS ua WHERE email = ?",
      [email],
    );

    if (rows.length > 0) {
      res.json(rows[0]); // return { dprtmnt_id: "..." }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch department" });
  }
});

app.get("/api/applied_program/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;
  try {
    const [rows] = await db3.execute(
      `
      SELECT
        ct.curriculum_id,
        ct.year_id,
        yt.year_description,
        pt.program_id,
        pt.program_code,
        pt.program_description,
        pt.major,
        pt.components,
        pt.academic_program,
        d.dprtmnt_id,
        d.dprtmnt_name
      FROM curriculum_table AS ct
      INNER JOIN program_table AS pt ON pt.program_id = ct.program_id
      INNER JOIN dprtmnt_curriculum_table AS dc ON ct.curriculum_id = dc.curriculum_id
      INNER JOIN year_table AS yt ON ct.year_id = yt.year_id
      INNER JOIN dprtmnt_table AS d ON dc.dprtmnt_id = d.dprtmnt_id
      WHERE d.dprtmnt_id = ?

    `,
      [dprtmnt_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No curriculum data found" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching curriculum data:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/person_data/:person_id/:role", async (req, res) => {
  try {
    const { person_id, role } = req.params;
    let userData;

    if (role === "registrar") {
      // ✅ Fetch registrar info directly from user_accounts (db3)
      const [rows] = await db3.query(
        `SELECT
           ua.person_id,
           ua.profile_picture AS profile_image,
           ua.first_name AS fname,
           ua.middle_name AS mname,
           ua.last_name AS lname,
           ua.role,
           ua.employee_id,
           ua.email
         FROM user_accounts AS ua
         WHERE ua.person_id = ? AND ua.role = 'registrar'`,
        [person_id],
      );
      userData = rows[0];
    } else if (role === "faculty") {
      const [rows] = await db3.query(
        `SELECT
           pt.person_id,
           pt.employee_id,
           pt.profile_image,
           pt.fname,
           pt.lname,
           'faculty' AS role,
           pt.email
         FROM prof_table AS pt
         WHERE pt.person_id = ?`,
        [person_id],
      );
      userData = rows[0];
    } else if (role === "student") {
      const [rows] = await db3.query(
        `SELECT
           pt.person_id,
           pt.profile_img AS profile_image,
           pt.first_name AS fname,
           pt.middle_name AS mname,
           pt.last_name AS lname,
           ua.role,
           snt.student_number,
           ua.email
         FROM person_table AS pt
         INNER JOIN user_accounts AS ua
           ON pt.person_id = ua.person_id
         INNER JOIN student_numbering_table AS snt 
           ON snt.person_id = pt.person_id
         WHERE pt.person_id = ? AND ua.role = 'student'`,
        [person_id],
      );
      userData = rows[0];
    } else if (role === "applicant") {
      const [rows] = await db.query(
        `SELECT
           p.person_id,
           p.profile_img AS profile_image,
           p.first_name AS fname,
           p.middle_name AS mname,
           p.last_name AS lname,
           ua.role,
           ua.email
         FROM person_table AS p
         INNER JOIN user_accounts AS ua
           ON p.person_id = ua.person_id
         WHERE p.person_id = ? AND ua.role = ?`,
        [person_id, role],
      );
      userData = rows[0];
    } else {
      return res.status(400).send({ message: "Invalid role provided" });
    }

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(userData);
  } catch (err) {
    console.error("❌ Error fetching person data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Fetch interview schedule for an applicant
// ✅ Fetch interview schedule + scores for an applicant
app.get(
  "/api/applicant-interview-schedule/:applicantNumber",
  async (req, res) => {
    const { applicantNumber } = req.params;

    try {
      const [rows] = await db.query(
        `
      SELECT
        ies.schedule_id,
        ies.day_description,
        ies.building_description,
        ies.room_description,
        ies.start_time,
        ies.end_time,
        ies.interviewer,
        ps.exam_result,
        ps.qualifying_result,
        ps.interview_result
      FROM interview_applicants ia
      JOIN interview_exam_schedule ies
        ON ia.schedule_id = ies.schedule_id
      LEFT JOIN person_status_table ps
        ON ia.applicant_id = ps.applicant_id
      WHERE ia.applicant_id = ?
      LIMIT 1
      `,
        [applicantNumber],
      );

      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res
          .status(404)
          .json({ message: "No interview schedule found for this applicant" });
      }
    } catch (err) {
      console.error("❌ Error fetching interview schedule:", err);
      res
        .status(500)
        .json({ message: "Server error fetching interview schedule" });
    }
  },
);
app.get("/api/interview_applicants/:applicantId", async (req, res) => {
  try {
    const { applicantId } = req.params;
    const [rows] = await db.query(
      "SELECT status FROM interview_applicants WHERE applicant_id = ? ORDER BY id DESC LIMIT 1",
      [applicantId],
    );

    if (rows.length === 0) {
      return res.json({ status: null });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching interview applicant status:", err);
    res.status(500).send("Server error");
  }
});

// 09/16/2025
app.get("/api/student_number", async (req, res) => {
  try {
    const [rows] = await db3.execute(`
      SELECT DISTINCT
        snt.student_number,
        pst.campus,
        pst.last_name,
        pst.first_name,
        pst.middle_name,
        pgt.program_description,
        smt.semester_description,
        smt.semester_code,
        pgt.program_code,
        pgt.program_id,
        dpt.dprtmnt_id,
        dpt.dprtmnt_code,
        es.status,
        sy.year_id,
        sy.semester_id,
        es.en_remarks,
        ylt.year_level_description,
        es.curriculum_id
      FROM enrolled_subject AS es
        INNER JOIN curriculum_table AS cmt ON es.curriculum_id = cmt.curriculum_id
        INNER JOIN program_table AS pgt ON cmt.program_id = pgt.program_id
        INNER JOIN year_table AS yrt ON cmt.year_id = yrt.year_id
        INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
        INNER JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
        INNER JOIN program_tagging_table AS ptt ON es.curriculum_id = ptt.curriculum_id
          AND es.course_id = ptt.course_id AND sy.semester_id = ptt.semester_id
        INNER JOIN year_level_table AS ylt ON ptt.year_level_id = ylt.year_level_id
        INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
        INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
        INNER JOIN dprtmnt_curriculum_table AS dct ON cmt.curriculum_id = dct.curriculum_id
        INNER JOIN dprtmnt_table AS dpt ON dct.dprtmnt_id = dpt.dprtmnt_id;
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No student data found" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching curriculum data:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/get_class_details/:userID", async (req, res) => {
  const { userID } = req.params;
  try {
    const query = `
      SELECT
        snt.student_number,
        es.status,
        ct.course_unit,
        ct.lab_unit,
        pst.first_name,
        pst.middle_name,
        pst.last_name,
        pst.gender,
        pst.age,
        pt.program_code,
        st.description AS section_description,
        ct.course_id,
        ct.course_description,
        rt.room_description,
        tt.school_time_start,
        tt.school_time_end,
        rdt.description AS day,
        tt.department_section_id,
        ct.course_code,
        sy.year_id,
        sy.semester_id,
        yr.year_description AS current_year,
        yr.year_description + 1 AS next_year,
        smt.semester_description,
        dt.dprtmnt_name,
        yrlt.year_level_description
      FROM enrolled_subject AS es
      INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
      INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN curriculum_table AS cct ON dst.curriculum_id = cct.curriculum_id
      INNER JOIN program_table AS pt ON cct.program_id = pt.program_id
      INNER JOIN course_table AS ct ON es.course_id = ct.course_id
      INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
      LEFT JOIN time_table AS tt
      ON tt.school_year_id = es.active_school_year_id
      AND tt.department_section_id = es.department_section_id
      AND tt.course_id = es.course_id
      INNER JOIN year_table AS yr ON sy.year_id = yr.year_id
      INNER JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      INNER JOIN room_day_table AS rdt ON tt.room_day = rdt.id
      INNER JOIN room_table AS rt ON tt.department_room_id = rt.room_id
      INNER JOIN dprtmnt_curriculum_table AS dct ON cct.curriculum_id = dct.curriculum_id
      INNER JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
      LEFT JOIN student_status_table AS sst ON es.student_number = sst.student_number
      LEFT JOIN year_level_table AS yrlt ON sst.year_level_id = yrlt.year_level_id
    WHERE tt.professor_id = ?
    `;
    const [result] = await db3.query(query, [userID]);
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get(
  "/api/section_assigned_to/:userID/:selectedSchoolYear/:selectedSchoolSemester",
  async (req, res) => {
    const { userID, selectedSchoolYear, selectedSchoolSemester } = req.params;
    try {
      const [schoolYearRows] = await db3.execute(
        "SELECT id FROM active_school_year_table WHERE year_id = ? AND semester_id = ?",
        [selectedSchoolYear, selectedSchoolSemester],
      );
      if (schoolYearRows.length === 0) {
        return res.status(404).json({ error: "Active school year not found" });
      }

      const selectedActiveSchoolYear = schoolYearRows[0].id;

      const [rows] = await db3.execute(
        `
      SELECT DISTINCT
		st.id AS section_id,
        st.description AS section_description,
        pgt.program_code
      FROM time_table t
      JOIN room_day_table d ON d.id = t.room_day
      INNER JOIN active_school_year_table asy ON t.school_year_id = asy.id
      INNER JOIN dprtmnt_section_table AS dst ON t.department_section_id = dst.id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN curriculum_table AS cct ON dst.curriculum_id = cct.curriculum_id
      INNER JOIN program_table AS pgt ON cct.program_id = pgt.program_id
      INNER JOIN prof_table AS pft ON t.professor_id = pft.prof_id
      WHERE pft.person_id = ? AND t.school_year_id = ?
    `,
        [userID, selectedActiveSchoolYear],
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "No Section data found" });
      }

      res.json(rows);
    } catch (error) {
      console.error("Error fetching curriculum data:", error);
      res.status(500).json({ error: "Database error" });
    }
  },
);



app.get(
  "/api/section_assigned_to/:userID/:courseID/:yearID/:semesterID",
  async (req, res) => {
    const { userID, courseID, yearID, semesterID } = req.params;

    try {
      const [rows] = await db3.execute(
        `
      SELECT DISTINCT
        t.department_section_id,
        st.description AS section_description,
        pgt.program_code
      FROM time_table t
      INNER JOIN active_school_year_table asy ON t.school_year_id = asy.id
      INNER JOIN dprtmnt_section_table dst ON t.department_section_id = dst.id
      INNER JOIN section_table st ON dst.section_id = st.id
      INNER JOIN curriculum_table cct ON dst.curriculum_id = cct.curriculum_id
      INNER JOIN program_table pgt ON cct.program_id = pgt.program_id
      INNER JOIN prof_table pft ON t.professor_id = pft.prof_id
      WHERE pft.person_id = ?
      AND t.course_id = ?
      AND asy.year_id = ?
      AND asy.semester_id = ?
    `,
        [userID, courseID, yearID, semesterID],
      );

      res.json(rows);
    } catch (error) {
      console.Error("Error:", error);
      res.status(500).json({ error: "Database Error" });
    }
  },
);

// ✅ Mark applicant as emailed (action = 1)
app.put("/api/interview_applicants/:applicant_id/action", async (req, res) => {
  const { applicant_id } = req.params;

  try {
    const [result] = await db.execute(
      "UPDATE admission.interview_applicants SET action = 1, email_sent = 1 WHERE applicant_id = ?",
      [applicant_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    res.json({ success: true, message: "Applicant marked as emailed" });
  } catch (err) {
    console.error("❌ Error updating action:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/send-email", async (req, res) => {
  const { to, subject, html, senderName, user_person_id } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ message: "Missing email fields" });
  }

  try {
    const [actorRows] = await db3.query(
      `SELECT
        role,
        employee_id,
        last_name,
        first_name,
        middle_name
      FROM user_accounts
      WHERE person_id = ?
      LIMIT 1`,
      [user_person_id]
    );

    const actor = actorRows[0];
    console.log("actor", actor)
    if (!actor) {
      return res.status(404).json({ message: "User account not found" });
    }

    const [[company]] = await db.query(
      "SELECT short_term FROM company_settings WHERE id = 1"
    );

    const shortTerm = company?.short_term || "EARIST";

    const [userEmailRows] = await db.query(
      `SELECT sender_name, department_id 
       FROM email_templates 
       WHERE employee_id = ?`,
      [actor.employee_id]
    );

    const templateRow = userEmailRows[0];

    if (!templateRow) {
      return res.status(404).json({ message: "Email template not found" });
    }

    const senderAccountKey = templateRow.sender_name || senderName;

    const [depRows] = await db3.query(
      `SELECT dprtmnt_name 
       FROM dprtmnt_table 
       WHERE dprtmnt_id = ?`,
      [templateRow.dprtmnt_id]
    );

    const depName = depRows.length > 0 ? depRows[0].dprtmnt_name : "Department";

    const senderAccountMap = {
      CCS_EMAIL_USER1: {
        user: process.env.CCS_EMAIL_USER1,
        pass: process.env.CCS_EMAIL_PASS1,
      },
      CCS_EMAIL_USER2: {
        user: process.env.CCS_EMAIL_USER2,
        pass: process.env.CCS_EMAIL_PASS2,
      },
    };

    const senderAccount =
      senderAccountMap[senderAccountKey] || {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      };

    if (!senderAccount.user || !senderAccount.pass) {
      throw new Error("Email sender account is not configured.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: senderAccount,
    });

    const [applicantPersonRows] = await db.query(
      `SELECT person_id FROM person_table WHERE emailAddress = ?`, [to]
    );

    const personIds = applicantPersonRows.map(row => row.person_id);

    await db.query(
      `UPDATE person_status_table SET interview_status = 1 WHERE person_id = ?`,
      [personIds]
    )

    await transporter.sendMail({
      from: `${shortTerm} - ${depName} <${senderAccount.user}>`,
      to,
      subject,
      html,
    });

    res.json({ success: true, message: "Email sent successfully" });

  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

app.put("/api/interview_applicants/accept-top", async (req, res) => {
  const { count, dprtmnt_id } = req.body;

  // Validate inputs
  if (!count || isNaN(count) || count <= 0)
    return res.status(400).json({ message: "Invalid count" });
  if (!dprtmnt_id)
    return res.status(400).json({ message: "Missing department ID" });

  try {
    // 1️⃣ Select top applicants from Waiting List
    const [rows] = await db3.query(
      `SELECT ps.applicant_id
       FROM admission.person_status_table ps
       JOIN admission.interview_applicants ia ON ia.applicant_id = ps.applicant_id
       JOIN admission.applicant_numbering_table ant ON ant.applicant_number = ps.applicant_id
       JOIN admission.person_table p ON p.person_id = ant.person_id
       JOIN enrollment.dprtmnt_curriculum_table dct ON dct.curriculum_id = p.academicProgram
       WHERE ia.status = 'Waiting List' AND dct.dprtmnt_id = ?
       ORDER BY ((ps.qualifying_result + ps.interview_result)/2) DESC
       LIMIT ?`,
      [Number(dprtmnt_id), Number(count)],
    );

    if (!rows.length)
      return res
        .status(404)
        .json({ message: "No Waiting List applicants found" });

    const ids = rows.map((r) => r.applicant_id);

    // 2️⃣ Update their status to Accepted
    const [updateResult] = await db3.query(
      `UPDATE admission.interview_applicants
       SET status = 'Accepted'
       WHERE applicant_id IN (?)`,
      [ids],
    );

    res.json({
      message: `Updated ${ids.length} applicants to Accepted in department ${dprtmnt_id}`,
      updated: ids,
    });
  } catch (err) {
    console.error("Error accepting top applicants:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/college/persons", async (req, res) => {
  try {
    // STEP 1: Get all eligible persons (from ENROLLMENT DB)
    const [persons] = await db.execute(`
      SELECT p.*, SUBSTRING(a.applicant_number, 5, 1) AS middle_code, pt.*
      FROM admission.person_table p
      JOIN admission.person_status_table ps ON p.person_id = ps.person_id
      LEFT JOIN admission.applicant_numbering_table AS a
        ON p.person_id = a.person_id
      INNER JOIN enrollment.curriculum_table ct ON p.program = ct.curriculum_id
      INNER JOIN enrollment.program_table pt ON ct.program_id = pt.program_id
      WHERE ps.student_registration_status = 0 AND ps.exam_status = 1 AND ps.interview_status = 1
      AND p.emailAddress NOT IN (SELECT emailAddress FROM enrollment.person_table);
    `);

    if (persons.length === 0) return res.json([]);

    const personIds = persons.map((p) => p.person_id);

    // STEP 2: Get all applicant numbers for those person_ids (from ADMISSION DB)
    const [applicantNumbers] = await db.query(
      `
      SELECT applicant_number, person_id
      FROM applicant_numbering_table
      WHERE person_id IN (?)
    `,
      [personIds],
    );

    // Create a quick lookup map
    const applicantMap = {};
    for (let row of applicantNumbers) {
      applicantMap[row.person_id] = row.applicant_number;
    }

    // STEP 3: Merge applicant_number into each person object
    const merged = persons.map((person) => ({
      ...person,
      applicant_number: applicantMap[person.person_id] || null,
    }));

    res.json(merged);
  } catch (err) {
    console.error("❌ Error merging person + applicant ID:", err);
    res.status(500).send("Server error");
  }
});

// 📊 Applicants per Month (this year + last 5 months)
app.get("/api/applicants-per-month", async (req, res) => {
  try {
    const [rows] = await db.query(`
      WITH months AS (
        SELECT DATE_FORMAT(MAKEDATE(YEAR(CURDATE()), 1) + INTERVAL (n-1) MONTH, '%Y-%m') AS month
        FROM (
          SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
          UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
          UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
        ) numbers
      )
      SELECT
        m.month,
        COALESCE(COUNT(p.person_id), 0) AS total
      FROM months m
      LEFT JOIN admission.person_table p
        ON DATE_FORMAT(p.created_at, '%Y-%m') = m.month
        AND YEAR(p.created_at) = YEAR(CURDATE())
      GROUP BY m.month
      ORDER BY m.month ASC;
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching applicants per month:", err);
    res.status(500).json({ error: "Failed to fetch applicants per month" });
  }
});

app.put(
  "/api/update_profile_image/:person_id",
  profileUpload.single("profileImage"),
  async (req, res) => {
    const { person_id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = req.file.filename;

    try {
      // Update DB (set filename to the same name we saved)
      const [result] = await db3.query(
        "UPDATE prof_table SET profile_image = ? WHERE person_id = ?",
        [filename, person_id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Person not found" });
      }

      res.json({
        message: "✅ Profile image updated successfully",
        filename,
      });
    } catch (err) {
      console.error("❌ DB Error:", err);
      res.status(500).json({ error: "Database update failed" });
    }
  },
);

// --------------------------------- FOR MIGRATION DATA PANEL

// 📌 Get interviewer schedules + applicants
app.get("/api/interviewers", async (req, res) => {
  const { query } = req.query;

  try {
    // 1. Find schedules that match interviewer name
    const [schedules] = await db.query(
      "SELECT * FROM interview_exam_schedule WHERE interviewer LIKE ?",
      [`%${query}%`],
    );

    if (schedules.length === 0) {
      return res.json([]);
    }

    // 2. For each schedule, attach applicants
    const results = await Promise.all(
      schedules.map(async (sched) => {
        const [applicants] = await db.query(
          `
          SELECT
            ia.applicant_id AS applicant_number,
            ia.email_sent,
            ia.status,
            p.person_id,
            p.last_name,
            p.first_name,
            p.middle_name,
            p.program,
            s.interviewer,
            s.building_description,
            s.room_description,
            s.day_description,
            s.start_time,
            s.end_time
          FROM interview_applicants ia
          JOIN applicant_numbering_table an
            ON ia.applicant_id = an.applicant_number
          JOIN person_table p
            ON an.person_id = p.person_id
          JOIN interview_exam_schedule s
            ON ia.schedule_id = s.schedule_id
          WHERE ia.schedule_id = ?
          `,
          [sched.schedule_id],
        );

        return { schedule: sched, applicants };
      }),
    );

    res.json(results);
  } catch (err) {
    console.error("❌ Error in /api/interviewers:", err);
    res.status(500).send("Server error");
  }
});

// 09/26/2025

// GET person details by student_number (Enrollment DB)
app.get("/api/person_id/:student_number", async (req, res) => {
  try {
    const [rows] = await db3.query(
      `SELECT
         p.*,
         sn.student_number
       FROM student_numbering_table sn
       JOIN person_table p ON p.person_id = sn.person_id
       WHERE sn.student_number = ?`,
      [req.params.student_number],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json(rows[0]); // ✅ full person data + student_number
  } catch (err) {
    console.error("Error fetching person by student_number:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ NEW: Get persons (Enrollment DB) with student_number
app.get("/api/enrollment_upload_documents", async (req, res) => {
  try {
    const [persons] = await db3.query(`
      SELECT
        p.person_id,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.profile_img,
        p.height,
        p.generalAverage,
        p.emailAddress,
        sn.student_number
      FROM person_table p
      LEFT JOIN student_numbering_table sn ON p.person_id = sn.person_id
    `);

    res.status(200).json(persons);
  } catch (error) {
    console.error("❌ Error fetching enrollment upload documents:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get person by person_id (Enrollment DB)
app.get("/api/enrollment_person/:person_id", async (req, res) => {
  try {
    const [rows] = await db3.query(
      `SELECT * FROM person_table WHERE person_id = ?`,
      [req.params.person_id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching enrollment person:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update person (Enrollment DB) safely
app.put("/api/enrollment_person/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove person_id from payload
    delete updates.person_id;

    // If nothing left, just skip
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.json({ message: "No valid fields to update, skipping." });
    }

    // Build SET clause dynamically
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field]);

    await db3.query(
      `UPDATE person_table SET ${setClause} WHERE person_id = ?`,
      [...values, id],
    );

    res.json({ message: "Enrollment person updated successfully" });
  } catch (err) {
    console.error("❌ Error updating enrollment person:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/student-person-data/:id", async (req, res) => {
  const { id } = req.params;
  console.log("id: ",)

  try {

    const [rows] = await db3.query(
      `SELECT snt.student_number, pt.* FROM student_numbering_table AS snt
      LEFT JOIN person_table AS pt ON snt.person_id = pt.person_id
      WHERE pt.person_id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.json(rows[0]);
    console.log("Person Data: ", rows[0])
  } catch (err) {
    console.error("Error fetching person data:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add near your other GET routes in server.js

// Get person_id by applicant_number
app.get("/api/person-by-applicant/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ? LIMIT 1",
      [applicant_number],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Applicant not found" });
    res.json({ person_id: rows[0].person_id });
  } catch (err) {
    console.error("Error fetching person by applicant:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/document_status/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT
         ru.document_status     AS upload_document_status,
         rt.id                  AS requirement_id,
         ua.email               AS evaluator_email,
         ua.role                AS evaluator_role,
         ua.employee_id         AS evaluator_employee_id,
         ua.first_name          AS evaluator_fname,
         ua.middle_name         AS evaluator_mname,
         ua.last_name           AS evaluator_lname,
         ru.created_at,
         ru.last_updated_by
       FROM applicant_numbering_table AS ant
       LEFT JOIN requirement_uploads AS ru
         ON ant.person_id = ru.person_id
       LEFT JOIN requirements_table AS rt
         ON ru.requirements_id = rt.id
       LEFT JOIN enrollment.user_accounts ua
         ON ru.last_updated_by = ua.person_id
       WHERE ant.applicant_number = ?
         AND rt.is_verifiable = 1
       ORDER BY ru.created_at DESC`,
      [applicant_number],
    );

    // 🟥 If no uploads found
    if (!rows || rows.length === 0) {
      return res.json({
        document_status: "On Process",
        evaluator: null,
      });
    }

    const statuses = rows.map((r) => r.upload_document_status);
    const latest = rows[0];

    // 🟡 Determine final document status
    let finalStatus = "On Process";
    if (statuses.every((s) => s === "Disapproved / Program Closed")) {
      finalStatus = "Disapproved / Program Closed";
    } else if (statuses.every((s) => s === "Documents Verified & ECAT")) {
      finalStatus = "Documents Verified & ECAT";
    }

    // 🟢 Build evaluator display name with employee ID
    // 🟢 Build evaluator display name with employee ID (no HTML tags)
    let actorEmail = null;
    let actorName = "Unknown - System";

    if (latest?.evaluator_email) {
      const role = latest.evaluator_role?.toUpperCase() || "UNKNOWN";
      const empId = latest.evaluator_employee_id
        ? `(${latest.evaluator_employee_id})`
        : "";
      const lname = latest.evaluator_lname || "";
      const fname = latest.evaluator_fname || "";
      const mname = latest.evaluator_mname || "";

      actorEmail = latest.evaluator_email;
      actorName = `${role} ${empId} - ${lname}, ${fname} ${mname}`.trim();
      latest.evaluator_display = `BY: ${actorName} (${actorEmail})`;
    } else {
      latest.evaluator_display = `BY: Unknown - System`;
    }

    // 📝 Create notification message
    const message = `✏️ Document status for Applicant #${applicant_number} set to "${finalStatus}"`;

    // // 💾 Insert notification (only if there's evaluator info)
    // await db.query(
    //   `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name)
    //    VALUES (?, ?, ?, ?, ?)`,
    //   ['update', message, applicant_number, actorEmail, actorName]
    // );

    // // 📢 Emit notification via socket.io
    // io.emit('notification', {
    //   type: 'update',
    //   message,
    //   applicant_number,
    //   actor_email: actorEmail,
    //   actor_name: actorName,
    //   timestamp: new Date().toISOString()
    // });

    return res.json({
      document_status: finalStatus,
      evaluator: latest,
    });
  } catch (err) {
    console.error("❌ Error fetching document status:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/api/document_status/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;
  const { document_status, user_id } = req.body;

  try {
    // ✅ 1. Get requirement IDs that should reflect in overall document_status
    const [verifiableReqs] = await db.query(
      `SELECT id FROM requirements_table WHERE is_verifiable = 1`,
    );

    const ids = verifiableReqs.map((r) => r.id);
    if (ids.length === 0) {
      return res
        .status(400)
        .json({ message: "No verifiable requirements found." });
    }

    // ✅ 2. Update only those requirements for the applicant
    await db.query(
      `UPDATE requirement_uploads
       SET document_status = ?,
           last_updated_by = ?
       WHERE person_id = (SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?)
       AND requirements_id IN (?)`,
      [document_status, user_id, applicant_number, ids],
    );

    res.json({
      message:
        "📌 Document status updated dynamically for verifiable requirements.",
    });
  } catch (err) {
    console.error("Error updating document status:", err);
    res.status(500).json({ error: "Failed to update document status" });
  }
});

// ✅ Dynamic: Check if applicant's required verifiable documents are verified
app.get("/api/document_status/check/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;

  try {
    // 1️⃣ Get person_id
    const [personResult] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
      [applicant_number],
    );

    if (personResult.length === 0) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const person_id = personResult[0].person_id;

    // 2️⃣ Dynamically fetch all verifiable “Regular” requirements
    const [reqRows] = await db.query(`
      SELECT id
      FROM requirements_table
      WHERE category = 'Regular'
      AND is_verifiable = 1
    `);

    if (reqRows.length === 0) {
      return res.json({
        verified: false,
        message: "No verifiable requirements found.",
      });
    }

    const requirementIds = reqRows.map((r) => r.id);
    const placeholders = requirementIds.map(() => "?").join(",");

    // 3️⃣ Get applicant’s uploaded documents for those requirements
    const [docs] = await db.query(
      `
        SELECT requirements_id, document_status
        FROM requirement_uploads
        WHERE person_id = ? AND requirements_id IN (${placeholders})
      `,
      [person_id, ...requirementIds],
    );

    if (docs.length < requirementIds.length) {
      return res.json({
        verified: false,
        message: "Missing required documents.",
      });
    }

    // 4️⃣ Check if all are “Documents Verified & ECAT”
    const allVerified = docs.every(
      (d) => d.document_status === "Documents Verified & ECAT",
    );

    res.json({
      verified: allVerified,
      person_id,
      required_count: requirementIds.length,
      verified_count: docs.filter(
        (d) => d.document_status === "Documents Verified & ECAT",
      ).length,
    });
  } catch (err) {
    console.error("Error checking document status:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ GET registrar name (or any prof by role)
app.get("/api/scheduled-by/:role", async (req, res) => {
  const { role } = req.params;

  try {
    const [rows] = await db3.query(
      `
      SELECT first_name, middle_name, last_name
      FROM user_accounts
      WHERE role = ?
      LIMIT 1
      `,
      [role],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No user found for that role" });
    }

    const { first_name, middle_name, last_name } = rows[0];
    const fullName =
      `${first_name || ""} ${middle_name ? middle_name + " " : ""}${last_name || ""}`.trim();

    res.json({ fullName });
  } catch (err) {
    console.error("❌ Error fetching user by role:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Toggle submitted_medical (1 = checked, 0 = unchecked)
app.put("/api/submitted-medical/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { submitted_medical, user_person_id } = req.body;

  try {
    // 1️⃣ Find person_id
    const [[row]] = await db.query(
      "SELECT person_id FROM requirement_uploads WHERE upload_id = ?",
      [upload_id],
    );
    if (!row) return res.status(404).json({ error: "Upload not found" });

    const person_id = row.person_id;

    // 2️⃣ Applicant info
    const [[appInfo]] = await db.query(
      `
      SELECT ant.applicant_number, pt.last_name, pt.first_name, pt.middle_name
      FROM applicant_numbering_table ant
      JOIN person_table pt ON ant.person_id = pt.person_id
      WHERE ant.person_id = ?
    `,
      [person_id],
    );

    const applicant_number = appInfo?.applicant_number || "Unknown";
    const fullName = `${appInfo?.last_name || ""}, ${appInfo?.first_name || ""} ${appInfo?.middle_name?.charAt(0) || ""}.`;

    // 3️⃣ Update submitted_medical
    await db.query(
      "UPDATE requirement_uploads SET submitted_medical = ? WHERE person_id = ?",
      [submitted_medical ? 1 : 0, person_id],
    );

    // 4️⃣ Create message
    const type = submitted_medical ? "submit_medical" : "unsubmit_medical";
    const action = submitted_medical
      ? "✅ Medical submitted"
      : "❌ Medical unsubmitted";
    const message = `${action} (Applicant #${applicant_number} - ${fullName})`;

    // ✅ Full actor info (same as exam/save)
    let actorEmail = "earistmis@gmail.com";
    let actorName = "SYSTEM";

    if (user_person_id) {
      const [actorRows] = await db3.query(
        `SELECT email, role, employee_id, last_name, first_name, middle_name
         FROM user_accounts
         WHERE person_id = ?
         LIMIT 1`,
        [user_person_id],
      );

      if (actorRows.length > 0) {
        const u = actorRows[0];
        const role = u.role?.toUpperCase() || "UNKNOWN";
        const empId = u.employee_id || "";
        const lname = u.last_name || "";
        const fname = u.first_name || "";
        const mname = u.middle_name || "";
        const email = u.email || "";

        actorEmail = email;
        actorName = `${role} (${empId}) - ${lname}, ${fname} ${mname}`.trim();
      }
    }

    // ✅ No duplicates per day (same logic as exam/save)
    await db.query(
      `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp)
       SELECT ?, ?, ?, ?, ?, NOW()
       FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications
         WHERE applicant_number = ?
           AND message = ?
           AND DATE(timestamp) = CURDATE()
       )`,
      [
        type,
        message,
        applicant_number,
        actorEmail,
        actorName,
        applicant_number,
        message,
      ],
    );

    // ✅ Socket emit
    io.emit("notification", {
      type,
      message,
      applicant_number,
      actor_email: actorEmail,
      actor_name: actorName,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message });
  } catch (err) {
    console.error("❌ Error toggling submitted medical:", err);
    res.status(500).json({ error: "Failed to toggle submitted medical" });
  }
});

app.get("/api/requirements", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, description FROM requirements_table ORDER BY id ASC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requirements" });
  }
});

app.get("/api/program_evaluation/:student_number", async (req, res) => {
  const { student_number } = req.params;

  try {
    const [rows] = await db3.query(
      `
        SELECT DISTINCT
          pt.gender, pt.birthOfDate, rt.id AS requirements, pt.last_name, pt.first_name, pt.schoolLastAttended, pt.profile_img AS profile_image, pt.yearGraduated - 1 AS previous_year, pt.yearGraduated, pt.middle_name, pgt.program_code, pgt.major, yt.year_description, pgt.program_description, snt.student_number, dpt.dprtmnt_name FROM enrolled_subject AS es
        LEFT JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
        LEFT JOIN person_table AS pt ON snt.person_id = pt.person_id
        LEFT JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
        LEFT JOIN program_table AS pgt ON cct.program_id = pgt.program_id
        LEFT JOIN year_table AS yt ON cct.year_id = yt.year_id
        LEFT JOIN dprtmnt_curriculum_table AS dct ON cct.curriculum_id = dct.curriculum_id
        LEFT JOIN dprtmnt_table AS dpt ON dct.dprtmnt_id = dpt.dprtmnt_id
        LEFT JOIN requirement_uploads AS ru ON pt.person_id = ru.person_id
        LEFT JOIN requirements_table AS rt ON ru.requirements_id = rt.id
        WHERE es.student_number = ?;
      `,
      [student_number],
    );

    if (rows.length === 0) {
      return res.status(404).send({ message: "Student is not found" });
    }

    const studentInfo = {
      ...rows[0], // keep the first row’s data
      requirements: [
        ...new Set(rows.map((r) => r.requirements).filter(Boolean)),
      ],
    };

    res.json(studentInfo);
    console.log(studentInfo);
  } catch (error) {
    console.log("Database Error", error);
    res.status(500).send({ message: "Database/Server Error", error });
  }
});

app.get("/registrar-users", async (req, res) => {
  try {
    const [users] = await db3.query(
      "SELECT * FROM user_accounts WHERE role = 'registrar'",
    );

    const filteredUsers = [];

    for (const user of users) {
      const [accessRows] = await db3.query(
        "SELECT page_id FROM page_access WHERE user_id = ? ORDER BY page_id ASC",
        [user.employee_id],
      );

      const userPageIds = accessRows
        .map((r) => r.page_id)
        .sort((a, b) => a - b);

      // 2️⃣ Strictly compare with registrar page access
      const registrarPages = [...ROLE_PAGE_ACCESS.registrar].sort(
        (a, b) => a - b,
      );

      const isExactMatch =
        userPageIds.length === registrarPages.length &&
        userPageIds.every((id, idx) => id === registrarPages[idx]);

      if (isExactMatch) {
        filteredUsers.push(user);
      }
    }

    res.json({ registrars: filteredUsers });
  } catch (error) {
    console.error("Error fetching registrar users:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

app.get("/api/my_schedule/:prof_id", async (req, res) => {
  const { prof_id } = req.params;
  console.log("Professor Id: ", prof_id);
  try {
    const sql = `
    SELECT rdt.description, rt.room_description, tt.school_time_start, tt.school_time_end, ct.course_code, pgt.program_code, st.description AS section  FROM time_table AS tt
    LEFT JOIN room_day_table AS rdt ON tt.room_day = rdt.id
    LEFT JOIN room_table AS rt ON tt.department_room_id = rt.room_id
    LEFT JOIN course_table AS ct ON tt.course_id = ct.course_id
    LEFT JOIN active_school_year_table AS sy ON tt.school_year_id = sy.id
    LEFT JOIN dprtmnt_section_table AS dst ON tt.department_section_id = dst.id
    LEFT JOIN curriculum_table AS cct ON dst.curriculum_id = cct.curriculum_id
    LEFT JOIN program_table AS pgt ON cct.program_id = pgt.program_id
    LEFT JOIN section_table AS st ON dst.section_id = st.id
    WHERE tt.professor_id = ? AND sy.astatus = 1;`;
    const [rows] = await db3.query(sql, [prof_id]);

    res.json(rows);
  } catch (err) {
    console.log("Internal Server Error");
  }
});

app.get("/api/program_evaluation/details/:student_number", async (req, res) => {
  const { student_number } = req.params;

  try {
    const [rows] = await db3.query(
      `
        SELECT
          es.id as enrolled_id,
          es.final_grade,
          es.component,
          ct.course_code,
          st.description as section,
          ct.course_description,
          ct.course_unit,
          ct.lab_unit,
          smt.semester_description,
          smt.semester_id,
          sy.id as school_year,
          ct.course_id,
          yt.year_description as current_year,
          yt.year_id,
          pgt.program_code,
          pgt.major,
          pgt.program_description,
          es.en_remarks,
          yt.year_description + 1 as next_year
        FROM enrolled_subject AS es
          LEFT JOIN course_table AS ct ON es.course_id = ct.course_id
          LEFT JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
          LEFT JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
          LEFT JOIN section_table AS st ON dst.section_id = st.id
          LEFT JOIN curriculum_table AS cct ON dst.curriculum_id = cct.curriculum_id
          LEFT JOIN program_table AS pgt ON cct.program_id = pgt.program_id
          LEFT JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
          LEFT JOIN year_table AS yt ON sy.year_id = yt.year_id
        WHERE es.student_number= ?;
    `,
      [student_number],
    );

    if (rows.length === 0) {
      return res.status(404).send({ message: "Student Data is not found" });
    }

    res.json(rows);
  } catch (err) {
    res.status(500).send({ message: "Student Data is not found" });
    console.log("Database / Server Error", err);
  }
});

// ✅ Upload and update registrar profile picture
app.put(
  "/api/update_profile_image/:person_id",
  upload.single("profileImage"),
  async (req, res) => {
    const { person_id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // ✅ Save filename in db3.user_accounts
      const [result] = await db3.query(
        `UPDATE user_accounts
       SET profile_picture = ?
       WHERE person_id = ?`,
        [file.filename, person_id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        message: "Profile picture updated successfully.",
        filename: file.filename,
      });
    } catch (err) {
      console.error("❌ Error updating profile picture:", err);
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  },
);



//11/29/2025 UPDATE
app.post("/insert_question", async (req, res) => {
  const {
    category,
    question,
    choice1,
    choice2,
    choice3,
    choice4,
    choice5,
    school_year_id,
  } = req.body;

  try {
    // Step 1: Insert question
    const [result] = await db3.query(
      `
      INSERT INTO question_table
      (category, question_description, first_choice, second_choice, third_choice, fourth_choice, fifth_choice)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [category, question, choice1, choice2, choice3, choice4, choice5],
    );

    // Step 2: Get the inserted question's ID
    const question_id = result.insertId;

    // Step 3: Insert into evaluation_table using that question_id
    await db3.query(
      `
      INSERT INTO evaluation_table (school_year_id, question_id)
      VALUES (?, ?)
      `,
      [school_year_id, question_id],
    );

    res.status(200).send({
      message: "Question successfully added and linked to evaluation!",
    });
  } catch (err) {
    console.error("Database / Server Error:", err);
    res.status(500).send({ message: "Database / Server Error", error: err });
  }
});

//11/29/2025 UPDATE
app.post("/insert_category", async (req, res) => {
  const { title, description } = req.body;

  try {
    // Step 1: Insert question
    const [result] = await db3.query(
      `
      INSERT INTO question_category_table (title, description) VALUES (?, ?)
      `,
      [title, description],
    );

    res.status(200).send({ message: "Category Created" });
  } catch (err) {
    console.error("Database / Server Error:", err);
    res.status(500).send({ message: "Database / Server Error", error: err });
  }
});

//11/29/2025 UPDATE
app.get("/get_category", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT * FROM question_category_table
    `);
    res.status(200).send(rows);
  } catch (err) {
    console.error("Database / Server Error:", err);
    res.status(500).send({ message: "Database / Server Error", error: err });
  }
});

//11/29/2025 UPDATE
app.put("/update_category/:id", async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;

  try {
    const updateQuery = `
      UPDATE question_category_table
      SET
        title = ?,
        description = ?
      WHERE id = ?
    `;
    await db3.query(updateQuery, [title, description, id]);
    res.status(200).send({ message: "Question successfully updated" });
  } catch (err) {
    console.error("Database / Server Error:", err);
    res.status(500).send({ message: "Database / Server Error", error: err });
  }
});

//11/29/2025 UPDATE
app.get("/get_questions", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT qt.category, qt.question_description, qt.first_choice, qt.second_choice, qt.third_choice, qt.fourth_choice, qt.fifth_choice, qt.id AS question_id, sy.year_id, sy.semester_id, sy.id as school_year, et.created_at FROM question_table AS qt
      INNER JOIN evaluation_table AS et ON qt.id = et.question_id
      INNER JOIN active_school_year_table AS sy ON et.school_year_id = sy.id
      ORDER BY qt.id ASC;
    `);
    res.status(200).send(rows);
  } catch (err) {
    console.error("Database / Server Error:", err);
    res.status(500).send({ message: "Database / Server Error", error: err });
  }
});

//11/29/2025 UPDATE
app.put("/update_question/:id", async (req, res) => {
  const { category, question, choice1, choice2, choice3, choice4, choice5 } =
    req.body;
  const { id } = req.params;

  try {
    const updateQuery = `
      UPDATE question_table
      SET
        category = ?,
        question_description = ?,
        first_choice = ?,
        second_choice = ?,
        third_choice = ?,
        fourth_choice = ?,
        fifth_choice = ?
      WHERE id = ?;
    `;
    await db3.query(updateQuery, [
      category,
      question,
      choice1,
      choice2,
      choice3,
      choice4,
      choice5,
      id,
    ]);
    res.status(200).send({ message: "Question successfully updated" });
  } catch (err) {
    console.error("Database / Server Error:", err);
    res.status(500).send({ message: "Database / Server Error", error: err });
  }
});

//11/29/2025 UPDATE
app.get("/get_questions_for_evaluation", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT qt.category, qct.title, qct.description as meaning, qt.question_description, qt.first_choice, qt.second_choice, qt.third_choice, qt.fourth_choice, qt.fifth_choice, qt.id AS question_id, sy.year_id, sy.semester_id, sy.id as school_year, et.created_at FROM question_table AS qt
      INNER JOIN evaluation_table AS et ON qt.id = et.question_id
      INNER JOIN active_school_year_table AS sy ON et.school_year_id = sy.id
      INNER JOIN question_category_table AS qct ON qt.category = qct.id
      WHERE sy.astatus = 1 ORDER BY qt.id ASC;
    `);
    console.log(rows);
    res.status(200).send(rows);
  } catch (err) {
    console.error("Database / Server Error:", err);
    res.status(500).send({ message: "Database / Server Error", error: err });
  }
});

app.post("/api/student_evaluation", async (req, res) => {
  const {
    student_number,
    school_year_id,
    prof_id,
    course_id,
    question_id,
    answer,
  } = req.body;

  try {
    await db3.execute(
      `
      INSERT INTO student_evaluation_table
      (student_number, school_year_id, prof_id, course_id, question_id, question_answer)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [student_number, school_year_id, prof_id, course_id, question_id, answer],
    );

    await db3.execute(
      `
      UPDATE enrolled_subject
      SET fe_status = 1
      WHERE student_number = ? AND course_id = ? AND active_school_year_id = ?
      `,
      [student_number, course_id, school_year_id],
    );

    res.status(200).send({ message: "Evaluation successfully recorded!" });
  } catch (err) {
    console.error("Database / Server Error:", err);
    res
      .status(500)
      .send({ message: "Database / Server Error", error: err.message });
  }
});

app.get("/api/applicant-status/:applicant_id", async (req, res) => {
  const { applicant_id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT status FROM interview_applicants WHERE applicant_id = ? LIMIT 1",
      [applicant_id],
    );

    if (rows.length === 0) {
      return res.json({ found: false, message: "Applicant not found" });
    }

    res.json({ found: true, status: rows[0].status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/applicant-scores/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;

  try {
    // Get person_id
    const [personRow] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ? LIMIT 1",
      [applicant_number],
    );

    if (!personRow.length) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const person_id = personRow[0].person_id;

    // 1️⃣ Get Admission Exam Score
    const [examRow] = await db.query(
      "SELECT final_rating FROM admission_exam WHERE person_id = ? LIMIT 1",
      [person_id],
    );

    const entrance_exam_score = examRow.length ? examRow[0].final_rating : null;

    // 2️⃣ Get Qualifying & Interview Results
    const [statusRow] = await db.query(
      `SELECT qualifying_result, interview_result
       FROM person_status_table
       WHERE person_id = ? LIMIT 1`,
      [person_id],
    );

    const qualifying_result = statusRow.length
      ? statusRow[0].qualifying_result
      : null;
    const interview_result = statusRow.length
      ? statusRow[0].interview_result
      : null;

    res.json({
      entrance_exam_score,
      qualifying_result,
      interview_result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching scores" });
  }
});

app.get("/api/applicant-has-score/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM applicant_numbering_table WHERE applicant_number = ? LIMIT 1",
      [applicant_number],
    );

    if (rows.length > 0) {
      res.json({ hasScore: true, score: rows[0] });
    } else {
      res.json({ hasScore: false });
    }
  } catch (err) {
    console.error("Error checking applicant score:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ✅ CHECK IF APPLICANT IS QUALIFIED FOR INTERVIEW / QUALIFYING EXAM (NO PASSING SCORE)
app.get(
  "/api/applicant-qualified-interview/:applicant_number",
  async (req, res) => {
    const { applicant_number } = req.params;

    try {
      // 1️⃣ Get person_id from applicant_numbering_table
      const [personRows] = await db.query(
        "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ? LIMIT 1",
        [applicant_number],
      );

      if (personRows.length === 0) {
        return res
          .status(404)
          .json({ qualified: false, message: "Applicant not found." });
      }

      const person_id = personRows[0].person_id;

      // 2️⃣ Check if applicant has exam record in admission_exam table
      const [examRows] = await db.query(
        "SELECT final_rating FROM admission_exam WHERE person_id = ? LIMIT 1",
        [person_id],
      );

      if (examRows.length === 0) {
        return res.json({
          qualified: false,
          message:
            "❌ Applicant has no entrance exam score yet — not qualified for interview.",
        });
      }

      // 3️⃣ If applicant has any exam record, they are qualified
      const finalRating = examRows[0].final_rating;

      res.json({
        qualified: true,
        person_id,
        final_rating: finalRating,
        message:
          "✅ Applicant is qualified to take the Qualifying / Interview Exam.",
      });
    } catch (err) {
      console.error("Error checking interview qualification:", err);
      res.status(500).json({
        qualified: false,
        message: "Server error while checking qualification.",
      });
    }
  },
);

// ✅ Fetch Qualifying, Interview, and Exam Results by Person ID
app.get("/api/person_status/:person_id", async (req, res) => {
  const { person_id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT qualifying_result, interview_result, exam_result
      FROM person_status_table
      WHERE person_id = ?
      LIMIT 1
      `,
      [person_id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No status record found for this person" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching person_status:", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/get_prof_data/:id", async (req, res) => {
  const id = req.params.id;

  const query = `
    SELECT pt.prof_id, pt.person_id, pt.profile_image, pt.email, pt.fname, pt.mname, pt.lname, pt.employee_id FROM prof_table AS pt
    WHERE pt.person_id = ?
  `;

  try {
    const [rows] = await db3.query(query, [id]);
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATED
app.get("/api/faculty_evaluation", async (req, res) => {
  const { prof_id, year_id, semester_id } = req.query;

  try {
    const [rows] = await db3.query(
      `
      SELECT
        pt.prof_id,
        st.course_id,
        ct.course_code,
        st.question_id,
        qt.question_description,
        sy.year_id,
        sy.semester_id,

        SUM(CASE WHEN st.question_answer = 1 THEN 1 ELSE 0 END) AS answered_one_count,
        SUM(CASE WHEN st.question_answer = 2 THEN 1 ELSE 0 END) AS answered_two_count,
        SUM(CASE WHEN st.question_answer = 3 THEN 1 ELSE 0 END) AS answered_three_count,
        SUM(CASE WHEN st.question_answer = 4 THEN 1 ELSE 0 END) AS answered_four_count,
        SUM(CASE WHEN st.question_answer = 5 THEN 1 ELSE 0 END) AS answered_five_count

      FROM student_evaluation_table AS st
      INNER JOIN prof_table AS pt ON st.prof_id = pt.prof_id
      INNER JOIN active_school_year_table AS sy ON st.school_year_id = sy.id
      INNER JOIN question_table AS qt ON st.question_id = qt.id
      INNER JOIN course_table AS ct ON st.course_id = ct.course_id

      WHERE pt.prof_id = ? AND sy.year_id = ? AND sy.semester_id = ?

      GROUP BY st.course_id, st.question_id, pt.prof_id
      ORDER BY st.course_id, st.question_id;
      `,
      [prof_id, year_id, semester_id],
    );
    console.log(rows);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching evaluation:", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/insert-logs/faculty/:prof_id", async (req, res) => {
  const { prof_id } = req.params;
  const { message, type } = req.body;

  try {
    const [professorData] = await db3.query(
      "SELECT * FROM prof_table WHERE prof_id = ?",
      [prof_id],
    );

    if (professorData === 0) {
      res.status(400).send({ message: "No Data found" });
    }

    const prof = professorData[0];
    const profID = prof.prof_id;
    const fullName = `${prof.lname}, ${prof.fname} ${prof.mname}`;
    const email = prof.email;

    await db.query(
      `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [type, message, profID, email, fullName],
    );

    res.json({ success: true, message: "Log inserted" });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/verification-status/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;

  try {
    // ✅ Step 1: Get person_id from applicant_number
    const [personRows] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
      [applicant_number],
    );
    if (personRows.length === 0) {
      return res.json({ verified: false, reason: "Applicant not found" });
    }

    const personId = personRows[0].person_id;

    // ✅ Step 2: Count how many verifiable requirements exist
    const [requirements] = await db.query(
      "SELECT COUNT(*) AS total_required FROM requirements_table WHERE is_verifiable = 1",
    );
    const totalRequired = requirements[0]?.total_required || 0;

    // ✅ Step 3: Count how many of those requirements were submitted & verified
    const [verifiedUploads] = await db.query(
      `
      SELECT COUNT(DISTINCT requirements_id) AS total_verified
      FROM requirement_uploads
      WHERE person_id = ?
      AND document_status = 'Documents Verified & ECAT'
      `,
      [personId],
    );
    const totalVerified = verifiedUploads[0]?.total_verified || 0;

    // ✅ Step 4: Check if applicant has an exam schedule
    const [schedule] = await db.query(
      `
      SELECT ees.*
      FROM exam_applicants ea
      JOIN entrance_exam_schedule ees ON ea.schedule_id = ees.schedule_id
      WHERE ea.applicant_id = ?
      `,
      [applicant_number],
    );
    const hasSchedule = schedule.length > 0;

    // ✅ Step 5: Determine if verified
    const fullyVerified = totalVerified >= totalRequired && hasSchedule;

    res.json({
      verified: fullyVerified,
      totalRequired,
      totalVerified,
      hasSchedule,
    });
  } catch (error) {
    console.error("Error checking applicant verification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/student_data_as_applicant/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [[person]] = await db3.query(
      `
      SELECT *
      FROM enrollment.person_table
      WHERE person_id = ?
      `,
      [id]
    );

    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    // Get applicant number
    const [[applicant]] = await db.query(
      `
      SELECT applicant_number
      FROM applicant_numbering_table
      WHERE person_id = ?
      `,
      [person.person_id]
    );

    // Merge applicant_number into person object
    person.applicant_number = applicant ? applicant.applicant_number : null;

    // Get latest document status + evaluator
    const [rows] = await db.query(
      `
      SELECT
        ru.document_status AS upload_document_status,
        rt.id AS requirement_id,
        ua.email AS evaluator_email,
        ua.role AS evaluator_role,
        pr.fname AS evaluator_fname,
        pr.mname AS evaluator_mname,
        pr.lname AS evaluator_lname,
        ru.created_at,
        ru.last_updated_by
      FROM enrollment.requirement_uploads AS ru
      LEFT JOIN enrollment.requirements_table AS rt 
        ON ru.requirements_id = rt.id
      LEFT JOIN enrollment.user_accounts ua 
        ON ru.last_updated_by = ua.person_id
      LEFT JOIN enrollment.prof_table pr   
        ON ua.person_id = pr.person_id
      WHERE ru.person_id = ?
      ORDER BY ru.created_at DESC
      LIMIT 1
      `,
      [person.person_id]
    );

    if (rows.length > 0) {
      person.document_status = rows[0].upload_document_status || "On process";
      person.evaluator = rows[0];
    } else {
      person.document_status = "On process";
      person.evaluator = null;
    }

    res.json(person);

  } catch (err) {
    console.error("❌ Error fetching person_with_applicant:", err);
    res.status(500).json({ error: "Failed to fetch person" });
  }
});

// ✅ UPDATE person_table in ENROLLMENT DB3
app.put("/api/enrollment_person/:person_id", async (req, res) => {
  try {
    const { person_id } = req.params;
    const updateData = req.body;

    if (!person_id) {
      return res.status(400).json({ error: "Missing person_id" });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    // Remove unsafe fields if present
    delete updateData.person_id;
    delete updateData.created_at;
    delete updateData.current_step;

    // Build dynamic SET fields
    const fields = Object.keys(updateData)
      .map((field) => `${field} = ?`)
      .join(", ");

    const values = Object.values(updateData);

    // Execute update query
    const query = `
            UPDATE person_table
            SET ${fields}
            WHERE person_id = ?
        `;

    values.push(person_id);

    const [result] = await db3.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    return res.json({
      message: "Person updated successfully",
      updated: updateData,
    });
  } catch (error) {
    console.error("❌ Error updating enrollment person:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/uploads/by-student/:student_number", async (req, res) => {
  const student_number = req.params.student_number;

  try {
    const [personResult] = await db3.query(
      "SELECT person_id FROM student_numbering_table WHERE student_number = ?",
      [student_number],
    );

    if (personResult.length === 0) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const person_id = personResult[0].person_id;

    const [uploads] = await db3.query(
      `
      SELECT
        ru.upload_id,
        ru.requirements_id,
        ru.person_id,
        ru.file_path,
        ru.original_name,
        ru.remarks,
        ru.status,
        ru.document_status,
        ru.registrar_status,
        ru.created_at,
        rt.description,
        CASE
          WHEN LOWER(rt.description) LIKE '%form 138%' THEN 'Form138'
          WHEN LOWER(rt.description) LIKE '%good moral%' THEN 'GoodMoralCharacter'
          WHEN LOWER(rt.description) LIKE '%birth certificate%' THEN 'BirthCertificate'
          WHEN LOWER(rt.description) LIKE '%graduating class%' THEN 'CertificateOfGraduatingClass'
          WHEN LOWER(rt.description) LIKE '%vaccine card%' THEN 'VaccineCard'
          ELSE 'Unknown'
        END AS short_label,
        ua.email AS evaluator_email,
        ua.role  AS evaluator_role,
        pr.lname AS evaluator_lname,
        pr.fname AS evaluator_fname,
        pr.mname AS evaluator_mname
      FROM requirement_uploads ru
      JOIN requirements_table rt
        ON ru.requirements_id = rt.id
      LEFT JOIN user_accounts ua
        ON ru.last_updated_by = ua.person_id
      LEFT JOIN .prof_table pr
        ON ua.person_id = pr.person_id
      WHERE ru.person_id = ?;
    `,
      [person_id],
    );

    res.status(200).json(uploads);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
});

app.get("/api/document_status/:student_number", async (req, res) => {
  const { student_number } = req.params;

  try {
    const [rows] = await db3.query(
      `SELECT
         ru.document_status     AS upload_document_status,
         rt.id                  AS requirement_id,
         ua.email               AS evaluator_email,
         ua.role                AS evaluator_role,
         ua.employee_id         AS evaluator_employee_id,
         ua.first_name          AS evaluator_fname,
         ua.middle_name         AS evaluator_mname,
         ua.last_name           AS evaluator_lname,
         ru.created_at,
         ru.last_updated_by
       FROM student_numbering_table AS snt
       LEFT JOIN requirement_uploads AS ru ON snt.person_id = ru.person_id
       LEFT JOIN requirements_table AS rt ON ru.requirements_id = rt.id
       LEFT JOIN enrollment.user_accounts ua ON ru.last_updated_by = ua.person_id
       WHERE snt.student_number = ? AND rt.is_verifiable = 1
       ORDER BY ru.created_at DESC`,
      [student_number],
    );

    // 🟥 If no uploads found
    if (!rows || rows.length === 0) {
      return res.json({
        document_status: "On Process",
        evaluator: null,
      });
    }

    const statuses = rows.map((r) => r.upload_document_status);
    const latest = rows[0];

    // 🟡 Determine final document status
    let finalStatus = "On Process";
    if (statuses.every((s) => s === "Disapproved / Program Closed")) {
      finalStatus = "Disapproved / Program Closed";
    } else if (statuses.every((s) => s === "Documents Verified & ECAT")) {
      finalStatus = "Documents Verified & ECAT";
    }

    // 🟢 Build evaluator display name with employee ID
    // 🟢 Build evaluator display name with employee ID (no HTML tags)
    let actorEmail = null;
    let actorName = "Unknown - System";

    if (latest?.evaluator_email) {
      const role = latest.evaluator_role?.toUpperCase() || "UNKNOWN";
      const empId = latest.evaluator_employee_id
        ? `(${latest.evaluator_employee_id})`
        : "";
      const lname = latest.evaluator_lname || "";
      const fname = latest.evaluator_fname || "";
      const mname = latest.evaluator_mname || "";

      actorEmail = latest.evaluator_email;
      actorName = `${role} ${empId} - ${lname}, ${fname} ${mname}`.trim();
      latest.evaluator_display = `BY: ${actorName} (${actorEmail})`;
    } else {
      latest.evaluator_display = `BY: Unknown - System`;
    }

    // 📝 Create notification message
    const message = `✏️ Document status for Student #${student_number} set to "${finalStatus}"`;

    // 💾 Insert notification (only if there's evaluator info)
    await db.query(
      `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name)
       VALUES (?, ?, ?, ?, ?)`,
      ["update", message, student_number, actorEmail, actorName],
    );

    // 📢 Emit notification via socket.io
    io.emit("notification", {
      type: "update",
      message,
      student_number,
      actor_email: actorEmail,
      actor_name: actorName,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      document_status: finalStatus,
      evaluator: latest,
    });
  } catch (err) {
    console.error("❌ Error fetching document status:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/student_upload_documents_data", async (req, res) => {
  try {
    const [persons] = await db3.query(`
      SELECT
        pt.person_id,
        pt.first_name,
        pt.middle_name,
        pt.last_name,
        pt.profile_img,
        pt.height,
        pt.generalAverage1,
        pt.emailAddress,
        snt.student_number
      FROM person_table pt
      LEFT JOIN student_numbering_table snt ON pt.person_id = snt.person_id
    `);

    res.status(200).json(persons);
  } catch (error) {
    console.error("❌ Error fetching upload documents:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/uploads/student/remarks/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { status, remarks, document_status, user_id } = req.body;

  try {
    await db3.query(
      `UPDATE requirement_uploads
       SET status = ?, remarks = ?, document_status = ?, last_updated_by = ?
       WHERE upload_id = ?`,
      [status, remarks || null, document_status || null, user_id, upload_id],
    );

    res.json({ message: "Document status updated successfully." });
  } catch (err) {
    console.error("Error updating document status:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/student/upload", upload.single("file"), async (req, res) => {
  const { requirements_id, person_id, remarks } = req.body;

  if (!requirements_id || !person_id || !req.file) {
    return res.status(400).json({ error: "Missing required fields or file" });
  }

  try {
    // 🔹 Applicant info
    const [[appInfo]] = await db3.query(
      `
      SELECT snt.student_number, pt.last_name, pt.first_name, pt.middle_name
      FROM student_numbering_table snt
      LEFT JOIN person_table pt ON snt.person_id = pt.person_id
      WHERE snt.person_id = ?
    `,
      [person_id],
    );

    const student_number = appInfo?.student_number || "Unknown";
    const fullName = `${appInfo?.last_name || ""}, ${appInfo?.first_name || ""} ${appInfo?.middle_name?.charAt(0) || ""}.`;

    // 🔹 Requirement description + short label
    const [descRows] = await db3.query(
      "SELECT description, short_label FROM requirements_table WHERE id = ?",
      [requirements_id],
    );

    if (!descRows.length)
      return res.status(404).json({ message: "Requirement not found" });

    const { description, short_label } = descRows[0];

    // ✅ Use the short_label directly from DB
    const shortLabel = short_label || "Unknown";

    const year = new Date().getFullYear();
    const ext = path.extname(req.file.originalname).toLowerCase();

    // ✅ Construct filename
    const filename = `${applicant_number}_${shortLabel}_${year}${ext}`;
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const finalPath = path.join(uploadDir, filename);

    // 🔹 Delete any existing file for the same applicant + requirement
    const [existingFiles] = await db3.query(
      `SELECT upload_id, file_path FROM requirement_uploads
       WHERE person_id = ? AND requirements_id = ?`,
      [person_id, requirements_id],
    );

    for (const file of existingFiles) {
      const oldPath = path.join(__dirname, "uploads", file.file_path);

      try {
        await fs.promises.unlink(oldPath);
      } catch (err) {
        if (err.code !== "ENOENT")
          console.warn("File delete warning:", err.message);
      }

      await db3.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [
        file.upload_id,
      ]);
    }

    // 🔹 Save new file
    await fs.promises.writeFile(finalPath, req.file.buffer);

    await db3.query(
      `INSERT INTO requirement_uploads
        (requirements_id, person_id, file_path, original_name, status, remarks)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [
        requirements_id,
        person_id,
        filename,
        req.file.originalname,
        remarks || null,
      ],
    );

    res.status(201).json({ message: "✅ Upload successful" });
  } catch (err) {
    console.error("Upload error:", err);
    res
      .status(500)
      .json({ error: "Failed to save upload", details: err.message });
  }
});

app.delete("/admin/uploads/:uploadId", async (req, res) => {
  const { uploadId } = req.params;

  try {
    // 1️⃣ Get upload row (file + person_id)
    const [uploadRows] = await db3.query(
      "SELECT person_id, file_path FROM requirement_uploads WHERE upload_id = ?",
      [uploadId],
    );
    if (!uploadRows.length) {
      return res.status(404).json({ error: "Upload not found." });
    }

    const { person_id: personId, file_path: filePath } = uploadRows[0];

    // 2️⃣ Student info
    const [[appInfo]] = await db3.query(
      `
      SELECT snt.student_number, pt.last_name, pt.first_name, pt.middle_name
      FROM student_numbering_table snt
      LEFT JOIN person_table pt ON snt.person_id = pt.person_id
      WHERE snt.person_id = ?;
    `,
      [personId],
    );

    const student_number = appInfo?.student_number || "Unknown";
    const fullName = `${appInfo?.last_name || ""}, ${appInfo?.first_name || ""} ${appInfo?.middle_name?.charAt(0) || ""}.`;

    // 3️⃣ Actor (admin performing the action)
    const user_person_id = req.headers["x-person-id"];
    const { actorEmail, actorName } = await getActorInfo(user_person_id);

    // 4️⃣ Delete physical file
    if (filePath) {
      const fullPath = path.join(applicantDocsDir, filePath);

      try {
        await fs.promises.unlink(fullPath);
        console.log("🗑️ File deleted:", fullPath);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.warn("⚠️ File already missing:", fullPath);
        } else {
          console.error("File delete error:", err);
        }
      }
    }

    // 5️⃣ Delete DB record
    await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [
      uploadId,
    ]);

    // 6️⃣ Log notification
    const message = `🗑️ Deleted document (Applicant #${student_number} - ${fullName})`;
    await db.query(
      "INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp) VALUES (?, ?, ?, ?, ?, NOW())",
      ["delete", message, student_number, actorEmail, actorName],
    );

    io.emit("notification", {
      type: "delete",
      message,
      student_number,
      actor_email: actorEmail,
      actor_name: actorName,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ message: "✅ Upload deleted successfully." });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete the upload." });
  }
});

// app.get("/api/get_applicant_account_id/:person_id", async (req, res) => {
//   const { person_id } = req.params;
//   try {
//     const [rows] = await db.query(
//       "SELECT user_id FROM user_accounts WHERE person_id = ? LIMIT 1",
//       [person_id]
//     );
//     if (rows.length === 0) return res.status(404).json({ message: "User not found" });
//     res.json({ user_account_id: rows[0].user_id });
//   } catch (err) {
//     console.error("❌ Error fetching user_account_id:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.post(
  "/update_applicant/:user_id",
  profileUpload.single("profile_picture"),
  async (req, res) => {
    const { user_id } = req.params;
    const data = req.body;
    const file = req.file;

    try {
      // Get user info
      const [existing] = await db.query(
        "SELECT * FROM user_accounts WHERE user_id = ?",
        [user_id],
      );
      if (existing.length === 0)
        return res.status(404).json({ message: "User not found" });
      const applicant_person_id = existing[0].person_id;

      // Get applicant_number
      const [applicant] = await db.query(
        "SELECT * FROM applicant_numbering_table WHERE person_id = ?",
        [applicant_person_id],
      );
      if (applicant.length === 0)
        return res.status(404).json({ message: "Applicant not found" });
      const applicant_number = applicant[0].applicant_number;

      // Get current profile
      const [datas] = await db.query(
        "SELECT * FROM person_table WHERE person_id = ?",
        [applicant_person_id],
      );
      const current = datas[0];

      let finalFilename = current.profile_img;

      if (file) {
        const a_id = applicant_number || "unknown";

        const philTime = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Manila",
        });
        const year = new Date(philTime).getFullYear();

        const ext = path.extname(file.originalname).toLowerCase();
        finalFilename = `${a_id}_1by1_${year}${ext}`;

        // ✅ New folder: uploads/Applicant1by1
        const uploadDir = path.join(__dirname, "uploads", "Applicant1by1");
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });

        const tempPath = path.join(__dirname, "uploads", file.filename); // temp file multer stored
        const newPath = path.join(uploadDir, finalFilename);

        // Delete old file if exists
        if (current.profile_img) {
          const oldPath = path.join(uploadDir, current.profile_img);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        // Move temp file to new folder
        fs.renameSync(tempPath, newPath);
      }

      // Update DB
      const sql = `UPDATE person_table SET profile_img = ? WHERE person_id = ?`;
      const [updated] = await db.query(sql, [
        finalFilename,
        applicant_person_id,
      ]);

      res.json({
        success: true,
        message: "Applicant updated successfully!",
        updated,
      });
    } catch (error) {
      console.error("❌ Error updating applicant:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// ---------------- Get total required count ----------------
app.get("/total-requirements", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS total FROM requirements_table WHERE is_verifiable = 1",
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get total requirements" });
  }
});

app.get("/api/get_prof_account_id/:person_id", async (req, res) => {
  const { person_id } = req.params;
  try {
    const [rows] = await db3.query(
      "SELECT prof_id FROM prof_table WHERE person_id = ? LIMIT 1",
      [person_id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ user_account_id: rows[0].prof_id });
  } catch (err) {
    console.error("❌ Error fetching uproft_id:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(
  "/update_faculty/:id",
  profileUpload.single("profile_picture"),
  async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    try {
      const [existing] = await db3.query(
        "SELECT * FROM prof_table WHERE prof_id = ?",
        [id],
      );
      if (existing.length === 0)
        return res.status(404).json({ message: "Faculty not found" });

      const current = existing[0];

      let finalFilename = current.profile_image; // fallback to existing if no new file

      if (file) {
        // ✅ Get employee_id for filename
        const employee_id = current.prof_id || "unknown";

        // ✅ Get current Philippine year
        const philTime = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Manila",
        });
        const year = new Date(philTime).getFullYear();

        // ✅ Build final filename
        const ext = path.extname(file.originalname).toLowerCase();
        finalFilename = `2${current.person_id}${employee_id}_profile_image_${year}${ext}`;

        // ✅ Paths
        const uploadDir = path.join(__dirname, "uploads");
        const tempPath = path.join(uploadDir, file.filename);
        const newPath = path.join(uploadDir, finalFilename);

        // ✅ Delete old image if exists
        if (current.profile_image) {
          const oldPath = path.join(uploadDir, current.profile_image);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        // ✅ Rename temp file to proper name
        fs.renameSync(tempPath, newPath);
      }

      // ✅ Update registrar data in DB
      const updated = {
        profile_picture: finalFilename,
      };

      const sql = `
      UPDATE prof_table
      SET profile_image=?
      WHERE prof_id=?`;
      const values = [updated.profile_picture, id];

      await db3.query(sql, values);

      res.json({
        success: true,
        message: "Faculty updated successfully!",
        updated,
      });
    } catch (error) {
      console.error("❌ Error updating faculty:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.put(
  "/api/update_prof_profile_image/:person_id",
  profileUpload.single("profileImage"),
  async (req, res) => {
    const { person_id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = req.file.filename;

    try {
      // Update DB (set filename to the same name we saved)
      const [result] = await db3.query(
        "UPDATE prof_table SET profile_image = ? WHERE person_id = ?",
        [filename, person_id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Person not found" });
      }

      res.json({
        message: "✅ Profile image updated successfully",
        filename,
      });
    } catch (err) {
      console.error("❌ DB Error:", err);
      res.status(500).json({ error: "Database update failed" });
    }
  },
);

app.post(
  "/update_student/:user_id",
  profileUpload.single("profile_picture"),
  async (req, res) => {
    const { user_id } = req.params;
    const data = req.body;
    const file = req.file;

    try {
      const [existing] = await db3.query(
        "SELECT * FROM user_accounts WHERE id = ?",
        [user_id],
      );
      if (existing.length === 0)
        return res.status(404).json({ message: "User not found" });
      const student_person_id = existing[0].person_id;

      const [student] = await db3.query(
        "SELECT * FROM student_numbering_table WHERE person_id = ?",
        [student_person_id],
      );

      if (student.length === 0)
        return res.status(404).json({ message: "Student not found" });
      const student_number = student[0].student_number;

      const [datas] = await db3.query(
        "SELECT * FROM person_table WHERE person_id = ?",
        [student_person_id],
      );
      const current = datas[0];

      let finalFilename = current.profile_img;

      if (file) {
        const s_id = student_number || "unknown";

        const philTime = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Manila",
        });
        const year = new Date(philTime).getFullYear();

        const ext = path.extname(file.originalname).toLowerCase();
        finalFilename = `${s_id}_profile_image_${year}${ext}`;

        const uploadDir = path.join(__dirname, "uploads");
        const tempPath = path.join(uploadDir, file.filename);
        const newPath = path.join(uploadDir, finalFilename);

        if (current.profile_img) {
          const oldPath = path.join(uploadDir, current.profile_img);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        fs.renameSync(tempPath, newPath);
      }

      const sql = `
      UPDATE person_table SET profile_img = ? WHERE person_id = ?
    `;

      const [updated] = await db3.query(sql, [
        finalFilename,
        student_person_id,
      ]);

      res.json({
        success: true,
        message: "Student updated successfully!",
        updated,
      });
    } catch (error) {
      console.error("❌ Error updating student:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// ✅ Check if applicant already has a student number
app.get("/api/student_status/:person_id", async (req, res) => {
  const { person_id } = req.params;
  try {
    const [applicantEmail] = await db.query(
      `SELECT emailAddress FROM person_table WHERE person_id = ?`, [person_id]
    )

    if(applicantEmail.length === 0) {
      return res.status(500).json({message: "Email Address not found"})
    }

    const [studentPersonID] = await db3.query(
      `SELECT person_id FROM person_table WHERE emailAddress = ?`, [applicantEmail[0].emailAddress]
    );

    if(studentPersonID.length === 0) {
      return res.status(500).json({message: "Person Id of this email is not found"})
    }

    const [rows] = await db3.query(
      "SELECT student_number FROM student_numbering_table WHERE person_id = ?",
      [studentPersonID[0].person_id],
    );

    if (rows.length > 0 && rows[0].student_number) {
      res.json({
        hasStudentNumber: true,
        student_number: rows[0].student_number,
      });
    } else {
      res.json({ hasStudentNumber: false });
    }
  } catch (error) {
    console.error("❌ Error checking student number:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Count how many registrar roles exist
app.get("/api/registrar_count", async (req, res) => {
  try {
    const [rows] = await db3.query(
      "SELECT COUNT(*) AS count FROM user_accounts WHERE role = 'registrar'",
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error("Error fetching registrar count:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching registrar count" });
  }
});

app.get("/api/all-persons", (req, res) => {
  db.query(
    "SELECT person_id, last_name, first_name, middle_name FROM person_table",
    (err, result) => {
      if (err) {
        console.error("Error fetching persons:", err);
        return res.status(500).json({ error: "Failed to fetch persons" });
      }
      res.json(result);
    },
  );
});

app.get("/api/person/student/:storedID", async (req, res) => {
  const id = req.params.storedID;

  try {
    const [personRows] = await db3.query(
      `SELECT emailAddress FROM person_table WHERE person_id = ? `, [id]
    );

    const personEmail = personRows[0].emailAddress

    const sql = `
      SELECT p.*, a.applicant_number
      FROM person_table p
      LEFT JOIN applicant_numbering_table a
      ON p.person_id = a.person_id
      WHERE p.emailAddress = ?
    `;

    const [rows] = await db.query(sql, [personEmail])
    console.log("Person Data: ", rows)

    res.status(200).json({ message: "Successfully  etch student record from admission", rows })
  } catch (err) {
    console.error("Error fetching registrar count:", error);
    res.status(500).json({ message: "Server error while fetching registrar count" });
  }
});

// ---------------------- ALL FILTERING FOR ADMISSION DASHBOARD ---------------------- //
app.get("/api/applicant-stats", async (req, res) => {
  try {
    const { gender, department_id, program_id, school_year, semester } =
      req.query;

    // ---------------------------
    // Build dynamic WHERE filters
    // ---------------------------
    let where = "WHERE 1=1";
    const params = [];

    if (gender !== undefined && gender !== "all") {
      where += " AND pt.gender = ?";
      params.push(gender);
    }

    if (program_id) {
      where += " AND pt.program = ?";
      params.push(program_id);
    }

    if (department_id) {
      where += `
        AND EXISTS (
          SELECT 1 FROM program_table p
          JOIN dprtmnt_curriculum_table dct
            ON p.curriculum_id = dct.curriculum_id
          WHERE p.curriculum_id = pt.program
            AND dct.dprtmnt_id = ?
        )
      `;
      params.push(department_id);
    }

    if (school_year) {
      where += " AND YEAR(pt.created_at) = ?";
      params.push(school_year);
    }

    if (semester) {
      where += " AND pt.middle_code = ?";
      params.push(semester);
    }

    // ---------------------------
    // Fetch Total
    // ---------------------------
    const [totalRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM person_table pt
      ${where}
    `,
      params,
    );

    // ---------------------------
    // Fetch Gender Counts
    // ---------------------------
    const [rawGender] = await db.query(
      `
      SELECT pt.gender, COUNT(*) AS total
      FROM person_table pt
      ${where}
      GROUP BY pt.gender
    `,
      params,
    );

    const genderCounts = rawGender.map((row) => ({
      gender:
        row.gender === 0 ? "Male" : row.gender === 1 ? "Female" : "Unknown",
      total: row.total,
    }));

    // ---------------------------
    // Terms Of Agreement
    // ---------------------------
    const [agreementRows] = await db.query(
      `
      SELECT COALESCE(pt.termsOfAgreement,0) AS status, COUNT(*) AS total
      FROM person_table pt
      ${where}
      GROUP BY COALESCE(pt.termsOfAgreement,0)
    `,
      params,
    );

    res.json({
      totalApplicants: totalRows[0].total,
      genderCounts,
      statusCounts: agreementRows,
    });
  } catch (err) {
    console.error("ERROR /api/applicant-stats:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

app.get("/api/applicants-per-month", async (req, res) => {
  try {
    const sql = `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS total
      FROM person_table
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;

    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error("Error in /api/applicants-per-month:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/applicants/total", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM person_table
      WHERE termsOfAgreement = 1
    `);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/applicants/week", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM person_table
      WHERE termsOfAgreement = 1
        AND YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)
    `);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/applicants/month", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM person_table
      WHERE termsOfAgreement = 1
        AND YEAR(created_at) = YEAR(NOW())
        AND MONTH(created_at) = MONTH(NOW())
    `);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/applicants/year", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM person_table
      WHERE termsOfAgreement = 1
        AND YEAR(created_at) = YEAR(NOW())
    `);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/applicants/department/total", async (req, res) => {
  const { department_id } = req.query;

  try {
    const [rows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM person_table pt
      JOIN program_table prog
        ON pt.program = prog.curriculum_id
      JOIN dprtmnt_curriculum_table dct
        ON prog.curriculum_id = dct.curriculum_id
      WHERE pt.termsOfAgreement = 1
        AND dct.dprtmnt_id = ?
    `,
      [department_id],
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/applicants/department/week", async (req, res) => {
  const { department_id } = req.query;

  try {
    const [rows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM person_table pt
      JOIN program_table prog
        ON pt.program = prog.curriculum_id
      JOIN dprtmnt_curriculum_table dct
        ON prog.curriculum_id = dct.curriculum_id
      WHERE pt.termsOfAgreement = 1
        AND dct.dprtmnt_id = ?
        AND YEARWEEK(pt.created_at, 1) = YEARWEEK(NOW(), 1)
    `,
      [department_id],
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/applicants/department/month", async (req, res) => {
  const { department_id } = req.query;

  try {
    const [rows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM person_table pt
      JOIN program_table prog
        ON pt.program = prog.curriculum_id
      JOIN dprtmnt_curriculum_table dct
        ON prog.curriculum_id = dct.curriculum_id
      WHERE pt.termsOfAgreement = 1
        AND dct.dprtmnt_id = ?
        AND YEAR(pt.created_at) = YEAR(NOW())
        AND MONTH(pt.created_at) = MONTH(NOW())
    `,
      [department_id],
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/applicants/department/year", async (req, res) => {
  const { department_id } = req.query;

  try {
    const [rows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM person_table pt
      JOIN program_table prog
        ON pt.program = prog.curriculum_id
      JOIN dprtmnt_curriculum_table dct
        ON prog.curriculum_id = dct.curriculum_id
      WHERE pt.termsOfAgreement = 1
        AND dct.dprtmnt_id = ?
        AND YEAR(pt.created_at) = YEAR(NOW())
    `,
      [department_id],
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/applicants/program/stats", async (req, res) => {
  const { program_id } = req.query;

  if (!program_id) {
    return res.status(400).json({ error: "Missing program_id" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT
        COUNT(pt.person_id) AS total_applicants,
        SUM(CASE WHEN pt.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() THEN 1 ELSE 0 END) AS applicants_week,
        SUM(CASE WHEN pt.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() THEN 1 ELSE 0 END) AS applicants_month
      FROM admission.person_status_table pst
      INNER JOIN admission.person_table pt ON pst.person_id = pt.person_id
      INNER JOIN enrollment.curriculum_table ct ON pt.program = ct.curriculum_id
      WHERE ct.program_id = ?
    `,
      [program_id],
    );

    res.json(rows[0] || { total_applicants: 0, applicants_week: 0, applicants_month: 0 });
  } catch (err) {
    console.error("Program stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/applicants/filter", async (req, res) => {
  let { department_id, program_code } = req.query;

  // Normalize empty strings to null
  if (!department_id) department_id = null;
  if (!program_code) program_code = null;

  try {
    const [rows] = await db.query(
      `
      SELECT
        p.*,
        ct.curriculum_id,
        pt.program_code,
        pt.program_description,
        dc.dprtmnt_id
      FROM person_table p
      LEFT JOIN db3.curriculum_table ct
        ON p.program = ct.curriculum_id
      LEFT JOIN db3.program_table pt
        ON ct.program_id = pt.program_id
      LEFT JOIN db3.dprtmnt_curriculum_table dc
        ON ct.curriculum_id = dc.curriculum_id
      WHERE
        (${department_id} IS NULL OR dc.dprtmnt_id = ?)
        AND (${program_code} IS NULL OR pt.program_code = ?)
    `,
      [department_id, program_code],
    );

    res.json(rows);
  } catch (err) {
    console.error("Filter applicants failed:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// backend: server.js or routes file
app.get("/api/get-scheduled-applicants", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT applicant_id, schedule_id, email_sent
      FROM exam_applicants
      WHERE schedule_id IS NOT NULL
        AND email_sent = 1
    `);

    console.log("Scheduled applicants:", rows); // should log 1 row
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/exam/completed-count", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM admission_exam`,
    );
    console.log("Exam count from DB:", rows[0].total); // Debug

    res.json({ total: rows[0].total });
  } catch (err) {
    console.error("Error fetching exam count:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------- ALL FILTERING FOR ADMISSION DASHBOARD ---------------------- //

// ---------- DEPARTMENT <-> CURRICULUM MAPPING (dprtmnt_curriculum_table) ----------
// GET mappings for a department
app.get("/dprtmnt_curriculum/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;
  try {
    const query = `
      SELECT
        dc.dprtmnt_curriculum_id,
        dc.dprtmnt_id,
        dc.curriculum_id,
        dt.dprtmnt_name,
        dt.dprtmnt_code,
        ct.curriculum_id AS ct_curriculum_id,
        ct.year_id,
        y.year_description,
        ct.program_id,
        ct.lock_status,
        p.program_description AS p_description,
        p.program_code AS p_code,
          p.major AS p_major
      FROM dprtmnt_curriculum_table AS dc
      INNER JOIN dprtmnt_table AS dt
        ON dc.dprtmnt_id = dt.dprtmnt_id
      INNER JOIN curriculum_table AS ct
        ON dc.curriculum_id = ct.curriculum_id
      INNER JOIN program_table AS p
        ON ct.program_id = p.program_id
      INNER JOIN year_table AS y
        ON ct.year_id = y.year_id
      WHERE dc.dprtmnt_id = ?
      ORDER BY
        COALESCE(p_code, ''),
        dc.curriculum_id;
    `;

    const [rows] = await db3.execute(query, [dprtmnt_id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching dprtmnt_curriculum:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

// POST add mapping (dprtmnt_id + curriculum_id)
app.post("/dprtmnt_curriculum", async (req, res) => {
  const { dprtmnt_id, curriculum_id } = req.body;
  if (!dprtmnt_id || !curriculum_id) {
    return res
      .status(400)
      .json({ error: "dprtmnt_id and curriculum_id are required" });
  }

  try {
    // prevent duplicate mapping
    const [exists] = await db3.execute(
      "SELECT * FROM dprtmnt_curriculum_table WHERE dprtmnt_id = ? AND curriculum_id = ?",
      [dprtmnt_id, curriculum_id],
    );
    if (exists.length > 0) {
      return res.status(409).json({ message: "Mapping already exists" });
    }

    const [result] = await db3.execute(
      "INSERT INTO dprtmnt_curriculum_table (dprtmnt_id, curriculum_id) VALUES (?, ?)",
      [dprtmnt_id, curriculum_id],
    );

    // return inserted id
    res.status(201).json({
      message: "Mapping created",
      dprtmnt_curriculum_id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating mapping:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

// DELETE mapping by mapping id
app.delete("/dprtmnt_curriculum/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db3.execute(
      "DELETE FROM dprtmnt_curriculum_table WHERE dprtmnt_curriculum_id = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mapping not found" });
    }
    res.status(200).json({ message: "Mapping deleted" });
  } catch (err) {
    console.error("Error deleting mapping:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

app.put("/dprtmnt_curriculum/:id", async (req, res) => {
  const { id } = req.params;
  const { curriculum_id, dprtmnt_id } = req.body;

  if (!curriculum_id || !dprtmnt_id) {
    return res
      .status(400)
      .json({ message: "curriculum_id and dprtmnt_id required" });
  }

  try {
    // Check duplicate mapping
    const [exists] = await db3.execute(
      `SELECT * FROM dprtmnt_curriculum_table
       WHERE dprtmnt_id = ? AND curriculum_id = ? AND dprtmnt_curriculum_id != ?`,
      [dprtmnt_id, curriculum_id, id],
    );

    if (exists.length > 0) {
      return res.status(409).json({ message: "Mapping already exists" });
    }

    const [result] = await db3.execute(
      `UPDATE dprtmnt_curriculum_table
       SET curriculum_id = ?
       WHERE dprtmnt_curriculum_id = ?`,
      [curriculum_id, id],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Mapping ID not found" });

    res.json({ message: "Mapping updated" });
  } catch (err) {
    console.error("Update error:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/api/ecat-summary", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        SUM(CASE WHEN pt.termsOfAgreement = 1 THEN 1 ELSE 0 END) AS total_applied,
        SUM(CASE WHEN ea.schedule_id IS NOT NULL THEN 1 ELSE 0 END) AS total_scheduled,
        SUM(CASE WHEN ea.schedule_id IS NULL THEN 1 ELSE 0 END) AS total_pending,
        SUM(CASE WHEN ae.status IN ('PASSED','FAILED') THEN 1 ELSE 0 END) AS total_finished
      FROM exam_applicants AS ea
      LEFT JOIN applicant_numbering_table AS ant ON ea.applicant_id = ant.applicant_number
      LEFT JOIN person_table AS pt ON ant.person_id = pt.person_id
      LEFT JOIN person_status_table AS pst ON pt.person_id = pst.person_id
      LEFT JOIN admission_exam AS ae ON pt.person_id = ae.person_id
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------- prereq
// ✅ CHECK PREREQUISITE BEFORE ENROLLMENT
app.post("/api/check-prerequisite", async (req, res) => {
  try {
    const { student_number, course_id, semester_id, curriculum_id } = req.body;

    if (!student_number || !course_id) {
      return res.status(400).json({
        allowed: false,
        status: "INVALID_REQUEST",
        message: "student_number and course_id are required.",
      });
    }

    // 1. Get prerequisite code(s) for this course
    const [courseRows] = await db3.query(
      "SELECT prereq, course_code FROM course_table WHERE course_id = ? LIMIT 1",
      [course_id],
    );

    if (!courseRows.length) {
      return res.status(404).json({
        allowed: false,
        status: "COURSE_NOT_FOUND",
        message: "Course not found in course_table.",
      });
    }

    const { prereq, course_code } = courseRows[0];
    console.log("Code and Prequiesite", prereq)
    console.log("Code and Prequiesite", course_code)

    // If no prerequisite defined → allow enrollment
    if (!prereq || String(prereq).trim() === "") {
      return res.json({
        allowed: true,
        status: "NO_PREREQ",
        message: `Course ${course_code} has no prerequisite.`,
      });
    }

    // 2. Support comma-separated list of prerequisite course codes
    const prereqCodes = String(prereq)
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (prereqCodes.length === 0) {
      return res.json({
        allowed: true,
        status: "NO_PREREQ",
        message: `Course ${course_code} has no prerequisite (empty prereq field).`,
      });
    }

    // 3. Get course_id for each prerequisite course_code
    const placeholders = prereqCodes.map(() => "?").join(", ");

    const [prereqCourses] = await db3.query(
      `
      SELECT course_id, course_code
      FROM course_table
      WHERE course_code IN (${placeholders})
      `,
      prereqCodes,
    );

    if (!prereqCourses.length) {
      // Safety: if prereq codes don't map to any course, don't block enrollment
      return res.json({
        allowed: true,
        status: "PREREQ_NOT_FOUND",
        message:
          "Prerequisite course codes do not exist in course_table. Enrollment is allowed but please verify your curriculum data.",
      });
    }

    let applicablePrereqCourses = prereqCourses;

    if (semester_id && curriculum_id) {
      const prereqCourseIds = prereqCourses.map((p) => p.course_id);
      const placeholders2 = prereqCourseIds.map(() => "?").join(", ");

      const [tagRows] = await db3.query(
        `
        SELECT course_id, semester_id
        FROM program_tagging_table
        WHERE curriculum_id = ? AND course_id IN (${placeholders2})
        `,
        [curriculum_id, ...prereqCourseIds],
      );

      const prereqSemesterMap = new Map(
        tagRows.map((row) => [row.course_id, row.semester_id]),
      );

      applicablePrereqCourses = prereqCourses.filter((p) => {
        const prereqSemesterId = prereqSemesterMap.get(p.course_id);
        if (!prereqSemesterId) return true; // keep if not tagged
        return Number(prereqSemesterId) < Number(semester_id);
      });

      if (applicablePrereqCourses.length === 0) {
        return res.json({
          allowed: true,
          status: "NO_APPLICABLE_PREREQ",
          message:
            "Prerequisites are not applicable for the selected semester.",
        });
      }
    }

    const failedPrereq = [];
    const missingPrereq = [];

    // 4. For each prerequisite, check student's grade history in enrolled_subject
    for (const prereqCourse of applicablePrereqCourses) {
      const prereqCourseId = prereqCourse.course_id;
      const prereqCourseCode = prereqCourse.course_code;

      const [gradeRows] = await db3.query(
        `
        SELECT
          MAX(CASE WHEN en_remarks = 1 THEN 1 ELSE 0 END) AS has_pass,
          MAX(CASE WHEN en_remarks = 2 THEN 1 ELSE 0 END) AS has_fail
        FROM enrolled_subject
        WHERE student_number = ? AND course_id = ?
        `,
        [student_number, prereqCourseId],
      );

      const { has_pass, has_fail } = gradeRows[0];

      // ❌ Has a failing record and never passed
      if (!has_pass && has_fail) {
        failedPrereq.push(prereqCourseCode);
      }
      // ❌ No pass and no fail → never enrolled or no final passing grade yet
      else if (!has_pass && !has_fail) {
        missingPrereq.push(prereqCourseCode);
      }
      // ✅ has_pass = 1 → OK
    }

    // 5. Decide overall result
    if (failedPrereq.length > 0) {
      return res.json({
        allowed: false,
        status: "FAILED_PREREQ",
        failedPrereq,
        missingPrereq, // might also exist if multiple prerequisites
        message: `Student has FAILED prerequisite(s): ${failedPrereq.join(
          ", ",
        )}. They must PASS these before enrolling in ${course_code}.`,
      });
    }

    if (missingPrereq.length > 0) {
      return res.json({
        allowed: false,
        status: "MISSING_PREREQ",
        failedPrereq,
        missingPrereq,
        message: `Student must FIRST ENROLL and PASS prerequisite(s): ${missingPrereq.join(
          ", ",
        )} before taking ${course_code}.`,
      });
    }

    // ✅ All prereqs satisfied
    return res.json({
      allowed: true,
      status: "OK",
      failedPrereq: [],
      missingPrereq: [],
      message: `All prerequisites satisfied for ${course_code}.`,
    });
  } catch (err) {
    console.error("Error in /api/check-prerequisite:", err);
    return res.status(500).json({
      allowed: false,
      status: "SERVER_ERROR",
      message: err.message,
    });
  }
});

app.get("/api/applicant_uploaded_requirements/:person_id", async (req, res) => {
  try {
    const { person_id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        pt.person_id,
        pt.first_name,
        pt.middle_name,
        pt.last_name,
        pt.profile_img,
        pt.emailAddress,

        -- applicant_numbering_table
        ant.applicant_number,
        ant.qr_code,

        -- requirement_uploads
        ru.upload_id,
        ru.requirements_id,
        ru.submitted_documents,
        ru.registrar_status,
        ru.document_status,
        ru.remarks,
        ru.missing_documents,
        ru.submitted_medical,
        ru.file_path,
        ru.original_name

      FROM person_table pt
      LEFT JOIN applicant_numbering_table ant
        ON pt.person_id = ant.person_id
      LEFT JOIN requirement_uploads ru
        ON pt.person_id = ru.person_id

      WHERE pt.person_id = ?
      ORDER BY ru.requirements_id
    `,
      [person_id],
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching applicant uploaded requirements:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/applicant-documents/:person_id", async (req, res) => {
  try {
    const { person_id } = req.params;

    const [rows] = await db.query(
      `SELECT
          requirements_id,
          submitted_documents,
          registrar_status,
          document_status
       FROM requirement_uploads
       WHERE person_id = ?
       ORDER BY requirements_id`,
      [person_id],
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error loading applicant documents:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//UPDATE ()
app.post("/insert-logs/:userID", async (req, res) => {
  const { userID } = req.params;
  const { message, type } = req.body;

  try {
    const [userData] = await db3.query(
      "SELECT * FROM user_accounts WHERE person_id = ?",
      [userID],
    );

    if (userData === 0) {
      res.status(400).send({ message: "No Data found" });
    }

    const user = userData[0];
    const UserID = user.employee_id;
    const fullName = `${user.last_name}, ${prof.first_name} ${prof.middle_name}`;
    const email = user.email;

    await db.query(
      `INSERT INTO notifications (type, message, applicant_number, actor_email, actor_name, timestamp)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [type, message, UserID, email, fullName],
    );

    res.json({ success: true, message: "Log inserted" });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/get_enrollment_statistic", async (req, res) => {
  try {
    const { year } = req.query; // Get year from query string

    let query = `
      SELECT
        SUM(CASE WHEN academicProgram = 2 THEN 1 ELSE 0 END) AS Techvoc,
        SUM(CASE WHEN academicProgram = 1 THEN 1 ELSE 0 END) AS Graduate,
        SUM(CASE WHEN academicProgram = 0 THEN 1 ELSE 0 END) AS Undergraduate,
        SUM(CASE WHEN classifiedAs = 'Returnee' THEN 1 ELSE 0 END) AS Returnee,
        SUM(CASE WHEN classifiedAs = 'Shiftee' THEN 1 ELSE 0 END) AS Shiftee,
        SUM(CASE WHEN classifiedAs = 'Foreign Student' THEN 1 ELSE 0 END) AS ForeignStudent,
        SUM(CASE WHEN classifiedAs = 'Transferee' THEN 1 ELSE 0 END) AS Transferee
      FROM person_table 
    `;

    const params = [];

    if (year) {
      query += " WHERE YEAR(created_at) = ?";
      params.push(year);
    }

    const [rows] = await db3.execute(query, params);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/get_enrollment_statistic/college/:yearDescription/:userDep", async (req, res) => {
  try {
    const { yearDescription, userDep } = req.params;

    if (!yearDescription || !userDep) {
      return res.status(400).json({ error: "Missing required parameters: year, dprtmnt_id" });
    }

    const query = `
      SELECT
        SUM(CASE WHEN academicProgram = 2 THEN 1 ELSE 0 END) AS Techvoc,
        SUM(CASE WHEN academicProgram = 1 THEN 1 ELSE 0 END) AS Graduate,
        SUM(CASE WHEN academicProgram = 0 THEN 1 ELSE 0 END) AS Undergraduate,
        SUM(CASE WHEN classifiedAs = 'Returnee' THEN 1 ELSE 0 END) AS Returnee,
        SUM(CASE WHEN classifiedAs = 'Shiftee' THEN 1 ELSE 0 END) AS Shiftee,
        SUM(CASE WHEN classifiedAs = 'Foreign Student' THEN 1 ELSE 0 END) AS ForeignStudent,
        SUM(CASE WHEN classifiedAs = 'Transferee' THEN 1 ELSE 0 END) AS Transferee
      FROM person_table 
      INNER JOIN dprtmnt_curriculum_table 
        ON person_table.program = dprtmnt_curriculum_table.curriculum_id
      WHERE dprtmnt_curriculum_table.dprtmnt_id = ? AND YEAR(person_table.created_at) = ?
    `;

    const [rows] = await db3.query(query, [userDep, yearDescription]);

    res.json(rows[0]);
    console.log("DATA: ", rows[0])
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/get_college_professor_schedule/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;
  try {
    const sql = `
      SELECT pt.employee_id, pt.fname, pt.mname, pt.lname, ct.course_code, pgt.program_id, pgt.program_code, sct.description AS section_description, rdt.description AS day, tt.school_time_start, tt.school_time_end, rt.room_id, rt.room_description, tt.ishonorarium, yt.year_id, yt.year_description AS current_year, yt.year_description + 1 AS next_year, st.semester_id, st.semester_description FROM time_table tt
      LEFT JOIN prof_table pt ON tt.professor_id = pt.prof_id
      LEFT JOIN course_table ct ON tt.course_id = ct.course_id
      LEFT JOIN dprtmnt_section_table dst ON tt.department_section_id = dst.id
      LEFT JOIN section_table sct ON dst.section_id = sct.id
      LEFT JOIN curriculum_table cct ON dst.curriculum_id = cct.curriculum_id
      LEFT JOIN program_table pgt ON cct.program_id = pgt.program_id
      LEFT JOIN room_day_table rdt ON tt.room_day = rdt.id
      LEFT JOIN dprtmnt_room_table drt ON tt.department_room_id = drt.dprtmnt_room_id
      LEFT JOIN dprtmnt_table dt ON drt.dprtmnt_id = dt.dprtmnt_id
      LEFT JOIN room_table rt ON drt.room_id = rt.room_id
      INNER JOIN active_school_year_table sy ON tt.school_year_id = sy.id
      LEFT JOIN year_table yt ON sy.year_id = yt.year_id
      LEFT JOIN semester_table st ON sy.semester_id = st.semester_id
      WHERE dt.dprtmnt_id = ? AND sy.astatus = 1
    `;

    const [rows] = await db3.execute(sql, [dprtmnt_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No schedule found" });
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
//----------------------------prereq end

app.get("/person_prof_list", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT
        p.person_id,
        pr.fname,
        pr.mname,
        pr.lname,
        p.bachelor,
        p.master,
        p.doctor
      FROM person_prof_table p
      JOIN prof_table pr
        ON pr.person_id = p.person_id
      ORDER BY pr.lname, pr.fname
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching joined person_prof:", err);
    res.status(500).json({ message: "Failed to fetch records" });
  }
});

app.post("/person_prof", async (req, res) => {
  const { person_id, bachelor, master, doctor } = req.body;

  try {
    const [existing] = await db3.query(
      "SELECT 1 FROM person_prof_table WHERE person_id = ?",
      [person_id],
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Record already exists" });
    }

    await db3.query(
      `INSERT INTO person_prof_table
       (person_id, bachelor, master, doctor)
       VALUES (?, ?, ?, ?)`,
      [person_id, bachelor || null, master || null, doctor || null],
    );

    res.json({ message: "Education record added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add record" });
  }
});

app.put("/person_prof/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const { bachelor, master, doctor } = req.body;

  try {
    await db3.query(
      `UPDATE person_prof_table
       SET bachelor = ?, master = ?, doctor = ?
       WHERE person_id = ?`,
      [bachelor || null, master || null, doctor || null, person_id],
    );

    res.json({ message: "Education record updated" });
  } catch (err) {
    console.error("Error updating person_prof:", err);
    res.status(500).json({ message: "Failed to update record" });
  }
});

app.delete("/person_prof/:person_id", async (req, res) => {
  const { person_id } = req.params;

  try {
    await db3.query("DELETE FROM person_prof_table WHERE person_id = ?", [
      person_id,
    ]);
    res.json({ message: "Education record deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete record" });
  }
});

// 🔽 Dropdown: list of professors
app.get("/prof_dropdown", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT
        person_id,
        fname,
        mname,
        lname
      FROM prof_table
      ORDER BY lname, fname
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching prof dropdown:", err);
    res.status(500).json({ message: "Failed to load professors" });
  }
});

//  NEWLY ADDED API 1/13/2025

// ✅ GET all year levels
app.get("/api/year-levels", async (req, res) => {
  try {
    const [rows] = await db3.query(
      "SELECT year_level_id, year_level_description FROM year_level_table ORDER BY year_level_id",
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching year levels:", err);
    res.status(500).json({ message: "Failed to fetch year levels" });
  }
});

// GET all school years
app.get("/api/school-years", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT year_id, year_description, status
      FROM year_table
      ORDER BY year_description DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching school years:", err);
    res.status(500).json({ message: "Failed to fetch school years" });
  }
});

// ================= POST =================

app.get("/api/signature", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT full_name, signature_image
       FROM signature_table
       ORDER BY created_at DESC
       LIMIT 1`,
    );

    if (!rows.length) {
      return res.json({ success: false });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post(
  "/api/signature",
  uploadSignature.single("signature"),
  async (req, res) => {
    try {
      const { full_name } = req.body;

      if (!full_name || !req.file) {
        return res.json({ success: false });
      }

      const signaturePath = `signature/${req.file.filename}`;

      await db.query(
        "INSERT INTO signature_table (full_name, signature_image) VALUES (?, ?)",
        [full_name, signaturePath],
      );

      // 🔥 IBALIK AGAD SA FRONTEND
      res.json({
        success: true,
        data: {
          full_name,
          signature_image: signaturePath,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },
);

// ================= GET =================
app.get("/api/signature/:fullName", async (req, res) => {
  try {
    const { fullName } = req.params;

    const [rows] = await db.query(
      `SELECT full_name, signature_image
       FROM signature_table
       WHERE full_name = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [fullName],
    );

    if (!rows.length) {
      return res.json({ success: false });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// GET LATEST SIGNATURE
app.get("/api/signature-latest", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT full_name, signature_image
      FROM signature_table
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (!rows.length) {
      return res.json({ success: false });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.delete("/delete_subject/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res
        .status(400)
        .json({ error: "Please Select a Subject to Delete" });
    }

    await db3.execute("DELETE FROM enrolled_subject WHERE id = ?", [id]);
    res.json({ message: "Deleted Successfully" });
  } catch (err) {
    console.error("Error in Deleting a suject", err);
    res.status(500).json({ error: "Error in Deleting a subject", err });
  }
});

app.post("/insert_subject", async (req, res) => {
  const { course_id, student_number, currId, active_school_year_id } = req.body;

  if (!course_id || !student_number || !currId || !active_school_year_id) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  console.log("Course: ", course_id);
  console.log("Student Number: ", student_number);
  console.log("Curriculum: ", currId);
  console.log("School Year", active_school_year_id);

  try {
    const sql = `
      INSERT INTO enrolled_subject
        (course_id, student_number, curriculum_id, active_school_year_id)
      VALUES (?, ?, ?, ?)
    `;

    await db3.execute(sql, [
      course_id,
      student_number,
      currId,
      active_school_year_id,
    ]);

    res.json({ message: "Course added successfully" });
  } catch (err) {
    console.error("Insert subject error:", err);
    res.status(500).json({ error: "Failed to add subject" });
  }
});

const convertGradeToNumeric = (grade) => {
  const gradeMap = {
    1.0: 100,
    1.25: 96,
    0.180: 93,
    1.75: 90,
    2.0: 87,
    2.25: 84,
    2.5: 81,
    2.75: 78,
    3.0: 75,
    5.0: 0,
  };
  return gradeMap[grade] ?? null;
};

app.put("/update_subject", async (req, res) => {
  const {
    course_id,
    student_number,
    currId,
    active_school_year_id,
    final_grade,
  } = req.body;

  if (!course_id || !student_number || !currId || !active_school_year_id) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  console.log("Course: ", course_id);
  console.log("Student Number: ", student_number);
  console.log("Curriculum: ", currId);
  console.log("School Year", active_school_year_id);

  try {
    const numericGrade = convertGradeToNumeric(parseFloat(final_grade));

    const sql = `
      UPDATE enrolled_subject SET final_grade = ? WHERE
        course_id = ? AND student_number = ? AND curriculum_id = ? AND active_school_year_id = ?
    `;

    await db3.execute(sql, [
      numericGrade,
      course_id,
      student_number,
      currId,
      active_school_year_id,
    ]);

    res.json({ message: "Course added successfully" });
  } catch (err) {
    console.error("Insert subject error:", err);
    res.status(500).json({ error: "Failed to add subject" });
  }
});


app.get("/verify_schedules", async (req, res) => {
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

io.on("connection", (socket) => {
  console.log("✅ Socket connected (VERIFY)");

  socket.on("send_verify_schedule_emails", async ({
    schedule_id,
    applicant_numbers,
    subject,
    message,
    user_person_id,
  }) => {

    console.log(applicant_numbers);

    try {

      if (!schedule_id || !Array.isArray(applicant_numbers) || applicant_numbers.length === 0) {
        return socket.emit("send_verify_schedule_emails_result", {
          success: false,
          error: "No applicants provided.",
        });
      }


      // OFFICE NAME
      const [[office]] = await db.query(
        "SELECT short_term FROM company_settings WHERE id = 1"
      );

      const shortTerm = office?.short_term || "EARIST";
      const officeName = `${shortTerm} - Admission Office`;

      // 🔹 Fetch applicants with email
      const [rows] = await db.query(`
      SELECT
        va.applicant_id,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.emailAddress
      FROM verify_applicants va
      JOIN applicant_numbering_table an
        ON va.applicant_id = an.applicant_number
      JOIN person_table p
        ON an.person_id = p.person_id
      WHERE va.schedule_id = ?
      AND va.applicant_id IN (?)
      AND va.email_sent = 0
    `, [schedule_id, applicant_numbers]);

      if (rows.length === 0) {
        return socket.emit("send_verify_schedule_emails_result", {
          success: false,
          error: "No pending applicants found.",
        });
      }



      const sent = [];
      const failed = [];

      for (const row of rows) {

        if (!row.emailAddress) {
          failed.push(row.applicant_id);
          continue;
        }

        const personalizedMsg = message
          .replace("{first_name}", row.first_name || "")
          .replace("{middle_name}", row.middle_name || "")
          .replace("{last_name}", row.last_name || "")
          .replace("{applicant_number}", row.applicant_id);

        try {

          await transporter.sendMail({
            from: `"${officeName}" <${process.env.EMAIL_USER}>`,
            to: row.emailAddress,
            subject,
            text: personalizedMsg,
          });

          // ✅ Mark sent
          await db.query(
            "UPDATE verify_applicants SET email_sent = 1 WHERE applicant_id = ?",
            [row.applicant_id]
          );

          sent.push(row.applicant_id);

        } catch (err) {
          console.error("Email failed:", err.message);

          await db.query(
            "UPDATE verify_applicants SET email_sent = -1 WHERE applicant_id = ?",
            [row.applicant_id]
          );

          failed.push(row.applicant_id);
        }
      }

      // ✅ Return result
      socket.emit("send_verify_schedule_emails_result", {
        success: true,
        sent,
        failed,
        message: `Verify emails: Sent=${sent.length}, Failed=${failed.length}`,
      });

      io.emit("schedule_updated", { schedule_id });

    } catch (err) {
      console.error("Verify email error:", err);

      socket.emit("send_verify_schedule_emails_result", {
        success: false,
        error: "Server error sending verify emails.",
      });
    }
  });


  socket.on("update_verify_schedule", async ({ schedule_id, applicant_numbers }) => {
    try {
      if (!schedule_id || !applicant_numbers?.length) {
        return socket.emit("update_verify_schedule_result", {
          success: false,
          error: "Schedule ID and applicants required.",
        });
      }

      // 🔎 Get quota
      const [[scheduleInfo]] = await db.query(
        `SELECT room_quota FROM verify_document_schedule WHERE schedule_id = ?`,
        [schedule_id]
      );

      if (!scheduleInfo) {
        return socket.emit("update_verify_schedule_result", {
          success: false,
          error: "Schedule not found.",
        });
      }

      const roomQuota = scheduleInfo.room_quota;

      // 🔎 Current count
      const [[{ currentCount }]] = await db.query(
        `SELECT COUNT(*) AS currentCount FROM verify_applicants WHERE schedule_id = ?`,
        [schedule_id]
      );

      let runningCount = currentCount;

      const assigned = [];
      const updated = [];
      const skipped = [];

      for (const applicant_number of applicant_numbers) {

        // 🚫 STOP when full
        if (runningCount >= roomQuota) {
          break;
        }

        const [check] = await db.query(
          `SELECT schedule_id FROM verify_applicants WHERE applicant_id = ?`,
          [applicant_number]
        );

        if (check.length > 0) {

          if (check[0].schedule_id === schedule_id) {
            skipped.push(applicant_number);
          } else {
            await db.query(
              `UPDATE verify_applicants SET schedule_id = ? WHERE applicant_id = ?`,
              [schedule_id, applicant_number]
            );
            updated.push(applicant_number);
            runningCount++; // increase count
          }

        } else {

          await db.query(
            `INSERT INTO verify_applicants (applicant_id, schedule_id, email_sent)
            VALUES (?, ?, 0)`,
            [applicant_number, schedule_id]
          );

          assigned.push(applicant_number);
          runningCount++; // increase count
        }
      }

      socket.emit("update_verify_schedule_result", {
        success: true,
        assigned,
        updated,
        skipped,
      });

    } catch (err) {
      console.error("❌ Verify assign error:", err);
      socket.emit("update_verify_schedule_result", {
        success: false,
        error: "Failed to assign applicants.",
      });
    }
  });
});

app.post("/api/generate-cor-pdf", async (req, res) => {
  let browser;

  try {
    const { html } = req.body;

    if (!html || typeof html !== "string") {
      return res.status(400).json({ message: "No HTML received" });
    }

    console.log("Received HTML length:", html.length);

    browser = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    page.on("console", (msg) => {
      console.log("PAGE LOG:", msg.text());
    });

    page.on("pageerror", (err) => {
      console.log("PAGE ERROR:", err.message);
    });

    page.on("requestfailed", (request) => {
      console.log(
        "REQUEST FAILED:",
        request.url(),
        request.failure()?.errorText
      );
    });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.resourceType() === "media") {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    await page.evaluate(async () => {
      const images = Array.from(document.images);

      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale: 0.90,
      margin: {
     
        right: "10mm",
    
        left: "10mm",
      },
    });

    console.log("PDF buffer size:", pdfBuffer.length);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Generated PDF buffer is empty");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=certificate.pdf"
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err) {
    console.error("PDF ERROR:", err);

    return res.status(500).json({
      message: "PDF generation failed",
      error: err.message,
      stack: err.stack,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});


app.get("/get_students_grouped", async (req, res) => {
  try {

    const [rows] = await db3.query(`
 SELECT DISTINCT
snt.student_number,
pt.first_name,
pt.middle_name,
pt.last_name,
dt.dprtmnt_code,
dt.dprtmnt_name,
pgt.program_code,
pgt.program_description,
pgt.major,
ylt.year_level_description
FROM enrolled_subject es
JOIN student_status_table sst ON es.student_number = sst.student_number
JOIN student_numbering_table snt ON sst.student_number = snt.student_number
JOIN person_table pt ON snt.person_id = pt.person_id
JOIN dprtmnt_curriculum_table dct ON es.curriculum_id = dct.curriculum_id
JOIN curriculum_table cct ON dct.curriculum_id = cct.curriculum_id
JOIN dprtmnt_table dt ON dct.dprtmnt_id = dt.dprtmnt_id
JOIN program_table pgt ON cct.program_id = pgt.program_id
JOIN year_level_table ylt ON sst.year_level_id = ylt.year_level_id
ORDER BY dt.dprtmnt_code, pgt.program_code, pt.last_name;

    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed fetching students" });
  }
});

const PORT = process.env.WEB_PORT || 5000;
const HOST = getDbHost();
http.listen(PORT, "0.0.0.0", () => {
  const localIP = getDbHost();
  console.log(`✅ Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
});
