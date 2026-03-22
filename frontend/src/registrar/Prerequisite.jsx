import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
import {
    Box,
    Typography,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from "@mui/material";
import LoadingOverlay from "../components/LoadingOverlay";
import Unauthorized from "../components/Unauthorized";

const CoursePanelMap = () => {
    const settings = useContext(SettingsContext);

    const [titleColor, setTitleColor] = useState("#000");
    const [borderColor, setBorderColor] = useState("#000");
    const [branches, setBranches] = useState([]);

    const [curriculumList, setCurriculumList] = useState([]);
    const [selectedCurriculum, setSelectedCurriculum] = useState("");
    const [taggedPrograms, setTaggedPrograms] = useState([]);

    // editable prereqs
    const [editedCourseReqs, setEditedCourseReqs] = useState({});

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const pageId = 112; // 🔁 change if needed

    /* ===================== SETTINGS ===================== */
    useEffect(() => {
        if (!settings) return;
        if (settings.title_color) setTitleColor(settings.title_color);
        if (settings.border_color) setBorderColor(settings.border_color);
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

    /* ===================== AUTH ===================== */
    useEffect(() => {
        const role = localStorage.getItem("role");
        const employeeID = localStorage.getItem("employee_id");

        if (role !== "registrar") {
            window.location.href = "/login";
            return;
        }

        checkAccess(employeeID);
    }, []);

    const checkAccess = async (employeeID) => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`
            );
            setHasAccess(res.data?.page_privilege === 1);
        } catch {
            setHasAccess(false);
        }
    };

    /* ===================== DATA ===================== */
    useEffect(() => {
        fetchCurriculum();
        fetchTaggedPrograms();
    }, []);

    const fetchCurriculum = async () => {
        const res = await axios.get(`${API_BASE_URL}/get_active_curriculum`);
        setCurriculumList(res.data);
    };

    const fetchTaggedPrograms = async () => {
        const res = await axios.get(`${API_BASE_URL}/program_tagging_list`);
        const unique = Array.from(
            new Map(res.data.map(item => [item.program_tagging_id, item])).values()
        );
        setTaggedPrograms(unique);

    };

    /* ===================== GROUP YEAR → SEM ===================== */
    const groupedData = () => {
        const result = {};

        taggedPrograms
            .filter(p => p.curriculum_id == selectedCurriculum)
            .forEach(p => {
                if (!result[p.year_level_description]) {
                    result[p.year_level_description] = {};
                }
                if (!result[p.year_level_description][p.semester_description]) {
                    result[p.year_level_description][p.semester_description] = [];
                }
                result[p.year_level_description][p.semester_description].push(p);
            });

        return result;
    };

    const data = groupedData();

    /* ===================== HANDLERS ===================== */
    const handleReqChange = (id, field, value) => {
        setEditedCourseReqs(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value,
            },
        }));
    };

    const handleSaveSemester = async (courses) => {
        try {
            for (const course of courses) {
                const edited = editedCourseReqs[course.program_tagging_id];
                if (!edited) continue;

                await axios.put(
                    `${API_BASE_URL}/update_course_requirements/${course.course_id}`,
                    {
                        prereq: edited.prereq ?? course.prereq ?? null,

                        corequisite: edited.corequisite ?? course.corequisite ?? null,
                    }
                );

            }

            setSnackbar({
                open: true,
                message: "Requirements saved successfully!",
                severity: "success",
            });

            setEditedCourseReqs({});
            fetchTaggedPrograms();
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "Failed to save requirements",
                severity: "error",
            });
        }
    };


    const selectedCurriculumName = curriculumList.find(
        (c) => c.curriculum_id === selectedCurriculum
    )?.program_description +
        (curriculumList.find(c => c.curriculum_id === selectedCurriculum)?.major
            ? ` ${curriculumList.find(c => c.curriculum_id === selectedCurriculum)?.major}`
            : "") || "";


    const [filteredPrograms, setFilteredPrograms] = useState([]);

    const [selectedCampus, setSelectedCampus] = useState("");
    const [selectedAcademicProgram, setSelectedAcademicProgram] = useState("");

    const [searchCurriculum, setSearchCurriculum] = useState("");

    const filteredCurriculumList = curriculumList
        .filter((item) => {
            // 🏫 CAMPUS FILTER
            if (selectedCampus !== "") {
                if (Number(item.components) !== Number(selectedCampus)) {
                    return false;
                }
            }

            // 🎓 ACADEMIC PROGRAM FILTER
            if (selectedAcademicProgram !== "") {
                if (Number(item.academic_program) !== Number(selectedAcademicProgram)) {
                    return false;
                }
            }

            return true;
        })
        .filter((item) => {
            if (!searchCurriculum) return true;

            const search = searchCurriculum.toLowerCase();

            return (
                item.program_code?.toLowerCase().includes(search) ||
                item.program_description?.toLowerCase().includes(search) ||
                item.major?.toLowerCase().includes(search) ||
                item.year_description?.toString().includes(search) || getBranchLabel(item.components).toLowerCase().includes(search)
            );
        });



    const yearOrder = {
        "First Year": 1,
        "Second Year": 2,
        "Third Year": 3,
        "Fourth Year": 4,
    };

    const semesterOrder = {
        "First Semester": 1,
        "Second Semester": 2,
    };

    const yearLabelMap = {
        "First Year": "1st Year",
        "Second Year": "2nd Year",
        "Third Year": "3rd Year",
        "Fourth Year": "4th Year",
        "Fifth Year": "5th Year",
    };

    const formatSchoolYear = (yearDesc) => {
        if (!yearDesc) return "";
        const startYear = Number(yearDesc);
        if (isNaN(startYear)) return yearDesc;
        return `${startYear} - ${startYear + 1}`;
    };

    const getBranchLabel = (branchId) => {
        const branch = branches.find((item) => Number(item.id) === Number(branchId));
        return branch?.branch || "�";
    };

    const formatYearLabel = (year) => {
        return yearLabelMap[year] || year;
    };


    if (loading || hasAccess === null) {
        return <LoadingOverlay open={true} message="Loading..." />;
    }

    if (!hasAccess) {
        return <Unauthorized />;
    }

    const headerStyle = {
        backgroundColor: settings?.header_color || "#1976d2",
        color: "#fff",
        border: `2px solid ${borderColor}`,
        padding: "8px",
        textAlign: "center",
    };

    const cellStyle = {
        border: `2px solid ${borderColor}`,
        padding: "8px",
    };

    return (
        <Box
            sx={{
                height: "calc(100vh - 150px)",
                overflowY: "auto",
                paddingRight: 1,
                backgroundColor: "transparent",
                mt: 1,
                p: 2,
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
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
                    COURSE PANEL PREREQUISITE
                </Typography>
            </Box>

            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br />

            <Typography fontWeight={500}>Select Campus:</Typography>
            <FormControl sx={{ minWidth: 300, mb: 3 }}>
                <InputLabel>Campus</InputLabel>
                <Select
                    value={selectedCampus}
                    label="Campus"
                    onChange={(e) => {
                        setSelectedCampus(e.target.value);
                        setSelectedAcademicProgram("");
                        setSelectedCurriculum("");
                    }}
                >
                    <MenuItem value="">
                        <em>Choose Campus</em>
                    </MenuItem>
                    {branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                            {branch.branch}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Typography fontWeight={500}>Academic Program:</Typography>
            <FormControl sx={{ minWidth: 300, mb: 3 }}>
                <InputLabel>Academic Program</InputLabel>
                <Select
                    value={selectedAcademicProgram}
                    label="Academic Program"
                    onChange={(e) => {
                        setSelectedAcademicProgram(e.target.value);
                        setSelectedCurriculum("");
                    }}
                    disabled={!selectedCampus}
                >
                    <MenuItem value="">
                        <em>Select Program</em>
                    </MenuItem>
                    <MenuItem value="0">Undergraduate</MenuItem>
                    <MenuItem value="1">Graduate</MenuItem>
                    <MenuItem value="2">Techvoc</MenuItem>
                </Select>
            </FormControl>

            <Typography fontWeight={500}>Search Curriculum:</Typography>
            <TextField
                fullWidth
                placeholder="Search Program Code, Program Description"
                value={searchCurriculum}
                onChange={(e) => setSearchCurriculum(e.target.value)}
                sx={{ maxWidth: 400, mb: 3 }}
            />

            <Typography fontWeight={500}>Select Curriculum:</Typography>
            <FormControl sx={{ minWidth: 400, mb: 4 }}>
                <InputLabel>Choose Curriculum</InputLabel>
                <Select
                    value={selectedCurriculum}
                    label="Choose Curriculum"
                    onChange={(e) => setSelectedCurriculum(e.target.value)}
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {filteredCurriculumList
                        .sort((a, b) => Number(a.year_description) - Number(b.year_description))
                        .map((c) => (
                            <MenuItem key={c.curriculum_id} value={c.curriculum_id}>
                                {formatSchoolYear(c.year_description)}:{" "}
                                {`(${c.program_code}): ${c.program_description}${c.major ? ` (${c.major})` : ""
                                    } (${getBranchLabel(c.components)})`}
                            </MenuItem>
                        ))}



                </Select>
            </FormControl>



            {/* YEARS */}
            {selectedCurriculum &&
                Object.keys(data)
                    .sort((a, b) => yearOrder[a] - yearOrder[b])
                    .map((year) => (
                        <Box
                            key={year}
                            sx={{
                                mb: 6,
                                border: `2px solid ${borderColor}`,
                                borderRadius: 2,
                                p: 2,
                                backgroundColor: "#fafafa",
                            }}
                        >
                            {/* ===== CURRICULUM HEADER (ONCE PER YEAR) ===== */}
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: "bold",
                                    color: "#fff",
                                    textAlign: "center",
                                    textTransform: "uppercase",
                                    letterSpacing: "1px",
                                    backgroundColor: settings?.header_color || "#1976d2",
                                    border: `2px solid ${borderColor}`,
                                    borderRadius: 1,
                                    p: 1,
                                    mb: 3,
                                }}
                            >
                                {formatSchoolYear(
                                    curriculumList.find(c => c.curriculum_id === selectedCurriculum)?.year_description
                                )} : {selectedCurriculumName}

                            </Typography>

                            {/* ===== SEMESTER TABLES ===== */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 3,
                                }}
                            >
                                {Object.keys(data[year])
                                    .sort((a, b) => semesterOrder[a] - semesterOrder[b])
                                    .map((sem) => {
                                        const semesterCourses = data[year][sem];

                                        return (
                                            <Box
                                                key={sem}
                                                sx={{
                                                    border: `2px solid ${borderColor}`,
                                                    borderRadius: 1,
                                                    p: 2,
                                                    mb: 6,
                                                    minHeight: 300,
                                                    position: "relative",
                                                    backgroundColor: "#fff",
                                                }}
                                            >
                                                <Box sx={{ position: "relative", pb: 7 }}>
                                                    <table
                                                        style={{
                                                            width: "100%",
                                                            borderCollapse: "collapse",
                                                        }}
                                                    >
                                                        <thead>
                                                            {/* YEAR + SEMESTER */}
                                                            <tr>
                                                                {/* YEAR (LEFT) */}
                                                                <th
                                                                    colSpan={3}
                                                                    style={{
                                                                        backgroundColor: "#f5f5f5",
                                                                        borderLeft: `2px solid ${borderColor}`,
                                                                        borderTop: `2px solid ${borderColor}`,
                                                                        borderBottom: `2px solid ${borderColor}`,
                                                                        padding: "10px",
                                                                        fontWeight: "bold",
                                                                        textAlign: "left",
                                                                        color: titleColor,
                                                                        fontSize: "21px",
                                                                    }}
                                                                >
                                                                    {formatYearLabel(year)}
                                                                </th>

                                                                {/* SEMESTER (RIGHT) */}
                                                                <th
                                                                    colSpan={3}
                                                                    style={{
                                                                        backgroundColor: "#f5f5f5",
                                                                        borderRight: `2px solid ${borderColor}`,
                                                                        borderTop: `2px solid ${borderColor}`,
                                                                        borderBottom: `2px solid ${borderColor}`,
                                                                        padding: "10px",
                                                                        fontWeight: "bold",
                                                                        fontSize: "21px",
                                                                        color: titleColor,
                                                                        textAlign: "right",
                                                                    }}
                                                                >
                                                                    {sem}
                                                                </th>
                                                            </tr>


                                                            {/* COLUMN HEADERS */}
                                                            <tr>
                                                                <th style={headerStyle}>#</th>
                                                                <th style={headerStyle}>COURSE CODE</th>
                                                                <th style={headerStyle}>COURSE DESCRIPTION</th>

                                                                <th style={headerStyle}>CREDITED UNITS</th>
                                                                <th style={headerStyle}>PREREQUISITES</th>

                                                                <th style={headerStyle}>COREQUISITE</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {semesterCourses.map((course, index) => (
                                                                <tr key={course.program_tagging_id}>
                                                                    <td style={{ ...cellStyle, textAlign: "center" }}>{index + 1}</td>
                                                                    <td style={cellStyle}>{course.course_code}</td>
                                                                    <td style={cellStyle}>{course.course_description}</td>

                                                                    <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                        {course.course_unit}
                                                                    </td>

                                                                    <td style={cellStyle}>
                                                                        <input
                                                                            type="text"
                                                                            value={
                                                                                editedCourseReqs[course.program_tagging_id]?.prereq ?? course.prereq ?? ""
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleReqChange(course.program_tagging_id, "prereq", e.target.value)
                                                                            }
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "6px",
                                                                                border: "1px solid #ccc",
                                                                                borderRadius: 4,
                                                                                textAlign: "right"
                                                                            }}
                                                                        />
                                                                    </td>

                                                                    <td style={cellStyle}>
                                                                        <input
                                                                            type="text"
                                                                            value={
                                                                                editedCourseReqs[course.program_tagging_id]?.corequisite ?? course.corequisite ?? ""
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleReqChange(course.program_tagging_id, "corequisite", e.target.value)
                                                                            }
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "6px",
                                                                                border: "1px solid #ccc",
                                                                                borderRadius: 4,
                                                                                textAlign: "right"
                                                                            }}
                                                                        />
                                                                    </td>

                                                                </tr>

                                                            ))}

                                                            {/* ===== TOTAL ROW ===== */}
                                                            {/* ===== TOTAL ROW ===== */}


                                                            <tr
                                                                style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                                                                <td style={cellStyle} colSpan={2}>
                                                                    TOTAL
                                                                </td>

                                                                <td style={{ ...cellStyle, textAlign: "center" }}>

                                                                </td>

                                                                {/* TOTAL UNITS */}
                                                                <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                    {semesterCourses.reduce(
                                                                        (sum, course) => sum + Number(course.course_unit || 0),
                                                                        0
                                                                    )}
                                                                </td>

                                                                {/* TOTAL PREREQ 1 */}
                                                                <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                    {semesterCourses.reduce((count, course) => {
                                                                        const value =
                                                                            editedCourseReqs[course.program_tagging_id]?.prereq ??
                                                                            course.prereq ??
                                                                            "";
                                                                        return count + (value.trim() !== "" ? 1 : 0);
                                                                    }, 0)}
                                                                </td>

                                                                {/* TOTAL PREREQ 2 */}

                                                                {/* TOTAL COREQUISITE */}
                                                                <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                    {semesterCourses.reduce((count, course) => {
                                                                        const value =
                                                                            editedCourseReqs[course.program_tagging_id]?.corequisite ??
                                                                            course.corequisite ??
                                                                            "";
                                                                        return count + (value.trim() !== "" ? 1 : 0);
                                                                    }, 0)}
                                                                </td>
                                                            </tr>

                                                        </tbody>

                                                    </table>
                                                </Box>

                                                {/* SAVE BUTTON */}
                                                <button
                                                    onClick={() =>
                                                        handleSaveSemester(semesterCourses)
                                                    }
                                                    style={{
                                                        marginTop: 10,
                                                        padding: "6px 14px",
                                                        background: "#1976d2",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: 5,
                                                        cursor: "pointer",
                                                        float: "right",
                                                    }}
                                                >
                                                    Save
                                                </button>
                                            </Box>
                                        );
                                    })}
                            </Box>


                        </Box>
                    ))}

            {/* SNACKBAR */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );

};

export default CoursePanelMap;


