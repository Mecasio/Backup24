import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from 'axios';
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
    TableCell,
    TextField,
    MenuItem,
    Card,
    InputLabel,
    TableBody,
} from '@mui/material';
import { Snackbar, Alert } from '@mui/material';
import { useNavigate, useLocation } from "react-router-dom";
import { FcPrint } from "react-icons/fc";
import EaristLogo from "../assets/EaristLogo.png";
import { Link } from "react-router-dom";
import { FaFileExcel } from "react-icons/fa";
import SchoolIcon from "@mui/icons-material/School";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PeopleIcon from "@mui/icons-material/People";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import _ from "lodash";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SearchIcon from "@mui/icons-material/Search";
import KeyIcon from "@mui/icons-material/Key";
import API_BASE_URL from "../apiConfig";
import CampaignIcon from '@mui/icons-material/Campaign';
import ScoreIcon from '@mui/icons-material/Score';

const ApplicantScoring = () => {


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


    const words = companyName.trim().split(" ");
    const middle = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middle).join(" ");
    const secondLine = words.slice(middle).join(" ");

    const location = useLocation();

    const handleRowClick = (person_id) => {
        if (!person_id) return;

        sessionStorage.setItem("admin_edit_person_id", String(person_id));
        sessionStorage.setItem("admin_edit_person_id_source", "applicant_list");
        sessionStorage.setItem("admin_edit_person_id_ts", String(Date.now()));


    };

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

    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);

    const pageId = 8;

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
    const [activeStep, setActiveStep] = useState(5);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));



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


    useEffect(() => {
        if (location.search.includes("person_id")) {
            navigate("/applicant_scoring", { replace: true });  // ⬅️ removes ?person_id
        }
    }, [location, navigate]);

    const handleStepClick = (index, to) => {
        setActiveStep(index);

        const pid = sessionStorage.getItem("admin_edit_person_id");
        if (pid) {
            navigate(`${to}?person_id=${pid}`);
        } else {
            navigate(to);
        }
    };




    const [persons, setPersons] = useState([]);

    const [selectedPerson, setSelectedPerson] = useState(null);
    const [assignedNumber, setAssignedNumber] = useState('');
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");

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



        // ⭐ CASE 3: No URL ID and no last selected → start blank
        setUserID("");
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


    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
    const [person, setPerson] = useState({
        campus: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        document_status: "",
        extension: "",
        generalAverage1: "",
        program: "",
        created_at: "",
        middle_code: "",
    });
    const [allApplicants, setAllApplicants] = useState([]);

    // ⬇️ Add this inside ApplicantList component, before useEffect

    // ✅ fetch applicants WITH exam scores
    const fetchApplicants = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api-applicant-scoring`);

            // ✅ Remove duplicates based on applicant_number
            const uniqueData = Object.values(
                res.data.reduce((acc, curr) => {
                    acc[curr.applicant_number] = curr;
                    return acc;
                }, {})
            );

            setPersons(uniqueData);
        } catch (err) {
            console.error("❌ Error fetching applicants with scores:", err);
        }
    };


    useEffect(() => {
        fetchApplicants();
    }, []);



    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim() === "") return; // Don't search empty

            try {
                const res = await axios.get(`${API_BASE_URL}/api/search-person`, {
                    params: { query: searchQuery }
                });

                if (res.data && res.data.person_id) {
                    const details = await axios.get(`${API_BASE_URL}/api/person_with_applicant/${res.data.person_id}`);
                    setPerson(details.data);

                    sessionStorage.setItem("admin_edit_person_id", details.data.person_id);
                    setUserID(details.data.person_id);
                    setSearchError("");
                } else {
                    console.error("No valid person ID found in search result");
                    setSearchError("Invalid search result");
                }
            } catch (err) {
                console.error("Search failed:", err);
                setSearchError("Applicant not found");
            }
        }, 500); // debounce

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);


    const [curriculumOptions, setCurriculumOptions] = useState([]);


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

    // helper to make string comparisons robust
    const normalize = (s) => (s ?? "").toString().trim().toLowerCase();
    const parseDateOnlyLocal = (value) => {
        if (!value) return null;
        const datePart = String(value).split("T")[0];
        const [y, m, d] = datePart.split("-").map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
    };
    const [showSubmittedOnly, setShowSubmittedOnly] = useState(false);

    const filteredPersons = persons
        .filter((personData) => {

            /* 🔎 SEARCH */
            const fullText = `${personData.first_name} ${personData.middle_name} ${personData.last_name} ${personData.emailAddress ?? ''} ${personData.applicant_number ?? ''}`.toLowerCase();
            const matchesSearch = fullText.includes(searchQuery.toLowerCase());




            /* 🏫 CAMPUS */
            const matchesCampus =
                !person.campus || personData.campus === person.campus


            /* 📄 DOCUMENT STATUS */
            const matchesApplicantStatus =
                selectedApplicantStatus === "" ||
                normalize(personData.document_status) === normalize(selectedApplicantStatus);

            /* 📝 REGISTRAR STATUS */
            const matchesRegistrarStatus =
                selectedRegistrarStatus === "" ||
                (selectedRegistrarStatus === "Submitted" && personData.registrar_status === 1) ||
                (selectedRegistrarStatus === "Unsubmitted / Incomplete" && personData.registrar_status === 0);

            /* 🎓 PROGRAM / DEPARTMENT */
            const programInfo = allCurriculums.find(
                (opt) => opt.curriculum_id?.toString() === personData.program?.toString()
            );

            const matchesProgram =
                selectedProgramFilter === "" ||
                programInfo?.program_code === selectedProgramFilter;

            const matchesDepartment =
                selectedDepartmentFilter === "" ||
                programInfo?.dprtmnt_name === selectedDepartmentFilter;

            /* 📅 CREATED AT — Manila-safe date parsing */
            const appliedDate = parseDateOnlyLocal(personData.created_at);
            if (!appliedDate) return false;

            const applicantAppliedYear = appliedDate.getFullYear();

            const schoolYear = schoolYears.find((sy) => sy.year_id === selectedSchoolYear);

            const matchesSchoolYear =
                selectedSchoolYear === "" ||
                (schoolYear && String(applicantAppliedYear) === String(schoolYear.current_year));

            /* 🕒 SEMESTER */
            const matchesSemester =
                selectedSchoolSemester === "" ||
                String(personData.middle_code) === String(selectedSchoolSemester);

            /* 📆 DATE RANGE (FULLY FIXED) */
            let matchesDateRange = true;

            let from = parseDateOnlyLocal(person.fromDate);
            let to = parseDateOnlyLocal(person.toDate);
            if (to) to.setHours(23, 59, 59, 999);

            if (from && to && from > to) {
                const swappedFrom = parseDateOnlyLocal(person.toDate);
                const swappedTo = parseDateOnlyLocal(person.fromDate);
                if (swappedTo) swappedTo.setHours(23, 59, 59, 999);
                from = swappedFrom;
                to = swappedTo;
            }

            if (from && appliedDate < from) matchesDateRange = false;
            if (to && appliedDate > to) matchesDateRange = false;

            /* 📥 SUBMITTED DOCUMENTS */
            const matchesSubmittedDocs =
                !showSubmittedOnly || personData.submitted_documents === 1;

            /* FINAL RESULT */
            return (
                matchesSearch &&
                matchesCampus &&
                matchesApplicantStatus &&
                matchesRegistrarStatus &&
                matchesSubmittedDocs &&
                matchesDepartment &&
                matchesProgram &&
                matchesSchoolYear &&
                matchesSemester &&
                matchesDateRange
            );
        })

        /* 🔽 SORTING */
        .sort((a, b) => {
            /* ⭐ FINAL RATING */
            const aFinal =
                (Number(a.english || 0) +
                    Number(a.science || 0) +
                    Number(a.filipino || 0) +
                    Number(a.math || 0) +
                    Number(a.abstract || 0)) / 5;

            const bFinal =
                (Number(b.english || 0) +
                    Number(b.science || 0) +
                    Number(b.filipino || 0) +
                    Number(b.math || 0) +
                    Number(b.abstract || 0)) / 5;

            /* ⭐ SORT BY HIGHEST FINAL FIRST */
            if (aFinal !== bFinal) {
                return bFinal - aFinal;  // highest first
            }

            /* ⭐ IF TIE → FIRST COME FIRST SERVE */
            const dateA = parseDateOnlyLocal(a.created_at) || new Date(0);
            const dateB = parseDateOnlyLocal(b.created_at) || new Date(0);

            return dateA - dateB;  // earliest submission first
        });


    const [itemsPerPage, setItemsPerPage] = useState(100);

    const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPersons = filteredPersons.slice(indexOfFirstItem, indexOfLastItem);

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


    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [filteredPersons.length, totalPages]);


    const handleSnackClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    };



    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/applied_program`)
            .then(res => {
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
                allCurriculums.filter(opt => opt.dprtmnt_name === selectedDept)
            );
        }
        setSelectedProgramFilter("");
    };



    const [applicants, setApplicants] = useState([]);
    const divToPrintRef = useRef();


    const printDiv = () => {
        const newWin = window.open("", "Print-Window");
        newWin.document.open();

        // ✅ Dynamic logo and company name from Settings
        const logoSrc = fetchedLogo || EaristLogo;
        const name = companyName?.trim() || "No Company Name Available";

        // ✅ Split company name into two lines for layout
        const words = name.split(" ");
        const middleIndex = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, middleIndex).join(" ");
        const secondLine = words.slice(middleIndex).join(" ");

        // ✅ Dynamic campus address from Settings (dropdown or custom)
        let campusAddress = "";
        if (settings?.campus_address) {
            campusAddress = settings.campus_address;
        } else if (settings?.address) {
            campusAddress = settings.address;
        } else {
            campusAddress = "No address set in Settings";
        }

        const htmlContent = `
  <html>
    <head>
      <title>Entrance Examination Scores</title>
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
    <body onload="window.print(); setTimeout(() => window.close(), 100);">
      <div class="print-container">
        <!-- ✅ HEADER -->
        <div class="print-header">
          <img src="${logoSrc}" alt="School Logo" />
          <div>
            <div>Republic of the Philippines</div>

            <!-- ✅ Dynamic company name -->
            <b style="letter-spacing: 1px; font-size: 22px; font-family: 'Times New Roman', serif;">
              ${firstLine}
            </b>
            ${secondLine
                ? `<div style="letter-spacing: 1px; font-size: 22px; font-family: 'Times New Roman', serif;">
                     <b>${secondLine}</b>
                   </div>`
                : ""
            }

            <!-- ✅ Dynamic campus address from Settings -->
            <div style="font-size: 12px;">${campusAddress}</div>

            <div style="margin-top: 25px;">
              <b style="font-size: 22px; letter-spacing: 1px;">Entrance Examination Scores</b>
            </div>
          </div>
        </div>

        <!-- ✅ TABLE -->
        <table>
          <thead>
            <tr>
              <th style="width:15%">Applicant ID</th>
              <th class="name-col">Applicant Name</th>
              <th style="width:15%">Program</th>
              <th style="width:7%">English</th>
              <th style="width:7%">Science</th>
              <th style="width:7%">Filipino</th>
              <th style="width:7%">Math</th>
              <th style="width:7%">Abstract</th>
              <th style="width:10%">Final Rating</th>
                 <th style="width:10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPersons
                .map((person) => {
                    const english = Number(person.english) || 0;
                    const science = Number(person.science) || 0;
                    const filipino = Number(person.filipino) || 0;
                    const math = Number(person.math) || 0;
                    const abstract = Number(person.abstract) || 0;
                    const computedFinalRating = (english + science + filipino + math + abstract) / 5;

                    return `
                <tr>
                  <td>${person.applicant_number || ""}</td>
                  <td class="name-col">${person.last_name}, ${person.first_name} ${person.middle_name || ""} ${person.extension || ""}</td>
                  <td>${curriculumOptions.find(
                        (item) =>
                            item.curriculum_id?.toString() === person.program?.toString()
                    )?.program_code || ""}</td>
                  <td>${english}</td>
                  <td>${science}</td>
                  <td>${filipino}</td>
                  <td>${math}</td>
                  <td>${abstract}</td>
                  <td>${computedFinalRating.toFixed(2)}</td>
                   <td>${person.status || ""}</td>
                </tr>`;
                })
                .join("")}
          </tbody>
        </table>
      </div>
    </body>
  </html>`;

        newWin.document.write(htmlContent);
        newWin.document.close();
    };



    const [file, setFile] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [editScores, setEditScores] = useState({});
    const [saving, setSaving] = useState(false);

    // When a file is chosen
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
    };

    // IMPORT (leave as you had it)
    const handleImport = async (userID) => {
        try {
            if (!selectedFile) {
                setSnack({ open: true, message: "Please choose a file first!", severity: "warning" });
                return;
            }
            const fd = new FormData();
            fd.append("file", selectedFile);
            fd.append("userID", userID);
            const res = await axios.post(`${API_BASE_URL}/api/exam/import`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            if (res.data.success) {
                setSnack({ open: true, message: "Excel imported successfully!", severity: "success" });
                fetchApplicants();
                setSelectedFile(null);
            } else {
                setSnack({ open: true, message: res.data.error || "Failed to import", severity: "error" });
            }
        } catch (err) {
            console.error("❌ Import error:", err);
            setSnack({ open: true, message: "Import failed: " + (err.response?.data?.error || err.message), severity: "error" });
        }
    };

    // typed changes: update editScores and UI only (no auto-save)
    // typed changes: update editScores and UI only (no auto-save)
    const handleScoreChange = (person, field, value) => {
        setEditScores(prev => ({
            ...prev,
            [person.person_id]: {
                ...prev[person.person_id],
                [field]: Number(value)
            }
        }));

        // update UI immediately (so table shows typed value)
        // <-- UPDATE persons (table source) instead of applicants
        setPersons(prev => prev.map(p => p.person_id === person.person_id ? { ...p, [field]: Number(value) } : p));
    };

    const buildPayload = (person) => {
        const scores = editScores[person.person_id] || {};

        return {
            applicant_number: person.applicant_number,   // REQUIRED BY BACKEND
            english: Number(scores.english ?? person.english ?? 0),
            science: Number(scores.science ?? person.science ?? 0),
            filipino: Number(scores.filipino ?? person.filipino ?? 0),
            math: Number(scores.math ?? person.math ?? 0),
            abstract: Number(scores.abstract ?? person.abstract ?? 0),
            final_rating:
                (Number(scores.english ?? person.english ?? 0) +
                    Number(scores.science ?? person.science ?? 0) +
                    Number(scores.filipino ?? person.filipino ?? 0) +
                    Number(scores.math ?? person.math ?? 0) +
                    Number(scores.abstract ?? person.abstract ?? 0)) / 5,
            status: scores.status ?? person.status ?? ""
        };
    };

    const saveSingleRow = async (person) => {
        try {
            setSaving(true);

            const payload = buildPayload(person);
            const res = await axios.post(`${API_BASE_URL}/api/exam/save`, payload);

            if (!res.data?.success) {
                throw new Error(res.data?.error || "Save failed");
            }

            const saved = res.data.saved;

            // Normalize saved just in case (backend returns lowercase already)
            const normalized = {
                person_id: saved.person_id ?? person.person_id,
                english: saved.english != null ? Number(saved.english) : Number(person.english || 0),
                science: saved.science != null ? Number(saved.science) : Number(person.science || 0),
                filipino: saved.filipino != null ? Number(saved.filipino) : Number(person.filipino || 0),
                math: saved.math != null ? Number(saved.math) : Number(person.math || 0),
                abstract: saved.abstract != null ? Number(saved.abstract) : Number(person.abstract || 0),
                final_rating: saved.final_rating != null ? Number(saved.final_rating) : (
                    (Number(saved.english ?? person.english ?? 0) +
                        Number(saved.science ?? person.science ?? 0) +
                        Number(saved.filipino ?? person.filipino ?? 0) +
                        Number(saved.math ?? person.math ?? 0) +
                        Number(saved.abstract ?? person.abstract ?? 0)) / 5
                ),
                status: saved.status ?? person.status,
                date_created: saved.date_created ?? person.date_created
            };

            // 1) Update persons (table source) immediately with normalized saved values
            setPersons(prev =>
                prev.map(p =>
                    p.person_id === normalized.person_id
                        ? { ...p, ...normalized }
                        : p
                )
            );

            // 2) Clear edit buffer AFTER persons updated
            setEditScores(prev => {
                const copy = { ...prev };
                delete copy[person.person_id];
                return copy;
            });

            setSnack({ open: true, message: "Row saved successfully!", severity: "success" });
        } catch (err) {
            console.error("SAVE ERROR:", err);
            setSnack({
                open: true,
                message: "Save failed: " + (err.response?.data?.error || err.message),
                severity: "error"
            });
        } finally {
            setSaving(false);
        }
    };


    const saveAllRows = async () => {
        try {
            setSaving(true);

            // iterate over persons (table data), not applicants
            for (const person of persons) {
                const payload = buildPayload(person);
                await axios.post(`${API_BASE_URL}/api/exam/save`, payload);
            }

            // refresh table source from server to ensure consistency
            await fetchApplicants(); // this sets persons via setPersons

            setSnack({ open: true, message: "All scores saved!", severity: "success" });

        } catch (err) {
            console.error("SAVE ALL ERROR:", err);
            setSnack({
                open: true,
                message: "Save All failed: " + (err.response?.data?.error || err.message),
                severity: "error"
            });
        } finally {
            setSaving(false);
        }
    };


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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: titleColor }}>
                    ENTRANCE EXAMINATION SCORING
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
            <div style={{ height: "40px" }}></div>



            <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
                <Table>
                    <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Entrance Examination Score</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: "100%", border: `2px solid ${borderColor}`, p: 2 }}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={2}>
                    {/* Left Side: From and To Date */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* From Date + Print Button */}
                        <Box display="flex" alignItems="flex-end" gap={2}>

                            {/* From Date */}
                            <FormControl size="small" sx={{ width: 200 }}>
                                <InputLabel shrink htmlFor="from-date">From Date</InputLabel>
                                <TextField
                                    id="from-date"
                                    type="date"
                                    size="small"
                                    name="fromDate"
                                    value={person.fromDate || ""}
                                    onChange={(e) => setPerson(prev => ({ ...prev, fromDate: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </FormControl>

                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => {
                                        window.location.href = `${API_BASE_URL}/ecat_scores_template`;
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

                                <InputLabel shrink htmlFor="to-date">To Date</InputLabel>
                                <TextField
                                    id="to-date"
                                    type="date"
                                    size="small"
                                    name="toDate"
                                    value={person.toDate || ""}
                                    onChange={(e) => setPerson(prev => ({ ...prev, toDate: e.target.value }))}
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
                                    onClick={() => document.getElementById("excel-upload").click()}
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

                    {/* Right Side: Campus Dropdown */}
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
                                        setPerson(prev => ({ ...prev, campus: e.target.value }));
                                        setCurrentPage(1);
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

                        </Box>

                        {/* Print ECAT Score */}
                        <div style={{ position: "relative", zIndex: 999 }}>
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
                                    textAlign: "center",
                                    gap: "8px",
                                    userSelect: "none",
                                    width: "200px",
                                    pointerEvents: "auto",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d3d3d3")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                type="button"
                            >
                                <FcPrint size={20} />
                                Print ECAT Score
                            </button>
                        </div>

                    </Box>

                </Box>
            </TableContainer>



            <TableContainer component={Paper} sx={{ width: '100%', }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                        <TableRow>
                            <TableCell colSpan={10} sx={{ border: `2px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
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






            <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, p: 2 }}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={3} columnGap={5}>

                    {/* LEFT COLUMN: Sorting & Status Filters */}
                    <Box display="flex" flexDirection="column" gap={2}>

                        {/* Sort By */}
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "10px" }}>Sort By:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} displayEmpty>
                                    <MenuItem value="">Select Field</MenuItem>
                                    <MenuItem value="name">Applicant's Name</MenuItem>
                                    <MenuItem value="id">Applicant ID</MenuItem>
                                    <MenuItem value="email">Email Address</MenuItem>
                                </Select>
                            </FormControl>
                            <Typography fontSize={13} sx={{ minWidth: "10px" }}>Sort Order:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} displayEmpty>
                                    <MenuItem value="">Select Order</MenuItem>
                                    <MenuItem value="asc">Ascending</MenuItem>
                                    <MenuItem value="desc">Descending</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>



                        <Button
                            variant="contained"
                            color="primary"
                            onClick={saveAllRows}
                            sx={{ width: "300px" }}
                            disabled={saving}
                        >
                            SAVE ALL SCORES
                        </Button>
                    </Box>

                    {/* MIDDLE COLUMN: SY & Semester */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>School Year:</Typography>
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
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Semester:</Typography>
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
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Department:</Typography>
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
                                    <MenuItem value="">All Departments</MenuItem>
                                    {department.map((dep) => (
                                        <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_name}>
                                            {dep.dprtmnt_name} ({dep.dprtmnt_code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>


                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Program:</Typography>
                            <FormControl size="small" sx={{ width: "350px" }}>
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
                    </Box>
                </Box>
            </TableContainer>

            <div ref={divToPrintRef}>

            </div>


            <TableContainer component={Paper} sx={{ width: "100%" }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "2%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                #
                            </TableCell>

                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Applicant ID
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "25%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Name
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Program
                            </TableCell>

                            {/* Exam Columns */}
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                English
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Science
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Filipino
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Math
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Abstract
                            </TableCell>

                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Final Rating
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "5%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Date Applied
                            </TableCell>

                            <TableCell sx={{ color: "white", textAlign: "center", width: "12%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Status
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "12%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentPersons.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={13}
                                    sx={{
                                        textAlign: "center",
                                        border: `2px solid ${borderColor}`,
                                        color: "#777",
                                        py: 3,
                                    }}
                                >
                                    There's no applicant in the record.
                                </TableCell>
                            </TableRow>
                        )}
                        {currentPersons.map((person, index) => {
                            const english = Number(person.english) || 0;
                            const science = Number(person.science) || 0;
                            const filipino = Number(person.filipino) || 0;
                            const math = Number(person.math) || 0;
                            const abstract = Number(person.abstract) || 0;

                            const computedFinalRating =
                                (
                                    (editScores[person.person_id]?.english ?? english) +
                                    (editScores[person.person_id]?.science ?? science) +
                                    (editScores[person.person_id]?.filipino ?? filipino) +
                                    (editScores[person.person_id]?.math ?? math) +
                                    (editScores[person.person_id]?.abstract ?? abstract)
                                ) / 5;
                            return (
                                <TableRow key={person.person_id}>
                                    <TableCell sx={{
                                        color: "black",
                                        textAlign: "center",
                                        border: `2px solid ${borderColor}`,
                                        py: 0.5,
                                        fontSize: "15px",
                                    }}
                                    >{index + 1}</TableCell>

                                    <TableCell
                                        onClick={() => handleRowClick(person.person_id)}
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: `2px solid ${borderColor}`,
                                            py: 0.5,
                                            fontSize: "15px",
                                        }}
                                    >


                                        {person.applicant_number}
                                    </TableCell>

                                    <TableCell
                                        onClick={() => handleRowClick(person.person_id)}
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: `2px solid ${borderColor}`,
                                            py: 0.5,
                                            fontSize: "15px",
                                        }}
                                    >

                                        {`${person.last_name}, ${person.first_name} ${person.middle_name ?? ""}`}
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: `2px solid ${borderColor}`,
                                            py: 0.5,
                                            fontSize: "15px",
                                        }}
                                    >
                                        {curriculumOptions.find(
                                            (item) => item.curriculum_id?.toString() === person.program?.toString()
                                        )?.program_code ?? "N/A"}
                                    </TableCell>

                                    {/* SCORE INPUTS */}
                                    {["english", "science", "filipino", "math", "abstract"].map((field) => (
                                        <TableCell
                                            sx={{
                                                color: "black",
                                                textAlign: "center",
                                                border: `2px solid ${borderColor}`,
                                                py: 0.5,
                                                fontSize: "15px",
                                            }}
                                        >
                                            <TextField
                                                value={editScores[person.person_id]?.[field] ?? person[field] ?? 0}
                                                onChange={(e) => handleScoreChange(person, field, e.target.value)}
                                                size="small"
                                                type="number"
                                                sx={{ width: 70 }}
                                            />
                                        </TableCell>
                                    ))}

                                    {/* FINAL RATING */}
                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: `2px solid ${borderColor}`,
                                            py: 0.5,
                                            fontSize: "15px",
                                        }}
                                    >
                                        {Number(computedFinalRating).toFixed(2)}
                                    </TableCell>

                                    {/* DATE APPLIED */}
                                    <TableCell
                                        sx={{ textAlign: "center", border: `2px solid ${borderColor}`, fontSize: "12px" }}
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
                                    {/* STATUS */}
                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: `2px solid ${borderColor}`,
                                            py: 0.5,
                                            fontSize: "15px",
                                        }}
                                    >
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={editScores[person.person_id]?.status ?? person.status ?? ""}
                                                onChange={(e) => setEditScores(prev => ({
                                                    ...prev,
                                                    [person.person_id]: {
                                                        ...prev[person.person_id],
                                                        status: e.target.value
                                                    }
                                                }))}
                                            >
                                                <MenuItem value=""><em>Select Status</em></MenuItem>
                                                <MenuItem value="PASSED">PASSED</MenuItem>
                                                <MenuItem value="FAILED">FAILED</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </TableCell>

                                    {/* SAVE ROW BUTTON */}
                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: `2px solid ${borderColor}`,
                                            py: 0.5,
                                            fontSize: "15px",
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => saveSingleRow(person)}
                                            disabled={saving}
                                        >
                                            Save
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: '100%', }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                        <TableRow>
                            <TableCell colSpan={10} sx={{ border: `2px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
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


            <Snackbar
                open={snack.open}

                onClose={handleSnackClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>

        </Box >
    );
};

export default ApplicantScoring;

