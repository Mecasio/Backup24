import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import { Link, useNavigate } from "react-router-dom";
import {
  Dashboard,
  Apartment,
  Business,
  LibraryBooks,
  People,
  LogoutOutlined,
  Settings,
  AccountCircle,
  AccountCircleOutlined,
  Token,
} from "@mui/icons-material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LockResetIcon from "@mui/icons-material/LockReset";
import { HistoryOutlined } from "@mui/icons-material";
import { Avatar, Typography } from "@mui/material";
import axios from "axios";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GradeIcon from "@mui/icons-material/Grade";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonIcon from "@mui/icons-material/Person";
import ListAltIcon from "@mui/icons-material/ListAlt";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import API_BASE_URL from "../apiConfig";
import EaristLogo from "../assets/EaristLogo.png"

const SideBar = ({ setIsAuthenticated, profileImage, setProfileImage }) => {
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

  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [personData, setPersonData] = useState({
    profile_image: "",
    fname: "",
    lname: "",
    role: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");

    if (token && savedRole && storedID) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token expired
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("person_id");
          setIsAuthenticated(false);
          navigate("/");
        } else {
          setRole(savedRole); // ✅ Load from saved value
          fetchPersonData(storedID, savedRole);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log("Token decode error:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setIsAuthenticated(false);
        navigate("/");
      }
    } else {
      console.log("Missing token or role");
      setIsAuthenticated(false);
      navigate("/");
    }
  }, []);

  const [userID, setUserID] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convert access list object to Set()
  function accessObjToSet(userAccessList) {
    const set = new Set();
    for (const k in userAccessList) {
      if (userAccessList[k]) set.add(Number(k));
    }
    return set;
  }

  // Duplicate registrar dashboard logic from LoginEnrollment
  function getRegistrarDashboard(accessSet) {
    if (accessSet.has(101)) return "/registrar_dashboard";                 // Clinic Registrar
    if (accessSet.has(102)) return "/enrollment_officer_dashboard";        // Enrollment Registrar
    if (accessSet.has(103)) return "/admission_officer_dashboard";         // Admission Registrar
    return "/registrar_dashboard";
  }

  // ✅ Access List Map
  const [userAccessList, setUserAccessList] = useState({});

  // Apply settings
  useEffect(() => {
    if (!settings) return;

    setTitleColor(settings.title_color || "#000000");
    setBorderColor(settings.border_color || "#000000");
    setMainButtonColor(settings.main_button_color || "#1976d2");
  }, [settings]);

  // Load user & access
  useEffect(() => {
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("person_id");
    const empID = localStorage.getItem("employee_id");

    if (!email || !role || !id) {
      window.location.href = "/login";
      return;
    }

    setUserID(id);
    setUserRole(role);

    // ✅ Applicants don't have employee_id
    if (role === "applicant") {
      setIsAuthenticated(true);
      return; // STOP HERE — no access list needed
    }

    // For all other roles
    if (!empID) {
      window.location.href = "/login";
      return;
    }

    setEmployeeID(empID);
    fetchUserAccessList(empID);
  }, []);

  // ✅ ACCESS LOADER
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
      console.error("Access list error:", err);
    }
  };

  const groupedMenu = [
    {
      items: [
        { title: "Admission Management", path: "/admission_dashboard", icon: Business, page_id: 92 },
        { title: "Course Management", path: "/course_management", icon: LibraryBooks, page_id: 93 },
        { title: "Department Management", path: "/department_dashboard", icon: Apartment, page_id: 94 },
        { title: "System Management", path: "/system_dashboard", icon: Settings, page_id: 95 },
        { title: "Account Management", path: "/account_dashboard", icon: People, page_id: 96 },
        { title: "History Logs", path: "/history_logs", icon: HistoryOutlined, page_id: 97 },
      ],
    },
  ];

  const [accessDescription, setAccessDescription] = useState("");

  useEffect(() => {
    if (!employeeID) return;

    const fetchAccessDescription = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/access_level/${employeeID}`
        );
        setAccessDescription(res.data?.access_description || "");
      } catch (error) {
        console.error("Error fetching access level:", error);
      }
    };

    fetchAccessDescription();
  }, [employeeID]);

  const Logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("person_id");
    setIsAuthenticated(false);
    navigate("/");
  };

  const fetchPersonData = async (person_id, role) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/person_data/${person_id}/${role}`
      );
      setPersonData(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const [dir, setDir] = useState("");

  useEffect(() => {
    if (!userRole) return;

    if (userRole === "applicant") {
      setDir("Applicant1by1");
    } else if (userRole === "student") {
      setDir("Student1by1");
    } else if (userRole === "faculty") {
      setDir("Faculty1by1");
    } else {
      setDir("Admin1by1");
    }
  }, [userRole]);

  return (
<div className="h-screen w-78 hidden-print">

      <ul
        className="bg-white h-full p-3 px-5 text-maroon-500 w-full gap-2"
        style={{ borderRight: `5px solid ${borderColor}` }}
      >

        <div className="flex items-center flex-col mt-24 mb-4 relative">
          {/* 🧑 Profile Picture */}
          {!(profileImage || personData?.profile_image) ? (
            <Avatar
              sx={{
                width: 106,
                height: 106,
                border: `2px solid ${borderColor}`,
                bgcolor: settings?.header_color || "#1976d2",
                marginBottom: "15px",
              }}
            />
          ) : (
            <Avatar
              src={
                profileImage ||
                `${API_BASE_URL}/uploads/${dir}/${personData.profile_image}?t=${Date.now()}`
              }
              sx={{
                width: 116,
                height: 116,
                mx: "auto",
                border: `4px solid ${borderColor}`,
              }}
            />
          )}

          {/* ✅ Name Text with Theme Colors */}
          <div className="mt-2 text-center">
            <p style={{ color: titleColor, fontWeight: 600, fontSize: "16px" }}>
              {personData?.first_name}
            </p>
            <p style={{ color: titleColor, fontWeight: 600, fontSize: "16px" }}>
              {personData?.middle_name}
            </p>
            <p style={{ color: titleColor, fontWeight: 600, fontSize: "16px" }}>
              {personData?.last_name}
            </p>
          </div>

          {/* ➕ Plus Icon Overlay — REGISTRAR */}
          {role === "registrar" && (
            <>
              <label
                htmlFor="sidebar-profile-upload"
                style={{
                  position: "absolute",
                  bottom: "72px",
                  right: "calc(50% - 55px)",
                  cursor: "pointer",
                }}
              >
                <AddCircleIcon
                  sx={{
                    color: settings?.header_color || "#1976d2",
                    fontSize: 32,
                    backgroundColor: "white",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: `4px solid ${borderColor}`,
                  }}
                />
              </label>

              <input
                id="sidebar-profile-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  try {
                    const person_id = localStorage.getItem("person_id");
                    const role = localStorage.getItem("role");

                    const formData = new FormData();
                    formData.append("profile_picture", file);
                    formData.append("person_id", person_id);

                    await axios.post(
                      `${API_BASE_URL}/admin/update_registrar`,
                      formData,
                    );

                    const updated = await axios.get(
                      `${API_BASE_URL}/api/person_data/${person_id}/${role}`
                    );

                    setPersonData(updated.data);
                    const baseUrl = `${API_BASE_URL}/uploads/Admin1by1/${updated.data.profile_image}`;
                    setProfileImage(`${baseUrl}?t=${Date.now()}`);
                  } catch (error) {
                    console.error("❌ Upload failed:", error);
                  }
                }}
                style={{ display: "none" }}
              />
            </>
          )}

          {/* APPLICANT */}
          {role === "applicant" && (
            <>
              <label
                htmlFor="sidebar-profile-upload"
                style={{
                  position: "absolute",
                  bottom: "72px",
                  right: "calc(50% - 55px)",
                  cursor: "pointer",
                }}
              >
                <AddCircleIcon
                  sx={{
                    color: settings?.header_color || "#1976d2",
                    fontSize: 32,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    border: `4px solid ${borderColor}`,
                  }}
                />
              </label>

              <input
                id="sidebar-profile-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  // ✅ SHOW IMAGE IMMEDIATELY
                  setProfileImage(URL.createObjectURL(file));

                  try {
                    const person_id = localStorage.getItem("person_id");
                    const role = localStorage.getItem("role");

                    const formData = new FormData();
                    formData.append("profile_picture", file);
                    formData.append("person_id", person_id);

                    await axios.post(
                      `${API_BASE_URL}/form/upload-profile-picture`,
                      formData
                    );

                    const updated = await axios.get(
                      `${API_BASE_URL}/api/person_data/${person_id}/${role}`
                    );

                    setPersonData(updated.data);

                    // ✅ refresh with backend image (cache-busted)
                    setProfileImage(
                      `${API_BASE_URL}/uploads/Applicant1by1/${updated.data.profile_image}?t=${Date.now()}`
                    );
                  } catch (error) {
                    console.error("❌ Upload failed:", error);
                  }
                }}

                style={{ display: "none" }}
              />
            </>
          )}

          {/* FACULTY */}
          {role === "faculty" && (
            <>
              <label
                htmlFor="sidebar-profile-upload"
                style={{
                  position: "absolute",
                  bottom: "72px",
                  right: "calc(50% - 55px)",
                  cursor: "pointer",
                }}
              >
                <AddCircleIcon
                  sx={{
                    color: settings?.header_color || "#1976d2",
                    fontSize: 32,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    border: `4px solid ${borderColor}`,
                  }}
                />
              </label>

              <input
                id="sidebar-profile-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  try {
                    const person_id = localStorage.getItem("person_id");
                    const role = localStorage.getItem("role");

                    const formData = new FormData();
                    formData.append("profile_picture", file);
                    formData.append("person_id", person_id);

                    await axios.post(
                      `${API_BASE_URL}/faculty/update_faculty`,
                      formData
                    );

                    const updated = await axios.get(
                      `${API_BASE_URL}/api/person_data/${person_id}/${role}`
                    );
                    setPersonData(updated.data);

                    const baseUrl = `${API_BASE_URL}/uploads/Faculty1by1/${updated.data.profile_image}`;
                    setProfileImage(`${baseUrl}?t=${Date.now()}`);
                  } catch (error) {
                    console.error("❌ Upload failed:", error);
                  }
                }}
                style={{ display: "none" }}
              />
            </>
          )}

          {/* STUDENT */}
          {role === "student" && (
            <>
              <label
                htmlFor="sidebar-profile-upload"
                style={{
                  position: "absolute",
                  bottom: "72px",
                  right: "calc(50% - 55px)",
                  cursor: "pointer",
                }}
              >
                <AddCircleIcon
                  sx={{
                    color: settings?.header_color || "#1976d2",
                    fontSize: 32,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    border: `2px solid ${borderColor}`,
                  }}
                />
              </label>

              <input
                id="sidebar-profile-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  try {
                    const person_id = localStorage.getItem("person_id");
                    const role = localStorage.getItem("role");

                    const formData = new FormData();
                    formData.append("profile_picture", file);
                    formData.append("person_id", person_id);

                    await axios.post(
                      `${API_BASE_URL}/student/update_student`,
                      formData
                    );

                    const updated = await axios.get(
                      `${API_BASE_URL}/api/person_data/${person_id}/${role}`
                    );

                    setPersonData(updated.data);
                    const baseUrl = `${API_BASE_URL}/uploads/Student1by1/${updated.data.profile_image}`;
                    setProfileImage(`${baseUrl}?t=${Date.now()}`);
                  } catch (error) {
                    console.error("❌ Upload failed:", error);
                  }
                }}
                style={{ display: "none" }}
              />
            </>
          )}

          {/* 👤 Role + Name Display */}
          {role === "registrar" && (
            <span className="mt-4 text-center">
              {personData && (personData.fname || personData.lname) ? (
                <>
                  <Typography variant="h6">
                    {personData.fname} {personData.lname}
                  </Typography>
                  <Typography variant="body2" color="maroon">
                    {accessDescription || "Administrator"}
                  </Typography>
                </>
              ) : (
                <span>Administrator</span>
              )}
            </span>
          )}
          {role === "applicant" && (
            <span className="mt-4 text-center">
              {personData && (personData.fname || personData.lname) ? (
                <>
                  <Typography variant="h6">
                    {personData.fname} {personData.lname}
                  </Typography>
                  <Typography variant="body2" color="maroon">
                    {personData.role.charAt(0).toUpperCase() +
                      personData.role.slice(1)}
                  </Typography>
                </>
              ) : (
                <span>Applicant</span>
              )}
            </span>
          )}
          {role === "faculty" && (
            <span className="mt-4 text-center">
              {personData && (personData.fname || personData.lname) ? (
                <>
                  <Typography variant="h6">
                    {personData.fname} {personData.lname}
                  </Typography>
                  <Typography variant="body2" color="maroon">
                    {personData.role.charAt(0).toUpperCase() +
                      personData.role.slice(1)}
                  </Typography>
                </>
              ) : (
                <span>Faculty</span>
              )}
            </span>
          )}
          {role === "student" && (
            <span className="mt-4 text-center">
              {personData && (personData.fname || personData.lname) ? (
                <>
                  <Typography variant="h6">
                    {personData.fname} {personData.lname}
                  </Typography>
                  <Typography variant="body2" color="maroon">
                    {personData.role.charAt(0).toUpperCase() +
                      personData.role.slice(1)}
                  </Typography>
                </>
              ) : (
                <span>Student</span>
              )}
            </span>
          )}
        </div>

        <br />
        <hr className="bg-maroon-500" />
        <br />
        {role === "registrar" && (() => {
          const accessSet = accessObjToSet(userAccessList);
          const registrarDashboard = getRegistrarDashboard(accessSet);
          const isActive = location.pathname === registrarDashboard;

          return (
            <>
              {/* Registrar Dashboard */}
              <Link to={registrarDashboard}>
                <li
                  className="w-full flex items-center px-2 rounded button-hover"
                  style={{
                    backgroundColor: isActive ? mainButtonColor : "transparent",
                    color: isActive ? "#ffffff" : "inherit",
                    border: `2px solid ${borderColor}`,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = mainButtonColor;
                      e.currentTarget.style.color = "#ffffff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "inherit";
                    }
                  }}
                >
                  <Dashboard />
                  <span className="pl-4 p-2 px-0 pointer-events-none">Dashboard</span>
                </li>
              </Link>

              {/* Grouped Menu Items */}
              {groupedMenu.map((group, idx) => (
                <div key={idx}>
                  <h6
                    className="mt-2 mb-2 px-2"
                    style={{ color: mainButtonColor, fontWeight: 600 }}
                  >
                    {group.label}
                  </h6>

                  {group.items.map((item) => {
                    if (!userAccessList[item.page_id]) return null;

                    const isActive = location.pathname === item.path;

                    return (
                      <Link to={item.path} key={item.page_id}>
                        <li
                          className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                          style={{
                            backgroundColor: isActive ? mainButtonColor : "transparent",
                            color: isActive ? "#ffffff" : "inherit",
                            border: `2px solid ${borderColor}`,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = mainButtonColor;
                              e.currentTarget.style.color = "#ffffff";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = "inherit";
                            }
                          }}
                        >
                          <item.icon />
                          <span className="pl-4 p-2 px-0 pointer-events-none">
                            {item.title}
                          </span>
                        </li>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </>
          );
        })()}

        {role === "applicant" && (
          <>
            {/* Dashboard */}
            <Link to="/applicant_dashboard">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname.startsWith("/applicant_dashboard")
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname.startsWith("/applicant_dashboard")
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!location.pathname.startsWith("/applicant_dashboard")) {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!location.pathname.startsWith("/applicant_dashboard")) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <DashboardIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">Dashboard</span>
              </li>
            </Link>

            {/* Applicant Form */}
            <Link
              onClick={() => {
                let keys = JSON.parse(localStorage.getItem("dashboardKeys"));
                if (!keys) {
                  const generateKey = () => Math.random().toString(36).substring(2, 10);
                  keys = {
                    step1: generateKey(),
                    step2: generateKey(),
                    step3: generateKey(),
                    step4: generateKey(),
                    step5: generateKey(),
                  };
                  localStorage.setItem("dashboardKeys", JSON.stringify(keys));
                }
                window.location.href = `/dashboard/${keys.step1}`;
              }}
            >
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname.startsWith("/dashboard/")
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname.startsWith("/dashboard/")
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!location.pathname.startsWith("/dashboard/")) {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!location.pathname.startsWith("/dashboard/")) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <AssignmentIndIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">Applicant Form</span>
              </li>
            </Link>

            {/* Upload Requirements */}
            <Link to="/requirements_uploader">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname.startsWith("/requirements_uploader")
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname.startsWith("/requirements_uploader")
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!location.pathname.startsWith("/requirements_uploader")) {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!location.pathname.startsWith("/requirements_uploader")) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <CloudUploadIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">
                  Upload Requirements
                </span>
              </li>
            </Link>

            {/* Change Password */}
            <Link to="/applicant_reset_password">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname.startsWith("/applicant_reset_password")
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname.startsWith("/applicant_reset_password")
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!location.pathname.startsWith("/applicant_reset_password")) {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!location.pathname.startsWith("/applicant_reset_password")) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <LockResetIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">
                  Change Password
                </span>
              </li>
            </Link>
          </>
        )}

        {role === "faculty" && (
          <>
            {/* Faculty Dashboard */}
            <Link to="/faculty_dashboard">
              <li
                className="w-full flex items-center px-2 rounded button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/faculty_dashboard"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/faculty_dashboard"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/faculty_dashboard") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/faculty_dashboard") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <DashboardIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">Dashboard</span>
              </li>
            </Link>

            {/* Workload */}
            <Link to="/faculty_workload">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/faculty_workload"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/faculty_workload"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/faculty_workload") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/faculty_workload") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <WorkIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">Workload</span>
              </li>
            </Link>

            {/* Faculty Class List */}
            <Link to="/faculty_masterlist">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/faculty_masterlist"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/faculty_masterlist"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/faculty_masterlist") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/faculty_masterlist") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <ListAltIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">Class List</span>
              </li>
            </Link>

            {/* Grading Management */}
            <Link to="/grading_sheet">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/grading_sheet"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/grading_sheet"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/grading_sheet") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/grading_sheet") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <AssignmentTurnedInIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">
                  Grading Management
                </span>
              </li>
            </Link>

            {/* Faculty Evaluation */}
            <Link to="/faculty_evaluation">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/faculty_evaluation"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/faculty_evaluation"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/faculty_evaluation") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/faculty_evaluation") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <SchoolIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">
                  Faculty Evaluation
                </span>
              </li>
            </Link>



            {/* Reset Password */}
            <Link to="/faculty_reset_password">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/faculty_reset_password"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/faculty_reset_password"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/faculty_reset_password") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/faculty_reset_password") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <Settings />
                <span className="pl-4 p-2 px-0 pointer-events-none">Settings</span>
              </li>
            </Link>
          </>
        )}
        {role === "student" && (
          <>
            {/* Student Dashboard */}
            <Link to="/student_dashboard">
              <li
                className="w-full flex items-center px-2 rounded button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/student_dashboard"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/student_dashboard"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/student_dashboard") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/student_dashboard") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <DashboardIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">Dashboard</span>
              </li>
            </Link>

            {/* Schedule */}
            <Link to="/student_schedule">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/student_schedule"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/student_schedule"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/student_schedule") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/student_schedule") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <EventNoteIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">Schedule</span>
              </li>
            </Link>

            {/* Grades */}
            <Link to="/grades_page">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/grades_page"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/grades_page"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/grades_page") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/grades_page") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <GradeIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">Grades</span>
              </li>
            </Link>

            {/* Student Faculty Evaluation */}
            <Link to="/student_faculty_evaluation">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/student_faculty_evaluation"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/student_faculty_evaluation"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/student_faculty_evaluation") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/student_faculty_evaluation") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <AssignmentTurnedInIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">
                  Faculty Evaluation
                </span>
              </li>
            </Link>

            {/* Student Profile */}
            <Link to="/student_dashboard1">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor: /^\/student_dashboard[1-5]$/.test(location.pathname)
                    ? mainButtonColor
                    : "transparent",
                  color: /^\/student_dashboard[1-5]$/.test(location.pathname)
                    ? "#ffffff"
                    : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!/^\/student_dashboard[1-5]$/.test(location.pathname)) {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!/^\/student_dashboard[1-5]$/.test(location.pathname)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <PersonIcon />
                <span className="pl-4 p-2 px-0 pointer-events-none">
                  Student Profile
                </span>
              </li>
            </Link>

            {/* Reset Password */}
            <Link to="/student_reset_password">
              <li
                className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
                style={{
                  backgroundColor:
                    location.pathname === "/student_reset_password"
                      ? mainButtonColor
                      : "transparent",
                  color:
                    location.pathname === "/student_reset_password"
                      ? "#ffffff"
                      : "inherit",
                  border: `2px solid ${borderColor}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/student_reset_password") {
                    e.currentTarget.style.backgroundColor = mainButtonColor;
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/student_reset_password") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
              >
                <Settings />
                <span className="pl-4 p-2 px-0 pointer-events-none">
                  Settings
                </span>
              </li>
            </Link>
          </>
        )}


        <li
          className="w-full flex items-center px-2 rounded m-2 mx-0 button-hover"
          onClick={Logout}
          style={{
            border: `2px solid ${borderColor}`,
            backgroundColor: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = mainButtonColor;
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "inherit";
          }}
        >
          <LogoutOutlined />
          <span className="pl-4 p-2 px-0 pointer-events-none">Logout</span>
        </li>
      </ul>
    </div>
  );
};

export default SideBar;
