import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Typography,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  TableBody

} from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Unauthorized from "../components/Unauthorized";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
const RequirementsForm = () => {
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


  const pageId = 51;

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



  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [xeroxCopies, setXeroxCopies] = useState(0);
  const [requiresOriginal, setRequiresOriginal] = useState(false);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Main"); // ✅ Default category
  const [requirements, setRequirements] = useState([]);
  const [shortLabel, setShortLabel] = useState("");
  const [documentStatus, setDocumentStatus] = useState("On Process");


  // ✅ Snackbar state
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleCloseSnack = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  // ✅ Fetch all requirements
  const fetchRequirements = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/requirements`);
      const normalized = res.data.map(r => ({
        ...r,
        requires_original: r.requires_original === 1,
        xerox_copies: r.xerox_copies || 0,
        is_optional: r.is_optional === 1 // ✅ ADD THIS
      }));
      setRequirements(normalized);
    } catch (err) {
      console.error("Error fetching requirements:", err);
      setSnack({
        open: true,
        message: "Failed to load requirements",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  // ✅ Handle submission of a new requirement
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setSnack({
        open: true,
        message: "Please enter a requirement description.",
        severity: "warning",
      });
      return;
    }

    try {
      if (isEditing) {
        // ✅ UPDATE
        await axios.put(`${API_BASE_URL}/requirements/${editId}`, {
          requirements_description: description,
          short_label: shortLabel,
          category: category,
          xerox_copies: xeroxCopies,
          is_optional: isOptional,
        });

        setSnack({
          open: true,
          message: "Requirement updated successfully!",
          severity: "success",
        });

      } else {
        // ✅ CREATE
        await axios.post(`${API_BASE_URL}/requirements`, {
          requirements_description: description,
          short_label: shortLabel,
          category: category,
          xerox_copies: xeroxCopies,
          requires_original: requiresOriginal,
          is_optional: isOptional,
        });

        setSnack({
          open: true,
          message: "Requirement saved successfully!",
          severity: "success",
        });
      }

      // RESET FORM
      setDescription("");
      setShortLabel("");
      setCategory("Main");
      setXeroxCopies(0);
      setRequiresOriginal(false);
      setIsOptional(false);
      setIsEditing(false);
      setEditId(null);


      fetchRequirements();

    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        message: "Error saving requirement.",
        severity: "error",
      });
    }
  };

  const [isOptional, setIsOptional] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/requirements/${id}`);
      fetchRequirements();
      setSnack({
        open: true,
        message: "Requirement deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error deleting requirement:", err);
      setSnack({
        open: true,
        message: "Error deleting requirement.",
        severity: "error",
      });
    }
  };


  // ✅ Group requirements by category
  const groupedRequirements = requirements.reduce((acc, req) => {
    const cat = req.category || "Main";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(req);
    return acc;
  }, {});



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
          MANAGE REQUIREMENTS
        </Typography>
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Existing Requirements</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} sx={{ border: `2px solid ${borderColor}` }}>
        <Table stickyHeader size="small">

          {/* HEADER */}
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>#</TableCell>
              <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>Description</TableCell>
              <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>Short Label</TableCell>
              <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>Category</TableCell>
              <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>Original Documents</TableCell>
              <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>Xerox Copies</TableCell>
              <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>Optional</TableCell>
              <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          {/* BODY */}
          <TableBody>
            {requirements.map((req, index) => (
              <TableRow key={req.id}>

                <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                  {index + 1}
                </TableCell>

                {/* DESCRIPTION */}
                <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                  {req.description}
                </TableCell>

                {/* SHORT LABEL */}
                <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                  {req.short_label || "N/A"}
                </TableCell>

                {/* CATEGORY */}
                <TableCell sx={{ border: `2px solid ${borderColor}` }}>
                  {req.category || "Main"}
                </TableCell>

                {/* ORIGINAL */}
                <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                  {req.requires_original ? "Yes" : "No"}
                </TableCell>

                {/* XEROX */}
                <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                  {req.xerox_copies > 0
                    ? `${req.xerox_copies} ${req.xerox_copies > 1 ? "copies" : "copy"}`
                    : "-"}
                </TableCell>
                <TableCell sx={{ border: `2px solid ${borderColor}`, textAlign: "center" }}>
                  {req.is_optional ? "Yes" : "No"}
                </TableCell>
                {/* ACTIONS */}
                <TableCell
                  sx={{
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center"
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ backgroundColor: "green" }}
                    onClick={() => {
                      // ✅ Populate FORM
                      setDescription(req.description);
                      setShortLabel(req.short_label || "");
                      setCategory(req.category || "Main");
                      setRequiresOriginal(req.requires_original);
                      setXeroxCopies(req.xerox_copies || 0);

                      // ✅ Enable edit mode
                      setIsEditing(true);
                      setEditId(req.id);
                      setIsOptional(req.is_optional);

                      // ✅ Scroll to form
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: "smooth"
                      });
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    sx={{ backgroundColor: "#9E0000" }}
                    onClick={() => {
                      setRequirementToDelete(req);
                      setOpenDeleteDialog(true);
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <br />
      <br />

      <TableContainer component={Paper} sx={{ width: '50%', border: `2px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Create Requirements</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <div
        style={{ border: `2px solid ${borderColor}`, width: "50%" }}
        className=" bg-gray-50 p-6 shadow-sm"
      >


        <form onSubmit={handleSubmit} className="space-y-4">
          <Typography fontWeight={500}>Requirements Description:</Typography>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter requirement description"
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Typography fontWeight={500}>Short Label:</Typography>
          <input
            type="text"
            value={shortLabel}
            onChange={(e) => setShortLabel(e.target.value)}
            placeholder="Enter short label (e.g., F138)"
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Typography fontWeight={500}>Category:</Typography>
          {/* ✅ Category Selector */}
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="Main">Main Requirements</MenuItem>
              <MenuItem value="Medical">Medical Requirements</MenuItem>
              <MenuItem value="Others">Other Requirements</MenuItem>
            </Select>
          </FormControl>

          <Typography fontWeight={500}>Requires Original:</Typography>
          <FormControl fullWidth>
            <InputLabel>Requires Original</InputLabel>
            <Select
              value={requiresOriginal ? "Yes" : "No"}
              label="Requires Original"
              onChange={(e) => setRequiresOriginal(e.target.value === "Yes")}
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>

          <Typography fontWeight={500}>Xerox Copies:</Typography>
          <input
            type="number"
            value={xeroxCopies}
            onChange={(e) => setXeroxCopies(Number(e.target.value))}
            className="p-2 border rounded"
          />

          <Typography fontWeight={500}>Optional Requirement:</Typography>
          <FormControl fullWidth>
            <InputLabel>Optional</InputLabel>
            <Select
              value={isOptional ? "Yes" : "No"}
              label="Optional"
              onChange={(e) => setIsOptional(e.target.value === "Yes")}
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>

          <button
            type="submit"
            className="w-full py-3 text-white rounded-lg shadow-md transition duration-300"
            style={{ backgroundColor: isEditing ? "#2e7d32" : "#1976d2" }}
          >
            {isEditing ? "Update Requirement" : "Save Requirement"}
          </button>
        </form>
      </div>

      {/* Right Side - Display Saved Requirements */}



      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete Requirement</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the requirement{" "}
            <b>{requirementToDelete?.description}</b>?
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
              handleDelete(requirementToDelete.id);
              setOpenDeleteDialog(false);
              setRequirementToDelete(null);
            }}
          >
            Yes, Delete
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
        <Alert
          onClose={handleCloseSnack}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RequirementsForm;
