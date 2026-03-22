import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Snackbar,
    Alert,
    Select,
    MenuItem,
    TextField
} from "@mui/material";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";

const ProgramUnit = () => {
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

    const [curriculumList, setCurriculumList] = useState([]);
    const [selectedCurriculum, setSelectedCurriculum] = useState("");
    const [taggedPrograms, setTaggedPrograms] = useState([]);

    const [editedCourseReqs, setEditedCourseReqs] = useState({});

    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const pageId = 113;



    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });


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

    /* ===================== EDIT HANDLERS ===================== */
    const handleReqChange = (id, field, value) => {
        setEditedCourseReqs(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value === "" ? null : Number(value),
            },
        }));
    };

    const handleSaveSemester = async (courses) => {
        try {
            const updates = {};

            // group edits by course_id
            for (const c of courses) {
                const edited = editedCourseReqs[c.program_tagging_id];
                if (!edited) continue;

                updates[c.course_id] = {
                    lec_unit:
                        edited.lec_unit !== undefined ? edited.lec_unit : c.lec_unit,
                    lab_unit:
                        edited.lab_unit !== undefined ? edited.lab_unit : c.lab_unit,
                    course_unit:
                        edited.course_unit !== undefined
                            ? edited.course_unit
                            : c.course_unit,
                };
            }

            // save once per course
            for (const courseId of Object.keys(updates)) {
                await axios.put(
                    `${API_BASE_URL}/update_course/${courseId}`,
                    updates[courseId]
                );
            }

            setEditedCourseReqs({});
            fetchTaggedPrograms();
            setSnackbar({
                open: true,
                message: "Saved successfully!",
                severity: "success",
            });
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "Save failed",
                severity: "error",
            });
        }
    };

    /* ===================== GROUP YEAR → SEM ===================== */
    const groupedData = () => {
        const result = {};

        taggedPrograms
            .filter((p) => p.curriculum_id == selectedCurriculum)
            .forEach((p) => {
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

    const selectedCurriculumName =
        curriculumList.find((c) => c.curriculum_id === selectedCurriculum)
            ?.program_description +
        (curriculumList.find((c) => c.curriculum_id === selectedCurriculum)
            ?.major
            ? ` ${curriculumList.find(
                (c) => c.curriculum_id === selectedCurriculum
            )?.major}`
            : "") || "";

    const formatSchoolYear = (yearDesc) => {
        if (!yearDesc) return "";
        const startYear = Number(yearDesc);
        if (isNaN(startYear)) return yearDesc; // safe fallback
        return `${startYear} - ${startYear + 1}`;
    };

    const getBranchLabel = (branchId) => {
        const branch = branches.find((item) => Number(item.id) === Number(branchId));
        return branch?.branch || "�";
    };

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

    const formatYearLabel = (year) => {
        return `${yearLabelMap[year] || year} - (${year})`;
    };


    if (loading || hasAccess === null) {
        return <LoadingOverlay open={loading} message="Loading..." />;
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
        textAlign: "center",
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
                    PROGRAM UNITS
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
                            {/* CURRICULUM HEADER */}
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

                            {/* SEMESTERS */}
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
                                        const courses = data[year][sem];

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
                                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                        <thead>
                                                            {/* YEAR + SEM */}
                                                            <tr>
                                                                <th
                                                                    colSpan={4}
                                                                    style={{
                                                                        backgroundColor: "#f5f5f5",
                                                                        borderLeft: `2px solid ${borderColor}`,
                                                                        borderTop: `2px solid ${borderColor}`,
                                                                        borderBottom: `2px solid ${borderColor}`,
                                                                        padding: "10px",
                                                                        fontWeight: "bold",
                                                                        textAlign: "left",
                                                                        fontSize: "21px",
                                                                        color: titleColor,
                                                                    }}
                                                                >
                                                                    {formatYearLabel(year)}
                                                                </th>

                                                                <th
                                                                    colSpan={4}
                                                                    style={{
                                                                        backgroundColor: "#f5f5f5",
                                                                        borderRight: `2px solid ${borderColor}`,
                                                                        borderTop: `2px solid ${borderColor}`,
                                                                        borderBottom: `2px solid ${borderColor}`,
                                                                        padding: "10px",
                                                                        fontWeight: "bold",
                                                                        textAlign: "right",
                                                                        fontSize: "21px",
                                                                        color: titleColor,
                                                                    }}
                                                                >
                                                                    {sem}
                                                                </th>
                                                            </tr>

                                                            <tr>
                                                                <th style={headerStyle}>#</th>
                                                                <th style={headerStyle}>COURSE CODE</th>
                                                                <th style={headerStyle}>COURSE DESCRIPTION</th>
                                                                <th style={headerStyle}>PREREQUISITE</th>
                                                                <th style={headerStyle}>LEC</th>
                                                                <th style={headerStyle}>LAB</th>
                                                                <th style={headerStyle}>CREDIT</th>
                                                                <th style={headerStyle}>TUITION</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {courses.map((c, index) => (
                                                                <tr key={c.program_tagging_id}>
                                                                    <td style={cellStyle}>{index + 1}</td>
                                                                    <td style={cellStyle}>{c.course_code}</td>
                                                                    <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                        {c.course_description}
                                                                    </td>
                                                                    <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                        {c.prereq}
                                                                    </td>

                                                                    <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                        <input
                                                                            type="number"
                                                                            value={
                                                                                editedCourseReqs[c.program_tagging_id]?.lec_unit ?? c.lec_unit ?? 0
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleReqChange(c.program_tagging_id, "lec_unit", e.target.value)
                                                                            }
                                                                            style={{
                                                                                width: "90px",
                                                                                padding: "6px",
                                                                                border: "1px solid #ccc",
                                                                                borderRadius: 4,
                                                                                textAlign: "right",
                                                                            }}
                                                                        />
                                                                    </td>

                                                                    <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                        <input
                                                                            type="number"
                                                                            value={
                                                                                editedCourseReqs[c.program_tagging_id]?.lab_unit ?? c.lab_unit ?? 0
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleReqChange(c.program_tagging_id, "lab_unit", e.target.value)
                                                                            }
                                                                            style={{
                                                                                width: "90px",
                                                                                padding: "6px",
                                                                                border: "1px solid #ccc",
                                                                                borderRadius: 4,
                                                                                textAlign: "right",
                                                                            }}
                                                                        />
                                                                    </td>

                                                                    <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                        <input
                                                                            type="number"
                                                                            value={
                                                                                editedCourseReqs[c.program_tagging_id]?.course_unit ?? c.course_unit ?? 0
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleReqChange(c.program_tagging_id, "course_unit", e.target.value)
                                                                            }
                                                                            style={{
                                                                                width: "90px",
                                                                                padding: "6px",
                                                                                border: "1px solid #ccc",
                                                                                borderRadius: 4,
                                                                                textAlign: "right",

                                                                            }}
                                                                        />
                                                                    </td>

                                                                    <td style={{ ...cellStyle, textAlign: "center", fontWeight: "bold" }}>
                                                                        {c.course_unit ?? 0}
                                                                    </td>


                                                                </tr>
                                                            ))}

                                                            {/* TOTAL */}
                                                            <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                                                                <td colSpan={4} style={cellStyle}>
                                                                    TOTAL
                                                                </td>
                                                                <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                    {courses.reduce(
                                                                        (sum, c) =>
                                                                            sum +
                                                                            Number(
                                                                                editedCourseReqs[c.program_tagging_id]?.lec_unit ??
                                                                                c.lec_unit ??
                                                                                0
                                                                            ),
                                                                        0
                                                                    )}
                                                                </td>
                                                                <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                    {courses.reduce(
                                                                        (sum, c) =>
                                                                            sum +
                                                                            Number(
                                                                                editedCourseReqs[c.program_tagging_id]?.lab_unit ??
                                                                                c.lab_unit ??
                                                                                0
                                                                            ),
                                                                        0
                                                                    )}
                                                                </td>
                                                                <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                    {courses.reduce(
                                                                        (sum, c) =>
                                                                            sum +
                                                                            Number(
                                                                                editedCourseReqs[c.program_tagging_id]?.course_unit ??
                                                                                c.course_unit ??
                                                                                0
                                                                            ),
                                                                        0
                                                                    )}
                                                                </td>
                                                                <td style={{ ...cellStyle, textAlign: "center" }}>
                                                                    {courses.reduce(
                                                                        (sum, c) =>
                                                                            sum +
                                                                            Number(
                                                                                editedCourseReqs[c.program_tagging_id]?.course_unit ??
                                                                                c.course_unit ??
                                                                                0
                                                                            ),
                                                                        0
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </Box>

                                                {/* SAVE BUTTON */}
                                                <button
                                                    onClick={() => handleSaveSemester(courses)}
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

export default ProgramUnit;


