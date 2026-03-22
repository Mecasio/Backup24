import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import { Link, useNavigate } from "react-router-dom";
import {
  AccountCircle, AdminPanelSettings, Assessment, Assignment, Badge,
  CalendarToday, Campaign, ChangeCircle, Class, CollectionsBookmark,
  ContactEmergency, DateRange, Dashboard, Description, EditCalendar,
  EditNote, Email, EventAvailable, EventNote, FactCheck, FolderCopy,
  FormatListNumbered, HealthAndSafety, HelpOutline, HistoryEdu, Info,
  Layers, ListAlt, ListAltOutlined, MedicalServices, MeetingRoom,
  MenuBook, Numbers, PersonAdd, Psychology, School, Score, Search,
  Security, SupervisorAccount, TableChart, Timeline, Update, Apartment,
  Business, LibraryBooks, People, LogoutOutlined, Settings, ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LockResetIcon from "@mui/icons-material/LockReset";
import { Avatar, Tooltip, Divider } from "@mui/material";
import axios from "axios";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GradeIcon from "@mui/icons-material/Grade";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonIcon from "@mui/icons-material/Person";
import ListAltIcon from "@mui/icons-material/ListAlt";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import API_BASE_URL from "../apiConfig";
import EaristLogo from "../assets/EaristLogo.png";

const GLOBAL_PAGE_IDS = [13, 15, 17, 38, 39, 40, 41, 42, 50, 56, 59, 62, 73, 80, 92, 96, 101, 104, 105, 106, 117];
const GLOBAL_ACCESS_THRESHOLD = 10;
const CLASS_ROSTER_DEPT = "/class_roster_enrollment";
const CLASS_ROSTER_GLOBAL = "/class_roster";

function buildSidebarStyles(s = {}, hasDepartment = true) {
  const accent = s.main_button_color || "#7c3aed";
  const border = s.border_color || "#e8e8e8";
  const titleColor = s.title_color || "#111111";
  const mainButtonColor = s.main_button_color || "#111111";
  const subColor = s.subtitle_color || "#777777";
  const subBtnColor = s.sub_button_color || "#f5f5f5";
  const profileBg = s.header_color ? `${s.header_color}18` : "#f7f7f7";

  const profileCardStyles = hasDepartment
    ? `
  .sb-profile {
    display: flex; align-items: center; gap: 15px;
    padding: 14px 18px; margin: 12px 12px 12px;
    background: ${profileBg}; border-radius: 10px;
    position: relative; flex-shrink: 0;
  }
  .sb-profile-info { overflow: hidden; }
  .sb-profile-name {
    font-size: 16px; font-weight: 600; color: ${titleColor};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;
  }
  .sb-profile-role {
    font-size: 13px; color: ${subColor};
    white-space: nowrap; overflow: hidden; margin-top: -5px;
    text-overflow: ellipsis; min-width: 190px;
  }
  .sb-profile-dprtmnt {
    font-size: 14px; color: ${subColor};
    opacity: 0.9; margin-top: -3px; font-style: italic;
  }`
    : `
  .sb-profile {
    display: flex; align-items: center; gap: 11px;
    padding: 14px 18px; margin: 12px 12px 12px;
    background: ${profileBg}; border-radius: 10px;
    position: relative; flex-shrink: 0;
  }
  .sb-profile-info { overflow: hidden; }
  .sb-profile-name {
    font-size: 15px; font-weight: 600; color: ${titleColor};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;
  }
  .sb-profile-role {
    font-size: 12.5px; color: ${subColor};
    white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; min-width: 180px;
  }
  .sb-profile-dprtmnt { display: none; }`;

  return `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

  .sb-root {
    font-family: 'Poppins', sans-serif;
    width: 290px; height: calc(100vh - 64px - 42px);
    background: #ffffff; display: flex; flex-direction: column;
    border-right: 1px solid ${border};
    position: fixed; top: 64px; bottom: 42px; left: 0;
    z-index: 100; overflow: hidden;
  }

  ${profileCardStyles}

  .sb-avatar-wrap { position: relative; flex-shrink: 0; }
  .sb-upload-btn {
    position: absolute; bottom: -3px; right: -3px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    background: #fff; border-radius: 50%; width: 18px; height: 18px;
    box-shadow: 0 1px 4px rgba(0,0,0,.15);
  }

  .sb-scroll {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    padding: 10px 10px 0;
    scrollbar-width: thin; scrollbar-color: ${border} transparent;
  }
  .sb-scroll::-webkit-scrollbar { width: 4px; }
  .sb-scroll::-webkit-scrollbar-track { background: transparent; }
  .sb-scroll::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }

  .sb-section-label {
    font-size: 14px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .08em; color: #000; padding: 10px 8px 4px;
  }

  .sb-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 8px; cursor: pointer;
    color: black; font-size: 18px; font-weight: 400;
    transition: background .15s, color .15s;
    text-decoration: none; margin-bottom: 1px;
    white-space: nowrap; overflow: hidden; line-height: 1;
  }
  .sb-item .sb-icon {
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; opacity: .75; color: ${mainButtonColor};
  }
  .sb-item:hover { background: ${mainButtonColor}; color: white; }
  .sb-item:hover .sb-icon { background: ${mainButtonColor}; color: white; }
  .sb-item.active { background: ${accent}; color: #fff !important; }
  .sb-item.active:hover { background: ${accent}; }
  .sb-item.active .sb-icon { opacity: 1; color: #fff !important; }
  .sb-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

  .sb-group-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 10px; border-radius: 8px;
    border: none; background: transparent; cursor: pointer;
    color: black; font-size: 18px; font-weight: 400;
    font-family: 'Poppins', sans-serif; transition: background .15s;
    text-align: left; margin-bottom: 1px; line-height: 1; vertical-align: middle;
  }
  .sb-group-btn .sb-icon { color: ${titleColor}; }
  .sb-group-btn:hover { background: ${mainButtonColor}; color: white; }
  .sb-group-btn:hover .sb-icon { color: white; }
  .sb-group-btn.open { color: ${accent}; background: ${subBtnColor}; }
  .sb-group-btn.open .sb-icon { color: ${titleColor}; }
  .sb-group-label { flex: 1; }
  .sb-group-chevron { flex-shrink: 0; opacity: .5; }
  .sb-group-chevron svg { font-size: 16px !important; }

  .sb-sub-item { padding-left: 22px; }
  .sb-divider { height: 1px; background: #f0f0f0; margin: 8px 0; }

  .sb-footer { padding: 10px; border-top: 1px solid #f0f0f0; flex-shrink: 0; }
  .sb-logout {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 8px; cursor: pointer;
    font-size: 12.5px; font-weight: 500; color: ${mainButtonColor};
    transition: background .15s;
  }
  .sb-footer .sb-logout:hover { background: ${mainButtonColor}; color: white; }
  `;
}

function injectStyles(settings, hasDepartment) {
  let tag = document.getElementById("sb-styles");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "sb-styles";
    document.head.appendChild(tag);
  }
  tag.textContent = buildSidebarStyles(settings, hasDepartment);
}

