
import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  Grid,
  Typography,
  Table,
  Card,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import LinearWithValueLabel from "../components/LinearWithValueLabel";
import { Snackbar, Alert } from "@mui/material";
import { FaFileExcel } from "react-icons/fa";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SearchIcon from '@mui/icons-material/Search';
import API_BASE_URL from "../apiConfig";
import { useNavigate } from "react-router-dom";
import ScoreIcon from '@mui/icons-material/Score';
const CourseTagging = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff"); // ✅ NEW
  const [stepperColor, setStepperColor] = useState("#000000"); // ✅ NEW

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
    if (settings.main_button_color)
      setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color)
      setSubButtonColor(settings.sub_button_color); // ✅ NEW
    if (settings.stepper_color) setStepperColor(settings.stepper_color); // ✅ NEW

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

  const [data, setdata] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [personID, setPersonID] = useState("");
  //////////
  const [hasAccess, setHasAccess] = useState(null);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");

  const pageId = 17;
  
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
      const response = await axios.get(
        `${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`
      );
      if (response.data && response.data.page_privilege === 1) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Error checking access:", error);
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
    { label: "Admission Process For College", to: "/applicant_list", icon: <SchoolIcon fontSize="large" /> },
    { label: "Applicant Form", to: "/registrar_dashboard1", icon: <AssignmentIcon fontSize="large" /> },
    { label: "Student Requirements", to: "/registrar_requirements", icon: <AssignmentTurnedInIcon fontSize="large" /> },
    { label: "Qualifying / Interview Exam Score", to: "/qualifying_interview_exam_scores", icon: <ScoreIcon fontSize="large" /> },
    { label: "Student Numbering", to: "/student_numbering_per_college", icon: <DashboardIcon fontSize="large" /> },
    { label: "Course Tagging", to: "/course_tagging", icon: <MenuBookIcon fontSize="large" /> },
    {
      label: (
        <>
          Certificate of <br />
          Registration
        </>
      ),
      to: "/search_cor_for_college",
      icon: <SearchIcon fontSize="large" />,
    },

  ];

  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(5);
  const [clickedSteps, setClickedSteps] = useState(
    Array(tabs.length).fill(false)
  );

  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours() % 12 || 12).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";

      const formattedDate = `${month} ${day}, ${year} ${hours}:${minutes}:${seconds} ${ampm}`;
      setCurrentDate(formattedDate);
    };

    updateDate();
    const interval = setInterval(updateDate, 1000);
    return () => clearInterval(interval);
  }, []);

  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [studentNumber, setStudentNumber] = useState("");
  const [userId, setUserId] = useState(null); // Dynamic userId (student_number)
  const [first_name, setUserFirstName] = useState(null);
  const [middle_name, setUserMiddleName] = useState(null);
  const [last_name, setUserLastName] = useState(null);
  const [currId, setCurr] = useState(null);
  const [courseCode, setCourseCode] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [yearLevel, setYearLevel] = useState([]);
  const [subjectCounts, setSubjectCounts] = useState({});
  const [isenrolled, setIsEnrolled] = useState(null);
  const [disableYearButtons, setDisableYearButtons] = useState(false);
  const [activeSemester, setActiveSemester] = useState("");

  // 🔍 Map of course_id -> { allowed, hasPrereq }
  const [prereqMap, setPrereqMap] = useState({});

  const [searchQuery, setSearchQuery] = useState("");


  // Modal for confirming enroll (single or bulk)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'single'|'bulk', course?, yearLevelId? }
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");

  const fetchSubjectCounts = async (sectionId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/subject-enrollment-count`,
        {
          params: { sectionId },
        }
      );

      const counts = {};
      response.data.forEach((item) => {
        counts[item.course_id] = item.enrolled_count;
      });

      setSubjectCounts(counts);
    } catch (err) {
      console.error("Failed to fetch subject counts", err);
    }
  };

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_year_level`)
      .then((res) => setYearLevel(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_active_semester`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setActiveSemester(res.data[0].semester_description);
        } else {
          setActiveSemester("No Active Semester");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchSubjectCounts(selectedSection);
    }
  }, [selectedSection]);

  useEffect(() => {
    if (currId) {
      axios
        .get(`${API_BASE_URL}/courses/${currId}`)
        .then((res) => setCourses(res.data))
        .catch((err) => console.error(err));
    }
  }, [currId]);

  useEffect(() => {
    if (userId && currId) {
      axios
        .get(`${API_BASE_URL}/enrolled_courses/${userId}/${currId}`)
        .then((res) => setEnrolled(res.data))
        .catch((err) => console.error(err));
    }
  }, [userId, currId]);

  // Fetch department sections when component mounts
  useEffect(() => {
    fetchDepartmentSections();
  }, []);

  // Fetch sections whenever selectedDepartment changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchDepartmentSections();
    }
  }, [selectedDepartment]);

  // Fetch department sections based on selected department
  const fetchDepartmentSections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/department-sections`,
        {
          params: { departmentId: selectedDepartment },
        }
      );
      // Artificial delay
      setTimeout(() => {
        setSections(response.data);
        setLoading(false);
      }, 700);
    } catch (err) {
      console.error("Error fetching department sections:", err);
      setError("Failed to load department sections");
      setLoading(false);
    }
  };

  const handleSectionChange = async (e) => {
    const sectionId = e.target.value;
    setSelectedSection(sectionId);
    console.log("Selected section ID:", sectionId);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/update-active-curriculum`,
        {
          studentId: studentNumber,
          departmentSectionId: sectionId,
        }
      );

      const courseRes = await axios.get(
        `${API_BASE_URL}/api/search-student/${sectionId}`
      );
      
      if (courseRes.data.length > 0) {
        setCurr(courseRes.data[0].curriculum_id);
        setCourseCode(courseRes.data[0].program_code);
        setCourseDescription(courseRes.data[0].program_description);
      } else {
        console.warn("No program data found for selected section");
      }

      console.log("Curriculum updated:", response.data);
    } catch (error) {
      console.error("Error updating curriculum:", error);
    }
  };

  const isEnrolled = (course_id) =>
    enrolled.some((item) => item.course_id === course_id);

  // ✅ Has prerequisite based on backend-computed map
  const hasCoursePrereq = (course) => {
    const status = prereqMap[course.course_id];
    return status ? status.hasPrereq === true : false;
  };


  // 🔍 Helper to check prerequisites using backend (fixed)
  const checkPrerequisite = async (student_number, course_id) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/check-prerequisite`,
        {
          student_number,
          course_id,
        }
      );

      // Backend returns: { allowed, status, message, failedPrereq?, missingPrereq? }

      // If backend did not include "allowed", treat as error
      if (typeof data.allowed !== "boolean") {
        return {
          allowed: false,
          reason: "ERROR",
          status: data.status,
          message:
            data.message ||
            "Invalid response from prerequisite API. Please contact administrator.",
        };
      }

      // ✅ If allowed = true → we don’t care about status, let them enroll
      if (data.allowed) {
        return {
          allowed: true,
          reason: "OK",
          status: data.status,
          message: data.message,
        };
      }

      // ❌ Not allowed → map backend status to the reasons used in addToCart/addAllToCart
      let reason = "ERROR";

      if (data.status === "FAILED_PREREQ") {
        reason = "FAILED_PREREQUISITE";
      } else if (data.status === "MISSING_PREREQ") {
        reason = "MISSING_OR_NOT_PASSED_PREREQUISITE";
      }

      return {
        allowed: false,
        reason,
        status: data.status,
        message: data.message,
        failedPrereq: data.failedPrereq || [],
        missingPrereq: data.missingPrereq || [],
      };
    } catch (err) {
      console.error("Error calling /api/check-prerequisite:", err);
      return {
        allowed: false,
        reason: "ERROR",
        status: "REQUEST_ERROR",
        message: "Error calling prerequisite API.",
      };
    }
  };

  // 🟢🟠 Precompute prerequisite status for highlighting rows (backend-driven)
  useEffect(() => {
    const computePrereqStatus = async () => {
      if (!userId || courses.length === 0) {
        setPrereqMap({});
        return;
      }

      const map = {};

      for (const course of courses) {
        // Always ask backend about this course
        const res = await checkPrerequisite(userId, course.course_id);

        // Backend status tells us if the subject actually has a prerequisite
        let hasPrereq = true;
        if (
          res.status === "NO_PREREQ" ||
          res.status === "PREREQ_NOT_FOUND"
        ) {
          hasPrereq = false;
        }

        map[course.course_id] = {
          allowed: !!res.allowed, // true = meets prereq / or no prereq
          hasPrereq,               // true = course has prerequisite
        };
      }

      setPrereqMap(map);
    };

    computePrereqStatus();
  }, [userId, courses]);


  const addToCart = async (course) => {
    if (!selectedSection) {
      setSnack({
        open: true,
        message:
          "Please select a department section before enrolling in a course.",
        severity: "warning",
      });
      return;
    }

    if (!userId) {
      setSnack({
        open: true,
        message: "Please search and select a student first.",
        severity: "warning",
      });
      return;
    }

    if (isEnrolled(course.course_id)) {
      return;
    }

    const payload = {
      subject_id: course.course_id,
      department_section_id: selectedSection,
    };

    try {
      // ✅ ALWAYS ENROLL – NO PREREQ BLOCK HERE
      await axios.post(
        `${API_BASE_URL}/add-to-enrolled-courses/${userId}/${currId}/`,
        payload
      );

      // Refresh enrolled courses list after adding
      const { data } = await axios.get(
        `${API_BASE_URL}/enrolled_courses/${userId}/${currId}`
      );
      setEnrolled(data);

      setSnack({
        open: true,
        message: `Enrolled ${course.course_code} successfully.`,
        severity: "success",
      });
    } catch (err) {
      console.error("Error adding course or refreshing enrolled list:", err);
      setSnack({
        open: true,
        message: "Error enrolling in this course. Please try again.",
        severity: "error",
      });
    }
  };

  //------------delete
  //------------delete
  const deleteFromCart = async (id) => {
    if (!id) {
      console.error("No ID provided to deleteFromCart");
      return;
    }

    try {
      // Delete the specific enrolled_subject row
      const res = await axios.delete(`${API_BASE_URL}/courses/delete/${id}`);
      console.log("Delete response:", res.data);

      // Refresh enrolled courses list
      const { data } = await axios.get(
        `${API_BASE_URL}/enrolled_courses/${userId}/${currId}`
      );
      setEnrolled(data);

      setSnack({
        open: true,
        message: "Subject unenrolled successfully.",
        severity: "success",
      });

      console.log(`Course with ID ${id} deleted and enrolled list updated`);
    } catch (err) {
      console.error(
        "Error deleting course or refreshing enrolled list:",
        err.response?.data || err.message || err
      );

      setSnack({
        open: true,
        message: "Error unenrolling subject. Please check the console.",
        severity: "error",
      });
    }
  };
  //-------delete

  //-------delete


  const addAllToCart = async (yearLevelId) => {
    const newCourses = courses.filter((c) => !isEnrolled(c.course_id));

    if (!selectedSection) {
      setSnack({
        open: true,
        message:
          "Please select a department section before adding all the courses.",
        severity: "warning",
      });
      return;
    }

    if (!userId) {
      setSnack({
        open: true,
        message: "Please search and select a student first.",
        severity: "warning",
      });
      return;
    }

    if (newCourses.length === 0) return;

    let enrolledCount = 0;

    try {
      await Promise.all(
        newCourses.map(async (course) => {
          try {
            // ✅ ALWAYS ENROLL, IGNORE PREREQUISITE RESULT
            await axios.post(`${API_BASE_URL}/add-all-to-enrolled-courses`, {
              subject_id: course.course_id,
              user_id: userId,
              curriculumID: currId,
              departmentSectionID: selectedSection,
              year_level: yearLevelId,
            });

            enrolledCount++;
            setDisableYearButtons(true);
          } catch (err) {
            console.error("Error enrolling course in bulk:", err);
          }
        })
      );

      // Refresh enrolled courses list
      const { data } = await axios.get(
        `${API_BASE_URL}/enrolled_courses/${userId}/${currId}`
      );
      setEnrolled(data);

      if (data.length > 0) {
        setCourseCode(data[0].program_code);
        setCourseDescription(data[0].program_description);
        setSectionDescription(data[0].section);
      }

      if (enrolledCount > 0) {
        setSnack({
          open: true,
          message: "Bulk enroll finished. All available subjects were enrolled.",
          severity: "success",
        });
      } else {
        setSnack({
          open: true,
          message: "No new subjects were enrolled.",
          severity: "info",
        });
      }
    } catch (err) {
      console.error("Unexpected error during enrollment:", err);
      setSnack({
        open: true,
        message: "Unexpected error during bulk enrollment.",
        severity: "error",
      });
    }
  };


  const deleteAllCart = async () => {
    try {
      // Delete all user courses
      await axios.delete(`${API_BASE_URL}/courses/user/${userId}`);
      // Refresh enrolled courses list
      const { data } = await axios.get(
        `${API_BASE_URL}/enrolled_courses/${userId}/${currId}`
      );
      setEnrolled(data);
      setDisableYearButtons(false);
      console.log("Cart cleared and enrolled courses refreshed");
    } catch (err) {
      console.error("Error deleting cart or refreshing enrolled list:", err);
    }
  };

  const handleSearchStudent = async () => {
    if (!studentNumber.trim()) {
      setSnack({
        open: true,
        message: "Please fill in the student number",
        severity: "warning",
      });

      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/student-tagging`,
        { studentNumber },
        { headers: { "Content-Type": "application/json" } }
      );

      const {
        token2,
        isEnrolled,
        person_id2,
        studentNumber: studentNum,
        section: section,
        activeCurriculum: effectiveProgram,
        yearLevel,
        courseCode: courseCode,
        courseDescription: courseDescription,
        firstName: first_name,
        middleName: middle_name,
        lastName: last_name,
      } = response.data;

      localStorage.setItem("token2", token2);
      localStorage.setItem("person_id2", person_id2);
      localStorage.setItem("studentNumber", studentNum);
      localStorage.setItem("activeCurriculum", effectiveProgram);
      localStorage.setItem("yearLevel", yearLevel);
      localStorage.setItem("courseCode", courseCode);
      localStorage.setItem("courseDescription", courseDescription);
      localStorage.setItem("firstName", first_name);
      localStorage.setItem("middleName", middle_name);
      localStorage.setItem("lastName", last_name);
      localStorage.setItem("section", section);
      localStorage.setItem("isEnrolled", isEnrolled);

      setUserId(studentNum); // Set dynamic userId (used as student_number)
      setUserFirstName(first_name);
      setUserMiddleName(middle_name);
      setUserLastName(last_name);
      setCurr(effectiveProgram);
      setCourseCode(courseCode);
      setCourseDescription(courseDescription);
      setPersonID(person_id2);
      setSectionDescription(section);
      setIsEnrolled(isEnrolled);

      setSnack({
        open: true,
        message: "Student found and authenticated!",
        severity: "success",
      });
    } catch (error) {
      console.log("");
      setSnack({
        open: true,
        message: "Student not found or error processing request.",
        severity: "error",
      });
    }
  };

  // Fetch all departments when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/departments`);
        setDepartments(res.data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    fetchDepartments();
  }, []);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleSelect = (departmentId) => {
    setSelectedDepartment(departmentId);
  };

  const handleImport = async () => {
    try {
      if (!selectedFile) {
        setSnack({
          open: true,
          message: "Please choose a file first!",
          severity: "warning",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await axios.post(`${API_BASE_URL}/api/import-xlsx`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setSnack({
          open: true,
          message: res.data.message || "Excel imported successfully!",
          severity: "success",
        });
        setSelectedFile(null);
      } else {
        setSnack({
          open: true,
          message: res.data.error || "Failed to import",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("❌ Import error:", err);
      setSnack({
        open: true,
        message: "Import failed: " + (err.response?.data?.error || err.message),
        severity: "error",
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };


  // 🟢🟠 Row style based on prerequisite qualification
  const getCourseRowSx = (course) => {
    const status = prereqMap[course.course_id];
    if (!status) return {};
    // Green: meets qualification (either no prereq or allowed)
    if (!status.hasPrereq || status.allowed) {
      return { backgroundColor: "#e6ffe6" }; // light green
    }
    // Orange: has prereq but does NOT meet qualification
    return { backgroundColor: "#ffeacc" }; // light orange
  };

  // Wrapper: single enroll click → show modal if course has prerequisite
  const handleEnrollClick = async (course) => {
    if (!selectedSection) {
      setSnack({
        open: true,
        message:
          "Please select a department section before enrolling in a course.",
        severity: "warning",
      });
      return;
    }

    if (!userId) {
      setSnack({
        open: true,
        message: "Please search and select a student first.",
        severity: "warning",
      });
      return;
    }

    if (isEnrolled(course.course_id)) {
      return;
    }

    const status = prereqMap[course.course_id];

    // If backend says this subject has prerequisite(s), show confirmation modal
    if (status && status.hasPrereq) {
      let msg = `The subject ${course.course_code} has prerequisite subject(s).\n\n`;

      if (status.allowed) {
        msg +=
          "The student meets the prerequisite qualification.\n\nDo you want to continue enrolling this subject?";
      } else {
        msg +=
          "The student does NOT meet the prerequisite qualification (failed or not yet passed).\n\nDo you still want to attempt to enroll this subject?";
      }

      setPendingAction({ type: "single", course });
      setConfirmDialogMessage(msg);
      setConfirmDialogOpen(true);
    } else {
      // No prereq → enroll directly
      await addToCart(course);
    }
  };


  // Wrapper: bulk enroll click → show modal if at least one course has prerequisite
  const handleBulkEnrollClick = async (yearLevelId) => {
    if (!selectedSection) {
      setSnack({
        open: true,
        message:
          "Please select a department section before adding all the courses.",
        severity: "warning",
      });
      return;
    }

    if (!userId) {
      setSnack({
        open: true,
        message: "Please search and select a student first.",
        severity: "warning",
      });
      return;
    }

    const newCourses = courses.filter((c) => !isEnrolled(c.course_id));
    if (newCourses.length === 0) return;
    
    console.log("Hello: ", newCourses);

    const coursesWithPrereq = newCourses.filter((c) => hasCoursePrereq(c));

    if (coursesWithPrereq.length === 0) {
      await addAllToCart(yearLevelId);
      return;
    }

    const listText = coursesWithPrereq
      .map((c) => {
        const status = prereqMap[c.course_id];
        let tag = "";
        if (status) {
          if (status.allowed) tag = " (qualified)";
          else tag = " (NOT qualified)";
        }
        return `• ${c.course_code}${tag}`;
      })
      .join("\n");

    const msg = `You are trying to enroll multiple subjects that have prerequisites:\n\n${listText}\n\nGreen-highlighted rows mean the student meets the prerequisite qualification.\nOrange-highlighted rows mean the student does NOT meet the prerequisite qualification.\n\nDo you want to continue with bulk enrollment?`;

    setPendingAction({ type: "bulk", yearLevelId });
    setConfirmDialogMessage(msg);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setPendingAction(null);
    setConfirmDialogMessage("");
  };

  const handleConfirmDialogProceed = async () => {
    if (!pendingAction) {
      handleConfirmDialogClose();
      return;
    }

    try {
      if (pendingAction.type === "single" && pendingAction.course) {
        await addToCart(pendingAction.course);
      } else if (pendingAction.type === "bulk" && pendingAction.yearLevelId) {
        await addAllToCart(pendingAction.yearLevelId);
      }
    } finally {
      handleConfirmDialogClose();
    }
  };

  const formatYear = (year) => {
    switch (year) {
      case "First Year": return "1st Year";
      case "Second Year": return "2nd Year";
      case "Third Year": return "3rd Year";
      case "Fourth Year": return "4th Year";
      case "Fifth Year": return "5th Year";
      default: return year;
    }
  };

  const formatSemester = (semester) => {
    switch (semester) {
      case "First Semester": return "1st Sem";
      case "Second Semester": return "2nd Sem";
      case "Summer": return "Summer";
      default: return semester;
    }
  };

  useEffect(() => {
    if (!studentNumber) return;

    const delayDebounce = setTimeout(() => {
      handleSearchStudent();
    }, 500); // ⏱️ adjust delay if needed

    return () => clearTimeout(delayDebounce);
  }, [studentNumber]);

  // Put this at the very bottom before the return
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 2, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",

          mb: 2,
          px: 1,
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
          COURSE TAGGING PANEL
        </Typography>


      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />



      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "nowrap", // ❌ prevent wrapping
          width: "100%",
          mt: 2,
        }}
      >
        {tabs.map((tab, index) => (
          <React.Fragment key={index}>
            <Card
              onClick={() => handleStepClick(index, tab.to)}
              sx={{
                flex: 1,
                maxWidth: `${100 / tabs.length}%`,
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: 2,
                border: `2px solid ${borderColor}`,
                backgroundColor:
                  activeStep === index
                    ? settings?.header_color || "#1976d2"
                    : "#E8C999",
                color: activeStep === index ? "#fff" : "#000",
                boxShadow:
                  activeStep === index
                    ? "0px 4px 10px rgba(0,0,0,0.3)"
                    : "0px 2px 6px rgba(0,0,0,0.15)",
                transition: "0.3s ease",
                "&:hover": {
                  backgroundColor:
                    activeStep === index ? "#000000" : "#f5d98f",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box sx={{ fontSize: 32, mb: 0.5 }}>{tab.icon}</Box>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            </Card>
            {index < tabs.length - 1 && (
              <Box
                sx={{
                  flex: 0.1,
                  mx: 1,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>

      <div style={{ height: "40px" }}></div>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between", // LEFT + RIGHT
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          paddingRight: 2,
          mr: 2,
        }}
      >

        {/* LEFT SIDE — Download Template */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              window.location.href = `${API_BASE_URL}/grade_report_template`;
            }}
            style={{
              padding: "5px 20px",
              border: "2px solid black",
              backgroundColor: "#f0f0f0",
              color: "black",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              height: "40px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "225px",
              pointerEvents: "auto",
            }}
          >
            📥 Download Template
          </button>
        </div>

        {/* RIGHT SIDE — Choose Excel + Upload */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >

          {/* CHOOSE EXCEL */}
          <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 200 }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="excel-upload"
            />

            <button
              onClick={() => document.getElementById("excel-upload").click()}
              style={{
                border: "2px solid green",
                backgroundColor: "#f0fdf4",
                color: "green",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                height: "50px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center",
                userSelect: "none",
                width: "200px",

              }}
              type="button"
            >
              <FaFileExcel size={20} />
              Choose Excel
            </button>
          </Box>

          {/* UPLOAD BUTTON */}
          <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 200 }}>
            <Button
              variant="contained"
              fullWidth
              sx={{
                background: `${mainButtonColor}`,
                color: "white",
                height: "50px",
                width: "200px",
                fontWeight: "bold",
                border: "2px solid black"
              }}
              onClick={handleImport}
            >
              Upload
            </Button>
          </Box>

        </Box>

      </Box>


      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ color: subtitleColor, fontSize: "42px" }}
        textAlign="center"
        gutterBottom
        mb={3}
      >
        Select Department
      </Typography>
      <Grid
        container
        spacing={4}
        gap={2}
        justifyContent="center"
        textAlign="center"
        style={{ backgroundColor: "white", mt: 2, padding: "1rem 0rem" }}
      >
        {departments.map((dept, index) => (
          <Grid key={dept.dprtmnt_id}>
            <Button
              fullWidth
              key={index}
              variant="contained"
              value={dept.dprtmnt_id}
              onClick={() => handleSelect(dept.dprtmnt_id)}
              sx={{
                mt: 2,
                width: 100,
                height: 45,
                fontWeight: "bold",
                backgroundColor:
                  selectedDepartment === dept.dprtmnt_id
                    ? `${mainButtonColor}`
                    : "white",
                color:
                  selectedDepartment === dept.dprtmnt_id
                    ? "white"
                    : `${mainButtonColor}`,
                border: `2px solid ${borderColor}`,
                "&:hover": {
                  backgroundColor: `${mainButtonColor}`,
                  color: "white",
                },
              }}
              style={{ opacity: "1px" }}
            >
              {dept.dprtmnt_code}
            </Button>
          </Grid>
        ))}
      </Grid>



      <Box
        p={4}
        display="grid"
        gridTemplateColumns="1fr 1fr"
        gap={4}
        style={{
          marginLeft: "-1rem",
          height: "calc(90vh - 120px)",
          width: "100rem",
        }}
      >
        {/* Available Courses */}
        <Box
          component={Paper}
          backgroundColor={"#f1f1f1"}
          p={2}
          sx={{ border: `2px solid ${borderColor}`, overflowX: "auto", width: "100%" }}
        >
          {/* Search Student */}

          <Box>
            <Typography variant="h6">
              Name: &emsp;
              {first_name} {middle_name} {last_name}
              <br />
              Department/Course/Section: &emsp;
              <br />
              {courseCode || courseDescription || sectionDescription ? (
                isenrolled ? (
                  <>
                    {courseCode && `(${courseCode}) `} -
                    {courseDescription && courseDescription}{" "} -
                    {sectionDescription && sectionDescription}
                  </>
                ) : (
                  "Not currently enrolled"
                )
              ) : (
                ""
              )}
            </Typography>

            <TextField
              label="Student Number"
              fullWidth
              margin="normal"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchStudent();
                }
              }}
            />
            <Typography variant="h6">Search Course Code / Description:</Typography>
            <TextField
              label="Search Course (Code or Description)"
              variant="outlined"
              fullWidth
              margin="normal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            />


            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSearchStudent}
            >
              Search
            </Button>
          </Box>


          <Typography variant="h6" mt={2} gutterBottom>
            Available Courses
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  style={{
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                    width: 120,
                  }}
                >
                  Course Code
                </TableCell>
                <TableCell
                  style={{
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Description
                </TableCell>


                <TableCell
                  style={{
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Credit Unit
                </TableCell>
                <TableCell
                  style={{
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Prerequisites
                </TableCell>
                <TableCell
                  style={{
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Enrolled <br /> Students
                </TableCell>

                <TableCell
                  style={{
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses
                .filter((c) => {
                  const text = searchQuery.toLowerCase();
                  return (
                    c.course_code.toLowerCase().includes(text) ||
                    c.course_description.toLowerCase().includes(text)
                  );
                })
                .map((c) => (

                  <TableRow key={c.course_id} sx={getCourseRowSx(c)}>
                    <TableCell style={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                      {c.course_code}
                    </TableCell>
                    <TableCell style={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                      {c.course_description}
                    </TableCell>

                    <TableCell style={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                      {c.course_unit}
                    </TableCell>
                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                      }}
                    >
                      {c.prereq
                        ? c.prereq.split(",").map(p => p.trim()).join(", ")
                        : "None"}
                    </TableCell>

                    <TableCell
                      style={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                      }}
                    >
                      {subjectCounts[c.course_id] || 0}
                    </TableCell>
                    <TableCell style={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                      {!isEnrolled(c.course_id) ? (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleEnrollClick(c)}
                          disabled={!userId}
                        >
                          Enroll
                        </Button>
                      ) : (
                        <Typography color="textSecondary">Enrolled</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>



        <Box
          component={Paper}
          backgroundColor="#f1f1f1"
          p={2}
          sx={{
            border: `2px solid ${borderColor}`,
            width: "100%",
            overflowX: "auto",   // ✅ horizontal scroll here
          }}
        >

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              mb: 1,
            }}
          >
            {/* LEFT SIDE — LABEL */}
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Department Section:
            </Typography>

            {/* RIGHT SIDE — COR BUTTON */}
            <Button
              style={{
                background: `${mainButtonColor}`,
                color: "white",
                fontWeight: "bold",
              }}
              onClick={() => {
                if (studentNumber) {
                  localStorage.setItem("studentNumberForCOR", studentNumber);
                  window.open("/search_cor", "_blank");
                } else {
                  setSnack({
                    open: true,
                    message: "Please select or provide a student number first",
                    severity: "warning",
                  });
                }
              }}
            >
              COR
            </Button>
          </Box>

          {/* Department Sections Dropdown */}
          {loading ? (
            <Box sx={{ width: "100%", mt: 2 }}>
              <LinearWithValueLabel />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <TextField
              select
              fullWidth
              sx={{ width: 830 }}
              value={selectedSection}
              onChange={handleSectionChange}
              variant="outlined"
              margin="normal"
              label="Select a Department Section"
            >
              <MenuItem value="">
                <em>Select a department section</em>
              </MenuItem>
              {sections.map((section) => (
                <MenuItem
                  key={section.department_and_program_section_id}
                  value={section.department_and_program_section_id}
                >
                  (
                  <strong>{section.program_code}</strong>) -{" "}
                  {section.program_description}{" "}
                  {section.major || ""} - {section.description}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Typography variant="h6">Year Level Button</Typography>
          <Box sx={{ mb: 2 }}>
            <Box display="flex" gap={2} mt={2}>
              {yearLevel.map((year_level, index) => (
                <Button
                  key={index}
                  variant="contained"
                  color="success"
                  onClick={() => handleBulkEnrollClick(year_level.year_level_id)}
                  sx={{
                    minWidth: 125,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {formatYear(year_level.year_level_description)}{" "}<br />
                  {formatSemester(activeSemester)}

                </Button>
              ))}

              <Button
                variant="contained"
                color="warning"
                sx={{ minWidth: 125 }}
                onClick={deleteAllCart}
              >
                Unenroll All
              </Button>
            </Box>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >



            </Box>


          </Box>

          <Typography variant="h6" gutterBottom>
            Enrolled Courses
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  style={{
                    display: "none",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  Enrolled Subject ID
                </TableCell>
                <TableCell
                  style={{
                    display: "none",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  Subject ID
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  SUBJECT CODE
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  LEC UNIT
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  LAB UNIT
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  CREDIT UNIT
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  SECTION
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  DAY
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  TIME
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  ROOM
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  FACULTY
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  ENROLLED STUDENTS
                </TableCell>
                <TableCell
                  style={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {enrolled.map((e, idx) => (
                <TableRow key={idx}>
                  <TableCell
                    style={{
                      display: "none",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.id}
                  </TableCell>
                  <TableCell
                    style={{
                      display: "none",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.course_id}
                  </TableCell>

                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.course_code}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.lec_unit}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.lab_unit}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.course_unit}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.program_code}-{e.description}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.day_description}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.school_time_start}-{e.school_time_end}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {e.room_description}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    Prof. {e.lname}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    ({e.number_of_enrolled})
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    <Button
                      style={{ textAlign: "center" }}
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => deleteFromCart(e.id)}
                    >
                      Unenroll
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell
                  colSpan={1}
                  sx={{
                    textAlign: "center",
                    fontWeight: "600",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  Total Unit
                </TableCell>

                <TableCell
                  colSpan={2}
                  sx={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  {enrolled.reduce(
                    (sum, item) => sum + (parseFloat(item.course_unit) || 0),
                    0
                  ) +
                    enrolled.reduce(
                      (sum, item) => sum + (parseFloat(item.lab_unit) || 0),
                      0
                    )}
                </TableCell>

                {/* Spacer */}
                <TableCell
                  colSpan={7}
                  sx={{ border: `2px solid ${borderColor}` }}
                />

                {/* ACTION CELL — must fit remaining columns */}
                <TableCell
                  colSpan={1}
                  sx={{
                    textAlign: "center",
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    size="small"

                    onClick={deleteAllCart}
                  >
                    Unenroll All
                  </Button>
                </TableCell>
              </TableRow>

            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* Confirm modal for enrolling courses with prerequisites */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm Enrollment</DialogTitle>
        <DialogContent>
          <DialogContentText style={{ whiteSpace: "pre-line" }}>
            {confirmDialogMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button
            onClick={handleConfirmDialogProceed}
            variant="contained"
            color="primary"
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack({ ...snack, open: false })}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseTagging;
