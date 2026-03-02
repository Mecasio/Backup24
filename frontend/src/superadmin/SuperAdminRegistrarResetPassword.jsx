import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  Card
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

const SuperAdminRegistrarResetPassword = () => {
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



  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const pageId = 83;

  const [employeeID, setEmployeeID] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);  // for search/reset


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

  const tabs = [
    { label: "Applicant Reset Password", to: "/superadmin_applicant_reset_password", icon: <People fontSize="large" /> },
    { label: "Student Reset Password", to: "/superadmin_student_reset_password", icon: <School fontSize="large" /> },
    { label: "Faculty Reset Password", to: "/superadmin_faculty_reset_password", icon: <SupervisorAccount fontSize="large" /> },
    { label: "Registrar Reset Password", to: "/superadmin_registrar_reset_password", icon: <AdminPanelSettings fontSize="large" /> },
  ];


  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(3);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [registrars, setRegistrars] = useState([]);

  useEffect(() => {
    const fetchRegistrars = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/superadmin-get-all-registrar`);
        setRegistrars(res.data);
      } catch (err) {
        console.error("Failed to fetch registrars", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrars();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const totalPages = Math.ceil(registrars.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = registrars.slice(indexOfFirstRow, indexOfLastRow);

  const handleNameClick = (r) => {
    setSearchQuery(r.employee_id); // or r.email if backend supports
    setUserInfo(r); // 🔥 instantly fill panel without waiting backend
  };

  useEffect(() => {
    const fetchInfo = async () => {
      if (!searchQuery) {
        setUserInfo(null);
        setSearchError("");
        return;
      }

      setSearchLoading(true);  // ✅ use searchLoading
      setResetMsg("");
      setSearchError("");

      try {
        const res = await axios.post(
          `${API_BASE_URL}/superadmin-get-registrar`,
          { search: searchQuery }
        );
        setUserInfo(res.data);
      } catch (err) {
        setSearchError(err.response?.data?.message || "No registrar found.");
        setUserInfo(null);
      } finally {
        setSearchLoading(false);  // ✅ use searchLoading
      }
    };

    const delayDebounce = setTimeout(fetchInfo, 600);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);



  const handleReset = async () => {
    if (!userInfo) return;

    setSearchLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/forgot-password-registrar`,
        { email: userInfo.email }
      );

      setSnackbar({
        open: true,
        message: res.data.message,
        severity: "success",
      });

    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Error resetting password",
        severity: "error",
      });
    } finally {
      setSearchLoading(false);
    }
  };


  // ✅ Change account status
  const handleStatusChange = async (e) => {
    const newStatus = parseInt(e.target.value, 10);
    setUserInfo((prev) => ({ ...prev, status: newStatus }));

    try {
      await axios.post(
        `${API_BASE_URL}/superadmin-update-status-registrar`,
        {
          email: userInfo.email,
          status: newStatus,
        }
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
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


  // ================= STYLES =================
  const headerCellStyle = {
    color: "white",
    textAlign: "center",
    fontSize: "12px",
    border: `2px solid ${borderColor}`,
  };



  const headerStyle = {
    textAlign: "center",
    fontSize: "12px",
    border: `2px solid ${borderColor}`,
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


  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Checking Access..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  // ✅ Main Component
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
          sx={{ fontWeight: "bold", color: titleColor, fontSize: "36px" }}
        >
          REGISTRAR RESET PASSWORD
        </Typography>

        <TextField
          size="small"
          placeholder="Search Employee ID / Name / Email Address"
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

      {searchError && <Typography color="error">{searchError}</Typography>}
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
      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">

          {/* 🔥 TOP HEADER (Pagination + Total) */}
          <TableHead>
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
                    Total Registrars: {registrars.length}
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

            <TableRow>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>#</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Employee ID</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Full Name</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Email</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Status</TableCell>
            </TableRow>
          </TableHead>

          {/* BODY */}
          <TableBody>
            {currentRows.map((r, index) => (
              <TableRow key={index}>
                <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>{indexOfFirstRow + index + 1}</TableCell>

                <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>{r.employee_id}</TableCell>

                <TableCell
                  sx={{
                    border: `2px solid ${borderColor}`,
                    color: "blue",
                    cursor: "pointer",
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                  onClick={() => handleNameClick(r)}
                >
                  {r.fullName}
                </TableCell>

                <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>{r.email}</TableCell>

                <TableCell
                  sx={{
                    border: `2px solid ${borderColor}`,
                    fontWeight: "bold",
                    color: r.status === 1 ? "green" : "red",
                    textAlign: "center"
                  }}
                >
                  {r.status === 1 ? "Active" : "Inactive"}
                </TableCell>
              </TableRow>
            ))}
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
                    Total Registrars: {registrars.length}
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
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Registrar Information</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <Paper sx={{ p: 3, border: `2px solid ${borderColor}` }}>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
          gap={2}
        >
          <TextField
            label="Employee ID"
            value={userInfo?.employee_id || ""}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Email"
            value={userInfo?.email || ""}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Full Name"
            value={userInfo?.fullName || ""}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            select
            label="Status"
            value={userInfo?.status ?? ""}
            fullWidth
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

            onClick={handleReset}
            disabled={!userInfo || loading}
          >
            {loading ? "Processing..." : "Reset Password"}
          </Button>
        </Box>
      </Paper>




      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default SuperAdminRegistrarResetPassword;
