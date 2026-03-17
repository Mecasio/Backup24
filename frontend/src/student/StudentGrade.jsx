import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";

import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
const StudentGradingPage = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff"); // ✅ NEW
  const [stepperColor, setStepperColor] = useState("#000000"); // ✅ NEW

  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");

  useEffect(() => {
    if (!settings) return;

    // 🎨 Colors
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color)
      setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color); // ✅ NEW
    if (settings.stepper_color) setStepperColor(settings.stepper_color); // ✅ NEW

    // 🏫 Logo
    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    } else {
      setFetchedLogo(EaristLogo);
    }

    // 🏷️ School Information
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);
  }, [settings]);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [studentGrade, setStudentGrade] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [gradingActive, setGradingActive] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);

      if (storedRole !== "student") {
        window.location.href = "/faculty_dashboard";
      } else {
        fetchStudentGrade(storedID);
        console.log("you are an", storedRole);
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const fetchStudentGrade = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/student_grade/${id}`);
      const data = res.data;

      // 🧩 Group grades by term
      const groupedByTerm = {};
      data.forEach((subj) => {
        const termKey = `${subj.first_year}-${subj.last_year} ${subj.semester_description}`;
        if (!groupedByTerm[termKey]) groupedByTerm[termKey] = [];
        groupedByTerm[termKey].push(subj);
      });

      // 🧠 Process each term: if all fe_status == 0, hide grades and remarks
      const processedGrades = Object.values(groupedByTerm).flatMap(
        (termSubjects) => {
          const allReleased = termSubjects.every((s) => s.fe_status === 1); // all grades released
          if (!allReleased) {
            // Hide all grades if not all released
            return termSubjects.map((s) => ({
              ...s,
              final_grade: null,
              en_remarks: null,
            }));
          }
          // Otherwise, show grades as-is
          return termSubjects;
        },
      );

      setStudentGrade(processedGrades);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!gradingActive || studentGrade.length === 0) return;

    const pending = studentGrade.filter((subj) => subj.fe_status === 0).length;

    if (pending > 0) {
      setMessage(
        `Grades are available. Please evaluate all your professors. Remaining: ${pending}`,
      );
    } else {
      viewGrade();
    }
  }, [gradingActive, studentGrade]);

  const fetchGradingStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/grading_status`);
      if (res.data.status === 1) {
        setGradingActive(true);
        setMessage("");
      } else {
        setGradingActive(false);
        setMessage("Grades are not available yet.");
      }
    } catch (error) {
      console.error("Failed to fetch grading status:", error);
      setMessage("Error fetching grading status.");
    }
  };

  useEffect(() => {
    fetchGradingStatus();
  }, []);

  const getRemarks = (remark) => {
    switch (remark) {
      case 0:
        return "";
      case 1:
        return "PASSED";
      case 2:
        return "FAILED";
      case 3:
        return "INCOMPLETE";
      case 4:
        return "DROP";
      default:
        return "ERROR";
    }
  };

  const convertNumericToGrade = (numeric) => {
    const grade = parseFloat(numeric);

    if (grade >= 97) return 1.0;
    if (grade >= 94) return 1.25;
    if (grade >= 91) return 1.5;
    if (grade >= 88) return 1.75;
    if (grade >= 85) return 2.0;
    if (grade >= 82) return 2.25;
    if (grade >= 79) return 2.5;
    if (grade >= 76) return 2.75;
    if (grade >= 75) return 3.0;
    return 5.0;
  };

  const viewGrade = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/student/view_latest_grades/${userID}`,
      );

      if (res.data.status === "ok") {
        setMessage("");
        setStudentGrade(res.data.grades);
      } else {
        setMessage(res.data.message || "No grades available");
        setStudentGrade([]);
      }
    } catch (err) {
      console.error("Failed to fetch grades:", err);
      setMessage("Error fetching grades.");
    }
  };

  const getUnitDisplay = (row) => {
    const { course_unit, lab_unit } = row;

    const course = parseInt(course_unit) || 0;
    const lab = parseInt(lab_unit) || 0;

    if (course === 0 && lab === 0) return "";
    if (course === 0) return lab;
    if (lab === 0) return course;

    return course + lab;
  };

  // 🔒 Disable right-click
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // 🔒 Block DevTools shortcuts silently
  document.addEventListener("keydown", (e) => {
    const isBlockedKey =
      e.key === "F12" ||
      e.key === "F11" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
      (e.ctrlKey && e.key === "U");

    if (isBlockedKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  return (
    <Box
      sx={{
        height: "calc(100vh - 150px)",
        overflowY: "auto",
        paddingRight: 1,
        backgroundColor: "transparent",
        mt: 1,
        padding: 2,
      }}
    >
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setMessage("")}
          severity="warning"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2, // adds spacing like gutterBottom
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: titleColor,
            fontSize: "36px",
          }}
        >
          STUDENT GRADES
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Typography
            variant="body2"
            sx={{ color: gradingActive ? "green" : "error.main" }}
          >
            {gradingActive
              ? "The grades can now be viewed."
              : "The grades are not yet available."}
          </Typography>
        </Box>
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      {studentGrade.length > 0 ? (
        [
          ...new Set(
            studentGrade.map(
              (row) =>
                `${row.first_year}-${row.last_year} ${row.semester_description}`,
            ),
          ),
        ].map((term, idx) => (
          <Box key={idx} sx={{ mb: 4 }}>
            <Box className="flex mt-[2rem] mb-[1rem]">
              <Typography
                variant="body2"
                className="w-full"
                sx={{ color: "#9E0000", fontWeight: "bold" }}
              >
                Program: {studentGrade[0].program_description} (
                {studentGrade[0].program_code})
              </Typography>
              <Box className="flex gap-[5rem] w-[42rem]">
                <Typography
                  variant="body2"
                  sx={{ color: "#9E0000", fontWeight: "bold" }}
                >
                  School Year: {term.split(" ")[0]}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#9E0000", fontWeight: "bold" }}
                >
                  Semester: {term.split(" ").slice(1).join(" ")}
                </Typography>
              </Box>
            </Box>

            <TableContainer
              component={Paper}
              sx={{ marginTop: "1rem", boxShadow: "none" }}
            >
              <Table size="small">
                <TableHead
                  sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
                >
                  <TableRow>
                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        color: "#fff",
                        width: "150px",
                        minWidth: "150px",
                        maxWidth: "150px",
                        overflow: "hidden",
                      }}
                    >
                      <strong>Code</strong>
                    </TableCell>
                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        color: "#fff",
                        width: "45rem",
                        minWidth: "45rem",
                        maxWidth: "45rem",
                        overflow: "hidden",
                      }}
                    >
                      <strong>Subject</strong>
                    </TableCell>
                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        color: "#fff",
                        width: "15rem",
                        minWidth: "15rem",
                        maxWidth: "15rem",
                        overflow: "hidden",
                      }}
                      align="center"
                    >
                      <strong>Faculty Name</strong>
                    </TableCell>
                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        color: "#fff",
                        width: "5rem",
                        minWidth: "5rem",
                        maxWidth: "5rem",
                        overflow: "hidden",
                      }}
                      align="center"
                    >
                      <strong>Units</strong>
                    </TableCell>
                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        color: "#fff",
                        width: "10rem",
                        minWidth: "10rem",
                        maxWidth: "10rem",
                        overflow: "hidden",
                      }}
                      align="center"
                    >
                      <strong>Section</strong>
                    </TableCell>
                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        color: "#fff",
                      }}
                      align="center"
                    >
                      <strong>Final Grade</strong>
                    </TableCell>
                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        color: "#fff",
                      }}
                      align="center"
                    >
                      <strong>Status</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentGrade
                    .filter(
                      (row) =>
                        `${row.first_year}-${row.last_year} ${row.semester_description}` ===
                        term,
                    )
                    .sort((a, b) =>
                      (a.course_code || "").localeCompare(
                        b.course_code || "",
                      ),
                    )
                    .map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            width: "150px",
                            minWidth: "150px",
                            maxWidth: "150px",
                            overflow: "hidden",
                          }}
                        >
                          {row.course_code}
                        </TableCell>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            width: "45rem",
                            minWidth: "45rem",
                            maxWidth: "45rem",
                            overflow: "hidden",
                          }}
                        >
                          {row.course_description}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: `2px solid ${borderColor}`,
                            width: "15rem",
                            minWidth: "15rem",
                            maxWidth: "15rem",
                            overflow: "hidden",
                          }}
                        >
                          {row.fname === "TBA" && row.lname === "TBA"
                            ? "TBA"
                            : `Prof. ${row.fname} ${row.lname}`}
                        </TableCell>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            width: "5rem",
                            minWidth: "5rem",
                            maxWidth: "5rem",
                            overflow: "hidden",
                          }}
                          align="center"
                        >
                          {getUnitDisplay(row)}
                        </TableCell>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            width: "10rem",
                            minWidth: "10rem",
                            maxWidth: "10rem",
                            overflow: "hidden",
                          }}
                        >
                          {row.program_code}-{row.section_description}
                        </TableCell>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            width: "8rem",
                            minWidth: "8rem",
                            maxWidth: "8rem",
                            overflow: "hidden",
                          }}
                          align="center"
                        >
                          {convertNumericToGrade(row.final_grade ?? "")}
                        </TableCell>
                        <TableCell
                          style={{ border: `2px solid ${borderColor}` }}
                          align="center"
                        >
                          {row.en_remarks ? getRemarks(row.en_remarks) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  {(() => {
                    // Group The Subject by term
                    const termGrades = studentGrade
                      .filter(
                        (row) =>
                          `${row.first_year}-${row.last_year} ${row.semester_description}` ===
                          term,
                      )
                      .sort((a, b) =>
                        (a.course_code || "").localeCompare(
                          b.course_code || "",
                        ),
                      );
                    // Calculate the Computed Grades per Subject
                    const computedGrades = termGrades
                      .map((row) => {
                        const grade = parseFloat(row.final_grade);
                        if (isNaN(grade)) return null;

                        const units =
                          row.course_unit === 0 && row.lab_unit === 0
                            ? 0
                            : row.course_unit === 0
                              ? row.lab_unit
                              : row.lab_unit === 0
                                ? row.course_unit
                                : row.course_unit + row.lab_unit;

                        return { CG: grade * units, units };
                      })
                      .filter((item) => item && item.units > 0);

                    // Calculate the Total Units per term
                    const totalUnits = computedGrades.reduce(
                      (sum, item) => sum + item.units,
                      0,
                    );

                    // Calculate the Total Computed Grade per term
                    const totalComputedGrade = computedGrades.reduce(
                      (sum, item) => sum + item.CG,
                      0,
                    );

                    // Divide natin TCG at TU to get the GWA
                    const gwa =
                      totalUnits > 0
                        ? (totalComputedGrade / totalUnits).toFixed(2)
                        : "";

                    return (
                      <TableRow>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            width: "8rem",
                            minWidth: "8rem",
                            maxWidth: "8rem",
                            fontWeight: "bold",
                            backgroundColor: "#f9f9f9",
                          }}
                          colSpan={4}
                        ></TableCell>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            fontWeight: "bold",
                            color: "#9E0000",
                            fontWeight: "bold",

                            backgroundColor: "#f9f9f9",
                          }}
                          align="center"
                        >
                          GWA
                        </TableCell>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            width: "8rem",
                            minWidth: "8rem",
                            maxWidth: "8rem",
                            fontWeight: "bold",
                            backgroundColor: "#f9f9f9",
                          }}
                          align="center"
                        >
                          {gwa}
                        </TableCell>
                        <TableCell
                          style={{
                            border: `2px solid ${borderColor}`,
                            fontWeight: "bold",
                            backgroundColor: "#f9f9f9",
                          }}
                          align="center"
                        ></TableCell>
                      </TableRow>
                    );
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      ) : (
        <Typography>No grades available</Typography>
      )}
    </Box>
  );
};

export default StudentGradingPage;
