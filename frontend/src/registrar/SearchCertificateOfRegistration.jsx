import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  TextField,
  Typography,
  Card,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import '../styles/Print.css'
import CertificateOfRegistration from '../registrar/CertificateOfRegistrationForRegistrar';
import SearchIcon from "@mui/icons-material/Search";
import { FcPrint } from "react-icons/fc";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ClassIcon from "@mui/icons-material/Class";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import GradeIcon from "@mui/icons-material/Grade";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import { useLocation, useNavigate } from "react-router-dom";
import API_BASE_URL from "../apiConfig";

import UploadFileIcon from '@mui/icons-material/UploadFile';
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";

const SearchCertificateOfRegistration = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff");   // ✅ NEW
  const [stepperColor, setStepperColor] = useState("#000000");       // ✅ NEW

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
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);   // ✅ NEW
    if (settings.stepper_color) setStepperColor(settings.stepper_color);           // ✅ NEW

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

  // Also put it at the very top
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");

  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const pageId = 56;

  const [employeeID, setEmployeeID] = useState("");
  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    const storedEmployeeID = localStorage.getItem("employee_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);
      setEmployeeID(storedEmployeeID);

      if (storedRole === "registrar") {
        checkAccess(storedEmployeeID);
      } else {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const checkAccess = async (employeeID) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`);
      if (response.data && response.data.page_privilege === 1) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      if (error.response && error.response.data.message) {
        console.log(error.response.data.message);
      } else {
        console.log("An unexpected error occurred.");
      }
      setLoading(false);
    }
  };



  const navigate = useNavigate();
  const location = useLocation();
  const isTabNavigationRef = useRef(false);
  const REGISTRAR_COR_SEARCH_KEY = "registrar_cor_search_student_number";

  const [activeStep, setActiveStep] = useState(3);
  const [clickedSteps, setClickedSteps] = useState([]);

  const tabs1 = [
    { label: "Student Records", to: "/student_list", icon: <ListAltIcon /> },
    { label: "Applicant Form", to: "/readmission_dashboard1", icon: <PersonAddIcon /> },
    { label: "Submitted Documents", to: "/submitted_documents", icon: <UploadFileIcon /> },
    { label: "Search Certificate of Registration", to: "/search_cor", icon: <ListAltIcon /> },
    { label: "Report of Grades", to: "/report_of_grades", icon: <GradeIcon /> },
    { label: "Transcript of Records", to: "/transcript_of_records", icon: <SchoolIcon /> },
  ];

  const [studentNumber, setStudentNumber] = useState(() => {
    return sessionStorage.getItem(REGISTRAR_COR_SEARCH_KEY) || localStorage.getItem("studentNumberForCOR") || "";
  });
  const [debouncedStudentNumber, setDebouncedStudentNumber] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentData, setStudentData] = useState([]);
  const [studentDetails, setStudentDetails] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  useEffect(() => {
    if (!debouncedStudentNumber || debouncedStudentNumber.length < 5) {
      setSelectedStudent(null);
      setStudentData([]);
      setStudentDetails([]);
      return;
    }

    const fetchStudent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/program_evaluation/${debouncedStudentNumber}`);
        const data = await res.json();


        if (data) {
          setSelectedStudent(data);
          setStudentData(data);

          const detailsRes = await fetch(`${API_BASE_URL}/api/program_evaluation/details/${debouncedStudentNumber}`);
          const detailsData = await detailsRes.json();
          if (Array.isArray(detailsData) && detailsData.length > 0) {
            setStudentDetails(detailsData);
          } else {
            setStudentDetails([]);
            showSnackbar("No enrolled subjects found for this student.", "info");
          }
        } else {
          setSelectedStudent(null);
          setStudentData([]);
          setStudentDetails([]);
          showSnackbar("No student data found.", "info");
        }
      } catch (err) {
        console.error("Error fetching student", err);
        showSnackbar("Server error. Please try again.", "error");
      }
    };

    fetchStudent();
  }, [debouncedStudentNumber]);


  const handleStepClick = (index, to) => {
    setActiveStep(index);

    isTabNavigationRef.current = true;
    const trimmed = studentNumber.trim();
    if (trimmed) {
      sessionStorage.setItem(REGISTRAR_COR_SEARCH_KEY, trimmed);
    } else {
      sessionStorage.removeItem(REGISTRAR_COR_SEARCH_KEY);
    }
    const pid = trimmed;

    if (pid && pid !== "undefined" && pid !== "null" && pid.length >= 9) {
      navigate(`${to}?student_number=${pid}`);
    } else {
      navigate(to);
    }
  };

  const divToPrintRef = useRef();
  const [pdfLoading, setPdfLoading] = useState(false);

 const handleGeneratePdf = async () => {
  if (!divToPrintRef.current || pdfLoading) return;

  setPdfLoading(true);

  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Certificate of Registration</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial;
            }
          </style>
        </head>
        <body>
          ${divToPrintRef.current.innerHTML}
        </body>
      </html>
    `;

    const res = await fetch(`${API_BASE_URL}/api/generate-cor-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html }),
    });

    const contentType = res.headers.get("content-type");

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error("Backend error:", errorData);
      throw new Error(errorData?.error || "PDF failed");
    }

    if (!contentType || !contentType.includes("application/pdf")) {
      const text = await res.text();
      console.error("Unexpected response:", text);
      throw new Error("Server did not return a valid PDF");
    }

    const blob = await res.blob();

    if (blob.size === 0) {
      throw new Error("Generated PDF is empty");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certificate_of_registration.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Generate PDF error:", err);
    alert(err.message || "PDF failed");
  } finally {
    setPdfLoading(false);
  }
};





  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const studentNumberFromUrl = queryParams.get("student_number")?.trim() || "";
    const storedStudentNumber =
      sessionStorage.getItem("edit_student_number")?.trim() || "";
    const nextStudentNumber =
      studentNumberFromUrl ||
      sessionStorage.getItem(REGISTRAR_COR_SEARCH_KEY) ||
      localStorage.getItem("studentNumberForCOR") ||
      storedStudentNumber;

    if (
      nextStudentNumber &&
      nextStudentNumber !== "undefined" &&
      nextStudentNumber !== "null" &&
      nextStudentNumber !== studentNumber
    ) {
      setStudentNumber(nextStudentNumber);
      sessionStorage.setItem(REGISTRAR_COR_SEARCH_KEY, nextStudentNumber);
      sessionStorage.setItem("edit_student_number", nextStudentNumber);
    }
  }, [location.search]);

  useEffect(() => {
    const trimmed = studentNumber.trim();
    if (trimmed.length < 5) {
      setDebouncedStudentNumber("");
      return;
    }

    const delayDebounce = setTimeout(() => {
      setDebouncedStudentNumber(trimmed);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [studentNumber]);

  useEffect(() => {
    if (studentNumber) {
      sessionStorage.setItem(REGISTRAR_COR_SEARCH_KEY, studentNumber.trim());
      sessionStorage.setItem("edit_student_number", studentNumber.trim());
      localStorage.removeItem("studentNumberForCOR");
    }
  }, [studentNumber]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(REGISTRAR_COR_SEARCH_KEY);
      localStorage.removeItem("studentNumberForCOR");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (!isTabNavigationRef.current) {
        sessionStorage.removeItem(REGISTRAR_COR_SEARCH_KEY);
        localStorage.removeItem("studentNumberForCOR");
      }
    };
  }, []);

  // Put this at the very bottom before the return 
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return (
      <Unauthorized />
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",

          mb: 2,

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
          SEARCH CERTIFICATE OF REGISTRATION
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Enter Student Number"
          size="small"
          value={studentNumber}

          onChange={(e) => setStudentNumber(e.target.value)}
          sx={{
            width: 450,
            backgroundColor: "#fff",
            borderRadius: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
            },
          }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: "gray" }} />,
          }}
        />
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />
     
      <br />


      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          mt: 2,
        }}
      >
        {tabs1.map((tab, index) => (
          <React.Fragment key={index}>
            {/* Step Card */}
            <Card
              onClick={() => handleStepClick(index, tab.to)}
              sx={{
                flex: 1,
                maxWidth: `${100 / tabs1.length}%`, // evenly fit 100%
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: 2,
                border: `2px solid ${borderColor}`,
                backgroundColor: activeStep === index ? settings?.header_color || "#1976d2" : "#E8C999",
                color: activeStep === index ? "#fff" : "#000",
                boxShadow:
                  activeStep === index
                    ? "0px 4px 10px rgba(0,0,0,0.3)"
                    : "0px 2px 6px rgba(0,0,0,0.15)",
                transition: "0.3s ease",
                "&:hover": {
                  backgroundColor: activeStep === index ? "#000000" : "#f5d98f",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box sx={{ fontSize: 32, mb: 0.5 }}>{tab.icon}</Box>
                <Typography
                  sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}
                >
                  {tab.label}
                </Typography>
              </Box>
            </Card>

            {/* Spacer instead of line */}
            {index < tabs1.length - 1 && (
              <Box
                sx={{
                  flex: 0.1,
                  mx: 1, // margin to keep spacing
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>


      <br />
       <TableContainer component={Paper} sx={{ width: '100%' }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", border: `2px solid ${borderColor}`, }}>
            <TableRow>
              {/* Left cell: Student Number */}
              <TableCell sx={{ color: 'white', fontSize: '20px', fontFamily: "Poppins, sans-serif", border: 'none' }}>
                Student Number:&nbsp;
                <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: "normal", textDecoration: "underline" }}>
                  {studentData.student_number || "N/A"}

                </span>
              </TableCell>

              {/* Right cell: Student Name */}
              <TableCell
                align="right"
                sx={{ color: 'white', fontSize: '20px', fontFamily: "Poppins, sans-serif", border: 'none' }}
              >
                Student Name:&nbsp;
                <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: "normal", textDecoration: "underline" }}>
                  {studentData && studentData.last_name
                    ? `${studentData.last_name.toUpperCase()}, ${studentData.first_name.toUpperCase()} ${studentData.middle_name.toUpperCase()}`
                    : "N/A"}
                </span>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <button
        onClick={handleGeneratePdf}
        style={{
          marginBottom: "1rem",
          padding: "10px 20px",
          border: "2px solid black",
          backgroundColor: "#f0f0f0",
          color: "black",
          borderRadius: "5px",
          marginTop: "20px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          transition: "background-color 0.3s, transform 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#d3d3d3")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
        onMouseDown={(e) => (e.target.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FcPrint size={20} />
          Generate Certificate PDF
        </span>
      </button>

      <div
        ref={divToPrintRef}
        style={{
          transform: "scale(0.9)",       // 👈 10% zoom out
          transformOrigin: "top center", // keeps it centered
        }}
      >
        <CertificateOfRegistration
          student_number={debouncedStudentNumber}
          onNotify={({ message, severity }) => showSnackbar(message, severity)}
        />
      </div>


      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SearchCertificateOfRegistration;
