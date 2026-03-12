import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  InputLabel,
  Typography,
  Paper,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Switch, FormControlLabel } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  Settings,
} from "@mui/icons-material";

import Unauthorized from "../components/Unauthorized";
import API_BASE_URL from "../apiConfig";
import LoadingOverlay from "../components/LoadingOverlay";

const passwordRules = [
  { label: "Minimum of 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least one lowercase letter (e.g. abc)", test: (pw) => /[a-z]/.test(pw) },
  { label: "At least one uppercase letter (e.g. ABC)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least one number (e.g. 123)", test: (pw) => /\d/.test(pw) },
  { label: "At least one special character (! # $ ^ * @)", test: (pw) => /[!#$^*@]/.test(pw) },
];

const RegistrarResetPassword = () => {
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
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validations, setValidations] = useState([]);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [otpRequired, setOtpRequired] = useState(true);

  // Fetch OTP setting
  useEffect(() => {
    const fetchOtpSetting = async () => {
      try {
        const person_id = localStorage.getItem("person_id");
        const res = await axios.get(`${API_BASE_URL}/auth/get-otp-setting/user/${person_id}`);
        setOtpRequired(res.data.require_otp === 1);
      } catch (err) {
        console.error("Failed to load OTP setting for user", err);
      }
    };
    fetchOtpSetting();
  }, []);

  // Update OTP setting
  const handleOtpToggle = async (event) => {
    const newValue = event.target.checked;
    setOtpRequired(newValue);

    try {
      const person_id = localStorage.getItem("person_id");
      const res = await axios.post(`${API_BASE_URL}/auth/update-otp-setting`, {
        type: "user",
        person_id,
        require_otp: newValue ? 1 : 0,
      });

      setSnack({
        open: true,
        message: res.data.message,
        severity: "success",
      });
    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Failed to update OTP setting",
        severity: "error",
      });
    }
  };


  const pageId = 73;

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
    const results = passwordRules.map((rule) => rule.test(newPassword));
    setValidations(results);
  }, [newPassword]);

  const isValid = validations.every(Boolean) && newPassword === confirmPassword;

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const person_id = localStorage.getItem("person_id");
      const response = await axios.post(
        `${API_BASE_URL}/registrar-change-password`,
        {
          person_id,
          currentPassword,
          newPassword,
        }
      );

      setSnack({
        open: true,
        message: response.data.message,
        severity: "success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Error updating password.",
        severity: "error",
      });
    }
  };

  const toggleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };



  // 🔄 Access and loading handling
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Checking Access..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  return (
      <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      {/* 🔝 Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
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
          SECURITY SETTINGS
        </Typography>
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      {/* 🔒 Password Form Section */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Paper
          elevation={6}
          sx={{
            p: 3,
            width: "40%",
            maxWidth: "540px",
            borderRadius: 4,
            backgroundColor: "#fff",
            border: `2px solid ${borderColor}`,

            boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
            mb: 12,
          }}
        >
          {/* Lock Icon Header */}
          <Box textAlign="center" mb={2}>
            <Settings
              sx={{
                fontSize: 80,
                color: "#000000",
                backgroundColor: "#f0f0f0",
                borderRadius: "50%",
                p: 1,
              }}
            />
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1, color: subtitleColor, }}>
              SETTINGS
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              Update your password to keep your account secure.
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />
          <Box mt={3} display="flex" flexDirection="column" alignItems="center">
            <InputLabel sx={{ color: "red", mb: 1, textAlign: "center" }}>
              Turning this off may compromise your account, especially if
              <br /> your login is saved on another device.
            </InputLabel>

            <FormControlLabel
              control={
                <Switch
                  checked={otpRequired}
                  onChange={handleOtpToggle}
                  sx={{
                    height: 50,

                    width: 90, // adjust width proportionally
                    '& .MuiSwitch-switchBase': {
                      top: 3,
                      left: 3,
                      padding: 0,
                      color: "black",

                      '&.Mui-checked': {
                        transform: 'translateX(40px)',
                        color: "black"

                      },
                    },
                    '& .MuiSwitch-thumb': {
                      width: 44,
                      height: 44,

                    },
                    '& .MuiSwitch-track': {
                      borderRadius: 10,
                    },
                  }}
                />
              }
              label="Require OTP during login"
              sx={{ m: 0 }}
            />
          </Box>


          {/* Form */}
          <form onSubmit={handleUpdate}>
            <Box mb={2} mt={3}>
              <InputLabel>Current Password</InputLabel>
              <TextField
                fullWidth
                type={showPassword.current ? "text" : "password"}
                size="small"
                variant="outlined"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleShowPassword("current")} edge="end">
                        {showPassword.current ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box mb={2}>
              <InputLabel>New Password</InputLabel>
              <TextField
                fullWidth
                type={showPassword.new ? "text" : "password"}
                size="small"
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleShowPassword("new")} edge="end">
                        {showPassword.new ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box mb={2}>
              <InputLabel>Confirm Password</InputLabel>
              <TextField
                fullWidth
                type={showPassword.confirm ? "text" : "password"}
                size="small"
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={Boolean(confirmPassword && confirmPassword !== newPassword)}
                helperText={
                  confirmPassword && confirmPassword !== newPassword
                    ? "Passwords do not match"
                    : ""
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleShowPassword("confirm")} edge="end">
                        {showPassword.confirm ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Your new password must include:
            </Typography>

            <List dense disablePadding>
              {passwordRules.map((rule, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    {validations[i] ? (
                      <CheckCircle sx={{ color: "green" }} />
                    ) : (
                      <Cancel sx={{ color: "red" }} />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={rule.label} />
                </ListItem>
              ))}
            </List>

            <Typography variant="body2" color="warning.main" sx={{ mt: 1, mb: 2 }}>
              Note: You are required to change your password to continue using the system securely.
            </Typography>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!isValid}
              sx={{
                py: 1.2,
                borderRadius: 2,
                backgroundColor: mainButtonColor,
                border: `2px solid ${borderColor}`,
                textTransform: "none",
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
            >
              Update Password
            </Button>
          </form>
          {/* 🔀 OTP Toggle */}

        </Paper>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegistrarResetPassword;
