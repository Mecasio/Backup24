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
  Paper,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Cell, Legend, PieChart, Pie } from "recharts";
import { Tooltip } from "recharts";
import MuiTooltip from "@mui/material/Tooltip";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ExaminationProfile from "../registrar/ExaminationProfile";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import API_BASE_URL from "../apiConfig";
import EaristLogo from "../assets/EaristLogo.png";

const Dashboard = ({ profileImage, setProfileImage }) => {

  const settings = useContext(SettingsContext);

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
  const [data, setData] = useState(null);

  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ NEW access map
  const [userAccessList, setUserAccessList] = useState({});

  const pageId = 101; // SYSTEM MANAGEMENT



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

  const [dateTime, setDateTime] = useState(new Date());

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
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


  const [applicant, setApplicant] = useState({
    totalApplicants: 0,
    male: 0,
    female: 0,
    statusCounts: []
  });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/applicant-stats`)
      .then(res => {
        const data = res.data;

        const male = data.genderCounts.find(g => g.gender === "Male")?.total || 0;
        const female = data.genderCounts.find(g => g.gender === "Female")?.total || 0;

        const statusCounts = data.statusCounts.map(s => ({
          termsOfAgreement: s.termsOfAgreement === 1 ? "Agreed" : "Not Agreed",
          total: s.total
        }));

        setApplicant({
          totalApplicants: data.totalApplicants,
          male,
          female,
          statusCounts
        });
      })
      .catch(err => console.error("Applicant stats fetch error:", err));
  }, []);

  const stats = [

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
  const [months, setMonths] = useState("January");

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
  const [pieData, setPieData] = useState([]);
  const fileInputRef = useRef(null);

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

      const formData = new FormData();
      formData.append("profile_picture", file);
      formData.append("person_id", personData.person_id);

      // ✅ Use your backend route
      await axios.post(
        `${API_BASE_URL}/admin/update_registrar`,
        formData,
      );

      // ✅ Refresh the data (using correct role)
      const refreshed = await axios.get(
        `${API_BASE_URL}/api/person_data/${personData.person_id}/${role}`
      );
      setPersonData(refreshed.data);

      const baseUrl = `${API_BASE_URL}/uploads/Admin1by1/${refreshed.data.profile_image}`;
      setProfileImage(`${baseUrl}?t=${Date.now()}`);

      console.log("✅ Profile updated successfully!");
    } catch (err) {
      console.error("❌ Upload failed:", err);
    }
  };

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_school_year`)
      .then((res) => {
        const currentYear = new Date().getFullYear();
        const filteredYears = res.data.filter(
          (yearObj) => Number(yearObj.current_year) <= currentYear
        );

        setYears(filteredYears);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/ecat-summary`)
      .then((res) => {
        console.log("count", res.data);
        const d = res.data?.[0] || {};
        setPieData([
          { name: "Applied", value: Number(d.total_applied) || 0 },
          { name: "Scheduled", value: Number(d.total_scheduled) || 0 },
          { name: "Pending", value: Number(d.total_pending) || 0 },
          { name: "Finished", value: Number(d.total_finished) || 0 },
        ]);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_enrollment_statistic`, {
        params: { year: selectedYear },
      })
      .then(res => {
        setData(res.data);
      })
      .catch(err => console.error(err));
  }, [selectedYear]); // Re-run whenever selectedYear changes



  const enrollmentCOLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#3366AA"];

  if (!data || Object.keys(data).length === 0) {
    return <Typography>Loading...</Typography>;
  }

  const enrollmentData = [
    { name: "Techvoc", value: Number(data.Techvoc) || 0 },
    { name: "Graduate", value: Number(data.Graduate) || 0 },
    { name: "Undergraduate", value: Number(data.Undergraduate) || 0 },
    { name: "Returnee", value: Number(data.Returnee) || 0 },
    { name: "Shiftee", value: Number(data.Shiftee) || 0 },
    { name: "Foreign Student", value: Number(data.ForeignStudent) || 0 },
    { name: "Transferee", value: Number(data.Transferee) || 0 },
  ];


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
                mt: 2,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: 6,

                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">

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
                        src={profileImage || `${API_BASE_URL}/uploads/Admin1by1/${personData?.profile_image}`}
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
                    <Typography variant="body1" fontSize="24px" fontWeight="bold" >
                      {formattedDate}
                    </Typography>
                    <Typography variant="body1" fontSize="24px" sx={{textAlign: "center"}}>
                      {formattedTime}
                    </Typography>
                  </Box>

                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ✅ Stats Section (4 in 1 row) */}
        <Grid container spacing={2} justifyContent="center">
          {stats.map((stat, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  border: `2px solid ${borderColor}`,
                  backgroundColor: "#fef9e1",
                  height: "100px",
                  p: 3,
                  borderRadius: 3,
                  marginLeft: "10px",
                  mt: "20px",
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.03)" },
                }}
              >
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    border: `2px solid ${borderColor}`,
                    backgroundColor: stat.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 3,
                  }}
                >
                  {stat.icon}
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: subtitleColor }}
                    fontSize={20}
                    fontWeight={1200}
                  >
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stat.value}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>


        {/* Department Section */}
        <Grid container spacing={3} sx={{ mt: 6 }}>

          {/* Calendar Card */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                border: `2px solid ${borderColor}`,
                marginLeft: "10px",
                boxShadow: 3,
                p: 2,
                width: 385,
                height: 400,
                marginTop: "-50px",
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
                        <MuiTooltip
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
                        </MuiTooltip>
                      ) : (
                        <React.Fragment key={`${i}-${j}`}>{dayCell}</React.Fragment>
                      );
                    })
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Applicants Per Month */}
            <Grid item xs={12} md={12} sx={{ mt: 5 }}>
              <Card
                sx={{
                  overflow: "visible",   // 🔥 allow tooltips to appear
                  position: "relative",  // required for tooltip placement
                  p: 2,
                  marginLeft: "10px",
                  marginTop: "-20px",
                  borderRadius: 3,
                  width: 385,
                  height: 290,
                  border: `2px solid ${borderColor}`,
                  boxShadow: 3,
                }}
              >
                <CardContent sx={{ height: "100%", p: 0 }}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    mb={1}
                    sx={{ color: "maroon", pl: 2, pt: 2 }}
                  >
                    Applicants Per Month
                  </Typography>

                  <Box sx={{ height: "calc(100% - 40px)", overflow: "visible" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyApplicants}
                        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                          dataKey="month"
                          tickFormatter={(month) => {
                            const [year, m] = month.split("-");
                            return new Date(`${year}-${m}-01`).toLocaleString("default", {
                              month: "short",
                            });
                          }}
                        />

                        <YAxis allowDecimals={false} />

                        <Tooltip
                          wrapperStyle={{ zIndex: 99999 }}  // 🔥 forces tooltip to show
                          labelFormatter={(month) => {
                            const [year, m] = month.split("-");
                            return new Date(`${year}-${m}-01`).toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            });
                          }}
                          formatter={(value) => [`${value} applicants`, "Total"]}
                        />

                        <Bar dataKey="total">
                          {monthlyApplicants.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={["#FF0000", "#00C853", "#2196F3", "#FFD600", "#FF6D00"][index % 5]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                width: 900,
                height: 700,
                p: 3,
                borderRadius: 3,
                marginTop: "-45px",
                marginLeft: "-6rem",
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
              <FormControl fullWidth size="small" sx={{ mb: 3, width: 548 }}>
                <InputLabel>School Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="School Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map((yr) => (
                    <MenuItem key={yr.year_id} value={yr.year_id}>
                      {yr.current_year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
                {enrollmentData.map((entry, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: "200px",
                      height: 90,
                      p: 2,
                      backgroundColor: "#fef9e1",
                      borderRadius: 2,
                      textAlign: "center",
                      border: "2px solid black"
                    }}
                  >
                    <Typography variant="h5" fontWeight="bold">
                      {entry.value}
                    </Typography>
                    <Typography fontSize={11.5}>{entry.name}</Typography>
                  </Box>
                ))}
              </Box>
              {/* Main Content: PIE + Stats */}
              <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 2 }}>
                {/* PIE Graph */}
                <Box
                  sx={{
                    minWidth: 450,
                    minHeight: 430,
                    flex: 1,
                    mt: 2,

                    background: "#f1f3f4",
                    borderRadius: 3,
                    border: "2px solid black",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enrollmentData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={mainButtonColor}
                        strokeWidth={3}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                </Box>

                {/* Column Stats */}

              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                marginTop: "-45px",
                marginLeft: ".5rem",
                width: 495,
                height: 700,
                p: 3,
                borderRadius: 3,
                boxShadow: 3,
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                border: `2px solid ${borderColor}`,
              }}
            >
              {/* Header Row: Title + Filters */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" color={subtitleColor}>
                  Applicant Overview
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  {/* Year Dropdown */}
                  <FormControl size="small" sx={{ width: 130 }}>
                    <InputLabel>School Year</InputLabel>
                    <Select
                      value={selectedYear}
                      label="School Year"
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {years.map((yr) => (
                        <MenuItem key={yr.year_id} value={yr.year_id}>
                          {yr.current_year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Month Dropdown */}
                  <FormControl size="small" sx={{ width: 130 }}>
                    <InputLabel>Select Month</InputLabel>
                    <Select
                      label="Select Month"
                      value={months}
                      onChange={(e) => setMonths(e.target.value)}
                    >
                      <MenuItem value="January">January</MenuItem>
                      <MenuItem value="February">February</MenuItem>
                      <MenuItem value="March">March</MenuItem>
                      <MenuItem value="April">April</MenuItem>
                      <MenuItem value="May">May</MenuItem>
                      <MenuItem value="June">June</MenuItem>
                      <MenuItem value="July">July</MenuItem>
                      <MenuItem value="August">August</MenuItem>
                      <MenuItem value="September">September</MenuItem>
                      <MenuItem value="October">October</MenuItem>
                      <MenuItem value="November">November</MenuItem>
                      <MenuItem value="December">December</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      background: "#FCBEBB",
                      borderRadius: 2,
                      border: "2px solid black",
                      textAlign: "center",
                      height: 100,
                    }}
                  >
                    <Typography variant="h5" fontWeight="bold">
                      {applicant.totalApplicants}
                    </Typography>
                    <Typography fontSize={14}>Total Applicants</Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      background: "#FCBEBB",
                      borderRadius: 2,
                      textAlign: "center",
                      border: "2px solid black",
                      height: 100,
                    }}
                  >
                    <Typography variant="h5" fontWeight="bold">
                      {applicant.male}
                    </Typography>
                    <Typography fontSize={14}>Male</Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      background: "#FCBEBB",
                      borderRadius: 2,
                      border: "2px solid black",
                      textAlign: "center",
                      height: 100,
                    }}
                  >
                    <Typography variant="h5" fontWeight="bold">
                      {applicant.female}
                    </Typography>
                    <Typography fontSize={14}>Female</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                ECAT Monitoring Panel:
              </Typography>

              <Box
                sx={{
                  flexGrow: 1,
                  background: "#f1f3f4",
                  border: "2px solid black",
                  borderRadius: 3,
                  border: "2px solid black",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 14,
                  color: "#6c6c6c",
                  height: 300,
                }}
              >
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042"][i]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography>Loading chart...</Typography>
                )}
              </Box>


            </Card>
          </Grid>
        </Grid>

      </Box>
    </Box>
  );
};

export default Dashboard;
