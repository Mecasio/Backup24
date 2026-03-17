import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    LinearProgress,
    Chip,
    TableContainer,
    FormControl,
    Paper,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Table,
    TableHead,
    TableRow,
    TableCell,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import KeyIcon from "@mui/icons-material/Key";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import CampaignIcon from "@mui/icons-material/Campaign";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";


const ScheduleHoverTile = () => {
    const navigate = useNavigate();
    const settings = useContext(SettingsContext);

    const [titleColor, setTitleColor] = useState("#000000");
    const [borderColor, setBorderColor] = useState("#000000");

    const [schedules, setSchedules] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredSchedules, setFilteredSchedules] = useState([]);

    const [schoolYears, setSchoolYears] = useState([]);
    const [schoolSemester, setSchoolSemester] = useState([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
    const [selectedSchoolSemester, setSelectedSchoolSemester] = useState("");

    const [person, setPerson] = useState({
        fromDate: "",
        toDate: "",
        fromTime: "",
        toTime: "",
    });


  const tabs = [
    { label: "Room Registration", to: "/room_registration", icon: <KeyIcon fontSize="large" /> },
    // { label: "Verify Documents Room Assignment", to: "/verify_document_schedule", icon: <MeetingRoomIcon fontSize="large" /> },
    // { label: "Verify Documents Schedule Management", to: "/verify_schedule", icon: <ScheduleIcon fontSize="large" /> },
    // { label: "Evaluator's Applicant List", to: "/evaluator_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    { label: "Entrance Exam Room Assignment", to: "/assign_entrance_exam", icon: <MeetingRoomIcon fontSize="large" /> },
    // { label: "Entrance Exam Schedule Management", to: "/assign_schedule_applicant", icon: <ScheduleIcon fontSize="large" /> },
    { label: "Proctor's Applicant List", to: "/admission_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    // { label: "Examination Permit", to: "/registrar_examination_profile", icon: <PersonSearchIcon fontSize="large" /> },
    { label: "Announcement", to: "/announcement_for_admission", icon: <CampaignIcon fontSize="large" /> },
  ];


    const [activeStep, setActiveStep] = useState(2);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));

    const handleStepClick = (index, to) => {
        setActiveStep(index);
        navigate(to); // this will actually change the page
    };


    useEffect(() => {
        if (!settings) return;
        if (settings.title_color) setTitleColor(settings.title_color);
        if (settings.border_color) setBorderColor(settings.border_color);
    }, [settings]);

    // Fetch school years, semesters, and active selection in order
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const yearsRes = await axios.get(`${API_BASE_URL}/get_school_year/`);
                setSchoolYears(yearsRes.data);

                const semRes = await axios.get(`${API_BASE_URL}/get_school_semester/`);
                setSchoolSemester(semRes.data);

                const activeRes = await axios.get(`${API_BASE_URL}/active_school_year`);
                if (activeRes.data.length > 0) {
                    setSelectedSchoolYear(activeRes.data[0].year_id);
                    setSelectedSchoolSemester(activeRes.data[0].semester_id);
                } else {
                    // fallback to first available year/semester
                    setSelectedSchoolYear(yearsRes.data[0]?.year_id || "");
                    setSelectedSchoolSemester(semRes.data[0]?.semester_id || "");
                }
            } catch (err) {
                console.error("Error fetching school data:", err);
            }
        };
        fetchInitialData();
    }, []);

    const [buildingList, setBuildingList] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState("");

    // Fetch schedules once school year & semester are set
    useEffect(() => {
        const fetchSchedules = async () => {
            if (!selectedSchoolYear || !selectedSchoolSemester) return;
            try {
                const res = await axios.get(
                    `${API_BASE_URL}/exam_schedules_with_count/${selectedSchoolYear}/${selectedSchoolSemester}`
                );
                setSchedules(res.data);
                setFilteredSchedules(res.data);

                const uniqueBuildings = [...new Set(res.data.map(s => s.building_description))];
                setBuildingList(uniqueBuildings);
            } catch (err) {
                console.error("Error fetching schedule tiles:", err);
            }
        };
        fetchSchedules();
    }, [selectedSchoolYear, selectedSchoolSemester]);

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const parseDateOnlyLocal = (value) => {
            if (!value) return null;
            const datePart = String(value).split("T")[0];
            const [y, m, d] = datePart.split("-").map(Number);
            if (!y || !m || !d) return null;
            return new Date(y, m - 1, d);
        };

        const filtered = schedules.filter((s) => {
            const proctor = s.proctor || "";
            const building = s.building_description || "";

            const matchesSearch =
                proctor.toLowerCase().includes(lowerQuery) ||
                building.toLowerCase().includes(lowerQuery) ||
                (s.room_description || "").toLowerCase().includes(lowerQuery);

            const matchesBuilding = selectedBuilding === "" || building === selectedBuilding;

            const scheduleDate = parseDateOnlyLocal(s.day_description);
            if (!scheduleDate) return false;
            let fromDate = parseDateOnlyLocal(person.fromDate);
            let toDate = parseDateOnlyLocal(person.toDate);
            if (toDate) toDate.setHours(23, 59, 59, 999);
            if (fromDate && toDate && fromDate > toDate) {
                const swappedFrom = parseDateOnlyLocal(person.toDate);
                const swappedTo = parseDateOnlyLocal(person.fromDate);
                if (swappedTo) swappedTo.setHours(23, 59, 59, 999);
                fromDate = swappedFrom;
                toDate = swappedTo;
            }

            const matchesDate =
                (!fromDate || scheduleDate >= fromDate) &&
                (!toDate || scheduleDate <= toDate);

            // Convert times to comparable HH:mm
            const scheduleStart = s.start_time ? s.start_time.slice(0, 5) : null;
            const scheduleEnd = s.end_time ? s.end_time.slice(0, 5) : null;
            const fromTime = person.fromTime ? person.fromTime : null;
            const toTime = person.toTime ? person.toTime : null;

            const matchesTime =
                (!fromTime || scheduleStart >= fromTime) &&
                (!toTime || scheduleEnd <= toTime);

            return matchesSearch && matchesBuilding && matchesDate && matchesTime;
        });

        setFilteredSchedules(filtered);
    }, [searchQuery, selectedBuilding, person, schedules]);




    const handleSchoolYearChange = (e) => setSelectedSchoolYear(e.target.value);
    const handleSchoolSemesterChange = (e) => setSelectedSchoolSemester(e.target.value);

    const selectedYearLabel =
        schoolYears.find((sy) => String(sy.year_id) === String(selectedSchoolYear))
            ? `${schoolYears.find((sy) => String(sy.year_id) === String(selectedSchoolYear)).current_year}-${schoolYears.find((sy) => String(sy.year_id) === String(selectedSchoolYear)).next_year
            }`
            : "selected year";

    const selectedSemesterLabel =
        schoolSemester.find((sem) => String(sem.semester_id) === String(selectedSchoolSemester))
            ?.semester_description || "selected semester";

    const formatTime12 = (timeString) => {
        if (!timeString) return "";
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    };

    const getOccupancyColor = (current, quota) => {
        const ratio = current / quota;
        if (ratio === 1) return "#d32f2f";
        if (ratio >= 0.7) return "#f57c00";
        return "#388e3c";
    };

    return (
        <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
            {/* Title + Search Row */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    mb: 2,
                }}
            >
                {/* LEFT – Title */}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: "bold",
                        color: titleColor,
                        fontSize: "36px",
                    }}
                >
                    ADMISSION ROOM MANAGEMENT
                </Typography>


                {/* RIGHT – Search Field */}
                <Box sx={{ display: "flex", alignItems: "center", mt: { xs: 2, md: 0 } }}>
                    <TextField
                        size="small"
                        placeholder="Search Proctor / Building / Room"
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
                </Box>
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
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Application Date</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>

            <TableContainer
                component={Paper}
                sx={{
                    maxWidth: "100%",
                    border: `2px solid ${borderColor}`,
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 4,
                    }}
                >
                    {/* LEFT SIDE: School Year, Semester, Building, Room, From Time, To Time */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {/* School Year */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography fontSize={13} sx={{ mb: 1 }}>School Year</Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Select
                                    value={selectedSchoolYear}
                                    onChange={handleSchoolYearChange}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                maxHeight: 200,
                                                backgroundColor: "#fff",
                                                marginTop: 1,
                                            },
                                        },
                                    }}
                                >
                                    {schoolYears.map((sy) => (
                                        <MenuItem value={sy.year_id} key={sy.year_id}>
                                            {sy.current_year} - {sy.next_year}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Semester */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography fontSize={13} sx={{ mb: 1 }}>Semester</Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Select
                                    value={selectedSchoolSemester}
                                    onChange={handleSchoolSemesterChange}
                                    sx={{ width: 200 }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                marginTop: 1,
                                            }
                                        }
                                    }}
                                >
                                    {schoolSemester.map((sem) => (
                                        <MenuItem value={sem.semester_id} key={sem.semester_id}>
                                            {sem.semester_description}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Building */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography fontSize={13} sx={{ mb: 1 }}>Building</Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Select
                                    value={selectedBuilding}
                                    onChange={(e) => setSelectedBuilding(e.target.value)}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                maxHeight: 200,
                                                backgroundColor: "#fff",
                                                marginTop: 1,
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem value="">All Buildings</MenuItem>
                                    {buildingList.map((bldg, i) => (
                                        <MenuItem key={i} value={bldg}>{bldg}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Room */}


                        {/* From Time */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography fontSize={13} sx={{ mb: 1 }}>From Time</Typography>
                            <TextField
                                type="time"
                                size="small"
                                value={person.fromTime}
                                onChange={(e) => setPerson(prev => ({ ...prev, fromTime: e.target.value }))}
                                sx={{ minWidth: 120 }}
                            />
                        </Box>

                        {/* To Time */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography fontSize={13} sx={{ mb: 1 }}>To Time</Typography>
                            <TextField
                                type="time"
                                size="small"
                                value={person.toTime}
                                onChange={(e) => setPerson(prev => ({ ...prev, toTime: e.target.value }))}
                                sx={{ minWidth: 120 }}
                            />
                        </Box>
                    </Box>

                    {/* RIGHT SIDE: From Date & To Date */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {/* From Date */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography fontSize={13} sx={{ mb: 1 }}>From Date</Typography>
                            <TextField
                                type="date"
                                size="small"
                                value={person.fromDate}
                                onChange={(e) => setPerson(prev => ({ ...prev, fromDate: e.target.value }))}
                                sx={{ minWidth: 150 }}
                            />
                        </Box>

                        {/* To Date */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography fontSize={13} sx={{ mb: 1 }}>To Date</Typography>
                            <TextField
                                type="date"
                                size="small"
                                value={person.toDate}
                                onChange={(e) => setPerson(prev => ({ ...prev, toDate: e.target.value }))}
                                sx={{ minWidth: 150 }}
                            />
                        </Box>
                    </Box>
                </Box>
            </TableContainer>


            <br />
            <br />

            <Grid container spacing={3}>
                {filteredSchedules.length === 0 && (
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                border: `2px dashed ${borderColor}`,
                                borderRadius: 2,
                                p: 3,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: 250,
                                backgroundColor: "#fafafa",
                            }}
                        >
                            <Typography sx={{ color: "gray", fontSize: 18 }}>
                                There is no schedule in this Academic School Year ({selectedYearLabel}, {" "}
                                {selectedSemesterLabel}).
                            </Typography>
                        </Box>
                    </Grid>
                )}
                {filteredSchedules.map((schedule) => (
                    <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={schedule.schedule_id}>
                        <Card
                            onClick={() =>
                                navigate(
                                    `/proctor_applicant_list?proctor=${encodeURIComponent(
                                        schedule.proctor
                                    )}&schedule=${schedule.schedule_id}`
                                )
                            }
                            sx={{
                                cursor: "pointer",
                                borderRadius: "16px",
                                overflow: "hidden",
                                boxShadow: 4,
                                border: `2px solid ${borderColor}`,
                                transition: "0.3s ease",
                                "&:hover": {
                                    transform: "translateY(-4px) scale(1.03)",
                                    boxShadow: 6,
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    backgroundColor: settings?.header_color || "#1976d2",
                                    color: "#fff",
                                    p: 1.5,
                                }}
                            >
                                <Typography fontWeight="bold" fontSize="16px" sx={{ textAlign: "center" }}>
                                    Schedule #{schedule.schedule_id}
                                </Typography>
                            </Box>

                            <CardContent>
                                <Typography fontSize="14px" mb={0.5}>
                                    <strong>Proctor:</strong> {schedule.proctor}
                                </Typography>
                                <Typography fontSize="14px" mb={0.5}>
                                    <strong>Building:</strong> {schedule.building_description}
                                </Typography>
                                <Typography fontSize="14px" mb={0.5}>
                                    <strong>Room:</strong> {schedule.room_description}
                                </Typography>
                                <Typography fontSize="14px" mb={0.5}>
                                    <strong>Date:</strong>{" "}
                                    {new Date(schedule.day_description).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </Typography>
                                <Typography fontSize="14px" mb={1}>
                                    <strong>Time:</strong> {formatTime12(schedule.start_time)} -{" "}
                                    {formatTime12(schedule.end_time)}
                                </Typography>

                                <Typography fontSize="14px" mb={0.5} fontWeight="bold">
                                    <strong>Applicants:</strong>{" "}
                                    {schedule.current_occupancy}/{schedule.room_quota}
                                </Typography>

                                <LinearProgress
                                    variant="determinate"
                                    value={(schedule.current_occupancy / schedule.room_quota) * 100}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: "#eee",
                                        "& .MuiLinearProgress-bar": {
                                            backgroundColor: getOccupancyColor(
                                                schedule.current_occupancy,
                                                schedule.room_quota
                                            ),
                                        },
                                    }}
                                />

                                <Box sx={{ mt: 1 }}>
                                    {schedule.current_occupancy >= schedule.room_quota ? (
                                        <Chip label="Full" color="error" size="small" />
                                    ) : schedule.current_occupancy / schedule.room_quota >= 0.7 ? (
                                        <Chip label="Almost Full" color="warning" size="small" />
                                    ) : (
                                        <Chip label="Available" color="success" size="small" />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ScheduleHoverTile;
