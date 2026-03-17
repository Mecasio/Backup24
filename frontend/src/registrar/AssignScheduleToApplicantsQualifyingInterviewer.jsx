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
    FormControl,
    InputLabel,
    Select,
    TableContainer,
    TableCell,
    TableBody,
    Card,
    TableHead,
    Snackbar,
    Alert,
} from "@mui/material";
import { Search } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from "react-router-dom";
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PeopleIcon from '@mui/icons-material/People';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SearchIcon from "@mui/icons-material/Search";
import API_BASE_URL from "../apiConfig";
import MenuBookIcon from '@mui/icons-material/MenuBook';


const AssignScheduleToApplicantsInterviewer = () => {
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


    const [user, setUser] = useState(null);
    const [adminData, setAdminData] = useState({ dprtmnt_id: "" });
    const [emailSender, setEmailSender] = useState("");
    const [loggedInPersonId, setLoggedInPersonId] = useState(null);

    useEffect(() => {
        socket.current = io(API_BASE_URL);

        return () => {
            socket.current.disconnect();
        };
    }, []);


    useEffect(() => {
        const storedEmail = localStorage.getItem("email");
        const storedPersonId = localStorage.getItem("person_id") || sessionStorage.getItem("person_id");

        if (storedEmail) setUser(storedEmail);
        if (storedPersonId) setLoggedInPersonId(storedPersonId);
    }, []);
    const [userID, setUserID] = useState("");
    const [userRole, setUserRole] = useState("");
    const [hasAccess, setHasAccess] = useState(null);

    const pageId = 12;

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

    useEffect(() => {
        const fetchActiveSenders = async () => {
            if (!adminData.dprtmnt_id) return;

            try {
                const res = await axios.get(
                    `${API_BASE_URL}/api/email-templates/active-senders?department_id=${adminData.dprtmnt_id}`
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

    const tabs = [
        { label: "Qualifying / Interview Room Assignment", to: "/assign_qualifying_interview_exam", icon: <MeetingRoomIcon fontSize="large" /> },
        { label: "Qualifying / Interview Schedule Management", to: "/assign_schedule_applicants_qualifying_interview", icon: <ScheduleIcon fontSize="large" /> },
        { label: "Qualifying / Interviewer Applicant's List", to: "/enrollment_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    ];

    const handleStepClick = (index, to) => {
        setActiveStep(index);
        navigate(to); // this will actually change the page
    };

    const location = useLocation();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(1);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));
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
        middle_Code: "",
        created_at: ""
    });
    const [selectedApplicantStatus, setSelectedApplicantStatus] = useState("");
    const [curriculumOptions, setCurriculumOptions] = useState([]);

    useEffect(() => {
        if (!adminData.dprtmnt_id) return;
        const fetchCurriculums = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/applied_program/${adminData.dprtmnt_id}`);
                setCurriculumOptions(response.data);
            } catch (error) {
                console.error("Error fetching curriculum options:", error);
            }
        };
        fetchCurriculums();
    }, [adminData.dprtmnt_id]);

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

    const fetchSchedules = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/interview_schedules`);
            setSchedules(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching schedules:", err);
        }
    };


    // ⬇️ Socket update refreshes the "with_count" one
    const fetchSchedulesWithCount = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/interview_schedules_with_count`);
            setSchedules(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching schedules with count:", err);
        }
    };


    // ⬇️ Socket update refreshes the "with_count" one
    useEffect(() => {
        if (!socket.current) return;

        const handleScheduleUpdated = ({ schedule_id }) => {
            console.log("📢 Schedule updated:", schedule_id);
            fetchSchedulesWithCount();
            fetchAllApplicants();
        };

        socket.current.on("schedule_updated", handleScheduleUpdated);

        return () => {
            socket.current.off("schedule_updated", handleScheduleUpdated);
        };
    }, []);

    // ⬇️ Add this inside ApplicantList component, before useEffect
    const fetchAllApplicants = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/interview/not-emailed-applicants`);

            setPersons(res.data);
            setSelectedApplicants(prev => {
                const newSet = new Set(prev);
                res.data.forEach((a) => {
                    if (a.schedule_id !== null) newSet.delete(a.applicant_number);
                });
                return newSet;
            });
        } catch (err) {
            console.error("Error fetching all-applicants:", err);

        }
    };

    const handleRowClick = (person_id) => {
        if (!person_id) return;

        sessionStorage.setItem("admin_edit_person_id", String(person_id));
        sessionStorage.setItem("admin_edit_person_id_source", "applicant_list");
        sessionStorage.setItem("admin_edit_person_id_ts", String(Date.now()));

        // ✅ Always pass person_id in the URL
        navigate(`/student_dashboard1?person_id=${person_id}`);
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

        socket.current.emit("update_schedule_for_interview", { schedule_id: selectedSchedule, applicant_numbers: [id] });

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

        const schedule = schedules.find(s => s.schedule_id == selectedSchedule);
        if (!schedule) {
            setSnack({ open: true, message: "Selected schedule not found.", severity: "error" });
            return;
        }

        const currentCount = schedule.current_occupancy || 0;
        const maxSlots = schedule.room_quota || 40;
        const availableSlots = maxSlots - currentCount;

        if (availableSlots <= 0) {
            setSnack({ open: true, message: `This schedule is already full (${maxSlots} applicants).`, severity: "error" });
            return;
        }

        // ✅ Filter all unassigned applicants first
        const filteredPersons = currentPersons.filter(a => a.schedule_id == null);

        if (filteredPersons.length === 0) {
            setSnack({ open: true, message: "No unassigned applicants available.", severity: "warning" });
            return;
        }

        // ✅ Take only the ones that fit in available slots and map to applicant numbers
        const unassigned = filteredPersons
            .slice(0, availableSlots)
            .map(a => a.applicant_number)
            .filter(Boolean);

        socket.current.emit("update_schedule_for_interview", { schedule_id: selectedSchedule, applicant_numbers: unassigned });

        socket.current.once("update_schedule_result", (res) => {
            if (res.success) {
                setSnack({
                    open: true,
                    message: `Assigned: ${res.assigned?.length || 0}, Updated: ${res.updated?.length || 0}, Skipped: ${res.skipped?.length || 0}. Total unassigned applicants: ${filteredPersons.length}`,
                    severity: "success",
                });
                fetchAllApplicants();
                setSchedules(prev =>
                    prev.map(s =>
                        s.schedule_id == selectedSchedule
                            ? { ...s, current_occupancy: s.current_occupancy + (res.assigned?.length || 0) }
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
            await axios.post(`${API_BASE_URL}/unassign_interview`, { applicant_number });

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
        const maxSlots = schedule.room_quota || 40;
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

        socket.current.off("update_schedule_result");

        socket.current.emit("update_schedule_for_interview", {
            schedule_id: selectedSchedule,
            applicant_numbers: unassigned
        });

        socket.current.once("update_schedule_result", (res) => {
            if (res.success) {
                setSnack({
                    open: true,
                    message: `Assigned: ${res.assigned?.length || 0}, Updated: ${res.updated?.length || 0}, Skipped: ${res.skipped?.length || 0}`,
                    severity: "success"
                });

                fetchAllApplicants();

                // Update schedule occupancy
                setSchedules(prev =>
                    prev.map(s =>
                        s.schedule_id === selectedSchedule
                            ? { ...s, current_occupancy: currentCount + (res.assigned?.length || 0) }
                            : s
                    )
                );
            } else {
                setSnack({
                    open: true,
                    message: res.error || "Failed to assign applicants.",
                    severity: "error"
                });
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
            const res = await axios.post(`${API_BASE_URL}/unassign_all_from_interview`, { schedule_id: selectedSchedule });
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
        if (!requirements || requirements.length === 0) {
            return "• No requirements listed at this time.";
        }

        const grouped = requirements.reduce((acc, req) => {
            const category = req.category || "Other";
            if (!acc[category]) acc[category] = [];
            acc[category].push(req);
            return acc;
        }, {});

        let text = "";

        Object.entries(grouped).forEach(([category, items]) => {
            text += `\n${category} Requirements:\n`;

            items.forEach((req) => {
                let notes = [];

                // ✅ ONLY Xerox (removed original)
                if (req.xerox_copies > 0) {
                    notes.push(
                        `${req.xerox_copies} Xerox copy${req.xerox_copies > 1 ? "s" : ""}`
                    );
                }

                let extra = notes.length > 0 ? ` (${notes.join(" + ")})` : "";

                text += `• ${req.description}${extra}\n`;
            });
        });

        return text.trim();
    };



    const handleSendEmails = () => {
        if (!selectedSchedule) {
            setSnack({
                open: true,
                message: "Please select a schedule first.",
                severity: "warning",
            });
            return;
        }

        // 👉 Get ALL applicants currently assigned to the selected schedule
        const assignedApplicants = persons.filter(
            (a) => a.schedule_id === selectedSchedule
        );

        if (assignedApplicants.length === 0) {
            setSnack({
                open: true,
                message: "No applicants are assigned to this schedule.",
                severity: "warning",
            });
            return;
        }

        // 👉 Extract applicant numbers for sending
        const applicantNumbers = assignedApplicants.map(a => a.applicant_number);

        // 👉 Set selectedApplicants state (used by confirmSendEmails)
        setSelectedApplicants(new Set(applicantNumbers));

        // 👉 Use first applicant for email preview
        const first = assignedApplicants[0];

        const fullName = `${first.last_name || ""}, ${first.first_name || ""} ${first.middle_name || ""}`.trim();

        const sched = schedules.find(s => s.schedule_id === selectedSchedule);
        if (!sched) {
            setSnack({
                open: true,
                message: "Schedule not found.",
                severity: "error",
            });
            return;
        }

        // Format times
        const formattedStart = new Date(`1970-01-01T${sched.start_time}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const formattedEnd = new Date(`1970-01-01T${sched.end_time}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        // Prefill the email message
        const formattedDate = new Date(sched.day_description).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const reqText = buildRequirementsText(requirements);

        setEmailMessage(
            `Dear ${first.last_name || ""}, ${first.first_name || ""} ${first.middle_name || ""},

You are scheduled for an interview on:

📅 Date: ${formattedDate}
🏢 Building: ${sched.building_description}
🏫 Room: ${sched.room_description}
🕒 Time: ${formattedStart} - ${formattedEnd}

Please bring the following requirements:

📄 REQUIRED DOCUMENTS:
${reqText}

1. Your Enrollment Officer will provide you with the Admission Form Process, including the required signatories.

Reminder:
Please provide your Enrollment Officer with photocopies of all your submitted online documents.

Thank you and good luck!`
        );

        // OPEN the dialog
        setConfirmOpen(true);
    };

    const handleSendEmailSingle = (applicant) => {
        if (!applicant) {
            setSnack({
                open: true,
                message: "Applicant data is missing.",
                severity: "error",
            });
            return;
        }

        const targetScheduleId = applicant.schedule_id || selectedSchedule;
        if (!targetScheduleId) {
            setSnack({
                open: true,
                message: "This applicant has no assigned schedule.",
                severity: "warning",
            });
            return;
        }

        const sched = schedules.find(
            (s) => String(s.schedule_id) === String(targetScheduleId),
        );
        if (!sched) {
            setSnack({
                open: true,
                message: "Schedule not found.",
                severity: "error",
            });
            return;
        }

        const formattedStart = new Date(`1970-01-01T${sched.start_time}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const formattedEnd = new Date(`1970-01-01T${sched.end_time}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const formattedDate = new Date(sched.day_description).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const reqText = buildRequirementsText(requirements);


        setSelectedSchedule(targetScheduleId);
        setSelectedApplicants(new Set([applicant.applicant_number]));

        setEmailMessage(
            `Dear ${applicant.last_name || ""}, ${applicant.first_name || ""} ${applicant.middle_name || ""},

You are scheduled for an interview on:

📅 Date: ${formattedDate}
🏢 Building: ${sched.building_description}
🏫 Room: ${sched.room_description}
🕒 Time: ${formattedStart} - ${formattedEnd}

Please bring the following requirements:

📄 REQUIRED DOCUMENTS:
${reqText}

1. Your Enrollment Officer will provide you with the Admission Form Process, including the required signatories.

Reminder:
Please provide your Enrollment Officer with photocopies of all your submitted online documents.

Thank you and good luck!`
        );

        setConfirmOpen(true);
    };

    const confirmSendEmails = () => {
        setConfirmOpen(false);
        setLoading2(true);
        const assignedApplicants = Array.from(selectedApplicants);

        socket.current.emit("send_interview_emails", {
            schedule_id: selectedSchedule,
            applicant_numbers: assignedApplicants,
            subject: emailSubject,
            senderName: emailSender,
            message: emailMessage,
            user_person_id: loggedInPersonId,
        });

        // Remove previous listeners (prevents stacking)
        socket.current.off("send_schedule_emails_result");

        socket.current.once("send_schedule_emails_result", (emailRes) => {
            setSnack({
                open: true,
                message: emailRes.success ? emailRes.message : emailRes.error,
                severity: emailRes.success ? "success" : "error",
            });

            if (emailRes.success) {
                if (Array.isArray(emailRes.sent) && emailRes.sent.length > 0) {
                    Promise.all(
                        emailRes.sent.map((applicantId) =>
                            axios.put(
                                `${API_BASE_URL}/api/interview_applicants/${applicantId}/action`,
                            ),
                        ),
                    ).catch((err) => {
                        console.error("Failed to update interview_status:", err);
                    });
                }
                fetchAllApplicants();
            }

            setLoading2(false);
        });
    };


    // Email fields - start empty
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/interview_schedules_with_count`);
                setSchedules(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching schedules:", err);
            }
        };

        fetchSchedules();
    }, []);


    const [itemsPerPage, setItemsPerPage] = useState(100);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchError, setSearchError] = useState("");

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim() === "") return;

            try {
                const res = await axios.get(`${API_BASE_URL}/api/search-person`, {
                    params: { query: searchQuery }
                });

                setPerson(res.data); // ❌ don't do this
            } catch (err) {
                setSearchError("Applicant not found");
            }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
    const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
    const [department, setDepartment] = useState([]);
    const [minScore, setMinScore] = useState("");
    const [maxScore, setMaxScore] = useState("");
    const [exactRating, setExactRating] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedCampusFilter, setSelectedCampusFilter] = useState("");

    // ✅ Step 1: Filtering
    const filteredPersons = persons.filter((personData) => {
        const finalRating = Number(personData.final_rating) || 0;

        /* 🏫 CAMPUS */
        const matchesCampus =
            selectedCampusFilter === "" ||
            personData.campus === selectedCampusFilter;



        // ✅ Score range filter
        const matchesScore =
            (minScore === "" || finalRating >= Number(minScore)) &&
            (maxScore === "" || finalRating <= Number(maxScore));

        // ✅ Exact score filter
        const matchesExactRating =
            exactRating === "" || finalRating === Number(exactRating);

        const query = searchQuery.toLowerCase();
        const fullName = `${personData.first_name ?? ""} ${personData.middle_name ?? ""} ${personData.last_name ?? ""}`.toLowerCase();

        const matchesApplicantID = personData.applicant_number?.toString().toLowerCase().includes(query);
        const matchesName = fullName.includes(query);
        const matchesEmail = personData.emailAddress?.toLowerCase().includes(query);

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
            selectedSchoolYear === "" || (schoolYear && (String(applicantAppliedYear) === String(schoolYear.current_year)));

        const matchesSemester =
            selectedSchoolSemester === "" ||
            String(personData.middle_code) === String(selectedSchoolSemester);

        // ✅ Created At (Date Applied) filter
        const createdAtDate = new Date(personData.created_at);
        const matchesDateRange =
            (!startDate || createdAtDate >= new Date(startDate)) &&
            (!endDate || createdAtDate <= new Date(endDate));

        return (
            (matchesApplicantID || matchesName || matchesEmail || matchesProgramQuery) &&
            matchesDepartment &&
            matchesProgramFilter &&
            matchesSchoolYear &&
            matchesSemester &&
            matchesCampus &&
            matchesScore &&
            matchesExactRating &&
            matchesDateRange // ✅ Added Date Applied filter
        );
    });

    // ✅ Step 2: Sorting
    const sortedPersons = [...filteredPersons].sort((a, b) => {
        if (sortBy === "name") {
            const nameA = `${a.last_name ?? ""} ${a.first_name ?? ""} ${a.middle_name ?? ""}`.toLowerCase();
            const nameB = `${b.last_name ?? ""} ${b.first_name ?? ""} ${b.middle_name ?? ""}`.toLowerCase();
            return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }

        if (sortBy === "id") {
            const idA = a.applicant_number ?? "";
            const idB = b.applicant_number ?? "";
            return sortOrder === "asc" ? idA - idB : idB - idA;
        }

        if (sortBy === "email") {
            const emailA = a.emailAddress?.toLowerCase() ?? "";
            const emailB = b.emailAddress?.toLowerCase() ?? "";
            return sortOrder === "asc" ? emailA.localeCompare(emailB) : emailB.localeCompare(emailA);
        }

        if (sortBy === "final_rating") {
            const ratingA = Number(a.final_rating) || 0;
            const ratingB = Number(b.final_rating) || 0;
            return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        }

        if (sortBy === "created_at") {
            const parseDate = (d) => {
                if (!d) return new Date(0);

                // Normalize spacing and slashes
                const clean = String(d).trim();

                // Handle DD/MM/YYYY (European format)
                if (clean.includes("/") && !clean.includes("-")) {
                    const [day, month, year] = clean.split("/");
                    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
                }

                // Handle ISO and MySQL datetime formats (e.g. "2025-09-14" or "2025-09-14T00:00:00.000Z")
                if (clean.includes("-")) {
                    return new Date(clean);
                }

                // Handle fallback numeric timestamps
                const ts = Date.parse(clean);
                if (!isNaN(ts)) return new Date(ts);

                return new Date(0);
            };

            const dateA = parseDate(a.created_at);
            const dateB = parseDate(b.created_at);

            // "desc" => newest first
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }


        return 0;
    });


    // ✅ Step 3: Pagination (use sortedPersons instead of filteredPersons)
    const totalPages = Math.ceil(sortedPersons.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPersons = sortedPersons.slice(indexOfFirstItem, indexOfLastItem);


    useEffect(() => {
        if (!adminData.dprtmnt_id) return;
        const fetchDepartments = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/departments/${adminData.dprtmnt_id}`); // ✅ Update if needed
                setDepartment(response.data);
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };
        fetchDepartments();
    }, [adminData.dprtmnt_id]);

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

    useEffect(() => {
        if (department.length > 0 && !selectedDepartmentFilter) {
            const firstDept = department[0].dprtmnt_name;
            setSelectedDepartmentFilter(firstDept);
            handleDepartmentChange(firstDept);
        }
    }, [department, selectedDepartmentFilter]);

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
                    QUALIFYING / INTERVIEW SCHEDULE MANAGEMENT
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
                            backgroundColor: activeStep === index ? settings?.header_color || "#1976d2" : "#E8C999",
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
                    <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Qualifying / Interview Schedule</TableCell>
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
                                {schedules.map((s) => (
                                    <MenuItem key={s.schedule_id} value={s.schedule_id}>
                                        {s.branch} : {s.interviewer} - {s.day_description} | {s.building_description} {" "} | {s.room_description} |
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
                                        ? schedules.find((s) => s.schedule_id === selectedSchedule)?.interviewer || "Not assigned"
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
                                    <MenuItem value="final_rating">Final Rating</MenuItem> {/* ✅ New */}
                                    <MenuItem value="created_at">Date Applied</MenuItem>
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

                        <Typography fontSize={13} sx={{ minWidth: "80px", textAlign: "right" }}>
                            Exam Rating:
                        </Typography>
                        <TextField
                            type="number"
                            size="small"
                            label="Input Rating"
                            value={exactRating}
                            onChange={(e) => setExactRating(e.target.value)}
                            sx={{ width: 150 }}
                        />


                        {/* Sort Order */}

                    </Box>


                    {/* RIGHT SIDE: Action Buttons */}
                    <Box display="flex" gap={2} alignItems="center">
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleAssign40}
                            sx={{ minWidth: 150, marginLeft: "15px" }}
                        >
                            Assign Max
                        </Button>


                        {/* 🔥 New Custom Assign Input + Button */}
                        <TextField
                            type="number"
                            size="small"
                            label="Custom Count"
                            value={customCount}
                            onChange={(e) => setCustomCount(Number(e.target.value))}
                            sx={{ width: 120 }}
                        />
                        <Button
                            variant="contained"
                            color="warning"
                            onClick={handleAssignCustom}
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
                            sx={{ minWidth: 150 }}
                            onClick={handleSendEmails}
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



                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
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

            <TableContainer component={Paper} sx={{ width: "100%", border: "2px solid maroon" }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: "#F1F1F1", }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>#</TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Applicant ID</TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Name</TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Program</TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Email Address</TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Final Rating</TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Date Applied</TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentPersons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ textAlign: "center", p: 2 }}>
                                    No applicants found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentPersons.map((person, idx) => {
                                const finalRating = Number(person.final_rating) || 0; // ✅ use backend value
                                const applicantId = person.applicant_number;
                                const isAssigned = !!person.schedule_id; // ✅ check if already assigned

                                return (
                                    <TableRow key={person.person_id}>
                                        {/* Auto-increment # */}
                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                border: `2px solid ${borderColor}`,

                                                fontSize: "12px",
                                            }}
                                        >
                                            {indexOfFirstItem + idx + 1}
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
                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                border: `2px solid ${borderColor}`,
                                                fontSize: "12px",
                                            }}
                                        >
                                            {curriculumOptions.find(
                                                (item) =>
                                                    item.curriculum_id?.toString() ===
                                                    person.program?.toString()
                                            )?.program_code ?? "N/A"}
                                        </TableCell>

                                        {/* Email */}
                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                border: `2px solid ${borderColor}`,
                                                fontSize: "12px",
                                            }}
                                        >
                                            {person.emailAddress ?? "N/A"}
                                        </TableCell>

                                        {/* Final Rating */}
                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                border: `2px solid ${borderColor}`,
                                                fontSize: "12px",
                                            }}
                                        >
                                            {finalRating.toFixed(2)}
                                        </TableCell>

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


                                        {/* Action Buttons */}
                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                border: `2px solid ${borderColor}`,

                                            }}
                                        >
                                            {!isAssigned ? (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => handleAssignSingle(applicantId)} // ✅ use applicantId
                                                >
                                                    Assign
                                                </Button>
                                            ) : (
                                                <Box display="flex" gap={1} justifyContent="center">
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        size="small"
                                                        onClick={() =>
                                                            handleUnassignImmediate(applicantId)
                                                        } // ✅ use applicantId
                                                    >
                                                        Unassign
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        onClick={() => handleSendEmailSingle(person)}
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


            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {/* Title with maroon background + white text */}
                <DialogTitle sx={{ bgcolor: "#800000", color: "white" }}>
                    ✉️ Edit & Send Email
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    {/* Sender */}
                    <TextField
                        label="Sender"
                        value={department[0]?.dprtmnt_name}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        sx={{ mb: 3 }}
                    />

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
                        minRows={10}
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
                        🔑 Available placeholders: {"{first_name}, {last_name}, {applicant_number}, {day}, {room}, {start_time}, {end_time}"}
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
                        sx={{ minWidth: "140px", height: "40px" }}
                    >
                        Send Emails
                    </Button>
                </DialogActions>
            </Dialog>





            <LoadingOverlay open={loading2} message="Sending emails, please wait..." />
        </Box>
    );
};

export default AssignScheduleToApplicantsInterviewer;


