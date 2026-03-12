import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";

import axios from "axios";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    MenuItem,
    FormControl,
    IconButton,
    Select,
    InputLabel,
    Avatar,
    Stack,
    Divider,
    Button,
    Paper,
    Tooltip,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie, Legend, Tooltip as RechartsTooltip } from "recharts";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../apiConfig";
import EaristLogo from "../assets/EaristLogo.png";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";


const EnrollingOfficerDashboard = ({ profileImage, setProfileImage }) => {

    const settings = useContext(SettingsContext);
    const navigate = useNavigate();

    const [titleColor, setTitleColor] = useState("#000000");
    const [subtitleColor, setSubtitleColor] = useState("#555555");
    const [borderColor, setBorderColor] = useState("#000000");
    const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
    const [stepperColor, setStepperColor] = useState("#000000");   // ✅ NEW

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
        if (settings.stepper_color) setStepperColor(settings.stepper_color);   // ✅ NEW

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


    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [enrolledCount, setEnrolledCount] = useState(0);
    const [professorCount, setProfessorCount] = useState(0);
    const [acceptedCount, setAcceptedCount] = useState(0);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [studentCount, setStudentCount] = useState(0);
    const [yearLevelCounts, setYearLevelCounts] = useState([]);
    const [years, setYears] = useState([]);
    const [months, setMonths] = useState("January");
    const [selectedYear, setSelectedYear] = useState("");
    const [enrollmentStats, setEnrollmentStats] = useState(null);

    const [employeeID, setEmployeeID] = useState("");
    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);

    // ✅ NEW access map
    const [userAccessList, setUserAccessList] = useState({});

    const pageId = 102; // SYSTEM MANAGEMENT



    // Load user & access
    useEffect(() => {
        const email = localStorage.getItem("email");
        const role = localStorage.getItem("role");
        const id = localStorage.getItem("person_id");
        const empID = localStorage.getItem("employee_id");

        if (email && role && id && empID) {
            setUserRole(role);
            setUserID(id);
            setEmployeeID(empID);

            if (role === "registrar") {
                checkAccess(empID);
                fetchUserAccessList(empID);
            } else {
                window.location.href = "/login";
            }
        } else {
            window.location.href = "/login";
        }
    }, []);

    const checkAccess = async (employeeID) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`
            );
            setHasAccess(response.data?.page_privilege === 1);
        } catch (error) {
            setHasAccess(false);
        } finally {
            setLoading(false);
        }
    };

    // ✅ SAME access list logic as Admission
    const fetchUserAccessList = async (employeeID) => {
        try {
            const { data } = await axios.get(
                `${API_BASE_URL}/api/page_access/${employeeID}`
            );

            const accessMap = data.reduce((acc, item) => {
                acc[item.page_id] = item.page_privilege === 1;
                return acc;
            }, {});

            setUserAccessList(accessMap);
        } catch (err) {
            console.error("Access list failed:", err);
        }
    };

    const formattedDate = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const storedID = localStorage.getItem("person_id");

        if (storedUser && storedRole && storedID) {
            setUser(storedUser);
            setUserRole(storedRole);
            setUserID(storedID);

            if (storedRole !== "registrar") {
                window.location.href = "/applicant_dashboard";
            }
        } else {
            window.location.href = "/login";
        }
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/enrolled-count`)
            .then(res => setEnrolledCount(res.data.total))
            .catch(err => console.error("Failed to fetch enrolled count", err));

        axios.get(`${API_BASE_URL}/api/professors`)
            .then(res => setProfessorCount(Array.isArray(res.data) ? res.data.length : 0))
            .catch(err => console.error("Failed to fetch professor count", err));

        axios.get(`${API_BASE_URL}/api/accepted-students-count`)
            .then(res => setAcceptedCount(res.data.total))
            .catch(err => console.error("Failed to fetch accepted count", err));

        axios.get(`${API_BASE_URL}/api/departments`)
            .then(res => setDepartments(res.data))
            .catch(err => console.error("Failed to fetch departments", err));
    }, []);

    useEffect(() => {
        if (selectedDepartment) {
            axios.get(`${API_BASE_URL}/statistics/student_count/department/${selectedDepartment}`)
                .then(res => setStudentCount(res.data.count))
                .catch(err => console.error("Failed to fetch student count", err));

            axios.get(`${API_BASE_URL}/statistics/student_count/department/${selectedDepartment}/by_year_level`)
                .then(res => setYearLevelCounts(res.data))
                .catch(err => console.error("Failed to fetch year level counts", err));
        }
    }, [selectedDepartment]);

    const [registrarCount, setRegistrarCount] = useState(0);

    useEffect(() => {
        const fetchRegistrarCount = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/registrar_count`);
                setRegistrarCount(res.data.count || 0);
            } catch (error) {
                console.error("Error fetching registrar count:", error);
            }
        };
        fetchRegistrarCount();
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/year_table`)
            .then((res) => setYears(res.data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/active_school_year`)
            .then((res) => {
                const active = res.data?.[0];
                if (active?.year_id) {
                    setSelectedYear(active.year_id);
                }
            })
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (years.length > 0 && !selectedYear) {
            setSelectedYear(years[0].year_id);
        }
    }, [years, selectedYear]);


    const stats = [
        {
            label: "Total Applicants",
            value: enrolledCount,
            icon: <GroupIcon fontSize="large" />,
            color: "#F6D167", // soft yellow
        },
        {
            label: "Enrolled Students",
            value: acceptedCount,
            icon: <SchoolIcon fontSize="large" />,
            color: "#84B082", // green
        },
        {
            label: "Professors",
            value: professorCount,
            icon: <PersonIcon fontSize="large" />,
            color: "#A3C4F3", // blue
        },
        {
            label: "Total Registrar",
            value: registrarCount,
            icon: <AdminPanelSettingsIcon fontSize="large" />, // new icon
            color: "#FFD8A9", // light orange
        },
    ];

    const [date, setDate] = useState(new Date());

    const days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

    const year = date.getFullYear();
    const month = date.getMonth();

    const now = new Date();
    const manilaDate = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );
    const today = manilaDate.getDate();
    const thisMonth = manilaDate.getMonth();
    const thisYear = manilaDate.getFullYear();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentDay = 1 - firstDay;

    while (currentDay <= totalDays) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            if (currentDay > 0 && currentDay <= totalDays) {
                week.push(currentDay);
            } else {
                week.push(null);
            }
            currentDay++;
        }
        weeks.push(week);
    }

    const handlePrevMonth = () => setDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setDate(new Date(year, month + 1, 1));


    const [holidays, setHolidays] = useState({});

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const res = await axios.get(
                    `https://date.nager.at/api/v3/PublicHolidays/${year}/PH`
                );
                const lookup = {};
                res.data.forEach((h) => {
                    lookup[h.date] = h;
                });
                setHolidays(lookup);
            } catch (err) {
                console.error("❌ Failed to fetch PH holidays:", err);
                setHolidays({});
            }
        };
        fetchHolidays();
    }, [year]);


    const [monthlyApplicants, setMonthlyApplicants] = useState([]);


    // After fetching monthlyApplicants from API
    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/api/applicants-per-month`)
            .then((res) => {
                const currentYear = new Date().getFullYear();

                // Build an array for all 12 months of the current year
                const months = Array.from({ length: 12 }, (_, i) => {
                    const month = String(i + 1).padStart(2, "0"); // 01 → 12
                    return `${currentYear}-${month}`;
                });

                // Merge API data with all months
                const filledData = months.map((m) => {
                    const found = res.data.find((item) => item.month === m);
                    return found ? found : { month: m, total: 0 };
                });

                setMonthlyApplicants(filledData);
            })
            .catch((err) =>
                console.error("Failed to fetch applicants per month", err)
            );
    }, []);


    const [personData, setPersonData] = useState(null);
    const [hovered, setHovered] = useState(false);
    const fileInputRef = useRef(null);

    const [userDep, setUserDepartment] = useState("");
    const [programOptions, setProgramOptions] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState("");
    const [programStats, setProgramStats] = useState({
        total_applicants: 0,
        applicants_week: 0,
        applicants_month: 0,
    });

    useEffect(() => {
        const person_id = localStorage.getItem("person_id");
        const role = localStorage.getItem("role");

        if (person_id && role) {
            axios
                .get(`${API_BASE_URL}/api/person_data/${person_id}/${role}`)
                .then((res) => setPersonData(res.data))
                .catch((err) => console.error("Failed to fetch person data:", err));
        }
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // ✅ Get the logged-in role (registrar, admin, etc.)
            const role = localStorage.getItem("role");

            // ✅ Get the registrar’s user_account_id using person_id
            const accountRes = await axios.get(
                `${API_BASE_URL}/api/get_user_account_id/${personData.person_id}`
            );
            const user_account_id = accountRes.data.user_account_id;

            const formData = new FormData();
            formData.append("profile_picture", file);

            // ✅ Use your backend route
            await axios.post(
                `${API_BASE_URL}/update_registrar/${user_account_id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            // ✅ Refresh the data (using correct role)
            const refreshed = await axios.get(
                `${API_BASE_URL}/api/person_data/${personData.person_id}/${role}`
            );
            setPersonData(refreshed.data);

            const baseUrl = `${API_BASE_URL}/uploads/${refreshed.data.profile_image}`;
            setProfileImage(`${baseUrl}?t=${Date.now()}`);

            console.log("✅ Profile updated successfully!");
        } catch (err) {
            console.error("❌ Upload failed:", err);
        }
    };

    const yearDescription = years.find((y) => String(y.year_id) === String(selectedYear))?.year_description || "";

    useEffect(() => {
        const email = localStorage.getItem("email");

        if (email) {
            axios
                .get(`${API_BASE_URL}/api/admin_data/${email}`)
                .then((res) => setUserDepartment(res.data?.dprtmnt_id || ""))
                .catch((err) => console.error("Failed to fetch person data:", err));
        }
    }, [])

    useEffect(() => {
        if (!userDep) return;
        axios
            .get(`${API_BASE_URL}/api/applied_program/${userDep}`)
            .then((res) => {
                const options = Array.isArray(res.data) ? res.data : [];
                setProgramOptions(options);
                if (!selectedProgram && options.length > 0) {
                    setSelectedProgram(options[0].curriculum_id);
                }
            })
            .catch((err) => console.error("Failed to fetch programs:", err));
    }, [userDep, selectedProgram]);

    useEffect(() => {
        if (!selectedProgram) {
            setProgramStats({
                total_applicants: 0,
                applicants_week: 0,
                applicants_month: 0,
            });
            return;
        }

        axios
            .get(`${API_BASE_URL}/api/applicants/program/stats`, {
                params: { program_id: selectedProgram },
            })
            .then((res) => {
                setProgramStats(res.data || {
                    total_applicants: 0,
                    applicants_week: 0,
                    applicants_month: 0,
                });
            })
            .catch((err) => console.error("Failed to fetch program stats:", err));
    }, [selectedProgram]);

    useEffect(() => {
        if (!yearDescription || !userDep) return;
        axios
            .get(
                `${API_BASE_URL}/get_enrollment_statistic/college/${yearDescription}/${userDep}`,
                { params: { yearDescription, userDep } }
            )
            .then((res) => {
                setEnrollmentStats(res.data);
                console.log("Data", res.data);
            })
            .catch((err) => console.error(err));
    }, [yearDescription, userDep]);


    const sections = [
        { name: "Section A", students: 30 },
        { name: "Section B", students: 40 },
        { name: "Section C", students: 28 },
        { name: "Section D", students: 18 },
        { name: "Section E", students: 24 },
        { name: "Section F", students: 16 },
        { name: "Section G", students: 22 },
    ];

    const enrollmentData = [
        { name: "Techvoc", value: Number(enrollmentStats?.Techvoc) || 0 },
        { name: "Graduate", value: Number(enrollmentStats?.Graduate) || 0 },
        { name: "Undergraduate", value: Number(enrollmentStats?.Undergraduate) || 0 },
        { name: "Returnee", value: Number(enrollmentStats?.Returnee) || 0 },
        { name: "Shiftee", value: Number(enrollmentStats?.Shiftee) || 0 },
        { name: "Foreign Student", value: Number(enrollmentStats?.ForeignStudent) || 0 },
        { name: "Transferee", value: Number(enrollmentStats?.Transferee) || 0 },
    ];

    const enrollmentColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#7E57C2", "#26A69A", "#EC407A"];


    if (loading || hasAccess === null)
       return <LoadingOverlay open={loading} message="Loading..." />;

    if (!hasAccess) return <Unauthorized />;


 const backgroundImage = settings?.bg_image
     ? `url(${API_BASE_URL}${settings.bg_image})`
     : "linear-gradient(to right, #e0e0e0, #bdbdbd)"
 
   return (
     <Box
       sx={{
         height: "calc(100vh - 100px)", // fixed viewport height
         width: "100%",
         backgroundImage,
         backgroundRepeat: "no-repeat",
         backgroundSize: "cover",
         backgroundPosition: "center",
         position: "relative",
       }}
     >
       {/* Overlay */}
       <Box
         sx={{
           position: "absolute",
           inset: 0,
         backgroundColor: "rgba(0, 0, 0, 0.1)",
           backdropFilter: "blur(0.5px)",
           WebkitBackdropFilter: "blur(0.5px)",
           zIndex: 0,
           pointerEvents: "none",
         }}
       />
 
 
      {/* Scrollable content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",        // take full height of parent
          overflowY: "auto",     // ✅ THIS allows scrolling
          padding: 2,
        }}
      >
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card
                        sx={{
                            border: `2px solid ${borderColor}`,
                            boxShadow: 3,
                            height: "140px",
                            marginLeft: "10px",
                            backgroundColor: "#fff9ec",
                            p: 2,
                            width: "99%",
                            borderRadius: 3,
                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                            "&:hover": {
                                transform: "scale(1.05)",
                                boxShadow: 6,
                            },
                        }}
                    >
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ borderRadius: "14px" }}>

                                {/* 👤 Left Section - Avatar + Welcome */}
                                <Box display="flex" alignItems="center">

                                    {/* Avatar */}
                                    <Box
                                        position="relative"
                                        display="inline-block"
                                        mr={2}
                                        onMouseEnter={() => setHovered(true)}
                                        onMouseLeave={() => setHovered(false)}
                                    >
                                        <Avatar
                                            src={profileImage || `${API_BASE_URL}/uploads/${personData?.profile_image}`}
                                            alt={personData?.fname}
                                            sx={{
                                                width: 90,
                                                height: 90,
                                                border: `2px solid ${borderColor}`,
                                                cursor: "pointer",
                                                mt: -1.5,
                                            }}
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                            {personData?.fname?.[0]}
                                        </Avatar>

                                        {hovered && (
                                            <label
                                                onClick={() => fileInputRef.current.click()}
                                                style={{
                                                    position: "absolute",
                                                    bottom: "-5px",
                                                    right: 0,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "50%",
                                                    backgroundColor: "#ffffff",
                                                    border: `2px solid ${borderColor}`,
                                                    width: "36px",
                                                    height: "36px",
                                                }}
                                            >
                                                <AddCircleIcon
                                                    sx={{
                                                        color: settings?.header_color || "#1976d2",
                                                        fontSize: 32,
                                                        borderRadius: "50%",
                                                    }}
                                                />
                                            </label>
                                        )}


                                        {/* Hidden file input */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            style={{ display: "none" }}
                                            onChange={handleFileChange}
                                        />
                                    </Box>

                                    {/* Welcome text and Employee info */}
                                    <Box sx={{ color: titleColor, }}>
                                        <Typography variant="h4" fontWeight="bold" mt={-1}>
                                            Welcome back!  {personData
                                                ? `${personData.lname}, ${personData.fname} ${personData.mname || ""}`
                                                : ""}
                                        </Typography>

                                        <Typography variant="body1" color="black" fontSize={20}>
                                            <b>Employee ID:</b> {personData?.employee_id || "N/A"}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* 📅 Right Section - Date */}
                                <Box textAlign="right" sx={{ color: "black" }}>
                                    <Typography variant="body1" fontSize="20px">
                                        {formattedDate}
                                    </Typography>
                                </Box>

                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box style={{ display: "flex" }}>
                <Card
                    sx={{
                        width: 600,
                        height: 610,
                        p: 3,
                        borderRadius: 3,
                        marginTop: 2.5,
                        marginLeft: 1.5,
                        boxShadow: 3,
                        border: `2px solid ${borderColor}`,
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Title */}
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        color={subtitleColor}
                        sx={{ textAlign: "center", mb: 1 }}
                    >
                        Enrollment Statistics
                    </Typography>

                    {/* Year Select */}
                    <FormControl fullWidth size="small" sx={{ mb: 3, width: 550 }}>
                        <InputLabel>School Year</InputLabel>
                        <Select
                            value={selectedYear}
                            label="School Year"
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            {years.map((yr) => (
                                <MenuItem key={yr.year_id} value={yr.year_id}>
                                    {yr.year_description}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Main Content: PIE + Stats */}
                    <Box sx={{ display: "flex", flexGrow: 1, gap: 2 }}>
                        {/* PIE Graph */}
                        <Box
                            sx={{
                                minWidth: 425,
                                flex: 1,
                                background: "#f1f3f4",
                                borderRadius: 3,
                                border: "1px dashed #bfc4cc",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: 14,
                                color: "#6c6c6c",
                            }}
                        >
                            {enrollmentData.some((d) => d.value > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={enrollmentData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={120}
                                            label
                                        >
                                            {enrollmentData.map((_, i) => (
                                                <Cell key={`cell-${i}`} fill={enrollmentColors[i % enrollmentColors.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography color="text.secondary">No data available</Typography>
                            )}
                        </Box>
                    </Box>
                </Card>


                <Box>
                    <Card
                        sx={{
                            marginTop: 2.5,
                            marginLeft: 2.1,
                            width: 480,
                            height: 220,
                            p: 2,
                            borderRadius: 3,
                            boxShadow: 3,
                            background: "#ffffff",
                            display: "flex",
                            border: `2px solid ${borderColor}`,
                            flexDirection: "column",
                        }}
                    >
                        {/* Header: Title + Department Dropdown */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                            <Typography variant="h6" fontWeight="bold" color={subtitleColor}>
                                Total Student Per Program
                            </Typography>
                        </Box>

                        <FormControl size="small" sx={{ mb: 1.5 }}>
                            <InputLabel>Select Program</InputLabel>
                            <Select
                                label="Select Program"
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                            >
                                {programOptions.map((opt) => (
                                    <MenuItem key={opt.curriculum_id} value={opt.curriculum_id}>
                                        {opt.program_code} - {opt.program_description}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* Stats Boxes */}
                        <Grid container spacing={1}>
                            <Grid item xs={4}>
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        backgroundColor: "#fef9e1",
                                        border: "2px solid black",

                                        textAlign: "center",
                                        height: 90,
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold" sx={{ marginTop: "9px" }}>
                                        {programStats.total_applicants || 0}
                                    </Typography>
                                    <Typography fontSize={12}>Total Applicants</Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={4}>
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        backgroundColor: "#fef9e1",
                                        border: "2px solid black",

                                        textAlign: "center",
                                        height: 90,
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold" sx={{ marginTop: "9px" }}>
                                        {programStats.applicants_week || 0}
                                    </Typography>
                                    <Typography fontSize={12}>This Week</Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={4}>
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        backgroundColor: "#fef9e1",
                                        border: "2px solid black",

                                        textAlign: "center",
                                        height: 90,
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold" sx={{ marginTop: "9px" }}>
                                        {programStats.applicants_month || 0}
                                    </Typography>
                                    <Typography fontSize={12}>This Month</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Card>

                    <Card
                        sx={{
                            width: 480,
                            height: 370,
                            p: 3,
                            marginTop: 2.5,
                            marginLeft: 2,
                            border: `2px solid ${borderColor}`,
                            borderRadius: 3,
                            boxShadow: 3,
                            background: "#ffffff",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* Title */}
                        <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{ textAlign: "center", mb: 2, color: subtitleColor }}
                        >
                            Class Population Tracker
                        </Typography>

                        {/* Sections List */}
                        <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden" }}>
                            {sections && sections.length > 0 ? (
                                sections.map((section, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            mb: 1,
                                            p: 1,
                                            borderRadius: 2,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            border: "2px solid black",
                                            "&:hover": {
                                                backgroundColor: mainButtonColor,

                                                color: "white",
                                            },
                                        }}
                                    >
                                        <Typography fontWeight="medium" style={{ padding: "5px" }}>{section.name}</Typography>
                                        <Typography style={{ padding: "5px" }}>
                                            {section.students} students enrolled
                                        </Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
                                    No data available
                                </Typography>
                            )}
                        </Box>
                    </Card>
                </Box>

                <Box>
                    <Card
                        sx={{
                            border: `2px solid ${borderColor}`,
                            marginLeft: 2.2,
                            boxShadow: 3,
                            p: 2,
                            width: 425,
                            height: 400,
                            marginTop: 2.5,
                            display: "flex",
                            borderRadius: "10px",
                            transition: "transform 0.2s ease",
                            "&:hover": { transform: "scale(1.03)" },
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                    >
                        <CardContent sx={{ p: 0, width: "100%" }}>
                            {/* Header with month + year + arrows */}
                            <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{
                                    backgroundColor: settings?.header_color || "#1976d2",
                                    color: "white",
                                    border: `2px solid ${borderColor}`,
                                    borderBottom: "none", // prevent double border with body
                                    borderRadius: "8px 8px 0 0",
                                    padding: "10px 8px",
                                }}
                            >
                                <Grid item>
                                    <IconButton size="small" onClick={handlePrevMonth} sx={{ color: "white" }}>
                                        <ArrowBackIos fontSize="small" />
                                    </IconButton>
                                </Grid>
                                <Grid item>
                                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                        {date.toLocaleString("default", { month: "long" })} {year}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <IconButton size="small" onClick={handleNextMonth} sx={{ color: "white" }}>
                                        <ArrowForwardIos fontSize="small" />
                                    </IconButton>
                                </Grid>
                            </Grid>

                            {/* Calendar Table */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(7, 1fr)",
                                    borderLeft: `2px solid ${borderColor}`,
                                    borderRight: `2px solid ${borderColor}`,
                                    borderBottom: `2px solid ${borderColor}`,
                                    borderTop: `2px solid ${borderColor}`,
                                    borderRadius: "0 0 8px 8px",
                                    overflow: "hidden",

                                }}
                            >
                                {/* Days of the week */}
                                {days.map((day, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            backgroundColor: "#f3f3f3",
                                            textAlign: "center",
                                            py: 1,
                                            fontWeight: "bold",
                                            borderBottom: `1px solid ${borderColor}`,
                                        }}
                                    >
                                        {day}
                                    </Box>
                                ))}

                                {/* Dates */}
                                {weeks.map((week, i) =>
                                    week.map((day, j) => {
                                        if (!day) {
                                            return (
                                                <Box
                                                    key={`${i}-${j}`}
                                                    sx={{
                                                        height: 45,
                                                        backgroundColor: "#fff",
                                                    }}
                                                />
                                            );
                                        }

                                        const isToday = day === today && month === thisMonth && year === thisYear;
                                        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                        const isHoliday = holidays[dateKey];

                                        const dayCell = (
                                            <Box
                                                sx={{
                                                    height: 45,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "50%",
                                                    backgroundColor: isToday
                                                        ? settings?.header_color || "#1976d2"
                                                        : isHoliday
                                                            ? "#E8C999"
                                                            : "#fff",
                                                    color: isToday ? "white" : "black",
                                                    fontWeight: isHoliday ? "bold" : "500",
                                                    cursor: isHoliday ? "pointer" : "default",
                                                    "&:hover": {
                                                        backgroundColor: isHoliday ? "#F5DFA6" : "#000",
                                                        color: isHoliday ? "black" : "white",
                                                    },
                                                }}
                                            >
                                                {day}
                                            </Box>
                                        );

                                        return isHoliday ? (
                                            <Tooltip
                                                key={`${i}-${j}`}
                                                title={
                                                    <>
                                                        <Typography fontWeight="bold">{isHoliday.localName}</Typography>
                                                        <Typography variant="caption">{isHoliday.date}</Typography>
                                                    </>
                                                }
                                                arrow
                                                placement="top"
                                            >
                                                {dayCell}
                                            </Tooltip>
                                        ) : (
                                            <React.Fragment key={`${i}-${j}`}>{dayCell}</React.Fragment>
                                        );
                                    })
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                    <Card
                        sx={{
                            marginTop: 2.5,
                            marginLeft: 2.1,
                            width: 425,
                            height: 190,
                            p: 3,
                            borderRadius: 3,
                            boxShadow: 3,
                            border: `2px solid ${borderColor}`,
                            background: "#ffffff",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {/* Title */}
                        <Typography
                            variant="h6"
                            fontWeight="bold"
                            color={subtitleColor}
                            sx={{ mb: 2 }}
                        >
                            Enrolled Student
                        </Typography>

                        {/* Buttons */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ textTransform: "none" }}
                                onClick={() => navigate("/student_numbering_per_college")}
                            >
                                Assign Student Number
                            </Button>

                            <Button
                                variant="contained"
                                color="secondary"
                                fullWidth
                                sx={{ textTransform: "none" }}
                                onClick={() => navigate("/course_tagging_for_college")}
                            >
                                Assign Subject To Student
                            </Button>
                        </Box>
                    </Card>
                </Box>
            </Box>
        </Box>
        </Box>
    );
};

export default EnrollingOfficerDashboard;
