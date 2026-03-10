import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
    Box,
    TextField,
    Button,
    Typography,
    Avatar,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    Paper,
    TableHead,
    TableRow,
    Alert,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";


const RegisterRegistrar = () => {

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


    // Also put it at the very top
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");

    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);


    const pageId = 71;

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

    const [department, setDepartment] = useState([]);
    const [accessLevels, setAccessLevels] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [registrars, setRegistrars] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editData, setEditData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [form, setForm] = useState({
        employee_id: "",
        last_name: "",
        middle_name: "",
        first_name: "",
        email: "",
        password: "",
        status: "",
        dprtmnt_id: "",
        access_level: "",
        profile_picture: null, // ✅ holds the uploaded file
        preview: "", // ✅ for preview URL

    });
    const [itemsPerPage, setItemsPerPage] = useState(50);


    const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const filteredRegistrar = registrars
        .filter((r) =>
            selectedDepartmentFilter
                ? r.dprtmnt_name === selectedDepartmentFilter
                : true
        )
        .sort((a, b) => {
            if (sortOrder === "asc") return a.last_name.localeCompare(b.last_name);
            if (sortOrder === "desc") return b.last_name.localeCompare(a.last_name);
            return 0;
        });

    const totalPages = Math.ceil(filteredRegistrar.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRegistrar = filteredRegistrar.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [filteredRegistrar.length, totalPages]);

    const maxButtonsToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    if (endPage - startPage < maxButtonsToShow - 1) {
        startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }

    const visiblePages = [];
    for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
    }

    useEffect(() => {
        fetchDepartments();
        fetchRegistrars();
        fetchAccessLevels();
    }, []);

    // 📥 Fetch Departments
    const fetchDepartments = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/get_department`);
            setDepartment(res.data);
        } catch (err) {
            console.error("❌ Department fetch error:", err);
            setErrorMessage("Failed to load department list");
        }
    };

    const fetchRegistrars = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/registrars`);
            setRegistrars(res.data);
        } catch (err) {
            console.error("❌ Registrar fetch error:", err);
            setErrorMessage("Failed to load registrar accounts");
        }
    };

    const fetchAccessLevels = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/access_table`);
            setAccessLevels(res.data || []);
        } catch (err) {
            console.error("❌ Access level fetch error:", err);
            setErrorMessage("Failed to load access levels");
        }
    };

    // Handle form field changes
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const fd = new FormData();

            // append all fields
            Object.entries(form).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    fd.append(key, value);
                }
            });

            // Ensure numbers
            if (form.dprtmnt_id) fd.set("dprtmnt_id", Number(form.dprtmnt_id));
            if (form.status) fd.set("status", Number(form.status));
            if (form.access_level) fd.set("access_level", Number(form.access_level));

            // Debug
            for (let pair of fd.entries()) console.log(pair[0], pair[1]);

            if (editData) {
                // EDIT registrar
                await axios.put(`${API_BASE_URL}/admin/update_registrar/${editData.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                // ✅ SUCCESS SNACKBAR
                setSnackbarMessage("Registrar updated successfully.");
                setSnackbarSeverity("success");

            } else {
                // ADD registrar
                await axios.post(`${API_BASE_URL}/admin/register_registrar`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                // ✅ SUCCESS SNACKBAR
                setSnackbarMessage("Registrar added successfully.");
                setSnackbarSeverity("success");
            }

            setOpenSnackbar(true);
            setOpenDialog(false);
            setEditData(null);
            fetchRegistrars();

        } catch (err) {
            console.error("❌ Submit error:", err);

            const backendMessage = err.response?.data?.message;

            // ERROR MESSAGES
            if (backendMessage === "Email already exists") {
                setSnackbarMessage("Email already exists. Please use a different email.");
            } else if (backendMessage === "All required fields must be filled") {
                setSnackbarMessage("Please complete all required fields before submitting.");
            } else {
                setSnackbarMessage(backendMessage || "Something went wrong. Please try again.");
            }

            // ✅ ERROR SNACKBAR
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        }
    };

    const handleEdit = (r) => {
        setEditData(r);
        setForm({
            employee_id: r.employee_id || "",
            first_name: r.first_name || "",
            middle_name: r.middle_name || "",
            last_name: r.last_name || "",
            email: r.email || "",
            password: "",
            status: Number(r.status), // ✅ ensure numeric
            dprtmnt_id: r.dprtmnt_id || "",
            access_level: r.access_level || "",
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditData(null);
    };

    // Export CSV
    const handleExportCSV = () => {
        if (registrars.length === 0) return alert("No data to export!");

        const headers = ["Employee ID", "Full Name", "Email", "Department", "Status"];
        const rows = registrars.map((r) => [
            r.employee_id,
            `${r.first_name} ${r.middle_name || ""} ${r.last_name}`,
            r.email,
            r.dprtmnt_name || "N/A",
            r.status === 1 ? "Active" : "Inactive",
        ]);
        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "registrars.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            await axios.put(`${API_BASE_URL}/update_registrar_status/${id}`, { status: newStatus });

            fetchRegistrars(); // 🔄 refresh list
        } catch (error) {
            console.error("❌ Error toggling status:", error);
            setErrorMessage("Failed to update status");
        }
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} >
                {/* Left: Header */}
                <Typography variant="h4" fontWeight="bold" sx={{ color: titleColor }}>
                    REGISTRAR ACCOUNTS
                </Typography>

                {/* Right: Search */}

            </Box>

            <hr style={{ border: "1px solid #ccc", width: "100%" }} />


            <br />

            <TableContainer component={Paper} sx={{ width: '100%' }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                        <TableRow>
                            <TableCell
                                colSpan={10}
                                sx={{
                                    border: `2px solid ${borderColor}`,
                                    py: 0.5,
                                    backgroundColor: settings?.header_color || "#1976d2",
                                    color: "white"
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    {/* Left: Registrar List Count */}
                                    <Typography fontSize="14px" fontWeight="bold" color="white">
                                        Registrar's List:
                                    </Typography>

                                    {/* Right: Pagination Controls */}
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
                                                        color: 'white',
                                                    }
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            maxHeight: 200,
                                                            backgroundColor: '#fff',
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
            {/* 🔧 Control Bar Section */}
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
                                    {/* ➕ Left: Add Registrar Button */}
                                    <Button
                                        startIcon={<AddIcon />}
                                        variant="contained"
                                        onClick={() => {
                                            setForm({
                                                employee_id: "",
                                                last_name: "",
                                                middle_name: "",
                                                first_name: "",
                                                email: "",
                                                password: "",
                                                status: "",
                                                dprtmnt_id: "",
                                                access_level: "",
                                            });
                                            setOpenDialog(true);
                                        }}
                                        sx={{
                                            backgroundColor: "default",
                                            color: "white",
                                            textTransform: "none",
                                            fontWeight: "bold",
                                            width: "350px",
                                            "&:hover": { backgroundColor: "#000" },
                                        }}
                                    >
                                        Add Registrar
                                    </Button>

                                    {/* ⚙️ Right: Filter, Sort, Export */}
                                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                        {/* Department Filter */}
                                        <FormControl sx={{ width: "350px" }} size="small">
                                            <InputLabel id="filter-department-label">
                                                Filter by Department
                                            </InputLabel>
                                            <Select
                                                labelId="filter-department-label"
                                                value={selectedDepartmentFilter}
                                                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                                                label="Filter by Department"
                                            >
                                                <MenuItem value="">All Departments</MenuItem>
                                                {department.map((dep) => (
                                                    <MenuItem
                                                        key={dep.dprtmnt_id}
                                                        value={dep.dprtmnt_name}
                                                    >
                                                        {dep.dprtmnt_name} ({dep.dprtmnt_code})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Sort Order */}
                                        <FormControl size="small" sx={{ width: "200px" }}>
                                            <Select
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="">Select Order</MenuItem>
                                                <MenuItem value="asc">Ascending</MenuItem>
                                                <MenuItem value="desc">Descending</MenuItem>
                                            </Select>
                                        </FormControl>

                                        {/* Export CSV */}
                                        <Button
                                            variant="outlined"
                                            startIcon={<FileDownloadIcon />}
                                            onClick={handleExportCSV}
                                            sx={{
                                                borderColor: "#800000",
                                                color: "#800000",
                                                textTransform: "none",
                                                fontWeight: "bold",
                                                "&:hover": { borderColor: "#a52a2a", color: "#a52a2a" },
                                            }}
                                        >
                                            Export CSV
                                        </Button>
                                    </Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: "100%", border: `2px solid ${borderColor}`, mb: 4 }}>
                <Table>
                    <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
                        <TableRow>
                            {[
                                "EMPLOYEE ID",
                                "Image",
                                "Full Name",
                                "Email",
                                "Department",
                                "Access Level",
                                "Actions",
                                "Status",


                            ].map((header, idx) => (
                                <TableCell
                                    key={idx}
                                    sx={{
                                        color: "white",
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        border: `2px solid ${borderColor}`
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {registrars.length > 0 ? (
                            registrars.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>{r.employee_id}</TableCell>

                                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                        {r.profile_picture ? (
                                            <Avatar
                                                src={`${API_BASE_URL}/uploads/Admin1by1/${r.profile_picture}`}
                                                alt={r.first_name}
                                                sx={{ width: 60, height: 60, margin: "auto", border: `2px solid ${borderColor}` }}
                                            />
                                        ) : (
                                            <Avatar sx={{ bgcolor: "#6D2323", margin: "auto" }}>
                                                {r.first_name?.[0] || "?"}
                                            </Avatar>
                                        )}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                        {`${r.first_name || ""} ${r.middle_name || ""} ${r.last_name || ""}`}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>{r.email}</TableCell>

                                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                        {r.dprtmnt_name || "N/A"}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: "center", border: `2px solid ${borderColor}` }}>
                                        {r.access_description || "N/A"}
                                    </TableCell>



                                    {/* ✅ EDIT BUTTON */}
                                    <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center", borderRight: "2px solid maroon" }}>
                                        <Button
                                            onClick={() => handleEdit(r)}
                                            sx={{
                                                backgroundColor: "green",
                                                color: "white",
                                                textTransform: "none",
                                                fontWeight: "bold",

                                            }}
                                            variant="contained"
                                        >
                                            EDIT
                                        </Button>
                                    </TableCell>

                                    {/* ✅ STATUS TOGGLE BUTTON */}
                                    <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                                        <Button
                                            onClick={() => handleToggleStatus(r.id, r.status)}
                                            sx={{
                                                backgroundColor: r.status === 1 ? "green" : "maroon",
                                                color: "white",
                                                textTransform: "none",
                                                fontWeight: "bold",
                                                "&:hover": {
                                                    backgroundColor: r.status === 1 ? "#4CAF50" : "#a52a2a",
                                                },
                                            }}
                                            variant="contained"
                                        >
                                            {r.status === 1 ? "Active" : "Inactive"}
                                        </Button>
                                    </TableCell>




                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No registrar accounts found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>


            {/* ➕ / ✏️ Registrar Modal */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle sx={{ color: "maroon", fontWeight: "bold" }}>
                    {editData ? "Edit Registrar" : "Add New Registrar"}
                </DialogTitle>
                <hr style={{ border: "1px solid #ccc", width: "100%" }} />

                <DialogContent sx={{ mt: 2 }}>
                    <Stack spacing={2}>
                        {/* 🔹 Profile Picture Upload */}
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-start">
                            <Avatar
                                src={
                                    form.preview ||
                                    (editData?.profile_picture
                                        ? `${API_BASE_URL}/uploads/Admin1by1/${editData.profile_picture}`
                                        : "")
                                }
                                alt={form.first_name || "Profile"}
                                sx={{
                                    width: 80,
                                    height: 80,
                                    border: `2px solid ${borderColor}`,
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                            />
                            <Button
                                variant="outlined"
                                component="label"
                                sx={{
                                    borderColor: "#6D2323",
                                    color: "#6D2323",
                                    textTransform: "none",
                                    fontWeight: "bold",
                                    "&:hover": { borderColor: "#800000", color: "#800000" },
                                }}
                            >
                                Upload Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setForm({
                                                ...form,
                                                profile_picture: file,
                                                preview: URL.createObjectURL(file),
                                            });
                                        }
                                    }}
                                />
                            </Button>
                        </Stack>

                        {/* 🔹 Registrar Information */}
                        <TextField
                            label="Employee ID"
                            name="employee_id"
                            value={form.employee_id}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Last Name"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Middle Name"
                            name="middle_name"
                            value={form.middle_name}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="First Name"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            type="email"
                            fullWidth
                        />
                        <TextField
                            label={editData ? "New Password (optional)" : "Password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            type="password"
                            fullWidth
                        />

                        {/* 🔹 Department Dropdown */}
                        <FormControl fullWidth>
                            <InputLabel id="department-label">Department</InputLabel>
                            <Select
                                labelId="department-label"
                                name="dprtmnt_id"
                                value={form.dprtmnt_id}
                                label="Department"
                                onChange={handleChange}
                            >
                                <MenuItem value="">Select Department</MenuItem>
                                {department.map((dep) => (
                                    <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_id}>
                                        {dep.dprtmnt_name} ({dep.dprtmnt_code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel id="access-level-select-label">Access Level</InputLabel>
                            <Select
                                labelId="access-level-select-label"
                                value={form.access_level}
                                label="Access Level"
                                onChange={(e) => setForm({ ...form, access_level: e.target.value })}
                            >
                                <MenuItem value="">Select Access Level</MenuItem>
                                {accessLevels.map((access) => (
                                    <MenuItem key={access.access_id} value={access.access_id}>
                                        {access.access_description}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* 🔹 Status Dropdown (Active/Inactive) */}
                        {editData && (
                            <FormControl fullWidth>
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    labelId="status-label"
                                    name="status"
                                    value={form.status}
                                    label="Status"
                                    onChange={handleChange}
                                >
                                    <MenuItem value={1}>Active</MenuItem>
                                    <MenuItem value={0}>Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{
                            backgroundColor: mainButtonColor,
                            "&:hover": { backgroundColor: "#000000" },
                            fontWeight: "bold",
                        }}
                    >
                        {editData ? "Save Changes" : "Register"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={snackbarSeverity} sx={{ width: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </Box>
    );
}

export default RegisterRegistrar;
