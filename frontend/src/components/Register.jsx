import React, { useState, useEffect, useContext, useRef } from "react";
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Container.css';
import Logo from '../assets/Logo.png';
import {
  Container,
  Box,
  Snackbar,
  Alert,
  TextField,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Badge as BadgeIcon,
  Cake as CakeIcon,
} from "@mui/icons-material";
// import ReCAPTCHA from "react-google-recaptcha";
import { SettingsContext } from "../App"; // ✅ Access settings from context
import API_BASE_URL from "../apiConfig";
import AnnouncementSlider from "../components/AnnouncementSlider";

const Register = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [openReminder, setOpenReminder] = useState(true);

  useEffect(() => {
    if (settings) {
      if (settings.title_color) setTitleColor(settings.title_color);
      if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
      if (settings.border_color) setBorderColor(settings.border_color);
      if (settings.main_button_color) setMainButtonColor(settings.main_button_color);

    }
  }, [settings]);

  // const [capVal, setCapVal] = useState(null);
  const [usersData, setUserData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resendTimer, setResendTimer] = useState(180);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const otpInputRef = useRef(null);
  const [tempEmail, setTempEmail] = useState("");
  const navigate = useNavigate();

  const handleChanges = (e) => {
    const { name, value } = e.target;
    setUserData(prevState => ({ ...prevState, [name]: value }));
  };

  const [currentYear, setCurrentYear] = useState("");

  useEffect(() => {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
    setCurrentYear(new Date(now).getFullYear());
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnack(prev => ({ ...prev, open: false }));
  };

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthday, setBirthday] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academicProgram, setAcademicProgram] = useState("");

  const handleRegister = async () => {
    if (isSubmitting) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!lastName || !firstName || !middleName || !birthday || !academicProgram) {

      setSnack({
        open: true,
        message: "Please complete all personal information fields!",
        severity: "warning",
      });
      return;
    }

    if (!emailRegex.test(usersData.email)) {
      setSnack({
        open: true,
        message: "Please enter a valid email address!",
        severity: "error",
      });
      return;
    }


    // ✅ Password match check
    if (usersData.password !== confirmPassword) {
      setSnack({
        open: true,
        message: "Passwords do not match!",
        severity: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/request-otp`, {
        email: usersData.email,
      });

      setTempEmail(usersData.email);
      setShowOtpModal(true);
      startResendTimer();

      setSnack({
        open: true,
        message: "OTP sent to your email",
        severity: "success",
      });

      setIsSubmitting(false);
      return;

    } catch (error) {
      setSnack({
        open: true,
        message: error.response?.data?.message || "Failed to send OTP",
        severity: "error",
      });

      setIsSubmitting(false);
      return;
    }

  };



  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOtp = async () => {
    try {
      setLoadingOtp(true);

      await axios.post(`${API_BASE_URL}/auth/request-otp`, {
        email: tempEmail,
      });

      startResendTimer();
      setSnack({ open: true, message: "OTP resent!", severity: "success" });
    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Failed to resend OTP",
        severity: "error",
      });
    }

    setLoadingOtp(false);
  };

  const verifyOtp = async () => {
    setLoadingOtp(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        ...usersData,
        lastName,
        firstName,
        middleName,
        birthday,
        academicProgram,
        otp,
      });

      if (!response.data.success) {
        // Show error message if registration failed
        setSnack({
          open: true,
          message: response.data.message,
          severity: "error",
        });
        return;
      }

      // Success message: highlight "one-time registration"
      setSnack({
        open: true,
        message: "🎉 Congratulations! You just created an account. Note: you can only register once with this email.",
        severity: "success",
      });

      // Close OTP modal
      setShowOtpModal(false);

      // Delay navigation so user can read snackbar
      setTimeout(() => navigate("/login_applicant"), 3000);

    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Something went wrong. Please try again.",
        severity: "error",
      });
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleKeyDownRegister = (e) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleRegister();
    }
  };

  const handleKeyDownOtp = (e) => {
    if (e.key === "Enter" && !loadingOtp) {
      verifyOtp();
    }
  };


  // ✅ Use background from settings or fallback image
  const backgroundImage = settings?.bg_image
    ? `url(${API_BASE_URL}${settings.bg_image})`
    : "url(/default-bg.jpg)";

  return (
    <>
      <Box
        sx={{
          backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",

          }}
          maxWidth={false}
        >
          <AnnouncementSlider style={{ marginTop: "-350px" }} />
          <div
            style={{ border: "5px solid black", marginLeft: -100, marginTop: "-50px" }}
            className="Container"
          >
            <div
              className="Header"
              style={{
                backgroundColor: settings?.header_color || "#1976d2", // ✅ default blue
                padding: "1rem 0",
                borderBottom: "3px solid black",
              }}
            >

              <div className="HeaderTitle">
                <div className="CircleCon">
                  <img
                    src={
                      settings?.logo_url
                        ? `${API_BASE_URL}${settings.logo_url}`
                        : Logo
                    }
                    alt="Logo"
                  />
                </div>
              </div>
              <div className="HeaderBody">
                <strong style={{
                  color: "white",
                }}>{(settings?.company_name || "Company Name")
                  .split(" ")
                  .reduce((acc, word, index) => {
                    if (index % 4 === 0 && index !== 0) {
                      acc.push(<br key={`br-${index}`} />);
                    }
                    acc.push(word + " ");
                    return acc;
                  }, [])}
                </strong>
                <p>Student Information System</p>
              </div>
            </div>

            <div className="Body">

              <div className="TextField" style={{ position: "relative" }}>
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDownRegister}
                  className="border"
                  style={{
                    paddingLeft: "2.5rem",
                    border: `2px solid ${borderColor}`,
                  }}
                />
                <BadgeIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)",
                  }}
                />
              </div>

              <div className="TextField" style={{ position: "relative" }}>
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDownRegister}
                  className="border"
                  style={{
                    paddingLeft: "2.5rem",
                    border: `2px solid ${borderColor}`,
                  }}
                />
                <PersonIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)",
                  }}
                />
              </div>

              <div className="TextField" style={{ position: "relative" }}>
                <label>Middle Name</label>
                <input
                  type="text"
                  placeholder="Enter your middle name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDownRegister}
                  className="border"
                  style={{
                    paddingLeft: "2.5rem",
                    border: `2px solid ${borderColor}`,
                  }}
                />
                <PersonIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)",
                  }}
                />
              </div>

              <div className="TextField" style={{ position: "relative" }}>
                <label>Birthday</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  onKeyDown={handleKeyDownRegister}
                  className="border"
                  style={{
                    paddingLeft: "2.5rem",
                    border: `2px solid ${borderColor}`,
                  }}
                />
                <CakeIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)",
                  }}
                />
              </div>

              <div className="TextField" style={{ position: "relative" }}>
                <label>Academic Program</label>
                <select
                  value={academicProgram}
                  onChange={(e) => setAcademicProgram(e.target.value)}
                  className="border"
                  style={{
                    paddingLeft: "1rem",
                    height: "45px",
                    border: `2px solid ${borderColor}`,
                    width: "100%",
                  }}
                >
                  <option value="">Select Program</option>
                  <option value="0">Undergraduate</option>
                  <option value="1">Graduate</option>
                  <option value="2">Techvoc</option>
                </select>
              </div>


              <div className="TextField" style={{ position: "relative" }}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  className="border"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={usersData.email}
                  onChange={handleChanges}
                  onKeyDown={handleKeyDownRegister}
                  style={{ paddingLeft: "2.5rem", border: `2px solid ${borderColor}` }}
                />
                <EmailIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)"
                  }}
                />
              </div>

              <div className="TextField" style={{ position: "relative" }}>
                <label htmlFor="password">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="border"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={usersData.password}
                  onChange={handleChanges}
                  onKeyDown={handleKeyDownRegister}
                  required
                  style={{ paddingLeft: "2.5rem", border: `2px solid ${borderColor}` }}
                />
                <LockIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    color: "rgba(0,0,0,0.3)",
                    outline: "none",
                    position: "absolute",
                    top: "2.5rem",
                    right: "1rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </button>
              </div>

              <div className="TextField" style={{ position: "relative", }}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="border"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDownRegister}
                  required
                  disabled={!usersData.password} // ✅ Disabled until password is filled
                  style={{
                    paddingLeft: "2.5rem",
                    border: `2px solid ${borderColor}`,
                    backgroundColor: !usersData.password ? "#f0f0f0" : "white", // Optional: gray background when disabled
                    cursor: !usersData.password ? "not-allowed" : "text",
                  }}
                />
                <LockIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    color: "rgba(0,0,0,0.3)",
                    outline: "none",
                    position: "absolute",
                    top: "2.5rem",
                    right: "1rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </button>
              </div>


              {/* CAPTCHA */}
              {/* <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <ReCAPTCHA
                  sitekey="6Lfem44rAAAAAEeAexdQxvN0Lpm1V4KPu1bBxaGy"
                  onChange={(val) => setCapVal(val)}
                />
              </Box> */}

              {/* Register Button — disabled until CAPTCHA is solved */}
              <div
                onClick={!isSubmitting ? handleRegister : null}
                style={{
                  pointerEvents: !isSubmitting ? "auto" : "none",
                  opacity: !isSubmitting ? 1 : 0.5,
                  cursor: !isSubmitting ? "pointer" : "not-allowed",
                  marginTop: "40px",
                  backgroundColor: mainButtonColor,
                  height: "50px",
                  border: `2px solid ${borderColor}`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </div>


              <div className="LinkContainer RegistrationLink" style={{ margin: '0.1rem 0rem' }}>
                <p>Already Have an Account?</p>
                <span><Link to={'/login_applicant'}>Sign In here</Link></span>
              </div>
            </div>

            <div className="Footer">
              <div className="FooterText">
                &copy; {currentYear} {settings?.company_name || "EARIST"} <br />
                Student Information System. <br />
                All rights reserved.
              </div>
            </div>
          </div>
        </Container>

        <Modal open={showOtpModal} onClose={() => setShowOtpModal(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "#fff",
              p: 4,
              border: "3px solid black",
              borderRadius: "12px",
              width: 350,
              height: 350,
              boxShadow: 24,
              textAlign: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowOtpModal(false)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                backgroundColor: "#6D2323",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <h2 style={{ color: "#6D2323", marginBottom: "10px", fontSize: "16px" }}>
              Enter the 6-digit OTP<br />
              <small style={{ color: "#555", fontWeight: "normal", fontSize: "16px" }}>
                Note: This email can only be used to register once.
              </small>
            </h2>


            <TextField
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              inputRef={otpInputRef}
              onKeyDown={handleKeyDownOtp}
              inputProps={{
                maxLength: 6,
                style: { textAlign: "center", fontSize: "18px" },
              }}
              sx={{ mb: 2 }}
            />

            <button
              onClick={verifyOtp}
              disabled={loadingOtp}
              style={{
                width: "100%",
                backgroundColor: mainButtonColor,
                color: "white",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                fontWeight: "bold",
              }}
            >
              {loadingOtp ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              onClick={resendOtp}
              disabled={resendTimer > 0}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "2px solid black",
                background: "white",
                cursor: resendTimer > 0 ? "not-allowed" : "pointer",
              }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </button>
          </Box>
        </Modal>


        {/* Snackbar Notification */}
        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={snack.severity} onClose={handleClose} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>

        <Dialog
          open={openReminder}
          onClose={() => setOpenReminder(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
            ⚠️ Important Reminder for Applicants
          </DialogTitle>

          <DialogContent>
            <Typography sx={{ mt: 1, textAlign: "justify", fontSize: "16px" }}>
              Please make sure that all information you provide in your application is
              correct and complete before submitting.
            </Typography>

            <Typography sx={{ mt: 2, textAlign: "justify", fontSize: "16px" }}>
              Creating multiple accounts or submitting more than one application is
              strictly not allowed. Each applicant should only register and apply once.
            </Typography>

            <Typography sx={{ mt: 2, textAlign: "justify", fontSize: "16px" }}>
              If multiple accounts or duplicate applications are detected, your
              application may be rejected or automatically disqualified from the
              admission process.
            </Typography>

            <Typography sx={{ mt: 2, textAlign: "justify", fontSize: "16px" }}>
              Please wait for the official announcement regarding the results of the
              application screening.
            </Typography>

            <Typography sx={{ mt: 2, textAlign: "center", fontWeight: "bold" }}>
              Thank you for your cooperation.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setOpenReminder(false)}
              sx={{

                fontWeight: "bold",
                textTransform: "none",
                minWidth: "120px",
              }}
            >
              I Understand
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default Register;