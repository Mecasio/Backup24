import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Container, Box, Snackbar, Alert } from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import "../styles/Container.css";
import Logo from "../assets/Logo.png";
import { SettingsContext } from "../App";
import API_BASE_URL from "../apiConfig";
import AnnouncementSlider from "../components/AnnouncementSlider";
const Login = ({ setIsAuthenticated }) => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");

  useEffect(() => {
    if (settings) {
      if (settings.title_color) setTitleColor(settings.title_color);
      if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
      if (settings.border_color) setBorderColor(settings.border_color);
      if (settings.main_button_color)
        setMainButtonColor(settings.main_button_color);
    }
  }, [settings]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [currentYear, setCurrentYear] = useState("");
  const [loginType, setLoginType] = useState("applicant");
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
    setCurrentYear(new Date(now).getFullYear());
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setSnack({
        open: true,
        message: "Please fill in all fields",
        severity: "warning",
      });
      return;
    }

    try {
      const apiUrl =
        loginType === "applicant"
          ? `${API_BASE_URL}/auth/login_applicant`
          : `${API_BASE_URL}/auth/login`;

      const response = await axios.post(
        apiUrl,
        { email, password },
        { headers: { "Content-Type": "application/json" } },
      );

      if (!response.data.success) {
        setSnack({
          open: true,
          message: response.data.message,
          severity: "error",
        });
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("applicantEmail", response.data.email);
      localStorage.setItem("email", response.data.email);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("person_id", response.data.person_id);
      localStorage.setItem("first_name", response.data.first_name || "");
      localStorage.setItem("last_name", response.data.last_name || "");
      localStorage.setItem("middle_name", response.data.middle_name || "");
      localStorage.setItem("birthOfDate", response.data.birthOfDate || "");
      localStorage.setItem("age", response.data.age || "");

      localStorage.setItem("applicantEmail", response.data.email);

      setIsAuthenticated(true);
      setSnack({
        open: true,
        message: "Login Successfully",
        severity: "success",
      });

      if (loginType === "applicant") {
        navigate("/applicant_dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setSnack({
        open: true,
        message: error.response?.data?.message || "Invalid credentials",
        severity: "error",
      });
    }
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  const backgroundImage = settings?.bg_image
    ? `url(${API_BASE_URL}${settings.bg_image})`
    : "linear-gradient(to right, #f5f5f5, #fafafa)";
  const logoSrc = settings?.logo_url
    ? `${API_BASE_URL}${settings.logo_url}`
    : Logo;

  return (
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
        <AnnouncementSlider />
        <div
          style={{ border: "5px solid black", marginLeft: 100, gap: "250px" }}
          className="Container"
        >
          {/* ✅ Header (same as LoginEnrollment) */}
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
                <img src={logoSrc} alt="Logo" />
              </div>
            </div>
            <div className="HeaderBody">
              <strong
                style={{
                  color: "white",
                }}
              >
                {settings?.company_name || "Company Name"}
              </strong>
              <p>Student Information System</p>
            </div>
          </div>

          {/* ✅ Body (same layout as LoginEnrollment) */}
          <div className="Body">
            <div className="TextField" style={{ position: "relative" }}>
              <label htmlFor="loginType">Login As</label>
              <select
                id="loginType"
                name="loginType"
                value={loginType}
                onChange={(e) => {
                  setLoginType(e.target.value);
                  if (e.target.value === "applicant") {
                    navigate("/login_applicant");
                  } else {
                    navigate("/login");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "0.8rem 2.5rem 0.8rem 2.5rem",
                  borderRadius: "6px",
                  border: `2px solid ${borderColor}`,
                  fontSize: "1rem",
                  backgroundColor: "white",
                  outline: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  cursor: "pointer",
                }}
              >
                <option sx={{ border: "2px solid black" }} value="user">
                  Student / Faculty / Registrar
                </option>
                <option sx={{ border: "2px solid black" }} value="applicant">
                  Applicant
                </option>
              </select>

              <PersonIcon
                style={{
                  position: "absolute",
                  top: "2.5rem",
                  left: "0.7rem",
                  color: "rgba(0,0,0,0.4)",
                }}
              />
              <ArrowDropDownIcon
                style={{
                  position: "absolute",
                  top: "2.5rem",
                  right: "0.7rem",
                  color: "rgba(0,0,0,0.4)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Email */}
            <div className="TextField" style={{ position: "relative" }}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                className="border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  paddingLeft: "2.5rem",
                  border: `2px solid ${borderColor}`,
                }}
              />
              <EmailIcon
                style={{
                  position: "absolute",
                  top: "2.5rem",
                  left: "0.7rem",
                  color: "rgba(0,0,0,0.4)",
                }}
              />
            </div>

            {/* Password */}
            <div className="TextField" style={{ position: "relative" }}>
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="border"
                style={{
                  paddingLeft: "2.5rem",
                  border: `2px solid ${borderColor}`,
                }}
              />
              <LockIcon
                style={{
                  position: "absolute",
                  top: "2.5rem",
                  left: "0.7rem",
                  color: "rgba(0,0,0,0.4)",
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
                  cursor: "pointer",
                }}
              >
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </button>
            </div>

            {/* Login Button */}
            <div
              style={{
                height: "50px",
                borderRadius: "10px",
                border: `2px solid ${borderColor}`,
                backgroundColor: mainButtonColor, // ✅ same color (prevents mismatch)
              }}
              className="Button"
              onClick={handleLogin}
            >
              <span>Log In</span>
            </div>

            {/* Forgot Password */}
            <div className="LinkContainer">
              <span>
                <Link to="/applicant_forgot_password">
                  Forgot your password
                </Link>
              </span>
            </div>

            {/* Register Link */}
            <div
              className="LinkContainer RegistrationLink"
              style={{ margin: "0.1rem 0rem" }}
            >
              <p>Doesn't Have an Account?</p>
              <span>
                <Link to={"/register"}>Register Here</Link>
              </span>
            </div>
          </div>

          {/* ✅ Footer (aligned properly) */}
          <div className="Footer">
            <div className="FooterText">
              &copy; {currentYear} {settings?.company_name || "EARIST"} Student
              Information System. All rights reserved.
            </div>
          </div>
        </div>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={handleClose}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
