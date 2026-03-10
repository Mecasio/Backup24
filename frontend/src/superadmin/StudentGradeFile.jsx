import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from "../App";
import axios from 'axios';
import { Box, Button, Typography, TextField, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import API_BASE_URL from '../apiConfig';
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";

const StudentGradeFile = () => {
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
                if (parsed?.length > 0) {
                    setCampusFilter((prev) => prev || String(parsed[0].id));
                }
            } catch (err) {
                console.error("Failed to parse branches:", err);
                setBranches([]);
            }
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

    const pageId = 126;

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

    const handleCloseSnackbar = (event, reason) => {
        if (reason === "clickaway") return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };


    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [selectedTermContext, setSelectedTermContext] = useState(null);

    useEffect(() => {
        if (!settings) return;
        settings.title_color && setTitleColor(settings.title_color);
        settings.subtitle_color && setSubtitleColor(settings.subtitle_color);
        settings.border_color && setBorderColor(settings.border_color);
        settings.main_button_color && setMainButtonColor(settings.main_button_color);
    }, [settings]);

    // 🔍 SEARCH
    const [searchQuery, setSearchQuery] = useState("");
    const [campusFilter, setCampusFilter] = useState("");

    // 📘 DATA
    const [studentInfo, setStudentInfo] = useState(null);
    const [studentGradeList, setStudentGradeList] = useState([]); // ✅ FIXED

    // ➕ ADD SUBJECT
    const [openAddSubjectDialog, setOpenAddSubjectDialog] = useState(false);
    const [courseList, setCourseList] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState("");

    // 👁 VIEW
    const [openViewDialog, setOpenViewDialog] = useState(false);





    const fetchStudent = async () => {
        if (!campusFilter) {
            setSnackbar({
                open: true,
                message: "Please select a campus first",
                severity: "warning",
            });
            return;
        }

        try {
            const res = await axios.get(
                `${API_BASE_URL}/student/student-info`,
                { params: { searchQuery, campus: campusFilter } }
            );
            setStudentInfo(res.data);

            setSnackbar({
                open: true,
                message: "Student is found",
                severity: "success",
            });
        } catch {
            setStudentInfo(null);
            setSnackbar({
                open: true,
                message: "Student is not found or existed in the record",
                severity: "error",
            });
        }
    };

    const fetchStudentGrade = async (student_number) => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/student/student-info/${student_number}`
            );
            const convertedGrades = (res.data || []).map((course) => ({
                ...course,
                final_grade: course.final_grade !== null
                    ? convertNumericToGrade(course.final_grade).toFixed(2).toString()
                    : "",
            }));

            console.log("Data: ", convertedGrades);

            setStudentGradeList(convertedGrades);
        } catch {
            setStudentGradeList([]);
        }
    };

    const fetchCourses = async () => {
        if (!studentGradeList?.length) return;

        const currId = studentGradeList[0].curriculum_id;
        try {
            setLoadingCourses(true);
            const res = await axios.get(`${API_BASE_URL}/courses/${currId}`);
            setCourseList(res.data);
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Failed to load courses",
                severity: "error",
            });
        } finally {
            setLoadingCourses(false);
        }
    };

    useEffect(() => {
        if (!searchQuery || !campusFilter) {
            setStudentInfo(null);
            return;
        }

        const delay = setTimeout(fetchStudent, 1200);
        return () => clearTimeout(delay);
    }, [searchQuery, campusFilter]);

    useEffect(() => {
        if (studentInfo?.length) {
            fetchStudentGrade(studentInfo[0].student_number);
        } else {
            setStudentGradeList([]);
        }
    }, [studentInfo]);

    const groupedGrades = studentGradeList.reduce((acc, curr) => {
        const year = curr.year_level_description;
        const sem = curr.semester_description;

        acc[year] ??= {};
        acc[year][sem] ??= [];
        acc[year][sem].push(curr);

        return acc;
    }, {});

    const yearLevelOrder = ["First Year", "Second Year", "Third Year", "Fourth Year"];

    const sortSemesters = (list) =>
        ["First Semester", "Second Semester", "Summer"].filter((s) =>
            list.includes(s)
        );

    const confirmDelete = (id) => {
        setSelectedSubjectId(id);
        setOpenDialog(true);
    };

    const handleOpenView = () => {
        setOpenViewDialog(true);
    };

    const handleCloseView = () => {
        setOpenViewDialog(false);
    };

    const handleAddSubject = async () => {
        if (!selectedTermContext) return;

        try {
            await axios.post(`${API_BASE_URL}/insert_subject`, {
                course_id: selectedCourse,
                student_number: studentGradeList[0].student_number,
                currId: studentGradeList[0].curriculum_id,
                active_school_year_id: selectedTermContext.active_school_year_id,
            });

            setSnackbar({
                open: true,
                message: "Subject added successfully",
                severity: "success",
            });

            setOpenAddSubjectDialog(false);
            setSelectedCourse("");
            setSelectedTermContext(null);

            // refresh grades
            fetchStudentGrade(studentGradeList[0].student_number);
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Failed to add subject",
                severity: "error",
            });
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `${API_BASE_URL}/delete_subject/${selectedSubjectId}`
            );

            setStudentGradeList((prev) =>
                prev.filter((s) => s.id !== selectedSubjectId)
            );

            setSnackbar({
                open: true,
                message: "Subject deleted successfully",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to delete subject",
                severity: "error",
            });
        } finally {
            setOpenDialog(false);
            setSelectedSubjectId(null);
        }
    };

    const handleEditSubject = async (yearLevel, semester) => {
        try {
            const subjectsToUpdate = groupedGrades[yearLevel][semester].filter(
                (s) => s.__edited && s.final_grade !== null
            );

            if (!subjectsToUpdate.length) {
                setSnackbar({
                    open: true,
                    message: "No changes to save",
                    severity: "info",
                });
                return;
            }

            await Promise.all(
                subjectsToUpdate.map((subject) =>
                    axios.put(`${API_BASE_URL}/update_subject`, {
                        course_id: subject.course_id,
                        student_number: subject.student_number,
                        currId: subject.curriculum_id,
                        active_school_year_id: subject.active_school_year_id,
                        final_grade: parseFloat(subject.final_grade),
                    })
                )
            );

            setSnackbar({
                open: true,
                message: "Grades updated successfully",
                severity: "success",
            });

            // Refresh from DB to clear __edited flags
            fetchStudentGrade(studentInfo[0].student_number);
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "Failed to update grades",
                severity: "error",
            });
        }
    };

    const handleFinalGradeChange = (id, value) => {
        setStudentGradeList((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        final_grade: value,
                        __edited: true, // 👈 mark as edited
                    }
                    : item
            )
        );
    };

    const convertNumericToGrade = (numeric) => {
        const numericMap = {
            100: 1.00,
            96: 1.25,
            93: 1.50,
            90: 1.75,
            87: 2.00,
            84: 2.25,
            81: 2.50,
            78: 2.75,
            75: 3.00,
            0: 5.00,
        };

        let grade = numericMap[numeric];

        if (grade === undefined) {
            const entries = Object.entries(numericMap);
            grade = entries[0][1];
            let minDiff = Math.abs(numeric - Number(entries[0][0]));

            for (const [numStr, g] of entries) {
                const diff = Math.abs(numeric - Number(numStr));
                if (diff < minDiff) {
                    minDiff = diff;
                    grade = g;
                }
            }
        }

        return Number(grade.toFixed(2));
    };


    if (loading || hasAccess === null) {
        return <LoadingOverlay open={loading} message="Loading..." />;
    }

    if (!hasAccess) {
        return <Unauthorized />;
    }



    return (
        <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
            <div style={{ height: "10px" }}></div>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} >
                <Typography variant="h4" fontWeight="bold" style={{ color: titleColor, }}>
                    STUDENT GRADE FILE
                </Typography>

                <TextField
                    variant="outlined"
                    placeholder="Search by name, student number, or email"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value.toLowerCase());
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            fetchStudent();
                        }
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

            <Box sx={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: 2.5 }}>
                <Typography>
                    Campus:
                </Typography>
                <FormControl size="small" sx={{ width: 220 }}>
                    <InputLabel id="campus-branch-label">Campus</InputLabel>
                    <Select
                        labelId="campus-branch-label"
                        label="Campus"
                        value={campusFilter}
                        onChange={(e) => setCampusFilter(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>All Campuses</em>
                        </MenuItem>
                        {branches.length > 0 ? (
                            branches.map((branch) => (
                                <MenuItem key={branch.id} value={String(branch.id)}>
                                    {branch.branch}
                                </MenuItem>
                            ))
                        ) : (
                            [
                                <MenuItem key="manila" value="1">Manila</MenuItem>,
                                <MenuItem key="cavite" value="0">Cavite</MenuItem>,
                            ]
                        )}
                    </Select>
                </FormControl>
            </Box>

            <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
                <Table>
                    <TableHead sx={{ backgroundColor: mainButtonColor }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Student Personal Information</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, padding: "20px 0px" }}>
                <Table sx={{ '& td, & th': { paddingTop: 0, paddingBottom: 0, border: 'none', fontSize: "15px", letterSpacing: "-0.9px", wordSpacing: "3px" } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                Student Name:
                            </TableCell>
                            <TableCell sx={{ fontWeight: "700" }}>
                                {studentInfo && studentInfo.length > 0 && (
                                    <> 
                                        {studentInfo[0].last_name?.toUpperCase() || ""}{" "}
                                        {studentInfo[0].first_name?.toUpperCase() || ""}{" "}
                                        {studentInfo[0].middle_name?.toUpperCase() || ""}
                                    </>
                                )}
                            </TableCell>
                            <TableCell>
                                Applicant No./Student No.:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].student_number?.toUpperCase() || ""}
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                Program:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].program_description} ({studentInfo[0].campus === 1 ? "MANILA CAMPUS" : "CAVITE CAMPUS"})
                                    </>
                                )}
                            </TableCell>
                            <TableCell>
                                Year Level:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].year_level_description}
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                Address:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].presentStreet},{" "}
                                        {studentInfo[0].presentBarangay},{" "}
                                        {studentInfo[0].presentMunicipality},{" "}
                                        {studentInfo[0].presentZipCode}
                                    </>
                                )}
                            </TableCell>
                            <TableCell>
                                Contact No.:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].cellphoneNumber}
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                Status:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>

                                    </>
                                )}
                            </TableCell>
                            <TableCell>
                                Section:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>

                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                Curriculum:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].year_description}-{studentInfo[0].year_description + 1} (Regular)
                                    </>
                                )}
                            </TableCell>
                            <TableCell>
                                Email Address:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].emailAddress}
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                School Year
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].current_year}-{studentInfo[0].current_year + 1}
                                    </>
                                )}
                            </TableCell>
                            <TableCell>
                                Semester:
                            </TableCell>
                            <TableCell>
                                {studentInfo && studentInfo.length > 0 && (
                                    <>
                                        {studentInfo[0].semester_description}
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
                <Box sx={{ display: "flex", alignItems: "center", gap: "1rem", width: "100%", justifyContent: "end", padding: "0rem 1.5rem", marginTop: "1rem" }}>
                    <Button variant='contained'>ADD TRANSFEREE SUBJECTS</Button>
                    <Button variant='contained'>EXPORT GRADES</Button>
                    <Button variant='contained' sx={{ background: mainButtonColor }} onClick={handleOpenView}>VIEW</Button>
                </Box>
            </TableContainer>

            {Object.keys(groupedGrades).sort((a, b) => yearLevelOrder.indexOf(a) - yearLevelOrder.indexOf(b)).map((yearLevel) => (
                <Box key={yearLevel} style={{ marginBottom: 20 }}>
                    {sortSemesters(Object.keys(groupedGrades[yearLevel])).map((semester) => (
                        <TableContainer
                            key={semester}
                            component={Paper}
                            sx={{ width: '100%', border: `2px solid ${borderColor}`, mb: 2, mt: 2 }}
                        >
                            <Typography
                                sx={{
                                    backgroundColor: mainButtonColor,
                                    color: 'white',
                                    padding: 1,
                                    fontSize: "14px",
                                    textAlign: 'center',
                                }}
                            >
                                Term Description
                            </Typography>
                            <TableContainer sx={{ width: '100%', padding: "10px 0px" }}>
                                <Table sx={{ '& td, & th': { paddingTop: 0, paddingBottom: 0, border: 'none', fontSize: "15px", letterSpacing: "-0.9px", wordSpacing: "3px" } }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                Academic School Year:
                                            </TableCell>
                                            <TableCell>
                                                {groupedGrades[yearLevel][semester][0].current_year}-
                                                {groupedGrades[yearLevel][semester][0].current_year + 1}
                                            </TableCell>
                                            <TableCell>
                                                Year Level:
                                            </TableCell>
                                            <TableCell>
                                                {yearLevel}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                Semester:
                                            </TableCell>
                                            <TableCell>
                                                {semester}
                                            </TableCell>
                                            <TableCell>
                                                Term:
                                            </TableCell>
                                            <TableCell>
                                                1st Term
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                </Table>
                                <Box sx={{ display: "flex", alignItems: "center", gap: "1rem", width: "100%", justifyContent: "end", padding: "0rem 1.5rem", marginTop: "1rem" }}>
                                    <Button
                                        variant="contained"
                                        sx={{ background: mainButtonColor }}
                                        onClick={() => {
                                            const termData = groupedGrades[yearLevel][semester][0];

                                            setSelectedTermContext({
                                                active_school_year_id: termData.active_school_year_id
                                            });

                                            fetchCourses();
                                            setOpenAddSubjectDialog(true);
                                        }}
                                    >
                                        ADD SUBJECTS
                                    </Button>
                                    <Button
                                        variant="contained"
                                        sx={{ background: mainButtonColor }}
                                        onClick={() => handleEditSubject(yearLevel, semester)}
                                    >
                                        SAVE CHANGES
                                    </Button>
                                </Box>
                            </TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ borderTop: `solid 1px ${borderColor}`, borderBottom: `solid 1px ${borderColor}`, width: "2%" }}>#</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "8%" }}>Course Code</TableCell>
                                        {/* <TableCell sx={{border: `solid 1px ${borderColor}`, width: "11%", textAlign: "center"}}>Equiv. Course Code</TableCell> */}
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "9%", textAlign: "center" }}>Professor</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "40%" }}>Course Description</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "2%" }}>Units</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "5%", textAlign: "center" }}>Section Code</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "6%", textAlign: "center" }}>Final Grade</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "3%", textAlign: "center" }}>Re-Exam</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "5%", textAlign: "center" }}>Grade Status</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "5%", textAlign: "center" }}>Faculty Status</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, width: "5%", textAlign: "center" }}>Remarks</TableCell>
                                        <TableCell sx={{ border: `solid 1px ${borderColor}`, borderRight: "none", width: "5%", textAlign: "center" }}>
                                            Action
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[...groupedGrades[yearLevel][semester]].sort((a, b) => { return a.id - b.id; }).map((course, index) => (
                                        <TableRow key={course.course_id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{course.course_code}</TableCell>
                                            {/* <TableCell sx={{width: "11%", textAlign: "center"}}>{course.course_code}</TableCell> */}
                                            <TableCell></TableCell>
                                            <TableCell>{course.course_description}</TableCell>
                                            <TableCell sx={{ width: "2%", textAlign: "center" }}>{course.course_unit || 0}</TableCell>
                                            <TableCell></TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={course.final_grade ?? ""}
                                                    onChange={(e) => handleFinalGradeChange(course.id, e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell></TableCell>
                                            <TableCell>
                                                {course.en_remarks === 1
                                                    ? "PASSED"
                                                    : course.en_remarks === 2
                                                        ? "FAILED"
                                                        : course.en_remarks === 3
                                                            ? "INC"
                                                            : course.en_remarks === 4
                                                                ? "DROP"
                                                                : course.en_remarks === 0
                                                                    ? "ONGOING"
                                                                    : "-"}
                                            </TableCell>
                                            <TableCell></TableCell>
                                            <TableCell>{course.remarks?.toUpperCase()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    color="error"
                                                    size="small"
                                                    variant='contained'
                                                    sx={{ background: mainButtonColor }}
                                                    onClick={() => confirmDelete(course.id)}
                                                >
                                                    DELETE
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={4} sx={{ textAlign: "right", fontWeight: "700" }}>
                                            TOTAL UNITS:
                                        </TableCell>
                                        <TableCell sx={{ textAlign: "center", fontWeight: "700" }}>
                                            {groupedGrades[yearLevel][semester].reduce(
                                                (sum, course) => sum + (Number(course.course_unit) || 0),
                                                0
                                            )}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ))}
                </Box>
            ))}

            <Dialog
                open={openAddSubjectDialog}
                onClose={() => setOpenAddSubjectDialog(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Add Subject</DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Select a subject to add for this student.
                    </DialogContentText>

                    <TextField
                        select
                        fullWidth
                        label="Course"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        disabled={loadingCourses}
                    >
                        {courseList.map((course) => (
                            <MenuItem key={course.course_id} value={course.course_id}>
                                {course.course_code} - {course.course_description}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenAddSubjectDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!selectedCourse}
                        onClick={handleAddSubject}
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Delete Subject</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this subject?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button color="error" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openViewDialog}
                onClose={handleCloseView}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Student File
                </DialogTitle>

                <DialogContent>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 2,
                            mt: 1,
                        }}
                    >
                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            HISTORY LOGS
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            EVALUATION
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            TRANSCRIPT OF RECORDS
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            PERMANENT RECORD
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            HONORABLE DISMISSAL
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            COPY OF GRADES
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            REPORT OF GRADES
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            GOOD MORAL
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            CERTIFICATE OF HONORS
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            CERTIFICATE OF GWA
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            CERTIFICATE OF HONORS AND GWA
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            APPLICATION FOR EVALUATION
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            APPLICATION FOR GRADUATION
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            RESULT OF EVALUATION
                        </Box>

                        <Box
                            sx={{
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                padding: 2,
                            }}
                        >
                            CERTIFICATE OF COMPLETE ACADEMIC REPORTS
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseView}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>


            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    )
}

export default StudentGradeFile;
