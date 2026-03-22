import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  Typography,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import EditIcon from "@mui/icons-material/Edit";




export default function DepartmentCurriculumPanel() {
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

  const [departments, setDepartments] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCurr, setSelectedCurr] = useState("");
  const [mappings, setMappings] = useState([]);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  // const [editDialog, setEditDialog] = useState({
  //   open: false,
  //   id: null,
  //   curriculum_id: "",
  // });

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const pageId = 107;

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



  // function openEditDialog(mapping) {
  //   setEditDialog({
  //     open: true,
  //     id: mapping.dprtmnt_curriculum_id,
  //     curriculum_id: mapping.curriculum_id,
  //   });
  // }

  // function closeEditDialog() {
  //   setEditDialog({ open: false, id: null, curriculum_id: "" });
  // }


  // async function handleEditSave() {
  //   try {
  //     await axios.put(`${API_BASE_URL}/dprtmnt_curriculum/${editDialog.id}`, {
  //       curriculum_id: editDialog.curriculum_id,
  //       dprtmnt_id: selectedDept
  //     });

  //     fetchMappings(selectedDept);
  //     closeEditDialog();
  //   } catch (err) {
  //     console.error("Update error:", err);
  //     alert(err.response?.data?.message || "Failed to update mapping");
  //   }
  // }



  useEffect(() => {
    fetchDepartments();
    fetchCurriculums();
  }, []);

  useEffect(() => {
    if (selectedDept) fetchMappings(selectedDept);
    else setMappings([]);
  }, [selectedDept]);

  async function fetchDepartments() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/departments`);
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  }
  const [program, setProgram] = useState({ name: "", code: "", major: "" });
  const [programs, setPrograms] = useState([]);

  const fetchProgram = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_program`);
      setPrograms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProgram();
  }, []);

  const getBranchLabel = (branchId) => {
    const branch = branches.find((item) => Number(item.id) === Number(branchId));
    return branch?.branch || "�";
  };


  async function fetchCurriculums() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/get_curriculum`);
      setCurriculums(data);
    } catch (err) {
      console.error("Failed to fetch curriculums", err);
    }
  }

  async function fetchMappings(dprtmnt_id) {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/dprtmnt_curriculum/${dprtmnt_id}`);
      setMappings(data || []);
    } catch (err) {
      console.error("Failed to fetch mappings", err);
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMapping() {
    if (!selectedDept || !selectedCurr) return;
    setAdding(true);
    try {
      await axios.post(`${API_BASE_URL}/dprtmnt_curriculum`, {
        dprtmnt_id: selectedDept,
        curriculum_id: selectedCurr,
      });
      // refresh
      fetchMappings(selectedDept);
      setSelectedCurr("");
    } catch (err) {
      console.error("Error adding mapping:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to add data");
    } finally {
      setAdding(false);
    }
  }

  function openDeleteDialog(id) {
    setConfirmDelete({ open: true, id });
  }
  function closeDeleteDialog() {
    setConfirmDelete({ open: false, id: null });
  }

  async function handleDelete() {
    const id = confirmDelete.id;
    if (!id) return;
    try {
      await axios.delete(`${API_BASE_URL}/dprtmnt_curriculum/${id}`);
      fetchMappings(selectedDept);
      closeDeleteDialog();
    } catch (err) {
      console.error("Error deleting mapping:", err);
      alert("Failed to delete mapping");
    }
  }

  const formatSchoolYear = (yearDesc) => {
    if (!yearDesc) return "";
    const startYear = Number(yearDesc);
    if (isNaN(startYear)) return yearDesc; // safe fallback
    return `${startYear} - ${startYear + 1}`;
  };



  // Put this at the very bottom before the return 
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return (
      <Unauthorized />
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 4,
          alignItems: 'stretch',
          mb: 2,

        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: titleColor,
            fontSize: '36px',
          }}
        >
          DEPARTMENT CURRICULUM PANEL
        </Typography>




      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />
      <br />
      <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Select Department Curriculum Panel</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          border: `2px solid ${borderColor}`,

        }}
      >

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <Typography variant="body1" fontWeight="bold">
              Select Department:
            </Typography>
          </Grid>

          <Grid item>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Department</InputLabel>
              <Select
                label="Department"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <MenuItem value="">
                  <em>Choose department</em>
                </MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.dprtmnt_id} value={d.dprtmnt_id}>
                    {d.dprtmnt_name} ({d.dprtmnt_code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <Typography variant="body1" fontWeight="bold">
              Select Curriculum:
            </Typography>
          </Grid>

          <Grid item>
            <FormControl size="small" sx={{ minWidth: 420 }}>
              <InputLabel>Curriculum (Year - Program)</InputLabel>
              <Select
                label="Curriculum"
                value={selectedCurr}
                onChange={(e) => setSelectedCurr(e.target.value)}
              >
                <MenuItem value="">
                  <em>Choose curriculum</em>
                </MenuItem>
                {curriculums.map((c) => {
                  const programLabel = c.program_description || c.program_code || `program ${c.program_id}`;

                  return (
                    <MenuItem key={c.curriculum_id} value={c.curriculum_id}>
                      {formatSchoolYear(c.year_description)}:{" "}
                      {`(${c.program_code}): ${c.program_description}${c.major ? ` (${c.major})` : ""
                        } (${getBranchLabel(c.components)})`}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddMapping}
              disabled={!selectedDept || !selectedCurr || adding}
            >
              {adding ? <CircularProgress size={18} /> : "Add"}
            </Button>
          </Grid>
        </Grid>
      </Paper>


      <Box>
        {loading ? (
          <CircularProgress />
        ) : (
          <>


            <Table size="small">
              <TableHead>
                <TableRow style={{
                  border: `2px solid ${borderColor}`,
                  backgroundColor: settings?.header_color || "#1976d2",
                  color: "#fff",
                  width: "10%",
                  textAlign: "center",
                }}>
                  <TableCell sx={{ color: "#fff", border: `2px solid ${borderColor}`, textAlign: "center", }}>ID</TableCell>
                  <TableCell sx={{ color: "#fff", border: `2px solid ${borderColor}`, textAlign: "center", }}>Department</TableCell>
                  <TableCell sx={{ color: "#fff", border: `2px solid ${borderColor}`, textAlign: "center", }}>Program Code / Description</TableCell>
                  <TableCell sx={{ color: "#fff", border: `2px solid ${borderColor}`, textAlign: "center", }}>Action</TableCell>
                </TableRow>
              </TableHead>


              <TableBody>
                {mappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}><em>No Department</em></TableCell>
                  </TableRow>
                ) : (
                  mappings.map((m, index) => (
                    <TableRow key={m.dprtmnt_curriculum_id}>

                      <TableCell sx={{ border: `2px solid ${borderColor}`, }}>{index + 1}</TableCell>

                      {/* Department */}
                      <TableCell sx={{ border: `2px solid ${borderColor}`, }}>
                        {m.dprtmnt_code} — {m.dprtmnt_name}
                      </TableCell>

                      {/* Program Code / Description */}
                      <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                        {m.p_code || ""} — {m.p_description || ""}
                        {m.year_description ? ` (${m.year_description})` : ""} ({m.p_major || ""})
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center", width: "250px" }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1
                          }}
                        >

                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              backgroundColor: "green",
                              color: "white",
                              borderRadius: "5px",
                              padding: "8px",
                              width: "100px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "5px",
                            }}
                            onClick={() => openEditDialog(m)}
                          >
                            <EditIcon fontSize="small" /> Edit
                          </Button>

                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              backgroundColor: "#9E0000",
                              color: "white",
                              borderRadius: "5px",
                              padding: "8px",
                              width: "100px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "5px",
                            }}
                            onClick={() => openDeleteDialog(m.dprtmnt_curriculum_id)}
                          >
                            <DeleteIcon fontSize="small" /> Delete
                          </Button>

                        </Box>
                      </TableCell>


                    </TableRow>
                  ))
                )}
              </TableBody>


            </Table>
          </>
        )}
      </Box>


      <Dialog open={confirmDelete.open} onClose={closeDeleteDialog}>
        <DialogTitle>Delete mapping?</DialogTitle>
        <DialogContent>
          Are you sure you want to remove this department ↔ curriculum mapping?
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* <Dialog open={editDialog.open} onClose={closeEditDialog}>
        <DialogTitle>Edit Mapping</DialogTitle>

        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Curriculum</InputLabel>
            <Select
              label="Curriculum"
              value={editDialog.curriculum_id}
              onChange={(e) =>
                setEditDialog({ ...editDialog, curriculum_id: e.target.value })
              }
            >
              {curriculums.map((c) => (
                <MenuItem key={c.curriculum_id} value={c.curriculum_id}>
                  {c.curriculum_id} — {c.program_description || c.program_code || c.p_description || c.p_code}
                  ({c.year_description})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog> */}

    </Box>
  );
}

