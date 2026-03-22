import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  Card,
  TableCell,
  TableContainer,
  TableHead,
  TextField,
  DialogActions,
  Dialog,
  DialogContent,
  DialogTitle,
  TableRow,
  MenuItem,
} from "@mui/material";
import API_BASE_URL from "../apiConfig";
import Search from "@mui/icons-material/Search";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { io } from "socket.io-client";
import { Snackbar, Alert } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import PsychologyIcon from "@mui/icons-material/Psychology";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GradeIcon from "@mui/icons-material/Grade";
import MenuBookIcon from "@mui/icons-material/MenuBook";

const tabs1 = [
  { label: "Student Records", to: "/student_list", icon: ListAltIcon },
  {
    label: "Applicant Form",
    to: "/readmission_dashboard1",
    icon: PersonAddIcon,
  },
  {
    label: "Submitted Documents",
    to: "/submitted_documents",
    icon: UploadFileIcon,
  },
  {
    label: "Search Certificate of Registration",
    to: "/search_cor",
    icon: ListAltIcon,
  },
  { label: "Report of Grades", to: "/report_of_grades", icon: GradeIcon },
  {
    label: "Transcript of Records",
    to: "/transcript_of_records",
    icon: SchoolIcon,
  },
];
const REGISTRAR_COR_SEARCH_KEY = "registrar_cor_search_student_number";

