import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
import SearchIcon from "@mui/icons-material/Search";
import LoadingOverlay from "../components/LoadingOverlay";
const generateSlotOptions = (start = 10, end = 500, step = 10) => {
  const options = [];
  for (let i = start; i <= end; i += step) {
    options.push(i);
  }
  return options;
};

const SLOT_OPTIONS = generateSlotOptions(10, 500, 10);

const ProgramSlotLimit = () => {
  const [yearId, setYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [programs, setPrograms] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [department, setDepartment] = useState([]);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [schoolYears, setSchoolYears] = useState([]);
  const [semesters, setSchoolSemester] = useState([]);
  const [campusFilter, setCampusFilter] = useState("1");
  const [maxSlots, setMaxSlots] = useState("");

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

  // 🔹 Authentication and access states
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [confirmAllProgramsOpen, setConfirmAllProgramsOpen] = useState(false);

  const pageId = 110;

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

  useEffect(() => {
    fetchSlotSummary();
  }, [yearId, semesterId]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (department.length > 0 && !selectedDepartmentFilter) {
      const firstDeptId = department[0].dprtmnt_id;
      setSelectedDepartmentFilter(firstDeptId);
      fetchPrograms(firstDeptId);
    }
  }, [department, selectedDepartmentFilter]);

  useEffect(() => {
    if (programs.length > 0 && !selectedProgram) {
      setSelectedProgram(programs[0].program_id);
    }
  }, [programs, selectedProgram]);

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
    fetchActiveSchoolYear();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_department`);
      setDepartment(res.data);
      console.log(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchPrograms = async (dprtmnt_id) => {
    if (!dprtmnt_id) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/applied_program/${dprtmnt_id}`,
      );
      setPrograms(res.data);
      return res.data;
    } catch (err) {
      console.error("❌ Department fetch error:", err);
      setErrorMessage("Failed to load department list");
    }
  };

  const fetchSlotSummary = async () => {
    if (!yearId || !semesterId) return;

    const res = await axios.get(`${API_BASE_URL}/api/programs/availability`, {
      params: { year_id: yearId, semester_id: semesterId },
    });
    setSlots(res.data);
  };

  const fetchActiveSchoolYear = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/active_school_year`);

      if (res.data.length > 0) {
        const active = res.data[0];
        setYearId(active.year_id);
        setSemesterId(active.semester_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveSlotLimit = async () => {
    await axios.post(`${API_BASE_URL}/api/program-slots`, {
      curriculum_id: selectedProgram,
      max_slots: maxSlots,
      year_id: yearId,
      semester_id: semesterId,
    });

    fetchSlotSummary();
    setSelectedProgram("");
    setMaxSlots("");
    setIsEditing(false);
  };

  const saveSlotLimitAll = async () => {
    await axios.post(`${API_BASE_URL}/api/program-slots/department`, {
      dprtmnt_id: selectedDepartmentFilter,
      max_slots: maxSlots,
      year_id: yearId,
      semester_id: semesterId,
    });

    fetchSlotSummary();
    setIsEditing(false);
  };

  const saveSlotLimitAllPrograms = async () => {
    await axios.post(`${API_BASE_URL}/api/program-slots/all`, {
      max_slots: maxSlots,
      year_id: yearId,
      semester_id: semesterId,
    });

    fetchSlotSummary();
    setIsEditing(false);
  };

  const handleConfirmSave = () => {
    if (!selectedProgram || !yearId || !semesterId || !maxSlots) return;
    setConfirmOpen(true);
  };

  const handleConfirmSaveAll = () => {
    if (!selectedDepartmentFilter || !yearId || !semesterId || !maxSlots)
      return;
    setConfirmAllOpen(true);
  };

  const handleConfirmSaveAllPrograms = () => {
    if (!yearId || !semesterId || !maxSlots) return;
    setConfirmAllProgramsOpen(true);
  };

  const handleCollegeChange = (e) => {
    const selectedId = e.target.value;
    setSelectedDepartmentFilter(selectedId);
    setSelectedProgram("");
    setPrograms([]);
    fetchPrograms(selectedId);
  };

  const handleEdit = async (row) => {
    const deptId = row.dprtmnt_id;
    const curriculumId = row.curriculum_id ?? row.program_id;

    setIsEditing(true);
    setMaxSlots(row.max_slots);
    setSelectedDepartmentFilter(deptId);

    const nextPrograms = await fetchPrograms(deptId);
    if (nextPrograms && curriculumId) {
      setSelectedProgram(curriculumId);
    }
  };

  const filteredSlots = slots.filter(
    (row) =>
      !selectedDepartmentFilter ||
      row.dprtmnt_id === Number(selectedDepartmentFilter),
  );

  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  const selectedProgramItem = programs.find(
    (p) => p.curriculum_id === selectedProgram,
  );
  const selectedProgramCode = selectedProgramItem
    ? selectedProgramItem.program_code
    : "";

  const selectedDepartmentItem = department.find(
    (d) => d.dprtmnt_id === Number(selectedDepartmentFilter),
  );
  const selectedDepartmentName = selectedDepartmentItem
    ? selectedDepartmentItem.dprtmnt_name
    : "selected department";

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
          sx={{
            fontWeight: "bold",
            color: titleColor,
          }}
        >
          ADMISSION PROGRAM SLOT
        </Typography>

        <TextField
          size="small"
          placeholder="Search Program"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

      <TableContainer
        component={Paper}
        sx={{ width: "100%", border: `2px solid ${borderColor}` }}
      >
        <Table>
          <TableHead
            sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
          >
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "Center" }}>
                Program Slot (Remaining)
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <Paper sx={{ p: 3, mb: 4, border: `2px solid ${borderColor}` }}>
        <Box display="flex" gap={2}>
          <FormControl fullWidth>
            <Select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    marginTop: "8px",
                  },
                },
              }}
            >
              <MenuItem value={1}>Manila</MenuItem>
              <MenuItem value={2}>Cavite</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <Select
              name="campus"
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 410,
                    marginTop: "8px",
                  },
                },
              }}
            >
              {schoolYears.map((sy) => (
                <MenuItem key={sy.year_id} value={sy.year_id}>
                  {sy.current_year} - {sy.next_year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <Select
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 410,
                    marginTop: "8px",
                  },
                },
              }}
            >
              {semesters.map((sem) => (
                <MenuItem key={sem.semester_id} value={sem.semester_id}>
                  {sem.semester_description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <Select
              value={selectedDepartmentFilter}
              onChange={handleCollegeChange}
              MenuProps={{
                PaperProps: {
                  sx: {
                    marginTop: "8px",
                  },
                },
              }}
            >
              {department.map((dep) => (
                <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_id}>
                  {dep.dprtmnt_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <Select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Select Program</MenuItem>
              {programs.map((p) => (
                <MenuItem key={p.curriculum_id} value={p.curriculum_id}>
                  ({p.program_code}-{p.year_description}){" "}
                  {p.program_description} {p.program_major}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <Select
              value={maxSlots}
              onChange={(e) => setMaxSlots(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Max Slots</MenuItem>
              {SLOT_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <TextField
              label="Max Slots"
              type="number"
              value={maxSlots}
              onChange={(e) => setMaxSlots(Number(e.target.value))}
              inputProps={{ min: 1 }}
            />
          </FormControl>

        </Box>


        <Box width="100%" display="flex" gap={2} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            sx={{ minWidth: 250, height: 55 }}
            onClick={handleConfirmSave}
            disabled={!selectedProgram || !yearId || !semesterId}
          >
            {isEditing ? "Update" : "Save"}
          </Button>

          <Button
            variant="contained"
            sx={{ minWidth: 250, height: 55 }}
            onClick={handleConfirmSaveAll}
            disabled={
              !selectedDepartmentFilter ||
              !yearId ||
              !semesterId ||
              !maxSlots ||
              programs.length === 0
            }
          >
            Save Slot Per Department
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmSaveAllPrograms}
            sx={{ minWidth: 250, height: 55 }}
            disabled={!yearId || !semesterId || !maxSlots}
          >
            Save All
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="confirm-slot-title"
        aria-describedby="confirm-slot-description"
      >
        <DialogTitle id="confirm-slot-title">Confirm Slot Setup</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-slot-description">
            Do you want to set the {maxSlots} slot for the{" "}
            {selectedProgramCode || "selected program"}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              setConfirmOpen(false);
              await saveSlotLimit();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmAllOpen}
        onClose={() => setConfirmAllOpen(false)}
        aria-labelledby="confirm-all-slot-title"
        aria-describedby="confirm-all-slot-description"
      >
        <DialogTitle id="confirm-all-slot-title">
          Confirm Slot Setup
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-all-slot-description">
            Do you want to set {maxSlots} slots for all programs in{" "}
            {selectedDepartmentName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAllOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              setConfirmAllOpen(false);
              await saveSlotLimitAll();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmAllProgramsOpen}
        onClose={() => setConfirmAllProgramsOpen(false)}
        aria-labelledby="confirm-all-programs-title"
        aria-describedby="confirm-all-programs-description"
      >
        <DialogTitle id="confirm-all-programs-title">
          Confirm Slot Setup
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-all-programs-description">
            Do you want to set {maxSlots} slots for all programs?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmAllProgramsOpen(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              setConfirmAllProgramsOpen(false);
              await saveSlotLimitAllPrograms();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3} columns={4}>
        {filteredSlots.map((row) => {
          const remaining = row.remaining;
          const percentage =
            row.max_slots > 0
              ? Math.min((row.total_enrolled / row.max_slots) * 100, 100)
              : 0;

          return (
            <Grid item xs={1} key={row.program_id}>
              <Card
                sx={{
                  height: 340,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  border: `1px solid ${borderColor}`,
                  boxShadow: 3,
                  transition: "0.25s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 6,
                  },
                }}
              >
                {/* HEADER */}
                <Box
                  sx={{
                    backgroundColor:
                      remaining <= 0
                        ? "#d32f2f" // red when full
                        : "#388e3c", // green when slots are available
                    color: "white",
                    px: 2,
                    py: 1.5,
                    minHeight: 76,
                  }}
                >
                  <Typography fontWeight={600} fontSize={14} lineHeight={1.3}>
                    ({row.program_code}) {row.program_description}
                  </Typography>
                  <Typography fontSize={12} opacity={0.9} noWrap>
                    {row.major}
                  </Typography>
                </Box>

                {/* BODY */}
                <CardContent sx={{ flex: 1 }}>
                  <Typography fontSize={28} fontWeight={700}>
                    {remaining}
                  </Typography>
                  <Typography fontSize={20}>
                    <strong>Max Slots:</strong> {row.max_slots}
                  </Typography>
                  <Typography fontSize={13}>
                    <strong>Enrolled:</strong> {row.total_enrolled}
                  </Typography>
                  <Typography fontSize={13} mb={1}>
                    <strong>Remaining:</strong> {remaining}
                  </Typography>

                  <br />

                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#eee",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          remaining <= 0
                            ? "#d32f2f"
                            : percentage >= 70
                              ? "#f57c00"
                              : "#388e3c",
                      },
                    }}
                  />

                  {/* FOOTER */}
                  <Box
                    sx={{
                      mt: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 4,
                    }}
                  >
                    <Chip
                      size="medium"
                      sx={{ width: "100px", height: "40px" }}
                      label={remaining <= 0 ? "FULL" : "OPEN"}
                      color={remaining <= 0 ? "error" : "success"}
                    />

                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        backgroundColor: "green",
                        color: "white",
                        width: "100px",
                        height: "35px",
                      }}
                      onClick={() => handleEdit(row)}
                    >
                      Edit
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ProgramSlotLimit;
