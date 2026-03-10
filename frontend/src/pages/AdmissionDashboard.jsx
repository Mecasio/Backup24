import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

// ✅ Import only the icons you actually use
import {
  ListAltOutlined,
  AccountCircle,
  FamilyRestroom,
  School,
  LocalHospital,
  Info,
  Description,
  MeetingRoom,
  EditCalendar,
  Badge,
  People,
  Score,
  Assessment,
  FormatListNumbered,
  Class,
  Search,
  Numbers,
  MedicalServices,
  HealthAndSafety,
  FolderCopy,
  HistoryEdu,
  Psychology,
  FactCheck,
  ListAlt,
  ContactEmergency,
} from "@mui/icons-material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CampaignIcon from '@mui/icons-material/Campaign';
import API_BASE_URL from "../apiConfig";

const AdmissionDashboardPanel = () => {
  const settings = useContext(SettingsContext);

  // 🌈 Theme Colors
  const [titleColor, setTitleColor] = useState("#000000");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");

  // 🏫 School Info
  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");

  useEffect(() => {
    if (!settings) return;

    setTitleColor(settings.title_color || "#000000");
    setBorderColor(settings.border_color || "#000000");
    setMainButtonColor(settings.main_button_color || "#1976d2");

    setFetchedLogo(settings.logo_url ? `${API_BASE_URL}${settings.logo_url}` : null);
    setCompanyName(settings.company_name || "");
    setShortTerm(settings.short_term || "");
    setCampusAddress(settings.campus_address || "");
  }, [settings]);

  // 👤 User & Access Control
  const [userID, setUserID] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userAccessList, setUserAccessList] = useState({});


  const pageId = 92;

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    const storedEmployeeID = localStorage.getItem("employee_id");

    if (storedUser && storedRole && storedID && storedEmployeeID) {
      setUserRole(storedRole);
      setUserID(storedID);

      if (storedRole === "registrar") {
        checkAccess(storedEmployeeID);      // ✅ Check if user can access THIS dashboard
        fetchUserAccessList(storedEmployeeID);    // ✅ Load all allowed pages for filtering
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
      const response = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`);
      setHasAccess(response.data?.page_privilege === 1);
    } catch (error) {
      console.error("Error checking access:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAccessList = async (employeeID) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}`);

      const accessMap = data.reduce((acc, item) => {
        acc[item.page_id] = item.page_privilege === 1;
        return acc;
      }, {});

      setUserAccessList(accessMap);
    } catch (err) {
      console.error("Error loading user access list:", err);
    }
  };



  const groupedMenu = [
    {
      label: "ADMISSION OFFICE",
      items: [
        { title: "APPLICANT LIST", link: "/applicant_list_admin", icon: ListAltOutlined, page_id: 7 },
        { title: "APPLICANT FORM", link: "/admin_dashboard1", icon: AccountCircle, page_id: 1 },
        { title: "DOCUMENTS SUBMITTED", link: "/student_requirements", icon: Description, page_id: 61 },
        { title: "EXAMINATION PERMIT", link: "/registrar_examination_profile", icon: Badge, page_id: 48 },
        { title: "ENTRANCE EXAMINATION SCORES", link: "/applicant_scoring", icon: Score, page_id: 8 },
        { title: "ROOM REGISTRATION", link: "/room_registration", icon: MeetingRoom, page_id: 52 },
        { title: "VERIFY DOCUMENTS SCHEDULE MANAGEMENT", link: "/verify_document_schedule", icon: People, page_id: 115 },
        { title: "VERIFY DOCUMENTS SCHEDULE", link: "/verify_schedule", icon: People, page_id: 118 },
        { title: "EVALUATOR SCHEDULE MANAGEMENT", link: "/evaluator_schedule_room_list", icon: People, page_id: 119 },
        { title: "ENTRANCE EXAM ROOM ASSIGNMENT", link: "/assign_entrance_exam", icon: MeetingRoom, page_id: 9 },
        { title: "ENTRANCE EXAM SCHEDULE MANAGEMENT", link: "/assign_schedule_applicant", icon: EditCalendar, page_id: 11 },
        { title: "PROCTOR'S APPLICANT LIST", link: "/admission_schedule_room_list", icon: People, page_id: 33 },
        { title: "ANNOUNCEMENT FOR ADMISSION", link: "/announcement_for_admission", icon: CampaignIcon, page_id: 98 },
        { title: "PROGRAM SLOT REMAINING", link: "/program_slot_limit", icon: People, page_id: 110 },
       
      ],
    },

    {
      label: "ENROLLMENT OFFICER",
      items: [
        { title: "APPLICANT LIST", link: "/applicant_list", icon: ListAlt, page_id: 6 },
        { title: "APPLICANT FORM", link: "/registrar_dashboard1", icon: AccountCircle, page_id: 43 },
        { title: "DOCUMENTS SUBMITTED", link: "/registrar_requirements", icon: FolderCopy, page_id: 49 },
        { title: "QUALIFYING / INTERVIEW EXAM SCORES", link: "/qualifying_interview_exam_scores", icon: Assessment, page_id: 37 },
        { title: "STUDENT NUMBERING FOR COLLEGE", link: "/student_numbering_per_college", icon: FormatListNumbered, page_id: 60 },
        { title: "COURSE TAGGING", link: "/course_tagging_for_college", icon: Class, page_id: 124 },
        { title: "QUALIFYING / INTERVIEW ROOM MANAGEMENT", link: "/assign_qualifying_interview_exam", icon: MeetingRoom, page_id: 10 },
        { title: "QUALIFYING / INTERVIEW SCHEDULE MANAGEMENT", link: "/assign_schedule_applicants_qualifying_interview", icon: EditCalendar, page_id: 12 },
        { title: "QUALIFYING / INTERVIEWER APPLICANT LIST", link: "/enrollment_schedule_room_list", icon: People, page_id: 36 },
        { title: "SEARCH CERTIFICATE OF REGISTRATION", link: "/search_cor_for_college", icon: Search, page_id: 125 },
      ],
    },

    {
      label: "MEDICAL AND DENTAL SERVICES",
      items: [
        { title: "APPLICANT LIST", link: "/medical_applicant_list", icon: ListAltOutlined, page_id: 24 },
        { title: "APPLICANT FORM", link: "/medical_dashboard1", icon: AccountCircle, page_id: 25 },
        { title: "DOCUMENTS SUBMITTED", link: "/medical_requirements", icon: Description, page_id: 30 },
        { title: "MEDICAL REQUIREMENTS", link: "/medical_requirements_form", icon: MedicalServices, page_id: 31 },
        { title: "DENTAL ASSESSMENT", link: "/dental_assessment", icon: HealthAndSafety, page_id: 19 },
        { title: "PHYSICAL AND NEUROLOGICAL EXAMINATION", link: "/physical_neuro_exam", icon: Psychology, page_id: 32 },
        { title: "HEALTH RECORDS CERTIFICATE", link: "/health_record", },
        { title: "MEDICAL CERTIFICATE", link: "/medical_certificate", },
      ],
    },

    {
      label: "REGISTRAR'S OFFICE",
      items: [
        { title: "APPLICANT LIST", link: "/super_admin_applicant_list", icon: ListAltOutlined, page_id: 80 },
        { title: "STUDENT NUMBERING PANEL", link: "/student_numbering", icon: Numbers, page_id: 59 },
        { title: "COURSE TAGGING", link: "/course_tagging", icon: Class, page_id: 17 },
        { title: "STUDENT LIST", link: "/student_list", icon: ListAltOutlined, page_id: 104 },
        { title: "APPLICANT FORM", link: "/readmission_dashboard1", icon: AccountCircle, page_id: 38 },
        { title: "SUBMITTED DOCUMENTS", link: "/submitted_documents", icon: Description, page_id: 106 },
        { title: "CLASS LIST", link: "/class_roster", icon: Class, page_id: 15 },
        { title: "SEARCH CERTIFICATE OF REGISTRATION", link: "/search_cor", icon: Search, page_id: 56 },
        { title: "REPORT OF GRADES", link: "/report_of_grades", icon: Assessment, page_id: 50 },
        { title: "TRANSCRIPT OF RECORDS", link: "/transcript_of_records", icon: HistoryEdu, page_id: 62 },
        { title: "GRADING EVALUATION FOR REGISTRAR", link: "/grading_evaluation_for_registrar", icon: AccountCircle, page_id: 105 },
        { title: "COR EXPORTING MODULE", link: "/cor_exporting_module", icon: AccountCircle, page_id: 117 },
      ],
    },
  ];


  if (loading || hasAccess === null) return <LoadingOverlay open={loading} message="Loading..." />;
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
          .map(group => ({
            ...group,
            items: group.items.filter(item => userAccessList[item.page_id]),
          }))
          .filter(group => group.items.length > 0)
          .map((group, idx) => (
            <Box key={idx} sx={{ mb: 5 }}>
              {/* Group Title */}
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
                    paddingLeft: 2,
                  }}
                >
                  {group.label}
                </Typography>
              </Box>

              {/* Group Items */}
              <div className="p-2 px-10 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div className="relative" key={i}>
                      <Link to={item.link}>
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

                        {/* HOVERABLE BUTTON */}
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
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff9ec";
                            e.currentTarget.style.color = titleColor;
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

export default AdmissionDashboardPanel;
