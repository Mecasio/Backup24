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
  FormControl,
  Select
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Card,
  TableRow,
} from "@mui/material";
import { Snackbar, Alert } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import { useNavigate, useLocation } from "react-router-dom";
import {
  People,
  School,
  SupervisorAccount,
  AdminPanelSettings,

} from "@mui/icons-material";


import API_BASE_URL from "../apiConfig";

const SuperAdminApplicantResetPassword = () => {

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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  const tabs = [
    { label: "Applicant Reset Password", to: "/superadmin_applicant_reset_password", icon: <People fontSize="large" /> },
    { label: "Student Reset Password", to: "/superadmin_student_reset_password", icon: <School fontSize="large" /> },
    { label: "Faculty Reset Password", to: "/superadmin_faculty_reset_password", icon: <SupervisorAccount fontSize="large" /> },
    { label: "Registrar Reset Password", to: "/superadmin_registrar_reset_password", icon: <AdminPanelSettings fontSize="large" /> },
  ];


  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const pageId = 81;

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
    const fetchInfo = async () => {
      if (!searchQuery) {
        setUserInfo(null);
        setSearchError("");
        return;
      }
      setLoading(true);
      setResetMsg("");
      setSearchError("");
      try {
        const res = await axios.post(`${API_BASE_URL}/superadmin-get-applicant`, {
          email: searchQuery,
        });
        setUserInfo(res.data);
      } catch (err) {
        setSearchError(err.response?.data?.message || "No applicant found.");
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchInfo, 600);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/superadmin-get-all-applicants`);
        setApplicants(res.data);
      } catch (err) {
        console.error("Failed to fetch applicants", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  const handleReset = async () => {
    if (!userInfo) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/superadmin-reset-applicant`,
        {
          email: userInfo.email,
        }
      );

      setSnackbar({
        open: true,
        message: res.data.message,
        severity: "success",
      });

    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.message || "Error resetting password.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleStatusChange = async (e) => {
    const newStatus = parseInt(e.target.value, 10);
    setUserInfo((prev) => ({ ...prev, status: newStatus }));
    try {
      await axios.post(`${API_BASE_URL}/superadmin-update-status-applicant`, {
        email: userInfo.email,
        status: newStatus,
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20; // you can change to 5, 15, etc.

  const totalPages = Math.ceil(applicants.length / rowsPerPage);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentRows = applicants.slice(indexOfFirstRow, indexOfLastRow);

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

  const headerStyle = {
    textAlign: "center",
    fontSize: "12px",
    border: `2px solid ${borderColor}`,
  };


  const handleNameClick = (applicant) => {
    // You can search by email (safest because it's unique)
    setSearchQuery(applicant.email);

    // Optional: scroll to info panel
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  // ✅ Access Guards
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Checking Access..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }
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
          sx={{
            fontWeight: "bold",
            color: titleColor,
            fontSize: "36px",
          }}
        >
          APPLICANT RESET PASSWORD
        </Typography>

        <TextField
          size="small"
          placeholder="Search Applicant Name / Email / Applicant ID"
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
      <hr style={{ border: "2px solid #ccc", width: "100%" }} />
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
                    Total Applicants: {applicants.length}
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

            {/* 🔥 COLUMN HEADERS */}
            <TableRow>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>#</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Applicant Number</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Full Name</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Birthday</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Email</TableCell>
              <TableCell sx={{ ...headerStyle, backgroundColor: "white", color: "black" }}>Status</TableCell>
            </TableRow>
          </TableHead>

          {/* 🔥 TABLE BODY */}
          <TableBody>
            {currentRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No applicants found.
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((applicant, index) => (
                <TableRow key={index}>
                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    {indexOfFirstRow + index + 1}
                  </TableCell>

                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    {applicant.applicant_number}
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
                    onClick={() => handleNameClick(applicant)}
                  >
                    {applicant.fullName}
                  </TableCell>


                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    {formatDateLong(applicant.birthdate)}
                  </TableCell>

                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    {applicant.email}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      border: `2px solid ${borderColor}`,
                      fontWeight: "bold",
                      color: applicant.status === 0 ? "green" : "red",
                    }}
                  >
                    {applicant.status === 0 ? "Active" : "Inactive"}
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
                    Total Applicants: {applicants.length}
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
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Applicant Information</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>



      {/* Info Panel */}
      <Paper sx={{ p: 3, border: `2px solid ${borderColor}`, }}>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
          <TextField
            label="Applicant Number"
            value={userInfo ? userInfo.applicant_number || "" : ""}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Email"
            value={userInfo ? userInfo.email : ""}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Full Name"
            value={userInfo ? userInfo.fullName : ""}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Birthdate"
            type="date"
            value={userInfo ? userInfo.birthdate : ""}
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <TextField
            select
            label="Status"
            value={userInfo ? userInfo.status ?? "" : ""}
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
        onClose={() =>
          setSnackbar((prev) => ({ ...prev, open: false }))
        }
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((prev) => ({ ...prev, open: false }))
          }
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default SuperAdminApplicantResetPassword;
