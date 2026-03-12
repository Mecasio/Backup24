import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  Button,
  FormControl,
  IconButton,
  Select,
  InputLabel,
  Avatar,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Legend, PieChart, Pie } from "recharts";
import { Tooltip } from "recharts";
import MuiTooltip from "@mui/material/Tooltip";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import API_BASE_URL from "../apiConfig";
import EaristLogo from "../assets/EaristLogo.png";


const AdmissionOfficerDashboard = ({ profileImage, setProfileImage }) => {

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
  const [years, setYears] = useState("2025");
  const [months, setMonths] = useState("January");


  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ NEW access map
  const [userAccessList, setUserAccessList] = useState({});

  const pageId = 103; // SYSTEM MANAGEMENT



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

  const [persons, setPersons] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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

  const [pieData, setPieData] = useState([]);

    useEffect(() => {
      axios
        .get(`${API_BASE_URL}/year_table/`)
        .then((res) => setYears(res.data))
        .catch((err) => console.error(err));
    }, [])
  
    useEffect(() => {
      axios.get(`${API_BASE_URL}/api/ecat-summary`)
        .then((res) => {
          console.log("count", res.data);
          const d = res.data[0];
          setPieData([
            { name: "Applied", value: Number(d.total_applied) || 0 },
            { name: "Scheduled", value: Number(d.total_scheduled) || 0 },
            { name: "Pending", value: Number(d.total_pending) || 0 },
            { name: "Finished", value: Number(d.total_finished) || 0 },
          ]);
        })
        .catch((err) => console.error(err));
    }, []);
  
  const [selectedApplicantStatus, setSelectedApplicantStatus] = useState("");

  const [applicants, setApplicants] = useState([]);

  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [adminData, setAdminData] = useState({ dprtmnt_id: "" });
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

  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
  const [department, setDepartment] = useState([]);

  const filteredPersons = persons.filter((personData) => {
    const programInfo = allCurriculums.find(
      (opt) => opt.curriculum_id?.toString() === personData.program?.toString()
    );

    const matchesDepartment =
      selectedDepartmentFilter === "" ||
      programInfo?.dprtmnt_name === selectedDepartmentFilter;

    const matchesProgramFilter =
      selectedProgramFilter === "" ||
      programInfo?.program_code === selectedProgramFilter;

    const applicantAppliedYear = new Date(personData.created_at).getFullYear();
    const schoolYear = schoolYears.find((sy) => sy.year_id === selectedSchoolYear);

    const matchesSchoolYear =
      selectedSchoolYear === "" ||
      (schoolYear &&
        String(applicantAppliedYear) === String(schoolYear.current_year));

    const matchesSemester =
      selectedSchoolSemester === "" ||
      String(personData.middle_code) === String(selectedSchoolSemester);

    return (
      matchesDepartment &&
      matchesProgramFilter &&
      matchesSchoolYear &&
      matchesSemester
    );
  });



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




  const maxButtonsToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));


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
        setMonthlyApplicants(
          filledData.map(item => ({
            ...item,
            month: String(item.month)   // 👈 force it into string
          }))
        );

      })
      .catch((err) =>
        console.error("Failed to fetch applicants per month", err)
      );
  }, []);


  const [personData, setPersonData] = useState(null);
  const [hovered, setHovered] = useState(false);
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

  const [monthApplicants, setMonthApplicants] = useState(0);

  useEffect(() => {
    const fetchApplicantStats = async () => {
      try {
        const total = await axios.get(`${API_BASE_URL}/api/applicants/total`);
        const week = await axios.get(`${API_BASE_URL}/api/applicants/week`);
        const month = await axios.get(`${API_BASE_URL}/api/applicants/month`);
        const year = await axios.get(`${API_BASE_URL}/api/applicants/year`);

        setTotalApplicants(total.data.total);
        setWeekApplicants(week.data.total);
        setMonthApplicants(month.data.total);
        setYearApplicants(year.data.total);
      } catch (err) {
        console.error("Failed to fetch applicant stats:", err);
      }
    };

    fetchApplicantStats();
  }, []);


  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);


  useEffect(() => {
    if (!selectedDepartmentId) return;

    const fetchStats = async () => {
      try {
        const total = await axios.get(`/api/applicants/department/total?department_id=${selectedDepartmentId}`);
        const week = await axios.get(`/api/applicants/department/week?department_id=${selectedDepartmentId}`);
        const month = await axios.get(`/api/applicants/department/month?department_id=${selectedDepartmentId}`);
        const year = await axios.get(`/api/applicants/department/year?department_id=${selectedDepartmentId}`);

        setTotalApplicants(total.data.total);
        setWeekApplicants(week.data.total);
        setMonthApplicants(month.data.total);
        setYearApplicants(year.data.total);
      } catch (err) {
        console.error("Failed to fetch:", err);
      }
    };

    fetchStats();
  }, [selectedDepartmentId]);

  const [totalApplicants, setTotalApplicants] = useState(0);
  const [weekApplicants, setWeekApplicants] = useState(0);
  const [yearApplicants, setYearApplicants] = useState(0);

  // Helper functions
  const isThisWeek = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  };

  const isThisMonth = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // Update totals whenever person or filters change
  useEffect(() => {
    const applicants = Array.isArray(person) ? person : [];

    const filtered = applicants.filter((p) => {
      const matchesDepartment =
        !selectedDepartmentFilter || p.department_id === selectedDepartmentFilter;
      const matchesProgram =
        !selectedProgramFilter || p.program_code === selectedProgramFilter;
      return matchesDepartment && matchesProgram;
    });

    setTotalApplicants(filtered.length);
    setWeekApplicants(filtered.filter((p) => isThisWeek(p.date_applied)).length);
    setYearApplicants(filtered.filter((p) => isThisMonth(p.date_applied)).length);
  }, [person, selectedDepartmentFilter, selectedProgramFilter]);


  useEffect(() => {
    const fetchFilteredApplicants = async () => {
      try {
        const res = await axios.get("/api/applicants/filter", {
          params: {
            department_id: selectedDepartmentId || null,
            program_code: selectedProgramFilter || null,
          }
        });
        setApplicants(res.data);
      } catch (err) {
        console.error("Error filtering applicants", err);
      }
    };

    fetchFilteredApplicants();
  }, [selectedDepartmentId, selectedProgramFilter]);


  const [pendingScheduleApplicants, setPendingScheduleApplicants] = useState([]);

  useEffect(() => {
    const fetchPendingSchedule = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/verified-ecat-applicants`);
        setPendingScheduleApplicants(res.data);
      } catch (err) {
        console.error("Failed to fetch pending schedule applicants", err);
        setPendingScheduleApplicants([]);
      }
    };

    fetchPendingSchedule();
  }, []);

  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/get-scheduled-applicants`)
      .then(res => {
        console.log("Scheduled applicants response:", res.data);
        setScheduledCount(res.data.total); // Use the total
      })
      .catch(err => console.error("Axios error:", err));
  }, []);


  const [completedExam, setCompletedExam] = React.useState(0);


  useEffect(() => {
    axios.get(`http://localhost:5000/exam/completed-count`) // backend endpoint
      .then(res => {
        // Assuming your backend returns { total: number }
        setCompletedExam(res.data.total);
      })
      .catch(err => console.error("Error fetching completed exam count:", err));
  }, []);

  if (loading || hasAccess === null)
   return <LoadingOverlay open={loading} message="Loading..." />;

  if (!hasAccess) return <Unauthorized />;


  const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];



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
        <Box>
          <Card
            sx={{
              width: 400,
              height: 400,
              marginTop: 2.5,
              marginLeft: 1.1,
              border: `2px solid ${borderColor}`,
              borderRadius: 3,
              p: 2,
              boxShadow: 3,
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ textAlign: "center", color: subtitleColor, marginBottom: "1rem" }}
            >
              ECAT Monitoring Panel
            </Typography>

            <Box
              sx={{
                flexGrow: 1,
                background: "#f1f3f4",
                border: "2px solid black",
                borderRadius: 3,
                border: "1px dashed #bfc4cc",
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
          <Card
            sx={{
              width: 400,
              height: 230,
              marginTop: 2.5,
              marginLeft: 1.1,
              border: `2px solid ${borderColor}`,
              borderRadius: 3,
              p: 2,
              boxShadow: 3,
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
            }}
          >
            {/* Title */}
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ textAlign: "center", color: subtitleColor, mb: 3 }}
            >
              Admission Create
            </Typography>

            {/* Buttons Container */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                px: 2,
                
              }}
            >
              <Button
                variant="contained"
                fullWidth
                sx={{ textTransform: "none", py: 1.5, fontSize: "18px", height: "50px", border: `2px solid ${borderColor}`, background: mainButtonColor }}
                onClick={() => {
                  window.location.href = "/applicant_list_admin";
                }}
              >
                Applicant List
              </Button>

           
              <Button
                variant="contained"
                fullWidth
                sx={{ textTransform: "none", py: 1.5, fontSize: "18px", height: "50px", background: mainButtonColor, border: `2px solid ${borderColor}`, }}
                onClick={() => {
                  window.location.href = "/room_registration";
                }}
              >
                Room Registration
              </Button>
            </Box>
          </Card>
        </Box>

        <Card
          sx={{
            width: 600,
            height: 650,
            marginTop: 2.5,
            marginLeft: 2.1,
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

          {/* Stats Boxes */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#fef9e1",
                  borderRadius: 2,
                  border: "2px solid black",
                  textAlign: "center",
                  height: 90,
                }}
              >
                <Typography variant="h5" fontWeight="bold">{totalApplicants}</Typography>
                <Typography fontSize={14}>Total Applicants</Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#fef9e1",
                  borderRadius: 2,
                  textAlign: "center",
                  border: "2px solid black",
                  height: 90,
                }}
              >
                <Typography variant="h5" fontWeight="bold">{weekApplicants}</Typography>
                <Typography fontSize={14}>This Week</Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#fef9e1",
                  border: "2px solid black",
                  borderRadius: 2,
                  textAlign: "center",
                  height: 90,
                }}
              >
                <Typography variant="h5" fontWeight="bold">{monthApplicants}</Typography>
                <Typography fontSize={14}>This Month</Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Bar Graph Label */}
          <Typography
            variant="subtitle1"
            fontWeight={600}

            sx={{ mb: 1, color: subtitleColor }}
          >
            Applicants Per Month:
          </Typography>

          {/* Bar Graph Placeholder */}
          <Box
            sx={{
              flexGrow: 1,
              background: "#f1f3f4",
              borderRadius: 3,
              border: "2px solid black",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 14,
              color: "#6c6c6c",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyApplicants}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => {
                    const [, m] = value.split("-");
                    return MONTH_SHORT[Number(m) - 1];
                  }}
                />

                <YAxis />

                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.1)" }}
                  formatter={(value) => [`${value} applicants`, "Total"]}
                  labelFormatter={(label) => {
                    const [year, m] = label.split("-");
                    return `${MONTH_SHORT[Number(m) - 1]} ${year}`;
                  }}
                />

                <Bar dataKey="total">
                  {monthlyApplicants.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={mainButtonColor}
                    />
                  ))}

                </Bar>
              </BarChart>
            </ResponsiveContainer>



          </Box>
        </Card>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              border: `2px solid ${borderColor}`,
              marginLeft: 2.2,
              boxShadow: 3,
              p: 2,
              width: 480,
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

          <Card
            sx={{
              width: 480,
              height: 230,
              marginTop: 2.5,
              marginLeft: 2.1,
              p: 2,
              borderRadius: 3,
              boxShadow: 3,
              background: "#ffffff",
              display: "flex",
              border: `2px solid ${borderColor}`,
              flexDirection: "column",
            }}
          >  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }} color={subtitleColor}>
              Total Applicant Per Department
            </Typography>

            {/* Header: Title + Department Dropdown */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>


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
                  <MenuItem value="">Select College</MenuItem>
                  {department.map((dep) => (
                    <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_name}>
                      {dep.dprtmnt_name} ({dep.dprtmnt_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>


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

            {/* Stats Boxes */}
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: "#FCBEBB",
                    textAlign: "center",
                    border: "2px solid black",
                    height: 90,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">{totalApplicants}</Typography>
                  <Typography fontSize={12}>Total Applicants</Typography>
                </Box>
              </Grid>

              <Grid item xs={4}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    border: "2px solid black",
                    background: "#FCBEBB",
                    textAlign: "center",
                    height: 90,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">{weekApplicants}</Typography>
                  <Typography fontSize={12}>This Week</Typography>
                </Box>
              </Grid>

              <Grid item xs={4}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: "#FCBEBB",
                    border: "2px solid black",
                    textAlign: "center",
                    height: 90,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">{yearApplicants}</Typography>
                  <Typography fontSize={12}>This Month</Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Box>
    </Box>
    </Box>
  );
};

export default AdmissionOfficerDashboard;

