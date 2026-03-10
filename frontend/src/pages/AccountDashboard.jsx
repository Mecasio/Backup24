import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";

import {
  PersonAdd,
  LockReset,
  People,
  School,
  SupervisorAccount,
  AdminPanelSettings,
  Info,
  Settings,
  TableChart,
  Security,
  Search,
} from "@mui/icons-material";

import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";

const AccountDashboard = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");

  // Access control
  const [userID, setUserID] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Access List Map
  const [userAccessList, setUserAccessList] = useState({});

  const pageId = 96; // ACCOUNT MANAGEMENT

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

    if (email && role && id && empID) {
      setUserID(id);
      setUserRole(role);
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
      const res = await axios.get(
        `${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`
      );
      setHasAccess(res.data?.page_privilege === 1);
    } catch (err) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

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

  // ✅ REAL PAGE IDs BASED ON YOUR DATABASE
  const groupedMenu = [
    {
      label: "SETTINGS",
      items: [
        { title: "SETTINGS", path: "/registrar_reset_password", icon: Settings, page_id: 73 },
        { title: "STUDENT GRADE FILE", path: "/student_grade_file", icon: Settings, page_id: 126 }
      ],
    },
    {
      label: "ACCOUNT CREATION",
      items: [
        { title: "ADD FACULTY ACCOUNTS", path: "/register_prof", icon: PersonAdd, page_id: 70 },
        { title: "ADD REGISTRAR ACCOUNT", path: "/register_registrar", icon: PersonAdd, page_id: 71 },
        { title: "ADD STUDENT ACCOUNT", path: "/register_student", icon: PersonAdd, page_id: 72 },
        { title: "PROFESSOR EDUCATION ", path: "/superadmin_professor_education", icon: PersonAdd, page_id: 109 },
      ],
    },

    {
      label: "ACCOUNT INFORMATION",
      items: [
        { title: "APPLICANT INFORMATION", path: "/super_admin_applicant_dashboard1", icon: Info, page_id: 75 },
        { title: "UPLOAD REQUIREMENTS", path: "/super_admin_requirements_uploader", icon: Info, page_id: 84 },
        { title: "STUDENT INFORMATION", path: "/super_admin_student_dashboard1", icon: Info, page_id: 86 },

      ],
    },

    {
      label: "USER PAGE ACCESS & PAGE TABLE",
      items: [
        { title: "USER PAGE ACCESS", path: "/user_page_access", icon: Security, page_id: 72 },
        { title: "PAGE TABLE", path: "/page_crud", icon: TableChart, page_id: 72 },
      ],
    },

    {
      label: "RESET PASSWORD MANAGEMENT",
      items: [

        { title: "APPLICANT RESET PASSWORD", path: "/superadmin_applicant_reset_password", icon: People, page_id: 81 },
        { title: "STUDENT RESET PASSWORD", path: "/superadmin_student_reset_password", icon: School, page_id: 91 },
        { title: "FACULTY RESET PASSWORD", path: "/superadmin_faculty_reset_password", icon: SupervisorAccount, page_id: 82 },
        { title: "REGISTRAR RESET PASSWORD", path: "/superadmin_registrar_reset_password", icon: AdminPanelSettings, page_id: 83 },
      ],
    },
  ];


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
        {groupedMenu
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => userAccessList[item.page_id]),
          }))
          .filter((group) => group.items.length > 0)
          .map((group, idx) => (
            <Box key={idx} sx={{ mb: 5 }}>
              {/* Header */}
              <Box
                sx={{
                  borderBottom: `4px solid ${borderColor}`,
                  mb: 2,
                  pb: 1,
                  paddingLeft: 2,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    color: "white",
                    textTransform: "uppercase",
                    fontSize: "34px",
                  }}
                >
                  {group.label}
                </Typography>
              </Box>

              {/* Items */}
              <div className="p-2 px-10 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div className="relative" key={i}>
                      <Link to={item.path}>
                        {/* ICON BOX */}
                        <div
                          className="bg-white p-4 rounded-lg absolute left-16 top-12"
                          style={{
                            border: `5px solid ${borderColor}`,
                            color: titleColor,
                            transition: "0.2s ease-in-out",
                          }}
                        >
                          <Icon sx={{ fontSize: 36, color: titleColor }} />
                        </div>
                        <button
                          className="bg-[#fff9ec] rounded-lg p-4 w-80 h-36 font-medium mt-20 ml-8 flex items-end justify-center"
                          style={{
                            border: `5px solid ${borderColor}`,
                            color: titleColor,
                            transition: "0.2s ease-in-out",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = mainButtonColor;
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.border = `5px solid ${borderColor}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff9ec";
                            e.currentTarget.style.color = titleColor;
                            e.currentTarget.style.border = `5px solid ${borderColor}`;
                          }}
                        >
                          {item.title}
                        </button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export default AccountDashboard;
