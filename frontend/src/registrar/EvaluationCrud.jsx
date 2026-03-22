import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  TableContainer,
  Table,
  Snackbar,
  Alert,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Divider,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";

const EvaluationCRUD = () => {
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
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color); // ✅ NEW
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

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [schoolYears, setSchoolYears] = useState([]);
  const [schoolSemester, setSchoolSemester] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSchoolSemester, setSelectedSchoolSemester] = useState("");
  const [selectedActiveSchoolYear, setSelectedActiveSchoolYear] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryEditMode, setCategoryEditMode] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    title: "",
    description: "",
  });
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    choice1: "",
    choice2: "",
    choice3: "",
    choice4: "",
    choice5: "",
  });

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const pageId = 23;

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
        `${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`,
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

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_questions`);
      setQuestions(response.data);
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_category`);
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const maxButtonsToShow = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_school_year/`)
      .then((res) => setSchoolYears(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_school_semester/`)
      .then((res) => setSchoolSemester(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/active_school_year`)
      .then((res) => {
        if (res.data.length > 0) {
          setSelectedSchoolYear(res.data[0].year_id);
          setSelectedSchoolSemester(res.data[0].semester_id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedSchoolYear && selectedSchoolSemester) {
      axios
        .get(
          `${API_BASE_URL}/get_selecterd_year/${selectedSchoolYear}/${selectedSchoolSemester}`,
        )
        .then((res) => {
          if (res.data.length > 0) {
            setSelectedActiveSchoolYear(res.data[0].school_year_id);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [selectedSchoolYear, selectedSchoolSemester]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalPages]);

  let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

  if (endPage - startPage < maxButtonsToShow - 1) {
    startPage = Math.max(1, endPage - maxButtonsToShow + 1);
  }

  const visiblePages = [];

  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }

  const filteredQuestion = questions.filter((s) => {
    const matchesYear =
      selectedSchoolYear === "" ||
      String(s.year_id) === String(selectedSchoolYear);

    const matchesSemester =
      selectedSchoolSemester === "" ||
      String(s.semester_id) === String(selectedSchoolSemester);

    return matchesYear && matchesSemester;
  });

  const handleSchoolYearChange = (event) => {
    setSelectedSchoolYear(event.target.value);
  };

  const handleSchoolSemesterChange = (event) => {
    setSelectedSchoolSemester(event.target.value);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e) => {
    setCategoryFormData({
      ...categoryFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCategoryDialogClose = () => {
    setCategoryDialogOpen(false);
    setCategoryEditMode(false);
    setCategoryFormData({ title: "", description: "" });
    setSelectedCategoryId(null);
  };

  const handleSaveQuestion = async () => {
    try {
      if (editMode) {
        const response = await axios.put(
          `${API_BASE_URL}/update_question/${selectedId}`,
          formData,
        );
        setSnackbarMessage(response.data.message);
        setOpenSnackbar(true);
      } else {
        const response = await axios.post(`${API_BASE_URL}/insert_question`, {
          ...formData,
          school_year_id: selectedActiveSchoolYear, // ✅ include this
        });
        setSnackbarMessage(response.data.message);
        setOpenSnackbar(true);
      }
      setFormData({
        category: "",
        question: "",
        choice1: "",
        choice2: "",
        choice3: "",
        choice4: "",
        choice5: "",
      });
      setOpenDialog(false);
      setEditMode(false);
      setSelectedId(null);
      fetchQuestions();
    } catch (err) {
      console.error("Error saving question:", err);
      alert("Failed to save question");
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (categoryEditMode) {
        await axios.put(
          `${API_BASE_URL}/update_category/${selectedCategoryId}`,
          categoryFormData,
        );
        setSnackbarMessage("Category updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/insert_category`, categoryFormData);
        setSnackbarMessage("Category created successfully");
      }
      setOpenSnackbar(true);
      handleCategoryDialogClose();
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Failed to save category");
    }
  };

  const handleEdit = (question) => {
    setFormData({
      category: question.category,
      question: question.question_description,
      choice1: question.first_choice,
      choice2: question.second_choice,
      choice3: question.third_choice,
      choice4: question.fourth_choice,
      choice5: question.fifth_choice,
    });
    setSelectedId(question.question_id);
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleEditCategory = (cat) => {
    setCategoryFormData({ title: cat.title, description: cat.description });
    setSelectedCategoryId(cat.id);
    setCategoryEditMode(true);
    setCategoryDialogOpen(true);
  };

  // 🔒 Disable right-click
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // 🔒 Block DevTools shortcuts + Ctrl+P silently
  document.addEventListener("keydown", (e) => {
    const isBlockedKey =
      e.key === "F12" || // DevTools
      e.key === "F11" || // Fullscreen
      (e.ctrlKey &&
        e.shiftKey &&
        (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "j")) || // Ctrl+Shift+I/J
      (e.ctrlKey && e.key.toLowerCase() === "u") || // Ctrl+U (View Source)
      (e.ctrlKey && e.key.toLowerCase() === "p"); // Ctrl+P (Print)

    if (isBlockedKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Put this at the very bottom before the return
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 150px)",
        overflowY: "auto",
        paddingRight: 1,
        backgroundColor: "transparent",
        mt: 1,
        padding: 2,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          style={{ color: titleColor }}
        >
          EVALUATION MANAGEMENT
        </Typography>
      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />
      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead
            sx={{
              backgroundColor: settings?.header_color || "#1976d2",
              color: "white",
            }}
          >
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
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    QUESTION LISTS
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1}>
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      First
                    </Button>

                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
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
                          fontSize: "12px",
                          height: 36,
                          color: "white",
                          border: "1px solid white",
                          backgroundColor: "transparent",
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "& svg": {
                            color: "white",
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: "#fff",
                            },
                          },
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
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
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
      <TableContainer
        component={Paper}
        sx={{
          width: "100%",
          border: `2px solid ${borderColor}`,
        }}
      >
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => {
                      setOpenDialog(true);
                    }}
                    sx={{
                      backgroundColor: "#1967d2",
                      color: "white",
                      textTransform: "none",
                      fontWeight: "bold",
                      width: "350px",
                      "&:hover": { backgroundColor: "#000000" },
                    }}
                  >
                    Add Evaluation Question
                  </Button>

                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    sx={{ backgroundColor: "#1967d2", color: "white" }}
                    onClick={() => setCategoryDialogOpen(true)}
                  >
                    Add Category
                  </Button>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <FormControl sx={{ width: "350px" }} size="small">
                      <InputLabel>Filter by School Year</InputLabel>
                      <Select
                        label="Filter by School Year"
                        value={selectedSchoolYear}
                        onChange={handleSchoolYearChange}
                      >
                        {schoolYears.length > 0 ? (
                          schoolYears.map((sy) => (
                            <MenuItem value={sy.year_id} key={sy.year_id}>
                              {sy.current_year} - {sy.next_year}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>School Year is not found</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                    <FormControl sx={{ width: "350px" }} size="small">
                      <InputLabel>Filter by School Semester</InputLabel>
                      <Select
                        label="Filter by School Semester"
                        value={selectedSchoolSemester}
                        onChange={handleSchoolSemesterChange}
                      >
                        {schoolSemester.length > 0 ? (
                          schoolSemester.map((sem) => (
                            <MenuItem
                              value={sem.semester_id}
                              key={sem.semester_id}
                            >
                              {sem.semester_description}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>
                            School Semester is not found
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer
        component={Paper}
        sx={{ border: `2px solid ${borderColor}`, marginTop: "2rem" }}
      >
        <Table>
          <TableHead
            sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
          >
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Title
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Description
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length > 0 ? (
              categories.map((cat, index) => (
                <TableRow key={cat.id}>
                  <TableCell
                    sx={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {cat.title}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {cat.description}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    <Button
                      variant="contained"
                      sx={{ backgroundColor: "#4CAF50", color: "white" }}
                      onClick={() => handleEditCategory(cat)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No categories found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer
        component={Paper}
        sx={{ border: `2px solid ${borderColor}`, marginTop: "2rem" }}
      >
        <Table>
          <TableHead
            sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
          >
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
                colSpan={8}
              >
                QUESTIONS
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
                rowSpan={2}
                colSpan={2}
              >
                Action
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  width: "1rem",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  width: "1rem",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Category
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  width: "40rem",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Description
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  width: "9rem",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Choice 1
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  width: "9rem",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Choice 2
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  width: "9rem",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Choice 3
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  width: "9rem",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Choice 4
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  width: "9rem",
                  textAlign: "center",
                  border: `2px solid ${borderColor}`,
                }}
              >
                Choice 5
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQuestion.length > 0 ? (
              filteredQuestion.map((q, index) => (
                <TableRow key={q.question_id}>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {q.category}
                  </TableCell>
                  <TableCell
                    style={{
                      padding: "0px 20px",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {q.question_description}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {q.first_choice}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {q.second_choice}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {q.third_choice}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {q.fourth_choice}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {q.fifth_choice}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    <Button
                      style={{
                        background: "#4CAF50",
                        color: "white",
                        width: "100px",
                      }}
                      onClick={() => handleEdit(q)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No questions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: "maroon", fontWeight: "bold" }}>
          {editMode ? "Edit Question" : "Add New Question"}
        </DialogTitle>
        <hr style={{ border: "1px solid #ccc", width: "100%" }} />

        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Select Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                label="Select Category"
                onChange={handleChange}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Question Description"
              name="question"
              value={formData.question}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Choice 1"
              name="choice1"
              value={formData.choice1}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Choice 2"
              name="choice2"
              value={formData.choice2}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Choice 3"
              name="choice3"
              value={formData.choice3}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Choice 4"
              name="choice4"
              value={formData.choice4}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Choice 5"
              name="choice5"
              value={formData.choice5}
              onChange={handleChange}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveQuestion}
            sx={{
              backgroundColor: "#800000",
              "&:hover": { backgroundColor: "#6D2323" },
              fontWeight: "bold",
            }}
          >
            {editMode ? "Save Changes" : "Insert Question"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={categoryDialogOpen}
        onClose={handleCategoryDialogClose}
        fullWidth
        maxWidth="sm"
      >
        S
        <DialogTitle sx={{ color: "maroon", fontWeight: "bold" }}>
          {categoryEditMode ? "Edit Category" : "Add New Category"}
        </DialogTitle>
        <hr style={{ border: "1px solid #ccc", width: "100%" }} />
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Title"
              name="title"
              value={categoryFormData.title}
              onChange={handleCategoryChange}
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={categoryFormData.description}
              onChange={handleCategoryChange}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCategoryDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCategory}
            sx={{
              backgroundColor: "#800000",
              "&:hover": { backgroundColor: "#6D2323" },
              fontWeight: "bold",
            }}
          >
            {categoryEditMode ? "Save Changes" : "Insert Category"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvaluationCRUD;