function NavItem({ to, icon: Icon, label, active, onClick, sub = false }) {
  const cls = ["sb-item", active ? "active" : "", sub ? "sb-sub-item" : ""]
    .filter(Boolean).join(" ");

  if (onClick) {
    return (
      <div className={cls} onClick={onClick}>
        {Icon && <span className="sb-icon"><Icon sx={{ fontSize: 18 }} /></span>}
        <span className="sb-item-label">{label}</span>
      </div>
    );
  }
  return (
    <Link to={to} className={cls}>
      {Icon && <span className="sb-icon"><Icon sx={{ fontSize: 18 }} /></span>}
      <span className="sb-item-label">{label}</span>
    </Link>
  );
}

function GroupToggle({ label, icon: Icon, open, onToggle }) {
  return (
    <button type="button" className={`sb-group-btn ${open ? "open" : ""}`} onClick={onToggle}>
      {Icon && (
        <span className="sb-icon" style={{ opacity: 1, display: "flex", alignItems: "center" }}>
          <Icon sx={{ fontSize: 18 }} />
        </span>
      )}
      <span className="sb-group-label">{label}</span>
      <span className="sb-group-chevron">{open ? <ExpandLess /> : <ExpandMore />}</span>
    </button>
  );
}

function ProfileUploadInput({ id, onChange }) {
  return <input id={id} type="file" accept="image/*" onChange={onChange} style={{ display: "none" }} />;
}

