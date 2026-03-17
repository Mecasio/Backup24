const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db } = require("../database/database");

const router = express.Router();

/* ===================== FILE UPLOAD ===================== */

const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf"];
const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

const settingsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsRoot)) {
      fs.mkdirSync(uploadsRoot, { recursive: true });
    }
    cb(null, uploadsRoot);
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

/* ===================== DELETE OLD FILE ===================== */

const deleteOldFile = (fileUrl) => {
  if (!fileUrl) return;

  const filePath = path.join(__dirname, "..", "..", fileUrl.replace(/^\//, ""));
  fs.unlink(filePath, (err) => {
    if (err) console.error(`Error deleting old file: ${err.message}`);
    else console.log(`Deleted old file: ${filePath}`);
  });
};

/* ===================== GET SETTINGS ===================== */

router.get("/settings", async (req, res) => {
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
        branches: [],
      });
    }

    const settings = rows[0];

    if (settings.branches) {
      try {
        settings.branches = JSON.parse(settings.branches);
      } catch (err) {
        settings.branches = [];
      }
    } else {
      settings.branches = [];
    }

    res.json(settings);
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===================== SAVE SETTINGS ===================== */

router.post(
  "/settings",
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
        branches,
      } = req.body;

      const logoUrl = req.files?.logo
        ? `/uploads/${req.files.logo[0].filename}`
        : null;

      const bgImageUrl = req.files?.bg_image
        ? `/uploads/${req.files.bg_image[0].filename}`
        : null;

      const [rows] = await db.query(
        "SELECT * FROM company_settings WHERE id = 1",
      );

      let parsedBranches = "[]";
      if (typeof branches !== "undefined") {
        try {
          parsedBranches = Array.isArray(branches)
            ? JSON.stringify(branches)
            : JSON.stringify(JSON.parse(branches));
        } catch (err) {
          parsedBranches = "[]";
        }
      }

      if (rows.length > 0) {
        const currentSettings = rows[0];
        const oldLogo = currentSettings.logo_url;
        const oldBg = currentSettings.bg_image;

        if (typeof branches === "undefined") {
          parsedBranches = currentSettings.branches || "[]";
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
          main_button_color ?? currentSettings.main_button_color ?? "#ffffff",
          sub_button_color ?? currentSettings.sub_button_color ?? "#ffffff",
          border_color ?? currentSettings.border_color ?? "#000000",
          stepper_color ?? currentSettings.stepper_color ?? "#000000",
          sidebar_button_color ??
            currentSettings.sidebar_button_color ??
            "#000000",
          title_color ?? currentSettings.title_color ?? "#000000",
          subtitle_color ?? currentSettings.subtitle_color ?? "#555555",
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
      }

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
        parsedBranches,
      ]);

      res.json({ success: true, message: "Settings created successfully." });
    } catch (err) {
      console.error("❌ Error in /api/settings:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/* ===================== GET BRANCHES ===================== */
router.get("/branches", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM company_branches ORDER BY branch_name",
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch branches error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===================== ADD BRANCH ===================== */
router.post("/branches", async (req, res) => {
  try {
    const { branch_name } = req.body;

    if (!branch_name) {
      return res.status(400).json({ message: "Branch name required" });
    }

    const [exists] = await db.query(
      "SELECT branch_id FROM company_branches WHERE branch_name = ?",
      [branch_name],
    );

    if (exists.length > 0) {
      return res.status(400).json({ message: "Branch already exists" });
    }

    await db.query(
      "INSERT INTO company_branches (branch_name) VALUES (?)",
      [branch_name],
    );

    res.json({ success: true, message: "Branch added" });
  } catch (err) {
    console.error("❌ Add branch error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===================== UPDATE BRANCH ===================== */
router.put("/branches/:id", async (req, res) => {
  try {
    const { branch_name } = req.body;
    const { id } = req.params;

    await db.query(
      "UPDATE company_branches SET branch_name = ? WHERE branch_id = ?",
      [branch_name, id],
    );

    res.json({ success: true, message: "Branch updated" });
  } catch (err) {
    console.error("❌ Update branch error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===================== DELETE BRANCH ===================== */
router.delete("/branches/:id", async (req, res) => {
  try {
    await db.query(
      "DELETE FROM company_branches WHERE branch_id = ?",
      [req.params.id],
    );

    res.json({ success: true, message: "Branch deleted" });
  } catch (err) {
    console.error("❌ Delete branch error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
