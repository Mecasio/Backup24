import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  FormControl,
  Select,
  Card,
  TableCell,
  TextField,
  MenuItem,
  InputLabel,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import API_BASE_URL from "../apiConfig";
import { Search } from "@mui/icons-material";
import { Snackbar, Alert } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { FcPrint } from "react-icons/fc";
import EaristLogo from "../assets/EaristLogo.png";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { io } from "socket.io-client";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SearchIcon from "@mui/icons-material/Search";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ScoreIcon from "@mui/icons-material/Score";

const QualifyingExamScore = () => {
  const socket = useRef(null);

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
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (!settings) return;

    // 🎨 Colors
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color)
      setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);
    if (settings.stepper_color) setStepperColor(settings.stepper_color);

    // 🏫 Logo
    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    } else {
      setFetchedLogo(EaristLogo);
    }

    // 🏷️ School Info
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);

    // ✅ Branches (JSON stored in DB)
    if (settings?.branches) {
      try {
        const parsed =
          typeof settings.branches === "string"
            ? JSON.parse(settings.branches)
            : settings.branches;

        setBranches(parsed);
      } catch (err) {
        console.error("Failed to parse branches:", err);
        setBranches([]);
      }
    }
  }, [settings]);

  useEffect(() => {
    socket.current = io(API_BASE_URL);

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const words = companyName.trim().split(" ");
  const middle = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, middle).join(" ");
  const secondLine = words.slice(middle).join(" ");

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const queryPersonId = (queryParams.get("person_id") || "").trim();

  const handleRowClick = (person_id) => {
    if (!person_id) return;

    sessionStorage.setItem("admin_edit_person_id", String(person_id));
    sessionStorage.setItem("admin_edit_person_id_source", "applicant_list");
    sessionStorage.setItem("admin_edit_person_id_ts", String(Date.now()));

    // ✅ Always pass person_id in the URL
    navigate(`/registrar_dashboard1?person_id=${person_id}`);
  };

  const tabs = [
    {
      label: "Admission Process For College",
      to: "/applicant_list",
      icon: <SchoolIcon fontSize="large" />,
    },
    {
      label: "Applicant Form",
      to: "/registrar_dashboard1",
      icon: <AssignmentIcon fontSize="large" />,
    },
    {
      label: "Student Requirements",
      to: "/registrar_requirements",
      icon: <AssignmentTurnedInIcon fontSize="large" />,
    },
    {
      label: "Qualifying / Interview Exam Score",
      to: "/qualifying_interview_exam_scores",
      icon: <ScoreIcon fontSize="large" />,
    },
    {
      label: "Student Numbering",
      to: "/student_numbering_per_college",
      icon: <DashboardIcon fontSize="large" />,
    },
    {
      label: "Course Tagging",
      to: "/course_tagging",
      icon: <MenuBookIcon fontSize="large" />,
    },
    {
      label: "Certificate of Registration",
      to: "/search_cor_for_college",
      icon: <SearchIcon fontSize="large" />,
    },
  ];

  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(3);
  const [clickedSteps, setClickedSteps] = useState(
    Array(tabs.length).fill(false),
  );

  const handleStepClick = (index, to) => {
    setActiveStep(index);

    const pid = sessionStorage.getItem("admin_edit_person_id");

    if (pid) {
      navigate(`${to}?person_id=${pid}`);
    } else {
      navigate(to);
    }
  };

  const buildPayload = (person) => {
    const edits = editScores[person.person_id] || {};

    return {
      applicant_number: person.applicant_number,
      qualifying_exam_score:
        edits.qualifying_exam_score ?? person.qualifying_exam_score ?? 0,
      qualifying_interview_score:
        edits.qualifying_interview_score ??
        person.qualifying_interview_score ??
        0,
      user_person_id: userID,
    };
  };

  const saveSingleRow = async (person) => {
    try {
      setLoading(true);

      const payload = buildPayload(person);
      const res = await axios.post(
        `${API_BASE_URL}/api/interview/save`,
        payload,
      );

      if (!res.data?.success) {
        throw new Error(res.data?.error || "Saving failed");
      }

      const qExam = Number(payload.qualifying_exam_score);
      const qInterview = Number(payload.qualifying_interview_score);
      const finalRating = (qExam + qInterview) / 2;

      // 🔥 Update UI instantly
      setPersons((prev) =>
        prev.map((p) =>
          p.person_id === person.person_id
            ? {
              ...p,
              qualifying_exam_score: qExam,
              qualifying_interview_score: qInterview,
              final_rating: finalRating,
            }
            : p,
        ),
      );

      // 🧹 Clear edit buffer
      setEditScores((prev) => {
        const copy = { ...prev };
        delete copy[person.person_id];
        return copy;
      });

      setSnack({ open: true, message: "Score saved!", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        message: "Save failed: " + (err.response?.data?.error || err.message),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAllRows = async () => {
    try {
      setLoading(true);

      for (const person of persons) {
        const payload = buildPayload(person);
        await axios.post(`${API_BASE_URL}/api/interview/save`, payload);
      }

      // Refresh table from DB for safety
      await fetchApplicants();

      setSnack({
        open: true,
        message: "All scores saved!",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        message:
          "Save All failed: " + (err.response?.data?.error || err.message),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const [persons, setPersons] = useState([]);

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [assignedNumber, setAssignedNumber] = useState("");
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [adminData, setAdminData] = useState({ dprtmnt_id: "" });
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

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

    const allowedRoles = ["registrar", "applicant", "superadmin"];
    if (allowedRoles.includes(storedRole)) {
      const targetId = queryPersonId || searchedPersonId || loggedInPersonId;
      sessionStorage.setItem("admin_edit_person_id", targetId);
      setUserID(targetId);
      return;
    }

    window.location.href = "/login";
  }, [queryPersonId]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const personIdFromUrl = queryParams.get("person_id");

    if (!personIdFromUrl) return;

    // fetch info of that person
    axios
      .get(`${API_BASE_URL}/api/person_with_applicant/${personIdFromUrl}`)
      .then((res) => {
        if (res.data?.applicant_number) {
          // AUTO-INSERT applicant_number into search bar
          setSearchQuery(res.data.applicant_number);

          // If you have a fetchUploads() or fetchExamScore() — call it
          if (typeof fetchUploadsByApplicantNumber === "function") {
            fetchUploadsByApplicantNumber(res.data.applicant_number);
          }

          if (typeof fetchApplicants === "function") {
            fetchApplicants();
          }
        }
      })
      .catch((err) => console.error("Auto search failed:", err));
  }, [location.search]);

  const [hasAccess, setHasAccess] = useState(null);

  const pageId = 37;

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
      const response = await axios.get(
        `${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`,
      );
      if (response.data && response.data.page_privilege === 1) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Error checking access:", error);
      setHasAccess(false);
      if (error.response && error.response.data.message) {
        console.log(error.response.data.message);
      } else {
        console.log("An unexpected error occurred.");
      }
      setLoading2(false);
    }
  };

  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [person, setPerson] = useState({
    campus: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    document_status: "",
    extension: "",
    strand: "",
    generalAverage1: "",
    program: "",
    created_at: "",
    middle_code: "",
    emailAddress: "",
  });
  const [allApplicants, setAllApplicants] = useState([]);

  const fetchApplicants = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/applicants-with-number`);

      const data = Array.isArray(res.data) ? res.data : [];

      // NEVER hide anyone based on action
      const withAssignedFlag = data.map((p) => ({
        ...p,
        assigned: false,
      }));

      setPersons(withAssignedFlag);
    } catch (err) {
      console.error("Error fetching applicants:", err);
      setPersons([]);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [adminData.dprtmnt_id]);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchPersonData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin_data/${user}`);
      setAdminData(res.data); // { dprtmnt_id: "..." }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPersonData();
    }
  }, [user]);

  const [curriculumOptions, setCurriculumOptions] = useState([]);

  useEffect(() => {
    if (!adminData.dprtmnt_id) return;
    const fetchCurriculums = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/applied_program/${adminData.dprtmnt_id}`,
        );
        setCurriculumOptions(response.data);
      } catch (error) {
        console.error("Error fetching curriculum options:", error);
      }
    };
    fetchCurriculums();
  }, [adminData.dprtmnt_id]);

  const [selectedApplicantStatus, setSelectedApplicantStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [selectedRegistrarStatus, setSelectedRegistrarStatus] = useState("");

  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
  const [department, setDepartment] = useState([]);
  const [allCurriculums, setAllCurriculums] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [semesters, setSchoolSemester] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSchoolSemester, setSelectedSchoolSemester] = useState("");
  const [selectedActiveSchoolYear, setSelectedActiveSchoolYear] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_school_year/`)
      .then((res) => setSchoolYears(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_school_semester/`)
      .then((res) => setSchoolSemester(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/active_school_year`)
      .then((res) => {
        if (res.data.length > 0) {
          setSelectedSchoolYear(res.data[0].year_id);
          setSelectedSchoolSemester(res.data[0].semester_id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSchoolYearChange = (event) => {
    setSelectedSchoolYear(event.target.value);
  };

  const handleSchoolSemesterChange = (event) => {
    setSelectedSchoolSemester(event.target.value);
  };

  // helper to make string comparisons robust
  const normalize = (s) => (s ?? "").toString().trim().toLowerCase();
  const [showSubmittedOnly, setShowSubmittedOnly] = useState(false);
  const [topCount, setTopCount] = useState(100);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [exactRating, setExactRating] = useState("");
  const [editScores, setEditScores] = useState({});

  const filteredPersons = persons.filter((personData) => {
    const finalRating = Number(personData.final_rating) || 0;

    /* ⭐ SCORE FILTER */
    const matchesScore =
      (minScore === "" || finalRating >= Number(minScore)) &&
      (maxScore === "" || finalRating <= Number(maxScore));

    const matchesExactRating =
      exactRating === "" || finalRating === Number(exactRating);

    /* 🔎 SEARCH */
    const query = searchQuery.toLowerCase();
    const fullName =
      `${personData.first_name ?? ""} ${personData.middle_name ?? ""} ${personData.last_name ?? ""}`.toLowerCase();

    const matchesApplicantID = personData.applicant_number
      ?.toString()
      .toLowerCase()
      .includes(query);
    const matchesName = fullName.includes(query);
    const matchesEmail = personData.emailAddress?.toLowerCase().includes(query);

    /* 🏫 CAMPUS */
    const matchesCampus = !person.campus || personData.campus === person.campus;

    /* 🎓 PROGRAM */
    const programInfo = allCurriculums.find(
      (opt) => opt.curriculum_id?.toString() === personData.program?.toString(),
    );

    const matchesProgramQuery = programInfo?.program_code
      ?.toLowerCase()
      .includes(query);

    const matchesDepartment =
      selectedDepartmentFilter === "" ||
      programInfo?.dprtmnt_name === selectedDepartmentFilter;

    const matchesProgramFilter =
      selectedProgramFilter === "" ||
      programInfo?.program_code === selectedProgramFilter;

    /* 📅 CREATED_AT — FIXED TO MANILA TIME */
    const appliedDate = new Date(personData.created_at.split("T")[0]);
    const applicantAppliedYear = appliedDate.getFullYear();

    const schoolYear = schoolYears.find(
      (sy) => sy.year_id === selectedSchoolYear,
    );

    const matchesSchoolYear =
      selectedSchoolYear === "" ||
      (schoolYear &&
        String(applicantAppliedYear) === String(schoolYear.current_year));

    const matchesSemester =
      selectedSchoolSemester === "" ||
      String(personData.middle_code) === String(selectedSchoolSemester);

    /* FINAL FILTER RESULT */
    return (
      (matchesApplicantID ||
        matchesName ||
        matchesEmail ||
        matchesProgramQuery) &&
      matchesDepartment &&
      matchesProgramFilter &&
      matchesSchoolYear &&
      matchesSemester &&
      matchesScore &&
      matchesCampus &&
      matchesExactRating
    );
  });

  /* ⭐ SORTING (ALSO FIXED CREATED_AT) */
  const sortedPersons = React.useMemo(() => {
    return filteredPersons
      .slice()
      .sort((a, b) => {
        const aExam = Number(
          editScores[a.person_id]?.qualifying_exam_score ??
          a.qualifying_exam_score ??
          0,
        );
        const aInterview = Number(
          editScores[a.person_id]?.qualifying_interview_score ??
          a.qualifying_interview_score ??
          0,
        );
        const aTotal = (aExam + aInterview) / 2;

        const bExam = Number(
          editScores[b.person_id]?.qualifying_exam_score ??
          b.qualifying_exam_score ??
          0,
        );
        const bInterview = Number(
          editScores[b.person_id]?.qualifying_interview_score ??
          b.qualifying_interview_score ??
          0,
        );
        const bTotal = (bExam + bInterview) / 2;

        /* ⭐ SORT BY TOTAL SCORE FIRST */
        if (bTotal !== aTotal) return bTotal - aTotal;

        /* ⭐ THEN BY CREATED_AT USING MANILA SAFE PARSING */
        const dateA = new Date(a.created_at.split("T")[0]);
        const dateB = new Date(b.created_at.split("T")[0]);

        return dateA - dateB; // earliest first
      })
      .slice(0, topCount);
  }, [filteredPersons, editScores, topCount]);

  // ✅ 3. Pagination logic AFTER sortedPersons exists
  const totalPages = Math.ceil(sortedPersons.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPersons = sortedPersons.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [sortedPersons.length, totalPages]);

  const maxButtonsToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

  if (endPage - startPage < maxButtonsToShow - 1) {
    startPage = Math.max(1, endPage - maxButtonsToShow + 1);
  }

  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }

  useEffect(() => {
    if (!adminData.dprtmnt_id) return;
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/departments/${adminData.dprtmnt_id}`,
        ); // ✅ Update if needed
        setDepartment(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, [adminData.dprtmnt_id]);

  useEffect(() => {
    if (department.length > 0 && !selectedDepartmentFilter) {
      const firstDept = department[0].dprtmnt_name;
      setSelectedDepartmentFilter(firstDept);
      handleDepartmentChange(firstDept); // if you also want to trigger it
    }
  }, [department, selectedDepartmentFilter]);

  const handleSnackClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/applied_program`).then((res) => {
      setAllCurriculums(res.data);
      setCurriculumOptions(res.data);
    });
  }, []);

  const handleDepartmentChange = (selectedDept) => {
    setSelectedDepartmentFilter(selectedDept);
    if (!selectedDept) {
      setCurriculumOptions(allCurriculums);
    } else {
      setCurriculumOptions(
        allCurriculums.filter((opt) => opt.dprtmnt_name === selectedDept),
      );
    }
    setSelectedProgramFilter("");
  };

  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    const personIdFromQuery = queryParams.get("person_id");

    if (personIdFromQuery) {
      // ✅ Fetch single applicant
      axios
        .get(`${API_BASE_URL}/api/person_with_applicant/${personIdFromQuery}`)
        .then((res) => {
          // Ensure scores always have a value
          const fixed = {
            ...res.data,
            qualifying_exam_score: res.data.qualifying_exam_score ?? 0,
            qualifying_interview_score:
              res.data.qualifying_interview_score ?? 0,
            final_rating: res.data.final_rating ?? 0,
          };
          setPersons([fixed]); // wrap in array for table rendering
        })
        .catch((err) => {
          console.error("❌ Error fetching single applicant:", err);
          setPersons([]); // fallback to empty list
        });
    } else {
      // ✅ Fetch all applicants (with scores)
      axios
        .get(`${API_BASE_URL}/api/applicants-with-number`)
        .then((res) => setPersons(res.data))
        .catch((err) => {
          console.error("❌ Error fetching applicants:", err);
          setPersons([]);
        });
    }
  }, [queryPersonId]);

  const handleStatusChange = async (applicantId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/interview_applicants/${applicantId}/status`,
        { status: newStatus },
      );

      setPersons((prev) =>
        prev.map((p) =>
          p.applicant_number === applicantId
            ? { ...p, college_approval_status: newStatus } // 👈 update correct field
            : p,
        ),
      );

      setSnack({
        open: true,
        message: "Status updated successfully.",
        severity: "success",
      });

      fetchApplicants();
    } catch (err) {
      console.error("Error updating status:", err);
      setSnack({
        open: true,
        message: "Failed to update status.",
        severity: "error",
      });
    }
  };

  const divToPrintRef = useRef();

  const printDiv = () => {
    const newWin = window.open("", "Print-Window");
    newWin.document.open();

    // ✅ Dynamic logo and company name
    const logoSrc = fetchedLogo || EaristLogo;
    const name = companyName?.trim() || "No Company Name Available";

    // ✅ Split name into two balanced lines
    const words = name.split(" ");
    const middleIndex = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middleIndex).join(" ");
    const secondLine = words.slice(middleIndex).join(" ");

    // ✅ Dynamic campus address (dropdown or custom from Settings)
    let campusAddress = "";
    if (settings?.campus_address) {
      campusAddress = settings.campus_address;
    } else if (settings?.address) {
      campusAddress = settings.address;
    } else {
      campusAddress = "No address set in Settings";
    }

    // ✅ HTML print layout
    const htmlContent = `
  <html>
    <head>
      <title>Qualifying Examination Score</title>
    <style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }

  .print-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 10px; /* ✅ ensures right/left borders are not cut off */
  }

  .print-header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
  }

  .print-header img {
    position: absolute;
    left: 0;
    margin-left: 10px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
  }

  /* ✅ Consistent and thicker table borders */
