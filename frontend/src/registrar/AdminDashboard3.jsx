import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import { Button, Box, TextField, Container, Card, Modal, TableContainer, Paper, Table, TableHead, TableRow, TableCell, Typography, FormControl, FormHelperText, InputLabel, Select, MenuItem, Checkbox, FormControlLabel } from "@mui/material";
import { Link } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import InfoIcon from "@mui/icons-material/Info";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorIcon from '@mui/icons-material/Error';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from "framer-motion";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PeopleIcon from "@mui/icons-material/People";
import ExamPermit from "../applicant/ExamPermit";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import KeyIcon from "@mui/icons-material/Key";
import CampaignIcon from '@mui/icons-material/Campaign';
import ScoreIcon from '@mui/icons-material/Score';
import API_BASE_URL from "../apiConfig";

const AdminDashboard3 = () => {

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


  const stepsData = [
  {
      label: "Admission Process for Registrar",
      to: "/applicant_list_admin",
      icon: <SchoolIcon fontSize="large" />,
    },
    {
      label: "Applicant Form",
      to: "/admin_dashboard1",
      icon: <DashboardIcon fontSize="large" />,
    },
    {
      label: "Student Requirements",
      to: "/student_requirements",
      icon: <AssignmentIcon fontSize="large" />,
    },
    {
      label: "Entrance Exam Schedule Management",
      to: "/assign_schedule_applicant",
      icon: <ScheduleIcon fontSize="large" />,
    },

    {
      label: "Examination Permit",
      to: "/registrar_examination_profile",
      icon: <PersonSearchIcon fontSize="large" />,
    },


    {
      label: "Entrance Examination Score",
      to: "/applicant_scoring",
      icon: <ScoreIcon fontSize="large" />,
    },
  ];
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState(Array(stepsData.length).fill(false));

  const fetchByPersonId = async (personID) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/person_with_applicant/${personID}`);
      setPerson(res.data);
      setSelectedPerson(res.data);
      if (res.data?.applicant_number) {
      }
    } catch (err) {
      console.error("❌ person_with_applicant failed:", err);
    }
  };

  const handleNavigateStep = (index, to) => {
    setCurrentStep(index);

    const pid = sessionStorage.getItem("admin_edit_person_id");
    if (pid) {
      navigate(`${to}?person_id=${pid}`);
    } else {
      navigate(to);
    }
  };


  const navigate = useNavigate();
  const [explicitSelection, setExplicitSelection] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [person, setPerson] = useState({
    schoolLevel: "",
    schoolLastAttended: "",
    schoolAddress: "",
    courseProgram: "",
    honor: "",
    generalAverage: "",
    yearGraduated: "",
    schoolLevel1: "",
    schoolLastAttended1: "",
    schoolAddress1: "",
    courseProgram1: "",
    honor1: "",
    generalAverage1: "",
    yearGraduated1: "",
    strand: "",
  });
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const queryPersonId = queryParams.get("person_id")?.trim() || "";

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const loggedInPersonId = localStorage.getItem("person_id");

    if (!storedUser || !storedRole || !loggedInPersonId) {
      window.location.href = "/login";
      return;
    }

    setUser(storedUser);
    setUserRole(storedRole);

    const allowedRoles = ["registrar", "applicant", "superadmin"];
    if (!allowedRoles.includes(storedRole)) {
      window.location.href = "/login";
      return;
    }

    const lastSelected = sessionStorage.getItem("admin_edit_person_id");

    // ⭐ CASE 1: URL HAS ?person_id=
    if (queryPersonId !== "") {
      sessionStorage.setItem("admin_edit_person_id", queryPersonId);
      setUserID(queryPersonId);
      return;
    }

    // ⭐ CASE 2: URL has NO ID but we have a last selected student
    if (lastSelected) {
      setUserID(lastSelected);
      return;
    }

    // ⭐ CASE 3: No URL ID and no last selected → start blank
    setUserID("");
  }, [queryPersonId]);





  // Check access
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedEmployeeID = localStorage.getItem("employee_id");
    if (storedRole === "registrar") {
      setUserRole(storedRole);
      setEmployeeID(storedEmployeeID);
      checkAccess(storedEmployeeID);
    } else {
      window.location.href = "/login";
    }
  }, []);


  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 3;

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

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const loggedInPersonId = localStorage.getItem("person_id");
    const searchedPersonId = sessionStorage.getItem("admin_edit_person_id");

    if (!storedUser || !storedRole || !loggedInPersonId) {
      window.location.href = "/login";
      return;
    }

    setUser(storedUser);
    setUserRole(storedRole);

    // Roles that can access
    const allowedRoles = ["registrar", "applicant", "superadmin"];
    if (allowedRoles.includes(storedRole)) {
      // ✅ Always take URL param first
      const targetId = queryPersonId || searchedPersonId || loggedInPersonId;

      // Save it so other pages (ECAT, forms) can use it
      sessionStorage.setItem("admin_edit_person_id", targetId);

      setUserID(targetId);
      fetchPersonData(targetId);
      return;
    }

    window.location.href = "/login";
  }, [queryPersonId]);

  useEffect(() => {
    let consumedFlag = false;

    const tryLoad = async () => {
      if (queryPersonId) {
        await fetchByPersonId(queryPersonId);
        setExplicitSelection(true);
        consumedFlag = true;
        return;
      }

      // fallback only if it's a fresh selection from Applicant List
      const source = sessionStorage.getItem("admin_edit_person_id_source");
      const tsStr = sessionStorage.getItem("admin_edit_person_id_ts");
      const id = sessionStorage.getItem("admin_edit_person_id");
      const ts = tsStr ? parseInt(tsStr, 10) : 0;
      const isFresh = source === "applicant_list" && Date.now() - ts < 5 * 60 * 1000;

      if (id && isFresh) {
        await fetchByPersonId(id);
        setExplicitSelection(true);
        consumedFlag = true;
      }
    };

    tryLoad().finally(() => {
      // consume the freshness so it won't auto-load again later
      if (consumedFlag) {
        sessionStorage.removeItem("admin_edit_person_id_source");
        sessionStorage.removeItem("admin_edit_person_id_ts");
      }
    });
  }, [queryPersonId]);




  const fetchPersonData = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/person/${id}`);
      const sanitizedData = Object.fromEntries(
        Object.entries(res.data).map(([key, value]) => [key, value ?? ""])
      );
      setPerson(sanitizedData);
    } catch (error) {
      console.error(error);
    }
  };

  // Real-time save on every character typed
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const updatedPerson = {
      ...person,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    };
    setPerson(updatedPerson);
    handleUpdate(updatedPerson); // No delay, real-time save
  };


  // ✅ Safe handleBlur for SuperAdmin — updates correct applicant only
  const handleBlur = async () => {
    try {
      // ✅ Determine correct applicant/person_id
      const targetId = selectedPerson?.person_id || queryPersonId || person.person_id;
      if (!targetId) {
        console.warn("⚠️ No valid applicant ID found — skipping update.");
        return;
      }

      const allowedFields = [
        "person_id", "profile_img", "campus", "academicProgram", "classifiedAs", "applyingAs",
        "program", "program2", "program3", "yearLevel",
        "last_name", "first_name", "middle_name", "extension", "nickname",
        "height", "weight", "lrnNumber", "nolrnNumber", "gender",
        "pwdMember", "pwdType", "pwdId",
        "birthOfDate", "age", "birthPlace", "languageDialectSpoken",
        "citizenship", "religion", "civilStatus", "tribeEthnicGroup",
        "cellphoneNumber", "emailAddress",
        "presentStreet", "presentBarangay", "presentZipCode", "presentRegion",
        "presentProvince", "presentMunicipality", "presentDswdHouseholdNumber",
        "sameAsPresentAddress",
        "permanentStreet", "permanentBarangay", "permanentZipCode",
        "permanentRegion", "permanentProvince", "permanentMunicipality",
        "permanentDswdHouseholdNumber",
        "solo_parent",
        "father_deceased", "father_family_name", "father_given_name", "father_middle_name",
        "father_ext", "father_nickname", "father_education", "father_education_level",
        "father_last_school", "father_course", "father_year_graduated", "father_school_address",
        "father_contact", "father_occupation", "father_employer", "father_income", "father_email",
        "mother_deceased", "mother_family_name", "mother_given_name", "mother_middle_name",
        "mother_ext", "mother_nickname", "mother_education", "mother_education_level",
        "mother_last_school", "mother_course", "mother_year_graduated", "mother_school_address",
        "mother_contact", "mother_occupation", "mother_employer", "mother_income", "mother_email",
        "guardian", "guardian_family_name", "guardian_given_name", "guardian_middle_name",
        "guardian_ext", "guardian_nickname", "guardian_address", "guardian_contact", "guardian_email",
        "annual_income",
        "schoolLevel", "schoolLastAttended", "schoolAddress", "courseProgram",
        "honor", "generalAverage", "yearGraduated",
        "schoolLevel1", "schoolLastAttended1", "schoolAddress1", "courseProgram1",
        "honor1", "generalAverage1", "yearGraduated1",
        "strand",
        // 🩺 Health and medical
        "cough", "colds", "fever", "asthma", "faintingSpells", "heartDisease",
        "tuberculosis", "frequentHeadaches", "hernia", "chronicCough", "headNeckInjury",
        "hiv", "highBloodPressure", "diabetesMellitus", "allergies", "cancer",
        "smokingCigarette", "alcoholDrinking", "hospitalized", "hospitalizationDetails",
        "medications",
        // 🧬 Covid / Vaccination
        "hadCovid", "covidDate",
        "vaccine1Brand", "vaccine1Date", "vaccine2Brand", "vaccine2Date",
        "booster1Brand", "booster1Date", "booster2Brand", "booster2Date",
        // 🧪 Lab results / medical findings
        "chestXray", "cbc", "urinalysis", "otherworkups",
        // 🧍 Additional fields
        "symptomsToday", "remarks",
        // ✅ Agreement / Meta
        "termsOfAgreement", "created_at", "current_step"
      ];

      // ✅ Clean payload before sending
      const cleanedData = Object.fromEntries(
        Object.entries(person).filter(([key]) => allowedFields.includes(key))
      );

      if (Object.keys(cleanedData).length === 0) {
        console.warn("⚠️ No valid fields to update — skipping blur save.");
        return;
      }

      // ✅ Execute safe update
      await axios.put(`${API_BASE_URL}/api/person/${targetId}`, cleanedData);
      console.log(`💾 Auto-saved (on blur) for person_id: ${targetId}`);
    } catch (err) {
      console.error("❌ Auto-save (on blur) failed:", {
        message: err.message,
        status: err.response?.status,
        details: err.response?.data || err,
      });
    }
  };



  // Do not alter
  const handleUpdate = async (updatedData) => {
    if (!person || !person.person_id) return;

    try {
      await axios.put(`${API_BASE_URL}/api/person/${person.person_id}`, updatedData);
      console.log("✅ Auto-saved successfully");
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
    }
  };




  const steps = person.person_id
    ? [
      { label: "Personal Information", icon: <PersonIcon />, path: `/admin_dashboard1?person_id=${userID}` },
      { label: "Family Background", icon: <FamilyRestroomIcon />, path: `/admin_dashboard2?person_id=${userID}` },
      { label: "Educational Attainment", icon: <SchoolIcon />, path: `/admin_dashboard3?person_id=${userID}` },
      { label: "Health Medical Records", icon: <HealthAndSafetyIcon />, path: `/admin_dashboard4?person_id=${userID}` },
      { label: "Other Information", icon: <InfoIcon />, path: `/admin_dashboard5?person_id=${userID}` },
    ]
    : [];



  const [activeStep, setActiveStep] = useState(2);


  const [errors, setErrors] = useState({});



  const [clickedSteps, setClickedSteps] = useState(Array(steps.length).fill(false));

  const handleStepClick = (index) => {
    setActiveStep(index);
    const newClickedSteps = [...clickedSteps];
    newClickedSteps[index] = true;
    setClickedSteps(newClickedSteps);
  };


  const divToPrintRef = useRef();
  const [showPrintView, setShowPrintView] = useState(false);

  const printDiv = () => {
    const divToPrint = divToPrintRef.current;
    if (divToPrint) {
      const newWin = window.open("", "Print-Window");
      newWin.document.open();
      newWin.document.write(`
        <html>
          <head>
            <title>Examination Permit</title>
            <style>
              @page { size: A4; margin: 0; }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                margin-left: "
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .print-container {
                width: 8.5in;
                min-height: 11in;
                margin: auto;
                background: white;
              }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            </style>
          </head>
          <body onload="window.print(); setTimeout(() => window.close(), 100);">
            <div class="print-container">${divToPrint.innerHTML}</div>
          </body>
        </html>
      `);
      newWin.document.close();
    }
  };


  const [examPermitError, setExamPermitError] = useState("");
  const [examPermitModalOpen, setExamPermitModalOpen] = useState(false);

  const handleCloseExamPermitModal = () => {
    setExamPermitModalOpen(false);
    setExamPermitError("");
  };

  const handleExamPermitClick = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/verified-exam-applicants`);
      const verified = res.data.some(a => a.person_id === parseInt(userID));

      if (!verified) {
        setExamPermitError("❌ You cannot print the Exam Permit until all required documents are verified.");
        setExamPermitModalOpen(true);
        return;
      }

      // ✅ Render permit and print
      setShowPrintView(true);
      setTimeout(() => {
        printDiv();
        setShowPrintView(false);
      }, 500);
    } catch (err) {
      console.error("Error verifying exam permit eligibility:", err);
      setExamPermitError("⚠️ Unable to check document verification status right now.");
      setExamPermitModalOpen(true);
    }
  };

  const links = [
    {
      to: userID ? `/admin_ecat_application_form?person_id=${userID}` : "/admin_ecat_application_form",
      label: "ECAT Application Form",
    },
    {
      to: userID ? `/admin_admission_form_process?person_id=${userID}` : "/admin_admission_form_process",
      label: "Admission Form Process",
    },
    {
      to: userID ? `/admin_personal_data_form?person_id=${userID}` : "/admin_personal_data_form",
      label: "Personal Data Form",
    },
    {
      to: userID ? `/admin_office_of_the_registrar?person_id=${userID}` : "/admin_office_of_the_registrar",
      label: `Application For ${shortTerm ? shortTerm.toUpperCase() : ""} College Admission`,
    },
    { to: "/admission_services", label: "Application/Student Satisfactory Survey" },
    { label: "Examination Permit", onClick: handleExamPermitClick },
  ];






  const [canPrintPermit, setCanPrintPermit] = useState(false);

  useEffect(() => {
    if (!userID) return;
    axios.get(`${API_BASE_URL}/api/verified-exam-applicants`)
      .then(res => {
        const verified = res.data.some(a => a.person_id === parseInt(userID));
        setCanPrintPermit(verified);
      });
  }, [userID]);


  // 🔒 Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 🔒 Block DevTools shortcuts + Ctrl+P silently
  document.addEventListener('keydown', (e) => {
    const isBlockedKey =
      e.key === 'F12' || // DevTools
      e.key === 'F11' || // Fullscreen
      (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) || // Ctrl+Shift+I/J
      (e.ctrlKey && e.key.toLowerCase() === 'u') || // Ctrl+U (View Source)
      (e.ctrlKey && e.key.toLowerCase() === 'p');   // Ctrl+P (Print)

    if (isBlockedKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  });





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
      {showPrintView && (
        <div ref={divToPrintRef} style={{ display: "block" }}>
          <ExamPermit personId={userID} />   {/* ✅ pass the searched person_id */}
        </div>
      )}


      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',

          mb: 2,

        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: titleColor,
            fontSize: '36px',
          }}
        >
          ADMISSION SHIFTING FORM - EDUCATIONAL ATTAINMENT
        </Typography>
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

        }}
      >
        {stepsData.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step Card */}
            <Card
              onClick={() => handleNavigateStep(index, step.to)}
              sx={{
                flex: 1,
                maxWidth: `${100 / stepsData.length}%`, // evenly fit 100%
                height: 135,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: 2,
                border: `2px solid ${borderColor}`,
                backgroundColor: currentStep === index ? settings?.header_color || "#1976d2" : "#E8C999",
                color: currentStep === index ? "#fff" : "#000",
                boxShadow:
                  currentStep === index
                    ? "0px 4px 10px rgba(0,0,0,0.3)"
                    : "0px 2px 6px rgba(0,0,0,0.15)",
                transition: "0.3s ease",
                "&:hover": {
                  backgroundColor: currentStep === index ? "#000" : "#f5d98f",
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
                <Box sx={{ fontSize: 32, mb: 0.5 }}>{step.icon}</Box>
                <Typography
                  sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}
                >
                  {step.label}
                </Typography>
              </Box>
            </Card>

            {/* Spacer instead of line */}
            {index < stepsData.length - 1 && (
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

      <div style={{ height: "40px" }}></div>




      <TableContainer component={Paper} sx={{ width: '100%', mb: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", border: `2px solid ${borderColor}`, }}>
            <TableRow>
              {/* Left cell: Applicant ID */}
              <TableCell sx={{ color: 'white', fontSize: '20px', fontFamily: 'Arial Black', }}>
                Applicant ID:&nbsp;
                <span style={{ fontFamily: "Arial", fontWeight: "normal", textDecoration: "underline" }}>
                  {person?.applicant_number || "N/A"}

                </span>
              </TableCell>

              {/* Right cell: Applicant Name */}
              <TableCell
                align="right"
                sx={{ color: 'white', fontSize: '20px', fontFamily: 'Arial Black', border: 'none' }}
              >
                Applicant Name:&nbsp;
                <span style={{ fontFamily: "Arial", fontWeight: "normal", textDecoration: "underline" }}>
                  {person?.last_name?.toUpperCase()}, {person?.first_name?.toUpperCase()}{" "}
                  {person?.middle_name?.toUpperCase()} {person?.extension?.toUpperCase() || ""}
                </span>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>


      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          mt: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            borderRadius: "10px",
            backgroundColor: "#fffaf5",
            border: "1px solid #6D2323",
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#800000",
              borderRadius: "8px",
              width: 60,
              height: 60,
              flexShrink: 0,
            }}
          >
            <ErrorIcon sx={{ color: "white", fontSize: 40 }} />
          </Box>

          {/* Text */}
          <Typography
            sx={{
              fontSize: "20px",
              fontFamily: "Arial",
              color: "#3e3e3e",
              lineHeight: 1.3, // slightly tighter to fit in fewer rows
              whiteSpace: "normal",
              overflow: "hidden",
            }}
          >
            <strong style={{ color: "maroon" }}>Notice:</strong> &nbsp;
            <strong></strong> <span style={{ fontSize: '1.2em', margin: '0 15px' }}>➔</span> Kindly type 'NA' in boxes where there are no possible answers to the information being requested. &nbsp;  &nbsp; <br />
            <strong></strong> <span style={{ fontSize: '1.2em', margin: '0 15px', marginLeft: "100px", }}>➔</span> To make use of the letter 'Ñ', please press ALT while typing "165", while for 'ñ', please press ALT while typing "164"

          </Typography>
        </Box>
      </Box>

      <h1
        style={{
          fontSize: "30px",
          fontWeight: "bold",
          textAlign: "center",
          color: "black",
          marginTop: "25px",
        }}
      >
        AVAILABLE PRINTABLE DOCUMENTS
      </h1>





      {/* Cards Section */}

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mt: 2,
          pb: 1,
          justifyContent: "center", // Centers all cards horizontally
        }}
      >
        {links.map((lnk, i) => (
          <motion.div
            key={i}
            style={{ flex: "0 0 calc(30% - 16px)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card
              sx={{
                minHeight: 60,
                borderRadius: 2,
                border: `2px solid ${borderColor}`,
                backgroundColor: "#fff",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                p: 1.5,
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                  backgroundColor: settings?.header_color || "#1976d2",

                  "& .card-text": {
                    color: "#fff", // ✅ text becomes white
                  },
                  "& .card-icon": {
                    color: "#fff", // ✅ icon becomes white
                  },
                },
              }}
              onClick={() => {
                if (lnk.onClick) {
                  lnk.onClick(); // run handler
                } else if (lnk.to) {
                  navigate(lnk.to); // navigate if it has a `to`
                }
              }}
            >
              {/* Icon */}
              <PictureAsPdfIcon
                className="card-icon"
                sx={{ fontSize: 35, color: mainButtonColor, mr: 1.5 }}
              />

              {/* Label */}
              <Typography
                className="card-text"
                sx={{
                  color: mainButtonColor,
                  fontFamily: "Arial",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                {lnk.label}
              </Typography>
            </Card>
          </motion.div>
        ))}
      </Box>








      <Container>

        <Container>
          <h1
            style={{
              fontSize: "50px",
              fontWeight: "bold",
              textAlign: "center",
              color: subtitleColor,
              marginTop: "25px",
            }}
          >
            APPLICANT FORM
          </h1>
          <div style={{ textAlign: "center" }}>
            Complete the applicant form to secure your place for the upcoming academic year at{" "}
            {shortTerm ? (
              <>
                <strong>{shortTerm.toUpperCase()}</strong> <br />
                {companyName || ""}
              </>
            ) : (
              companyName || ""
            )}
            .
          </div>


        </Container>


        <br />
        {person.person_id && (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", px: 4 }}>
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                {/* Wrap the step with Link for routing */}
                <Link to={step.path} style={{ textDecoration: "none" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => handleStepClick(index)}
                  >
                    {/* Step Icon */}
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        border: `2px solid ${borderColor}`,
                        backgroundColor: activeStep === index ? settings?.header_color || "#1976d2" : "#E8C999",
                        color: activeStep === index ? "#fff" : "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {step.icon}
                    </Box>

                    {/* Step Label */}
                    <Typography
                      sx={{
                        mt: 1,
                        color: activeStep === index ? "#6D2323" : "#000",
                        fontWeight: activeStep === index ? "bold" : "normal",
                        fontSize: 14,
                      }}
                    >
                      {step.label}
                    </Typography>
                  </Box>
                </Link>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <Box
                    sx={{
                      height: "2px",
                      backgroundcolor: mainButtonColor,
                      flex: 1,
                      alignSelf: "center",
                      mx: 2,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        )}
        <br />

        <form>
          <Container
            maxWidth="100%"
            sx={{
              backgroundColor: settings?.header_color || "#1976d2",
              border: "2px solid black",
              maxHeight: "500px",
              overflowY: "auto",
              color: "white",
              borderRadius: 2,
              boxShadow: 3,
              padding: "4px",
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Typography style={{ fontSize: "20px", padding: "10px", fontFamily: "Arial Black" }}>Step 3: Educational Attainment</Typography>
            </Box>
          </Container>

          <Container maxWidth="100%" sx={{ backgroundColor: "#f1f1f1", border: `2px solid ${borderColor}`, padding: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography style={{ fontSize: "20px", color: mainButtonColor, fontWeight: "bold" }}>Junior High School - Background:</Typography>
            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br />


            <Box
              sx={{
                display: "flex",
                flexWrap: "nowrap",   // 🔥 forces one row only
                gap: 2,
                mb: 2,
              }}
            >
              {/* Educational Attainment */}
              <Box sx={{ flex: "1" }}>
                <Typography variant="subtitle1" mb={1} sx={{ minHeight: "32px" }}>
                  Educational Attainment
                </Typography>

                <FormControl fullWidth size="small" required error={!!errors.schoolLevel}>
                  <InputLabel id="schoolLevel-label">Educational Attainment</InputLabel>
                  <Select
                    readOnly
                    labelId="schoolLevel-label"
                    id="schoolLevel"
                    name="schoolLevel"
                    value={person.schoolLevel ?? ""}
                    label="Educational Attainment"
                    onChange={handleChange}
                    onBlur={() => handleUpdate(person)}
                  >
                    <MenuItem value="">
                      <em>Select School Level</em>
                    </MenuItem>
                    <MenuItem value="High School/Junior High School">
                      High School/Junior High School
                    </MenuItem>
                    <MenuItem value="ALS">ALS</MenuItem>
                  </Select>
                  {errors.schoolLevel && (
                    <FormHelperText>This field is required.</FormHelperText>
                  )}
                </FormControl>
              </Box>

              {/* School Last Attended */}
              <Box sx={{ flex: "1" }}>
                <Typography variant="subtitle1" mb={1} sx={{ minHeight: "32px" }}>
                  School Last Attended
                </Typography>

                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="schoolLastAttended"
                  placeholder="Enter School Last Attended"
                  value={person.schoolLastAttended || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}
                  error={errors.schoolLastAttended}
                  helperText={
                    errors.schoolLastAttended ? "This field is required." : ""
                  }
                />
              </Box>

              {/* School Address */}
              <Box sx={{ flex: "1" }}>
                <Typography
                  variant="subtitle1"
                  mb={1}
                  sx={{ minHeight: "32px", fontSize: "12.5px" }}
                >
                  School Full Address (Street / BRGY / City)
                </Typography>

                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="schoolAddress"
                  placeholder="Enter your School Address"
                  value={person.schoolAddress || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}
                  error={errors.schoolAddress}
                  helperText={errors.schoolAddress ? "This field is required." : ""}
                />
              </Box>

              {/* Course Program */}
              <Box sx={{ flex: "1" }}>
                <Typography variant="subtitle1" mb={1} sx={{ minHeight: "32px" }}>
                  Course Program
                </Typography>

                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="courseProgram"
                  placeholder="Enter your Course Program"
                  value={person.courseProgram || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}
                  error={errors.courseProgram}
                  helperText={errors.courseProgram ? "This field is required." : ""}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 2,
              }}
            >
              <Box sx={{ flex: "1 1 33%" }}>
                <Typography variant="subtitle1" mb={1}>
                  Recognition / Awards
                </Typography>
                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  name="honor"
                  required
                  value={person.honor || ""}
                  placeholder="Enter your Honor"
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}

                  error={errors.honor}
                  helperText={errors.honor ? "This field is required." : ""}
                />
              </Box>

              <Box sx={{ flex: "1 1 33%" }}>
                <Typography variant="subtitle1" mb={1}>
                  General Average
                </Typography>
                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="generalAverage"
                  value={person.generalAverage || ""}
                  placeholder="Enter your General Average"
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}

                  error={errors.generalAverage}
                  helperText={errors.generalAverage ? "This field is required." : ""}
                />
              </Box>

              <Box sx={{ flex: "1 1 33%" }}>
                <Typography variant="subtitle1" mb={1}>
                  Year Graduated
                </Typography>
                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="yearGraduated"
                  placeholder="Enter your Year Graduated"
                  value={person.yearGraduated || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}

                  error={errors.yearGraduated}
                  helperText={errors.yearGraduated ? "This field is required." : ""}
                />
              </Box>
            </Box>




            <Typography style={{ fontSize: "20px", color: mainButtonColor, fontWeight: "bold" }}>Senior High School - Background:</Typography>
            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br />

            <Box
              sx={{
                display: "flex",
                flexWrap: "nowrap",
                gap: 2,
                mb: 2,
              }}
            >
              {/* School Level 1 */}
              <Box sx={{ flex: "1" }}>
                <Typography variant="subtitle1" mb={1} sx={{ minHeight: "32px" }}>
                  Educational Attainment
                </Typography>

                <FormControl fullWidth size="small" required error={!!errors.schoolLevel1}>
                  <InputLabel id="schoolLevel1-label">Educational Attainment</InputLabel>
                  <Select
                    readOnly
                    labelId="schoolLevel1-label"
                    id="schoolLevel1"
                    name="schoolLevel1"
                    value={person.schoolLevel1 ?? ""}
                    label="Educational Attainment"
                    onChange={handleChange}
                    onBlur={() => handleUpdate(person)}
                  >
                    <MenuItem value="">
                      <em>Select School Level</em>
                    </MenuItem>
                    <MenuItem value="Senior High School">Senior High School</MenuItem>
                    <MenuItem value="Undergraduate">Undergraduate</MenuItem>
                    <MenuItem value="Graduate">Graduate</MenuItem>
                    <MenuItem value="ALS">ALS</MenuItem>
                  </Select>

                  {errors.schoolLevel1 && (
                    <FormHelperText>This field is required.</FormHelperText>
                  )}
                </FormControl>
              </Box>

              {/* School Last Attended 1 */}
              <Box sx={{ flex: "1" }}>
                <Typography variant="subtitle1" mb={1} sx={{ minHeight: "32px" }}>
                  School Last Attended
                </Typography>

                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="schoolLastAttended1"
                  placeholder="Enter School Last Attended"
                  value={person.schoolLastAttended1 || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}
                  error={errors.schoolLastAttended1}
                  helperText={errors.schoolLastAttended1 ? "This field is required." : ""}
                />
              </Box>

              {/* School Address 1 */}
              <Box sx={{ flex: "1" }}>
                <Typography
                  variant="subtitle1"
                  mb={1}
                  sx={{ minHeight: "32px", fontSize: "12.5px" }}
                >
                  School Full Address (Street / BRGY / City)
                </Typography>

                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="schoolAddress1"
                  placeholder="Enter your School Address"
                  value={person.schoolAddress1 || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}
                  error={errors.schoolAddress1}
                  helperText={errors.schoolAddress1 ? "This field is required." : ""}
                />
              </Box>

              {/* Course Program 1 */}
              <Box sx={{ flex: "1" }}>
                <Typography variant="subtitle1" mb={1} sx={{ minHeight: "32px" }}>
                  Course Program
                </Typography>

                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="courseProgram1"
                  placeholder="Enter your Course Program"
                  value={person.courseProgram1 || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}
                  error={errors.courseProgram1}
                  helperText={errors.courseProgram1 ? "This field is required." : ""}
                />
              </Box>
            </Box>


            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 2,
              }}
            >
              {/* Honor 1 */}
              <Box sx={{ flex: "1 1 33%" }}>
                <Typography variant="subtitle1" mb={1}>
                  Recognition / Awards
                </Typography>
                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="honor1"
                  placeholder="Enter your Honor"
                  value={person.honor1 || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}

                  error={errors.honor1}
                  helperText={errors.honor1 ? "This field is required." : ""}
                />
              </Box>

              {/* General Average 1 */}
              <Box sx={{ flex: "1 1 33%" }}>
                <Typography variant="subtitle1" mb={1}>
                  General Average
                </Typography>
                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="generalAverage1"
                  placeholder="Enter your General Average"
                  value={person.generalAverage1 || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}

                  error={errors.generalAverage1}
                  helperText={errors.generalAverage1 ? "This field is required." : ""}
                />
              </Box>

              {/* Year Graduated 1 */}
              <Box sx={{ flex: "1 1 33%" }}>
                <Typography variant="subtitle1" mb={1}>
                  Year Graduated
                </Typography>
                <TextField
                  InputProps={{ readOnly: true }}

                  fullWidth
                  size="small"
                  required
                  name="yearGraduated1"
                  placeholder="Enter your Year Graduated"
                  value={person.yearGraduated1 || ""}
                  onChange={handleChange}
                  onBlur={() => handleUpdate(person)}

                  error={errors.yearGraduated1}
                  helperText={errors.yearGraduated1 ? "This field is required." : ""}
                />
              </Box>
            </Box>


            <Typography style={{ fontSize: "20px", color: mainButtonColor, fontWeight: "bold" }}>
              Strand (For Senior High School)
            </Typography>
            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br />


            <FormControl fullWidth size="small" required error={!!errors.strand} className="mb-4">
              <InputLabel id="strand-label">Strand</InputLabel>
              <Select
                readOnly
                labelId="strand-label"
                id="strand-select"
                name="strand"
                value={person.strand ?? ""}
                label="Strand"
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <MenuItem value="">
                  <em>Select Strand</em>
                </MenuItem>
                <MenuItem value="Accountancy, Business and Management (ABM)">
                  Accountancy, Business and Management (ABM)
                </MenuItem>
                <MenuItem value="Humanities and Social Sciences (HUMSS)">
                  Humanities and Social Sciences (HUMSS)
                </MenuItem>
                <MenuItem value="Science, Technology, Engineering, and Mathematics (STEM)">
                  Science, Technology, Engineering, and Mathematics (STEM)
                </MenuItem>
                <MenuItem value="General Academic (GAS)">General Academic (GAS)</MenuItem>
                <MenuItem value="Home Economics (HE)">Home Economics (HE)</MenuItem>
                <MenuItem value="Information and Communications Technology (ICT)">
                  Information and Communications Technology (ICT)
                </MenuItem>
                <MenuItem value="Agri-Fishery Arts (AFA)">Agri-Fishery Arts (AFA)</MenuItem>
                <MenuItem value="Industrial Arts (IA)">Industrial Arts (IA)</MenuItem>
                <MenuItem value="Sports Track">Sports Track</MenuItem>
                <MenuItem value="Design and Arts Track">Design and Arts Track</MenuItem>
              </Select>
              {errors.strand && (
                <FormHelperText>This field is required.</FormHelperText>
              )}
            </FormControl>

            <Modal
              open={examPermitModalOpen}
              onClose={handleCloseExamPermitModal}
              aria-labelledby="exam-permit-error-title"
              aria-describedby="exam-permit-error-description"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 400,
                  bgcolor: "background.paper",
                  border: "2px solid #6D2323",
                  boxShadow: 24,
                  p: 4,
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <ErrorIcon sx={{ color: mainButtonColor, fontSize: 50, mb: 2 }} />
                <Typography id="exam-permit-error-title" variant="h6" component="h2" color="maroon">
                  Exam Permit Notice
                </Typography>
                <Typography id="exam-permit-error-description" sx={{ mt: 2 }}>
                  {examPermitError}
                </Typography>
                <Button
                  onClick={handleCloseExamPermitModal}
                  variant="contained"
                  sx={{ mt: 3, backgroundcolor: mainButtonColor, "&:hover": { backgroundColor: "#8B0000" } }}
                >
                  Close
                </Button>
              </Box>
            </Modal>







            <Box display="flex" justifyContent="space-between" mt={4}>
              {/* Previous Page Button */}
              <Button
                variant="contained"
                component={Link}
                to={`/admin_dashboard2?person_id=${userID}`}
                startIcon={
                  <ArrowBackIcon
                    sx={{
                      color: "#000",
                      transition: "color 0.3s",
                    }}
                  />
                }
                sx={{
                  backgroundColor: subButtonColor,
                  border: `2px solid ${borderColor}`,
                  color: "#000",
                  "&:hover": {
                    backgroundColor: "#000000",
                    color: "#fff",
                    "& .MuiSvgIcon-root": {
                      color: "#fff",
                    },
                  },
                }}
              >
                Previous Step
              </Button>

              {/* Next Step Button */}
              <Button
                variant="contained"
                onClick={() => {

                  navigate(`/admin_dashboard4?person_id=${userID}`);

                }}
                endIcon={
                  <ArrowForwardIcon
                    sx={{
                      color: "#fff",
                      transition: "color 0.3s",
                    }}
                  />
                }
                sx={{


                  backgroundColor: mainButtonColor,
                  border: `2px solid ${borderColor}`,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: "#000000",
                    color: '#fff',
                    '& .MuiSvgIcon-root': {
                      color: '#fff',
                    },
                  },
                }}
              >
                Next Step
              </Button>
            </Box>


          </Container>
        </form>
      </Container>
    </Box>
  );
};


export default AdminDashboard3;