const SideBar = ({ setIsAuthenticated, profileImage, setProfileImage }) => {
  const settings = useContext(SettingsContext);
  const navigate = useNavigate();

  const accentColor = settings?.main_button_color || "#7c3aed";
  const shortTerm = settings?.short_term || "EARIST";

  const [role, setRole] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [personData, setPersonData] = useState({ profile_image: "", fname: "", lname: "", role: "" });
  const [userAccessList, setUserAccessList] = useState({});
  const [accessDescription, setAccessDescription] = useState("");
  const [dir, setDir] = useState("Admin1by1");
  const [classRosterScope, setClassRosterScope] = useState(null);
  const [globalAccessCount, setGlobalAccessCount] = useState(0);

  const [groupOpen, setGroupOpen] = useState({});
  const toggleGroup = (key) => setGroupOpen((p) => ({ ...p, [key]: !p[key] }));
  const isGroupOpen = (key) => groupOpen[key] === true;

  const hasDepartment = !!(personData?.dprtmnt_code);

  useEffect(() => { injectStyles(settings, hasDepartment); }, [settings, hasDepartment]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    if (token && savedRole && storedID) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        if (decoded.exp < Date.now() / 1000) {
          ["token", "role", "person_id"].forEach((k) => localStorage.removeItem(k));
          setIsAuthenticated(false);
          navigate("/");
        } else {
          setRole(savedRole);
          fetchPersonData(storedID, savedRole);
          setIsAuthenticated(true);
        }
      } catch {
        ["token", "role"].forEach((k) => localStorage.removeItem(k));
        setIsAuthenticated(false);
        navigate("/");
      }
    } else {
      setIsAuthenticated(false);
      navigate("/");
    }
  }, []);

  // ── access + scope ──
  useEffect(() => {
    const email = localStorage.getItem("email");
    const r = localStorage.getItem("role");
    const id = localStorage.getItem("person_id");
    const empID = localStorage.getItem("employee_id");
    if (!email || !r || !id) { window.location.href = "/login"; return; }
    setUserRole(r);
    if (r === "applicant") { setIsAuthenticated(true); return; }
    if (!empID) { window.location.href = "/login"; return; }
    setEmployeeID(empID);
    fetchUserAccessList(empID);

    // ── Determine Class Roster scope for this user ──────────────────────────
    // We also need the admin's department info to apply Rule 2.
    const determineScope = async (empId) => {
      try {
        // 1. Full page-access list (uses existing /api/employee/:id endpoint)
        const accessRes = await axios.get(`${API_BASE_URL}/api/employee/${empId}`);
        const accessList = accessRes.data?.accessList ?? [];
        const matchCount = accessList.filter((pid) => GLOBAL_PAGE_IDS.includes(pid)).length;
        setGlobalAccessCount(matchCount);

        if (matchCount > GLOBAL_ACCESS_THRESHOLD) {
          // Rule 1 — broad access → Global
          setClassRosterScope("GLOBAL");
          return;
        }

        // 2. Admin profile → check for dprtmnt_id
        const userEmail = localStorage.getItem("email");
        const adminRes = await axios.get(`${API_BASE_URL}/api/admin_data/${userEmail}`);
        const deptId = adminRes.data?.dprtmnt_id;

        if (deptId) {
          setClassRosterScope("DEPARTMENT");
        } else {
          setClassRosterScope("GLOBAL");
        }
      } catch {
        setClassRosterScope("GLOBAL"); // safe fallback
      }
    };

    determineScope(empID);
  }, []);

  useEffect(() => {
    if (!employeeID) return;
    axios.get(`${API_BASE_URL}/api/access_level/${employeeID}`)
      .then((res) => setAccessDescription(res.data?.access_description || ""))
      .catch(() => { });
  }, [employeeID]);

  useEffect(() => {
    const map = { applicant: "Applicant1by1", student: "Student1by1", faculty: "Faculty1by1" };
    setDir(map[userRole] || "Admin1by1");
  }, [userRole]);

  const fetchPersonData = async (person_id, r) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/person_data/${person_id}/${r}`);
      setPersonData(res.data);
    } catch { }
  };

  const fetchUserAccessList = async (empID) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/page_access/${empID}`);
      const map = data.reduce((acc, item) => {
        acc[item.page_id] = item.page_privilege === 1;
        return acc;
      }, {});
      setUserAccessList(map);
    } catch { }
  };

  const Logout = () => {
    ["token", "email", "role", "person_id"].forEach((k) => localStorage.removeItem(k));
    setIsAuthenticated(false);
    navigate("/");
  };

  const makeUploadHandler = (endpoint, uploadDir) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (role === "applicant") setProfileImage(URL.createObjectURL(file));
    try {
      const person_id = localStorage.getItem("person_id");
      const r = localStorage.getItem("role");
      const formData = new FormData();
      formData.append("profile_picture", file);
      formData.append("person_id", person_id);
      await axios.post(`${API_BASE_URL}${endpoint}`, formData);
      const updated = await axios.get(`${API_BASE_URL}/api/person_data/${person_id}/${r}`);
      setPersonData(updated.data);
      setProfileImage(`${API_BASE_URL}/uploads/${uploadDir}/${updated.data.profile_image}?t=${Date.now()}`);
    } catch { }
  };

  const uploadHandlers = {
    registrar: makeUploadHandler("/admin/update_registrar", "Admin1by1"),
    applicant: makeUploadHandler("/form/upload-profile-picture", "Applicant1by1"),
    faculty: makeUploadHandler("/faculty/update_faculty", "Faculty1by1"),
    student: makeUploadHandler("/update_student", "Student1by1"),
  };

  function accessObjToSet(list) {
    const s = new Set();
    for (const k in list) { if (list[k]) s.add(Number(k)); }
    return s;
  }

  function getRegistrarDashboard(accessSet) {
    if (accessSet.has(101)) return "/registrar_dashboard";
    if (accessSet.has(102)) return "/enrollment_officer_dashboard";
    if (accessSet.has(103)) return "/admission_officer_dashboard";
    return "/registrar_dashboard";
  }

  const loc = typeof window !== "undefined" ? window.location.pathname : "";
  const isActive = (path) => loc === path;
  const isActivePrefix = (prefix) => loc.startsWith(prefix);
  const isClassRosterActive = (linkPath) => loc === linkPath;

  const avatarSrc = profileImage || (personData?.profile_image
    ? `${API_BASE_URL}/uploads/${dir}/${personData.profile_image}?t=${Date.now()}`
    : null);
  const showUploadFor = ["registrar", "applicant", "faculty", "student"].includes(role);
  const classRosterEnrollmentLink = CLASS_ROSTER_DEPT;
  const classRosterRegistrarLink = CLASS_ROSTER_GLOBAL;

  const admissionMenuGroups = [
    {
      key: "admissionOffice", label: "Admission Office", icon: AdminPanelSettings, items: [
        { title: "Applicant List", link: "/applicant_list_admin", icon: ListAltOutlined, page_id: 7 },
        { title: "Applicant Profile", link: "/admin_dashboard1", icon: AccountCircle, page_id: 1 },
        { title: "Documents Submitted", link: "/student_requirements", icon: FolderCopy, page_id: 61 },
        { title: "Exam Schedule Mgmt", link: "/assign_schedule_applicant", icon: EditCalendar, page_id: 11 },
        { title: "Examination Permit", link: "/registrar_examination_profile", icon: Badge, page_id: 48 },
        { title: "Entrance Exam Scores", link: "/applicant_scoring", icon: Score, page_id: 8 },
        { title: "Room Registration", link: "/room_registration", icon: MeetingRoom, page_id: 52 },
        { title: "Exam Room Assignment", link: "/assign_entrance_exam", icon: MeetingRoom, page_id: 9 },
        { title: "Proctor's Applicant List", link: "/admission_schedule_room_list", icon: People, page_id: 33 },
        { title: "Announcement", link: "/announcement_for_admission", icon: Campaign, page_id: 98 },
        { title: "Program Slot Remaining", link: "/program_slot_limit", icon: People, page_id: 110 },
      ]
    },
  ];

  const enrollmentMenuGroups = [
    {
      key: "enrollmentOfficer", label: "Enrollment Officer", icon: AssignmentIndIcon, items: [
        { title: "Applicant List", link: "/applicant_list", icon: ListAlt, page_id: 6 },
        { title: "Applicant Profile", link: "/registrar_dashboard1", icon: AccountCircle, page_id: 43 },
        { title: "Applicant Online Requirements", link: "/registrar_requirements", icon: FolderCopy, page_id: 49 },
        { title: "Qualifying / Interview Scores", link: "/qualifying_interview_exam_scores", icon: Assessment, page_id: 37 },
        { title: "Student Numbering", link: "/student_numbering_per_college", icon: FormatListNumbered, page_id: 60 },

        { title: "Student List", link: "/student_list_for_enrollment", icon: ListAlt, page_id: 137 },
        { title: "Student Profile", link: "/official_student_dashboard1", icon: AccountCircle, page_id: 43 },
        { title: "Student Online Requirements", link: "/student_official_requirements", icon: FolderCopy, page_id: 124 },
        { title: "Course Tagging", link: "/course_tagging_for_college", icon: Class, page_id: 124 },
        { title: "Search COR", link: "/search_cor_for_college", icon: Search, page_id: 125 },
        {
          title: "Class List", link: classRosterEnrollmentLink, icon: Class, page_id: 139, activeCheck: () => isClassRosterActive(classRosterEnrollmentLink)
        },


        { title: "Qualifying Room Mgmt", link: "/assign_qualifying_interview_exam", icon: MeetingRoom, page_id: 10 },
        { title: "Qualifying Schedule Mgmt", link: "/assign_schedule_applicants_qualifying_interview", icon: EditCalendar, page_id: 12 },
        { title: "Interviewer Applicant List", link: "/enrollment_schedule_room_list", icon: People, page_id: 36 },
      ]
    },
  ];

  const medicalMenuGroups = [
    {
      key: "medicalDental", label: "Medical & Dental", icon: MedicalServices, items: [
        { title: "Applicant List", link: "/medical_applicant_list", icon: ListAltOutlined, page_id: 24 },
        { title: "Student Profile", link: "/medical_dashboard1", icon: AccountCircle, page_id: 25 },
        { title: "Documents Submitted", link: "/medical_requirements", icon: FolderCopy, page_id: 30 },
        { title: "Medical Requirements", link: "/medical_requirements_form", icon: MedicalServices, page_id: 31 },
        { title: "Dental Assessment", link: "/dental_assessment", icon: HealthAndSafety, page_id: 19 },
        { title: "Physical & Neuro Exam", link: "/physical_neuro_exam", icon: Psychology, page_id: 32 },
        { title: "Health Records Certificate", link: "/health_record", icon: ContactEmergency, page_id: 140},
        { title: "Medical Certificate", link: "/medical_certificate", icon: MedicalServices, page_id: 130 },
      ]
    },
  ];

  const registrarMenuGroups = [
    {
      key: "registrarOffice", label: "Registrar's Office", icon: HistoryEdu, items: [
        { title: "Applicant List", link: "/super_admin_applicant_list", icon: ListAltOutlined, page_id: 80 },
        { title: "Student Numbering Panel", link: "/student_numbering", icon: Numbers, page_id: 59 },
        { title: "Course Tagging", link: "/course_tagging", icon: Class, page_id: 17 },
        { title: "Student List", link: "/student_list", icon: ListAltOutlined, page_id: 104 },
        { title: "Student Profile", link: "/readmission_dashboard1", icon: AccountCircle, page_id: 38 },
        { title: "Submitted Documents", link: "/submitted_documents", icon: FolderCopy, page_id: 106 },
        {
          title: "Class List", link: classRosterRegistrarLink, icon: Class, page_id: 15,
          activeCheck: () => isClassRosterActive(classRosterRegistrarLink)
        },
        { title: "Search COR", link: "/search_cor", icon: Search, page_id: 56 },
        { title: "Report of Grades", link: "/report_of_grades", icon: Assessment, page_id: 50 },
        { title: "Transcript of Records", link: "/transcript_of_records", icon: HistoryEdu, page_id: 62 },
        { title: "Grading Evaluation", link: "/grading_evaluation_for_registrar", icon: FactCheck, page_id: 105 },
        { title: "COR Exporting Module", link: "/cor_exporting_module", icon: FolderCopy, page_id: 117 },
      ]
    },
  ];

  const courseMenuGroups = [
    {
      key: "courseManagement", label: "Course Management", icon: MenuBook, items: [
        { title: "Program Tagging Panel", link: "/program_tagging", icon: CollectionsBookmark, page_id: 35 },
        { title: "Program Panel Form", link: "/program_panel", icon: LibraryBooks, page_id: 34 },
        { title: "Create Curriculum", link: "/curriculum_panel", icon: EditNote, page_id: 18 },
        { title: "Course Panel Form", link: "/course_panel", icon: MenuBook, page_id: 16 },
        { title: "Program Payment", link: "/program_payment", icon: LibraryBooks, page_id: 111 },
        { title: "Program Unit", link: "/program_unit", icon: MenuBook, page_id: 113 },
        { title: "Prerequisite", link: "/prerequisite", icon: MenuBook, page_id: 112 },
      ]
    },
  ];

  const departmentMenuGroups = [
    {
      key: "departmentManagement", label: "Department Management", icon: Apartment, items: [
        { title: "Schedule Plotting Form", link: "/select_college", icon: EventNote, page_id: 53 },
        { title: "Department Section Panel", link: "/department_section_panel", icon: Apartment, page_id: 20 },
        { title: "Department Panel", link: "/department_registration", icon: Assignment, page_id: 21 },
        { title: "Department Room Panel", link: "/department_room", icon: MeetingRoom, page_id: 22 },
        { title: "Slot Monitoring Panel", link: "/section_slot_monitoring", icon: MeetingRoom, page_id: 123 },
        { title: "Department Curriculum Panel", link: "/department_curriculum_panel", icon: MenuBook, page_id: 107 },
        { title: "College Schedule Plotting", link: "/college_schedule_plotting", icon: EventNote, page_id: 108 },
      ]
    },
  ];

  const systemMenuGroups = [
    {
      key: "roomRequirements", label: "Room & Requirements", icon: MeetingRoom, items: [
        { title: "Room Form", link: "/super_admin_room_registration", icon: MeetingRoom, page_id: 85 },
        { title: "Requirements Panel", link: "/requirements_form", icon: Assignment, page_id: 51 },
      ]
    },
    {
      key: "settingsCommunication", label: "Settings & Communication", icon: Campaign, items: [
        { title: `${shortTerm} Profile`, link: "/settings", icon: Settings, page_id: 74 },
        { title: "Branch Management", link: "/admin_branches", icon: Settings, page_id: 138 },
        { title: "Email Sender", link: "/email_template_manager", icon: Email, page_id: 67 },
        { title: "Announcement", link: "/announcement", icon: Campaign, page_id: 66 },
        { title: "Signature Upload", link: "/signature_upload", icon: Settings, page_id: 114 },
      ]
    },
    {
      key: "sectionSemester", label: "Section & Semester", icon: Class, items: [
        { title: "Section Panel Form", link: "/section_panel", icon: Class, page_id: 57 },
        { title: "Semester Panel Form", link: "/semester_panel", icon: Timeline, page_id: 58 },
        { title: "Change Grading Period", link: "/change_grade_period", icon: ChangeCircle, page_id: 14 },
      ]
    },
    {
      key: "yearSchool", label: "Year & School", icon: CalendarToday, items: [
        { title: "Year Update Panel", link: "/year_update_panel", icon: Update, page_id: 65 },
        { title: "Year Level Panel Form", link: "/year_level_panel", icon: Layers, page_id: 63 },
        { title: "Year Panel Form", link: "/year_panel", icon: CalendarToday, page_id: 64 },
        { title: "School Year Activator", link: "/school_year_activator_panel", icon: EventAvailable, page_id: 54 },
        { title: "School Year Panel", link: "/school_year_panel", icon: DateRange, page_id: 55 },
      ]
    },
    {
      key: "paymentEvaluation", label: "Payment & Evaluation", icon: Assessment, items: [
        { title: "Evaluation Management", link: "/evaluation_crud", icon: HelpOutline, page_id: 23 },
        { title: "TOSF CRUD", link: "/tosf_crud", icon: HelpOutline, page_id: 99 },
        { title: "Payment Exporting Module", link: "/payment_exporting_module", icon: HelpOutline, page_id: 116 },
        { title: "Student Scholarship List", link: "/student_scholarship_list", icon: HelpOutline, page_id: 116 },
        { title: "Receipt Counter Assignment", link: "/assign_receipt_counter", icon: HelpOutline, page_id: 122 },
        { title: "Matriculation Payment", link: "/matriculation_payment", icon: HelpOutline, page_id: 121 },
      ]
    },
  ];

  const accountMenuGroups = [
    {
      key: "accountSettings", label: "Settings", icon: Settings, items: [
        { title: "Settings", link: "/registrar_reset_password", icon: Settings, page_id: 73 },
        { title: "Student Grade File", link: "/student_grade_file", icon: Settings, page_id: 126 },
        { title: "Migration Data Panel", link: "/migration_data_panel", icon: Settings, page_id: 114 },

      ]

    },
    {
      key: "accountCreation", label: "Account Creation", icon: PersonAdd, items: [
        { title: "Add Faculty Accounts", link: "/register_prof", icon: PersonAdd, page_id: 70 },
        { title: "Add Registrar Account", link: "/register_registrar", icon: PersonAdd, page_id: 71 },
        { title: "Add Student Account", link: "/register_student", icon: PersonAdd, page_id: 72 },
        { title: "Professor Education", link: "/superadmin_professor_education", icon: PersonAdd, page_id: 109 },
      ]
    },
    {
      key: "accountInformation", label: "Account Information", icon: Info, items: [
        { title: "Applicant Information", link: "/super_admin_applicant_dashboard1", icon: Info, page_id: 75 },
        { title: "Upload Requirements", link: "/super_admin_requirements_uploader", icon: Info, page_id: 84 },
        { title: "Student Information", link: "/super_admin_student_dashboard1", icon: Info, page_id: 86 },
      ]
    },
    {
      key: "userPageAccess", label: "User Access & Page Table", icon: Security, items: [
        { title: "User Page Access", link: "/user_page_access", icon: Security, page_id: 72 },
        { title: "Page Table", link: "/page_crud", icon: TableChart, page_id: 72 },
      ]
    },
    {
      key: "resetPasswordManagement", label: "Reset Password", icon: SupervisorAccount, items: [
        { title: "Applicant Reset Password", link: "/superadmin_applicant_reset_password", icon: People, page_id: 81 },
        { title: "Student Reset Password", link: "/superadmin_student_reset_password", icon: School, page_id: 91 },
        { title: "Faculty Reset Password", link: "/superadmin_faculty_reset_password", icon: SupervisorAccount, page_id: 82 },
        { title: "Registrar Reset Password", link: "/superadmin_registrar_reset_password", icon: AdminPanelSettings, page_id: 83 },
      ]
    },
  ];

  const sectionMenus = {
    admission: admissionMenuGroups,
    enrollment: enrollmentMenuGroups,
    medical: medicalMenuGroups,
    registrar: registrarMenuGroups,
    course: courseMenuGroups,
    department: departmentMenuGroups,
    system: systemMenuGroups,
    account: accountMenuGroups,
  };

  const managementItems = [
    { key: "admission", title: "Admission Management", path: "/admission_dashboard", icon: Business, page_id: 92 },
    { key: "enrollment", title: "Enrollment Management", path: "/admission_dashboard", icon: Business, page_id: 92 },
    { key: "medical", title: "Medical Management", path: "/admission_dashboard", icon: Business, page_id: 92 },
    { key: "registrar", title: "Registrar Management", path: "/admission_dashboard", icon: Business, page_id: 92 },
    { key: "course", title: "Course Management", path: "/course_management", icon: LibraryBooks, page_id: 93 },
    { key: "department", title: "Department Management", path: "/department_dashboard", icon: Apartment, page_id: 94 },
    { key: "system", title: "System Management", path: "/system_dashboard", icon: Settings, page_id: 95 },
    { key: "account", title: "Account Management", path: "/account_dashboard", icon: People, page_id: 96 },
  ];

  const accessSet = accessObjToSet(userAccessList);
  const registrarDashboard = getRegistrarDashboard(accessSet);

  return (
    <div className="sb-root hidden-print">

      {/* ── Profile ── */}
      <Tooltip arrow>
        <div className="sb-profile">
          <div className="sb-avatar-wrap">
            {avatarSrc ? (
              <Avatar src={avatarSrc} sx={{ width: 40, height: 40, border: `2px solid ${accentColor}` }} />
            ) : (
              <Avatar sx={{ width: 40, height: 40, bgcolor: accentColor, fontSize: 16, border: `2px solid ${accentColor}` }}>
                {personData?.fname?.[0] || "?"}
              </Avatar>
            )}
            {showUploadFor && (
              <>
                <label htmlFor="sb-upload" className="sb-upload-btn">
                  <AddCircleIcon sx={{ fontSize: 14, color: accentColor }} />
                </label>
                <ProfileUploadInput id="sb-upload" onChange={uploadHandlers[role]} />
              </>
            )}
          </div>
          <div className="sb-profile-info">
            <div className="sb-profile-name">
              {personData?.fname ? `${personData.fname} ${personData.lname}` : role || "User"}
            </div>
            <div className="sb-profile-role">
              {role === "registrar"
                ? `${accessDescription} · ${personData?.employee_id || ""}` || "Administrator"
                : role === "student"
                  ? `Student · ${personData?.student_number || ""}`
                  : role === "faculty"
                    ? `Faculty · ${personData?.employee_id || ""}`
                    : role
                      ? role.charAt(0).toUpperCase() + role.slice(1)
                      : ""}
            </div>
            {hasDepartment && (
              <div className="sb-profile-dprtmnt">{personData.dprtmnt_code} Department</div>
            )}
          </div>
        </div>
      </Tooltip>

      {/* ── Scrollable nav ── */}
      <div className="sb-scroll">

        {/* ═══ REGISTRAR ═══ */}
        {role === "registrar" && (
          <>
            <div className="sb-section-label">Navigation</div>
            <NavItem to={registrarDashboard} icon={DashboardIcon} label="Dashboard" active={isActive(registrarDashboard)} />
            <Divider sx={{ bgcolor: "#4a4a4a", my: 1 }} />

            {managementItems.map((item) => {
              if (!userAccessList[item.page_id]) return null;
              const groups = sectionMenus[item.key];

              const hasVisibleItems = groups
                ? groups.some((group) =>
                  group.items.some((si) => si.page_id === undefined || userAccessList[si.page_id])
                )
                : true;
              if (!hasVisibleItems) return null;

              const isAccountSection = item.key === "account";
              const visibleGroups = groups
                ? groups.filter((group) =>
                  group.items.some((si) => si.page_id === undefined || userAccessList[si.page_id])
                )
                : [];
              const onlySettingsGroup =
                isAccountSection &&
                visibleGroups.length === 1 &&
                visibleGroups[0].key === "accountSettings";

              return (
                <div key={item.key}>
                  <div className="sb-section-label">{item.title}</div>

                  {onlySettingsGroup ? (
                    visibleGroups[0].items
                      .filter((si) => si.page_id === undefined || userAccessList[si.page_id])
                      .map((si) => (
                        <NavItem
                          key={si.link}
                          to={si.link}
                          icon={si.icon}
                          label={si.title}
                          active={si.activeCheck ? si.activeCheck() : isActive(si.link)}
                        />
                      ))
                  ) : groups ? (
                    groups.map((group) => {
                      const visibleItems = group.items.filter(
                        (si) => si.page_id === undefined || userAccessList[si.page_id]
                      );
                      if (visibleItems.length === 0) return null;
                      const gKey = `${item.key}_${group.key}`;
                      const open = isGroupOpen(gKey);
                      return (
                        <div key={gKey}>
                          <GroupToggle
                            label={group.label}
                            icon={group.icon}
                            open={open}
                            onToggle={() => toggleGroup(gKey)}
                          />
                          {open && visibleItems.map((si) => (
                            <NavItem
                              key={si.link}
                              to={si.link}
                              icon={si.icon}
                              label={si.title}
                              // ── Per-item active override for Class Roster ──
                              active={si.activeCheck ? si.activeCheck() : isActive(si.link)}
                              sub
                            />
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    <NavItem
                      to={item.path}
                      icon={item.icon}
                      label={`Open ${item.title}`}
                      active={isActive(item.path)}
                    />
                  )}

                  <Divider sx={{ bgcolor: "#4a4a4a", my: 1 }} />
                </div>
              );
            })}

            <div className="sb-divider" />
          </>
        )}

        {/* ═══ APPLICANT ═══ */}
        {role === "applicant" && (
          <>
            <div className="sb-section-label">Navigation</div>
            <NavItem to="/applicant_dashboard" icon={DashboardIcon} label="Dashboard" active={isActivePrefix("/applicant_dashboard")} />
            <NavItem
              icon={AssignmentIndIcon}
              label="Applicant Form"
              active={isActivePrefix("/dashboard/")}
              onClick={() => {
                let keys = JSON.parse(localStorage.getItem("dashboardKeys"));
                if (!keys) {
                  const g = () => Math.random().toString(36).substring(2, 10);
                  keys = { step1: g(), step2: g(), step3: g(), step4: g(), step5: g() };
                  localStorage.setItem("dashboardKeys", JSON.stringify(keys));
                }
                window.location.href = `/dashboard/${keys.step1}`;
              }}
            />
            <NavItem to="/requirements_uploader" icon={CloudUploadIcon} label="Upload Requirements" active={isActivePrefix("/requirements_uploader")} />
            <div className="sb-section-label">Setting</div>
            <NavItem to="/applicant_reset_password" icon={LockResetIcon} label="Change Password" active={isActivePrefix("/applicant_reset_password")} />
          </>
        )}

        {/* ═══ FACULTY ═══ */}
        {role === "faculty" && (
          <>
            <div className="sb-section-label">Navigation</div>
            <NavItem to="/faculty_dashboard" icon={DashboardIcon} label="Dashboard" active={isActive("/faculty_dashboard")} />
            <NavItem to="/faculty_workload" icon={WorkIcon} label="Workload" active={isActive("/faculty_workload")} />
            <NavItem to="/faculty_masterlist" icon={ListAltIcon} label="Class List" active={isActive("/faculty_masterlist")} />
            <NavItem to="/grading_sheet" icon={AssignmentTurnedInIcon} label="Grading Management" active={isActive("/grading_sheet")} />
            <NavItem to="/faculty_evaluation" icon={SchoolIcon} label="Faculty Evaluation" active={isActive("/faculty_evaluation")} />
            <div className="sb-section-label">Setting</div>
            <NavItem to="/faculty_reset_password" icon={Settings} label="Settings" active={isActive("/faculty_reset_password")} />
          </>
        )}

        {/* ═══ STUDENT ═══ */}
        {role === "student" && (
          <>
            <div className="sb-section-label">Navigation</div>
            <NavItem to="/student_dashboard" icon={DashboardIcon} label="Dashboard" active={isActive("/student_dashboard")} />
            <NavItem to="/student_schedule" icon={EventNoteIcon} label="Schedule" active={isActive("/student_schedule")} />
            <NavItem to="/grades_page" icon={GradeIcon} label="Grades" active={isActive("/grades_page")} />
            <NavItem to="/student_faculty_evaluation" icon={AssignmentTurnedInIcon} label="Faculty Evaluation" active={isActive("/student_faculty_evaluation")} />
            <NavItem to="/student_dashboard1" icon={PersonIcon} label="Student Profile" active={/^\/student_dashboard[1-5]$/.test(loc)} />
            <div className="sb-section-label">Setting</div>
            <NavItem to="/student_reset_password" icon={Settings} label="Settings" active={isActive("/student_reset_password")} />
          </>
        )}

        <div style={{ height: 12 }} />
      </div>

      {/* ── Footer / Logout ── */}
      <div className="sb-footer">
        <div className="sb-logout" onClick={Logout}>
          <span className="sb-icon"><LogoutOutlined sx={{ fontSize: 19 }} /></span>
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
