import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  FormControl,
  Select,
  Card,
  TableCell,
  TextField,
  MenuItem,
  InputLabel,
  Checkbox,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Snackbar,
  Alert,
  DialogActions,
  Switch,
} from "@mui/material";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import SearchIcon from "@mui/icons-material/Search";

const UserPageAccess = () => {
  const settings = useContext(SettingsContext);

  // UI Colors
  const [titleColor, setTitleColor] = useState("#000000");
  const [borderColor, setBorderColor] = useState("#000000");

  // Access control
  const pageId = 91;
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // User list
  const [allUsers, setAllUsers] = useState([]);

  // Selected user access data
  const [selectedUser, setSelectedUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [pageAccess, setPageAccess] = useState({});
  const [userRole, setUserRole] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [accessDescription, setAccessDescription] = useState("");
  const [createPageAccess, setCreatePageAccess] = useState({});
  const [createPages, setCreatePages] = useState([]);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  // Load settings
  useEffect(() => {
    if (!settings) return;
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.border_color) setBorderColor(settings.border_color);
  }, [settings]);

  // Check page privilege
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedEmployeeID = localStorage.getItem("employee_id");

    if (storedRole !== "registrar") {
      window.location.href = "/login";
      return;
    }

    checkAccess(storedEmployeeID);
    loadAllUsers();
  }, []);

  const checkAccess = async (empID) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/page_access/${empID}/${pageId}`,
      );
      setHasAccess(res.data && res.data.page_privilege === 1);
    } catch {
      setHasAccess(false);
    }
  };

  // Load all users
  const loadAllUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/registrars`);
      setAllUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  // Load selected user's access
  const loadUserAccess = async (user) => {
    setLoading(true);
    setSelectedUser(null);
    setPageAccess({});
    setPages([]);
    setUserRole("");

    try {
      const pagesResp = await axios.get(`${API_BASE_URL}/api/pages`);
      const accessResp = await axios.get(
        `${API_BASE_URL}/api/page_access/${user.employee_id}`,
      );

      const allPages = pagesResp.data || [];
      const accessRows = accessResp.data || [];

      const accessList = accessRows.map((r) => Number(r.page_id));

      const accessMap = {};
      allPages.forEach((p) => {
        accessMap[p.id] = accessList.includes(p.id);
      });

      setPages(allPages);
      setSelectedUser(user); // ✅ full user object
      setPageAccess(accessMap);

      setOpenModal(true);
    } catch {
      setSnack({ open: true, type: "error", message: "Failed to load access" });
    } finally {
      setLoading(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // change if you want

  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName =
      `${u.first_name} ${u.middle_name || ""} ${u.last_name}`.toLowerCase();

    return (
      u.employee_id.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      fullName.includes(q)
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Update access privilege
  const handleToggleChange = async (pageId, hasAccessNow) => {
    if (!selectedUser) return;

    const newState = !hasAccessNow;

    // Optimistic update
    setPageAccess((prev) => ({ ...prev, [pageId]: newState }));

    try {
      if (newState) {
        await axios.post(
          `${API_BASE_URL}/api/page_access/${selectedUser.employee_id}/${pageId}`,
        );
      } else {
        await axios.delete(
          `${API_BASE_URL}/api/page_access/${selectedUser.employee_id}/${pageId}`,
        );
      }

      setSnack({
        open: true,
        type: "success",
        message: newState ? "Access granted" : "Access revoked",
      });
    } catch {
      // rollback
      setPageAccess((prev) => ({ ...prev, [pageId]: hasAccessNow }));
      setSnack({
        open: true,
        type: "error",
        message: "Failed to update access",
      });
    }
  };

  const openCreateAccessModal = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/pages`);

      const pagesData = res.data || [];

      const defaultAccess = {};
      pagesData.forEach((p) => {
        defaultAccess[p.id] = false;
      });

      setCreatePages(pagesData);
      setCreatePageAccess(defaultAccess);
      setAccessDescription("");
      setOpenCreateModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateToggle = (pageId) => {
    setCreatePageAccess((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  };

  const saveAccess = async () => {
    try {
      const selectedPages = Object.keys(createPageAccess)
        .filter((key) => createPageAccess[key])
        .map((id) => Number(id));

      if (!accessDescription.trim()) {
        setSnack({
          open: true,
          severity: "warning",
          message: "Description is required",
        });
        return;
      }

      await axios.post(`${API_BASE_URL}/api/access`, {
        access_description: accessDescription,
        access_page: selectedPages,
      });

      setSnack({
        open: true,
        severity: "success",
        message: "Access created successfully",
      });

      setOpenCreateModal(false);
    } catch (err) {
      setSnack({
        open: true,
        severity: "error",
        message: "Failed to create access",
      });
    }
  };

  if (hasAccess === false) return <Unauthorized />;

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
        <Typography variant="h4" fontWeight="bold" sx={{ color: titleColor }}>
          USER PAGE ACCESS
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Search Employee ID / Name / Email / Role"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: 400,
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

      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323", color: "white" }}>
            <TableRow>
              <TableCell
                colSpan={10}
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
                >
                  {/* Left: Total Count */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Admin Account: {filteredUsers.length}
                  </Typography>

                  {/* Right: Pagination Controls */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* First & Prev */}
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                          fontSize: "12px",
                          height: 36,
                          color: "white",
                          border: "1px solid white",
                          backgroundColor: "transparent",
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "& svg": {
                            color: "white", // dropdown arrow icon color
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: "#fff", // dropdown background
                            },
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
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    {/* Next & Last */}
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      Last
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={openCreateAccessModal}
                    >
                      Create Access
                    </Button>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      {/* USER LIST TABLE */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#F5F5F5" }}>
              <TableRow>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Employee ID
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Email
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Access Level
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `2px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedUsers.map((u, p) => (
                <TableRow key={u.id}>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `2px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    {u.employee_id}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `2px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >{`${u.last_name}, ${u.first_name} ${u.middle_name || "."}`}</TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `2px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    {u.email}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `2px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    {u.role}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `2px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    {u.access_description}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      textAlign: "center",
                      border: `2px solid ${borderColor}`,
                    }}
                    align="center"
                  >
                    <Switch
                      checked={!!pageAccess[p.id]} // ensure boolean
                      onChange={
                        () => handleToggleChange(p.id, !!pageAccess[p.id]) // pass current value correctly
                      }
                      color="primary"
                      size="medium"
                    />
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "black",
                      border: `2px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => loadUserAccess(u)}
                    >
                      Edit Access
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323", color: "white" }}>
            <TableRow>
              <TableCell
                colSpan={10}
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
                >
                  {/* Left: Total Count */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Admin Account: {filteredUsers.length}
                  </Typography>

                  {/* Right: Pagination Controls */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* First & Prev */}
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                          fontSize: "12px",
                          height: 36,
                          color: "white",
                          border: "1px solid white",
                          backgroundColor: "transparent",
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "& svg": {
                            color: "white", // dropdown arrow icon color
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: "#fff", // dropdown background
                            },
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
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    {/* Next & Last */}
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Editing Access For: {selectedUser?.employee_id} |{" "}
          {`${selectedUser?.last_name}, ${selectedUser?.first_name} ${selectedUser?.middle_name || "."}`}
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: "70vh" }}>
          <Paper sx={{ border: `2px solid ${borderColor}` }}>
            <TableContainer>
              <Table>
                <TableHead
                  sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `2px solid ${borderColor}`,
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `2px solid ${borderColor}`,
                      }}
                    >
                      Page Description
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `2px solid ${borderColor}`,
                      }}
                    >
                      Page Group
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `2px solid ${borderColor}`,
                      }}
                      align="center"
                    >
                      Access
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {pages.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `2px solid ${borderColor}`,
                        }}
                      >
                        {i + 1}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `2px solid ${borderColor}`,
                        }}
                      >
                        {p.page_description}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `2px solid ${borderColor}`,
                        }}
                      >
                        {p.page_group}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `2px solid ${borderColor}`,
                        }}
                        align="center"
                      >
                        <Switch
                          checked={pageAccess[p.id] || false}
                          onChange={() =>
                            handleToggleChange(p.id, pageAccess[p.id] || false)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenModal(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Create New Access</DialogTitle>

        <DialogContent dividers>
          <TextField
            label="Description"
            fullWidth
            value={accessDescription}
            onChange={(e) => setAccessDescription(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Paper sx={{ border: `2px solid ${borderColor}` }}>
            <TableContainer>
              <Table>
                <TableHead
                  sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Page Description
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Page Group
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Access
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {createPages.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell align="center">{i + 1}</TableCell>
                      <TableCell align="center">{p.page_description}</TableCell>
                      <TableCell align="center">{p.page_group}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={createPageAccess[p.id] || false}
                          onChange={() => handleCreateToggle(p.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenCreateModal(false)}
          >
            Cancel
          </Button>

          <Button variant="contained" color="success" onClick={saveAccess}>
            Save Access
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={handleCloseSnack}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserPageAccess;
