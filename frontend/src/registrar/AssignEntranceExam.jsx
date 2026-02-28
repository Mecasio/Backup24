import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box, Button, Grid, MenuItem, TextField, Typography, Paper, Card, TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Snackbar,
  Alert,
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import KeyIcon from "@mui/icons-material/Key";
import API_BASE_URL from "../apiConfig";
import CampaignIcon from '@mui/icons-material/Campaign';
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";


const AssignEntranceExam = () => {
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
    } else {
      setFetchedLogo(EaristLogo);
    }

    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);
  }, [settings]);

  useEffect(() => {
    if (!settings) return;

    if (settings.branches) {
      try {
        const parsedBranches = typeof settings.branches === "string"
          ? JSON.parse(settings.branches)
          : settings.branches;

        setBranches(parsedBranches);
      } catch (err) {
        console.error("Invalid branches JSON", err);
      }
    }

  }, [settings]);

  const tabs = [
    { label: "Room Registration", to: "/room_registration", icon: <KeyIcon fontSize="large" /> },
    { label: "Verify Documents Room Assignment", to: "/verify_document_schedule", icon: <MeetingRoomIcon fontSize="large" /> },
    { label: "Verify Documents Schedule Management", to: "/verify_schedule", icon: <ScheduleIcon fontSize="large" /> },
    { label: "Evaluator's Applicant List", to: "/evaluator_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    { label: "Entrance Exam Room Assignment", to: "/assign_entrance_exam", icon: <MeetingRoomIcon fontSize="large" /> },
    { label: "Entrance Exam Schedule Management", to: "/assign_schedule_applicant", icon: <ScheduleIcon fontSize="large" /> },
    { label: "Proctor's Applicant List", to: "/admission_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    { label: "Announcement", to: "/announcement_for_admission", icon: <CampaignIcon fontSize="large" /> },
  ];

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);

  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;
  const maxDate = `${currentYear}-12-31`;

  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [day, setDay] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  const [roomQuota, setRoomQuota] = useState("");
  const [proctor, setProctor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [roomName, setRoomName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [schedules, setSchedules] = useState([]);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeStep, setActiveStep] = useState(4);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));

  const navigate = useNavigate();

  const pageId = 9;

  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to);
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/room_list`);

        setRooms(res.data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setMessage("Could not load rooms. Check backend /room_list.");
      }
    };
    fetchRooms();
  }, []);

  const [schoolYearId, setSchoolYearId] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE_URL}/active_school_year`)
    .then(res => {
      setSchoolYearId(res.data[0]?.school_year_id);
    });
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/exam_schedules_with_count`);
        setSchedules(res.data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      }
    };
    fetchSchedules();
  }, []);

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

  const [selectedCampusFilter, setSelectedCampusFilter] = useState("");


  const filteredSchedules = schedules.filter((s) => {
    const scheduleMonth = new Date(s.day_description).getMonth() + 1;

    const matchesCampus =
      !selectedCampusFilter || s.branch === selectedCampusFilter;

    const matchesMonth =
      !selectedMonth || scheduleMonth === Number(selectedMonth);

    const matchesDate =
      !selectedDate || s.day_description === selectedDate;

    const matchesSearch =
      !searchQuery ||
      s.building_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.evaluator?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCampus && matchesMonth && matchesDate && matchesSearch;
  });

  const handleSaveSchedule = async () => {
    const sel = rooms.find(r => String(r.room_id) === String(roomId));
    if (!sel) {
      setSnackbarMessage("Invalid room ❌");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    try {
      if (editingSchedule) {
        await axios.put(
          `${API_BASE_URL}/update_exam_schedule/${editingSchedule.schedule_id}`,
          {
            branch: selectedBranch,  // ✅ ADDED
            day_description: day,
            building_description: buildingName,
            room_description: sel.room_description,
            start_time: startTime,
            end_time: endTime,
            proctor,
            room_quota: roomQuota,
            active_school_year_id: schoolYearId,
          }
        );
        setSnackbarMessage("Schedule updated");
      } else {
        await axios.post(`${API_BASE_URL}/insert_exam_schedule`, {
          branch: selectedBranch,  // ✅ ADDED
          day_description: day,
          building_description: buildingName,
          room_description: sel.room_description,
          start_time: startTime,
          end_time: endTime,
          proctor,
          room_quota: roomQuota,
          active_school_year_id: schoolYearId,
        });
        setSnackbarMessage("Schedule saved");
      }

      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      setEditingSchedule(null);
      setSelectedBranch("");   // ✅ RESET
      setDay("");
      setBuildingName("");
      setRoomId("");
      setStartTime("");
      setEndTime("");
      setProctor("");
      setRoomQuota("");

      const res = await axios.get(`${API_BASE_URL}/exam_schedules_with_count`);
      setSchedules(res.data);

    } catch (err) {
      setSnackbarMessage(err.response?.data?.error || "Action failed ❌");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };


  const [selectedBranch, setSelectedBranch] = useState("");
  const [branches, setBranches] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSchedule) {
      setOpenUpdateDialog(true);
      return;
    }
    handleSaveSchedule();
  };

  const executeDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/delete_exam_schedule/${scheduleToDelete.schedule_id}`);
      setSchedules(prev => prev.filter(s => s.schedule_id !== scheduleToDelete.schedule_id));

      setSnackbarMessage("Schedule deleted ✅");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (err) {
      console.error(err);
      setSnackbarMessage(err.response?.data?.error || "Delete failed ❌");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }

    setScheduleToDelete(null);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setSelectedBranch(schedule.branch);  // ✅ ADDED
    setDay(schedule.day_description);
    setBuildingName(schedule.building_description);

    const room = rooms.find(r => r.room_description === schedule.room_description);
    setRoomId(room ? room.room_id : "");

    setStartTime(schedule.start_time);
    setEndTime(schedule.end_time);
    setProctor(schedule.proctor);
    setRoomQuota(schedule.room_quota);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const availableDates = Array.from(
    new Set(
      schedules
        .filter((s) => {
          const matchesSearch =
            !searchQuery ||
            s.building_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.room_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.proctor?.toLowerCase().includes(searchQuery.toLowerCase());

          const matchesMonth =
            !selectedMonth ||
            new Date(s.day_description).getMonth() + 1 === Number(selectedMonth);

          return matchesSearch && matchesMonth;
        })
        .map((s) => s.day_description)
    )
  ).sort();

  const formatTime = (time) => {
    if (!time) return "";

    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };



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
      {/* ===== PAGE HEADER WITH SEARCH ===== */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
          gap: 2,
        }}
      >
        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: titleColor,
            fontSize: "36px",
          }}
        >
          ENTRANCE EXAM ROOM ASSIGNMENT
        </Typography>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search Proctor, Building, Room"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: 450,
            backgroundColor: "#fff",
            borderRadius: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ mr: 1, color: "gray" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />
      <br />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "nowrap", // ❌ prevent wrapping
          width: "100%",
          mt: 1,
          gap: 2,
        }}
      >
        {tabs.map((tab, index) => (
          <Card key={tab.to} onClick={() => handleStepClick(index, tab.to)}
            sx={{
              flex: `1 1 ${100 / tabs.length}%`, // evenly divide row
              height: 135,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: 2,
              border: `2px solid ${borderColor}`,
              backgroundColor: activeStep === index ? settings?.header_color || "#1976d2" : "#E8C999",
              color: activeStep === index ? "#fff" : "#000",
              boxShadow:
                activeStep === index
                  ? "0px 4px 10px rgba(0,0,0,0.3)"
                  : "0px 2px 6px rgba(0,0,0,0.15)",
              transition: "0.3s ease",
              "&:hover": {
                backgroundColor: activeStep === index ? "#000000" : "#f5d98f",
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ fontSize: 40, mb: 1 }}>{tab.icon}</Box>
              <Typography sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}>
                {tab.label}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      <br />
      <br />

      <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, mb: "40px" }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Entrance Exam Schedule Management</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <br />

      <Grid container spacing={4}>
        {/* ===== ADD / EDIT FORM ===== */}
        <Grid item xs={12} md={4}>
          <Paper elevation={6} sx={{ p: 3, border: `2px solid ${borderColor}` }}>
            <Typography variant="h6" fontWeight="bold" textAlign="center" mb={3} sx={{ color: subtitleColor }}>
              {editingSchedule ? "UPDATE SCHEDULE" : "ADD SCHEDULE"}
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>

                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Campus / Branch"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    required
                  >
                    {branches.map((b) => (
                      <MenuItem key={b.id} value={b.branch}>
                        {b.branch}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>


                <Grid item xs={12}>
                  <TextField fullWidth type="date" label="Exam Date"
                    InputLabelProps={{ shrink: true }}
                    value={day}
                    inputProps={{ min: minDate, max: maxDate }}
                    onChange={(e) => setDay(e.target.value)}
                    required />
                </Grid>

                <Grid item xs={12}>
                  <TextField select fullWidth label="Building"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)} required>
                    {[...new Set(rooms.map(r => r.building_description).filter(Boolean))]
                      .map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField select fullWidth label="Room"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)} required>
                    {rooms.filter(r => r.building_description === buildingName)
                      .map(r => (
                        <MenuItem key={r.room_id} value={r.room_id}>
                          {r.room_description}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>

                <Grid item xs={6}>
                  <TextField fullWidth type="time" label="Start Time"
                    InputLabelProps={{ shrink: true }}
                    value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </Grid>

                <Grid item xs={6}>
                  <TextField fullWidth type="time" label="End Time"
                    InputLabelProps={{ shrink: true }}
                    value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth label="Proctor"
                    value={proctor} onChange={(e) => setProctor(e.target.value)} />
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth type="number" label="Room Quota"
                    value={roomQuota} onChange={(e) => setRoomQuota(e.target.value)} />
                </Grid>

                <Grid item xs={12} textAlign="center">
                  <Button type="submit" variant="contained"
                    sx={{ px: 6, py: 1.5, bgcolor: "#1967d2", "&:hover": { bgcolor: "#000" } }}>
                    {editingSchedule ? "Update Schedule" : "Save Schedule"}
                  </Button>
                </Grid>

              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* ===== SCHEDULE LIST ===== */}
        <Grid item xs={12} md={8}>
          <Paper elevation={6} sx={{ p: 3, border: `2px solid ${borderColor}` }}>
            <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2} sx={{ color: subtitleColor }}>
              EXISTING SCHEDULES
            </Typography>

            {/* ===== FILTER & SEARCH BOX ===== */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">

              <TextField
                select
                label="Select Campus"
                value={selectedCampusFilter}
                onChange={(e) => setSelectedCampusFilter(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Campus</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.branch}>
                    {b.branch}
                  </MenuItem>
                ))}
              </TextField>

              {/* 📆 Month Selector */}
              <TextField
                select
                label="Select Month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedDate(""); // reset date when month changes
                }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Months</MenuItem>
                {Array.from({ length: 12 }).map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </MenuItem>
                ))}
              </TextField>

              {/* 📅 Date Selector */}
              <TextField
                select
                label="Select Exam Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!selectedMonth}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">All Dates</MenuItem>
                {availableDates.map((date) => (
                  <MenuItem key={date} value={date}>
                    {formatDate(date)}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* TABLE */}
            <Box sx={{ maxHeight: 520, overflowY: "auto" }}>
              <table width="100%" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: settings?.header_color || "#1976d2", color: "#ffffff" }}>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>Campus</th>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>Date</th>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>Building</th>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>Room</th>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>Start</th>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>End</th>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>Proctor</th>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>Quota</th>
                    <th style={{ border: `2px solid ${borderColor}`, width: "33.33%", padding: "12px 8px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map(s => (
                    <tr key={`${s.id}-${s.day_description}-${s.room_description}`}>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}>{s.branch}</td>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}>{formatDate(s.day_description)}</td>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}>{s.building_description}</td>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}>{s.room_description}</td>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}>{formatTime(s.start_time)}</td>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}> {formatTime(s.end_time)}</td>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}>{s.proctor}</td>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}>{s.room_quota}</td>
                      <td style={{ border: `2px solid ${borderColor}`, padding: "12px 8px", textAlign: "center" }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ backgroundColor: "green", color: "white", mr: 1 }}
                          onClick={() => handleEdit(s)}  // no change needed here
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ backgroundColor: "#9E0000", color: "white" }}
                          onClick={() => {
                            setScheduleToDelete(s);   // store schedule temporarily
                            setOpenDeleteDialog(true); // open dialog
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          action={
            scheduleToDelete && (
              <Button color="inherit" size="small" onClick={executeDeleteSchedule}>
                CONFIRM
              </Button>
            )
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={openUpdateDialog}
        onClose={() => setOpenUpdateDialog(false)}
      >
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to modify and save the schedule?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpdateDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenUpdateDialog(false);
              handleSaveSchedule();
            }}
          >
            Yes, Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setScheduleToDelete(null);
        }}
      >
        <DialogTitle>Confirm Delete Schedule</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the schedule for <b>{scheduleToDelete?.room_description}</b> in building <b>{scheduleToDelete?.building_description || "N/A"}</b> on <b>{formatDate(scheduleToDelete?.day_description)}</b>?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpenDeleteDialog(false);
              setScheduleToDelete(null);
            }}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (!scheduleToDelete) return;

              try {
                await axios.delete(`${API_BASE_URL}/delete_exam_schedule/${scheduleToDelete.schedule_id}`);
                setSchedules(prev => prev.filter(s => s.schedule_id !== scheduleToDelete.schedule_id));

                setSnackbarMessage("Schedule deleted ✅");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
              } catch (err) {
                console.error(err);
                setSnackbarMessage(err.response?.data?.error || "Delete failed ❌");
                setSnackbarSeverity("error");
                setOpenSnackbar(true);
              }

              setOpenDeleteDialog(false);
              setScheduleToDelete(null);
            }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignEntranceExam;
