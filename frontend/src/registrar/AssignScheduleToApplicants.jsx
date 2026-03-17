import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Box,
  Button,
  Typography,
  Paper,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  DialogActions,
  Table,
  TableRow,
  Card,
  FormControl,
  InputLabel,
  Select,
  TableContainer,
  TableCell,
  TableBody,
  TableHead,
  Snackbar,
  Alert,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PeopleIcon from "@mui/icons-material/People";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SearchIcon from "@mui/icons-material/Search";
import KeyIcon from "@mui/icons-material/Key";
import API_BASE_URL from "../apiConfig";
import CampaignIcon from '@mui/icons-material/Campaign';
import { Toc } from "@mui/icons-material";
import ScoreIcon from '@mui/icons-material/Score';

const AssignScheduleToApplicants = () => {
  const socket = useRef(null);
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
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (!settings) return;

    // 🎨 Colors
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
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




  const tabs = [
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


  const location = useLocation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(3);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };


  const [applicants, setApplicants] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedApplicants, setSelectedApplicants] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [persons, setPersons] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [person, setPerson] = useState({
    campus: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    document_status: "",
    extension: "",
    emailAddress: "",
    program: "",
    created_at: ""
  });

  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);

  const pageId = 11;

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
    const fetchCurriculums = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/applied_program`);
        setCurriculumOptions(response.data);
      } catch (error) {
        console.error("Error fetching curriculum options:", error);
      }
    };

    fetchCurriculums();
  }, []);


  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/applied_program`)
      .then(res => {
        setAllCurriculums(res.data);
        setCurriculumOptions(res.data);
      });
  }, []);


  const [allCurriculums, setAllCurriculums] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [semesters, setSchoolSemester] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSchoolSemester, setSelectedSchoolSemester] = useState('');
  const [selectedActiveSchoolYear, setSelectedActiveSchoolYear] = useState('');

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_school_year/`)
      .then((res) => setSchoolYears(res.data))
      .catch((err) => console.error(err));
  }, [])

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_school_semester/`)
      .then((res) => setSchoolSemester(res.data))
      .catch((err) => console.error(err));
  }, [])

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

  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const handleCloseSnack = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack(prev => ({ ...prev, open: false }));
  };


  useEffect(() => {
    fetchSchedules();
    fetchAllApplicants();
  }, []);

  // ✅ Keep your original function (exam_schedules)
  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/exam_schedules`);
      setSchedules(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  // ✅ Create a separate one for schedules with counts
  const fetchSchedulesWithCount = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/exam_schedules_with_count`);
      setSchedules(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching schedules with count:", err);
    }
  };

  // ⬇️ Initial load
  useEffect(() => {
    fetchSchedulesWithCount();
    fetchAllApplicants();
  }, []);

  useEffect(() => {
    socket.current = io(API_BASE_URL);

    return () => {
      socket.current.disconnect();
    };
  }, []);

  // ⬇️ Socket update refreshes the "with_count" one
  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("schedule_updated", ({ schedule_id }) => {
      console.log("📢 Schedule updated:", schedule_id);
      fetchSchedulesWithCount();
      fetchAllApplicants();
    });

    return () => {
      socket.current?.off("schedule_updated");
    };
  }, []);



  // ⬇️ Add this inside ApplicantList component, before useEffect
  const fetchAllApplicants = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/verified-ecat-applicants`);
      setPersons(res.data);
    } catch (err) {
      console.error("Error fetching verified ECAT applicants:", err);
    }
  };

  // ================= FUNCTIONS =================
  const [customCount, setCustomCount] = useState(0);


  // toggleSelectApplicant
  const handleAssignSingle = (id) => {
    if (!selectedSchedule) {
      setSnack({
        open: true,
        message: "Please select a schedule first.",
        severity: "warning",
      });
      return;
    }

    socket.current.emit("update_schedule", { schedule_id: selectedSchedule, applicant_numbers: [id] });

    socket.current.once("update_schedule_result", (res) => {
      if (res.success) {
        setSnack({
          open: true,
          message: `Applicant ${id} assigned successfully.`,
          severity: "success",
        });
        fetchAllApplicants();
      } else {
        setSnack({
          open: true,
          message: res.error || "Failed to assign applicant.",
          severity: "error",
        });
      }
    });
  };


  // handleAssign40 (assign max up to room_quota)
  const handleAssign40 = () => {
    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      return;
    }

    const schedule = schedules.find(s => s.schedule_id === selectedSchedule);
    if (!schedule) {
      setSnack({ open: true, message: "Selected schedule not found.", severity: "error" });
      return;
    }

    const currentCount = schedule.current_occupancy || 0;   // ✅ define it here
    const maxSlots = schedule.room_quota || 40;             // ✅ use DB quota if available
    const availableSlots = maxSlots - currentCount;

    if (availableSlots <= 0) {
      setSnack({ open: true, message: `This schedule is already full (${maxSlots} applicants).`, severity: "error" });
      return;
    }

    // take as many unassigned as we can up to availableSlots
    const unassigned = persons
      .filter(a => a.schedule_id == null)
      .slice(0, availableSlots)
      .map(a => a.applicant_number);

    if (unassigned.length === 0) {
      setSnack({ open: true, message: "No unassigned applicants available.", severity: "warning" });
      return;
    }

    socket.current.emit("update_schedule", { schedule_id: selectedSchedule, applicant_numbers: unassigned });

    socket.current.once("update_schedule_result", (res) => {
      if (res.success) {
        setSnack({
          open: true,
          message: `Assigned: ${res.assigned?.length || 0}, Updated: ${res.updated?.length || 0}, Skipped: ${res.skipped?.length || 0}`,
          severity: "success"
        });
        fetchAllApplicants();
        setSchedules(prev =>
          prev.map(s =>
            s.schedule_id === selectedSchedule
              ? { ...s, current_occupancy: currentCount + (res.assigned?.length || 0) }
              : s
          )
        );
      } else {
        setSnack({ open: true, message: res.error || "Failed to assign applicants.", severity: "error" });
      }
    });
  };


  // handleUnassignImmediate
  const handleUnassignImmediate = async (applicant_number) => {
    try {
      await axios.post(`${API_BASE_URL}/unassign_schedule`, { applicant_number });

      setPersons(prev =>
        prev.map(p =>
          p.applicant_number === applicant_number
            ? { ...p, schedule_id: null }
            : p
        )
      );

      setSelectedApplicants(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicant_number);
        return newSet;
      });

      setSnack({ open: true, message: `Applicant ${applicant_number} unassigned successfully.`, severity: "success" });
    } catch (err) {
      console.error("Error unassigning applicant:", err);
      setSnack({ open: true, message: err.response?.data?.error || "Failed to unassign applicant.", severity: "error" });
    }
  };

  // handleAssignCustom
  const handleAssignCustom = () => {
    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      return;
    }
    if (customCount <= 0) {
      setSnack({ open: true, message: "Please enter a valid number of applicants.", severity: "warning" });
      return;
    }

    const schedule = schedules.find(s => s.schedule_id === selectedSchedule);
    if (!schedule) {
      setSnack({ open: true, message: "Selected schedule not found.", severity: "error" });
      return;
    }

    const currentCount = schedule.current_occupancy || 0;
    const maxSlots = schedule.room_quota || 40; // <-- ✅ use DB quota, fallback 40
    const availableSlots = maxSlots - currentCount;

    if (availableSlots <= 0) {
      setSnack({ open: true, message: `This schedule is already full (${maxSlots} applicants).`, severity: "error" });
      return;
    }

    const assignCount = Math.min(customCount, availableSlots);

    const unassigned = currentPersons
      .filter(a => a.schedule_id == null)
      .slice(0, assignCount)
      .map(a => a.applicant_number);

    if (unassigned.length === 0) {
      setSnack({ open: true, message: "No unassigned applicants available.", severity: "warning" });
      return;
    }

    socket.current.emit("update_schedule", { schedule_id: selectedSchedule, applicant_numbers: unassigned });

    socket.current.once("update_schedule_result", (res) => {
      if (res.success) {
        setSnack({
          open: true,
          message: `Assigned: ${res.assigned?.length || 0}, Updated: ${res.updated?.length || 0}, Skipped: ${res.skipped?.length || 0}`,
          severity: "success"
        });
        fetchAllApplicants();
        setSchedules(prev =>
          prev.map(s =>
            s.schedule_id === selectedSchedule
              ? { ...s, current_occupancy: currentCount + (res.assigned?.length || 0) }
              : s
          )
        );
      } else {
        setSnack({ open: true, message: res.error || "Failed to assign applicants.", severity: "error" });
      }
    });
  };

  // handleUnassignAll
  const handleUnassignAll = async () => {
    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/unassign_all_from_schedule`, { schedule_id: selectedSchedule });
      setSnack({ open: true, message: res.data.message, severity: "success" });

      fetchAllApplicants();
      setSchedules(prev =>
        prev.map(s =>
          s.schedule_id === selectedSchedule
            ? { ...s, current_occupancy: 0 }
            : s
        )
      );
    } catch (err) {
      console.error("Error unassigning all:", err);
      setSnack({ open: true, message: err.response?.data?.error || "Failed to unassign all applicants.", severity: "error" });
    }
  };

  const [emailSubject, setEmailSubject] = useState("Entrance Exam Schedule");
  const [emailMessage, setEmailMessage] = useState("");

  const handleSendEmails = () => {
    // 1️⃣ Validate schedule selection
    if (!selectedSchedule) {
      setSnack({
        open: true,
        message: "Please select a schedule first.",
        severity: "warning",
      });
      return;
    }

    // 2️⃣ Find selected schedule details
    const sched = schedules.find(
      (s) => s.schedule_id === selectedSchedule
    );

    if (!sched) {
      setSnack({
        open: true,
        message: "Schedule not found.",
        severity: "error",
      });
      return;
    }

    const formatTime = (timeStr) => {
      if (!timeStr) return "";
      const [h, m] = timeStr.split(":");
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      return `${hour}:${m} ${ampm}`;
    };

    const formatDateLong = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };


    // 4️⃣ Build DEFAULT EMAIL MESSAGE
    // ⚠️ Applicant fields stay as placeholders
    const defaultMessage = `Hello, {first_name} {middle_name}. {last_name},

You have been assigned to the following entrance exam schedule:

📅 Day: ${formatDateLong(sched.day_description)}
🏫 Room: ${sched.room_description}
🕒 Time: ${formatTime(sched.start_time)} - ${formatTime(sched.end_time)}
🆔 Applicant No: {applicant_number}

Please log in to your Applicant Form Dashboard, click on your Exam Permit, and print it.
This printed permit must be presented to your proctor on the exam day to verify your eligibility.

⚠️ Important Reminders:
- Arrive at least 1 hour before your scheduled exam.
- Bring your printed exam permit, a valid ID, your own pen, and all required documents.
- Wear a plain white t-shirt on the exam day.

Thank you and good luck!

Admission Office`;

    // 5️⃣ Set message + open confirmation modal
    setEmailMessage(defaultMessage);
    setConfirmOpen(true);
  };


  const confirmSendEmails = () => {
    setConfirmOpen(false);
    setLoading2(true);

    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      setLoading2(false);
      return;
    }

    const assignedApplicants =
      persons
        .filter(p => Number(p.schedule_id) === Number(selectedSchedule))

        .map(p => p.applicant_number);


    if (assignedApplicants.length === 0) {
      setSnack({ open: true, message: "No applicants assigned to this schedule.", severity: "warning" });
      setLoading2(false);
      return;
    }

    socket.current.emit("send_schedule_emails", {
      schedule_id: selectedSchedule,
      user_person_id: localStorage.getItem("person_id"),


      // ✅ SEND TO BACKEND
      subject: emailSubject,
      message: emailMessage,
    });


    socket.current.once("send_schedule_emails_result", (res) => {
      if (res.success) {
        setSnack({ open: true, message: "Schedule sent successfully!", severity: "success" });
      } else {
        setSnack({ open: true, message: res.error || "Failed to send schedule in emails.", severity: "error" });
      }
      setLoading2(false);
    });
  };

  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/exam_schedules_with_count`);
        setSchedules(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      }
    };

    fetchSchedules();
  }, []);

  const handleRowClick = (person_id) => {
    if (!person_id) return;

    sessionStorage.setItem("admin_edit_person_id", String(person_id));
    sessionStorage.setItem("admin_edit_person_id_source", "applicant_list");
    sessionStorage.setItem("admin_edit_person_id_ts", String(Date.now()));

    // ✅ Always pass person_id in the URL
    navigate(`/admin_dashboard1?person_id=${person_id}`);
  };


  const [itemsPerPage, setItemsPerPage] = useState(100);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState([]);


  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim() === "") return;

      try {
        const res = await axios.get(`${API_BASE_URL}/api/search-person`, {
          params: { query: searchQuery }
        });

        setSearchError("");
        setSearchResults(res.data);

      } catch (err) {
        setSearchError("Applicant not found");
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
  const [department, setDepartment] = useState([]);

  const [selectedCampusFilter, setSelectedCampusFilter] = useState("");

  // ✅ Step 1: Filtering
  const filteredPersons = persons.filter((personData) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${personData.first_name ?? ""} ${personData.middle_name ?? ""} ${personData.last_name ?? ""}`.toLowerCase();

    /* 🏫 CAMPUS */
    const matchesCampus =
      selectedCampusFilter === "" ||
      personData.campus === selectedCampusFilter;



    const matchesApplicantID = personData.applicant_number?.toString().toLowerCase().includes(query);
    const matchesName = fullName.includes(query);
    const matchesEmail = personData.emailAddress?.toLowerCase().includes(query); // ✅ included

    const programInfo = allCurriculums.find(
      (opt) => opt.curriculum_id?.toString() === personData.program?.toString()
    );
    const matchesProgramQuery = programInfo?.program_code?.toLowerCase().includes(query);

    const matchesDepartment =
      selectedDepartmentFilter === "" || programInfo?.dprtmnt_name === selectedDepartmentFilter;

    const matchesProgramFilter =
      selectedProgramFilter === "" || programInfo?.program_code === selectedProgramFilter;

    const applicantAppliedYear = new Date(personData.created_at).getFullYear();
    const schoolYear = schoolYears.find((sy) => sy.year_id === selectedSchoolYear);

    const matchesSchoolYear =
      selectedSchoolYear === "" || (schoolYear && (String(applicantAppliedYear) === String(schoolYear.current_year)))

    const matchesSemester =
      selectedSchoolSemester === "" || String(personData.middle_code) === String(selectedSchoolSemester);


    return (
      (matchesApplicantID || matchesName || matchesEmail || matchesProgramQuery) &&
      matchesDepartment &&
      matchesProgramFilter &&
      matchesSchoolYear &&
      matchesSemester &&
      matchesCampus
    );
  });


  const sortedPersons = [...filteredPersons].sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case "name":
        valueA = `${a.last_name} ${a.first_name}`.toLowerCase();
        valueB = `${b.last_name} ${b.first_name}`.toLowerCase();
        break;

      case "id":
        valueA = a.applicant_number?.toString() || "";
        valueB = b.applicant_number?.toString() || "";
        break;

      case "email":
        valueA = a.emailAddress?.toLowerCase() || "";
        valueB = b.emailAddress?.toLowerCase() || "";
        break;

      default:
        valueA = a.created_at;
        valueB = b.created_at;
        break;
    }

    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // ✅ Step 3: Pagination (use sortedPersons instead of filteredPersons)
  const totalPages = Math.ceil(sortedPersons.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPersons = sortedPersons.slice(indexOfFirstItem, indexOfLastItem);


  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/departments`); // ✅ Update if needed
        setDepartment(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);






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
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [filteredPersons.length, totalPages]);

  // // 🔒 Disable right-click
  // document.addEventListener('contextmenu', (e) => e.preventDefault());

  // // 🔒 Block DevTools shortcuts + Ctrl+P silently
  // document.addEventListener('keydown', (e) => {
  //   const isBlockedKey =
  //     e.key === 'F12' || // DevTools
  //     e.key === 'F11' || // Fullscreen
  //     (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) || // Ctrl+Shift+I/J
  //     (e.ctrlKey && e.key.toLowerCase() === 'u') || // Ctrl+U (View Source)
  //     (e.ctrlKey && e.key.toLowerCase() === 'p');   // Ctrl+P (Print)

  //   if (isBlockedKey) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //   }
  // });


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
          ENTRANCE EXAM SCHEDULE MANAGEMENT
        </Typography>

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
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />
      <br />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "nowrap", // ❌ prevent wrapping
          width: "100%",
          mt: 1,
          gap: 2,
        }}
      >
        {tabs.map((tab, index) => (
          <Card
            key={index}
            onClick={() => handleStepClick(index, tab.to)}
            sx={{
              flex: `1 1 ${100 / tabs.length}%`, // evenly divide row
              height: 135,
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
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ fontSize: 40, mb: 1 }}>{tab.icon}</Box>
              <Typography sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}>
                {tab.label}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      <br />
      <br />
      <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Entrance Exam Schedule Management</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <Paper
        sx={{
          width: "100%",

          p: 3,

          border: `2px solid ${borderColor}`,
          bgcolor: "white",
          boxShadow: "0 3px 12px rgba(0,0,0,0.1)",

        }}
      >
        <Box >

          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Select Schedule */}
            <Grid item xs={12} md={3}>
              <Typography textAlign="left" color="maroon" sx={{ mb: 1 }}>
                Select Schedule:
              </Typography>
              <TextField
                select
                fullWidth
                value={selectedSchedule}
                onChange={(e) => setSelectedSchedule(e.target.value)}
                variant="outlined"
                sx={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  bgcolor: "white",
                }}
              >
                <MenuItem value="">-- Select Schedule --</MenuItem>

                {[...schedules]
                  // ✅ REMOVE FULL ROOMS HERE
                  .filter(s => Number(s.current_occupancy) < Number(s.room_quota))
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((s) => (
                    <MenuItem
                      key={s.schedule_id}
                      value={s.schedule_id}
                    >
                      {s.branch} : {s.proctor} - {s.day_description} | {s.building_description} | {s.room_description} |{" "}
                      {new Date(`1970-01-01T${s.start_time}`).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      -{" "}
                      {new Date(`1970-01-01T${s.end_time}`).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </MenuItem>
                  ))}
              </TextField>

            </Grid>

            {/* Proctor */}
            <Grid item xs={12} md={3}>
              <Typography textAlign="left" color="maroon" sx={{ mb: 1 }}>
                Proctor:
              </Typography>
              <TextField
                fullWidth
                value={
                  selectedSchedule
                    ? schedules.find((s) => s.schedule_id === selectedSchedule)?.proctor || "Not assigned"
                    : ""
                }
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  bgcolor: "#f9f9f9",
                }}
              />
            </Grid>

            {/* Room Quota */}
            <Grid item xs={12} md={3}>
              <Typography textAlign="left" color="maroon" sx={{ mb: 1 }}>
                Room Quota:
              </Typography>
              <TextField
                fullWidth
                value={
                  selectedSchedule
                    ? schedules.find((s) => s.schedule_id === selectedSchedule)?.room_quota || "N/A"
                    : ""
                }
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  bgcolor: "#f9f9f9",
                }}
              />
            </Grid>

            {/* Current Occupancy */}
            <Grid item xs={12} md={3}>
              <Typography textAlign="left" color="maroon" sx={{ mb: 1 }}>
                Current Occupancy:
              </Typography>
              <TextField
                fullWidth
                value={
                  selectedSchedule
                    ? (() => {
                      const s = schedules.find((x) => x.schedule_id === selectedSchedule);
                      return s ? `${s.current_occupancy}/${s.room_quota}` : "";
                    })()
                    : ""
                }
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  bgcolor: "#f9f9f9",
                }}
              />
            </Grid>
          </Grid>

        </Box>
        {/* === ROW 1: Sort + Buttons === */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          {/* LEFT SIDE: Sort By + Sort Order */}
          <Box display="flex" alignItems="center" gap={2}>
            {/* Sort By */}
            <Box display="flex" alignItems="center" gap={1} marginLeft={-4}>
              <Typography fontSize={13} sx={{ minWidth: "80px", textAlign: "right" }}>
                Sort By:
              </Typography>
              <FormControl size="small" sx={{ width: "200px" }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="name">Applicant's Name</MenuItem>
                  <MenuItem value="id">Applicant ID</MenuItem>
                  <MenuItem value="email">Email Address</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Sort Order */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13} sx={{ minWidth: "80px", textAlign: "right" }}>
                Sort Order:
              </Typography>
              <FormControl size="small" sx={{ width: "150px" }}>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>


          <Box display="flex" alignItems="center" gap={2}>

            {/* NEW Cancel Button BEFORE Assign Max */}
            {/* <Button
              variant="contained"
              sx={{
                backgroundColor: "#8B0000",
                color: "white",
                minWidth: 150,
              }}
              onClick={async () => {
                if (!window.confirm("Are you sure? This will cancel ALL unscheduled applicants?")) {
                  return;
                }

                try {
                  const res = await axios.post(`${API_BASE_URL}/cancel-unscheduled-applicants`);
                  alert(res.data.message);
                } catch (err) {
                  console.error(err);
                  alert("Error cancelling applicants.");
                }
              }}
            >
              Reject All
            </Button> */}

            {/* Assign Max */}
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAssign40}
              sx={{ minWidth: 150 }}
            >
              Assign Max
            </Button>

            {/* Custom Input */}
            <TextField
              type="number"
              size="small"
              label="Custom Count"
              value={customCount}
              onChange={(e) => setCustomCount(Number(e.target.value))}
              sx={{ width: 120 }}
            />

            {/* Assign Custom */}
            <Button
              variant="contained"
              color="warning"
              onClick={handleAssignCustom}
              sx={{ minWidth: 150 }}
            >
              Assign Custom
            </Button>

            {/* Unassign All */}
            <Button
              variant="contained"
              color="error"
              onClick={handleUnassignAll}
              sx={{ minWidth: 150 }}
            >
              Unassign All
            </Button>

            {/* Send Emails */}
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={handleSendEmails}
              sx={{ minWidth: 150 }}
            >
              SEND ALL EMAIL
            </Button>

          </Box>

        </Box>

        {/* === Filters Row: Department + Program + School Year + Semester === */}
        <Box display="flex" alignItems="center" gap={3} mb={2} flexWrap="wrap">
          {/* Department Filter */}
          <Box display="flex" alignItems="center" gap={1}>



            <Typography fontSize={13} sx={{ minWidth: "70px", }}>Campus:</Typography>
            <FormControl size="small" sx={{ width: "180px" }}>
              <InputLabel id="campus-label">Campus</InputLabel>
              <Select
                labelId="campus-label"
                id="campus-select"
                name="campus"
                value={selectedCampusFilter}
                onChange={(e) => {
                  setSelectedCampusFilter(e.target.value);
                }}
              >
                <MenuItem value=""><em>All Campuses</em></MenuItem>

                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.branch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>


            <Typography fontSize={13} sx={{ minWidth: "70px" }}>Department:</Typography>
            <FormControl size="small" sx={{ width: "250px" }}>
              <Select
                value={selectedDepartmentFilter}
                onChange={(e) => {
                  const selectedDept = e.target.value;
                  setSelectedDepartmentFilter(selectedDept);
                  handleDepartmentChange(selectedDept);
                }}
                displayEmpty
              >
                <MenuItem value="">All Departments</MenuItem>
                {department.map((dep) => (
                  <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_name}>
                    {dep.dprtmnt_name} ({dep.dprtmnt_code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Program Filter */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={13} sx={{ minWidth: "60px" }}>Program:</Typography>
            <FormControl size="small" sx={{ width: "250px" }}>
              <Select
                value={selectedProgramFilter}
                onChange={(e) => setSelectedProgramFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Programs</MenuItem>
                {curriculumOptions.map((prog) => (
                  <MenuItem key={prog.curriculum_id} value={prog.program_code}>
                    {prog.program_code} - {prog.program_description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* School Year Filter */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={13} sx={{ minWidth: "80px" }}>School Year:</Typography>
            <FormControl size="small" sx={{ width: "180px" }}>
              <Select
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

          {/* Semester Filter */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={13} sx={{ minWidth: "70px" }}>Semester:</Typography>
            <FormControl size="small" sx={{ width: "180px" }}>
              <Select
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




      </Paper>

      <TableContainer component={Paper} sx={{ width: '100%', }}>
        <Table size="small">
          <TableHead sx={{
            backgroundColor: settings?.header_color || "#1976d2",
            color: "white"
          }}>
            <TableRow>
              <TableCell colSpan={10} sx={{
                border: `2px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2",
                color: "white"
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
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
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        }
                      }}
                    >
                      First
                    </Button>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        }
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
                          fontSize: '12px',
                          height: 36,
                          color: 'white',
                          border: '1px solid white',
                          backgroundColor: 'transparent',
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                          },
                          '& svg': {
                            color: 'white', // dropdown arrow icon color
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: '#fff', // dropdown background
                            }
                          }
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
                      of {totalPages} page{totalPages > 1 ? 's' : ''}
                    </Typography>


                    {/* Next & Last */}
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        }
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
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        }
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

      <TableContainer component={Paper} sx={{ width: "100%", border: `2px solid ${borderColor}` }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#F1F1F1", }}>
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: `2px solid ${borderColor}` }}>#</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: `2px solid ${borderColor}` }}>Applicant ID</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: `2px solid ${borderColor}` }}>Name</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: `2px solid ${borderColor}` }}>Program</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: `2px solid ${borderColor}` }}>Email Address</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: `2px solid ${borderColor}` }}>Date Applied</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: `2px solid ${borderColor}` }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPersons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", p: 2 }}>
                  No applicants found.
                </TableCell>
              </TableRow>
            ) : (
              currentPersons.map((person, index) => {
                const id = person.applicant_number;
                const isAssigned = person.schedule_id !== null;
                const isSelected = selectedApplicants.has(id);

                return (
                  <TableRow key={person.person_id}>
                    {/* Auto-increment # */}
                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}`, fontSize: "12px" }}>
                      {indexOfFirstItem + index + 1}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "blue",
                        cursor: "pointer",
                        textAlign: "center",
                        border: `2px solid ${borderColor}`,
                        borderLeft: "2px solid maroon",
                        py: 0.5,
                        fontSize: "12px",
                      }}
                      onClick={() => handleRowClick(person.person_id)}
                    >
                      {person.applicant_number ?? "N/A"}
                    </TableCell>

                    {/* Applicant Name */}
                    <TableCell
                      sx={{
                        color: "blue",
                        cursor: "pointer",
                        textAlign: "left",
                        border: `2px solid ${borderColor}`,
                        borderLeft: "2px solid maroon",
                        py: 0.5,
                        fontSize: "12px",
                      }}
                      onClick={() => handleRowClick(person.person_id)}
                    >
                      {`${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}`}
                    </TableCell>


                    {/* Program */}
                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}`, fontSize: "12px" }}>
                      {curriculumOptions.find(
                        (item) => item.curriculum_id?.toString() === person.program?.toString()
                      )?.program_code ?? "N/A"}
                    </TableCell>

                    {/* Email */}
                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}`, fontSize: "12px" }}>
                      {person.emailAddress ?? "N/A"}
                    </TableCell>

                    <TableCell
                      sx={{ textAlign: "center", border: `2px solid ${borderColor}`, fontSize: "12px" }}
                    >
                      {(() => {
                        if (!person.created_at) return "";

                        const date = new Date(person.created_at);

                        if (isNaN(date)) return person.created_at;

                        return date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      })()}
                    </TableCell>

                    {/* Action Buttons (from AssignScheduleToApplicants) */}
                    {/* Action Buttons (from AssignScheduleToApplicants) */}
                    <TableCell
                      sx={{
                        textAlign: "center",
                        border: `2px solid ${borderColor}`,
                      }}
                    >
                      {!isAssigned ? (
                        // ✅ Not assigned → Assign only
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAssignSingle(id)} // new helper for 1 applicant
                        >
                          Assign
                        </Button>
                      ) : (
                        // ✅ Already assigned → show Unassign + Send Email
                        <Box display="flex" gap={1} justifyContent="center">
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleUnassignImmediate(id)}
                          >
                            Unassign
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => {

                              if (!selectedSchedule) {
                                setSnack({
                                  open: true,
                                  message: "Please select a schedule first.",
                                  severity: "warning",
                                });
                                return;
                              }

                              const sched = schedules.find(
                                (s) => s.schedule_id === selectedSchedule
                              );

                              if (!sched) {
                                setSnack({
                                  open: true,
                                  message: "Schedule not found.",
                                  severity: "error",
                                });
                                return;
                              }

                              const formatTime = (timeStr) => {
                                if (!timeStr) return "";
                                const [h, m] = timeStr.split(":");
                                let hour = parseInt(h, 10);
                                const ampm = hour >= 12 ? "PM" : "AM";
                                hour = hour % 12 || 12;
                                return `${hour}:${m} ${ampm}`;
                              };

                              const formatDateLong = (dateStr) => {
                                if (!dateStr) return "";
                                const date = new Date(dateStr);
                                return date.toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                });
                              };

                              setEmailMessage(
                                `Hello, ${person.first_name} ${person.middle_name ? person.middle_name.charAt(0) + "." : ""
                                } ${person.last_name}

