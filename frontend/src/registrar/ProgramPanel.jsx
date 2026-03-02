import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import { TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  FormControl, Select, MenuItem
} from "@mui/material";

const ProgramPanel = () => {
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
  const [branches, setBranches] = useState([]);

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

  const [program, setProgram] = useState({
    name: "",
    code: "",
    major: "",
    components: "",
    academic_program: "",  // ✅ new
  });


  const [programs, setPrograms] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 34;

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


  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchPrograms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_program`);
      setPrograms(res.data);
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleChangesForEverything = (e) => {
    const { name, value } = e.target;
    setProgram((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddingProgram = async () => {
    if (!program.name || !program.code) {
      setSnackbar({
        open: true,
        message: "Please fill all fields",
        severity: "error",
      });
      return;
    }

    try {
      if (editMode) {
        await axios.put(`${API_BASE_URL}/program/${editId}`, program);
        setSnackbar({
          open: true,
          message: "Program updated successfully!",
          severity: "success",
        });
      } else {
        await axios.post(`${API_BASE_URL}/program`, program);
        setSnackbar({
          open: true,
          message: "Program added successfully!",
          severity: "success",
        });
      }

      setProgram({
        name: "",
        code: "",
        major: "",
        components: "",
        academic_program: "", // ✅
      });

      setEditMode(false);
      setEditId(null);
      fetchPrograms();
    } catch (err) {
      console.error("Error saving program:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Error saving program!",
        severity: "error",
      });
    }
  };

  const handleEdit = (prog) => {
    setProgram({
      name: prog.program_description,
      code: prog.program_code,
      major: prog.major || "",
      components: String(prog.components || ""),
      academic_program: String(prog.academic_program || ""), // ✅
    });

    setEditMode(true);
    setEditId(prog.program_id);
  };



  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);


  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/program/${id}`);
      fetchPrograms();
      setSnackbar({
        open: true,
        message: "Program deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error deleting program:", err);
      setSnackbar({
        open: true,
        message: "Error deleting program!",
        severity: "error",
      });
    }
  };


  const [searchQuery, setSearchQuery] = useState("");
  const getCampusName = (components) => {
    const branch = branches.find(
      (item) => Number(item.id) === Number(components)
    );
    return branch?.branch || "—";
  };

  const filteredPrograms = programs.filter((prog) => {
    const q = searchQuery.toLowerCase();

    return (
      prog.program_description?.toLowerCase().includes(q) ||
      prog.program_code?.toLowerCase().includes(q) ||
      prog.major?.toLowerCase().includes(q) ||
      getCampusName(prog.components).toLowerCase().includes(q)

    );
  });


  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };



  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // adjust how many programs per page

  // Recalculate total pages dynamically based on filteredPrograms
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);

  // Calculate current slice of programs to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPrograms = filteredPrograms.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  // ✅ Styles now INSIDE the component
  const styles = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      gap: "20px",
      flexWrap: "wrap",
    },


    formGroup: { marginBottom: "20px" },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      color: "#444",
      fontSize: "16px",
    },
    input: {
      width: "100%",
      padding: "12px",
      fontSize: "16px",
      borderRadius: "5px",
      border: "1px solid #ccc",
    },

    table: { width: "100%", borderCollapse: "collapse" },
    th: {

      padding: "8px",
      textAlign: "left",
      fontWeight: "bold",
      border: `2px solid ${borderColor}`,
      fontSize: "16px",
      color: "#000"
    },
    td: {
      padding: "8px",
      textAlign: "left",
      borderBottom: "1px solid #ddd",
      fontSize: "16px",
      border: `2px solid ${borderColor}`,
    },
    editButton: {
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
    },
    deleteButton: {
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
    },
  };

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
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
          sx={{ fontWeight: "bold", color: titleColor, fontSize: "36px" }}
        >
          PROGRAM PANEL
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Search Program Description / Code / Major"
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
      <br />

      <div style={styles.formSection}>

        <TableContainer component={Paper} sx={{ width: '100%', }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
              <TableRow>
                <TableCell colSpan={20} sx={{ border: `2px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ padding: "6px" }}
                  >
                    {/* LEFT SIDE - TOTAL PROGRAM */}
                    <Typography fontSize="14px" fontWeight="bold" color="white">
                      Total Program: {filteredPrograms.length}
                    </Typography>

                    {/* RIGHT SIDE - PAGINATION */}
                    <Box
                      display="flex"
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
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Major</th>
              <th style={styles.th}>Components</th>
              <th style={styles.th}>Academic Program</th>

              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPrograms.map((prog, index) => (

              <tr key={prog.program_id}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{prog.program_description}</td>
                <td style={styles.td}>{prog.program_code}</td>
                <td style={styles.td}>{prog.major || "—"}</td>
                <td style={styles.td}>
                  {getCampusName(prog.components)}
                </td>
                <td style={styles.td}>
                  {prog.academic_program === 0
                    ? "Undergraduate"
                    : prog.academic_program === 1
                      ? "Graduate"
                      : prog.academic_program === 2
                        ? "Techvoc"
                        : "—"}
                </td>


                <td style={{ ...styles.td, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(prog)}
                      style={styles.editButton}
                    >
                      <EditIcon fontSize="small" /> Edit
                    </button>

                    <button
                      onClick={() => {
                        setProgramToDelete(prog);
                        setOpenDeleteDialog(true);
                      }}
                      style={styles.deleteButton}
                    >
                      <DeleteIcon fontSize="small" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
        {programs.length === 0 && <p>No programs available.</p>}
        <TableContainer component={Paper} sx={{ width: '100%', }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
              <TableRow>
                <TableCell colSpan={20} sx={{ border: `2px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ padding: "6px" }}
                  >
                    {/* LEFT SIDE - TOTAL PROGRAM */}
                    <Typography fontSize="14px" fontWeight="bold" color="white">
                      Total Program: {filteredPrograms.length}
                    </Typography>

                    {/* RIGHT SIDE - PAGINATION */}
                    <Box
                      display="flex"
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
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>

        
        <br />
        <br />
        <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
          <Table>
            <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
              <TableRow>
                <TableCell sx={{ color: 'white', textAlign: "Center" }}>Insert Program</TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
        <TableContainer
          component={Paper}
          sx={{
            width: "100%",
            border: `2px solid ${borderColor}`,
            mb: "20px",
            p: 3
          }}
        >



          <div style={styles.formGroup}>
            <label htmlFor="program_name" style={styles.label}>
              Program Description:
            </label>
            <input
              type="text"
              id="program_name"
              name="name"
              value={program.name}
              onChange={handleChangesForEverything}
              placeholder="Enter Program Description"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="program_code" style={styles.label}>
              Program Code:
            </label>
            <input
              type="text"
              id="program_code"
              name="code"
              value={program.code}
              onChange={handleChangesForEverything}
              placeholder="Enter Program Code"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="program_major" style={styles.label}>
              Major:
            </label>
            <input
              type="text"
              id="program_major"
              name="major"
              value={program.major}
              onChange={handleChangesForEverything}
              placeholder="Enter Major (e.g., Marketing Management)"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="program_components" style={styles.label}>
              Campus:
            </label>

            <select
              id="program_components"
              name="components"
              value={program.components}
              onChange={handleChangesForEverything}
              style={styles.input}
            >
              <option value="">-- Select Campus --</option>
              {branches.map((branch) => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.branch}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Academic Program:</label>

            <select
              name="academic_program"
              value={program.academic_program}
              onChange={handleChangesForEverything}
              style={styles.input}
            >
              <option value="">-- Select Academic Program --</option>
              <option value="0">Undergraduate</option>
              <option value="1">Graduate</option>
              <option value="2">Techvoc</option>
            </select>
          </div>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <Button
              onClick={handleAddingProgram}
              variant="contained"
              sx={{
                width: "30%",

              }}
            >
              {editMode ? "Update Program" : "Insert Program"}
            </Button>
          </Box>

        </TableContainer>


        <br />



      </div>


      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete Program</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the program{" "}
            <b>{programToDelete?.program_description}</b>{" "}
            (<b>{programToDelete?.program_code}</b>)?
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
              handleDelete(programToDelete.program_id);
              setOpenDeleteDialog(false);
              setProgramToDelete(null);
            }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProgramPanel;
