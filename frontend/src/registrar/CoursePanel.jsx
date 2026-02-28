import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Button,
  Alert,
  Snackbar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Select,
  MenuItem,
  TableContainer,
  Checkbox,
} from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import SearchIcon from "@mui/icons-material/Search";

const CoursePanel = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff");
  const [stepperColor, setStepperColor] = useState("#000000");

  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");

  useEffect(() => {
    if (!settings) return;

    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);
    if (settings.stepper_color) setStepperColor(settings.stepper_color);

    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    }

    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);
  }, [settings]);

  const [course, setCourse] = useState({
    course_code: "",
    course_description: "",
    course_unit: "",
    lec_unit: "",
    lab_unit: "",
    prereq: "",
    corequisite: "",

  });


  const [courseList, setCourseList] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
    key: 0,
  });

  const showSnack = (message, severity) => {
    setSnack({
      open: true,
      message,
      severity,
      key: new Date().getTime(),
    });
  };

  const [feeRules, setFeeRules] = useState([]);


  const fetchFeeRules = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/coursepanel/fee_rules`
      );
      setFeeRules(res.data);
    } catch (err) {
      console.error("Error fetching fee rules:", err);
    }
  };

  useEffect(() => {
    fetchFeeRules();
  }, []);

  const [selectedGlobalFees, setSelectedGlobalFees] = useState([]);

  const programFees = feeRules.filter(
    fee =>
      Number(fee.applies_to_all) === 1 &&
      [
        "COURSE_WITH_LAB_FEE",
        "COMPUTER_LABORATORY_FEE",
        "NSTP_SPECIAL_FEE"
      ].includes(fee.fee_code)
  );

  const totalPayment = programFees.reduce(
    (sum, f) => sum + Number(f.amount),
    0
  );

  const globalTotal = feeRules
    .filter(fee => selectedGlobalFees.includes(fee.fee_rule_id))
    .reduce((sum, fee) => sum + Number(fee.amount), 0);



  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const pageId = 16;

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






  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/course_list`);
      const data = response.data.map(item => ({
        ...item,
        prerequisite: item.prereq || "",
      }));
      setCourseList(data);
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    fetchCourses();
  }, []);

  const handleChangesForEverything = (e) => {
    const { name, value } = e.target;

    setCourse((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Auto compute total
      const lec = parseFloat(updated.lec_unit) || 0;
      const lab = parseFloat(updated.lab_unit) || 0;
      updated.course_unit = (lec + lab).toFixed(2);

      return updated;
    });
  };


  const handleAddingCourse = async () => {
    try {
      await axios.post(`${API_BASE_URL}/adding_course`, {
        ...course,
        course_unit: parseFloat(course.course_unit) || 0,
        lec_unit: parseFloat(course.lec_unit) || 0,
        lab_unit: parseFloat(course.lab_unit) || 0,
        prereq: course.prereq || null,
        corequisite: course.corequisite || null,
      });

      setCourse({
        course_code: "",
        course_description: "",
        course_unit: "",
        lec_unit: "",
        lab_unit: "",
        prereq: "",
        corequisite: "",
      });

      showSnack("Course successfully added!", "success");
      fetchCourses();
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to add course.", "error");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courseList.filter((c) =>
    [
      c.course_description,
      c.course_code,
      c.prereq,
      c.course_unit?.toString(),

    ]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // same behavior

  const totalPages = Math.min(
    100,
    Math.ceil(filteredCourses.length / itemsPerPage)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentCourses = filteredCourses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );




  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleEdit = (item) => {
    setCourse({
      course_code: item.course_code ?? "",
      course_description: item.course_description ?? "",
      course_unit: Number(item.course_unit) || 0,
      lec_unit: Number(item.lec_unit) || 0,
      lab_unit: Number(item.lab_unit) || 0,
      prereq: item.prereq ?? "",
      corequisite: item.corequisite ?? "",
    });

    setEditMode(true);
    setEditId(item.course_id);
  };


  const handleUpdateCourse = async () => {
    if (!editId) {
      showSnack("Invalid course selected.", "error");
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/update_course/${editId}`, {
        ...course,
        course_unit: parseFloat(course.course_unit) || 0,
        lec_unit: parseFloat(course.lec_unit) || 0,
        lab_unit: parseFloat(course.lab_unit) || 0,
        prereq: course.prereq || null,
        corequisite: course.corequisite || null,
      });

      fetchCourses();
      showSnack("Course updated successfully!", "success");

      setEditMode(false);
      setEditId(null);
      setCourse({
        course_code: "",
        course_description: "",
        course_unit: "",
        lec_unit: "",
        lab_unit: "",
        prereq: "",
        corequisite: "",
      });
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to update course.", "error");
    }
  };


  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete_course/${id}`);

      setCourseList((prevList) =>
        prevList.filter((item) => item.course_id !== id)
      );

      showSnack("Course deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete course.", "error");
    }
  };





  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  const attachedFees = feeRules.filter(
    fee => Number(fee.applies_to_all) === 1
  );



  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  // ✅ Move dynamic styles inside the component so borderColor works
  const styles = {
    section: {
      padding: 16,
      border: `2px solid ${borderColor}`,
      borderRadius: 6,
      marginBottom: 24,
      backgroundColor: "#fff",
    },
    tableContainer: {
      maxHeight: "700px",
      overflowY: "auto",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "center",
    },
    tableCell: {
      border: `2px solid ${borderColor}`,
      padding: "8px",
      textAlign: "center",
    },
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
      {/* ===== HEADER ===== */}
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
          COURSE PANEL
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Search Year / Program Code / Description / Major"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: 450,
            backgroundColor: "#fff",
            borderRadius: 1,
            mb: 2,
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
      <TableContainer component={Paper} sx={{ width: "100%", border: `2px solid ${borderColor}` }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                COURSE MANAGEMENT
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      {/* ===== ADD / EDIT COURSE (TOP) – MUI ===== */}
      <Paper
        elevation={2}
        sx={{
          border: `2px solid ${borderColor}`,
          borderRadius: 2,
          p: 3,
          mb: 4,
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: "#800000", fontWeight: "bold", mb: 2 }}
        >
          {editMode ? "Edit Course" : "Add New Course"}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Course Code"
              name="course_code"
              required
              value={course.course_code}
              onChange={handleChangesForEverything}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Course Description"
              name="course_description"
              required
              value={course.course_description}
              onChange={handleChangesForEverything}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Lecture Unit"
              name="lec_unit"
              type="number"
              value={course.lec_unit}
              onChange={handleChangesForEverything}
              inputProps={{
                step: "0.01",   // ✅ allow decimals
                min: "0"
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Laboratory Unit"
              name="lab_unit"
              type="number"
              value={course.lab_unit}
              onChange={handleChangesForEverything}
              inputProps={{
                step: "0.01",
                min: "0"
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Course Unit"
              name="course_unit"
              type="number"
              value={course.course_unit}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Prerequisite"
              name="prereq"
              value={course.prereq}
              onChange={handleChangesForEverything}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Corequisite"
              name="corequisite"
              value={course.corequisite}
              onChange={handleChangesForEverything}
            />
          </Grid>
        </Grid>

        {/*<Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={course.is_nstp === 1}
                onChange={(e) => setCourse(prev => ({ ...prev, is_nstp: e.target.checked ? 1 : 0 }))}
              />
            }
            label="NSTP Course P150"
          />
        </Grid> */}

        {/* ===== ACTION BUTTON ===== */}
        <Box sx={{ mt: 3, textAlign: "right" }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={editMode ? handleUpdateCourse : handleAddingCourse}
          >
            {editMode ? "Update Course" : "Insert Course"}
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ width: "100%", border: `2px solid ${borderColor}` }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                COURSE LIST
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <Box
        sx={{
          border: `2px solid ${borderColor}`,
          borderRadius: 2,
          p: 2,
          backgroundColor: "#fff",
        }}
      >

        <Typography sx={{ fontWeight: "bold", mb: 1, color: "#555" }}>
          Total Subjects: {filteredCourses.length}
        </Typography>
        <TableContainer component={Paper} sx={{ width: '100%', }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
              <TableRow>
                <TableCell colSpan={10} sx={{ border: `2px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                  >
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
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                          },
                          '& svg': {
                            color: 'white', // dropdown arrow icon color
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: '#fff', // dropdown background
                            }
                          }
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


                    {/* Next & Last */}
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
                      Last
                    </Button>

                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>




        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  "ID",
                  "Code",
                  "Description",
                  "Lec Unit",
                  "Lab Unit",
                  "Credit Unit",
                  "Prerequisite",
                  "Corequisite",
                  "Lab",
                  "Lecture",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      border: `2px solid ${borderColor}`,
                      backgroundColor: "#f5f5f5",
                      color: "#000",
                      padding: "8px",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {currentCourses.map((c, index) => {
                // decide fee per course
                const courseFee = feeRules.find(fee => {
                  if (fee.fee_code === "NSTP_SPECIAL_FEE") {
                    return Number(c.is_nstp) === 1;
                  }
                  if (fee.fee_code === "COMPUTER_LABORATORY_FEE") {
                    return Number(c.iscomputer_lab) === 1;
                  }
                  if (fee.fee_code === "COURSE_WITH_LAB_FEE") {
                    return Number(c.isnon_computer_lab) === 1;
                  }
                  return false;
                });


                return (
                  <tr key={c.course_id}>
                    <td style={styles.tableCell}>{index + 1}</td>
                    <td style={styles.tableCell}>{c.course_code}</td>
                    <td style={styles.tableCell}>{c.course_description}</td>
                    <td style={styles.tableCell}>{c.lec_unit}</td>
                    <td style={styles.tableCell}>{c.lab_unit}</td>
                    <td style={styles.tableCell}>{c.course_unit}</td>
                    <td style={styles.tableCell}>{c.prereq}</td>
                    <td style={styles.tableCell}>{c.corequisite}</td>
                    <td style={styles.tableCell}>{c.iscomputer_lab ? "YES" : "NO"}</td>
                    <td style={styles.tableCell}>{c.isnon_computer_lab ? "YES" : "NO"}</td>

                    {/* ✅ SINGLE FEE CELL */}
                    {/* <td style={styles.tableCell}>
                      {courseFee ? courseFee.description : "—"}
                    </td>
                    <td style={styles.tableCell}>
                      {courseFee ? `₱${Number(courseFee.amount).toFixed(2)}` : "₱0.00"}
                    </td> */}

                    <td style={styles.tableCell}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                          onClick={() => handleEdit(c)}
                          style={{
                            backgroundColor: "green",
                            color: "#fff",
                            border: "none",
                            padding: "6px 10px",
                            width: "100px",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setCourseToDelete(c);
                            setOpenDeleteDialog(true);
                          }}
                          style={{
                            backgroundColor: "#9E0000",
                            color: "#fff",
                            border: "none",
                            width: "100px",
                            padding: "6px 10px",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Confirm Delete Course</DialogTitle>

          <DialogContent>
            <Typography>
              Are you sure you want to delete the course{" "}
              <b>{courseToDelete?.course_description}</b>{" "}
              (<b>{courseToDelete?.course_code}</b>)?
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
                handleDelete(courseToDelete.course_id);
                setOpenDeleteDialog(false);
                setCourseToDelete(null);
              }}
            >
              Yes, Delete
            </Button>
          </DialogActions>
        </Dialog>


        {/* ✅ Snackbar */}
        <Snackbar
          key={snack.key}
          open={snack.open}
          autoHideDuration={4000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleClose}
            severity={snack.severity} // ✅ Use severity: "success" | "error" | "info" | "warning"
            sx={{ width: "100%" }}
          >
            {snack.message}
          </Alert>
        </Snackbar>

      </Box>
    </Box>
  );
};

export default CoursePanel;