table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 20px;
  border: 1.5px solid black;
  table-layout: fixed; /* ✅ lock column widths */
}
th, td {
  border: 1.5px solid black;
  padding: 6px;
  font-size: 12px;
  text-align: center;
  word-wrap: break-word; /* ✅ prevent overflow */
  box-sizing: border-box;
}

  /* ✅ Force right border to print cleanly */
  th:last-child,
  td:last-child {
    border-right: 1.2px solid maroon !important;
  }

  /* ✅ Slight padding helps prevent printer cutoff */
  @media print {
    body {
      margin-right: 5mm;
      margin-left: 5mm;
    }
  }

  th {
    background-color: #800000;
    color: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
</style>


    </head>
    <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
      <div class="print-container">
        <!-- ✅ HEADER -->
        <div class="print-header">
          <img src="${logoSrc}" alt="School Logo" />
          <div>
            <div>Republic of the Philippines</div>

            <!-- ✅ Dynamic Company Name -->
            <b style="letter-spacing: 1px; font-size: 20px; font-family: 'Times New Roman', serif;">
              ${firstLine}
            </b>
            ${secondLine
        ? `<div style="letter-spacing: 1px; font-size: 20px; font-family: 'Times New Roman', serif;">
                     <b>${secondLine}</b>
                   </div>`
        : ""
      }

            <!-- ✅ Dynamic Address -->
            <div style="font-size: 12px;">${campusAddress}</div>

            <div style="margin-top: 30px;">
              <b style="font-size: 24px; letter-spacing: 1px;">
                QUALIFYING EXAMINATION SCORE
              </b>
            </div>
          </div>
        </div>

        <!-- ✅ TABLE -->
        <table>
          <thead>
            <tr>
           <th style="width: 12%;">Applicant ID</th>
<th style="width: 25%;">Applicant Name</th>
<th style="width: 13%;">Program</th>
<th style="width: 10%;">Qualifying Exam Score</th>
<th style="width: 10%;">Interview Exam Score</th>
<th style="width: 10%;">Total Ave</th>
<th style="width: 10%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPersons
        .map((person) => {
          const qualifyingExam =
            editScores[person.person_id]?.qualifying_exam_score ??
            person.qualifying_exam_score ??
            0;
          const qualifyingInterview =
            editScores[person.person_id]?.qualifying_interview_score ??
            person.qualifying_interview_score ??
            0;
          const computedTotalAve =
            (Number(qualifyingExam) + Number(qualifyingInterview)) / 2;

          return `
                <tr>
                  <td>${person.applicant_number ?? "N/A"}</td>
                  <td class="name-col">${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}</td>
                  <td>${curriculumOptions.find(
            (item) =>
              item.curriculum_id?.toString() ===
              person.program?.toString(),
          )?.program_code ?? "N/A"
            }</td>
                  <td>${qualifyingExam}</td>
                  <td>${qualifyingInterview}</td>
                  <td>${computedTotalAve.toFixed(2)}</td>
                  <td>${person.college_approval_status ?? "N/A"}</td>
                </tr>`;
        })
        .join("")}
          </tbody>
        </table>
      </div>
    </body>
  </html>
  `;

    newWin.document.write(htmlContent);
    newWin.document.close();
  };

  const [file, setFile] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  // when file chosen
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // when import button clicked
  const handleImport = async () => {
    try {
      if (!selectedFile) {
        setSnack({
          open: true,
          message: "Please choose a file first!",
          severity: "warning",
        });
        return;
      }

      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      let sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: "",
      });

      sheet = sheet
        .filter((row) => row["Applicant ID"])
        .map((row) => ({
          applicant_number: String(row["Applicant ID"]).trim(),
          qualifying_exam_score: Number(row["Qualifying Exam Score"]) || 0,
          qualifying_interview_score:
            Number(row["Qualifying Interview Score"]) || 0,
          total_ave:
            Number(row["Total Ave"]) ||
            (Number(row["Qualifying Exam Score"]) +
              Number(row["Qualifying Interview Score"])) /
            2,

          // ⭐ NEW: Status Column from Excel
          status: row["Status"] ? String(row["Status"]).trim() : "Waiting List",
        }));

      if (sheet.length === 0) {
        setSnack({
          open: true,
          message: "Excel file had no valid rows!",
          severity: "warning",
        });
        return;
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/qualifying_exam/import`,
        {
          userID,
          data: sheet,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      setSnack({
        open: true,
        message: res.data.message || "Import successful!",
        severity: "success",
      });

      fetchApplicants(); // refresh UI
    } catch (err) {
      console.error("❌ Import error:", err.response?.data || err.message);
      setSnack({
        open: true,
        message: "Import failed: " + (err.response?.data?.error || err.message),
        severity: "error",
      });
    }
  };

  useEffect(() => {
    const syncPendingScores = async () => {
      const pending = JSON.parse(
        localStorage.getItem("pendingQualifying") || "[]",
      );
      if (pending.length === 0) return;

      const stillPending = [];
      for (const p of pending) {
        try {
          await axios.post(`${API_BASE_URL}/api/interview`, p);
          console.log("✅ Synced pending qualifying:", p);
        } catch {
          stillPending.push(p); // keep if still failing
        }
      }
      localStorage.setItem("pendingQualifying", JSON.stringify(stillPending));
    };

    // run once + whenever internet comes back
    syncPendingScores();
    window.addEventListener("online", syncPendingScores);
    return () => window.removeEventListener("online", syncPendingScores);
  }, []);

  const debounceTimers = {};

  const handleScoreChange = (person, field, value) => {
    // 1️⃣ Update local state for instant UI feedback
    setEditScores((prev) => ({
      ...prev,
      [person.person_id]: {
        ...prev[person.person_id],
        [field]: value,
      },
    }));

    // 2️⃣ Prepare updated scores
    const updatedScores = {
      qualifying_exam_score:
        field === "qualifying_exam_score"
          ? value
          : (editScores[person.person_id]?.qualifying_exam_score ??
            person.qualifying_exam_score ??
            0),
      qualifying_interview_score:
        field === "qualifying_interview_score"
          ? value
          : (editScores[person.person_id]?.qualifying_interview_score ??
            person.qualifying_interview_score ??
            0),
    };

    // 3️⃣ Cancel any previous debounce for this applicant
    if (debounceTimers[person.applicant_number]) {
      clearTimeout(debounceTimers[person.applicant_number]);
    }

    // 4️⃣ Set new debounce timer
    debounceTimers[person.applicant_number] = setTimeout(async () => {
      const payload = {
        applicant_number: person.applicant_number,
        qualifying_exam_score: updatedScores.qualifying_exam_score,
        qualifying_interview_score: updatedScores.qualifying_interview_score,
        user_person_id: localStorage.getItem("person_id"),
      };

      try {
        // ✅ Make ONE stable save call — not multiple
        await axios.post(`${API_BASE_URL}/api/interview/save`, payload);
        console.log("✅ Saved qualifying/interview scores once:", payload);
      } catch (err) {
        console.error("❌ Auto-save error:", err.response?.data || err.message);
      }
    }, 1500); // Increased debounce to 1.5s to prevent overlap
  };

  const [customCount, setCustomCount] = useState(0);
  const [selectedSchedule, setSelectedSchedule] = useState("");

  useEffect(() => {
    socket.current.on("schedule_updated", ({ schedule_id }) => {
      console.log("📢 Schedule updated:", schedule_id);
      fetchSchedulesWithCount(); // ✅ always refresh counts
      fetchApplicants();
    });

    return () => socket.current.off("schedule_updated");
  }, []);

  const handleAssignSingle = (applicant_number) => {
    axios
      .put(
        `${API_BASE_URL}/api/interview_applicants/assign/${applicant_number}`,
      )
      .then((res) => {
        console.log("Assign response:", res.data);

        setPersons((prev) =>
          prev.map((p) =>
            p.applicant_number === applicant_number
              ? { ...p, assigned: true }
              : p,
          ),
        );

        setSnack({
          open: true,
          message: `Applicant ${applicant_number} assigned.`,
          severity: "success",
        });

        fetchApplicants();
      })
      .catch((err) => {
        console.error("Failed to assign applicant:", err);
        setSnack({
          open: true,
          message: "Failed to assign applicant.",
          severity: "error",
        });
      });
  };

  const handleAssignMax = () => {
    // ✅ Get only unassigned applicants in the selected department
    const unassigned = persons.filter((p) => {
      if (p.assigned) return false;

      const programInfo = allCurriculums.find(
        (opt) => opt.curriculum_id?.toString() === p.program?.toString(),
      );

      // School year filter: compare applicant year with selectedSchoolYear
      const applicantAppliedYear = new Date(
        p.created_at.split("T")[0],
      ).getFullYear();
      const schoolYear = schoolYears.find(
        (sy) => sy.year_id === selectedSchoolYear,
      );

      const matchesDepartment =
        !selectedDepartmentFilter ||
        programInfo?.dprtmnt_name === selectedDepartmentFilter;

      const matchesProgram =
        !selectedProgramFilter ||
        programInfo?.program_code === selectedProgramFilter;

      const matchesSchoolYear =
        !selectedSchoolYear ||
        (schoolYear &&
          String(applicantAppliedYear) === String(schoolYear.current_year));

      const matchesSemester =
        !selectedSchoolSemester ||
        String(p.middle_code) === String(selectedSchoolSemester);

      return (
        matchesDepartment &&
        matchesProgram &&
        matchesSchoolYear &&
        matchesSemester
      );
    });

    if (unassigned.length === 0) {
      setSnack({
        open: true,
        message: "No applicants available to assign in this department.",
        severity: "warning",
      });
      return;
    }

    // Limit to 100 applicants
    const maxToAssign = Math.min(unassigned.length, 100);
    const toAssign = unassigned.slice(0, maxToAssign);

    setPersons((prev) =>
      prev.map((p) =>
        toAssign.some((u) => u.applicant_number === p.applicant_number)
          ? { ...p, assigned: true }
          : p,
      ),
    );

    axios
      .put(`${API_BASE_URL}/api/interview_applicants/assign`, {
        applicant_numbers: toAssign.map((a) => a.applicant_number),
      })
      .then((res) => {
        console.log("Updated statuses:", res.data);
        setSnack({
          open: true,
          message: `Assigned ${toAssign.length} applicant${toAssign.length > 1 ? "s" : ""} in ${selectedDepartmentFilter}.`,
          severity: "success",
        });
        fetchApplicants();
      })
      .catch((err) => {
        console.error("Failed to update applicant statuses:", err);
      });
  };

  const handleAssignCustom = (countParam) => {
    let count =
      typeof countParam === "number" && !isNaN(countParam)
        ? countParam
        : Number(customCount);

    if (isNaN(count) || count <= 0) {
      setSnack({
        open: true,
        message: "Please enter a valid number.",
        severity: "warning",
      });
      return;
    }

    // ✅ Get only unassigned applicants in the selected department
    const unassigned = persons.filter((p) => {
      if (p.assigned) return false;

      const programInfo = allCurriculums.find(
        (opt) => opt.curriculum_id?.toString() === p.program?.toString(),
      );

      // School year filter: compare applicant year with selectedSchoolYear
      const applicantAppliedYear = new Date(
        p.created_at.split("T")[0],
      ).getFullYear();
      const schoolYear = schoolYears.find(
        (sy) => sy.year_id === selectedSchoolYear,
      );

      const matchesDepartment =
        !selectedDepartmentFilter ||
        programInfo?.dprtmnt_name === selectedDepartmentFilter;

      const matchesProgram =
        !selectedProgramFilter ||
        programInfo?.program_code === selectedProgramFilter;

      const matchesSchoolYear =
        !selectedSchoolYear ||
        (schoolYear &&
          String(applicantAppliedYear) === String(schoolYear.current_year));

      const matchesSemester =
        !selectedSchoolSemester ||
        String(p.middle_code) === String(selectedSchoolSemester);

      return (
        matchesDepartment &&
        matchesProgram &&
        matchesSchoolYear &&
        matchesSemester
      );
    });

    if (unassigned.length === 0) {
      setSnack({
        open: true,
        message: "No applicants available to assign in this department.",
        severity: "warning",
      });
      return;
    }

    // ✅ Sort applicants by total average score (highest first)
    const sortedUnassigned = [...unassigned].sort((a, b) => {
      const aExam =
        editScores[a.person_id]?.qualifying_exam_score ??
        a.qualifying_exam_score ??
        0;
      const aInterview =
        editScores[a.person_id]?.qualifying_interview_score ??
        a.qualifying_interview_score ??
        0;
      const aScore = (Number(aExam) + Number(aInterview)) / 2;

      const bExam =
        editScores[b.person_id]?.qualifying_exam_score ??
        b.qualifying_exam_score ??
        0;
      const bInterview =
        editScores[b.person_id]?.qualifying_interview_score ??
        b.qualifying_interview_score ??
        0;
      const bScore = (Number(bExam) + Number(bInterview)) / 2;

      return bScore - aScore; // higher scores first
    });

    // ✅ Take only up to the requested count
    const maxToAssign = Math.min(sortedUnassigned.length, count);
    const toAssign = sortedUnassigned.slice(0, maxToAssign);

    // ✅ Update persons list (mark assigned)
    setPersons((prev) =>
      prev.map((p) =>
        toAssign.some((u) => u.applicant_number === p.applicant_number)
          ? { ...p, assigned: true }
          : p,
      ),
    );

    axios
      .put(`${API_BASE_URL}/api/interview_applicants/assign`, {
        applicant_numbers: toAssign.map((a) => a.applicant_number),
      })
      .then((res) => {
        console.log("Updated statuses:", res.data);
        setSnack({
          open: true,
          message: `Assigned ${toAssign.length} applicant${toAssign.length > 1 ? "s" : ""} in ${selectedDepartmentFilter}.`,
          severity: "success",
        });
        fetchApplicants();
      })
      .catch((err) => {
        console.error("Failed to update applicant statuses:", err);
      });
  };

  const handleUnassignImmediate = (applicant_number) => {
    axios
      .put(
        `${API_BASE_URL}/api/interview_applicants/unassign/${applicant_number}`,
      )
      .then((res) => {
        console.log("Unassign response:", res.data);

        setPersons((prev) =>
          prev.map((p) =>
            p.applicant_number === applicant_number
              ? { ...p, assigned: false }
              : p,
          ),
        );

        setSnack({
          open: true,
          message: `Applicant ${applicant_number} unassigned.`,
          severity: "info",
        });

        fetchApplicants();
      })
      .catch((err) => {
        console.error("Failed to unassign applicant:", err);
        setSnack({
          open: true,
          message: "Failed to unassign applicant.",
          severity: "error",
        });
      });
  };

  // handleUnassignAll
  const handleUnassignAll = () => {
    setPersons((prev) => prev.map((p) => ({ ...p, assigned: false })));

    axios
      .put(`${API_BASE_URL}/api/interview_applicants/unassign-all`, {
        applicant_numbers: persons.map((a) => a.applicant_number),
      })
      .then((res) => {
        console.log("Updated statuses:", res.data);
        setSnack({
          open: true,
          message: "All applicants unassigned. They can be assigned again.",
          severity: "info",
        });
        fetchApplicants();
      })
      .catch((err) => {
        console.error("Failed to update applicant statuses:", err);
      });
  };

  const [selectedApplicants, setSelectedApplicants] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [singleConfirmOpen, setSingleConfirmOpen] = useState(false);
  const [emailSender, setEmailSender] = useState("");
  const [dprtmntName, setDepartmentName] = useState("");

  useEffect(() => {
    const fetchActiveSenders = async () => {
      if (!adminData.dprtmnt_id) return;

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/email-templates/active-senders?department_id=${adminData.dprtmnt_id}`,
        );
        if (res.data.length > 0) {
          setEmailSender(res.data[0].sender_name);
        }
      } catch (err) {
        console.error("Error fetching active senders:", err);
      }
    };

    fetchActiveSenders();
  }, [user, adminData.dprtmnt_id]);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/dprtmnt_curriculum/${adminData.dprtmnt_id}`,
        );
        setDepartmentName(res.data[0]?.dprtmnt_name);
      } catch (err) {
        console.error("Error fetching active senders:", err);
      }
    };

    fetchDepartment();
  }, [adminData.dprtmnt_id]);

  const [emailMessage, setEmailMessage] = useState("");


  const [requirements, setRequirements] = useState([]);

  const fetchRequirements = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/requirements`);
      setRequirements(res.data);
      return res.data; // 👈 useful for email building
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);


  const buildRequirementsText = (requirements) => {
    if (!Array.isArray(requirements) || requirements.length === 0) {
      return "• No requirements listed at this time.";
    }

    let text = "";

    requirements.forEach((req) => {
      let notes = [];

      // ✅ PRIORITY: Original overrides Xerox
      if (req.requires_original) {
        notes.push("Original");
      } else if ((req.xerox_copies || 0) > 0) {
        notes.push(
          `${req.xerox_copies} Xerox copy${req.xerox_copies > 1 ? "s" : ""
          }`
        );
      }

      if (req.is_optional) {
        notes.push("Optional");
      }

      const extra = notes.length > 0 ? ` (${notes.join(" + ")})` : "";

      text += `• ${req.description}${extra}\n`;
    });

    return text.trim();
  };

  const handleOpenDialog = (applicant = null) => {
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(today.getDate() + 7);

    const formattedValidUntil = validUntil.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const reqText = buildRequirementsText(requirements);


    // ✅ Use dynamic company name from settings
    const companyName = settings?.company_name || "Student Information System";

    const defaultMessage = `