You have been assigned to the following entrance exam schedule:

📅 Day: ${formatDateLong(sched.day_description)}
🏫 Room: ${sched.room_description}
🕒 Time: ${formatTime(sched.start_time)} - ${formatTime(sched.end_time)}
🆔 Applicant No: ${person.applicant_number}

Please log in to your Applicant Form Dashboard, click on your Exam Permit, and print it. 
This printed permit must be presented to your proctor on the exam day to verify your eligibility.

⚠️ Important Reminders:
- Arrive at least 1 hour before your scheduled exam.
- Bring your printed exam permit, a valid ID, your own pen, and all required documents.
- Wear a plain white t-shirt on the exam day.

Thank you and good luck!

Admission Office`);

                              setConfirmOpen(true);
                            }}
                          >
                            SEND EMAIL
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <br />

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleCloseSnack} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>





      {/* Edit & Send Email Dialog */}
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



          {/* Subject */}
          <TextField
            label="Email Subject"
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
            minRows={12}
            placeholder="Write your message here..."
            sx={{
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          />

          <Typography
            variant="caption"
            color="gray"
            sx={{ display: "block", mt: 2 }}
          >
            🔑 Available placeholders:
            {` {first_name}, {last_name}, {applicant_number}, {day}, {room}, {start_time}, {end_time}, {office} `}
          </Typography>

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
            variant="contained"
            color="success"
            size="small"
            sx={{ minWidth: 140, height: 40 }}
          >
            SEND EMAIL
          </Button>

        </DialogActions>
      </Dialog>

      <LoadingOverlay open={loading2} message="Sending emails, please wait..." />
    </Box>
  );
};

export default AssignScheduleToApplicants;

