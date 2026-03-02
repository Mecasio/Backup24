import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  FormControl,
  Select
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
} from "@mui/material";
import { Snackbar, Alert } from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";

import API_BASE_URL from "../apiConfig";
import { useNavigate, useLocation } from "react-router-dom";
import {
  People,
  School,
  SupervisorAccount,
  AdminPanelSettings,

} from "@mui/icons-material";


const SuperAdminStudentResetPassword = () => {
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


  /* =====================================
     AUTH
  ===================================== */
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 91;
  const [employeeID, setEmployeeID] = useState("");


  useEffect(() => {

    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    const empID = localStorage.getItem("employee_id");

    if (!email || role !== "registrar") {
      window.location.href = "/login";
      return;
    }

    setEmployeeID(empID);
    checkAccess(empID);

  }, []);


  const checkAccess = async (id) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/page_access/${id}/${pageId}`
      );

      setHasAccess(res.data?.page_privilege === 1);

    } catch {
      setHasAccess(false);
    }
  };

  const tabs = [
    { label: "Applicant Reset Password", to: "/superadmin_applicant_reset_password", icon: <People fontSize="large" /> },
    { label: "Student Reset Password", to: "/superadmin_student_reset_password", icon: <School fontSize="large" /> },
    { label: "Faculty Reset Password", to: "/superadmin_faculty_reset_password", icon: <SupervisorAccount fontSize="large" /> },
    { label: "Registrar Reset Password", to: "/superadmin_registrar_reset_password", icon: <AdminPanelSettings fontSize="large" /> },
  ];


  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };


  /* =====================================
     SNACKBAR
  ===================================== */
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });


  /* =====================================
     SEARCH
  ===================================== */
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [searchError, setSearchError] = useState("");


  /* =====================================
     FETCH SINGLE STUDENT
  ===================================== */
  useEffect(() => {

    if (!searchQuery) {
      setUserInfo(null);
      setSearchError("");
      return;
    }

    const fetchStudent = async () => {

      try {
        const res = await axios.post(
          `${API_BASE_URL}/superadmin-get-student`,
          { search: searchQuery }
        );

        setUserInfo(res.data);

      } catch (err) {

        setSearchError(
          err.response?.data?.message || "Student not found"
        );

        setUserInfo(null);
      }
    };

    const delay = setTimeout(fetchStudent, 600);

    return () => clearTimeout(delay);

  }, [searchQuery]);


  /* =====================================
     FETCH ALL STUDENTS
  ===================================== */
  const [students, setStudents] = useState([]);

  useEffect(() => {

    const fetchStudents = async () => {

      setLoading(true);

      try {
        const res = await axios.get(
          `${API_BASE_URL}/superadmin-get-all-students`
        );

        setStudents(res.data);

      } catch (err) {
        console.error("Fetch students error", err);
      }

      setLoading(false);
    };

    fetchStudents();

  }, []);


  /* =====================================
     RESET PASSWORD
  ===================================== */
  const handleReset = async () => {

    if (!userInfo) return;

    setLoading(true);

    try {

      const res = await axios.post(
        `${API_BASE_URL}/superadmin-reset-student`,
        { search: userInfo.email }
      );

      setSnackbar({
        open: true,
        message: res.data.message,
        severity: "success",
      });

    } catch (err) {

      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Reset failed",
        severity: "error",
      });

    } finally {
      setLoading(false);
    }
  };


  /* =====================================
     UPDATE STATUS
  ===================================== */
  const handleStatusChange = async (e) => {

    const newStatus = Number(e.target.value);

    setUserInfo(prev => ({
      ...prev,
      status: newStatus
    }));

    try {

      await axios.post(
        `${API_BASE_URL}/superadmin-update-status-student`,
        {
          email: userInfo.email,
          status: newStatus,
        }
      );

    } catch {
      console.error("Status update failed");
    }
  };


  /* =====================================
     PAGINATION
  ===================================== */
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 20;

  const totalPages = Math.ceil(students.length / rowsPerPage);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;

  const currentRows =
    students.slice(indexOfFirst, indexOfLast);


  /* =====================================
     CLICK NAME
  ===================================== */
  const handleNameClick = (student) => {
    // You can search by email (safest because it's unique)
    setSearchQuery(student.email);

    // Optional: scroll to info panel
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };




  const headerCellStyle = {
    color: "white",
    textAlign: "center",
    fontSize: "12px",
    border: `2px solid ${borderColor}`,
  };

  const paginationButtonStyle = {
    minWidth: 70,
    color: "white",
    borderColor: "white",
    backgroundColor: "transparent",
    "&:hover": {
      borderColor: "white",
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    "&.Mui-disabled": {
      color: "white",
      borderColor: "white",
      backgroundColor: "transparent",
      opacity: 1,
    },
  };

  const paginationSelectStyle = {
    fontSize: "12px",
    height: 36,
    color: "white",
    border: "2px solid white",
    backgroundColor: "transparent",
    ".MuiOutlinedInput-notchedOutline": {
      borderColor: "white",
    },
    "& svg": {
      color: "white",
    },
  };


  /* =====================================
     DATE FORMAT
  ===================================== */
  const formatDate = (date) => {

    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };


  /* =====================================
     GUARDS
  ===================================== */
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }


  /* =====================================
     STYLES
  ===================================== */
  const headerStyle = {
    textAlign: "center",
    fontSize: "12px",
    border: `2px solid ${borderColor}`,
  };


  /* =====================================
     RENDER
  ===================================== */
  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",

          mb: 2,

        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color={titleColor}
        >
          STUDENT RESET PASSWORD
        </Typography>

        <TextField
          size="small"
          placeholder="Search Student / Email / Name"
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


      {searchError &&
        <Typography color="error">{searchError}</Typography>
      }

      <hr />
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
      <TableContainer component={Paper}>

        <Table size="small">

          <TableHead>

            {/* PAGINATION BAR */}
            <TableRow>
              <TableCell
                colSpan={6}
                sx={{
                  border: `2px solid ${borderColor}`,
                  py: 0.5,
                  backgroundColor: settings?.header_color || "#1976d2",
                  color: "white",
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">

                  {/* LEFT: TOTAL COUNT */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Students: {students.length}
                  </Typography>

                  {/* RIGHT: PAGINATION CONTROLS */}
                  <Box display="flex" alignItems="center" gap={1}>

                    {/* FIRST */}
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={paginationButtonStyle}
                    >
                      First
                    </Button>

                    {/* PREV */}
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={paginationButtonStyle}
                    >
                      Prev
                    </Button>

                    {/* PAGE DROPDOWN */}
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <Select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        sx={paginationSelectStyle}
                        MenuProps={{
                          PaperProps: { sx: { maxHeight: 200 } }
                        }}
                      >
                        {Array.from({ length: totalPages }, (_, i) => (
                          <MenuItem key={i + 1} value={i + 1}>
                            Page {i + 1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography fontSize="12px" color="white">
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    {/* NEXT */}
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={paginationButtonStyle}
                    >
                      Next
                    </Button>

                    {/* LAST */}
                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={paginationButtonStyle}
                    >
                      Last
                    </Button>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>

            {/* COLUMNS */}
            <TableRow
            >
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>#</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Student No.</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Full Name</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Birthday</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Email</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Status</TableCell>
            </TableRow>

          </TableHead>


          <TableBody>

            {currentRows.length === 0 ? (

              <TableRow>
                <TableCell colSpan={5} align="center">
                  No students found
                </TableCell>
              </TableRow>

            ) : (

              currentRows.map((s, i) => (

                <TableRow key={i}>

                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    {indexOfFirst + i + 1}
                  </TableCell>

                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    {s.student_number}
                  </TableCell>

                  <TableCell
                    align="left"
                    sx={{
                      border: `2px solid ${borderColor}`,
                      color: "blue",
                      cursor: "pointer",

                      fontWeight: 500,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                    onClick={() => handleNameClick(s)}
                  >
                    {s.fullName}
                  </TableCell>

                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    {formatDate(s.birthdate)}
                  </TableCell>

                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    {s.email}
                  </TableCell>


                  <TableCell align="center"
                    sx={{
                      border: `2px solid ${borderColor}`,
                      fontWeight: "bold",
                      color: s.status === 0 ? "green" : "red",
                    }}
                  >
                    {s.status === 0 ? "Active" : "Inactive"}
                  </TableCell>

                </TableRow>
              ))
            )}

          </TableBody>

        </Table>

      </TableContainer>


      <TableContainer component={Paper}>

        <Table size="small">

          <TableHead>

            {/* PAGINATION BAR */}
            <TableRow>
              <TableCell
                colSpan={6}
                sx={{
                  border: `2px solid ${borderColor}`,
                  py: 0.5,
                  backgroundColor: settings?.header_color || "#1976d2",
                  color: "white",
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">

                  {/* LEFT: TOTAL COUNT */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Students: {students.length}
                  </Typography>

                  {/* RIGHT: PAGINATION CONTROLS */}
                  <Box display="flex" alignItems="center" gap={1}>

                    {/* FIRST */}
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={paginationButtonStyle}
                    >
                      First
                    </Button>

                    {/* PREV */}
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={paginationButtonStyle}
                    >
                      Prev
                    </Button>

                    {/* PAGE DROPDOWN */}
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <Select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        sx={paginationSelectStyle}
                        MenuProps={{
                          PaperProps: { sx: { maxHeight: 200 } }
                        }}
                      >
                        {Array.from({ length: totalPages }, (_, i) => (
                          <MenuItem key={i + 1} value={i + 1}>
                            Page {i + 1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography fontSize="12px" color="white">
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    {/* NEXT */}
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={paginationButtonStyle}
                    >
                      Next
                    </Button>

                    {/* LAST */}
                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={paginationButtonStyle}
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

      <br />
      <br />

      <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Student Information</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>


      <Paper sx={{ p: 3, border: `2px solid ${borderColor}` }}>

        <Box
          display="grid"
          gridTemplateColumns="1fr 1fr"
          gap={2}
        >

          <TextField
            label="Student Number"
            value={userInfo?.student_number || ""}
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="Email"
            value={userInfo?.email || ""}
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="Full Name"
            value={userInfo?.fullName || ""}
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="Birthdate"
            type="date"
            value={userInfo?.birthdate || ""}
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />

          <TextField
            select
            label="Status"
            value={userInfo?.status ?? ""}
            onChange={handleStatusChange}
          >
            <MenuItem value={1}>Active</MenuItem>
            <MenuItem value={0}>Inactive</MenuItem>
          </TextField>

        </Box>


        <Box mt={3}>

          <Button
            sx={{ mt: 2 }}
            variant="contained"

            disabled={!userInfo || loading}
            onClick={handleReset}
          >
            {loading ? "Processing..." : "Reset Password"}
          </Button>

        </Box>

      </Paper>


      {/* ================= SNACKBAR ================= */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() =>
          setSnackbar(p => ({ ...p, open: false }))
        }
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          onClose={() =>
            setSnackbar(p => ({ ...p, open: false }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default SuperAdminStudentResetPassword;