Dear ${applicant?.first_name || "Applicant"} ${applicant?.last_name || ""},

Congratulations on passing the Interview/Qualifying Exam!

Please follow the steps below to complete your Admission process:



1. Proceed to the Clinic for your Medical Examination.  
   - Bring and present your Admission Form Process so they can verify if you're eligible to take the Medical Examination.

2. After completing your Medical Examination, proceed to the Registrar’s Office to submit your Original Documents within 7 days.  
   - Submissions are accepted only during working hours, Monday to Friday, from 8:00 AM to 5:00 PM.

3. Please note that failure to comply within 7 days may result in your slot being given to another applicant.

You have until ${formattedValidUntil} to complete the admission process.

Thank you, best regards
`.trim();

    setSelectedApplicant(applicant?.applicant_number || null);
    setEmailMessage(defaultMessage);
    setConfirmOpen(true);
  };

  const handleOpenDialogSingle = (applicant) => {
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(today.getDate() + 7);

    const formattedValidUntil = validUntil.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const reqText = buildRequirementsText(requirements);


    // ✅ Use dynamic company name from settings
    const companyName = settings?.company_name || "Student Information System";

    const defaultMessage = `
Dear ${applicant?.first_name || "Applicant"} ${applicant?.last_name || ""},

Congratulations on passing the Interview/Qualifying Exam!