const MedicalRequirements = () => {
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
    if (settings.main_button_color)
      setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);
    if (settings.stepper_color) setStepperColor(settings.stepper_color);

    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    }

    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);
  }, [settings]);

  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(2);
  const [clickedSteps, setClickedSteps] = useState(
    Array(tabs1.length).fill(false),
  );

  // ------------------------------------
  const [requirements, setRequirements] = useState([]);

  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/requirements`)
      .then((res) => {
        const allRequirements = res.data;

        if (selectedPerson) {
          // Filter by applicant's applyingAs value OR applicant_type === 0
          const filtered = allRequirements.filter(
            (req) =>
              Number(req.applicant_type) ===
              Number(selectedPerson.applyingAs) ||
              Number(req.applicant_type) === 0,
          );

          setRequirements(filtered);
        } else {
          // Default filter when no applicant is selected
          const filtered = allRequirements.filter(
            (req) =>
              Number(req.applicant_type) === 1 ||
              Number(req.applicant_type) === 0,
          );
          setRequirements(filtered);
        }
      })
      .catch((err) => console.error("Error loading requirements:", err));
  }, [selectedPerson]);
  // -------------------------------------

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const [explicitSelection, setExplicitSelection] = useState(false);

  // ✅ CONSOLIDATED: Single fetch function using /api/student_data_as_applicant/:id
  // Replaces: fetchByPersonId + fetchPersonData + fetchDocumentStatus
  const fetchByPersonId = async (personID) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/student_data_as_applicant/${personID}`,
      );
      const data = res.data;

      // Set person data (includes document_status and evaluator from backend)
      setPerson(data);
      setSelectedPerson(data);

      // ✅ document_status already returned by the endpoint — no separate call needed
      setDocumentStatus(data.document_status || "On process");

      // Fetch uploads if student_number is available
      if (data?.student_number) {
        await fetchUploadsByStudentNumber(data.student_number);
      }
    } catch (err) {
      console.error("❌ fetchByPersonId failed:", err);
    }
  };

  const location = useLocation();
  const [uploads, setUploads] = useState([]);
  const [persons, setPersons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [person, setPerson] = useState({
    profile_img: "",
    generalAverage1: "",
    height: "",
    program: "",
    strand: "",
    applyingAs: "",
    document_status: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    extension: "",
    student_number: "",
    evaluator: null,
  });


  const [curriculumOptions, setCurriculumOptions] = useState([]);

  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/applied_program`);
        setCurriculumOptions(response.data);
      } catch (error) {
        console.error("Error fetching curriculum options:", error);
      }
    };

    fetchCurriculums();
  }, []);

  {
    curriculumOptions.find(
      (item) =>
        item?.curriculum_id?.toString() === (person?.program ?? "").toString()
    )?.program_description || (person?.program ?? "")

  }

  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [newRemarkMode, setNewRemarkMode] = useState({});
  const [documentStatus, setDocumentStatus] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const personIdFromUrl = queryParams.get("person_id");

    if (!personIdFromUrl) return;

    axios
      .get(`${API_BASE_URL}/api/person_with_applicant/${personIdFromUrl}`)
      .then((res) => {
        if (res.data?.student_number) {
          setSearchQuery(res.data.student_number);

          if (typeof fetchUploadsByApplicantNumber === "function") {
            fetchUploadsByApplicantNumber(res.data.student_number);
          }

          if (typeof fetchApplicants === "function") {
            fetchApplicants();
          }
        }
      })
      .catch((err) => console.error("Auto search failed:", err));
  }, [location.search]);

  const handleStepClick = (index, to) => {
    setActiveStep(index);

    const pid = sessionStorage.getItem("edit_person_id");
    const sn = sessionStorage.getItem("edit_student_number");
    const currentStudentNumber =
      selectedPerson?.student_number ||
      person?.student_number ||
      searchQuery?.trim() ||
      sn;

    if (currentStudentNumber) {
      sessionStorage.setItem(REGISTRAR_COR_SEARCH_KEY, currentStudentNumber);
      sessionStorage.setItem("edit_student_number", currentStudentNumber);
    }

    if (pid) {
      navigate(`${to}?person_id=${pid}`);
    } else if (currentStudentNumber) {
      navigate(`${to}?student_number=${currentStudentNumber}`);
    } else {
      navigate(to);
    }
  };

  useEffect(() => {
    const storedId = sessionStorage.getItem("edit_student_number");

    if (
      storedId &&
      storedId !== "undefined" &&
      storedId !== "null" &&
      storedId.length >= 9
    ) {
      setSearchQuery(storedId);
    }
  }, []);

  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 106;

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
      setLoading(false);
    }
  };

  // ✅ REMOVED: Second duplicate useEffect for localStorage — merged into the one above
  // ✅ REMOVED: fetchPersonData — replaced by fetchByPersonId
  // ✅ REMOVED: fetchDocumentStatus — document_status now comes from fetchByPersonId
  // ✅ REMOVED: useEffect watching person.student_number for fetchDocumentStatus
  // ✅ REMOVED: useEffect watching selectedPerson for fetchPersonData

  const queryParams = new URLSearchParams(location.search);
  const queryPersonId = queryParams.get("person_id")?.trim() || "";

  useEffect(() => {
    let consumedFlag = false;

    const tryLoad = async () => {
      if (queryPersonId) {
        await fetchByPersonId(queryPersonId);
        setExplicitSelection(true);
        consumedFlag = true;
        return;
      }

      const source = sessionStorage.getItem("admin_edit_person_id_source");
      const tsStr = sessionStorage.getItem("admin_edit_person_id_ts");
      const id = sessionStorage.getItem("admin_edit_person_id");
      const ts = tsStr ? parseInt(tsStr, 10) : 0;
      const isFresh =
        source === "Student_list" && Date.now() - ts < 5 * 60 * 1000;

      if (id && isFresh) {
        await fetchByPersonId(id);
        setExplicitSelection(true);
        consumedFlag = true;
      }
    };

    tryLoad().finally(() => {
      if (consumedFlag) {
        sessionStorage.removeItem("admin_edit_person_id_source");
        sessionStorage.removeItem("admin_edit_person_id_ts");
      }
    });
  }, [queryPersonId]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [targetDoc, setTargetDoc] = useState(null);

  const handleConfirmUpload = (doc) => {
    setTargetDoc(doc);
    setConfirmAction("upload");
    setConfirmOpen(true);
  };

  const handleConfirmDelete = (doc) => {
    setTargetDoc(doc);
    setConfirmAction("delete");
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "upload") {
      await handleUploadSubmit(targetDoc);
      console.log(
        `📂 Document uploaded by: ${localStorage.getItem("username")}`,
      );
    } else if (confirmAction === "delete") {
      await handleDelete(targetDoc.upload_id);
      console.log(
        `🗑️ Document deleted by: ${localStorage.getItem("username")}`,
      );
    }
    setConfirmOpen(false);
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchUploadsByStudentNumber = async (student_number) => {
    if (!student_number) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/uploads/by-student/${student_number}`,
      );
      setUploads(res.data);
    } catch (err) {
      console.error("Fetch uploads failed:", err);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      if (!explicitSelection) {
        setSelectedPerson(null);
        setUploads([]);
        setSelectedFiles({});
        setPerson({
          profile_img: "",
          generalAverage1: "",
          height: "",
          applyingAs: "",
          program: "",
    strand: "",
          document_status: "",
          last_name: "",
          first_name: "",
          middle_name: "",
          extension: "",
          student_number: "",
          evaluator: null,
        });
        setDocumentStatus("");
      }
      return;
    }

    if (explicitSelection) setExplicitSelection(false);

    const match = persons.find((p) =>
      `${p.first_name} ${p.middle_name} ${p.last_name} ${p.emailAddress} ${p.student_number || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );

    if (match) {
      setSelectedPerson(match);
      fetchUploadsByStudentNumber(match.student_number);

      // ✅ Also fetch full person data (document_status + evaluator) when searching by name
      if (match.person_id) {
        fetchByPersonId(match.person_id);
      }
    } else {
      setSelectedPerson(null);
      setUploads([]);
      setDocumentStatus("");
      setPerson({
        profile_img: "",
        generalAverage1: "",
        height: "",
        applyingAs: "",
        program: "",
    strand: "",
        document_status: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        extension: "",
        student_number: "",
        evaluator: null,
      });
    }
  }, [searchQuery, persons, explicitSelection]);

  const fetchPersons = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/student_upload_documents_data`,
      );
      setPersons(res.data);
    } catch (err) {
      console.error("Error fetching persons:", err);
    }
  };

  const handleStatusChange = async (uploadId, remarkValue) => {
    const remarks = remarksMap[uploadId] || "";

    try {
      await axios.put(`${API_BASE_URL}/uploads/student/remarks/${uploadId}`, {
        status: remarkValue,
        remarks,
        user_id: userID,
      });

      setUploads((prev) =>
        prev.map((u) =>
          u.upload_id === uploadId
            ? { ...u, status: parseInt(remarkValue, 10), remarks }
            : u,
        ),
      );

      setEditingRemarkId(null);

      if (selectedPerson?.student_number) {
        fetchUploadsByStudentNumber(selectedPerson.student_number);
      }
    } catch (err) {
      console.error("Error updating Status:", err);
    }
  };

  const handleDocumentStatus = async (event) => {
    const newStatus = event.target.value;
    setDocumentStatus(newStatus);

    try {
      await axios.put(
        `${API_BASE_URL}/api/document_status/${person.student_number}`,
        {
          document_status: newStatus,
          user_id: localStorage.getItem("person_id"),
        },
      );

      // ✅ Re-fetch full person data to refresh evaluator + document_status in one call
      if (person.person_id) {
        await fetchByPersonId(person.person_id);
      }

      // ✅ Also refresh uploads list
      if (person.student_number) {
        await fetchUploadsByStudentNumber(person.student_number);
      }

      console.log("Document status updated and UI refreshed!");
    } catch (err) {
      console.error("Error updating document status:", err);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFiles.requirements_id || !selectedPerson?.person_id) {
      alert("Please select a document type.");
      return;
    }

    if (selectedFiles.remarks && !selectedFiles.file) {
      alert("Please select a file for the chosen remarks.");
      return;
    }

    try {
      const formData = new FormData();
      if (selectedFiles.file) formData.append("file", selectedFiles.file);
      formData.append("requirements_id", selectedFiles.requirements_id);
      formData.append("person_id", selectedPerson.person_id);
      formData.append("remarks", selectedFiles.remarks || "");

      await axios.post(`${API_BASE_URL}/api/student/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-person-id": localStorage.getItem("person_id"),
        },
      });

      showSnackbar("✅ Upload successful!", "success");

      setSelectedFiles({});
      if (selectedPerson?.student_number) {
        fetchUploadsByStudentNumber(selectedPerson.student_number);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      showSnackbar("❌ Upload failed.", "error");
    }
  };

  const handleDelete = async (uploadId) => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/uploads/${uploadId}`, {
        headers: {
          "x-person-id": localStorage.getItem("person_id"),
        },
        withCredentials: true,
      });

      if (selectedPerson?.student_number) {
        fetchUploadsByStudentNumber(selectedPerson.student_number);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const renderRow = (doc) => {
    const uploaded = uploads.find((u) => u.description === doc.label);
    const uploadId = uploaded?.upload_id;

    const buttonStyle = {
      minWidth: 120,
      height: 40,
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "none",
    };

    return (
      <TableRow key={doc.key}>
        <TableCell
          sx={{
            fontWeight: "bold",
            width: "20%",
            border: `2px solid ${borderColor}`,
          }}
        >
          {doc.label}
          {Number(doc.is_optional) === 1 && (
            <span style={{ marginLeft: 2 }}>(Optional)</span>
          )}
        </TableCell>

        <TableCell sx={{ width: "20%", border: `2px solid ${borderColor}` }}>
          {uploadId && editingRemarkId === uploadId ? (
            <TextField
              disabled
              size="small"
              fullWidth
              autoFocus
              placeholder="Enter remarks"
              value={remarksMap[uploadId] ?? uploaded?.remarks ?? ""}
              onChange={(e) =>
                setRemarksMap((prev) => ({
                  ...prev,
                  [uploadId]: e.target.value,
                }))
              }
              onBlur={async () => {
                const finalRemark = (remarksMap[uploadId] || "").trim();
                await axios.put(`${API_BASE_URL}/uploads/remarks/${uploadId}`, {
                  remarks: finalRemark,
                  status:
                    uploads.find((u) => u.upload_id === uploadId)?.status ||
                    "0",
                  user_id: userID,
                });
                if (selectedPerson?.applicant_number) {
                  await fetchUploadsByApplicantNumber(
                    selectedPerson.applicant_number,
                  );
                }
                setEditingRemarkId(null);
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const finalRemark = (remarksMap[uploadId] || "").trim();
                  await axios.put(
                    `${API_BASE_URL}/uploads/remarks/${uploadId}`,
                    {
                      remarks: finalRemark,
                      status:
                        uploads.find((u) => u.upload_id === uploadId)?.status ||
                        "0",
                      user_id: userID,
                    },
                  );
                  if (selectedPerson?.applicant_number) {
                    await fetchUploadsByApplicantNumber(
                      selectedPerson.applicant_number,
                    );
                  }
                  setEditingRemarkId(null);
                }
              }}
            />
          ) : (
            <Box
              onClick={() => {
                if (!uploadId) return;
                setEditingRemarkId(uploadId);
                setRemarksMap((prev) => ({
                  ...prev,
                  [uploadId]: uploaded?.remarks ?? "",
                }));
              }}
              sx={{
                cursor: uploadId ? "pointer" : "default",
                fontStyle: uploaded?.remarks ? "normal" : "italic",
                color: uploaded?.remarks ? "inherit" : "#888",
                minHeight: "40px",
                display: "flex",
                alignItems: "center",
                px: 1,
                border: "1px solid #bdbdbd",
                borderRadius: "4px",
                backgroundColor: "#fafafa",
              }}
            >
              {uploaded?.remarks || "Click to add remarks"}
            </Box>
          )}
        </TableCell>

        <TableCell
          align="center"
          sx={{ width: "15%", border: `2px solid ${borderColor}` }}
        >
          {uploaded ? (
            uploaded.status === 1 ? (
              <Box
                sx={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  borderRadius: 1,
                  width: 140,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <Typography sx={{ fontWeight: "bold" }}>Verified</Typography>
              </Box>
            ) : uploaded.status === 2 ? (
              <Box
                sx={{
                  backgroundColor: "#F44336",
                  color: "white",
                  borderRadius: 1,
                  width: 140,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <Typography sx={{ fontWeight: "bold" }}>Rejected</Typography>
              </Box>
            ) : (
              <Box display="flex" justifyContent="center" gap={1}>
                <Button
                  disabled
                  variant="contained"
                  onClick={() => handleStatusChange(uploaded.upload_id, "1")}
                  sx={{
                    ...buttonStyle,
                    backgroundColor: "green",
                    color: "white",
                  }}
                >
                  Verified
                </Button>
                <Button
                  disabled
                  variant="contained"
                  onClick={() => handleStatusChange(uploaded.upload_id, "2")}
                  sx={{
                    ...buttonStyle,
                    backgroundColor: "red",
                    color: "white",
                  }}
                >
                  Rejected
                </Button>
              </Box>
            )
          ) : null}
        </TableCell>

        <TableCell style={{ border: `2px solid ${borderColor}` }}>
          {uploaded?.created_at &&
            new Date(uploaded.created_at).toLocaleString("en-PH", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Manila",
            })}
        </TableCell>

        <TableCell style={{ border: `2px solid ${borderColor}` }}>
          {selectedPerson?.student_number || person?.student_number
            ? `[${selectedPerson?.student_number || person?.student_number}] ${(
              selectedPerson?.last_name ||
              person?.last_name ||
              ""
            ).toUpperCase()}, ${(
              selectedPerson?.first_name ||
              person?.first_name ||
              ""
            ).toUpperCase()} ${(
              selectedPerson?.middle_name ||
              person?.middle_name ||
              ""
            ).toUpperCase()} ${(
              selectedPerson?.extension ||
              person?.extension ||
              ""
            ).toUpperCase()}`
            : ""}
        </TableCell>

        <TableCell style={{ border: `2px solid ${borderColor}` }}>
          <Box display="flex" justifyContent="center" gap={1}>
            {uploaded ? (
              <>
                {/* <Button
                  disabled
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: "green",
                    color: "white",
                    "&:hover": { backgroundColor: "#006400" },
                  }}
                  onClick={() => {
                    setEditingRemarkId(uploaded.upload_id);
                    setRemarksMap((prev) => ({
                      ...prev,
                      [uploaded.upload_id]: uploaded.remarks || "",
                    }));
                  }}
                >
                  Edit
                </Button> */}

                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#1976d2", color: "white" }}
                  href={`${API_BASE_URL}/ApplicantOnlineDocuments/${uploaded.file_path}`}
                  target="_blank"
                >
                  Preview
                </Button>

                {/* <Button
                  disabled
                  onClick={() => handleConfirmDelete(uploaded)}
                  sx={{
                    backgroundColor: uploaded.canDelete
                      ? "maroon"
                      : "lightgray",
                    color: uploaded.canDelete ? "white" : "#888",
                    cursor: uploaded.canDelete ? "pointer" : "not-allowed",
                    "&:hover": {
                      backgroundColor: uploaded.canDelete
                        ? "#600000"
                        : "lightgray",
                    },
                  }}
                >
                  Delete
                </Button> */}
              </>
            ) : null}
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

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
      {/* Top header: DOCUMENTS SUBMITTED + Search */}
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
          DOCUMENTS SUBMITTED
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Search Student Name / Email / Student ID"
          size="small"
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
          alignItems: "center",
          flexWrap: "nowrap",
          width: "100%",
          mt: 2,
        }}
      >
        {tabs1.map((tab, index) => (
          <React.Fragment key={index}>
            <Card
              onClick={() => handleStepClick(index, tab.to)}
              sx={{
                flex: 1,
                maxWidth: `${100 / tabs1.length}%`,
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: 2,
                border: `2px solid ${borderColor}`,
                backgroundColor:
                  activeStep === index
                    ? settings?.header_color || "#1976d2"
                    : "#E8C999",
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
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <tab.icon sx={{ fontSize: 32 }} />
                <Typography
                  sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}
                >
                  {tab.label}
                </Typography>
              </Box>
            </Card>
            {index < tabs1.length - 1 && <Box sx={{ flex: 0.1, mx: 1 }} />}
          </React.Fragment>
        ))}
      </Box>

      <br />

      {/* Student Number and Name header */}
      <TableContainer
        component={Paper}
        sx={{ width: "100%", border: `2px solid ${borderColor}` }}
      >
        <Table>
          <TableHead
            sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
          >
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontSize: "20px",
                  fontFamily: "Poppins, sans-serif",
                  border: "none",
                }}
              >
                Student Number:&nbsp;
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: "normal",
                    textDecoration: "underline",
                  }}
                >
                  {selectedPerson?.student_number ||
                    person?.student_number ||
                    "N/A"}
                </span>
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  color: "white",
                  fontSize: "20px",
                  fontFamily: "Poppins, sans-serif",
                  border: "none",
                }}
              >
                Student Name:&nbsp;
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: "normal",
                    textDecoration: "underline",
                  }}
                >
                  {(
                    selectedPerson?.last_name ||
                    person?.last_name ||
                    ""
                  ).toUpperCase()}
                  ,&nbsp;
                  {(
                    selectedPerson?.first_name ||
                    person?.first_name ||
                    ""
                  ).toUpperCase()}{" "}
                  {(
                    selectedPerson?.middle_name ||
                    person?.middle_name ||
                    ""
                  ).toUpperCase()}{" "}
                  {(
                    selectedPerson?.extension ||
                    person?.extension ||
                    ""
                  ).toUpperCase()}
                </span>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <TableContainer
        component={Paper}
        sx={{ width: "100%", border: `2px solid ${borderColor}` }}
      >
        {/* SHS GWA and Height */}
      <Box sx={{ px: 2, mb: 2, mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1, }}>
            <Typography
              sx={{
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
                minWidth: "100px",

                mr: 1,
              }}
            >
              Program Applied:
            </Typography>
            <TextField
              size="small"
              name="program"
              value={curriculumOptions.length > 0
                ? curriculumOptions.find(
                  (item) =>
                    item?.curriculum_id?.toString() ===
                    (person?.program ?? "").toString()
                )?.program_description || (person?.program ?? "")
                : "Loading..."}
              sx={{ width: "500px" }}
              InputProps={{
                sx: {
                  height: 35, // control outer height
                },
              }}
              inputProps={{
                style: {
                  padding: "4px 8px", // control inner padding
                  fontSize: "12px",
                },
              }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1, }}>
            <Typography
              sx={{
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
                minWidth: "100px",

                mr: 1,
              }}
            >
              Strand:
            </Typography>
            <TextField
              size="small"
              name="strand"
              value={person.strand || ""}
              sx={{ width: "300px" }}
              InputProps={{
                sx: {
                  height: 35, // control outer height
                },
              }}
              inputProps={{
                style: {
                  padding: "4px 8px", // control inner padding
                  fontSize: "12px",
                },
              }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1, }}>
            <Typography
              sx={{
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
                minWidth: "100px",

                mr: 1,
              }}
            >
              SHS Gwa:
            </Typography>
            <TextField
              size="small"
              name="generalAverage1"
              value={person.generalAverage1 || ""}
              sx={{ width: "250px" }}
              InputProps={{
                sx: {
                  height: 35, // control outer height
                },
              }}
              inputProps={{
                style: {
                  padding: "4px 8px", // control inner padding
                  fontSize: "12px",
                },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography
              sx={{
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
                minWidth: "100px",
                mr: 1,
              }}
            >
              Height:
            </Typography>
            <TextField
              size="small"
              name="height"
              value={person.height || ""}
              sx={{ width: "100px" }}
              InputProps={{
                sx: {
                  height: 35,
                },
              }}
              inputProps={{
                style: {
                  padding: "4px 8px",
                  fontSize: "12px",
                },
              }}
            />
            <div style={{ fontSize: "12px", marginLeft: "10px" }}>cm.</div>
          </Box>
        </Box>
        <br />
        <br />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            px: 2,
          }}
        >
          <Box>
            {/* Applying As */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "Poppins, sans-serif",
                  minWidth: "120px",
                  mr: 4.8,
                }}
              >
                Applying As:
              </Typography>
              <TextField
                disabled
                select
                size="small"
                name="applyingAs"
                value={person.applyingAs || ""}
                sx={{ width: "300px" }}
                InputProps={{ sx: { height: 35 } }}
                inputProps={{ style: { padding: "4px 8px", fontSize: "12px" } }}
              >
                <MenuItem value="">
                  <em>Select Applying</em>
                </MenuItem>
                <MenuItem value="1">Senior High School Graduate</MenuItem>
                <MenuItem value="2">
                  Senior High School Graduating Student
                </MenuItem>
                <MenuItem value="3">
                  ALS (Alternative Learning System) Passer
                </MenuItem>
                <MenuItem value="4">
                  Transferee from other University/College
                </MenuItem>
                <MenuItem value="5">Cross Enrolee Student</MenuItem>
                <MenuItem value="6">Foreign Applicant/Student</MenuItem>
                <MenuItem value="7">Baccalaureate Graduate</MenuItem>
                <MenuItem value="8">Master Degree Graduate</MenuItem>
              </TextField>
            </Box>

            {/* Document Status */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "Poppins, sans-serif",
                  minWidth: "140px",
                  mr: 2.3,
                }}
              >
                Document Status:
              </Typography>
              <TextField
                disabled
                select
                size="small"
                name="document_status"
                value={documentStatus}
                onChange={handleDocumentStatus}
                sx={{ width: "300px", mr: 2 }}
                InputProps={{ sx: { height: 35 } }}
                inputProps={{ style: { padding: "4px 8px", fontSize: "12px" } }}
              >
                <MenuItem value="">
                  <em>Select Document Status</em>
                </MenuItem>
                <MenuItem value="On Process">On Process</MenuItem>
                <MenuItem value="Documents Verified & ECAT">
                  Documents Verified &amp; ECAT
                </MenuItem>
                <MenuItem value="Disapproved / Program Closed">
                  Disapproved / Program Closed
                </MenuItem>
              </TextField>

              {/* ✅ Evaluator info — uses flat structure returned by /api/student_data_as_applicant/:id */}
              {person?.evaluator?.evaluator_email && (
                <Typography variant="caption" sx={{ marginLeft: 1 }}>
                  Status Changed By:{" "}
                  {person.evaluator.evaluator_email.replace(
                    /@gmail\.com$/i,
                    "",
                  )}
                  {/* ✅ evaluator_lname/fname/mname available if added to backend SELECT */}
                  {person.evaluator.evaluator_lname && (
                    <>
                      {" "}
                      ({person.evaluator.evaluator_lname},{" "}
                      {person.evaluator.evaluator_fname}{" "}
                      {person.evaluator.evaluator_mname})
                    </>
                  )}
                  <br />
                  Updated At:{" "}
                  {new Date(person.evaluator.created_at).toLocaleString()}
                </Typography>
              )}
            </Box>

            {/* Document Type and File Upload */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 4, mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontFamily: "Poppins, sans-serif",
                    width: "90px",
                  }}
                >
                  Document Type:
                </Typography>
                <TextField
                  disabled
                  select
                  size="small"
                  placeholder="Select Documents"
                  value={selectedFiles.requirements_id || ""}
                  onChange={(e) =>
                    setSelectedFiles((prev) => ({
                      ...prev,
                      requirements_id: e.target.value,
                    }))
                  }
                  sx={{ width: 200 }}
                  InputProps={{ sx: { height: 38 } }}
                  inputProps={{
                    style: { padding: "4px 8px", fontSize: "12px" },
                  }}
                >
                  <MenuItem value="">
                    <em>Select Documents</em>
                  </MenuItem>
                  {requirements.map((req) => (
                    <MenuItem key={req.id} value={req.id}>
                      {req.description}
                      {req.is_optional === 1 && (
                        <span
                          style={{
                            color: "#999",
                            fontStyle: "italic",
                            marginLeft: 6,
                          }}
                        >
                          (Optional)
                        </span>
                      )}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  marginLeft: "-25px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontFamily: "Poppins, sans-serif",
                    width: "100px",
                    textAlign: "center",
                  }}
                >
                  Document File:
                </Typography>

                <Box
                  sx={{
                    backgroundColor: "#e0e0e0",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 250,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={
                    selectedFiles.file
                      ? selectedFiles.file.name
                      : "No file selected"
                  }
                >
                  {selectedFiles.file
                    ? selectedFiles.file.name
                    : "No file selected"}
                </Box>

                <Button
                  disabled
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => document.getElementById("fileInput").click()}
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    textTransform: "none",
                    width: 250,
                    height: 38,
                    fontSize: "15px",
                    fontWeight: "bold",
                    justifyContent: "center",
                    "&:hover": { backgroundColor: "#1565c0" },
                  }}
                >
                  Browse File
                </Button>

                <input
                  id="fileInput"
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) =>
                    setSelectedFiles((prev) => ({
                      ...prev,
                      file: e.target.files[0],
                    }))
                  }
                />

                <Button
                  variant="contained"
                  color="success"
                  sx={{
                    textTransform: "none",
                    fontWeight: "bold",
                    height: 38,
                    width: 250,
                  }}
                  onClick={() => handleConfirmUpload({ label: "New Document" })}
                  disabled={!selectedFiles.file}
                >
                  Submit Documents
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Profile Image */}
          {person.profile_img && (
            <Box
              sx={{
                width: "2.10in",
                height: "2.10in",
                border: "1px solid #ccc",
                overflow: "hidden",
                marginTop: "-400px",
                borderRadius: "4px",
              }}
            >
              <img
                src={`${API_BASE_URL}/uploads/Student1by1/${person.profile_img}`}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          )}
        </Box>
      </TableContainer>

      <>
        <TableContainer
          component={Paper}
          sx={{ width: "100%", border: `2px solid ${borderColor}` }}
        >
          <Table>
            <TableHead
              sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
            >
              <TableRow>
                {[
                  "Document Type",
                  "Remarks",
                  "Status",
                  "Date and Time Submitted",
                  "User",
                  "Action",
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      color: "white",
                      textAlign: "Center",
                      border: `2px solid ${borderColor}`,
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {requirements.map((doc) =>
                renderRow({
                  label: doc.description,
                  key: doc.short_label || doc.description.replace(/\s+/g, ""),
                  id: doc.id,
                  is_optional: doc.is_optional,
                }),
              )}
            </TableBody>
          </Table>
        </TableContainer>

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

        {/* Confirmation Dialog */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>
            {confirmAction === "upload" ? "Confirm Upload" : "Confirm Deletion"}
          </DialogTitle>
          <DialogContent>
            {confirmAction === "upload" ? (
              <>
                Are you sure you want to upload{" "}
                <strong>{targetDoc?.label}</strong>?<br />
                Added by: <strong>{localStorage.getItem("username")}</strong>
              </>
            ) : (
              <>
                Are you sure you want to delete{" "}
                <strong>
                  {targetDoc?.label ||
                    targetDoc?.short_label ||
                    targetDoc?.file_path}
                </strong>
                ?<br />
                Deleted by: <strong>{localStorage.getItem("username")}</strong>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} color="error">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              color="success"
              variant="contained"
            >
              Yes, Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </>
    </Box>
  );
};

export default MedicalRequirements;
