import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box, Typography, Button, Snackbar, FormControl, Select, InputLabel, MenuItem,
  Alert, Card, Paper, CardContent, TableContainer, Table, TableHead, TableCell, TableRow, TableBody, Switch
} from "@mui/material";
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
} from "@mui/material";


const CurriculumPanel = () => {
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

  }, [settings]);

  const [curriculum, setCurriculum] = useState({ year_id: "", program_id: "" });
  const [yearList, setYearList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [curriculumList, setCurriculumList] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 18;

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

  useEffect(() => {
    fetchYear();
    fetchProgram();
    fetchCurriculum();
  }, []);

  const fetchYear = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/year_table`);
      setYearList(res.data);
    } catch (err) {
      console.error(err);
    }
  };



  const fetchProgram = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_program`);
      setProgramList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurriculum = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_curriculum`);
      setCurriculumList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurriculum((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCurriculum = async () => {
    if (!curriculum.year_id || !curriculum.program_id) {
      setSnackbar({
        open: true,
        message: "Please fill all fields",
        severity: "error",
      });
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/update_curriculum_data/${editingId}`, curriculum);

        setSnackbar({
          open: true,
          message: "Curriculum updated successfully!",
          severity: "success",
        });

        setEditingId(null);
      } else {
        await axios.post(`${API_BASE_URL}/curriculum`, curriculum);

        setSnackbar({
          open: true,
          message: "Curriculum successfully added!",
          severity: "success",
        });
      }

      setCurriculum({ year_id: "", program_id: "" });
      fetchCurriculum();

    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Operation failed!",
        severity: "error",
      });
    }
  };

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [curriculumToDelete, setCurriculumToDelete] = useState(null);

  const confirmDelete = (item) => {
    setCurriculumToDelete(item);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!curriculumToDelete) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/delete_curriculum/${curriculumToDelete.curriculum_id}`
      );

      setSnackbar({
        open: true,
        message: "Curriculum deleted successfully!",
        severity: "success",
      });

      fetchCurriculum();
    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        message: "Delete failed!",
        severity: "error",
      });
    } finally {
      setOpenDeleteDialog(false);
      setCurriculumToDelete(null);
    }
  };

  const [editingId, setEditingId] = useState(null);

  const handleEdit = (item) => {
    setCurriculum({
      year_id: item.year_id,
      program_id: item.program_id,
    });

    // Optional: store ID if updating instead of inserting
    setEditingId(item.curriculum_id);
  };

  // ✅ Updated with instant UI response
  const handleUpdateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    // Instantly update UI
    setCurriculumList((prevList) =>
      prevList.map((item) =>
        item.curriculum_id === id ? { ...item, lock_status: newStatus } : item
      )
    );

    // Show instant feedback
    setSnackbar({
      open: true,
      message: `Curriculum #${id} is now ${newStatus === 1 ? "Active" : "Inactive"
        }`,
      severity: "info",
    });

    try {
      await axios.put(`${API_BASE_URL}/update_curriculum/${id}`, {
        lock_status: newStatus,
      });

      // Confirm success
      setSnackbar({
        open: true,
        message: `Curriculum #${id} successfully set to ${newStatus === 1 ? "Active" : "Inactive"
          }`,
        severity: "success",
      });
    } catch (err) {
      console.error("Error updating status:", err);

      // Revert UI if failed
      setCurriculumList((prevList) =>
        prevList.map((item) =>
          item.curriculum_id === id
            ? { ...item, lock_status: currentStatus }
            : item
        )
      );

      setSnackbar({
        open: true,
        message: "Failed to update curriculum status. Please try again.",
        severity: "error",
      });
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const formatAcademicYear = (year) => {
    if (!year) return "";

    const startYear = parseInt(year, 10);
    if (isNaN(startYear)) return year;

    return `${startYear}-${startYear + 1}`;
  };



  const filteredCurriculumList = curriculumList.filter((item) => {
    const words = searchQuery.trim().toLowerCase().split(" ").filter(Boolean);

    return words.every((word) =>
      String(formatAcademicYear(item.year_description))
        .toLowerCase()
        .includes(word) ||
      String(item.program_code ?? "").toLowerCase().includes(word) ||
      String(item.program_description ?? "").toLowerCase().includes(word) ||
      String(item.major ?? "").toLowerCase().includes(word)
    );
  });


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // adjust as needed

  // Compute total pages
  const totalPages = Math.ceil(filteredCurriculumList.length / itemsPerPage);

  // Slice data for current page
  const paginatedCurriculum = filteredCurriculumList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatSchoolYear = (yearDesc) => {
    if (!yearDesc) return "";
    const startYear = Number(yearDesc);
    if (isNaN(startYear)) return yearDesc; // safe fallback
    return `${startYear} - ${startYear + 1}`;
  };

  const buttonStyles = {
    minWidth: 70,
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
    },
  };

  const selectStyles = {
    fontSize: '12px',
    height: 36,
    color: 'white',
    border: '1px solid white',
    backgroundColor: 'transparent',
    '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '& svg': { color: 'white' },
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
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: titleColor, fontSize: "36px", mb: 2 }}
        >
          CURRICULUM PANEL
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Search Year / Program Code / Description / Major"
          size="small"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          sx={{
            width: 460,
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

      {/* TOTAL + PAGINATION HEADER */}
      <TableContainer component={Paper} sx={{ width: '100%', mt: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: settings?.header_color || "#6D2323" }}>
            <TableRow>
              <TableCell
                colSpan={5}
                sx={{
                  border: `2px solid ${borderColor}`,
                  py: 0.5,
                  backgroundColor: settings?.header_color || "#6D2323",
                  color: "white",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ px: 1 }}
                >
                  {/* LEFT SIDE - TOTAL CURRICULUM */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Curriculum: {filteredCurriculumList.length}
                  </Typography>

                  {/* RIGHT SIDE - PAGINATION */}
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={buttonStyles}
                    >
                      First
                    </Button>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={buttonStyles}
                    >
                      Prev
                    </Button>

                    {/* Page Select */}
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        displayEmpty
                        sx={selectStyles}
                        MenuProps={{
                          PaperProps: {
                            sx: { maxHeight: 200, backgroundColor: '#fff' },
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
                      of {totalPages} page{totalPages > 1 ? 's' : ''}
                    </Typography>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={buttonStyles}
                    >
                      Next
                    </Button>

                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={buttonStyles}
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
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{

                border: `2px solid ${borderColor}`, textAlign: "center",
                color: "black",
              }}>ID</TableCell>
              <TableCell sx={{

                border: `2px solid ${borderColor}`, textAlign: "center",
                color: "black",
              }}>Year</TableCell>
              <TableCell sx={{

                border: `2px solid ${borderColor}`, textAlign: "center",
                color: "black",
              }}>Program</TableCell>
              <TableCell sx={{

                border: `2px solid ${borderColor}`, textAlign: "center",
                color: "black",
              }} align="center">Active</TableCell>
              <TableCell sx={{

                border: `2px solid ${borderColor}`, textAlign: "center",
                color: "black",
              }} align="center">Actions</TableCell>
            </TableRow>

          </TableHead>

          <TableBody>
            {paginatedCurriculum.map((item, index) => (
              <TableRow
                key={item.curriculum_id}
                hover
                sx={{ "&:last-child td": { borderBottom: 0 } }}
              >
                <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}> {index + 1}</TableCell>
                <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                  {formatAcademicYear(item.year_description)}
                </TableCell >
                <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                  <Typography fontWeight={500}>

                    {`(${item.program_code}): ${item.program_description} (${Number(item.components) === 1
                      ? "Manila Campus"
                      : Number(item.components) === 2
                        ? "Cavite Campus"
                        : "—"
                      })`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.major ? ` (${item.major})` : ""}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: `2px solid ${borderColor}` }} align="center">
                  <Switch
                    checked={item.lock_status === 1}
                    onChange={() =>
                      handleUpdateStatus(
                        item.curriculum_id,
                        item.lock_status
                      )
                    }
                    color="success"
                  />
                </TableCell>
                <TableCell
                  sx={{ border: `2px solid ${borderColor}` }}
                  align="center"
                >
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ backgroundColor: "green", color: "white", mr: 1 }}
                    onClick={() => handleEdit(item)}

                  >
                    Edit
                  </Button>

                  <Button

                    onClick={() => confirmDelete(item)}
                    variant="contained"
                    size="small"
                    sx={{ backgroundColor: "#9E0000", color: "white" }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer component={Paper} sx={{ width: '100%', }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: settings?.header_color || "#6D2323" }}>
            <TableRow>
              <TableCell
                colSpan={5}
                sx={{
                  border: `2px solid ${borderColor}`,
                  py: 0.5,
                  backgroundColor: settings?.header_color || "#6D2323",
                  color: "white",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ px: 1 }}
                >
                  {/* LEFT SIDE - TOTAL CURRICULUM */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Curriculum: {filteredCurriculumList.length}
                  </Typography>

                  {/* RIGHT SIDE - PAGINATION */}
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={buttonStyles}
                    >
                      First
                    </Button>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={buttonStyles}
                    >
                      Prev
                    </Button>

                    {/* Page Select */}
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        displayEmpty
                        sx={selectStyles}
                        MenuProps={{
                          PaperProps: {
                            sx: { maxHeight: 200, backgroundColor: '#fff' },
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
                      of {totalPages} page{totalPages > 1 ? 's' : ''}
                    </Typography>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={buttonStyles}
                    >
                      Next
                    </Button>

                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={buttonStyles}
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
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Insert Curriculum</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <Box sx={{ maxHeight: 750, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",

          }}
        >
          {/* LEFT SECTION */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              width: "600px",
              backgroundColor: "#fff",
              border: `2px solid ${borderColor}`,
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
        
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold" }}>Curriculum Year:</label>
              <select
                name="year_id"
                value={curriculum.year_id}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <option value="">Choose Year</option>

                {[...yearList]
                  .sort(
                    (a, b) =>
                      Number(a.year_description) - Number(b.year_description)
                  )
                  .map((year) => (
                    <option key={year.year_id} value={year.year_id}>
                      {formatAcademicYear(year.year_description)}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold" }}>Program:</label>
              <select
                name="program_id"
                value={curriculum.program_id}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <option value="">Choose Program</option>
                {programList.map((program) => (
                  <option key={program.program_id} value={program.program_id}>
                    {formatSchoolYear(program.year_description)}:{" "}
                    {`(${program.program_code}): ${program.program_description}${program.major ? ` (${program.major})` : ""
                      } (${Number(program.components) === 1
                        ? "Manila Campus"
                        : Number(program.components) === 2
                          ? "Cavite Campus"
                          : "—"
                      })`}
                  </option>
                ))}
              </select>
            </div>



            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <Button
                onClick={handleAddCurriculum}
                variant="contained"
                sx={{
                  width: "30%",

                }}
              >
                Insert
              </Button>
            </Box>

          </div>



        </div>
      </Box>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete Curriculum</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete this curriculum?
            <br />
            <br />
            <b>
              {curriculumToDelete &&
                `${formatAcademicYear(
                  curriculumToDelete.year_description
                )} — (${curriculumToDelete.program_code})`}
            </b>
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpenDeleteDialog(false);
              setCurriculumToDelete(null);
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirmed}
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

export default CurriculumPanel;