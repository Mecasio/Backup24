import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box, Typography, Button, Snackbar, Alert, FormControl, Select, MenuItem, TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ProgramTaggingFilter from "../registrar/ProgramTaggingFilter";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";


const ProgramTagging = () => {
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
  const [branches, setBranches] = useState([]);

  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const [filteredPrograms, setFilteredPrograms] = useState([]);

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
    if (settings?.branches) {
      try {
        const parsed =
          typeof settings.branches === "string"
            ? JSON.parse(settings.branches)
            : settings.branches;
        setBranches(parsed);
      } catch (err) {
        console.error("Failed to parse branches:", err);
        setBranches([]);
      }
    } else {
      setBranches([]);
    }

  }, [settings]);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const pageId = 35;

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

  const [progTag, setProgTag] = useState({
    curriculum_id: "",
    year_level_id: "",
    semester_id: "",
    course_id: "",
    lec_fee: "",
    lab_fee: "",
    iscomputer_lab: 0,
    islaboratory_fee: 0,
    is_nstp: 0,
    amount: 0,
  });



  const [courseList, setCourseList] = useState([]);
  const [yearLevelList, setYearlevelList] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [curriculumList, setCurriculumList] = useState([]);
  const [taggedPrograms, setTaggedPrograms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [curriculumSearch, setCurriculumSearch] = useState("");

  useEffect(() => {
    // Start with all programs
    let filtered = taggedPrograms;

    // ✅ Filter by dropdowns safely (convert both sides to Number)
    if (selectedCurriculum) {
      filtered = filtered.filter(
        (p) => Number(p.curriculum_id) === Number(selectedCurriculum)
      );
    }
    if (selectedYearLevel) {
      filtered = filtered.filter(
        (p) => Number(p.year_level_id) === Number(selectedYearLevel)
      );
    }
    if (selectedSemester) {
      filtered = filtered.filter(
        (p) => Number(p.semester_id) === Number(selectedSemester)
      );
    }

    // ✅ Filter by search query (case-insensitive)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) =>
        (p.curriculum_description || "").toLowerCase().includes(q) ||
        (p.program_code || "").toLowerCase().includes(q) ||
        (p.major || "").toLowerCase().includes(q) ||
        (p.course_description || "").toLowerCase().includes(q) ||
        (p.year_level_description || "").toLowerCase().includes(q) ||
        (p.semester_description || "").toLowerCase().includes(q)
      );
    }

    // ✅ Update state
    setFilteredPrograms(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedCurriculum, selectedYearLevel, selectedSemester, taggedPrograms]);


  const filteredCourses = courseList.filter((course) => {
    const words = courseSearch.toLowerCase().split(" ");

    const courseCode = (course.course_code || "").toLowerCase();
    const courseDesc = (course.course_description || "").toLowerCase();
    const coursePreq = (course.prereq || "").toLowerCase();

    return words.every((word) =>
      courseCode.includes(word) || courseDesc.includes(word) || coursePreq.includes(word)
    );
  });


  useEffect(() => {
    fetchYearLevel();
    fetchSemester();
    fetchCurriculum();
    fetchTaggedPrograms();
  }, []);

  const fetchYearLevel = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_year_level`);
      setYearlevelList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSemester = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_semester`);
      setSemesterList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCurriculum = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_active_curriculum`);
      setCurriculumList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCourse = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/course_list`);

      // 🔽 SORT COURSES alphabetically (course_code)
      setCourseList(
        res.data.sort((a, b) =>
          a.course_code.localeCompare(b.course_code, undefined, { numeric: true })
        )
      );

    } catch (err) {
      console.log(err);
    }
  };

  // useEffect(() => {
  //   fetchCourse();
  // }, []);

  useEffect(() => {
    fetchCourse();
  });

  const fetchTaggedPrograms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/program_tagging_list`);

      const normalized = res.data.map(p => ({
        ...p,
        iscomputer_lab: Number(p.iscomputer_lab ?? 0),
        islaboratory_fee: Number(p.islaboratory_fee ?? 0),
        is_nstp: Number(p.is_nstp ?? 0),
      }));

      // ✅ REMOVE DUPLICATES BASED ON UNIQUE PROGRAM KEY
      const unique = [];
      const seen = new Set();

      normalized.forEach(p => {
        const key = `${p.curriculum_id}-${p.year_level_id}-${p.semester_id}-${p.course_id}`;

        if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      });

      setTaggedPrograms(unique);
      setFilteredPrograms(unique);

    } catch (err) {
      console.log(err);
    }
  };




  const handleChangesForEverything = (e) => {
    const { name, value, type } = e.target;

    setProgTag((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };


  const handleInsertingProgTag = async () => {
    const {
      curriculum_id,
      year_level_id,
      semester_id,
      course_id,
      lec_fee,
      lab_fee,
      iscomputer_lab,
      islaboratory_fee,
      is_nstp,
      amount,
    } = progTag;

    // ✅ Required fields
    if (!curriculum_id || !year_level_id || !semester_id || !course_id) {
      setSnackbar({
        open: true,
        message: "Please fill all fields",
        severity: "error",
      });
      return;
    }

    // ✅ Fee validation
    if (lec_fee < 0 || lab_fee < 0) {
      setSnackbar({
        open: true,
        message: "Fees cannot be negative",
        severity: "error",
      });
      return;
    }

    // 🔍 Prevent duplicate (ignore self when editing)
    const isDuplicate = taggedPrograms.some(
      (p) =>
        Number(p.curriculum_id) === Number(curriculum_id) &&
        Number(p.year_level_id) === Number(year_level_id) &&
        Number(p.semester_id) === Number(semester_id) &&
        Number(p.course_id) === Number(course_id) &&
        Number(p.program_tagging_id) !== Number(editingId)
    );

    if (isDuplicate) {
      setSnackbar({
        open: true,
        message: "This program tag already exists!",
        severity: "error",
      });
      return;
    }

    try {
      if (editingId) {
        // ✅ Update existing program tag
        await axios.put(`${API_BASE_URL}/program_tagging/${editingId}`, {
          curriculum_id,
          year_level_id,
          semester_id,
          course_id,
          lec_fee: Number(lec_fee) || 0,
          lab_fee: Number(lab_fee) || 0,
          iscomputer_lab: Number(iscomputer_lab),
          islaboratory_fee: Number(islaboratory_fee),
          is_nstp: Number(is_nstp),
        });

        // 🔥 Update state locally instead of refetch
        setTaggedPrograms(prev =>
          prev.map(p =>
            p.program_tagging_id === editingId
              ? {
                ...p,
                ...progTag,
              }
              : p
          )
        );



        setSnackbar({
          open: true,
          message: "Program tag updated successfully!",
          severity: "success",
        });
      } else {
        // ✅ Insert new program tag
        const { data } = await axios.post(`${API_BASE_URL}/program_tagging`, {
          curriculum_id,
          year_level_id,
          semester_id,
          course_id,
          lec_fee: Number(lec_fee) || 0,
          lab_fee: Number(lab_fee) || 0,
          iscomputer_lab: Number(iscomputer_lab),
          islaboratory_fee: Number(islaboratory_fee),
          is_nstp: Number(is_nstp),
        });

        // 🔥 Add new tag to state immediately
        setTaggedPrograms((prev) => [
          ...prev,
          {
            program_tagging_id: data.insertId, // Use returned insertId
            curriculum_id,
            year_level_id,
            semester_id,
            course_id,
            lec_fee: Number(lec_fee) || 0,
            lab_fee: Number(lab_fee) || 0,
            iscomputer_lab: Number(iscomputer_lab),
            islaboratory_fee: Number(islaboratory_fee),
            is_nstp: Number(is_nstp),
            amount: Number(amount) || 0,
          },
        ]);

        setSnackbar({
          open: true,
          message: "Program tag inserted successfully!",
          severity: "success",
        });
      }

      // ✅ Reset form
      setProgTag({
        curriculum_id: "",
        year_level_id: "",
        semester_id: "",
        course_id: "",
        lec_fee: "",
        lab_fee: "",
        iscomputer_lab: 0,
        islaboratory_fee: 0,
        is_nstp: 0,
        amount: 0,
      });

      setEditingId(null);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Error saving data.",
        severity: "error",
      });
    }
  };



  const handleEdit = (program) => {
    setEditingId(program.program_tagging_id);

    setProgTag({
      curriculum_id: program.curriculum_id,
      year_level_id: program.year_level_id,
      semester_id: program.semester_id,
      course_id: program.course_id,
      lec_fee: program.lec_fee ?? "",
      lab_fee: program.lab_fee ?? "",
      iscomputer_lab: program.iscomputer_lab ?? 0,
      islaboratory_fee: program.islaboratory_fee ?? 0,
      is_nstp: program.is_nstp ?? 0,
      amount: program.amount ?? 0,

    });


    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [programToDelete, setProgramToDelete] = useState(null);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/program_tagging/${id}`);

      setTaggedPrograms(prev =>
        prev.filter(p => p.program_tagging_id !== id)
      );

      setSnackbar({
        open: true,
        message: "Program tag deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error deleting program tag.",
        severity: "error",
      });
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // total pages (cap at 100 like your original)
  const totalPages = Math.min(
    100,
    Math.ceil(filteredPrograms.length / itemsPerPage)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentPrograms = filteredPrograms.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCurriculum, selectedYearLevel, selectedSemester]);


  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedAcademicProgram, setSelectedAcademicProgram] = useState("");

  const filteredCurriculumList = Array.from(
    new Map(
      curriculumList
        .filter(item => {

          // ✅ Campus filter
          if (selectedCampus !== "") {
            if (Number(item.components) !== Number(selectedCampus)) return false;
          }

          // ✅ Academic program filter
          if (selectedAcademicProgram !== "") {
            if (Number(item.academic_program) !== Number(selectedAcademicProgram)) return false;
          }

          // ✅ Curriculum search filter
          if (curriculumSearch.trim() !== "") {
            const q = curriculumSearch.toLowerCase();

            const yearDesc = String(item.year_description || "").toLowerCase();
            const programCode = String(item.program_code || "").toLowerCase();
            const programDesc = String(item.program_description || "").toLowerCase();
            const major = String(item.major || "").toLowerCase();

            if (
              !yearDesc.includes(q) &&
              !programCode.includes(q) &&
              !programDesc.includes(q) &&
              !major.includes(q)
            ) {
              return false;
            }
          }

          return true;
        })
        .map(item => [item.curriculum_id, item])
    ).values()
  );

  const formatSchoolYear = (yearDesc) => {
    if (!yearDesc) return "";
    const startYear = Number(yearDesc);
    if (isNaN(startYear)) return yearDesc;
    return `${startYear} - ${startYear + 1}`;
  };

  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: titleColor, fontSize: "36px" }}
        >
          PROGRAM AND COURSE MANAGEMENT
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Search Curriculum / Course / Year / Semester"
          size="small"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
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

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      <div style={styles.container}>
        <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, mb: "-30px" }}>
          <Table>
            <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
              <TableRow>
                <TableCell sx={{ color: 'white', textAlign: "Center" }}>Program Panel</TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
        {/* Left: Form Section */}
        <div style={{ ...styles.formSection, border: `2px solid ${borderColor}` }}>

          {/* CAMPUS */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Campus:</label>
            <select
              value={selectedCampus}
              onChange={(e) => {
                setSelectedCampus(e.target.value);
                setSelectedAcademicProgram("");
                setProgTag(prev => ({ ...prev, curriculum_id: "" }));
              }}
              style={styles.select}
            >
              <option value="">Choose Campus</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch}
                </option>
              ))}
            </select>
          </div>

          {/* ACADEMIC PROGRAM */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Academic Program:</label>
            <select
              value={selectedAcademicProgram}
              onChange={(e) => {
                setSelectedAcademicProgram(e.target.value);
                setProgTag(prev => ({ ...prev, curriculum_id: "" }));
              }}
              disabled={!selectedCampus}
              style={styles.select}
            >
              <option value="">Select Program</option>
              <option value="0">Undergraduate</option>
              <option value="1">Graduate</option>
              <option value="2">Techvoc</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Curriculum:</label>

            {/* 🔍 Curriculum Search */}
            <input
              type="text"
              placeholder="Search curriculum..."
              value={curriculumSearch}
              onChange={(e) => setCurriculumSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "16px"
              }}
            />

            <select
              name="curriculum_id"
              value={progTag.curriculum_id}
              onChange={handleChangesForEverything}
              style={styles.select}
            >
              <option value="">Choose Curriculum</option>

              {filteredCurriculumList
                .sort((a, b) => Number(a.year_description) - Number(b.year_description))
                .map((curriculum) => (
                  <option key={curriculum.curriculum_id} value={curriculum.curriculum_id}>
                    {formatSchoolYear(curriculum.year_description)}:
                    {` (${curriculum.program_code}) ${curriculum.program_description}`}
                    {curriculum.major ? ` (${curriculum.major})` : ""}
                  </option>
                ))}
            </select>
          </div>


          <div style={styles.formGroup}>
            <label style={styles.label}>Course:</label>

            {/* 🔍 Search Bar for Course */}
            <input
              type="text"
              placeholder="Search course..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "16px"
              }}
            />

            <select
              name="course_id"
              value={progTag.course_id}
              onChange={handleChangesForEverything}
              style={styles.select}
            >
              <option value="">Choose Course</option>

              {filteredCourses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_code} - {course.course_description} - ({course.prereq})
                </option>
              ))}
            </select>
          </div>


          <div style={styles.formGroup}>
            <label style={styles.label}>Year Level:</label>
            <select
              name="year_level_id"
              value={progTag.year_level_id}
              onChange={handleChangesForEverything}
              style={styles.select}
            >
              <option value="">Choose Year Level</option>
              {yearLevelList.map((year) => (
                <option key={year.year_level_id} value={year.year_level_id}>
                  {year.year_level_description}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Semester:</label>
            <select
              name="semester_id"
              value={progTag.semester_id}
              onChange={handleChangesForEverything}
              style={styles.select}
            >
              <option value="">Choose Semester</option>
              {semesterList.map((semester) => (
                <option key={semester.semester_id} value={semester.semester_id}>
                  {semester.semester_description}
                </option>
              ))}
            </select>
          </div>


          <div style={styles.formGroup}>
            <label style={styles.label}>Lecture Fee:</label>
            <input
              type="number"
              name="lec_fee"
              value={progTag.lec_fee}
              onChange={handleChangesForEverything}
              style={styles.select}
              placeholder="Enter lecture fee"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Laboratory Fee:</label>
            <input
              type="number"
              name="lab_fee"
              value={progTag.lab_fee}
              onChange={handleChangesForEverything}
              style={styles.select}
              placeholder="Enter laboratory fee"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Fee Type:</label>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="fee_type"
                  value="computer"
                  checked={progTag.iscomputer_lab === 1}
                  onChange={() =>
                    setProgTag(prev => ({
                      ...prev,
                      iscomputer_lab: 1,
                      islaboratory_fee: 0,
                      is_nstp: 0,
                    }))
                  }
                  style={{
                    transform: "scale(1.5)",   // 👈 BIGGER BULLET
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "16px" }}>Computer Lab</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="fee_type"
                  value="laboratory"
                  checked={progTag.islaboratory_fee === 1}
                  onChange={() =>
                    setProgTag(prev => ({
                      ...prev,
                      iscomputer_lab: 0,
                      islaboratory_fee: 1,
                      is_nstp: 0,
                    }))
                  }
                  style={{
                    transform: "scale(1.5)",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "16px" }}>Laboratory Fee</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="fee_type"
                  value="nstp"
                  checked={progTag.is_nstp === 1}
                  onChange={() =>
                    setProgTag(prev => ({
                      ...prev,
                      iscomputer_lab: 0,
                      islaboratory_fee: 0,
                      is_nstp: 1,
                    }))
                  }
                  style={{
                    transform: "scale(1.5)",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "16px" }}>NSTP Subject</span>
              </label>
            </div>

            {/* 
            <div style={styles.formGroup}>
              <label style={styles.label}>Computed Amount:</label>
              <input
                type="text"
                value={`₱ ${Number(progTag.amount || 0).toLocaleString()}`}
                disabled
                style={{
                  ...styles.select,
                  backgroundColor: "#eee",
                  fontWeight: "bold",
                }}
              />
            </div> */}

          </div>



          <Button
            onClick={handleInsertingProgTag}
            variant="contained"
            sx={{
              backgroundColor: "primary",
              color: "white",
              mt: 3,
              width: "100%",
              "&:hover": { backgroundColor: "#000" },
            }}
          >
            {editingId ? "Update Program Tag" : "Insert Program Tag"}
          </Button>
        </div>

        <br />


        <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, mb: "-30px" }}>
          <Table>
            <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
              <TableRow>
                <TableCell sx={{ color: 'white', textAlign: "Center" }}>Tagged Program</TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
        <div style={{ ...styles.displaySection, border: `2px solid ${borderColor}` }}>
          <ProgramTaggingFilter
            curriculumList={curriculumList}
            yearLevelList={yearLevelList}
            semesterList={semesterList}
            taggedPrograms={taggedPrograms}

            selectedCurriculum={selectedCurriculum}
            selectedYearLevel={selectedYearLevel}
            selectedSemester={selectedSemester}

            setSelectedCurriculum={setSelectedCurriculum}
            setSelectedYearLevel={setSelectedYearLevel}
            setSelectedSemester={setSelectedSemester}

            setFilteredPrograms={setFilteredPrograms}
          />

          <TableContainer component={Paper} sx={{ width: '100%' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                <TableRow>
                  <TableCell
                    colSpan={10}
                    sx={{
                      border: `2px solid ${borderColor}`,
                      py: 0.5,
                      backgroundColor: settings?.header_color || "#1976d2",
                      color: "white",
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between" // Left & right sides
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      {/* Left side: Total Tagged Programs */}
                      <Typography fontSize="14px" fontWeight="bold" color="white">
                        Total Tagged Programs: {filteredPrograms.length}
                      </Typography>

                      {/* Right side: Pagination / Filtering Controls */}
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 80,
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                            },
                            '&.Mui-disabled': {
                              color: "white",
                              borderColor: "white",
                              backgroundColor: "transparent",
                              opacity: 1,
                            }
                          }}
                        >
                          First
                        </Button>

                        <Button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 80,
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                            },
                            '&.Mui-disabled': {
                              color: "white",
                              borderColor: "white",
                              backgroundColor: "transparent",
                              opacity: 1,
                            }
                          }}
                        >
                          Prev
                        </Button>

                        {/* Page Dropdown */}
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={currentPage}
                            onChange={(e) => setCurrentPage(Number(e.target.value))}
                            displayEmpty
                            sx={{
                              fontSize: '12px',
                              height: 36,
                              color: 'white',
                              border: '1px solid white',
                              backgroundColor: 'transparent',
                              '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                              '& svg': { color: 'white' }
                            }}
                            MenuProps={{
                              PaperProps: { sx: { maxHeight: 200, backgroundColor: '#fff' } }
                            }}
                          >
                            {Array.from({ length: totalPages }, (_, i) => (
                              <MenuItem key={i + 1} value={i + 1}>
                                Page {i + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Typography fontSize="11px" color="white">
                          of {totalPages} page{totalPages > 1 ? 's' : ''}
                        </Typography>

                        <Button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 80,
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                            '&.Mui-disabled': { color: "white", borderColor: "white", backgroundColor: "transparent", opacity: 1 }
                          }}
                        >
                          Next
                        </Button>

                        <Button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 80,
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                            '&.Mui-disabled': { color: "white", borderColor: "white", backgroundColor: "transparent", opacity: 1 }
                          }}
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

          <div style={styles.taggedProgramsContainer}>
            {taggedPrograms.length > 0 ? (

              <table style={{ ...styles.table, mt: "-15px" }}>

                <thead>

                  <tr>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      ID
                    </th>


                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Curriculum
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Course
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Year Level
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Semester
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Lec Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Lab Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Computer Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Laboratory Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      NSTP Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `2px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentPrograms.map((program, index) => (

                    <tr key={program.program_tagging_id}>
                      <td style={{ ...styles.td, border: `2px solid ${borderColor}` }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td style={{ ...styles.td, border: `2px solid ${borderColor}` }}>
                        {formatSchoolYear(program.year_description)}  ({program.program_code}) – {program.curriculum_description}
                        {program.major ? ` (${program.major})` : ""}
                      </td>



                      <td style={{ ...styles.td, border: `2px solid ${borderColor}` }}>
                        ({program.course_code}) - {program.course_description} - ({program.prereq})
                      </td>
                      <td style={{ ...styles.td, border: `2px solid ${borderColor}`, textAlign: "center" }}>
                        {program.year_level_description}
                      </td>
                      <td style={{ ...styles.td, border: `2px solid ${borderColor}`, textAlign: "center" }}>
                        {program.semester_description}
                      </td>
                      <td style={{ ...styles.td, border: `2px solid ${borderColor}`, textAlign: "center" }}>
                        {program.lec_fee ?? "—"}
                      </td>
                      <td style={{ ...styles.td, border: `2px solid ${borderColor}`, textAlign: "center" }}>
                        {program.lab_fee ?? "—"}
                      </td>

                      <td style={{ ...styles.td, border: `2px solid ${borderColor}`, textAlign: "center" }}>
                        {Number(program.iscomputer_lab) === 1 ? "Yes" : "No"}
                      </td>

                      <td style={{ ...styles.td, border: `2px solid ${borderColor}`, textAlign: "center" }}>
                        {Number(program.islaboratory_fee) === 1 ? "Yes" : "No"}
                      </td>

                      <td style={{ ...styles.td, border: `2px solid ${borderColor}`, textAlign: "center" }}>
                        {Number(program.is_nstp) === 1 ? "Yes" : "No"}
                      </td>

                      {/* <td
                        style={{
                          ...styles.td,
                          border: `2px solid ${borderColor}`,
                          textAlign: "right",
                          fontWeight: "bold",
                          textAlign: "center"
                        }}
                      >
                        ₱ {Number(program.amount || 0).toLocaleString()}
                      </td> */}

                      <td
                        style={{
                          ...styles.td,
                          whiteSpace: "nowrap",
                          border: `2px solid ${borderColor}`,

                        }}
                      >
                        <button
                          onClick={() => handleEdit(program)}
                          style={{
                            backgroundColor: "green",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "8px 14px",
                            marginRight: "6px",
                            cursor: "pointer",
                            width: "100px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                          }}
                        >
                          <EditIcon fontSize="small" /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setDeleteId(program.program_tagging_id);
                            setProgramToDelete(program); // 👈 save full row
                            setOpenDeleteDialog(true);
                          }}
                          style={{
                            backgroundColor: "#9E0000",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "8px 14px",
                            cursor: "pointer",
                            width: "100px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                          }}
                        >
                          <DeleteIcon fontSize="small" /> Delete
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>


              </table>


            ) : (
              <p>No tagged programs available.</p>
            )}
          </div>

        </div>

      </div>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete Program Tag</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the course{" "}
            <b>{programToDelete?.course_description}</b>{" "}
            from curriculum{" "}
            <b>{programToDelete?.curriculum_description}</b>?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => {
              handleDelete(deleteId);
              setOpenDeleteDialog(false);
              setProgramToDelete(null);
            }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>



      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column", // 👈 TOP & BOTTOM
    gap: "30px",
    width: "95%",
    margin: "30px auto",
  },
  formSection: {
    width: "100%",   // 👈 instead of minWidth: "48%"
    background: "#f8f8f8",
    padding: "25px",

    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },

  displaySection: {
    width: "100%",   // 👈 instead of minWidth: "48%"
    background: "#f8f8f8",
    padding: "25px",

    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    overflowY: "auto",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    fontWeight: "bold",
    display: "block",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  taggedProgramsContainer: {

    maxHeight: "750px",

  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",

  },
  th: {
    padding: "12px",
    borderBottom: "2px solid #ccc",
    backgroundColor: "#f1f1f1",
    fontWeight: "bold",
    fontSize: "15px",
    color: "#333",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    fontSize: "14px",
    color: "#333",
  },
};

export default ProgramTagging;