Please follow the steps below to complete your Admission process:

📄 REQUIRED DOCUMENTS:
${reqText}

1. Proceed to the Clinic for your Medical Examination.  
   - Bring and present your Admission Form Process so they can verify if you're eligible to take the Medical Examination.

2. After completing your Medical Examination, proceed to the Registrar’s Office to submit your Original Documents within 7 days.  
   - Submissions are accepted only during working hours, Monday to Friday, from 8:00 AM to 5:00 PM.

3. Please note that failure to comply within 7 days may result in your slot being given to another applicant.

You have until ${formattedValidUntil} to complete the admission process.

Thank you, best regards
`.trim();

    setSelectedApplicant(applicant?.applicant_number || null);
    setEmailMessage(defaultMessage);
    setSingleConfirmOpen(true);
  };

  const confirmSendEmailSingle = async () => {
    setLoading2(true);
    const targets = selectedApplicant
      ? persons.filter((p) => p.applicant_number === selectedApplicant)
      : [];

    if (targets.length === 0) {
      setLoading2(false);
      setSnack({
        open: true,
        message: "Please select one applicant first.",
        severity: "warning",
      });
      return;
    }

    const loggedInPersonId = localStorage.getItem("person_id");
    if (!emailSender) {
      setLoading2(false);
      setSnack({
        open: true,
        message: "No active sender account is assigned for this department.",
        severity: "warning",
      });
      return;
    }

    let successCount = 0;

    for (const applicant of targets) {
      // ✅ Try all possible email fields
      const recipientEmail =
        applicant.email || applicant.email_address || applicant.emailAddress;

      if (!recipientEmail) {
        console.warn(
          `⚠️ Applicant ${applicant.applicant_number} has no email field`,
        );
        continue; // skip if no email available
      }

      try {
        // Send email
        await axios.post(`${API_BASE_URL}/api/send-email`, {
          to: recipientEmail,
          subject: emailSubject,
          html: emailMessage.replace(/\n/g, "<br/>"),
          senderName: emailSender,
          user_person_id: loggedInPersonId,
        });

        // Mark as emailed
        await axios.put(
          `${API_BASE_URL}/api/interview_applicants/${applicant.applicant_number}/action`,
        );

        successCount++;
      } catch (err) {
        console.error(`❌ Failed for ${applicant.applicant_number}`, err);
        // Continue to next instead of breaking everything
      }

      // optional: small delay to avoid spam blocking (100–300ms)
      await new Promise((res) => setTimeout(res, 200));
    }

    // remove the successfully emailed applicants
    setPersons((prev) =>
      prev.filter(
        (p) => !targets.some((t) => t.applicant_number === p.applicant_number),
      ),
    );

    setSnack({
      open: true,
      message: `Emails sent to ${successCount} out of ${targets.length} applicants`,
      severity: successCount === targets.length ? "success" : "warning",
    });

    setConfirmOpen(false);
    setSelectedApplicant(null);
    setLoading2(false);
  };

  const confirmSendEmails = async () => {
    setLoading2(true);
    const targets = selectedApplicant
      ? persons.filter((p) => p.applicant_number === selectedApplicant)
      : persons.filter((p) => p.interview_status === "Accepted");

    if (targets.length === 0) {
      setLoading2(false);
      setSnack({
        open: true,
        message: "No applicants to send email to.",
        severity: "warning",
      });
      return;
    }

    let successCount = 0;

    for (const applicant of targets) {
      // ✅ Try all possible email fields
      const recipientEmail =
        applicant.email || applicant.email_address || applicant.emailAddress;

      if (!recipientEmail) {
        console.warn(
          `⚠️ Applicant ${applicant.applicant_number} has no email field`,
        );
        continue; // skip if no email available
      }

      try {
        // Send email
        await axios.post(`${API_BASE_URL}/api/send-email`, {
          to: recipientEmail,
          subject: emailSubject,
          html: emailMessage.replace(/\n/g, "<br/>"),
          senderName: emailSender,
          user_person_id: userID,
        });

        // Mark as emailed
        await axios.put(
          `${API_BASE_URL}/api/interview_applicants/${applicant.applicant_number}/action`,
        );

        successCount++;
      } catch (err) {
        console.error(`❌ Failed for ${applicant.applicant_number}`, err);
        // Continue to next instead of breaking everything
      }

      // optional: small delay to avoid spam blocking (100–300ms)
      await new Promise((res) => setTimeout(res, 200));
    }

    // remove the successfully emailed applicants
    setPersons((prev) =>
      prev.filter(
        (p) => !targets.some((t) => t.applicant_number === p.applicant_number),
      ),
    );

    setSnack({
      open: true,
      message: `Emails sent to ${successCount} out of ${targets.length} applicants`,
      severity: successCount === targets.length ? "success" : "warning",
    });

    setConfirmOpen(false);
    setSelectedApplicant(null);
    setLoading2(false);
  };

  // Email fields - start empty
  const [emailSubject, setEmailSubject] = useState(
    "Submission of Original Documents",
  );

  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/interview_schedules_with_count`,
        );
        setSchedules(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      }
    };

    fetchSchedules();
  }, []);

  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const [acceptCount, setAcceptCount] = useState(10);
  const handleAcceptTop = async () => {
    try {
      if (!acceptCount || acceptCount <= 0) {
        return setSnack({
          open: true,
          message: "Please enter a valid number of applicants to accept.",
          severity: "error",
        });
      }

      const unassigned = persons.filter((p) => {
        if (p.assigned) return false;

        const programInfo = allCurriculums.find(
          (opt) => opt.curriculum_id?.toString() === p.program?.toString(),
        );

        // School year filter: compare applicant year with selectedSchoolYear
        const applicantAppliedYear = new Date(
          p.created_at.split("T")[0],
        ).getFullYear();
        const schoolYear = schoolYears.find(
          (sy) => sy.year_id === selectedSchoolYear,
        );

        const matchesDepartment =
          !selectedDepartmentFilter ||
          programInfo?.dprtmnt_name === selectedDepartmentFilter;

        const matchesProgram =
          !selectedProgramFilter ||
          programInfo?.program_code === selectedProgramFilter;

        const matchesSchoolYear =
          !selectedSchoolYear ||
          (schoolYear &&
            String(applicantAppliedYear) === String(schoolYear.current_year));

        const matchesSemester =
          !selectedSchoolSemester ||
          String(p.middle_code) === String(selectedSchoolSemester);

        return (
          matchesDepartment &&
          matchesProgram &&
          matchesSchoolYear &&
          matchesSemester
        );
      });

      if (unassigned.length === 0) {
        setSnack({
          open: true,
          message: "No applicants available to assign in this department.",
          severity: "warning",
        });
        return;
      }

      const sortedUnassigned = [...unassigned].sort((a, b) => {
        const aExam =
          editScores[a.person_id]?.qualifying_exam_score ??
          a.qualifying_exam_score ??
          0;
        const aInterview =
          editScores[a.person_id]?.qualifying_interview_score ??
          a.qualifying_interview_score ??
          0;
        const aScore = (Number(aExam) + Number(aInterview)) / 2;

        const bExam =
          editScores[b.person_id]?.qualifying_exam_score ??
          b.qualifying_exam_score ??
          0;
        const bInterview =
          editScores[b.person_id]?.qualifying_interview_score ??
          b.qualifying_interview_score ??
          0;
        const bScore = (Number(bExam) + Number(bInterview)) / 2;

        return bScore - aScore; // higher scores first
      });

      // ✅ Take only up to the requested count
      const maxToAssign = Math.min(sortedUnassigned.length, acceptCount);
      const toAssign = sortedUnassigned.slice(0, maxToAssign);

      setPersons((prev) =>
        prev.map((p) =>
          toAssign.some((u) => u.applicant_number === p.applicant_number)
            ? { ...p, assigned: true }
            : p,
        ),
      );

      axios
        .put(`${API_BASE_URL}/api/interview_applicants/assign`, {
          applicant_numbers: toAssign.map((a) => a.applicant_number),
        })
        .then((res) => {
          console.log("Updated statuses:", res.data);
          setSnack({
            open: true,
            message: `Top ${acceptCount} applicants in ${selectedDepartmentFilter} are now accepted.`,
            severity: "success",
          });
          fetchApplicants();
        })
        .catch((err) => {
          console.error("Failed to update applicant statuses:", err);
        });
    } catch (err) {
      console.error("Error accepting top applicants:", err);
      setSnack({
        open: true,
        message: err.response?.data?.message || "Failed to accept applicants.",
        severity: "error",
      });
    }
  };

  // Put this at the very bottom before the return
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ color: titleColor }}>
          QUALIFYING EXAMINATION SCORING
        </Typography>

        <Box>
          <TextField
            variant="outlined"
            placeholder="Search Applicant Name / Email / Applicant ID"
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Corrected
            }}
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
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <div style={{ height: "20px" }}></div>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "nowrap", // ❌ prevent wrapping
          width: "100%",
          mt: 3,
          gap: 2,
        }}
      >
        {tabs.map((tab, index) => (
          <Card
            key={index}
            onClick={() => handleStepClick(index, tab.to)}
            sx={{
              flex: `1 1 ${100 / tabs.length}%`, // evenly divide row
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: 2,
              border: `2px solid ${borderColor}`,
              backgroundColor:
                activeStep === index
                  ? settings?.header_color || "#1976d2"
                  : "#E8C999",
              color: activeStep === index ? "#fff" : "#000",
              boxShadow:
                activeStep === index
                  ? "0px 4px 10px rgba(0,0,0,0.3)"
                  : "0px 2px 6px rgba(0,0,0,0.15)",
              transition: "0.3s ease",
              "&:hover": {
                backgroundColor: activeStep === index ? "#000" : "#f5d98f",
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
              <Box sx={{ fontSize: 40, mb: 1 }}>{tab.icon}</Box>
              <Typography
                sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}
              >
                {tab.label}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      <div style={{ height: "40px" }}></div>

      <TableContainer
        component={Paper}
        sx={{ width: "100%", border: `2px solid ${borderColor}` }}
      >
        <Table>
          <TableHead
            sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
          >
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "Center" }}>
                Qualifiying / Interview Examination Score
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <TableContainer
        component={Paper}
        sx={{ width: "100%", border: `2px solid ${borderColor}`, p: 2 }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          flexWrap="wrap"
          rowGap={2}
        >
          {/* Left Side: From and To Date */}
          <Box display="flex" flexDirection="column" gap={2}>
            {/* From Date + Print Button */}
            <Box display="flex" alignItems="flex-end" gap={2}>
              {/* From Date */}
              <FormControl size="small" sx={{ width: 200 }}>
                <InputLabel shrink htmlFor="from-date">
                  From Date
                </InputLabel>
                <TextField
                  id="from-date"
                  type="date"
                  size="small"
                  name="fromDate"
                  value={person.fromDate || ""}
                  onChange={(e) =>
                    setPerson((prev) => ({ ...prev, fromDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </FormControl>

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    window.location.href = `${API_BASE_URL}/qualifying_interview_template`;
                  }}
                  style={{
                    padding: "5px 20px",
                    border: "2px solid black",
                    backgroundColor: "#f0f0f0",
                    color: "black",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "225px",
                    pointerEvents: "auto",
                  }}
                >
                  📥 Download Template
                </button>
              </div>
            </Box>

            {/* To Date + Import Button */}
            <Box display="flex" alignItems="flex-end" gap={2}>
              <FormControl size="small" sx={{ width: 200 }}>
                <InputLabel shrink htmlFor="to-date">
                  To Date
                </InputLabel>
                <TextField
                  id="to-date"
                  type="date"
                  size="small"
                  name="toDate"
                  value={person.toDate || ""}
                  onChange={(e) =>
                    setPerson((prev) => ({ ...prev, toDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </FormControl>

              {/* ✅ Import Excel beside To Date */}
              <Box display="flex" alignItems="center" gap={1}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="excel-upload"
                />

                {/* ✅ Button that triggers file input */}
                <button
                  onClick={() =>
                    document.getElementById("excel-upload").click()
                  }
                  style={{
                    padding: "5px 20px",
                    border: "2px solid green",
                    backgroundColor: "#f0fdf4",
                    color: "green",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    userSelect: "none",
                    width: "200px", // ✅ same width as Print
                  }}
                  type="button"
                >
                  <FaFileExcel size={20} />
                  Choose Excel
                </button>
              </Box>

              <Button
                variant="contained"
                sx={{
                  height: "40px",
                  width: "200px", // ✅ matches Print
                  backgroundColor: "green",
                  "&:hover": { backgroundColor: "#166534" },
                  fontWeight: "bold",
                }}
                onClick={handleImport}
              >
                Import Applicants
              </Button>
            </Box>
          </Box>

          <Box display="flex" alignItems="flex-end" gap={2}>
            {/* Campus Dropdown */}
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography fontSize={13}>Campus:</Typography>

              <FormControl size="small" sx={{ width: "200px" }}>
                <InputLabel id="campus-label">Campus</InputLabel>
                <Select
                  labelId="campus-label"
                  id="campus-select"
                  name="campus"
                  value={person.campus ?? ""}
                  onChange={(e) => {
                    setPerson((prev) => ({ ...prev, campus: e.target.value }));
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="">
                    <em>All Campuses</em>
                  </MenuItem>

                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.branch}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <button
              onClick={printDiv}
              style={{
                padding: "5px 20px",
                border: "2px solid black",
                backgroundColor: "#f0f0f0",
                color: "black",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                transition: "background-color 0.3s, transform 0.2s",
                height: "40px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                userSelect: "none",
                width: "315px", // ✅ same width as Import
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#d3d3d3")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0f0f0")
              }
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.95)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              type="button"
            >
              <FcPrint size={20} />
              Print Qualfying / Interview Scores
            </button>
          </Box>
        </Box>
      </TableContainer>

      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323", color: "white" }}>
            <TableRow>
              <TableCell
                colSpan={10}
                sx={{
                  border: `2px solid ${borderColor}`,
                  py: 0.5,
                  backgroundColor: settings?.header_color || "#1976d2",
                  color: "white",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  {/* Left: Total Count */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Applicants: {filteredPersons.length}
                  </Typography>

                  {/* Right: Pagination Controls */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* First & Prev */}
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      First
                    </Button>

                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      Prev
                    </Button>

                    {/* Page Dropdown */}
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        displayEmpty
                        sx={{
                          fontSize: "12px",
                          height: 36,
                          color: "white",
                          border: "1px solid white",
                          backgroundColor: "transparent",
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "& svg": {
                            color: "white", // dropdown arrow icon color
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: "#fff", // dropdown background
                            },
                          },
                        }}
                      >
                        {Array.from({ length: totalPages }, (_, i) => (
                          <MenuItem key={i + 1} value={i + 1}>
                            Page {i + 1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography fontSize="11px" color="white">
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    {/* Next & Last */}
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      Next
                    </Button>

                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      Last
                    </Button>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <TableContainer
        component={Paper}
        sx={{ width: "100%", border: `2px solid ${borderColor}`, p: 2 }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          flexWrap="wrap"
          rowGap={3}
          columnGap={5}
        >
          {/* LEFT COLUMN: Sorting & Status Filters */}
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Sort By */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13} sx={{ minWidth: "10px" }}>
                Sort By:
              </Typography>
              <FormControl size="small" sx={{ width: "200px" }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Select Field</MenuItem>
                  <MenuItem value="name">Applicant's Name</MenuItem>
                  <MenuItem value="id">Applicant ID</MenuItem>
                  <MenuItem value="email">Email Address</MenuItem>
                </Select>
              </FormControl>
              <Typography fontSize={13} sx={{ minWidth: "10px" }}>
                Sort Order:
              </Typography>
              <FormControl size="small" sx={{ width: "200px" }}>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Select Order</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" alignItems="center" gap={3} mb={2}>
              {/* 🔢 Top Highest (just for display/filtering) */}
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  fontSize={13}
                  sx={{ minWidth: "80px", textAlign: "right" }}
                >
                  Top Highest:
                </Typography>
                <FormControl size="small" sx={{ width: 120 }}>
                  <Select
                    value={topCount}
                    onChange={(e) => {
                      setTopCount(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <MenuItem value={10}>Top 10</MenuItem>
                    <MenuItem value={25}>Top 25</MenuItem>
                    <MenuItem value={50}>Top 50</MenuItem>
                    <MenuItem value={100}>Top 100</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* ✅ Accept Top N Waiting List */}
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  fontSize={13}
                  sx={{ minWidth: "90px", textAlign: "right" }}
                >
                  Accept Count:
                </Typography>
                <FormControl size="small" sx={{ width: 120 }}>
                  <Select
                    value={acceptCount}
                    onChange={(e) => setAcceptCount(Number(e.target.value))}
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <MenuItem key={n} value={n}>
                        Top {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleAcceptTop}
                  sx={{ ml: 1, height: 40 }}
                >
                  Accept Top
                </Button>
              </Box>
            </Box>
          </Box>

          {/* MIDDLE COLUMN: SY & Semester */}
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13} sx={{ minWidth: "100px" }}>
                School Year:
              </Typography>
              <FormControl size="small" sx={{ width: "200px" }}>
                <InputLabel id="school-year-label">School Years</InputLabel>
                <Select
                  labelId="school-year-label"
                  value={selectedSchoolYear}
                  onChange={handleSchoolYearChange}
                  displayEmpty
                >
                  {schoolYears.length > 0 ? (
                    schoolYears.map((sy) => (
                      <MenuItem value={sy.year_id} key={sy.year_id}>
                        {sy.current_year} - {sy.next_year}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>School Year is not found</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13} sx={{ minWidth: "100px" }}>
                Semester:
              </Typography>
              <FormControl size="small" sx={{ width: "200px" }}>
                <InputLabel id="semester-label">School Semester</InputLabel>
                <Select
                  labelId="semester-label"
                  value={selectedSchoolSemester}
                  onChange={handleSchoolSemesterChange}
                  displayEmpty
                >
                  {semesters.length > 0 ? (
                    semesters.map((sem) => (
                      <MenuItem value={sem.semester_id} key={sem.semester_id}>
                        {sem.semester_description}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>School Semester is not found</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* RIGHT COLUMN: Department & Program */}
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13} sx={{ minWidth: "100px" }}>
                Department:
              </Typography>
              <FormControl size="small" sx={{ width: "400px" }}>
                <Select
                  value={selectedDepartmentFilter}
                  onChange={(e) => {
                    const selectedDept = e.target.value;
                    setSelectedDepartmentFilter(selectedDept);
                    handleDepartmentChange(selectedDept);
                  }}
                  displayEmpty
                >
                  {department.map((dep) => (
                    <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_name}>
                      {dep.dprtmnt_name} ({dep.dprtmnt_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13} sx={{ minWidth: "100px" }}>
                Program:
              </Typography>
              <FormControl size="small" sx={{ width: "350px" }}>
                <Select
                  value={selectedProgramFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">All Programs</MenuItem>
                  {curriculumOptions.map((prog) => (
                    <MenuItem
                      key={prog.curriculum_id}
                      value={prog.program_code}
                    >
                      {prog.program_code} - {prog.program_description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          {/* RIGHT SIDE: Action Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end", // ✅ pushes everything to the right
              width: "100%",
              mt: 2,
            }}
          >
            <Box display="flex" gap={2} alignItems="center">
              <Button
                variant="contained"
                color="primary"
                onClick={saveAllRows}
                sx={{ minWidth: 150 }}
              >
                SAVE ALL SCORES
              </Button>

              <Button
                variant="contained"
                color="secondary"
                onClick={handleAssignMax}
                sx={{ minWidth: 150 }}
              >
                Assign Max
              </Button>

              {/* 🔥 New Custom Assign Input + Button */}
              <TextField
                type="number"
                size="small"
                label="Custom Count"
                value={customCount}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomCount(v === "" ? 0 : parseInt(v, 10));
                }}
                sx={{ width: 120 }}
              />

              <Button
                variant="contained"
                color="warning"
                onClick={() => handleAssignCustom()}
                sx={{ minWidth: 150 }}
              >
                Assign Custom
              </Button>

              {/* 🔥 New Unassign All Button */}
              <Button
                variant="contained"
                color="error"
                onClick={handleUnassignAll}
                sx={{ minWidth: 150 }}
              >
                Unassign All
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={() => handleOpenDialog(null)}
                sx={{ width: "160px", height: "37px" }}
              >
                Send Email to All
              </Button>
            </Box>
          </Box>
        </Box>
      </TableContainer>

      <div ref={divToPrintRef}></div>

      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead
            sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
          >
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "2%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                #
              </TableCell>

              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "8%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Applicant ID
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "25%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Name
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "20%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Program
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                SHS GWA
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Final Rating
              </TableCell>
              {/* Exam Columns */}
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Qualifying Exam Score
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Interview Exam Score
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Total Ave.
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Status
              </TableCell>

              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Date
              </TableCell>

              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Action
              </TableCell>

              <TableCell
                sx={{
                  color: "white",
                  textAlign: "center",
                  width: "10%",
                  py: 0.5,
                  fontSize: "12px",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Assign
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPersons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14} // 👈 adjust if you add/remove columns
                  sx={{
                    textAlign: "center",
                    py: 3,
                    fontStyle: "italic",
                    color: "gray",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  No Applicants available.
                </TableCell>
              </TableRow>
            ) : (
              currentPersons.map((person, index) => {
                const qualifyingExam =
                  editScores[person.person_id]?.qualifying_exam_score ??
                  person.qualifying_exam_score ??
                  0;
                const qualifyingInterview =
                  editScores[person.person_id]?.qualifying_interview_score ??
                  person.qualifying_interview_score ??
                  0;
                const computedTotalAve =
                  (Number(qualifyingExam) + Number(qualifyingInterview)) / 2;
                const applicantId = person.applicant_number;
                const isAssigned = !!person.schedule_id; // ✅ check if already assigned
                const finalRating = Number(person.final_rating) || 0; // ✅ use backend value

                return (
                  <TableRow key={person.person_id}>
                    {/* # */}
                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      {index + 1}
                    </TableCell>

                    {/* Applicant Number */}
                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                        color: "blue",
                      }}
                      onClick={() => handleRowClick(person.person_id)}
                    >
                      {person.applicant_number ?? "N/A"}
                    </TableCell>

                    {/* Applicant Name */}
                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                        color: "blue",
                      }}
                      onClick={() => handleRowClick(person.person_id)}
                    >
                      {`${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}`}
                    </TableCell>

                    {/* Program */}
                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      {curriculumOptions.find(
                        (item) =>
                          item.curriculum_id?.toString() ===
                          person.program?.toString(),
                      )?.program_code ?? "N/A"}
                    </TableCell>

                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                      onClick={() => handleRowClick(person.person_id)}
                    >
                      {person.generalAverage1}
                    </TableCell>

                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      {finalRating.toFixed(2)}
                    </TableCell>

                    {/* Qualifying Exam Score */}
                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      <TextField
                        value={qualifyingExam}
                        onChange={(e) =>
                          handleScoreChange(
                            person,
                            "qualifying_exam_score",
                            Number(e.target.value),
                          )
                        }
                        size="small"
                        type="number"
                        sx={{ width: 70 }}
                      />
                    </TableCell>

                    {/* Qualifying Interview Score */}
                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      <TextField
                        value={qualifyingInterview}
                        onChange={(e) =>
                          handleScoreChange(
                            person,
                            "qualifying_interview_score",
                            Number(e.target.value),
                          )
                        }
                        size="small"
                        type="number"
                        sx={{ width: 70 }}
                      />
                    </TableCell>

                    {/* ✅ Total Average (read-only, comes from DB or recomputed) */}
                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      {computedTotalAve.toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      <FormControl fullWidth size="small">
                        <Select
                          value={
                            person.college_approval_status &&
                              person.college_approval_status !== "On Process"
                              ? person.college_approval_status
                              : "Waiting List" // ✅ default to Waiting List
                          }
                          onChange={(e) =>
                            handleStatusChange(
                              person.applicant_number,
                              e.target.value,
                            )
                          }
                          displayEmpty
                        >
                          <MenuItem value="Accepted">Accepted</MenuItem>
                          <MenuItem value="Rejected">Rejected</MenuItem>
                          <MenuItem value="Waiting List">Waiting List</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      {(() => {
                        if (!person.created_at.split("T")[0]) return "";

                        const date = new Date(person.created_at.split("T")[0]);

                        if (isNaN(date)) return person.created_at.split("T")[0];

                        return date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      })()}
                    </TableCell>

                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ width: "100px", height: "35px" }}
                        onClick={() => saveSingleRow(person)}
                      >
                        SAVE
                      </Button>
                    </TableCell>

                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      {person.interview_status === "Accepted" ? (
                        person.interview_status === 1 ? (
                          <Button
                            variant="contained"
                            disabled
                            sx={{
                              width: "220px",
                              height: "35px",
                              fontSize: "12px",
                              backgroundColor: "#B0B0B0",
                              color: "white",
                              cursor: "not-allowed",
                            }}
                          >
                            📧 Email Already Sent
                          </Button>
                        ) : (
                          <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            gap={2}
                            sx={{ width: "100%" }}
                          >
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              sx={{
                                width: "100px",
                                height: "35px",
                                fontSize: "12px",
                              }}
                              onClick={() =>
                                handleUnassignImmediate(person.applicant_number)
                              }
                            >
                              Unassign
                            </Button>

                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => handleOpenDialogSingle(person)}
                              sx={{
                                width: "100px",
                                height: "35px",
                                fontSize: "12px",
                              }}
                            >
                              Send Email
                            </Button>
                          </Box>
                        )
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          sx={{ width: "100px", height: "35px" }}
                          onClick={() =>
                            handleAssignSingle(person.applicant_number)
                          }
                        >
                          Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323", color: "white" }}>
            <TableRow>
              <TableCell
                colSpan={10}
                sx={{
                  border: `2px solid ${borderColor}`,
                  py: 0.5,
                  backgroundColor: settings?.header_color || "#1976d2",
                  color: "white",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  {/* Left: Total Count */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Applicants: {filteredPersons.length}
                  </Typography>

                  {/* Right: Pagination Controls */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* First & Prev */}
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      First
                    </Button>

                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      Prev
                    </Button>

                    {/* Page Dropdown */}
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        displayEmpty
                        sx={{
                          fontSize: "12px",
                          height: 36,
                          color: "white",
                          border: "1px solid white",
                          backgroundColor: "transparent",
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "& svg": {
                            color: "white", // dropdown arrow icon color
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: "#fff", // dropdown background
                            },
                          },
                        }}
                      >
                        {Array.from({ length: totalPages }, (_, i) => (
                          <MenuItem key={i + 1} value={i + 1}>
                            Page {i + 1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography fontSize="11px" color="white">
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    {/* Next & Last */}
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      Next
                    </Button>

                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      Last
                    </Button>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#800000", color: "white" }}>
          ✉️ Edit & Send Email
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {/* Sender */}
          <TextField
            label="Sender"
            value={dprtmntName}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ mb: 3 }}
          />

          {/* Subject */}
          <TextField
            label="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />

          {/* Message */}
          <TextField
            label="Message"
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            fullWidth
            multiline
            minRows={10}
            placeholder="Write your message here..."
            sx={{
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            color="error"
            variant="outlined"
          >
            Cancel
          </Button>

          <Button
            onClick={confirmSendEmails}
            color="success"
            variant="contained"
            sx={{ minWidth: "140px", height: "40px" }}
          >
            Send Emails
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={singleConfirmOpen}
        onClose={() => setSingleConfirmOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#800000", color: "white" }}>
          ✉️ Edit & Send Email
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {/* Sender */}
          <TextField
            label="Sender"
            value={dprtmntName}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ mb: 3 }}
          />

          {/* Subject */}
          <TextField
            label="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />

          {/* Message */}
          <TextField
            label="Message"
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            fullWidth
            multiline
            minRows={10}
            placeholder="Write your message here..."
            sx={{
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Button
            onClick={() => setSingleConfirmOpen(false)}
            color="error"
            variant="outlined"
          >
            Cancel
          </Button>

          <Button
            onClick={confirmSendEmailSingle}
            color="success"
            variant="contained"
            sx={{ minWidth: "140px", height: "40px" }}
          >
            Send Emails
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={handleClose}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={snack.open}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
      <LoadingOverlay
        open={loading2}
        message="Sending emails, please wait..."
      />
    </Box>
  );
};

export default QualifyingExamScore;
