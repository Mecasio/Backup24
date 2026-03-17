import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
    Box,
    Typography,
    TextField,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    Container,
    TableBody,
    Card
} from "@mui/material";
import EaristLogo from "../assets/EaristLogo.png";
import "../styles/Print.css";
import API_BASE_URL from "../apiConfig";
import { FcPrint } from "react-icons/fc";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
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
import CampaignIcon from '@mui/icons-material/Campaign';
import ScoreIcon from '@mui/icons-material/Score';

const ExaminationProfile = ({ personId }) => {
    const settings = useContext(SettingsContext);
    const [fetchedLogo, setFetchedLogo] = useState(null);
    const [companyName, setCompanyName] = useState("");



    const [titleColor, setTitleColor] = useState("#000000");
    const [subtitleColor, setSubtitleColor] = useState("#555555");
    const [borderColor, setBorderColor] = useState("#000000");
    const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
    const [subButtonColor, setSubButtonColor] = useState("#ffffff");   // ✅ NEW
    const [stepperColor, setStepperColor] = useState("#000000");       // ✅ NEW


    const [shortTerm, setShortTerm] = useState("");


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


    useEffect(() => {
        if (settings) {
            // ✅ load dynamic logo
            if (settings.logo_url) {
                setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
            } else {
                setFetchedLogo(EaristLogo);
            }

            // ✅ load dynamic name + address
            if (settings.company_name) setCompanyName(settings.company_name);
            if (settings.campus_address) setCampusAddress(settings.campus_address);
        }
    }, [settings]);

    const words = companyName.trim().split(" ");
    const middle = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middle).join(" ");
    const secondLine = words.slice(middle).join(" ");


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

    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(4);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


    const handleStepClick = (index, to) => {
        setActiveStep(index);

        const pid = sessionStorage.getItem("admin_edit_person_id");
        if (pid) {
            navigate(`${to}?person_id=${pid}`);
        } else {
            navigate(to);
        }
    };



    const [searchQuery, setSearchQuery] = useState("");
    const [persons, setPersons] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [person, setPerson] = useState({
        campus: "",
        profile_img: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        extension: "",
        created_at: "",
    });

    const [campusAddress, setCampusAddress] = useState("");

    useEffect(() => {
        if (settings && settings.address) {
            setCampusAddress(settings.address);
        }
    }, [settings]);


    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);


    const pageId = 48;

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





    const [curriculumOptions, setCurriculumOptions] = useState([]);
    const [examSchedule, setExamSchedule] = useState(null);
    const [applicantNumber, setApplicantNumber] = useState("");
    const [scheduledBy, setScheduledBy] = useState(""); // ✅ added
    const divToPrintRef = useRef();

    // ✅ Check logged-in user
    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const storedID = localStorage.getItem("person_id");

        if (storedUser && storedRole && storedID && storedID !== "undefined") {
            setUser(storedUser);
            setUserRole(storedRole);
            setUserID(storedID);

            if (storedRole !== "registrar") {
                window.location.href = "/login";
            }
        } else {
            window.location.href = "/login";
        }
    }, []);

    // ✅ Fetch persons list
    useEffect(() => {
        const fetchPersons = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/upload_documents`);
                setPersons(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching persons:", err);
            }
        };
        fetchPersons();
    }, []);

    // ✅ Fetch single person
    const fetchPersonData = async (id) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/person/${id}`);
            setPerson(res.data); // make sure backend returns the correct format

        } catch (error) {
            console.error("Failed to fetch person:", error);
        }
    };



    // ✅ When a person is selected, fetch data
    useEffect(() => {
        if (selectedPerson?.person_id) {
            fetchPersonData(selectedPerson.person_id);
            if (selectedPerson.applicant_number) {
                setApplicantNumber(selectedPerson.applicant_number);
            }
        }
    }, [selectedPerson]);

    // Add this state at the top level
    const [searchResults, setSearchResults] = useState([]);


    // Replace your existing search useEffect with this
    useEffect(() => {
        const query = searchQuery.trim().toLowerCase();


        if (!query) {
            setSearchResults([]);
            return;
        }


        const results = persons.filter((p) => {
            const fullString = `${p.first_name ?? ''} ${p.middle_name ?? ''} ${p.last_name ?? ''} ${p.emailAddress ?? ''}`.toLowerCase();
            const numberMatch = (p.applicant_number || '').toLowerCase().includes(query);
            const textMatch = fullString.includes(query);
            return numberMatch || textMatch;
        });


        setSearchResults(results);
    }, [searchQuery, persons]);
    // ✅ Fetch curriculum options
    useEffect(() => {
        const fetchCurriculums = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/applied_program`);
                setCurriculumOptions(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error fetching curriculum options:", error);
            }
        };
        fetchCurriculums();
    }, []);

    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        if (selectedPerson?.applicant_number) {
            axios
                .get(`${API_BASE_URL}/api/exam-schedule/${selectedPerson.applicant_number}`)
                .then((res) => {
                    setExamSchedule(res.data);

                    // ✅ If schedule exists and not empty, mark as verified
                    if (res.data && Object.keys(res.data).length > 0) {
                        setIsVerified(true);
                    } else {
                        setIsVerified(false);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching exam schedule:", err);
                    setExamSchedule(null);
                    setIsVerified(false);
                });
        } else {
            setIsVerified(false);
        }
    }, [selectedPerson]);


    // ✅ Fetch registrar name (Scheduled By)
    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/api/scheduled-by/registrar`)
            .then((res) => {
                if (res.data?.fullName) setScheduledBy(res.data.fullName);
            })
            .catch((err) => console.error("Error fetching registrar name:", err));
    }, []);

    const permitRef = useRef();
    const changeCourseRef = useRef();
    const newFormRef = useRef();

    const printDiv = (ref) => {
        const divToPrint = ref.current;
        if (divToPrint) {
            const newWin = window.open('', 'Print-Window');
            newWin.document.open();
            newWin.document.write(`
            <html>
                <head>
                    <title>Print</title>
                    <style>
                        @page {
                            size: Legal;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                        }

                        /* 🔥 THIS IS YOUR MISSING STYLE */
                        .student-table {
                            margin-top: 15px !important;
                        }

                        button {
                            display: none;
                        }
                    </style>
                </head>
                
                <body onload="window.print(); setTimeout(() => window.close(), 200);">
                    <div class="print-container">
                        ${divToPrint.innerHTML}
                    </div>
                </body>
            </html>
        `);
            newWin.document.close();
        } else {
            console.error("❌ Print ref is not set.");
        }
    };

    const [showPrintView, setShowPrintView] = useState(false);

    const handlePrintPermit = async () => {
        await fetchPersonData(selectedPerson.person_id);
        setShowPrintView(true);

        setTimeout(() => {
            printDiv(permitRef);
            setShowPrintView(false);
        }, 200);
    };


    const handlePrintChangeCourse = async () => {
        await fetchPersonData(selectedPerson.person_id);
        setShowPrintView(true);

        setTimeout(() => {
            printDiv(changeCourseRef);
            setShowPrintView(false);
        }, 200);
    };

    const handlePrintNewForm = async () => {
        await fetchPersonData(selectedPerson.person_id); // make sure person data is loaded
        setShowPrintView(true);

        setTimeout(() => {
            printDiv(newFormRef); // <-- pass the new ref
            setShowPrintView(false);
        }, 200);
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


            <div className="section">

                {/* Top header: DOCUMENTS SUBMITTED + Search */}
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
                        EXAMINATION PROFILE
                    </Typography>

                    <TextField
                        variant="outlined"
                        placeholder="Search Applicant Name / Email / Applicant ID"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

                    {
                        searchResults.length > 0 && (
                            <TableContainer component={Paper} sx={{ mt: 2 }}>
                                <Table>

                                    {/* 🔹 HEADER ONLY GETS COLOR */}
                                    <TableHead
                                        sx={{
                                            backgroundColor: settings?.header_color || "#1976d2",
                                            border: `2px solid ${borderColor}`,
                                        }}
                                    >
                                        <TableRow>
                                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Applicant No.</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: "white", fontWeight: "bold" }}
                                            >
                                                Select
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    {/* 🔹 BODY — WHITE BACKGROUND + BLACK BORDERS */}
                                    <TableBody>
                                        {searchResults.map((row, idx) => (
                                            <TableRow
                                                key={idx}
                                                sx={{
                                                    backgroundColor: "#ffffff",
                                                    "& td": {
                                                        border: "1px solid black",
                                                        color: "black",
                                                    },
                                                }}
                                            >
                                                <TableCell>{row.applicant_number}</TableCell>
                                                <TableCell>{`${row.last_name}, ${row.first_name} ${row.middle_name}`}</TableCell>
                                                <TableCell>{row.emailAddress}</TableCell>

                                                {/* 🔹 CENTER THE SELECT BUTTON */}
                                                <TableCell align="center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPerson(row);
                                                            fetchPersonData(row.person_id);
                                                            setSearchResults([]);
                                                        }}
                                                        style={{
                                                            padding: "6px 12px",
                                                            backgroundColor: "#1976d2",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Select
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>

                                </Table>
                            </TableContainer>

                        )
                    }
                </Box>

                <hr style={{ border: "1px solid #ccc", width: "100%" }} />

                <br />



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


                <TableContainer component={Paper} sx={{ width: '100%', }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", border: `2px solid ${borderColor}`, }}>
                            <TableRow>
                                {/* Left cell: Applicant ID */}
                                <TableCell sx={{ color: 'white', fontSize: '20px', fontFamily: 'Arial Black', border: 'none' }}>
                                    Applicant ID:&nbsp;
                                    <span style={{ fontFamily: "Arial", fontWeight: "normal", textDecoration: "underline" }}>
                                        {selectedPerson?.applicant_number || "N/A"}
                                    </span>
                                </TableCell>

                                {/* Right cell: Applicant Name, right-aligned */}
                                <TableCell
                                    align="right"
                                    sx={{ color: 'white', fontSize: '20px', fontFamily: 'Arial Black', border: 'none' }}
                                >
                                    Applicant Name:&nbsp;
                                    <span style={{ fontFamily: "Arial", fontWeight: "normal", textDecoration: "underline" }}>
                                        {selectedPerson?.last_name?.toUpperCase()}, {selectedPerson?.first_name?.toUpperCase()}{" "}
                                        {selectedPerson?.middle_name?.toUpperCase()} {selectedPerson?.extension_name?.toUpperCase() || ""}
                                    </span>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>
                </TableContainer>


                <div style={{ display: "flex", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}>
                    <button
                        onClick={handlePrintPermit}
                        style={{
                            padding: "10px 20px",
                            border: "2px solid black",
                            backgroundColor: "#f0f0f0",
                            color: "black",
                            borderRadius: "5px",
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
                            Print Examination Permit
                        </span>
                    </button>

                    <button
                        onClick={handlePrintChangeCourse}
                        style={{
                            padding: "10px 20px",
                            border: "2px solid black",
                            backgroundColor: "#f0f0f0",
                            color: "black",
                            borderRadius: "5px",
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
                            Print Applicant Change Course Form
                        </span>
                    </button>

                    <button
                        onClick={handlePrintNewForm}
                        style={{
                            padding: "10px 20px",
                            border: "2px solid black",
                            backgroundColor: "#f0f0f0",
                            color: "black",
                            borderRadius: "5px",
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
                            Print New Form
                        </span>
                    </button>
                </div>


                {selectedPerson && (
                    <div ref={permitRef} style={{ position: "relative" }}>
                        {/* ✅ VERIFIED Watermark */}
                        <div
                            style={{
                                position: "absolute",
                                top: "25%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "120px",
                                fontWeight: "900",
                                color: isVerified ? "rgba(0, 128, 0, 0.15)" : "rgba(255, 0, 0, 0.18)",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                                userSelect: "none",
                                zIndex: 0,
                                fontFamily: "'Arial Black', sans-serif",
                                letterSpacing: "0.3rem",
                                textAlign: "center",        // 🔥 needed for stacked NOT + VERIFIED
                                lineHeight: isVerified ? "1" : "0.8", // tighten stacked spacing
                            }}
                        >
                            {isVerified ? (
                                "VERIFIED"
                            ) : (
                                <>
                                    NOT<br />VERIFIED
                                </>
                            )}
                        </div>


                        <div className="section">
                            <table
                                className="student-table"
                                style={{
                                    borderCollapse: "collapse",
                                    fontFamily: "Arial, Helvetica, sans-serif",
                                    width: "8in",
                                    margin: "0 auto", // Center the table inside the form
                                    textAlign: "center",
                                    tableLayout: "fixed",

                                }}
                            >
                                <style>{`
          .certificate-wrapper {
            position: relative;
          }

          .certificate-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 8rem;
            font-weight: 900;
            color: rgba(0, 128, 0, 0.15); /* light green tint */
            text-transform: uppercase;
            white-space: nowrap;
            pointer-events: none;
            user-select: none;
            z-index: 9999;
            font-family: 'Arial Black', sans-serif;
            letter-spacing: 0.3rem;
          }

          @media print {
            .certificate-watermark {
              color: rgba(0, 128, 0, 0.25); /* darker green for printing */
            }
            button {
              display: none;
            }
          }
        `}</style>



                                <tbody>
                                    <tr>
                                        <td colSpan={2} style={{ height: "0.1in", fontSize: "72.5%" }}>
                                            <b>

                                            </b>
                                        </td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                        <td colSpan={1} style={{ height: "0.1in", fontSize: "72.5%" }}></td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} style={{ height: "0.1in", fontSize: "62.5%" }}>

                                        </td>
                                    </tr>
                                    <tr>

                                        <td colSpan={40} style={{ height: "0.5in", textAlign: "center" }}>
                                            {/* Header */}
                                            <table width="100%" style={{ borderCollapse: "collapse", marginTop: "15px", fontFamily: "Arial" }}>
                                                <tbody>
                                                    <tr>


                                                        <td style={{ width: "20%", textAlign: "center" }}>
                                                            <img
                                                                src={fetchedLogo}
                                                                alt="School Logo"
                                                                style={{
                                                                    marginLeft: "-10px",
                                                                    width: "120px",
                                                                    height: "120px",
                                                                    borderRadius: "50%", // ✅ perfectly circular
                                                                    objectFit: "cover",

                                                                }}
                                                            />
                                                        </td>

                                                        {/* Center Column - School Information */}
                                                        <td style={{
                                                            width: "60%", textAlign: "center", lineHeight: "1", letterSpacing: "1px",
                                                            fontSize: "20px",
                                                            fontFamily: "Times new roman",
                                                            fontWeight: "bold"
                                                        }}>
                                                            <div style={{ fontSize: "14px", fontWeight: "normal", fontFamily: "Arial" }}>Republic of the Philippines</div>
                                                            <div
                                                                style={{
                                                                    letterSpacing: "1px",
                                                                    fontSize: "20px",
                                                                    fontFamily: "Times new roman",
                                                                    fontWeight: "bold"
                                                                }}
                                                            >
                                                                {firstLine}
                                                            </div>
                                                            {secondLine && (
                                                                <div
                                                                    style={{
                                                                        letterSpacing: "1px",
                                                                        fontSize: "20px",
                                                                        fontFamily: "Times new roman",
                                                                        fontWeight: "bold"
                                                                    }}
                                                                >
                                                                    <b>{secondLine}</b>
                                                                </div>
                                                            )}
                                                            {campusAddress && (
                                                                <div style={{ fontSize: "14px", fontWeight: "normal", letterSpacing: "1px", fontFamily: "Arial" }}>
                                                                    {campusAddress}
                                                                </div>
                                                            )}

                                                            {/* Add spacing here */}
                                                            <div style={{ marginTop: "30px" }}>
                                                                <b style={{ fontSize: "24px", letterSpacing: '1px', fontWeight: "bold" }}>
                                                                    EXAMINATION PERMIT
                                                                </b>
                                                            </div>
                                                        </td>

                                                        <td
                                                            colSpan={4}
                                                            rowSpan={6}
                                                            style={{
                                                                textAlign: "center",
                                                                position: "relative",
                                                                width: "4.5cm",
                                                                height: "4.5cm",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: "4.70cm",
                                                                    height: "4.70cm",
                                                                    marginRight: "10px",
                                                                    display: "flex",
                                                                    justifyContent: "center",
                                                                    alignItems: "center",
                                                                    position: "relative",
                                                                    border: "2px solid black",
                                                                    overflow: "hidden",
                                                                    borderRadius: "4px",
                                                                }}
                                                            >
                                                                {person.profile_img ? (
                                                                    <img
                                                                        src={`${API_BASE_URL}/uploads/Applicant1by1/${person.profile_img}`}
                                                                        alt="Profile"
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "100%",
                                                                            objectFit: "cover",

                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span style={{ fontSize: "12px", color: "#888" }}>No Image</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>

                                    </tr>


                                </tbody>
                            </table>
                            <div style={{ height: "30px" }}></div>
                            <table
                                className="student-table"
                                style={{
                                    borderCollapse: "collapse",
                                    fontFamily: "Arial, Helvetica, sans-serif",
                                    width: "8in",
                                    margin: "0 auto",


                                    textAlign: "center",
                                    tableLayout: "fixed",
                                }}
                            >

                                <tbody>
                                    <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                                        <td colSpan={40}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "flex-end",
                                                    width: "100%",
                                                    gap: "10px",
                                                }}
                                            >
                                                <label style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                                                    Applicant No.:
                                                </label>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        fontFamily: "Arial",
                                                        fontWeight: "normal",
                                                        fontSize: "15px",
                                                        minWidth: "278px",
                                                        height: "1.2em",
                                                        display: "flex",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    {selectedPerson?.applicant_number}
                                                </div>
                                            </div>
                                        </td>


                                    </tr>

                                    {/* Email & Applicant ID */}
                                    <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                                        <td colSpan={20}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "flex-start",
                                                    width: "100%",
                                                    gap: "10px",
                                                }}
                                            >
                                                <label style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                                                    Name:
                                                </label>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        fontFamily: "Arial",
                                                        fontWeight: "normal",
                                                        fontSize: "15px",
                                                        minWidth: "328px",
                                                        height: "1.2em",
                                                        display: "flex",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    {selectedPerson?.last_name?.toUpperCase()}, {selectedPerson?.first_name?.toUpperCase()}{" "}
                                                    {selectedPerson?.middle_name?.toUpperCase() || ""}{" "}
                                                    {selectedPerson?.extension?.toUpperCase() || ""}
                                                </div>
                                            </div>
                                        </td>


                                        <td colSpan={20}>
                                            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                                <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Permit No.:</label>
                                                <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em", textAlign: "left", fontFamily: "Arial" }}>{selectedPerson?.applicant_number}</span>
                                            </div>
                                        </td>
                                    </tr>

                                    <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                                        <td colSpan={20}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    width: "100%",
                                                    gap: "10px",
                                                }}
                                            >
                                                <label style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                                                    Course Applied:
                                                </label>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        fontFamily: "Arial",
                                                        fontWeight: "normal",
                                                        fontSize: "15px",
                                                        minWidth: "265px",
                                                        width: "100%", // make it extend to available space
                                                        display: "flex",
                                                        alignItems: "center",
                                                        paddingRight: "5px",
                                                        overflowWrap: "break-word", // allows long course names to wrap
                                                    }}
                                                >
                                                    {curriculumOptions.length > 0
                                                        ? curriculumOptions.find(
                                                            (item) =>
                                                                item?.curriculum_id?.toString() === (person?.program ?? "").toString()
                                                        )?.program_description || (person?.program ?? "")
                                                        : "Loading..."}
                                                </div>
                                            </div>
                                        </td>

                                        <td colSpan={20}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    width: "100%",
                                                    gap: "10px",
                                                }}
                                            >
                                                <label style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>Major:</label>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        fontFamily: "Arial",
                                                        fontWeight: "normal",
                                                        fontSize: "15px",
                                                        width: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        paddingRight: "5px",
                                                        overflowWrap: "break-word", // allows long major names to wrap
                                                    }}
                                                >
                                                    {curriculumOptions.length > 0
                                                        ? curriculumOptions.find(
                                                            (item) =>
                                                                item?.curriculum_id?.toString() === (person?.program ?? "").toString()
                                                        )?.major || ""
                                                        : "Loading..."}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>


                                    <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                                        <td colSpan={20}>
                                            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                                <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Date of Exam:</label>
                                                <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em", fontFamily: "Arial", textAlign: "left" }}>
                                                    {examSchedule?.date_of_exam}
                                                </span>
                                            </div>
                                        </td>
                                        <td colSpan={20}>
                                            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                                <label
                                                    style={{
                                                        fontWeight: "bold",
                                                        whiteSpace: "nowrap",
                                                        marginRight: "10px",
                                                    }}
                                                >
                                                    Time :
                                                </label>
                                                <span
                                                    style={{
                                                        flexGrow: 1,
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                        fontFamily: "Arial",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    {examSchedule
                                                        ? new Date(`1970-01-01T${examSchedule.start_time}`).toLocaleTimeString(
                                                            "en-US",
                                                            { hour: "numeric", minute: "2-digit", hour12: true }
                                                        )
                                                        : ""}
                                                </span>
                                            </div>
                                        </td>

                                    </tr>

                                    <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                                        <td colSpan={20}>
                                            <div style={{ display: "flex", alignItems: "center", width: "100%", marginTop: "-85px" }}>
                                                <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>
                                                    Bldg. :
                                                </label>
                                                <span
                                                    style={{
                                                        flexGrow: 1,
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                        fontFamily: "Arial",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    {examSchedule?.building_description || ""}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Room No. + QR side by side */}
                                        <td colSpan={20}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    width: "100%",
                                                    justifyContent: "space-between", // space text & QR
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", marginTop: "-130px" }}>
                                                    <label style={{ fontWeight: "bold", marginRight: "10px", width: "80px" }}>
                                                        Room No.:
                                                    </label>
                                                    <span
                                                        style={{
                                                            flexGrow: 1,
                                                            borderBottom: "1px solid black",
                                                            fontFamily: "Arial",
                                                            width: "150px",
                                                        }}
                                                    >
                                                        {examSchedule?.room_description || ""}
                                                    </span>
                                                </div>

                                                {selectedPerson?.applicant_number && (
                                                    <div
                                                        style={{
                                                            width: "4.5cm",
                                                            height: "4.5cm",
                                                            borderRadius: "4px",
                                                            background: "#fff",
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            position: "relative",
                                                            overflow: "hidden",
                                                            marginLeft: "10px"
                                                        }}
                                                    >
                                                        <QRCodeSVG
                                                            value={`${window.location.origin}/applicant_profile/${person.applicant_number}`}
                                                            size={150}
                                                            level="H"
                                                        />

                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                fontSize: "12px",
                                                                fontWeight: "bold",
                                                                color: "maroon",
                                                                background: "white",
                                                                padding: "2px 4px",
                                                                borderRadius: "2px",
                                                            }}
                                                        >
                                                            {selectedPerson.applicant_number}
                                                        </div>
                                                    </div>
                                                )}


                                            </div>
                                        </td>
                                    </tr>



                                    <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                                        <td colSpan={20}>
                                            <div style={{ display: "flex", alignItems: "center", width: "100%", marginTop: "-148px" }}>
                                                <label
                                                    style={{
                                                        fontWeight: "bold",
                                                        whiteSpace: "nowrap",
                                                        marginRight: "10px",
                                                    }}
                                                >
                                                    Date:
                                                </label>
                                                <span
                                                    style={{
                                                        flexGrow: 1,
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                        fontFamily: "Arial",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    {examSchedule?.schedule_created_at
                                                        ? new Date(examSchedule.schedule_created_at).toLocaleDateString("en-US", {
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })
                                                        : ""}
                                                </span>
                                            </div>
                                        </td>

                                    </tr>

                                    <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                                        <td colSpan={20}>
                                            <div style={{ display: "flex", alignItems: "center", width: "100%", marginTop: "-128px" }}>
                                                <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Scheduled by:</label>
                                                <span
                                                    style={{
                                                        flexGrow: 1,
                                                        borderBottom: "1px solid black",
                                                        fontFamily: "Arial",
                                                    }}
                                                >
                                                    {scheduledBy || "N/A"}
                                                </span>

                                            </div>
                                        </td>
                                    </tr>

                                </tbody>
                            </table>



                            <table
                                className="student-table"
                                style={{

                                    borderCollapse: "collapse",
                                    fontFamily: "Arial, Helvetica, sans-serif",
                                    width: "8in",
                                    margin: "0 auto", // Center the table inside the form
                                    textAlign: "center",
                                    tableLayout: "fixed",
                                    border: "1px solid black"
                                }}
                            >
                                <tbody>


                                    <tr>
                                        <td
                                            colSpan={40}
                                            style={{
                                                color: "black",
                                                padding: "12px",
                                                lineHeight: "1.6",
                                                textAlign: "left",
                                                fontSize: "14px",
                                                fontFamily: "Arial, Helvetica, sans-serif",
                                            }}
                                        >
                                            <strong>IMPORTANT REMINDERS FOR APPLICANTS:</strong>

                                            <ul style={{ marginTop: "8px" }}>
                                                <strong>Step 1:</strong> Check your Examination Date, Time, and Room Number indicated on your permit.
                                                <br />


                                                <strong>Step 2:</strong> Bring all required items on the exam day:
                                                <ul>
                                                    <li>Official Examination Permit with VERIFIED watermark on it</li>
                                                    <li>No. 2 Pencil (any brand)</li>
                                                    <li>2 Short bond papers</li>
                                                </ul>



                                                <strong>Step 3:</strong> Wear the proper attire:
                                                <ul>
                                                    <li>Plain white T-shirt or plain white polo shirt <strong>(no prints, no logos, no designs)</strong></li>
                                                    <li>Pants (No shorts, No ripped jeans are not Allowed)</li>
                                                    <li>Closed shoes (no crocs, sandals, slippers)</li>
                                                </ul>


                                                <strong>Step 4:</strong>Keep the two paper sheets attached to your exam permit. You will need them for the document check and enrollment process.
                                                <br />
                                                <strong>Step 5:</strong>Please Arrive at least 1 hour before your examination time. Late applicants will NOT be allowed to enter once the exam room door closes.
                                                <br />
                                                <br />
                                                <div style={{ textAlign: "center", marginLeft: "-50px" }}><strong>GOODLUCK FUTURE EARISTIANS!</strong></div>
                                            </ul>
                                        </td>
                                    </tr>

                                </tbody>
                            </table>

                        </div>
                    </div>
                )}
            </div>
            <div style={{ height: "30px" }}></div>
            {selectedPerson && (
                <div ref={changeCourseRef} style={{ position: "relative" }}>
                    <Container>
                        {/* ✅ VERIFIED Watermark */}
                        <div
                            style={{
                                position: "absolute",
                                top: "22%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "120px",
                                fontWeight: "900",
                                color: isVerified ? "rgba(0, 128, 0, 0.15)" : "rgba(255, 0, 0, 0.18)",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                textAlign: "center",     // needed for stacked "NOT / VERIFIED"
                                pointerEvents: "none",
                                userSelect: "none",
                                zIndex: 0,
                                fontFamily: "'Arial Black', sans-serif",
                                letterSpacing: "0.3rem",
                                lineHeight: isVerified ? "1" : "0.8",   // tighter spacing for stacked text
                            }}
                        >
                            {isVerified ? (
                                "VERIFIED"
                            ) : (
                                <>
                                    NOT<br />VERIFIED
                                </>
                            )}
                        </div>

                        <div
                            className="student-table"
                            style={{
                                width: "8in", // matches table width assuming 8in for 40 columns
                                maxWidth: "100%",
                                margin: "0 auto",
                                marginTop: "-10px",

                                boxSizing: "border-box",
                                padding: "10px 0",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between", // spread logo, text, profile+QR
                                    flexWrap: "nowrap",
                                }}
                            >
                                {/* Logo (Left Side) */}
                                <div style={{ flexShrink: 0 }}>
                                    <img
                                        src={fetchedLogo}
                                        alt="School Logo"
                                        style={{
                                            width: "120px",
                                            height: "120px",
                                            objectFit: "cover",
                                            marginLeft: "10px",
                                            marginTop: "-25px",
                                            borderRadius: "50%", // ✅ Makes it perfectly circular

                                        }}
                                    />
                                </div>

                                {/* Text Block (Center) */}
                                <div
                                    style={{
                                        flexGrow: 1,
                                        textAlign: "center",
                                        fontSize: "14px",
                                        fontFamily: "Arial",
                                        letterSpacing: "5",
                                        lineHeight: 1.4,
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                    }}
                                >
                                    <div style={{ fontSize: "14px", fontWeight: "normal", fontFamily: "Arial" }}>Republic of the Philippines</div>
                                    <div
                                        style={{
                                            letterSpacing: "1px",
                                            fontSize: "20px",
                                            fontFamily: "Times new roman",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        {firstLine}
                                    </div>
                                    {secondLine && (
                                        <div
                                            style={{
                                                letterSpacing: "1px",
                                                fontSize: "20px",
                                                fontFamily: "Times new roman",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            <b>{secondLine}</b>
                                        </div>
                                    )}
                                    {campusAddress && (
                                        <div style={{ fontSize: "14px", fontWeight: "normal", letterSpacing: "1px", fontFamily: "Arial" }}>
                                            {campusAddress}
                                        </div>
                                    )}

                                    <div
                                        style={{ fontFamily: "Arial", letterSpacing: "1px" }}
                                    >
                                        <b>OFFICE OF THE ADMISSION SERVICES</b>
                                    </div>

                                    <br />

                                    <div
                                        style={{
                                            fontSize: "21px",
                                            fontFamily: "Arial",
                                            fontWeight: "bold",
                                            marginBottom: "5px",
                                            marginTop: "0",
                                            textAlign: "center",
                                        }}
                                    >
                                        Applicant's Change Course Form
                                    </div>
                                </div>

                                {/* Profile + QR Code (Right Side) */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",   // ✅ side by side
                                        alignItems: "center",
                                        marginRight: "10px",
                                        gap: "10px",            // ✅ 10px space between them
                                    }}
                                >
                                    {/* Profile Image (2x2) */}
                                    <div
                                        style={{
                                            width: "1.3in",
                                            height: "1.3in",
                                            border: "1px solid black",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                            marginTop: "-15px"
                                        }}
                                    >
                                        {person?.profile_img ? (
                                            <img
                                                src={`${API_BASE_URL}/uploads/Applicant1by1/${person.profile_img}`}
                                                alt="Profile"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",

                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: "12px", color: "#888" }}>No Image</span>
                                        )}
                                    </div>



                                </div>

                            </div>
                        </div>
                        <br />
                        <br />
                        <table

                            style={{
                                borderCollapse: "collapse",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                width: "8in",
                                margin: "0 auto",

                                marginTop: "-30px",
                                textAlign: "center",
                                tableLayout: "fixed",
                            }}
                        >

                            <tbody>
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end", // keep the whole block at the right
                                                alignItems: "center",
                                                width: "100%",
                                            }}
                                        >
                                            <label
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    marginRight: "10px",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                Applicant Id No.:
                                            </label>

                                            <div
                                                style={{
                                                    width: "200px", // fixed width for the underline
                                                    borderBottom: "1px solid black",
                                                    display: "flex",
                                                    justifyContent: "center", // center the content horizontally
                                                    alignItems: "center",       // center the content vertically
                                                    fontSize: "14px",
                                                    height: "1.3em",
                                                }}
                                            >
                                                {person.applicant_number}
                                            </div>
                                        </div>
                                    </td>

                                </tr>

                                <tr>
                                    <td
                                        colSpan={40}
                                        style={{

                                            fontSize: "13px",
                                            paddingTop: "5px",
                                            marginTop: 0,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <span
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    marginRight: "10px",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                Name of Student:
                                            </span>
                                            <div style={{ flexGrow: 1, display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>
                                                    {person.last_name}
                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>
                                                    {person.first_name}
                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>
                                                    {person.middle_name}
                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>
                                                    {person.extension}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* Labels Row */}
                                <tr>
                                    <td
                                        colSpan={40}
                                        style={{

                                            fontSize: "12px",
                                            paddingTop: "2px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginLeft: "-30px",

                                            }}
                                        >
                                            <span style={{ width: "20%", textAlign: "center" }}>(Pls. PRINT)</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Last Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Given Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Middle Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Ext. Name</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Email & Applicant ID */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={20}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px", fontSize: "14px" }}>Date Applied</label>
                                            <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.3em", fontSize: "14px" }}> {(() => {
                                                if (!person.created_at.split("T")[0]) return "";

                                                const date = new Date(person.created_at.split("T")[0]);

                                                if (isNaN(date)) return person.created_at.split("T")[0];

                                                return date.toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                });
                                            })()}
                                                <div style={{ marginTop: "-3px" }} className="dataField"></div>
                                            </span>
                                        </div>
                                    </td>
                                    <td colSpan={20}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px", fontSize: "14px" }}>Date Examination:</label>
                                            <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.3em", fontSize: "14px" }}>    {examSchedule?.schedule_created_at
                                                ? new Date(examSchedule.schedule_created_at).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : ""}
                                                <div style={{ marginTop: "-3px" }} className="dataField"></div>
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Email & Applicant ID */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%", marginTop: "10px" }}>
                                            <label
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    fontSize: "14px",
                                                    marginRight: "10px",
                                                }}
                                            >
                                                ECAT Examination Result/Score:
                                            </label>

                                            {/* 25px inline block space */}
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "100px",
                                                    height: "1px",
                                                    marginRight: "15px",
                                                    borderBottom: "1px solid black",
                                                }}
                                            ></span>

                                            {/* PASSED checkbox */}
                                            <div style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Passed</span>
                                            </div>

                                            {/* FAILED checkbox */}
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Failed</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    {/* LEFT HALF */}
                                    <td colSpan={19} style={{ padding: 0 }}>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: "bold",
                                                display: "block",
                                                marginBottom: "2px",
                                                textAlign: "left",
                                            }}
                                        >
                                            FROM DEGREE/PROGRAM APPLIED
                                        </span>

                                        <div
                                            style={{
                                                border: "1px solid black",
                                                width: "100%",
                                                height: "25px",
                                                lineHeight: "25px",  // keeps text vertically centered
                                                fontSize: "12px",
                                            }}
                                        >
                                            {curriculumOptions.length > 0
                                                ? `${curriculumOptions.find(
                                                    (item) => item?.curriculum_id?.toString() === (person?.program ?? "").toString()
                                                )?.program_description || person?.program || ""} ${curriculumOptions.find(
                                                    (c) => c.curriculum_id?.toString() === (person?.program ?? "").toString()
                                                )?.major || ""
                                                }`
                                                : "Loading..."}
                                        </div>

                                    </td>

                                    {/* CENTER GAP */}
                                    <td colSpan={2}></td>

                                    {/* RIGHT HALF */}
                                    <td colSpan={19} style={{ padding: 0 }}>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                display: "block",
                                                textAlign: "left",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            Change to <b>NEW DEGREE/PROGRAM</b>
                                        </span>

                                        <div
                                            style={{
                                                border: "1px solid black",
                                                width: "100%",
                                                height: "25px",
                                                lineHeight: "25px",  // 🔥 same height & alignment as left
                                                fontSize: "12px",
                                            }}
                                        ></div>
                                    </td>
                                </tr>



                                {/* Reason for Change + Applicant's Signature (matches image placement) */}
                                <tr style={{ fontSize: "13px", }}>
                                    <td colSpan={40} style={{ padding: 0 }}>
                                        <div
                                            style={{
                                                position: "relative",
                                                width: "100%",
                                                paddingTop: "6px",
                                                marginTop: "10px",
                                                paddingBottom: "6px",
                                                boxSizing: "border-box",

                                            }}
                                        >
                                            {/* Label + underline */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: "700",
                                                        whiteSpace: "nowrap",

                                                        marginRight: "6px",
                                                        fontSize: "14px"
                                                    }}
                                                >
                                                    Reason's for Change:
                                                </span>

                                                {/* Underline that fills until signature block */}
                                                <div
                                                    style={{
                                                        flexGrow: 1,
                                                        borderBottom: "1px solid #000",
                                                        height: "1.15em",
                                                        marginTop: "-4px",
                                                        marginRight: "260px", // space for signature block
                                                    }}
                                                ></div>
                                            </div>

                                            {/* Signature block on the right */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: "6px",
                                                    top: "6.50px",
                                                    width: "240px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        borderBottom: "1px solid #000",
                                                        height: "1.15em",
                                                        marginBottom: "-3px",
                                                    }}
                                                ></div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        whiteSpace: "nowrap",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Applicant's Signature
                                                </div>
                                            </div>

                                            {/* NEW LINE — 60% width (AFTER signature) */}
                                            <div
                                                style={{
                                                    marginTop: "12px",
                                                    width: "64.5%",
                                                    borderBottom: "1px solid #000",
                                                    height: "1.1em",
                                                    marginLeft: "6px", // aligns with other left content
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>

                                {/* College Approval from Current Program Applied */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{

                                                fontWeight: "bold",
                                                textAlign: "left",
                                                fontSize: "14px"
                                            }}
                                        >
                                            College Approval from current program applied:
                                        </div>
                                    </td>
                                </tr>
                                {/* College Code / Program Head / College Dean */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                marginTop: "5px",
                                            }}
                                        >
                                            {/* College Code */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Code</div>
                                            </div>

                                            {/* Program Head */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>Program Head</div>
                                            </div>

                                            {/* College Dean */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Dean</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{

                                                fontWeight: "bold",
                                                textAlign: "left",
                                                fontSize: "14px"
                                            }}
                                        >
                                            College Acceptance to new program applied:
                                        </div>
                                    </td>
                                </tr>

                                {/* College Code / Program Head / College Dean (Approval Row) */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                marginTop: "5px",
                                            }}
                                        >
                                            {/* College Code */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Code</div>
                                            </div>

                                            {/* Program Head */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>Program Head</div>
                                            </div>

                                            {/* College Dean */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Dean</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>



                                {/* Accepted / Not Accepted / Others */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end", // aligns everything to the right
                                                alignItems: "center",
                                                gap: "20px",
                                                marginTop: "10px",
                                            }}
                                        >
                                            {/* Accepted */}
                                            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                Accepted
                                            </label>

                                            {/* Not Accepted */}
                                            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                Not Accepted
                                            </label>

                                            {/* Other/s + Line beside it */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                    <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                    Other/s:
                                                </label>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        width: "250px",
                                                        height: "1px",
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>



                            </tbody>

                        </table>
                    </Container>
                    <div

                        style={{
                            width: "8in", // matches table width assuming 8in for 40 columns
                            maxWidth: "100%",
                            margin: "0 auto",
                            boxSizing: "border-box",
                            padding: "10px 0",

                        }}
                    >
                        {/* Top solid line */}
                        <hr
                            style={{
                                width: "100%",
                                maxWidth: "100%",
                                borderTop: "1px solid black",
                                marginTop: "-5px",
                            }}
                        />

                        {/* College Dean's Copy aligned right */}
                        <div
                            style={{
                                width: "100%",
                                textAlign: "right", // aligns to the right side
                                fontWeight: "normal",
                                fontSize: "14px",
                                color: "black",
                                marginBottom: "0",
                                marginTop: "10px"
                            }}
                        >
                            College Dean's Copy
                        </div>

                        {/* Bottom dashed line */}
                        <hr
                            style={{
                                width: "100%",

                                border: "none",
                                borderTop: "1px dashed black",
                                margin: "10px auto",
                            }}
                        />
                    </div>


                    <Container>
                        <div
                            style={{
                                position: "absolute",
                                top: "70%",   // lower half
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "120px",
                                fontWeight: "900",
                                color: isVerified ? "rgba(0, 128, 0, 0.15)" : "rgba(255, 0, 0, 0.18)",
                                textTransform: "uppercase",
                                textAlign: "center",  // required for triangle stacking
                                pointerEvents: "none",
                                userSelect: "none",
                                zIndex: 0,
                                fontFamily: "'Arial Black', sans-serif",
                                letterSpacing: "0.3rem",
                                lineHeight: isVerified ? "1" : "0.8", // tighten text when stacked
                                whiteSpace: "nowrap",
                            }}
                        >
                            {isVerified ? (
                                "VERIFIED"
                            ) : (
                                <>
                                    NOT<br />VERIFIED
                                </>
                            )}
                        </div>

                        <div

                            style={{
                                width: "8in", // matches table width assuming 8in for 40 columns
                                maxWidth: "100%",
                                margin: "0 auto",
                                marginTop: "-10px",

                                boxSizing: "border-box",
                                padding: "10px 0",
                            }}
                        >

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between", // spread logo, text, profile+QR
                                    flexWrap: "nowrap",

                                }}
                            >
                                {/* Logo (Left Side) */}
                                <div style={{ flexShrink: 0 }}>
                                    <img
                                        src={fetchedLogo}
                                        alt="School Logo"
                                        style={{
                                            width: "120px",
                                            height: "120px",
                                            objectFit: "cover",
                                            marginLeft: "10px",
                                            marginTop: "-25px",
                                            borderRadius: "50%", // ✅ Makes it perfectly circular

                                        }}
                                    />
                                </div>

                                {/* Text Block (Center) */}
                                <div
                                    style={{
                                        flexGrow: 1,
                                        textAlign: "center",
                                        fontSize: "14px",
                                        fontFamily: "Arial",
                                        letterSpacing: "5",
                                        lineHeight: 1.4,
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                    }}
                                >
                                    <div style={{ fontSize: "14px", fontWeight: "normal", fontFamily: "Arial" }}>Republic of the Philippines</div>
                                    <div
                                        style={{
                                            letterSpacing: "1px",
                                            fontSize: "20px",
                                            fontFamily: "Times new roman",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        {firstLine}
                                    </div>
                                    {secondLine && (
                                        <div
                                            style={{
                                                letterSpacing: "1px",
                                                fontSize: "20px",
                                                fontFamily: "Times new roman",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            <b>{secondLine}</b>
                                        </div>
                                    )}
                                    {campusAddress && (
                                        <div style={{ fontSize: "14px", fontWeight: "normal", letterSpacing: "1px", fontFamily: "Arial" }}>
                                            {campusAddress}
                                        </div>
                                    )}
                                    <div
                                        style={{ fontFamily: "Arial", letterSpacing: "1px" }}
                                    >
                                        <b>OFFICE OF THE ADMISSION SERVICES</b>
                                    </div>

                                    <br />

                                    <div
                                        style={{
                                            fontSize: "21px",
                                            fontFamily: "Arial",
                                            fontWeight: "bold",
                                            marginBottom: "5px",
                                            marginTop: "0",
                                            textAlign: "center",
                                        }}
                                    >
                                        Applicant's Change Course Form
                                    </div>
                                </div>

                                {/* Profile + QR Code (Right Side) */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",   // ✅ side by side
                                        alignItems: "center",
                                        marginRight: "10px",
                                        gap: "10px",            // ✅ 10px space between them
                                    }}
                                >
                                    {/* Profile Image (2x2) */}
                                    <div
                                        style={{
                                            width: "1.3in",
                                            height: "1.3in",
                                            border: "1px solid black",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                            marginTop: "-15px"
                                        }}
                                    >
                                        {person?.profile_img ? (
                                            <img
                                                src={`${API_BASE_URL}/uploads/Applicant1by1/${person.profile_img}`}
                                                alt="Profile"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",

                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: "12px", color: "#888" }}>No Image</span>
                                        )}
                                    </div>



                                </div>

                            </div>
                        </div>


                        <br />
                        <br />
                        <table

                            style={{
                                borderCollapse: "collapse",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                width: "8in",
                                margin: "0 auto",
                                marginTop: "-20px",


                                textAlign: "center",
                                tableLayout: "fixed",
                            }}
                        >

                            <tbody>
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end", // keep the whole block at the right
                                                alignItems: "center",
                                                width: "100%",
                                            }}
                                        >
                                            <label
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    marginRight: "10px",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                Applicant Id No.:
                                            </label>

                                            <div
                                                style={{
                                                    width: "200px", // fixed width for the underline
                                                    borderBottom: "1px solid black",
                                                    display: "flex",
                                                    justifyContent: "center", // center the content horizontally
                                                    alignItems: "center",       // center the content vertically
                                                    fontSize: "14px",
                                                    height: "1.3em",
                                                }}
                                            >
                                                {person.applicant_number}
                                            </div>
                                        </div>
                                    </td>

                                </tr>

                                <tr>
                                    <td
                                        colSpan={40}
                                        style={{

                                            fontSize: "13px",
                                            paddingTop: "5px",
                                            marginTop: 0,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <span
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    marginRight: "10px",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                Name of Student:
                                            </span>
                                            <div style={{ flexGrow: 1, display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>
                                                    {person.last_name}
                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>
                                                    {person.first_name}
                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>
                                                    {person.middle_name}
                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>
                                                    {person.extension}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* Labels Row */}
                                <tr>
                                    <td
                                        colSpan={40}
                                        style={{

                                            fontSize: "12px",
                                            paddingTop: "2px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginLeft: "-30px",

                                            }}
                                        >
                                            <span style={{ width: "20%", textAlign: "center" }}>(Pls. PRINT)</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Last Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Given Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Middle Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Ext. Name</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Email & Applicant ID */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={20}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px", fontSize: "14px" }}>Date Applied</label>
                                            <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.3em", fontSize: "14px" }}> {(() => {
                                                if (!person.created_at.split("T")[0]) return "";

                                                const date = new Date(person.created_at.split("T")[0]);

                                                if (isNaN(date)) return person.created_at.split("T")[0];

                                                return date.toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                });
                                            })()}
                                                <div style={{ marginTop: "-3px" }} className="dataField"></div>
                                            </span>
                                        </div>
                                    </td>
                                    <td colSpan={20}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px", fontSize: "14px" }}>Date Examination:</label>
                                            <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.3em", fontSize: "14px" }}>    {examSchedule?.schedule_created_at
                                                ? new Date(examSchedule.schedule_created_at).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : ""}
                                                <div style={{ marginTop: "-3px" }} className="dataField"></div>
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Email & Applicant ID */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%", marginTop: "10px" }}>
                                            <label
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    fontSize: "14px",
                                                    marginRight: "10px",
                                                }}
                                            >
                                                ECAT Examination Result/Score:
                                            </label>

                                            {/* 25px inline block space */}
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "100px",
                                                    height: "1px",
                                                    marginRight: "15px",
                                                    borderBottom: "1px solid black",
                                                }}
                                            ></span>

                                            {/* PASSED checkbox */}
                                            <div style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Passed</span>
                                            </div>

                                            {/* FAILED checkbox */}
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Failed</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    {/* LEFT HALF */}
                                    <td colSpan={19} style={{ padding: 0 }}>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: "bold",
                                                display: "block",
                                                marginBottom: "2px",
                                                textAlign: "left",
                                            }}
                                        >
                                            FROM DEGREE/PROGRAM APPLIED
                                        </span>

                                        <div
                                            style={{
                                                border: "1px solid black",
                                                width: "100%",
                                                height: "25px",
                                                lineHeight: "25px",  // keeps text vertically centered
                                                fontSize: "12px",
                                            }}
                                        >
                                            {curriculumOptions.length > 0
                                                ? `${curriculumOptions.find(
                                                    (item) => item?.curriculum_id?.toString() === (person?.program ?? "").toString()
                                                )?.program_description || person?.program || ""} ${curriculumOptions.find(
                                                    (c) => c.curriculum_id?.toString() === (person?.program ?? "").toString()
                                                )?.major || ""
                                                }`
                                                : "Loading..."}
                                        </div>
                                    </td>

                                    {/* CENTER GAP */}
                                    <td colSpan={2}></td>

                                    {/* RIGHT HALF */}
                                    <td colSpan={19} style={{ padding: 0 }}>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                display: "block",
                                                textAlign: "left",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            Change to <b>NEW DEGREE/PROGRAM</b>
                                        </span>

                                        <div
                                            style={{
                                                border: "1px solid black",
                                                width: "100%",
                                                height: "25px",
                                                lineHeight: "25px",  // 🔥 same height & alignment as left
                                                fontSize: "12px",
                                            }}
                                        ></div>
                                    </td>
                                </tr>


                                {/* Reason for Change + Applicant's Signature (matches image placement) */}
                                <tr style={{ fontSize: "13px", }}>
                                    <td colSpan={40} style={{ padding: 0 }}>
                                        <div
                                            style={{
                                                position: "relative",
                                                width: "100%",
                                                marginTop: "10px",
                                                paddingTop: "6px",
                                                paddingBottom: "6px",
                                                boxSizing: "border-box",

                                            }}
                                        >
                                            {/* Label + underline */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: "700",
                                                        whiteSpace: "nowrap",
                                                        marginLeft: "6px",
                                                        marginRight: "6px",
                                                        fontSize: "14px"
                                                    }}
                                                >
                                                    Reason's for Change:
                                                </span>

                                                {/* Underline that fills until signature block */}
                                                <div
                                                    style={{
                                                        flexGrow: 1,
                                                        borderBottom: "1px solid #000",
                                                        height: "1.15em",
                                                        marginTop: "-4px",
                                                        marginRight: "260px", // space for signature block
                                                    }}
                                                ></div>
                                            </div>

                                            {/* Signature block on the right */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: "6px",
                                                    top: "6px",
                                                    width: "240px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        borderBottom: "1px solid #000",
                                                        height: "1.15em",
                                                        marginBottom: "-2px",
                                                    }}
                                                ></div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        whiteSpace: "nowrap",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Applicant's Signature
                                                </div>
                                            </div>

                                            {/* NEW LINE — 60% width (AFTER signature) */}
                                            <div
                                                style={{
                                                    marginTop: "12px",
                                                    width: "64.5%",
                                                    borderBottom: "1px solid #000",
                                                    height: "1.1em",
                                                    marginLeft: "6px", // aligns with other left content
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>

                                {/* College Approval from Current Program Applied */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{

                                                fontWeight: "bold",
                                                textAlign: "left",
                                                fontSize: "14px"
                                            }}
                                        >
                                            College Approval from current program applied:
                                        </div>
                                    </td>
                                </tr>
                                {/* College Code / Program Head / College Dean */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                marginTop: "5px",
                                            }}
                                        >
                                            {/* College Code */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Code</div>
                                            </div>

                                            {/* Program Head */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>Program Head</div>
                                            </div>

                                            {/* College Dean */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Dean</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{

                                                fontWeight: "bold",
                                                textAlign: "left",
                                                fontSize: "14px"
                                            }}
                                        >
                                            College Acceptance to new program applied:
                                        </div>
                                    </td>
                                </tr>

                                {/* College Code / Program Head / College Dean (Approval Row) */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                marginTop: "5px",
                                            }}
                                        >
                                            {/* College Code */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Code</div>
                                            </div>

                                            {/* Program Head */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>Program Head</div>
                                            </div>

                                            {/* College Dean */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Dean</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>



                                {/* Accepted / Not Accepted / Others */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end", // aligns everything to the right
                                                alignItems: "center",
                                                gap: "20px",
                                                marginTop: "10px",
                                            }}
                                        >
                                            {/* Accepted */}
                                            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                Accepted
                                            </label>

                                            {/* Not Accepted */}
                                            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                Not Accepted
                                            </label>

                                            {/* Other/s + Line beside it */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                    <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                    Other/s:
                                                </label>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        width: "250px",
                                                        height: "1px",
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>



                            </tbody>

                        </table>


                        <div

                            style={{
                                width: "8in", // matches table width assuming 8in for 40 columns
                                maxWidth: "100%",
                                margin: "0 auto",
                                boxSizing: "border-box",
                                padding: "10px 0",
                            }}
                        >
                            {/* Top solid line */}
                            <hr
                                style={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    borderTop: "1px solid black",
                                    marginTop: "-5px",
                                }}
                            />

                            {/* College Dean's Copy aligned right */}
                            <div
                                style={{
                                    width: "100%",
                                    textAlign: "right", // aligns to the right side
                                    fontWeight: "normal",
                                    fontSize: "14px",
                                    color: "black",
                                    marginBottom: "0",
                                    marginTop: "10px"
                                }}
                            >
                                Admission Services Copy
                            </div>


                        </div>
                    </Container>

                </div>
            )}


            <div style={{ height: "30px" }}></div>
            {selectedPerson && (
                <div ref={newFormRef} style={{ position: "relative" }}>
                    <Container>

                        <div
                            style={{
                                width: "8in",
                                maxWidth: "100%",
                                margin: "0 auto",
                                marginBottom: "30px",
                                boxSizing: "border-box",
                                padding: "10px 0",
                            }}
                        >

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",     // center whole row
                                    position: "relative",
                                }}
                            >
                                {/* Logo (Left) */}
                                <div style={{ position: "absolute", left: 0 }}>
                                    <img
                                        src={fetchedLogo}
                                        alt="School Logo"
                                        style={{
                                            width: "120px",
                                            height: "120px",
                                            objectFit: "cover",
                                            marginLeft: "10px",
                                            marginTop: "-25px",
                                            borderRadius: "50%",
                                        }}
                                    />
                                </div>

                                {/* Text Block (Centered) */}
                                <div
                                    style={{
                                        textAlign: "center",
                                        fontSize: "14px",
                                        fontFamily: "Arial",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    <div style={{ fontSize: "14px" }}>
                                        Republic of the Philippines
                                    </div>

                                    <div
                                        style={{
                                            letterSpacing: "1px",
                                            fontSize: "20px",
                                            fontFamily: "Times New Roman",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        {firstLine}
                                    </div>

                                    {secondLine && (
                                        <div
                                            style={{
                                                letterSpacing: "1px",
                                                fontSize: "20px",
                                                fontFamily: "Times New Roman",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {secondLine}
                                        </div>
                                    )}

                                    {campusAddress && (
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontFamily: "Arial",
                                                letterSpacing: "1px",
                                            }}
                                        >
                                            {campusAddress}
                                        </div>
                                    )}

                                    <div style={{ fontFamily: "Arial", letterSpacing: "1px" }}>
                                        <b>OFFICE OF THE ADMISSION SERVICES</b>
                                    </div>

                                    <br />

                                    <div
                                        style={{
                                            fontSize: "21px",
                                            fontFamily: "Arial",
                                            fontWeight: "bold",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        Applicant's Change Course Form
                                    </div>
                                </div>
                            </div>
                        </div>


                        <br />
                        <br />
                        <table

                            style={{
                                borderCollapse: "collapse",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                width: "8in",
                                margin: "0 auto",

                                marginTop: "-30px",
                                textAlign: "center",
                                tableLayout: "fixed",
                            }}
                        >

                            <tbody>
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end", // keep the whole block at the right
                                                alignItems: "center",
                                                width: "100%",
                                            }}
                                        >
                                            <label
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    marginRight: "10px",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                Applicant Id No.:
                                            </label>

                                            <div
                                                style={{
                                                    width: "200px", // fixed width for the underline
                                                    borderBottom: "1px solid black",
                                                    display: "flex",
                                                    justifyContent: "center", // center the content horizontally
                                                    alignItems: "center",       // center the content vertically
                                                    fontSize: "14px",
                                                    height: "1.3em",
                                                }}
                                            >

                                            </div>
                                        </div>
                                    </td>

                                </tr>

                                <tr>
                                    <td
                                        colSpan={40}
                                        style={{

                                            fontSize: "13px",
                                            paddingTop: "5px",
                                            marginTop: 0,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <span
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    marginRight: "10px",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                Name of Student:
                                            </span>
                                            <div style={{ flexGrow: 1, display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>

                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>

                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>

                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>

                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* Labels Row */}
                                <tr>
                                    <td
                                        colSpan={40}
                                        style={{

                                            fontSize: "12px",
                                            paddingTop: "2px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginLeft: "-30px",

                                            }}
                                        >
                                            <span style={{ width: "20%", textAlign: "center" }}>(Pls. PRINT)</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Last Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Given Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Middle Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Ext. Name</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Email & Applicant ID */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={20}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px", fontSize: "14px" }}>Date Applied</label>
                                            <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.3em", fontSize: "14px" }}>
                                                <div style={{ marginTop: "-3px" }} className="dataField"></div>
                                            </span>
                                        </div>
                                    </td>
                                    <td colSpan={20}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px", fontSize: "14px" }}>Date Examination:</label>
                                            <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.3em", fontSize: "14px" }}>
                                                <div style={{ marginTop: "-3px" }} className="dataField"></div>
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Email & Applicant ID */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%", marginTop: "10px" }}>
                                            <label
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    fontSize: "14px",
                                                    marginRight: "10px",
                                                }}
                                            >
                                                ECAT Examination Result/Score:
                                            </label>

                                            {/* 25px inline block space */}
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "100px",
                                                    height: "1px",
                                                    marginRight: "15px",
                                                    borderBottom: "1px solid black",
                                                }}
                                            ></span>

                                            {/* PASSED checkbox */}
                                            <div style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Passed</span>
                                            </div>

                                            {/* FAILED checkbox */}
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Failed</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    {/* LEFT HALF */}
                                    <td colSpan={19} style={{ padding: 0 }}>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: "bold",
                                                display: "block",
                                                marginBottom: "2px",
                                                textAlign: "left",
                                            }}
                                        >
                                            FROM DEGREE/PROGRAM APPLIED
                                        </span>

                                        <div
                                            style={{
                                                border: "1px solid black",
                                                width: "100%",
                                                height: "25px",
                                                lineHeight: "25px",  // keeps text vertically centered
                                                fontSize: "12px",
                                            }}
                                        >

                                        </div>

                                    </td>

                                    {/* CENTER GAP */}
                                    <td colSpan={2}></td>

                                    {/* RIGHT HALF */}
                                    <td colSpan={19} style={{ padding: 0 }}>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                display: "block",
                                                textAlign: "left",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            Change to <b>NEW DEGREE/PROGRAM</b>
                                        </span>

                                        <div
                                            style={{
                                                border: "1px solid black",
                                                width: "100%",
                                                height: "25px",
                                                lineHeight: "25px",  // 🔥 same height & alignment as left
                                                fontSize: "12px",
                                            }}
                                        ></div>
                                    </td>
                                </tr>



                                {/* Reason for Change + Applicant's Signature (matches image placement) */}
                                <tr style={{ fontSize: "13px", }}>
                                    <td colSpan={40} style={{ padding: 0 }}>
                                        <div
                                            style={{
                                                position: "relative",
                                                width: "100%",
                                                paddingTop: "6px",
                                                marginTop: "10px",
                                                paddingBottom: "6px",
                                                boxSizing: "border-box",

                                            }}
                                        >
                                            {/* Label + underline */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: "700",
                                                        whiteSpace: "nowrap",

                                                        marginRight: "6px",
                                                        fontSize: "14px"
                                                    }}
                                                >
                                                    Reason's for Change:
                                                </span>

                                                {/* Underline that fills until signature block */}
                                                <div
                                                    style={{
                                                        flexGrow: 1,
                                                        borderBottom: "1px solid #000",
                                                        height: "1.15em",
                                                        marginTop: "-4px",
                                                        marginRight: "260px", // space for signature block
                                                    }}
                                                ></div>
                                            </div>

                                            {/* Signature block on the right */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: "6px",
                                                    top: "6.50px",
                                                    width: "240px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        borderBottom: "1px solid #000",
                                                        height: "1.15em",
                                                        marginBottom: "-3px",
                                                    }}
                                                ></div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        whiteSpace: "nowrap",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Applicant's Signature
                                                </div>
                                            </div>

                                            {/* NEW LINE — 60% width (AFTER signature) */}
                                            <div
                                                style={{
                                                    marginTop: "12px",
                                                    width: "64.5%",
                                                    borderBottom: "1px solid #000",
                                                    height: "1.1em",
                                                    marginLeft: "6px", // aligns with other left content
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>

                                {/* College Approval from Current Program Applied */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{

                                                fontWeight: "bold",
                                                textAlign: "left",
                                                fontSize: "14px"
                                            }}
                                        >
                                            College Approval from current program applied:
                                        </div>
                                    </td>
                                </tr>
                                {/* College Code / Program Head / College Dean */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                marginTop: "5px",
                                            }}
                                        >
                                            {/* College Code */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Code</div>
                                            </div>

                                            {/* Program Head */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>Program Head</div>
                                            </div>

                                            {/* College Dean */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Dean</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{

                                                fontWeight: "bold",
                                                textAlign: "left",
                                                fontSize: "14px"
                                            }}
                                        >
                                            College Acceptance to new program applied:
                                        </div>
                                    </td>
                                </tr>

                                {/* College Code / Program Head / College Dean (Approval Row) */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                marginTop: "5px",
                                            }}
                                        >
                                            {/* College Code */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Code</div>
                                            </div>

                                            {/* Program Head */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>Program Head</div>
                                            </div>

                                            {/* College Dean */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Dean</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>



                                {/* Accepted / Not Accepted / Others */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end", // aligns everything to the right
                                                alignItems: "center",
                                                gap: "20px",
                                                marginTop: "10px",
                                            }}
                                        >
                                            {/* Accepted */}
                                            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                Accepted
                                            </label>

                                            {/* Not Accepted */}
                                            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                Not Accepted
                                            </label>

                                            {/* Other/s + Line beside it */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                    <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                    Other/s:
                                                </label>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        width: "250px",
                                                        height: "1px",
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>



                            </tbody>

                        </table>
                    </Container>
                    <div

                        style={{
                            width: "8in", // matches table width assuming 8in for 40 columns
                            maxWidth: "100%",
                            margin: "0 auto",
                            boxSizing: "border-box",
                            padding: "10px 0",

                        }}
                    >
                        {/* Top solid line */}
                        <hr
                            style={{
                                width: "100%",
                                maxWidth: "100%",
                                borderTop: "1px solid black",
                                marginTop: "-5px",
                            }}
                        />

                        {/* College Dean's Copy aligned right */}
                        <div
                            style={{
                                width: "100%",
                                textAlign: "right", // aligns to the right side
                                fontWeight: "normal",
                                fontSize: "14px",
                                color: "black",
                                marginBottom: "0",
                                marginTop: "10px"
                            }}
                        >
                            College Dean's Copy
                        </div>

                        {/* Bottom dashed line */}
                        <hr
                            style={{
                                width: "100%",

                                border: "none",
                                borderTop: "1px dashed black",
                                margin: "10px auto",
                            }}
                        />
                    </div>


                    <Container>

                        <div
                            style={{
                                width: "8in",
                                maxWidth: "100%",
                                margin: "0 auto",
                                marginTop: "-10px",
                                boxSizing: "border-box",
                                padding: "10px 0",
                            }}
                        >

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",     // center whole row
                                    position: "relative",
                                }}
                            >
                                {/* Logo (Left) */}
                                <div style={{ position: "absolute", left: 0 }}>
                                    <img
                                        src={fetchedLogo}
                                        alt="School Logo"
                                        style={{
                                            width: "120px",
                                            height: "120px",
                                            objectFit: "cover",
                                            marginLeft: "10px",
                                            marginTop: "-25px",
                                            borderRadius: "50%",
                                        }}
                                    />
                                </div>

                                {/* Text Block (Centered) */}
                                <div
                                    style={{
                                        textAlign: "center",
                                        fontSize: "14px",
                                        fontFamily: "Arial",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    <div style={{ fontSize: "14px" }}>
                                        Republic of the Philippines
                                    </div>

                                    <div
                                        style={{
                                            letterSpacing: "1px",
                                            fontSize: "20px",
                                            fontFamily: "Times New Roman",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        {firstLine}
                                    </div>

                                    {secondLine && (
                                        <div
                                            style={{
                                                letterSpacing: "1px",
                                                fontSize: "20px",
                                                fontFamily: "Times New Roman",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {secondLine}
                                        </div>
                                    )}

                                    {campusAddress && (
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontFamily: "Arial",
                                                letterSpacing: "1px",
                                            }}
                                        >
                                            {campusAddress}
                                        </div>
                                    )}

                                    <div style={{ fontFamily: "Arial", letterSpacing: "1px" }}>
                                        <b>OFFICE OF THE ADMISSION SERVICES</b>
                                    </div>

                                    <br />

                                    <div
                                        style={{
                                            fontSize: "21px",
                                            fontFamily: "Arial",
                                            fontWeight: "bold",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        Applicant's Change Course Form
                                    </div>
                                </div>
                            </div>
                        </div>


                        <br />
                        <br />
                        <table

                            style={{
                                borderCollapse: "collapse",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                width: "8in",
                                margin: "0 auto",
                                marginTop: "-20px",


                                textAlign: "center",
                                tableLayout: "fixed",
                            }}
                        >

                            <tbody>
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end", // keep the whole block at the right
                                                alignItems: "center",
                                                width: "100%",
                                            }}
                                        >
                                            <label
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    marginRight: "10px",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                Applicant Id No.:
                                            </label>

                                            <div
                                                style={{
                                                    width: "200px", // fixed width for the underline
                                                    borderBottom: "1px solid black",
                                                    display: "flex",
                                                    justifyContent: "center", // center the content horizontally
                                                    alignItems: "center",       // center the content vertically
                                                    fontSize: "14px",
                                                    height: "1.3em",
                                                }}
                                            >

                                            </div>
                                        </div>
                                    </td>

                                </tr>

                                <tr>
                                    <td
                                        colSpan={40}
                                        style={{

                                            fontSize: "13px",
                                            paddingTop: "5px",
                                            marginTop: 0,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <span
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    marginRight: "10px",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                Name of Student:
                                            </span>
                                            <div style={{ flexGrow: 1, display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>

                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>

                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>

                                                </span>
                                                <span style={{ width: "25%", textAlign: "center", fontSize: "14.5px", borderBottom: "1px solid black" }}>

                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* Labels Row */}
                                <tr>
                                    <td
                                        colSpan={40}
                                        style={{

                                            fontSize: "12px",
                                            paddingTop: "2px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginLeft: "-30px",

                                            }}
                                        >
                                            <span style={{ width: "20%", textAlign: "center" }}>(Pls. PRINT)</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Last Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Given Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Middle Name</span>
                                            <span style={{ width: "20%", textAlign: "center" }}>Ext. Name</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Email & Applicant ID */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={20}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px", fontSize: "14px" }}>Date Applied</label>
                                            <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.3em", fontSize: "14px" }}>
                                                <div style={{ marginTop: "-3px" }} className="dataField"></div>
                                            </span>
                                        </div>
                                    </td>
                                    <td colSpan={20}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px", fontSize: "14px" }}>Date Examination:</label>
                                            <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.3em", fontSize: "14px" }}>
                                                <div style={{ marginTop: "-3px" }} className="dataField"></div>
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Email & Applicant ID */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%", marginTop: "10px" }}>
                                            <label
                                                style={{
                                                    fontWeight: "bold",
                                                    whiteSpace: "nowrap",
                                                    fontSize: "14px",
                                                    marginRight: "10px",
                                                }}
                                            >
                                                ECAT Examination Result/Score:
                                            </label>

                                            {/* 25px inline block space */}
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "100px",
                                                    height: "1px",
                                                    marginRight: "15px",
                                                    borderBottom: "1px solid black",
                                                }}
                                            ></span>

                                            {/* PASSED checkbox */}
                                            <div style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Passed</span>
                                            </div>

                                            {/* FAILED checkbox */}
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>Failed</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    {/* LEFT HALF */}
                                    <td colSpan={19} style={{ padding: 0 }}>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: "bold",
                                                display: "block",
                                                marginBottom: "2px",
                                                textAlign: "left",
                                            }}
                                        >
                                            FROM DEGREE/PROGRAM APPLIED
                                        </span>

                                        <div
                                            style={{
                                                border: "1px solid black",
                                                width: "100%",
                                                height: "25px",
                                                lineHeight: "25px",  // keeps text vertically centered
                                                fontSize: "12px",
                                            }}
                                        >

                                        </div>
                                    </td>

                                    {/* CENTER GAP */}
                                    <td colSpan={2}></td>

                                    {/* RIGHT HALF */}
                                    <td colSpan={19} style={{ padding: 0 }}>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                display: "block",
                                                textAlign: "left",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            Change to <b>NEW DEGREE/PROGRAM</b>
                                        </span>

                                        <div
                                            style={{
                                                border: "1px solid black",
                                                width: "100%",
                                                height: "25px",
                                                lineHeight: "25px",  // 🔥 same height & alignment as left
                                                fontSize: "12px",
                                            }}
                                        ></div>
                                    </td>
                                </tr>


                                {/* Reason for Change + Applicant's Signature (matches image placement) */}
                                <tr style={{ fontSize: "13px", }}>
                                    <td colSpan={40} style={{ padding: 0 }}>
                                        <div
                                            style={{
                                                position: "relative",
                                                width: "100%",
                                                marginTop: "10px",
                                                paddingTop: "6px",
                                                paddingBottom: "6px",
                                                boxSizing: "border-box",

                                            }}
                                        >
                                            {/* Label + underline */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: "700",
                                                        whiteSpace: "nowrap",
                                                        marginLeft: "6px",
                                                        marginRight: "6px",
                                                        fontSize: "14px"
                                                    }}
                                                >
                                                    Reason's for Change:
                                                </span>

                                                {/* Underline that fills until signature block */}
                                                <div
                                                    style={{
                                                        flexGrow: 1,
                                                        borderBottom: "1px solid #000",
                                                        height: "1.15em",
                                                        marginTop: "-4px",
                                                        marginRight: "260px", // space for signature block
                                                    }}
                                                ></div>
                                            </div>

                                            {/* Signature block on the right */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: "6px",
                                                    top: "6px",
                                                    width: "240px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        borderBottom: "1px solid #000",
                                                        height: "1.15em",
                                                        marginBottom: "-2px",
                                                    }}
                                                ></div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        whiteSpace: "nowrap",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Applicant's Signature
                                                </div>
                                            </div>

                                            {/* NEW LINE — 60% width (AFTER signature) */}
                                            <div
                                                style={{
                                                    marginTop: "12px",
                                                    width: "64.5%",
                                                    borderBottom: "1px solid #000",
                                                    height: "1.1em",
                                                    marginLeft: "6px", // aligns with other left content
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>

                                {/* College Approval from Current Program Applied */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{

                                                fontWeight: "bold",
                                                textAlign: "left",
                                                fontSize: "14px"
                                            }}
                                        >
                                            College Approval from current program applied:
                                        </div>
                                    </td>
                                </tr>
                                {/* College Code / Program Head / College Dean */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                marginTop: "5px",
                                            }}
                                        >
                                            {/* College Code */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Code</div>
                                            </div>

                                            {/* Program Head */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>Program Head</div>
                                            </div>

                                            {/* College Dean */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Dean</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{

                                                fontWeight: "bold",
                                                textAlign: "left",
                                                fontSize: "14px"
                                            }}
                                        >
                                            College Acceptance to new program applied:
                                        </div>
                                    </td>
                                </tr>

                                {/* College Code / Program Head / College Dean (Approval Row) */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                marginTop: "5px",
                                            }}
                                        >
                                            {/* College Code */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Code</div>
                                            </div>

                                            {/* Program Head */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>Program Head</div>
                                            </div>

                                            {/* College Dean */}
                                            <div style={{ width: "30%" }}>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        height: "1.2em",
                                                    }}
                                                ></div>
                                                <div style={{ marginTop: "3px" }}>College Dean</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>



                                {/* Accepted / Not Accepted / Others */}
                                <tr style={{ fontSize: "13px" }}>
                                    <td colSpan={40}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end", // aligns everything to the right
                                                alignItems: "center",
                                                gap: "20px",
                                                marginTop: "10px",
                                            }}
                                        >
                                            {/* Accepted */}
                                            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                Accepted
                                            </label>

                                            {/* Not Accepted */}
                                            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                Not Accepted
                                            </label>

                                            {/* Other/s + Line beside it */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                    <input type="checkbox" style={{ width: "25px", height: "25px" }} />
                                                    Other/s:
                                                </label>
                                                <div
                                                    style={{
                                                        borderBottom: "1px solid black",
                                                        width: "250px",
                                                        height: "1px",
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>



                            </tbody>

                        </table>


                        <div

                            style={{
                                width: "8in", // matches table width assuming 8in for 40 columns
                                maxWidth: "100%",
                                margin: "0 auto",
                                boxSizing: "border-box",
                                padding: "10px 0",
                            }}
                        >
                            {/* Top solid line */}
                            <hr
                                style={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    borderTop: "1px solid black",
                                    marginTop: "-5px",
                                }}
                            />

                            {/* College Dean's Copy aligned right */}
                            <div
                                style={{
                                    width: "100%",
                                    textAlign: "right", // aligns to the right side
                                    fontWeight: "normal",
                                    fontSize: "14px",
                                    color: "black",
                                    marginBottom: "0",
                                    marginTop: "10px"
                                }}
                            >
                                Admission Services Copy
                            </div>


                        </div>
                    </Container>

                </div>
            )}
        </Box>
    );
};

export default ExaminationProfile;