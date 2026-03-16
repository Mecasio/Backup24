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
    Card,
    TableCell,
    TextField,
    MenuItem,
    InputLabel,
    Checkbox,
    TableBody,
    Dialog,
    DialogTitle,
    DialogContent,
    FormControlLabel,
    DialogActions
} from '@mui/material';
import API_BASE_URL from "../apiConfig";
import { Search } from '@mui/icons-material';
import { io } from "socket.io-client";
import { Snackbar, Alert } from '@mui/material';
import { useNavigate, useLocation } from "react-router-dom";
import NotificationsIcon from '@mui/icons-material/Notifications';
import { FcPrint } from "react-icons/fc";
import EaristLogo from "../assets/EaristLogo.png";
import { Link } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SchoolIcon from '@mui/icons-material/School';        // For Entrance Examination Scores
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SearchIcon from "@mui/icons-material/Search";

const MedicalApplicantList = () => {
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

    const documentOptions = [
        { label: 'PSA Birth Certificate', key: 'BirthCertificate' },
        { label: 'Form 138 (4th Quarter / No failing Grades)', key: 'Form138' },
        { label: 'Certificate of Good Moral Character', key: 'GoodMoralCharacter' },
        { label: 'Certificate Belonging to Graduating Class', key: 'CertificateOfGraduatingClass' },
        { label: 'Copy of Vaccine Card (1st and 2nd Dose)', key: 'VaccineCard' }
    ];


    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const queryPersonId = (queryParams.get("person_id") || "").trim();

    const handleRowClick = (person_id) => {
        if (!person_id) return;

        sessionStorage.setItem("admin_edit_person_id", String(person_id));
        sessionStorage.setItem("admin_edit_person_id_source", "applicant_list");
        sessionStorage.setItem("admin_edit_person_id_ts", String(Date.now()));

        // ✅ Always pass person_id in the URL
        navigate(`/medical_dashboard1?person_id=${person_id}`);
    };

    const tabs1 = [
        { label: "Medical Applicant List", to: "/medical_applicant_list", icon: <ListAltIcon /> },
        { label: "Applicant Form", to: "/medical_dashboard1", icon: <HowToRegIcon /> },
        { label: "Submitted Documents", to: "/medical_requirements", icon: <UploadFileIcon /> }, // updated icon
        { label: "Medical History", to: "/medical_requirements_form", icon: <PersonIcon /> },
        { label: "Dental Assessment", to: "/dental_assessment", icon: <DescriptionIcon /> },
        { label: "Physical and Neurological Examination", to: "/physical_neuro_exam", icon: <SchoolIcon /> },
    ];

    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs1.length).fill(false));


    const handleStepClick = (index, to) => {
        setActiveStep(index);
        const pid = sessionStorage.getItem("admin_edit_person_id");

        if (pid && to !== "/medical_applicant_list") {
            navigate(`${to}?person_id=${pid}`);
        } else {
            navigate(to);
        }
    };


    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const pageId = 24;

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
        if (location.search.includes("person_id")) {
            navigate("/medical_applicant_list", { replace: true });
        }
    }, [location, navigate]);

    const [persons, setPersons] = useState([]);

    const [selectedPerson, setSelectedPerson] = useState(null);
    const [assignedNumber, setAssignedNumber] = useState('');
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [adminData, setAdminData] = useState({ dprtmnt_id: "" });

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




    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
    const [person, setPerson] = useState({
        campus: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        gender: "",
        birthOfDate: "",
        document_status: "",
        extension: "",
        generalAverage1: "",
        program: "",
        created_at: "",
        middle_code: "",
    });

    // ⬇️ Add this inside ApplicantList component, before useEffect
    const fetchApplicants = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/medical-applicants`);
            const data = await res.json();
            setPersons(data);
        } catch (err) {
            console.error("Error fetching applicants:", err);
        }
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // holds which action to confirm
    const [confirmMessage, setConfirmMessage] = useState("");


    const handleSubmittedMedicalChange = async (upload_id, checked) => {
        try {
            const res = await axios.put(
                `${API_BASE_URL}/api/submitted-medical/${upload_id}`,
                {
                    submitted_medical: checked ? 1 : 0,
                    user_person_id: localStorage.getItem("person_id"),
                }
            );

            setSnack({
                open: true,
                message: checked ? "Medical submitted ✅" : "Medical unsubmitted ❌",
                severity: checked ? "success" : "warning",
            });

            fetchApplicants(); // refresh the table
        } catch (err) {
            console.error("❌ Failed to update medical status:", err);
        }
    };





    useEffect(() => {
        // Replace this with your actual API endpoint
        fetch(`${API_BASE_URL}/api/medical-applicants`)
            .then((res) => res.json())
            .then((data) => setPersons(data)) // ✅ Correct

    }, []);

    useEffect(() => {
        socket.current.on("document_status_updated", () => {
            fetch(`${API_BASE_URL}/api/medical-applicants`)
                .then((res) => res.json())
                .then((data) => setPersons(data));
        });
        return () => socket.current.off("document_status_updated");
    }, []);




    const [curriculumOptions, setCurriculumOptions] = useState([]);

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
            const fullText = `${personData.first_name} ${personData.middle_name} ${personData.last_name} ${personData.emailAddress ?? ''} ${personData.applicant_number ?? ''}`.toLowerCase();
            const matchesSearch = fullText.includes(searchQuery.toLowerCase());


            /* 🏫 CAMPUS */
            const matchesCampus =
                !person.campus || personData.campus === person.campus


            // ✅ FIX: use document_status and normalize both sides
            const matchesApplicantStatus =
                selectedApplicantStatus === "" ||
                normalize(personData.document_status) === normalize(selectedApplicantStatus);

            // (keep your registrar filter; shown here with the earlier mapping)

            const programInfo = allCurriculums.find(
                (opt) => opt.curriculum_id?.toString() === personData.program?.toString()
            );

            const matchesProgram =
                selectedProgramFilter === "" ||
                programInfo?.program_code === selectedProgramFilter;

            const matchesDepartment =
                selectedDepartmentFilter === "" ||
                programInfo?.dprtmnt_name === selectedDepartmentFilter;

            const appliedDate = parseDateOnlyLocal(personData.created_at);
            if (!appliedDate) return false;
            const applicantAppliedYear = appliedDate.getFullYear();
            const schoolYear = schoolYears.find((sy) => sy.year_id === selectedSchoolYear);

            const matchesSchoolYear =
                selectedSchoolYear === "" || (schoolYear && (String(applicantAppliedYear) === String(schoolYear.current_year)))

            const matchesSemester =
                selectedSchoolSemester === "" ||
                String(personData.middle_code) === String(selectedSchoolSemester);

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

            const matchesSubmittedDocs =
                !showSubmittedOnly || personData.submitted_documents === 1;


            return (
                matchesSearch &&
                matchesCampus &&
                matchesApplicantStatus &&
                matchesSubmittedDocs &&
                matchesDepartment &&
                matchesProgram &&
                matchesSchoolYear &&
                matchesSemester &&
                matchesDateRange
            );
        })
        .sort((a, b) => {
            let fieldA, fieldB;
            if (sortBy === "name") {
                fieldA = `${a.last_name} ${a.first_name} ${a.middle_name || ''}`.toLowerCase();
                fieldB = `${b.last_name} ${b.first_name} ${b.middle_name || ''}`.toLowerCase();
            } else if (sortBy === "id") {
                fieldA = a.applicant_number || "";
                fieldB = b.applicant_number || "";
            } else if (sortBy === "email") {
                fieldA = a.emailAddress?.toLowerCase() || "";
                fieldB = b.emailAddress?.toLowerCase() || "";
            } else {
                return 0;
            }
            if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
            if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
            return 0;
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
        fetch(`${API_BASE_URL}/api/medical-applicants`) // 👈 This is the new endpoint
            .then((res) => res.json())

            .catch((err) => console.error("Error fetching applicants:", err));
    }, []);

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

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        // Load saved notifications from DB on first load
        axios.get(`${API_BASE_URL}/api/notifications`)
            .then(res => {
                setNotifications(res.data.map(n => ({
                    ...n,
                    timestamp: n.timestamp
                })));
            })
            .catch(err => console.error("Failed to load saved notifications:", err));
    }, []);


    useEffect(() => {
        socket.current.on("notification", (data) => {
            setNotifications((prev) => [data, ...prev]);
        });
        return () => socket.current.disconnect();
    }, []);


    const [openDialog, setOpenDialog] = useState(false);
    const [activePerson, setActivePerson] = useState(null);
    const [selected, setSelected] = useState([]);


    useEffect(() => {
        if (activePerson?.missing_documents) {
            try {
                setSelected(activePerson.missing_documents || []);
            } catch {
                setSelected([]);
            }
        } else {
            setSelected([]);
        }
    }, [activePerson]);

    const handleOpenDialog = (person) => {
        setActivePerson(person);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setActivePerson(null);
        setOpenDialog(false);
    };

    const handleSaveMissingDocs = async () => {
        try {
            await axios.put(
                `${API_BASE_URL}/api/missing-documents/${activePerson.person_id}`,
                {
                    missing_documents: selected,   // this is your array of checked keys

                }
            );

            setSnack({
                open: true,
                message: "Missing documents saved!",
                severity: "success",
            });

            fetchApplicants(); // reload table
            setOpenDialog(false);
        } catch (err) {
            console.error("❌ Error saving missing docs:", err);
            alert("Failed to save missing documents");
        }
    };

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

    useEffect(() => {
        if (department.length > 0 && !selectedDepartmentFilter) {
            const firstDept = department[0].dprtmnt_name;
            setSelectedDepartmentFilter(firstDept);
            handleDepartmentChange(firstDept); // if you also want to trigger it
        }
    }, [department, selectedDepartmentFilter]);

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
        // ✅ Determine dynamic campus address (dropdown or custom)
        let campusAddress = "";
        if (settings?.campus_address && settings.campus_address.trim() !== "") {
            campusAddress = settings.campus_address;
        } else if (settings?.address && settings.address.trim() !== "") {
            campusAddress = settings.address;
        } else {
            campusAddress = "No address set in Settings";
        }

        // ✅ Dynamic logo and company name
        const logoSrc = fetchedLogo || EaristLogo;
        const name = companyName?.trim() || "";

        // ✅ Split company name into two balanced lines
        const words = name.split(" ");
        const middleIndex = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, middleIndex).join(" ");
        const secondLine = words.slice(middleIndex).join(" ");

        // ✅ Generate printable HTML
        const newWin = window.open("", "Print-Window");
        newWin.document.open();
        newWin.document.write(`
       <html>
         <head>
           <title>Medical Student List</title>
           <style>
             @page { size: A4; margin: 10mm; }
             body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
             .print-container {
               display: flex;
               flex-direction: column;
               align-items: center;
               text-align: center;
             }
             .print-header {
               display: flex;
               align-items: center;
               justify-content: center;
               position: relative;
               width: 100%;
             }
             .print-header img {
               width: 120px;
               height: 120px;
               border-radius: 50%;
               object-fit: cover;
             }
   
       /* ✅ Uniform and visible table borders (fix thin right side) */
   table {
     border-collapse: collapse; /* better for print consistency */
     width: 100%;
     margin-top: 20px;
     border: 1.2px solid black; /* slightly thicker for print clarity */
     table-layout: fixed;
   }
   
   th, td {
     border: 1.2px solid black;
     padding: 4px 6px;
     font-size: 12px;
     text-align: center;
     box-sizing: border-box;
   }
   
   th, td {
     word-wrap: break-word;
   }
   
   /* ✅ Ensure rightmost edge doesn’t fade out */
   table tr td:last-child,
   table tr th:last-child {
     border-right: 1.2px solid black !important;
   }
   
   /* ✅ Optional: add slight table padding to prevent cutoff at page edge */
   .print-container {
     padding-right: 10px; /* ensures right border isn’t cut off */
     padding-left: 10px;
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
               <img src="${logoSrc}" alt="School Logo" class="logo" style="width: 18%;"/>
               <div style="width: 64%;">
                 <div>Republic of the Philippines</div>
   
                 <!-- ✅ Dynamic company name -->
                 ${name
                ? `
                       <b style="letter-spacing: 1px; font-size: 20px;">
                         ${firstLine}
                       </b>
                       ${secondLine
                    ? `<div style="letter-spacing: 1px; font-size: 20px;">
                               <b>${secondLine}</b>
                             </div>`
                    : ""
                }
                     `
                : ""
            }
   
                 <!-- ✅ Dynamic campus address -->
                 <div style="font-size: 12px;">${campusAddress}</div>
               </div>
               <div style="min-width: 18%;"></div>
             </div>
           
             <div style="font-size: 24px; letter-spacing: 1px; font-weight: bold;">Medical Student List</div>
   
             <!-- ✅ TABLE -->
             <table>
               <thead>
                 <tr>
                   <th>Student ID</th>
                   <th>Student Name</th>
                   <th>Program</th>
                   <th>SHS GWA</th>
                   <th>Date Applied</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 ${filteredPersons
                .map(
                    (person) => `
                       <tr>
                         <td>${person.applicant_number ?? "N/A"}</td>
                         <td>${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}</td>
                         <td>${curriculumOptions.find(
                        (item) =>
                            item.curriculum_id?.toString() === person.program?.toString()
                    )?.program_code ?? "N/A"
                        }</td>
                         <td>${person.generalAverage1 ?? ""}</td>
                         <td>${new Date(person.created_at).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                        })}</td>
                         <td>${person.submitted_medical === 1
                            ? "On Process"
                            : person.submitted_medical === 0
                                ? "On going"
                                : ""
                        }</td>
                       </tr>
                     `
                )
                .join("")}
               </tbody>
             </table>
           </div>
         </body>
       </html>
     `);
        newWin.document.close();
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
                <Typography variant="h4" fontWeight="bold" sx={{ color: titleColor, }}>
                    MEDICAL RECORDS
                </Typography>


                <Box>

                    <TextField
                        variant="outlined"
                        placeholder="Search Student Name / Email / Student"
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
                {tabs1.map((tab, index) => (
                    <Card
                        key={index}
                        onClick={() => handleStepClick(index, tab.to)}
                        sx={{
                            flex: `1 1 ${100 / tabs1.length}%`, // evenly divide row
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

            <div style={{ height: "20px" }}></div>


            <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
                <Table>
                    <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Application Date</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, p: 2 }}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={2}>

                    {/* Left Side: Campus Dropdown */}
                    <Box display="flex" flexDirection="column" gap={1} sx={{ minWidth: 200 }}>
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

                    {/* Right Side: Print Button + Dates (in one row) */}
                    <Box display="flex" alignItems="flex-end" gap={2}>

                        {/* Print Button */}
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
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#d3d3d3"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
                            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                            type="button"
                        >
                            <FcPrint size={20} />
                            Print Student Medical List
                        </button>

                        {/* To Date */}
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
                                        Total Students: {filteredPersons.length}
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
                                    <MenuItem value="id">Student Number</MenuItem>
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


                        <FormControl size="small" sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                            <Checkbox
                                checked={showSubmittedOnly}
                                onChange={(e) => setShowSubmittedOnly(e.target.checked)}
                                sx={{ color: "maroon", "&.Mui-checked": { color: "maroon" } }}
                            />
                            <Typography fontSize={13}>Show Submitted Only</Typography>
                        </FormControl>
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
                                <InputLabel>School Semester</InputLabel>
                                <Select
                                    label="School Semester"
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
                            <TableCell sx={{ color: "white", textAlign: "center", width: "3%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Submitted Medical Documents
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "4%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Student Number
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "25%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Name
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Program
                            </TableCell>

                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Birth Date
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Gender
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Remarks
                            </TableCell>

                            {/*
                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: `2px solid ${borderColor}` }}>
                                Registrar Status
                            </TableCell>
                            */}
                        </TableRow>
                    </TableHead>
                    {/* --- Confirmation Dialog --- */}
                    <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                        <DialogTitle>Confirm Action</DialogTitle>
                        <DialogContent>
                            {confirmMessage || "Are you sure you want to update this applicant’s status?"}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmOpen(false)} color="error">
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    if (confirmAction) await confirmAction();
                                    setConfirmOpen(false);
                                    fetchApplicants();
                                }}
                                color="success"
                                variant="contained"
                            >
                                Yes, Confirm
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <TableBody>
                        {currentPersons.map((person, index) => (
                            <TableRow key={person.person_id}>
                                {/* # */}
                                <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                    {index + 1}
                                </TableCell>

                                {/* ✅ Submitted Checkbox */}
                                <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                    <Checkbox
                                        checked={Number(person.submitted_medical) === 1}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setConfirmMessage(
                                                `Are you sure you want to mark this applicant’s Medical as ${checked ? "Submitted" : "Unsubmitted"
                                                }?`
                                            );
                                            setConfirmAction(() => async () => {
                                                // 🧠 Optimistic UI update
                                                setPersons((prev) =>
                                                    prev.map((p) =>
                                                        p.person_id === person.person_id
                                                            ? { ...p, submitted_medical: checked ? 1 : 0 }
                                                            : p
                                                    )
                                                );
                                                // 🔥 Call backend
                                                await handleSubmittedMedicalChange(person.upload_id, checked);
                                            });
                                            setConfirmOpen(true);
                                        }}
                                        sx={{
                                            color: "maroon",
                                            "&.Mui-checked": { color: "maroon" },
                                            transform: "scale(1.1)",
                                            p: 0,
                                        }}
                                    />
                                </TableCell>


                                {/* Applicant Number */}
                                <TableCell
                                    sx={{
                                        textAlign: "center",
                                        border: `2px solid ${borderColor}`,
                                        color: "blue",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleRowClick(person.person_id)}
                                >
                                    {person.student_number ?? "N/A"}
                                </TableCell>

                                {/* Applicant Name */}
                                <TableCell
                                    sx={{
                                        textAlign: "left",
                                        border: `2px solid ${borderColor}`,
                                        color: "blue",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleRowClick(person.person_id)}
                                >
                                    {`${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}`}
                                </TableCell>

                                {/* Program */}
                                <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                    {curriculumOptions.find(
                                        (item) =>
                                            item.curriculum_id?.toString() === person.program?.toString()
                                    )?.program_code ?? "N/A"}
                                </TableCell>


                                <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                    {person.birthOfDate}
                                </TableCell>
                                {/* Created Date */}
                                <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                    {person.gender === 0 ? "MALE" : person.gender === 1 ? "FEMALE" : ""}
                                </TableCell>





                                <TableCell
                                    sx={{
                                        border: `2px solid ${borderColor}`,
                                        textAlign: "center",
                                        verticalAlign: "middle",
                                        p: 0,
                                    }}
                                >
                                    {person.submitted_medical === 1 ? (
                                        <Box
                                            sx={{
                                                background: "#4CAF50", // green background
                                                color: "white",
                                                borderRadius: 1,
                                                p: 0.5,
                                                display: "inline-block",
                                                width: "90%", // optional - to make width uniform
                                                mx: "auto",
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: "bold" }}>ON PROCESS</Typography>
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                background: "#F44336", // red background
                                                color: "white",
                                                borderRadius: 1,
                                                p: 0.5,
                                                display: "inline-block",
                                                width: "90%",
                                                mx: "auto",
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: "bold" }}>NO SUBMITTED DOCUMENTS</Typography>
                                        </Box>
                                    )}
                                </TableCell>





                            </TableRow>
                        ))}
                    </TableBody>






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

        </Box>
    );
};

export default MedicalApplicantList;
