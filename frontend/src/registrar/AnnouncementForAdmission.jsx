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
    IconButton,
    FormControl,
    Select,
    InputLabel
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import SchoolIcon from "@mui/icons-material/School";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PeopleIcon from "@mui/icons-material/People";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SearchIcon from "@mui/icons-material/Search";
import KeyIcon from "@mui/icons-material/Key";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useNavigate, useLocation } from "react-router-dom";

const AnnouncementPanel = () => {
    const settings = useContext(SettingsContext);

    const [titleColor, setTitleColor] = useState("#000");
    const [subtitleColor, setSubtitleColor] = useState("#555");
    const [borderColor, setBorderColor] = useState("#000");
    const [mainButtonColor, setMainButtonColor] = useState("#1976d2");

    const [announcements, setAnnouncements] = useState([]);
    const [form, setForm] = useState({
        title: "",
        content: "",
        valid_days: "permanent",
        target_role: "applicant"
    });
    const [editingId, setEditingId] = useState(null);
    const [image, setImage] = useState(null);
    const [userRole, setUserRole] = useState("");
    const [employeeID, setEmployeeID] = useState("");
    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);

    const pageId = 98;

    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Fetch settings colors
    useEffect(() => {
        if (!settings) return;
        if (settings.title_color) setTitleColor(settings.title_color);
        if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
        if (settings.border_color) setBorderColor(settings.border_color);
        if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    }, [settings]);

    // Check access
    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        const storedEmployeeID = localStorage.getItem("employee_id");
        if (storedRole === "registrar") {
            setUserRole(storedRole);
            setEmployeeID(storedEmployeeID);
            checkAccess(storedEmployeeID);
        } else {
            window.location.href = "/login";
        }
    }, []);


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
    const [activeStep, setActiveStep] = useState(3);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


    const handleStepClick = (index, to) => {
        setActiveStep(index);
        navigate(to); // this will actually change the page
    };


    const checkAccess = async (employeeID) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`);
            setHasAccess(res.data?.page_privilege === 1);
        } catch (err) {
            setHasAccess(false);
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/announcements`);
            const data = res.data.data.filter(a => a.target_role === "applicant" || a.target_role === "all");

            setAnnouncements(data);
            setAnnouncementPage(1);
        } catch (err) {
            console.error(err);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("content", form.content);
            formData.append("valid_days", form.valid_days);
            formData.append("target_role", form.target_role);
            formData.append("creator_role", userRole);
            formData.append("creator_id", employeeID);

            if (image) formData.append("image", image);

            if (editingId) {
                await axios.put(`${API_BASE_URL}/api/announcements/${editingId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setSnackbar({ open: true, message: "Announcement updated!", severity: "success" });
            } else {
                await axios.post(`${API_BASE_URL}/api/announcements`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setSnackbar({ open: true, message: "Announcement created!", severity: "success" });
            }

            setForm({
                title: "",
                content: "",
                valid_days: "permanent",
                target_role: "applicant"
            });

            setEditingId(null);
            setImage(null);
            fetchAnnouncements();
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Error saving announcement!", severity: "error" });
        }
    }
    
    const handleEdit = (announcement) => {
        setForm({
            title: announcement.title,
            content: announcement.content,
            valid_days:
                announcement.valid_days === null || announcement.valid_days === 0
                    ? "permanent"
                    : announcement.valid_days.toString(),
            target_role: announcement.target_role,
        });
        setEditingId(announcement.id);
        setImage(null);
    };

    const [announcementPage, setAnnouncementPage] = useState(1);
    const announcementsPerPage = 20; // change if you want

    const totalAnnouncementPages = Math.ceil(
        announcements.length / announcementsPerPage
    );

    const paginatedAnnouncements = announcements.slice(
        (announcementPage - 1) * announcementsPerPage,
        announcementPage * announcementsPerPage
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



    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    const handleDelete = async (id) => {
        setSnackbar({
            open: true,
            message: "⏳ Deleting announcement...",
            severity: "info",
        });

        try {
            await axios.delete(`${API_BASE_URL}/api/announcements/${id}`);

            setSnackbar({
                open: true,
                message: "🗑️ Announcement deleted successfully!",
                severity: "success",
            });

            fetchAnnouncements();
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "❌ Failed to delete announcement.",
                severity: "error",
            });
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
    };

    if (loading || hasAccess === null) return <LoadingOverlay open={loading} message="Loading..." />;
    if (!hasAccess) return <Unauthorized />;

    return (
        <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>  {/* Header */}
            <Typography
                variant="h4"
                sx={{
                    fontWeight: "bold",
                    color: titleColor,
                    fontSize: "36px",
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                ANNOUNCEMENT
            </Typography>

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
            <TableContainer
                component={Paper}
                sx={{ width: "100%", border: `2px solid ${borderColor}` }}
            >
                <Table size="small">
                    <TableHead
                        sx={{
                            backgroundColor: settings?.header_color || "#1976d2",
                        }}
                    >
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                sx={{
                                    border: `2px solid ${borderColor}`,
                                    py: 0.5,
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
                                        Total Announcements: {announcements.length}
                                    </Typography>

                                    {/* RIGHT SIDE */}
                                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">

                                        <Button
                                            onClick={() => setAnnouncementPage(1)}
                                            disabled={announcementPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            First
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                setAnnouncementPage((prev) => Math.max(prev - 1, 1))
                                            }
                                            disabled={announcementPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            Prev
                                        </Button>

                                        <FormControl size="small" sx={{ minWidth: 80 }}>
                                            <Select
                                                value={announcementPage}
                                                onChange={(e) =>
                                                    setAnnouncementPage(Number(e.target.value))
                                                }
                                                sx={paginationSelectStyle}
                                                MenuProps={{
                                                    PaperProps: { sx: { maxHeight: 200 } }
                                                }}
                                            >
                                                {Array.from(
                                                    { length: totalAnnouncementPages },
                                                    (_, i) => (
                                                        <MenuItem key={i + 1} value={i + 1}>
                                                            Page {i + 1}
                                                        </MenuItem>
                                                    )
                                                )}
                                            </Select>
                                        </FormControl>

                                        <Typography fontSize="11px" color="white">
                                            of {totalAnnouncementPages} page
                                            {totalAnnouncementPages > 1 ? "s" : ""}
                                        </Typography>

                                        <Button
                                            onClick={() =>
                                                setAnnouncementPage((prev) =>
                                                    Math.min(prev + 1, totalAnnouncementPages)
                                                )
                                            }
                                            disabled={announcementPage === totalAnnouncementPages}
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            Next
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                setAnnouncementPage(totalAnnouncementPages)
                                            }
                                            disabled={announcementPage === totalAnnouncementPages}
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
            <Grid item xs={12} md={8}>



                {announcements.length === 0 ? (
                    <Box
                        sx={{
                            height: "90%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Typography color="text.secondary" textAlign="center">
                            No active announcements.
                        </Typography>
                    </Box>
                ) : (
                    <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        border: `2px solid ${borderColor}`,
                                        padding: "12px",
                                        backgroundColor: "#f5f5f5",
                                        color: "black",
                                        textAlign: "center",
                                    }}
                                >
                                    Title
                                </th>
                                <th
                                    style={{
                                        border: `2px solid ${borderColor}`,
                                        padding: "12px",
                                        backgroundColor: "#f5f5f5",
                                        color: "black",
                                        textAlign: "center",
                                    }}
                                >
                                    Content
                                </th>
                                <th
                                    style={{
                                        border: `2px solid ${borderColor}`,
                                        padding: "12px",
                                        backgroundColor: "#f5f5f5",
                                        color: "black",
                                        textAlign: "center",
                                    }}
                                >
                                    Image
                                </th>
                                <th
                                    style={{
                                        border: `2px solid ${borderColor}`,
                                        padding: "12px",
                                        backgroundColor: "#f5f5f5",
                                        color: "black",
                                        textAlign: "center",
                                    }}
                                >
                                    Valid Days
                                </th>
                                <th
                                    style={{
                                        border: `2px solid ${borderColor}`,
                                        padding: "12px",
                                        backgroundColor: "#f5f5f5",
                                        color: "black",
                                        textAlign: "center",
                                    }}
                                >
                                    Target Role
                                </th>
                                <th
                                    style={{
                                        border: `2px solid ${borderColor}`,
                                        padding: "12px",
                                        backgroundColor: "#f5f5f5",
                                        color: "black",
                                        textAlign: "center",
                                    }}
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAnnouncements.map((a) => (
                                <tr key={a.id} style={{ height: "75px" }}>
                                    <td style={{ border: `2px solid ${borderColor}`, padding: "8px", textAlign: "center", width: "200px" }}>
                                        {a.title}
                                    </td>
                                    <td style={{ border: `2px solid ${borderColor}`, padding: "8px", textAlign: "center", width: "200px" }}>
                                        {a.content}
                                    </td>

                                    {/* Image Cell */}
                                    <td
                                        style={{
                                            border: `2px solid ${borderColor}`,
                                            padding: "8px",
                                            width: "200px",
                                            height: "150px",
                                            textAlign: "center",
                                            verticalAlign: "middle",
                                        }}
                                    >
                                        {a.file_path ? (
                                            <img
                                                src={`${API_BASE_URL}/uploads/announcement/${a.file_path}`}
                                                alt={a.title}
                                                style={{
                                                    width: "200px",
                                                    height: "150px",
                                                    objectFit: "cover",
                                                    borderRadius: "4px",
                                                }}
                                            />
                                        ) : (
                                            "No Image"
                                        )}
                                    </td>

                                    <td style={{ border: `2px solid ${borderColor}`, padding: "8px", textAlign: "center" }}>
                                        {a.valid_days === null || a.valid_days === 0 || a.valid_days === "permanent"
                                            ? "Permanent"
                                            : `${a.valid_days} Day(s)`
                                        }
                                    </td>
                                    <td style={{ border: `2px solid ${borderColor}`, padding: "8px", textAlign: "center" }}>
                                        {a.target_role}
                                    </td>

                                    {/* Actions Cell */}
                                    <td
                                        style={{
                                            border: `2px solid ${borderColor}`,
                                            padding: "8px",
                                            textAlign: "center",
                                            width: "150px",
                                        }}
                                    >
                                        <Box sx={{ display: "flex", justifyContent: "center", gap: "8px" }}>
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

                                                onClick={() => handleEdit(a)}
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
                                                    setAnnouncementToDelete(a);
                                                    setOpenDeleteDialog(true);
                                                }}
                                            >

                                                <DeleteIcon fontSize="small" /> Delete
                                            </Button>
                                        </Box>
                                    </td>
                                </tr>
                            ))}
                        </tbody>


                    </Box>
                )}

            </Grid>
            <TableContainer
                component={Paper}
                sx={{ width: "100%", border: `2px solid ${borderColor}` }}
            >
                <Table size="small">
                    <TableHead
                        sx={{
                            backgroundColor: settings?.header_color || "#1976d2",
                        }}
                    >
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                sx={{
                                    border: `2px solid ${borderColor}`,
                                    py: 0.5,
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
                                        Total Announcements: {announcements.length}
                                    </Typography>

                                    {/* RIGHT SIDE */}
                                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">

                                        <Button
                                            onClick={() => setAnnouncementPage(1)}
                                            disabled={announcementPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            First
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                setAnnouncementPage((prev) => Math.max(prev - 1, 1))
                                            }
                                            disabled={announcementPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            Prev
                                        </Button>

                                        <FormControl size="small" sx={{ minWidth: 80 }}>
                                            <Select
                                                value={announcementPage}
                                                onChange={(e) =>
                                                    setAnnouncementPage(Number(e.target.value))
                                                }
                                                sx={paginationSelectStyle}
                                                MenuProps={{
                                                    PaperProps: { sx: { maxHeight: 200 } }
                                                }}
                                            >
                                                {Array.from(
                                                    { length: totalAnnouncementPages },
                                                    (_, i) => (
                                                        <MenuItem key={i + 1} value={i + 1}>
                                                            Page {i + 1}
                                                        </MenuItem>
                                                    )
                                                )}
                                            </Select>
                                        </FormControl>

                                        <Typography fontSize="11px" color="white">
                                            of {totalAnnouncementPages} page
                                            {totalAnnouncementPages > 1 ? "s" : ""}
                                        </Typography>

                                        <Button
                                            onClick={() =>
                                                setAnnouncementPage((prev) =>
                                                    Math.min(prev + 1, totalAnnouncementPages)
                                                )
                                            }
                                            disabled={announcementPage === totalAnnouncementPages}
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            Next
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                setAnnouncementPage(totalAnnouncementPages)
                                            }
                                            disabled={announcementPage === totalAnnouncementPages}
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

            <br />
            <br />

            <TableContainer component={Paper} sx={{ width: '50%', border: `2px solid ${borderColor}`, }}>
                <Table>
                    <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Create Announcement</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>
            <Grid item xs={12} md={4}>
                <Paper
                    sx={{
                        p: 3,
                        border: `2px solid ${borderColor}`,
                        width: "50%",
                        boxShadow: 2,
                    }}
                >
                    <Typography variant="h6" mb={2} color={subtitleColor}>
                        {editingId ? "Edit Announcement" : "Create Announcement"}
                    </Typography>
                    <Typography fontWeight={500}>Title:</Typography>
                    <TextField
                        label="Title"
                        fullWidth
                        margin="normal"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                    />
                    <Typography fontWeight={500}>Content:</Typography>
                    <TextField
                        label="Content"
                        fullWidth
                        multiline
                        rows={3}
                        margin="normal"
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        required
                    />
                    <Typography fontWeight={500}>Valid For:</Typography>
                    <FormControl fullWidth margin="normal">

                        <InputLabel>Valid For</InputLabel>
                        <Select
                            value={form.valid_days}
                            label="Valid For"
                            onChange={(e) => setForm({ ...form, valid_days: e.target.value })}
                        >
                            <MenuItem value="permanent">Permanent</MenuItem>

                            {["1", "3", "7", "14", "30", "60", "90", "120", "180"].map((d) => (
                                <MenuItem key={d} value={d}>{d} Day(s)</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography fontWeight={500}>Target Role:</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Target Role</InputLabel>
                        <Select
                            value={form.target_role}
                            label="Target Role"
                            onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                            required
                        >

                            <MenuItem value="applicant">Applicant</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        sx={{ mt: 2, bgcolor: mainButtonColor }}
                    >
                        {image ? "Change Image" : "Upload Image"}
                        <input type="file" hidden accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                    </Button>

                    {image && (
                        <Box
                            sx={{
                                mt: 2,
                                p: 1,
                                border: `1px solid ${borderColor}`,
                                borderRadius: 2,
                                bgcolor: "#f5f5f5",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            {/* Thumbnail Preview */}
                            <Box
                                component="img"
                                src={URL.createObjectURL(image)}
                                alt="Uploaded Preview"
                                sx={{ width: 50, height: 50, objectFit: "cover", borderRadius: 1 }}
                            />

                            {/* File Name */}
                            <Typography noWrap sx={{ flexGrow: 1 }}>
                                {image.name}
                            </Typography>

                            {/* Remove Button */}
                            <IconButton
                                onClick={handleRemoveImage}
                                sx={{
                                    width: "24px",
                                    height: "24px",
                                    backgroundColor: "rgba(255,255,255,0.8)",
                                    "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                                }}
                            >
                                ✕
                            </IconButton>
                        </Box>
                    )}


                    <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }} onClick={handleSubmit}>
                        {editingId ? "Update Announcement" : "Create Announcement"}
                    </Button>
                </Paper>
            </Grid>


            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
            >
                <DialogTitle>Confirm Delete Announcement</DialogTitle>

                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the announcement titled{" "}
                        <b>{announcementToDelete?.title}</b>?
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
                            handleDelete(announcementToDelete.id);
                            setOpenDeleteDialog(false);
                            setAnnouncementToDelete(null);
                        }}
                    >
                        Yes, Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AnnouncementPanel;
