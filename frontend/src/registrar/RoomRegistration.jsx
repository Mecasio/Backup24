import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
  Paper,
  Grid,
  Snackbar,
  Alert,
  TableContainer,
  MenuItem,
  FormControl,
  Select,
  InputLabel
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import API_BASE_URL from "../apiConfig";
import SchoolIcon from "@mui/icons-material/School";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PeopleIcon from "@mui/icons-material/People";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import KeyIcon from "@mui/icons-material/Key";
import CampaignIcon from '@mui/icons-material/Campaign';
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";



const RoomRegistration = () => {
  const settings = useContext(SettingsContext);

  const branches = Array.isArray(settings?.branches)
    ? settings.branches
    : typeof settings?.branches === "string"
      ? JSON.parse(settings.branches)
      : [];

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



  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 52;

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


  const tabs = [
    { label: "Room Registration", to: "/room_registration", icon: <KeyIcon fontSize="large" /> },
    // { label: "Verify Documents Room Assignment", to: "/verify_document_schedule", icon: <MeetingRoomIcon fontSize="large" /> },
    // { label: "Verify Documents Schedule Management", to: "/verify_schedule", icon: <ScheduleIcon fontSize="large" /> },
    // { label: "Evaluator's Applicant List", to: "/evaluator_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    { label: "Entrance Exam Room Assignment", to: "/assign_entrance_exam", icon: <MeetingRoomIcon fontSize="large" /> },
    // { label: "Entrance Exam Schedule Management", to: "/assign_schedule_applicant", icon: <ScheduleIcon fontSize="large" /> },
    { label: "Proctor's Applicant List", to: "/admission_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },
    // { label: "Examination Permit", to: "/registrar_examination_profile", icon: <PersonSearchIcon fontSize="large" /> },
    { label: "Announcement", to: "/announcement_for_admission", icon: <CampaignIcon fontSize="large" /> },
  ];


  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };


  // 🔹 Room management states
  const [roomName, setRoomName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [floor, setFloor] = useState("");
  const [type, setType] = useState("");
  const [branch, setBranch] = useState(1);
  const [isAircon, setIsAircon] = useState(0);

  const [selectedBranch, setSelectedBranch] = useState("");

  const fetchRoomList = async (branchId = "") => {
    try {
      const url = branchId
        ? `${API_BASE_URL}/room_list?branch=${branchId}`
        : `${API_BASE_URL}/room_list`;

      const res = await axios.get(url);
      setRoomList(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  useEffect(() => {
    fetchRoomList();
  }, []);

  const handleAddRoom = async () => {
    if (!roomName.trim() || !floor) {
      setSnack({
        open: true,
        message: "Room name and floor are required",
        severity: "warning",
      });
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/adding_room`, {
        room_description: roomName,
        building_description: buildingName,
        floor,
        is_airconditioned: isAircon,
        type,
        branch,
        updated_by: employeeID,
      });

      setSnack({
        open: true,
        message: "Room successfully added",
        severity: "success",
      });

      setRoomName("");
      setBuildingName("");
      setFloor("");
      fetchRoomList();
    } catch (err) {
      console.error("Error adding room:", err);
      setSnack({
        open: true,
        message: err.response?.data?.message || "Failed to add room",
        severity: "error",
      });
    }
  };



  // 🔹 Add search state
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  // 🔹 Filtered rooms based on search
  const filteredRooms = roomList
    .filter((room) =>
      room.room_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.building_description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((room) =>
      selectedBranch ? room.branch === Number(selectedBranch) : true
    )
    .filter((room) =>
      selectedBuilding ? room.building_description === selectedBuilding : true
    )
    .filter((room) =>
      selectedRoom ? room.room_description === selectedRoom : true
    );

  // 🔹 Pagination State
  const [roomPage, setRoomPage] = useState(1);
  const roomsPerPage = 20;

  const totalRoomPages = Math.ceil(filteredRooms.length / roomsPerPage);

  const paginatedRooms = filteredRooms.slice(
    (roomPage - 1) * roomsPerPage,
    roomPage * roomsPerPage
  );

  const paginationButtonStyle = {
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
    }
  };

  const paginationSelectStyle = {
    fontSize: '12px',
    height: 36,
    color: 'white',
    border: '1px solid white',
    backgroundColor: 'transparent',
    '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '& svg': { color: 'white' }
  };


  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setBuildingName(room.building_description || "");
    setRoomName(room.room_description || "");
    setFloor(room.floor || "");
    setType(room.type || "");
    setBranch(room.branch || 1);
    setIsAircon(room.is_airconditioned || 0);
  };


  // 🔹 Update room
  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      await axios.put(
        `${API_BASE_URL}/update_room/${editingRoom.room_id}`,
        {
          room_description: roomName,
          building_description: buildingName,
          floor,
          is_airconditioned: isAircon,
          type,
          branch,
          updated_by: employeeID,
        }
      );

      setSnack({
        open: true,
        message: "Room updated successfully",
        severity: "success",
      });

      setEditingRoom(null);
      fetchRoomList();
    } catch (err) {
      console.error("Error updating room:", err);
      setSnack({
        open: true,
        message: err.response?.data?.message || "Failed to update",
        severity: "error",
      });
    }
  };



  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);


  // 🔹 Delete room (automatic, no confirm)
  const handleDeleteRoom = async (roomId) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete_room/${roomId}`);
      setSnack({
        open: true,
        message: "Room deleted successfully",
        severity: "success",
      });
      fetchRoomList();
    } catch (err) {
      console.error("Error deleting room:", err);
      setSnack({
        open: true,
        message: "Failed to delete room",
        severity: "error",
      });
    }
  };


  // 🔹 Close snackbar
  const handleCloseSnack = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [newType, setNewType] = useState("");




  const AIRCON_OPTIONS = [
    { value: 0, label: "No" },
    { value: 1, label: "Yes" },
  ];

  // 🔹 Loading / Unauthorized states
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: titleColor,
            fontSize: "36px",
          }}
        >
          ROOM REGISTRATION
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by Room or Building..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: 450,
            backgroundColor: "#fff",
            borderRadius: 1,
            mb: 2,
            mt: 1,
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
          <Card
            key={index}
            onClick={() => handleStepClick(index, tab.to)}
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


      {/* ✅ TABLE SECTION */}
      <Grid item xs={12} md={7}>
        <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
          <Table>
            <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
              <TableRow>
                <TableCell sx={{ color: 'white', textAlign: "Center" }}>Room Registered</TableCell>
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


          <Box
            sx={{
              border: `2px solid ${borderColor}`,
              borderRadius: 2,
              p: 3,
              mb: 3,
              display: "flex",
              gap: 3,
              flexWrap: "wrap",
              backgroundColor: "#fafafa"
            }}
          >

            {/* 🔹 BRANCH */}
            <Box sx={{ minWidth: 220, flex: 1 }}>

              <Typography
                sx={{
                  fontWeight: "bold",
                  mb: 1,
                  fontSize: 14
                }}
              >
                Branch
              </Typography>

              <Select
                fullWidth
                size="small"
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  fetchRoomList(e.target.value);
                  setRoomPage(1);
                }}
              >
                <MenuItem value="">
                  <em>All Branches</em>
                </MenuItem>

                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.branch}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* 🔹 BUILDING */}
            <Box sx={{ minWidth: 220, flex: 1 }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  mb: 1,
                  fontSize: 14
                }}
              >
                Building
              </Typography>

              <Select
                fullWidth
                size="small"
                value={selectedBuilding}
                onChange={(e) => {
                  setSelectedBuilding(e.target.value);
                  setRoomPage(1);
                }}
              >
                <MenuItem value="">
                  <em>All Buildings</em>
                </MenuItem>

                {[...new Set(roomList.map((r) => r.building_description))].map(
                  (bld, idx) => (
                    <MenuItem key={idx} value={bld}>
                      {bld}
                    </MenuItem>
                  )
                )}
              </Select>
            </Box>

            {/* 🔹 ROOM */}
            <Box sx={{ minWidth: 220, flex: 1 }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  mb: 1,
                  fontSize: 14
                }}
              >
                Room
              </Typography>

              <Select
                fullWidth
                size="small"
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setRoomPage(1);
                }}
              >
                <MenuItem value="">
                  <em>All Rooms</em>
                </MenuItem>

                {roomList.map((room) => (
                  <MenuItem key={room.room_id} value={room.room_description}>
                    {room.room_description}
                  </MenuItem>
                ))}
              </Select>
            </Box>

          </Box>
          <hr />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    colSpan={8}
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
                      flexWrap="wrap"
                      gap={1}
                    >
                      {/* LEFT SIDE */}
                      <Typography fontSize="14px" fontWeight="bold" color="white">
                        Total Registered Rooms: {filteredRooms.length}
                      </Typography>

                      {/* RIGHT SIDE */}
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">

                        <Button
                          onClick={() => setRoomPage(1)}
                          disabled={roomPage === 1}
                          variant="outlined"
                          size="small"
                          sx={paginationButtonStyle}
                        >
                          First
                        </Button>

                        <Button
                          onClick={() => setRoomPage(prev => Math.max(prev - 1, 1))}
                          disabled={roomPage === 1}
                          variant="outlined"
                          size="small"
                          sx={paginationButtonStyle}
                        >
                          Prev
                        </Button>

                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={roomPage}
                            onChange={(e) => setRoomPage(Number(e.target.value))}
                            sx={paginationSelectStyle}
                            MenuProps={{
                              PaperProps: { sx: { maxHeight: 200 } }
                            }}
                          >
                            {Array.from({ length: totalRoomPages }, (_, i) => (
                              <MenuItem key={i + 1} value={i + 1}>
                                Page {i + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Typography fontSize="11px" color="white">
                          of {totalRoomPages} page{totalRoomPages > 1 ? "s" : ""}
                        </Typography>

                        <Button
                          onClick={() => setRoomPage(prev => Math.min(prev + 1, totalRoomPages))}
                          disabled={roomPage === totalRoomPages}
                          variant="outlined"
                          size="small"
                          sx={paginationButtonStyle}
                        >
                          Next
                        </Button>

                        <Button
                          onClick={() => setRoomPage(totalRoomPages)}
                          disabled={roomPage === totalRoomPages}
                          variant="outlined"
                          size="small"
                          sx={paginationButtonStyle}
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
          <Box sx={{ maxHeight: 750, overflowY: "auto" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ border: `2px solid ${borderColor}`, backgroundColor: "#f5f5f5", color: "black" }}>Room ID</TableCell>
                  <TableCell sx={{ border: `2px solid ${borderColor}`, backgroundColor: "#f5f5f5", color: "black" }}>Building</TableCell>
                  <TableCell sx={{ border: `2px solid ${borderColor}`, backgroundColor: "#f5f5f5", color: "black" }}>Room Name</TableCell>

                  {/* ✅ NEW */}
                  <TableCell sx={{ border: `2px solid ${borderColor}`, backgroundColor: "#f5f5f5", color: "black" }}>Floor</TableCell>
                  <TableCell sx={{ border: `2px solid ${borderColor}`, backgroundColor: "#f5f5f5", color: "black" }}>Type</TableCell>
                  <TableCell sx={{ border: `2px solid ${borderColor}`, backgroundColor: "#f5f5f5", color: "black" }}>Branch</TableCell>
                  <TableCell sx={{ border: `2px solid ${borderColor}`, backgroundColor: "#f5f5f5", color: "black" }}>Aircon</TableCell>

                  <TableCell sx={{ border: `2px solid ${borderColor}`, backgroundColor: "#f5f5f5", color: "black" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRooms.map((room, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ border: `2px solid ${borderColor}` }}>{index + 1}</TableCell>

                    <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                      {room.building_description || "N/A"}
                    </TableCell>

                    <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                      {room.room_description}
                    </TableCell>

                    {/* ✅ NEW COLUMNS */}

                    <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                      {room.floor || "N/A"}
                    </TableCell>

                    <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                      {room.type || "N/A"}
                    </TableCell>

                    <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                      {branches.find(
                        (b) => b.id === Number(room.branch)
                      )?.branch || "N/A"}
                    </TableCell>

                    <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                      {AIRCON_OPTIONS.find((a) => a.value === Number(room.is_airconditioned))?.label || "N/A"}
                    </TableCell>

                    <TableCell
                      sx={{
                        border: `2px solid ${borderColor}`,
                        textAlign: "center",
                        width: "250px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px", // space between buttons
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          backgroundColor: "green",
                          color: "white",
                          borderRadius: "5px",
                          padding: "8px 14px",
                          width: "100px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                        }}
                        onClick={() => handleEditRoom(room)}
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
                          padding: "8px 14px",
                          width: "100px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                        }}
                        onClick={() => {
                          setRoomToDelete(room);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>

          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    colSpan={8}
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
                      flexWrap="wrap"
                      gap={1}
                    >
                      {/* LEFT SIDE */}
                      <Typography fontSize="14px" fontWeight="bold" color="white">
                        Total Registered Rooms: {filteredRooms.length}
                      </Typography>

                      {/* RIGHT SIDE */}
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">

                        <Button
                          onClick={() => setRoomPage(1)}
                          disabled={roomPage === 1}
                          variant="outlined"
                          size="small"
                          sx={paginationButtonStyle}
                        >
                          First
                        </Button>

                        <Button
                          onClick={() => setRoomPage(prev => Math.max(prev - 1, 1))}
                          disabled={roomPage === 1}
                          variant="outlined"
                          size="small"
                          sx={paginationButtonStyle}
                        >
                          Prev
                        </Button>

                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={roomPage}
                            onChange={(e) => setRoomPage(Number(e.target.value))}
                            sx={paginationSelectStyle}
                            MenuProps={{
                              PaperProps: { sx: { maxHeight: 200 } }
                            }}
                          >
                            {Array.from({ length: totalRoomPages }, (_, i) => (
                              <MenuItem key={i + 1} value={i + 1}>
                                Page {i + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Typography fontSize="11px" color="white">
                          of {totalRoomPages} page{totalRoomPages > 1 ? "s" : ""}
                        </Typography>

                        <Button
                          onClick={() => setRoomPage(prev => Math.min(prev + 1, totalRoomPages))}
                          disabled={roomPage === totalRoomPages}
                          variant="outlined"
                          size="small"
                          sx={paginationButtonStyle}
                        >
                          Next
                        </Button>

                        <Button
                          onClick={() => setRoomPage(totalRoomPages)}
                          disabled={roomPage === totalRoomPages}
                          variant="outlined"
                          size="small"
                          sx={paginationButtonStyle}
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
        </Paper>

      </Grid>

      <br />
      <br />


      <TableContainer component={Paper} sx={{ width: '50%', border: `2px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Room Registration Panel</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>


      {/* ✅ FORM SECTION */}
      <Grid item xs={12} md={5}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            border: `2px solid ${borderColor}`,
            width: "50%"
          }}
        >

          <Typography fontWeight={500}>Branch:</Typography>
          <TextField
            select
            fullWidth
            value={branch}
            onChange={(e) => setBranch(Number(e.target.value))}
            sx={{ mb: 2 }}
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.branch}
              </MenuItem>
            ))}
          </TextField>


          <Typography fontWeight={500}>Building Name:</Typography>
          <TextField
            fullWidth
            label="Building Name"
            variant="outlined"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography fontWeight={500}>Room Name:</Typography>
          <TextField
            fullWidth
            label="Room Name"
            variant="outlined"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography fontWeight={500}>Floor:</Typography>
          <TextField
            fullWidth
            label="Floor"
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography fontWeight={500}>Room Type:</Typography>

          <TextField
            select
            fullWidth
            value={type}
            onChange={(e) => setType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">
              <em>Select Room Type</em>
            </MenuItem>

            <MenuItem value="Lecture">
              Lecture
            </MenuItem>

            <MenuItem value="Laboratory">
              Laboratory
            </MenuItem>
          </TextField>



          <Typography fontWeight={500}>Airconditioned:</Typography>
          <TextField
            select
            fullWidth
            value={isAircon}
            onChange={(e) => setIsAircon(Number(e.target.value))}
            sx={{ mb: 2 }}
          >
            {AIRCON_OPTIONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              if (editingRoom) {
                setOpenUpdateDialog(true);
              } else {
                handleAddRoom();
              }
            }}

          >
            {editingRoom ? "Update Room" : "Save"}
          </Button>
        </Paper>


      </Grid>



      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)}>
        <DialogTitle>Add New Room Type</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Room Type Name"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenTypeDialog(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={() => {
              if (!newType.trim()) return;

              const updatedTypes = [...roomTypes, newType.trim()];
              setRoomTypes(updatedTypes);
              setType(newType.trim()); // auto select
              setNewType("");
              setOpenTypeDialog(false);
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete Room</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the room{" "}
            <b>{roomToDelete?.room_description}</b>{" "}
            from building{" "}
            <b>{roomToDelete?.building_description || "N/A"}</b>?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpenDeleteDialog(false);
              setRoomToDelete(null);
            }}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => {
              handleDeleteRoom(roomToDelete.room_id);
              setOpenDeleteDialog(false);
              setRoomToDelete(null);
            }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openUpdateDialog}
        onClose={() => setOpenUpdateDialog(false)}
      >
        <DialogTitle>Confirm Update Room</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to update the room{" "}
            <b>{editingRoom?.room_description}</b> in building{" "}
            <b>{editingRoom?.building_description || "N/A"}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              setOpenUpdateDialog(false); // close first
              await handleUpdateRoom();
            }}
          >
            Yes, Update
          </Button>
        </DialogActions>
      </Dialog>


      {/* ✅ Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleCloseSnack} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoomRegistration;

