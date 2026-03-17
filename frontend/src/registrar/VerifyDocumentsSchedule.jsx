import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
    Box, Button, Grid, MenuItem, TextField, Typography, Paper, Card, TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    Alert,
    TableBody
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";



import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import KeyIcon from "@mui/icons-material/Key";
import API_BASE_URL from "../apiConfig";
import CampaignIcon from '@mui/icons-material/Campaign';
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const VerifyDocumentsSchedule = () => {

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
    const [selectedBranch, setSelectedBranch] = useState("");

    const [branches, setBranches] = useState([]);

    useEffect(() => {
        if (!settings) return;

        if (settings.branches) {
            try {
                const parsedBranches = typeof settings.branches === "string"
                    ? JSON.parse(settings.branches)
                    : settings.branches;

                setBranches(parsedBranches);
            } catch (err) {
                console.error("Invalid branches JSON", err);
            }
        }

    }, [settings]);



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

   const tabs = [
    { label: "Room Registration", to: "/room_registration", icon: <KeyIcon fontSize="large" /> },
    { label: "Verify Documents Room Assignment", to: "/verify_document_schedule", icon: <MeetingRoomIcon fontSize="large" /> },
    { label: "Verify Documents Schedule Management", to: "/verify_schedule", icon: <ScheduleIcon fontSize="large" /> },
    { label: "Evaluator's Applicant List", to: "/evaluator_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    { label: "Entrance Exam Room Assignment", to: "/assign_entrance_exam", icon: <MeetingRoomIcon fontSize="large" /> },
    { label: "Entrance Exam Schedule Management", to: "/assign_schedule_applicant", icon: <ScheduleIcon fontSize="large" /> },
    { label: "Proctor's Applicant List", to: "/admission_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    { label: "Examination Permit", to: "/registrar_examination_profile", icon: <PersonSearchIcon fontSize="large" /> },
    { label: "Announcement", to: "/announcement_for_admission", icon: <CampaignIcon fontSize="large" /> },
  ];


    

    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(1);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));

    const [pendingDelete, setPendingDelete] = useState(null);
    const handleStepClick = (index, to) => {
        setActiveStep(index);
        navigate(to); // this will actually change the page
    };

    const [day, setDay] = useState("");
    const [roomId, setRoomId] = useState("");            // store selected room_id
    const [rooms, setRooms] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [message, setMessage] = useState("");
    const [roomQuota, setRoomQuota] = useState("");
    const [evaluator, setEvaluator] = useState("");
    const [roomNo, setRoomNo] = useState("");
    const [roomName, setRoomName] = useState("");
    const [buildingName, setBuildingName] = useState("");

    const [schoolYearId, setSchoolYearId] = useState('');
    
      useEffect(() => {
        axios.get(`${API_BASE_URL}/active_school_year`)
          .then(res => {
            setSchoolYearId(res.data[0]?.school_year_id);
          });
      }, []);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/room_list`);

                setRooms(res.data);
            } catch (err) {
                console.error("Error fetching rooms:", err);
                setMessage("Could not load rooms. Check backend /room_list.");
            }
        };
        fetchRooms();
    }, []);

    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/verify_document_schedule_list`
                );
                setSchedules(res.data);
            } catch (err) {
                console.error("Error fetching schedules:", err);
            }
        };
        fetchSchedules();
    }, []);

    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const pageId = 115;

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
    const currentYear = new Date().getFullYear();
    const minDate = `${currentYear}-01-01`;
    const maxDate = `${currentYear}-12-31`;


    const handleSaveSchedule = async (e) => {
        e.preventDefault();

        const sel = rooms.find((r) => String(r.room_id) === String(roomId));
        if (!sel) {
            setSnackbarMessage("Please select a valid building and room.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        if (!day || !buildingName || !startTime || !endTime || !roomQuota) {
            setSnackbarMessage("Please complete all required fields.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/create_verify_document_schedule`, {
                schedule_date: day,
                branch: selectedBranch, // ✅ ADD THIS
                building_description: buildingName,
                room_description: sel.room_description,
                start_time: startTime,
                end_time: endTime,
                evaluator: evaluator,
                room_quota: Number(roomQuota),
                active_school_year_id: schoolYearId,
            });

            // ✅ SUCCESS
            setSnackbarMessage("Verify document schedule created successfully ✅");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);

            // Reset form
            setDay("");
            setBuildingName("");
            setRoomId("");
            setStartTime("");
            setEndTime("");
            setRoomQuota("");
            setEvaluator("");

            // Refresh schedules
            const res = await axios.get(
                `${API_BASE_URL}/verify_document_schedule_list`
            );
            setSchedules(res.data);

        } catch (err) {
            console.error(err);

            // 🔥 SHOW BACKEND ERROR (ROOM ALREADY EXISTS)
            if (err.response?.data?.error) {
                setSnackbarMessage(err.response.data.error);
            } else {
                setSnackbarMessage("Failed to save schedule ❌");
            }

            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        }
    };


    const [editingSchedule, setEditingSchedule] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedCampusFilter, setSelectedCampusFilter] = useState("");


    const filteredSchedules = schedules.filter((s) => {
        const scheduleMonth = new Date(s.schedule_date).getMonth() + 1;

        const matchesCampus =
            !selectedCampusFilter || s.branch === selectedCampusFilter;

        const matchesMonth =
            !selectedMonth || scheduleMonth === Number(selectedMonth);

        const matchesDate =
            !selectedDate || s.schedule_date === selectedDate;

        const matchesSearch =
            !searchQuery ||
            s.building_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.room_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.evaluator?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCampus && matchesMonth && matchesDate && matchesSearch;
    });


    // ===== PAGINATION =====
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20; // change if needed

    const totalPages = Math.ceil(filteredSchedules.length / rowsPerPage);

    const paginatedSchedules = filteredSchedules.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedMonth, selectedDate, selectedCampusFilter]);


    // 📅 Dates that actually have exams in the selected month
    const availableDates = Array.from(
        new Set(
            schedules
                .filter((s) => {
                    const matchesSearch =
                        s.building_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.room_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.evaluator?.toLowerCase().includes(searchQuery.toLowerCase());

                    const matchesMonth =
                        !selectedMonth ||
                        new Date(s.schedule_date).getMonth() + 1 === Number(selectedMonth);

                    return matchesSearch && matchesMonth;
                })
                .map((s) => s.schedule_date)
        )
    ).sort();


    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);

        setSelectedBranch(schedule.branch); // ✅ ADD THIS
        setDay(schedule.schedule_date);
        setBuildingName(schedule.building_description);
        setRoomId(
            rooms.find(r => r.room_description === schedule.room_description)?.room_id || ""
        );
        setStartTime(schedule.start_time);
        setEndTime(schedule.end_time);
        setEvaluator(schedule.evaluator);
        setRoomQuota(schedule.room_quota);
    };

    // Snackbar
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // "success" | "error"

    // Delete Dialog
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

    const handleDelete = (schedule) => {
        setScheduleToDelete(schedule);
        setOpenDeleteDialog(true);
    };

    const handleUpdateSchedule = async () => {
        if (!editingSchedule) return;

        try {
            const sel = rooms.find((r) => String(r.room_id) === String(roomId));
            if (!sel) {
                setSnackbarMessage("Please select a valid building and room.");
                setSnackbarSeverity("error");
                setOpenSnackbar(true);
                return;
            }

            await axios.put(
                `${API_BASE_URL}/update_verify_document_schedule/${editingSchedule.schedule_id}`,
                {
                    schedule_date: day,
                    branch: selectedBranch, // ✅ ADD
                    building_description: buildingName,
                    room_description: sel.room_description,
                    start_time: startTime,
                    end_time: endTime,
                    evaluator: evaluator,
                    room_quota: Number(roomQuota),
                    active_school_year_id: schoolYearId
                }
            );


            setSnackbarMessage("Schedule updated successfully ✅");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);

            setEditingSchedule(null);

            // Reset form
            setDay("");
            setBuildingName("");
            setRoomId("");
            setStartTime("");
            setEndTime("");
            setRoomQuota("");
            setEvaluator("");

            // Refresh schedules
            const res = await axios.get(`${API_BASE_URL}/verify_document_schedule_list`);
            setSchedules(res.data);

        } catch (err) {
            console.error(err);
            setSnackbarMessage("Failed to update schedule ❌");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingSchedule) {
            setOpenUpdateDialog(true);
            return;
        }
        handleSaveSchedule(e);
    };


    const formatDate = (dateString) => {
        if (!dateString) return "";

        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (time) => {
        if (!time) return "";

        const [hours, minutes] = time.split(":");
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);

        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    // 🔒 Disable right-click
    // document.addEventListener('contextmenu', (e) => e.preventDefault());

    // 🔒 Block DevTools shortcuts + Ctrl+P silently
    // document.addEventListener('keydown', (e) => {
    //     const isBlockedKey =
    //         e.key === 'F12' || // DevTools
    //         e.key === 'F11' || // Fullscreen
    //         (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) || // Ctrl+Shift+I/J
    //         (e.ctrlKey && e.key.toLowerCase() === 'u') || // Ctrl+U (View Source)
    //         (e.ctrlKey && e.key.toLowerCase() === 'p');   // Ctrl+P (Print)

    //     if (isBlockedKey) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //     }
    // });

    const cellStyle = {
        border: `2px solid ${borderColor}`,
        padding: "6px",
        fontSize: "0.85rem",
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
            {/* ===== PAGE HEADER ===== */}
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
                        fontWeight: 700,
                        color: titleColor,
                        letterSpacing: 1,
                    }}
                >
                    VERIFY DOCUMENT ROOM ASSIGNMENT
                </Typography>

                <TextField
                    size="small"
                    placeholder="Search Evaluator, Building, Room"
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
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ mr: 1, color: "gray" }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            <hr style={{ border: "1px solid #ccc", width: "100%" }} />

            <br />
            <br />



            {/* ===== NAV CARDS ===== */}
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
                    <Card key={tab.to} onClick={() => handleStepClick(index, tab.to)}
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
                                backgroundColor: activeStep === index ? "#000" : "#f5d98f",
                            },
                        }}
                    >
                        <Box textAlign="center">
                            <Box sx={{ fontSize: 42, mb: 1 }}>{tab.icon}</Box>
                            <Typography fontWeight={700} fontSize={14}>
                                {tab.label}
                            </Typography>
                        </Box>
                    </Card>
                ))}
            </Box>

            <br />
            <br />
            <TableContainer
                component={Paper}
                sx={{ width: "100%", border: `2px solid ${borderColor}` }}
            >
                <Table>
                    <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", textAlign: "center" }}>
                                Existing Schedules
                            </TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>



            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    border: `2px solid ${borderColor}`,

                }}
            >



                <TableContainer component={Paper} sx={{ width: '100%', }}>
                    <Box
                        sx={{
                            border: `2px solid ${borderColor}`,
                            borderRadius: 2,
                            p: 3,
                            mb: 3,
                            display: "flex",
                            gap: 3,
                            flexWrap: "wrap",
                            backgroundColor: "#fafafa"
                        }}
                    >

                        <Box sx={{ minWidth: 220, flex: 1 }}>
                            <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
                                Campus
                            </Typography>
                            <Select
                                fullWidth
                                size="small"
                                value={selectedCampusFilter}
                                onChange={(e) => setSelectedCampusFilter(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>All Campus</em>
                                </MenuItem>
                                {branches.map((b) => (
                                    <MenuItem key={b.id} value={b.branch}>
                                        {b.branch}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>

                        {/* MONTH */}
                        <Box sx={{ minWidth: 220, flex: 1 }}>
                            <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
                                Month
                            </Typography>
                            <Select
                                fullWidth
                                size="small"
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                    setSelectedDate("");
                                }}
                            >
                                <MenuItem value="">
                                    <em>All Months</em>
                                </MenuItem>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <MenuItem key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>

                        {/* DATE */}
                        <Box sx={{ minWidth: 220, flex: 1 }}>
                            <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
                                Date
                            </Typography>
                            <Select
                                fullWidth
                                size="small"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                disabled={!selectedMonth}
                            >
                                <MenuItem value="">
                                    <em>All Dates</em>
                                </MenuItem>
                                {availableDates.map((date) => (
                                    <MenuItem key={date} value={date}>
                                        {formatDate(date)}
                                    </MenuItem>
                                ))}
                            </Select>

                        </Box>

                    </Box>


                </TableContainer>
                <TableContainer component={Paper} sx={{ width: '100%', }}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                            <TableRow>
                                <TableCell colSpan={10} sx={{ border: `2px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        flexWrap="wrap"
                                        gap={1}
                                    >
                                        {/* LEFT SIDE */}
                                        <Typography fontSize="14px" fontWeight="bold" color="white">
                                            Total Rooms: ({filteredSchedules.length})
                                        </Typography>

                                        {/* RIGHT SIDE */}
                                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">

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
                <Table size="small">

                    {/* ===== TOP HEADER WITH FILTERS (LIKE YOUR REFERENCE) ===== */}
                    <TableHead

                    >


                        {/* ===== COLUMN HEADERS ===== */}
                        <TableRow>
                            {[
                                "#",
                                "Branch",
                                "Date",
                                "Building",
                                "Room",
                                "Start",
                                "End",
                                "Evaluator",
                                "Room Slot",
                                "Actions",
                            ].map((header) => (
                                <TableCell
                                    key={header}
                                    align="center"
                                    sx={{
                                        color: "black",
                                        fontWeight: "600",
                                        fontSize: "0.9rem",
                                        backgroundColor: "f5f5f5",
                                        border: `2px solid ${borderColor}`,
                                        py: 0.8,
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    {/* ===== TABLE BODY ===== */}
                    <TableBody>
                        {paginatedSchedules.map((s, index) => (
                            <TableRow
                                key={`${s.id}-${s.schedule_date}-${s.room_description}`}
                                hover
                            >
                                <TableCell align="center" sx={cellStyle}>{index + 1}</TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    {s.branch}
                                </TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    {formatDate(s.schedule_date)}
                                </TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    {s.building_description}
                                </TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    {s.room_description}
                                </TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    {formatTime(s.start_time)}
                                </TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    {formatTime(s.end_time)}
                                </TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    {s.evaluator}
                                </TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    {s.room_quota}
                                </TableCell>
                                <TableCell align="center" sx={cellStyle}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: 1,              // spacing between buttons
                                            flexWrap: "nowrap",  // prevents wrapping
                                        }}
                                    >
                                        <Button
                                            size="small"
                                            variant="contained"
                                            sx={{
                                                backgroundColor: "green",
                                                color: "white",
                                                borderRadius: "5px",
                                                width: "100px",
                                                height: "40px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "5px",
                                            }}
                                            onClick={() => handleEdit(s)}
                                        >
                                            <EditIcon fontSize="small" />
                                            Edit
                                        </Button>

                                        <Button
                                            size="small"
                                            variant="contained"
                                            sx={{
                                                backgroundColor: "#9E0000",
                                                color: "white",
                                                borderRadius: "5px",
                                                width: "100px",
                                                height: "40px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "5px",
                                            }}
                                            onClick={() => {
                                                setScheduleToDelete(s);
                                                setOpenDeleteDialog(true);
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                            Delete
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TableContainer component={Paper} sx={{ width: '100%', }}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                            <TableRow>
                                <TableCell colSpan={10} sx={{ border: `2px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        flexWrap="wrap"
                                        gap={1}
                                    >
                                        {/* LEFT SIDE */}
                                        <Typography fontSize="14px" fontWeight="bold" color="white">
                                            Total Rooms: ({filteredSchedules.length})
                                        </Typography>

                                        {/* RIGHT SIDE */}
                                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">

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

            </Paper>





            <br />
            <br />
            {/* ===== ADD / EDIT FORM ===== */}
            <TableContainer
                component={Paper}
                sx={{
                    border: `2px solid ${borderColor}`,
                    width: "50%"
                }}
            >
                <Table size="small">
                    <TableHead
                        sx={{
                            backgroundColor: settings?.header_color || "#1976d2",
                        }}
                    >
                        <TableRow>
                            <TableCell
                                sx={{
                                    color: "white",
                                    textAlign: "center",

                                    padding: "12px",
                                    border: `1px solid ${borderColor}`,
                                }}
                            >
                                Verify Document Schedule Management
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ p: 3 }}>
                                <form onSubmit={handleSubmit}>
                                    <Grid container spacing={3}>

                                        {/* Branch */}
                                        <Grid item xs={12} md={6}>
                                            <Typography fontWeight="600" mb={0.5}>
                                                Branch
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={selectedBranch}
                                                onChange={(e) => setSelectedBranch(e.target.value)}
                                                required
                                            >
                                                {branches.map((b) => (
                                                    <MenuItem key={b.id} value={b.branch}>
                                                        {b.branch}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        {/* Exam Date */}
                                        <Grid item xs={12} md={6}>
                                            <Typography fontWeight="600" mb={0.5}>
                                                Exam Date
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="date"
                                                value={day}
                                                inputProps={{ min: minDate, max: maxDate }}
                                                onChange={(e) => setDay(e.target.value)}
                                                required
                                            />
                                        </Grid>

                                        {/* Building */}
                                        <Grid item xs={12} md={6}>
                                            <Typography fontWeight="600" mb={0.5}>
                                                Building
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={buildingName}
                                                onChange={(e) => setBuildingName(e.target.value)}
                                                required
                                            >
                                                {[...new Set(
                                                    rooms
                                                        .map((r) => r.building_description)
                                                        .filter(Boolean)
                                                )].map((b, i) => (
                                                    <MenuItem key={i} value={b}>
                                                        {b}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        {/* Room */}
                                        <Grid item xs={12} md={6}>
                                            <Typography fontWeight="600" mb={0.5}>
                                                Room
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={roomId}
                                                onChange={(e) => setRoomId(e.target.value)}
                                                required
                                            >
                                                {rooms
                                                    .filter(
                                                        (r) =>
                                                            r.building_description === buildingName
                                                    )
                                                    .map((r) => (
                                                        <MenuItem
                                                            key={r.room_id}
                                                            value={r.room_id}
                                                        >
                                                            {r.room_description}
                                                        </MenuItem>
                                                    ))}
                                            </TextField>
                                        </Grid>

                                        {/* Start Time */}
                                        <Grid item xs={6}>
                                            <Typography fontWeight="600" mb={0.5}>
                                                Start Time
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                required
                                            />
                                        </Grid>

                                        {/* End Time */}
                                        <Grid item xs={6}>
                                            <Typography fontWeight="600" mb={0.5}>
                                                End Time
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                required
                                            />
                                        </Grid>

                                        {/* Evaluator */}
                                        <Grid item xs={12}>
                                            <Typography fontWeight="600" mb={0.5}>
                                                Evaluator
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={evaluator}
                                                onChange={(e) => setEvaluator(e.target.value)}
                                                 required
                                            />
                                        </Grid>

                                        {/* Room Quota */}
                                        <Grid item xs={12}>
                                            <Typography fontWeight="600" mb={0.5}>
                                                Room Slot
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 1 }}
                                                value={roomQuota}
                                                onChange={(e) => setRoomQuota(e.target.value)}
                                                required
                                            />
                                        </Grid>

                                        {/* Submit */}
                                        <Grid item xs={12} textAlign="center" mt={2}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                sx={{
                                                    px: 6,
                                                    py: 1,
                                                    fontWeight: "bold",

                                                }}
                                            >
                                                {editingSchedule
                                                    ? "Update Schedule"
                                                    : "Save Schedule"}
                                            </Button>
                                        </Grid>

                                    </Grid>
                                </form>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>




            {/* ===== DELETE CONFIRM DIALOG ===== */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => {
                    setOpenDeleteDialog(false);
                    setScheduleToDelete(null);
                }}
            >
                <DialogTitle>Confirm Delete Schedule</DialogTitle>

                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the schedule for <b>{scheduleToDelete?.room_description}</b> in building <b>{scheduleToDelete?.building_description || "N/A"}</b> on <b>{formatDate(scheduleToDelete?.schedule_date)}</b>?
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => {
                            setOpenDeleteDialog(false);
                            setScheduleToDelete(null);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        color="error"
                        variant="contained"
                        onClick={async () => {
                            if (!scheduleToDelete) return;

                            try {
                                await axios.delete(`${API_BASE_URL}/delete_verify_document_schedule/${scheduleToDelete.schedule_id}`);
                                setSchedules(prev => prev.filter(s => s.schedule_id !== scheduleToDelete.schedule_id));

                                setSnackbarMessage("Schedule deleted ✅");
                                setSnackbarSeverity("success");
                                setOpenSnackbar(true);
                            } catch (err) {
                                console.error(err);
                                setSnackbarMessage(err.response?.data?.error || "Delete failed ❌");
                                setSnackbarSeverity("error");
                                setOpenSnackbar(true);
                            }

                            setOpenDeleteDialog(false);
                            setScheduleToDelete(null);
                        }}
                    >
                        Yes, Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openUpdateDialog}
                onClose={() => setOpenUpdateDialog(false)}
            >
                <DialogTitle>Confirm Update</DialogTitle>

                <DialogContent>
                    <Typography>
                        Do you want to modify and save the schedule?
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenUpdateDialog(false)}>
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={() => {
                            setOpenUpdateDialog(false);
                            handleUpdateSchedule();
                        }}
                    >
                        Yes, Update
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                    action={
                        pendingDelete && (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => {
                                    setScheduleToDelete(pendingDelete);
                                    setPendingDelete(null);
                                    setOpenDeleteDialog(true);
                                    setOpenSnackbar(false);
                                }}
                            >
                                CONFIRM
                            </Button>
                        )
                    }
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </Box >
    );

};

export default VerifyDocumentsSchedule;
