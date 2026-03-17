import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Container,
  TableHead,
  TableRow,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import ErrorIcon from "@mui/icons-material/Error";
import API_BASE_URL from "../apiConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

const RequirementUploader = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");

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

  const [requirements, setRequirements] = useState([]); // ✅ dynamic requirements

  const [uploads, setUploads] = useState([]);
  const [userID, setUserID] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({});
  const [allRequirementsCompleted, setAllRequirementsCompleted] = useState(
    localStorage.getItem("requirementsCompleted") === "1"
  );
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const id = localStorage.getItem('person_id');
    if (id) {
      setUserID(id);
      fetchUploads(id);
    }

    // ✅ Fetch all requirements dynamically from backend
    axios.get(`${API_BASE_URL}/requirements`)
      .then((res) => setRequirements(res.data))
      .catch((err) => console.error("Error loading requirements:", err));
  }, []);

  const [openModal, setOpenModal] = useState(false);

  const fetchUploads = async (personId) => {
    try {
      // ✅ Fetch user's uploaded files
      const res = await axios.get(`${API_BASE_URL}/uploads/${personId}`);
      const uploadsData = res.data;
      console.log(uploadsData)
      setUploads(uploadsData);

      // ✅ Map uploaded files to their requirement IDs
      const rebuiltSelectedFiles = {};
      uploadsData.forEach((upload) => {
        rebuiltSelectedFiles[upload.requirements_id] = upload.original_name;
      });
      setSelectedFiles(rebuiltSelectedFiles);

      // ✅ Get all verifiable requirements from DB
      // ✅ Get ONLY Regular + Verifiable requirements
      const reqRes = await axios.get(`${API_BASE_URL}/requirements`);

      const verifiableRequirements = reqRes.data.filter(
        (r) => r.is_verifiable === 1 && r.category === "Main"
      );

      // ✅ Compare uploaded vs required
      const uploadedIds = new Set(uploadsData.map((u) => u.requirements_id));

      const allRequiredUploaded =
        verifiableRequirements.length > 0 &&
        verifiableRequirements.every((r) => uploadedIds.has(r.id));


      // ✅ Only show Congratulations if all required are uploaded (not every upload)
      if (!allRequirementsCompleted && allRequiredUploaded) {
        setOpenModal(true);
      }


      // ✅ Update completion state
      setAllRequirementsCompleted(allRequiredUploaded);
      localStorage.setItem("requirementsCompleted", allRequiredUploaded ? "1" : "0");
    } catch (err) {
      console.error("❌ Fetch uploads failed:", err);
    }
  };


  const checkAllRequiredUploads = () => {

    const requiredDocs = requirements.filter(
      (r) => r.category === "Main"
    );

    const uploadedIds = uploads.map((u) => Number(u.requirements_id));

    const missingDocs = requiredDocs.filter(
      (doc) => !uploadedIds.includes(Number(doc.id))
    );

    if (missingDocs.length > 0) {

      const missingNames = missingDocs.map(d => d.description).join(", ");

      setSnack({
        open: true,
        severity: "error",
        message: `Please upload all required documents: ${missingNames}`,
      });

      return false;
    }

    return true;
  };

  const [totalRequirements, setTotalRequirements] = useState(0);


  useEffect(() => {
    const fetchTotalRequirements = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/total-requirements`);
        setTotalRequirements(res.data.total);
      } catch (err) {
        console.error("Error fetching total requirements:", err);
      }
    };

    fetchTotalRequirements();
  }, []);



  const handleUpload = async (key, file) => {
    if (!file) return;

    setSelectedFiles((prev) => ({ ...prev, [key]: file.name }));

    const requirementId = key;
    if (!requirementId) return alert('Requirement not found.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('requirements_id', key); // ✅ key is already the doc.id
    formData.append('person_id', userID);

    try {
      await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      fetchUploads(userID);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload. Please try again.');
    }
  };



  const handleDelete = async (uploadId) => {
    try {
      await axios.delete(`${API_BASE_URL}/uploads/${uploadId}`, {
        headers: { 'x-person-id': userID }
      });

      fetchUploads(userID);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack(prev => ({ ...prev, open: false }));
  };

  const renderRow = (doc) => {
    const uploaded = uploads.find(
      (u) => Number(u.requirements_id) === Number(doc.id)
    );




    return (
      <TableRow key={doc.id}>
        <TableCell sx={{ fontWeight: 'bold', width: '25%', border: `2px solid ${borderColor}` }}>
          {doc.label}
          {doc.is_optional === 1 && (
            <span style={{ marginLeft: 2 }}>
              (Optional)
            </span>
          )}

          {doc.is_required === 1 && (
            <span style={{ color: "red", marginLeft: 5 }}>*</span>
          )}
        </TableCell>
        <TableCell sx={{ width: '25%', border: `2px solid ${borderColor}`, textAlign: "Center" }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Box sx={{ width: '220px', flexShrink: 0, textAlign: "center" }}>
              {selectedFiles[doc.id] ? (
                <Box
                  sx={{
                    backgroundColor: '#e0e0e0',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={selectedFiles[doc.id]}
                >
                  {selectedFiles[doc.id]}
                </Box>
              ) : (
                <Box sx={{ height: '40px' }} />
              )}
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{
                  backgroundColor: '#F0C03F',
                  color: 'white',
                  fontWeight: 'bold',
                  height: '40px',
                  textTransform: 'none',
                  minWidth: '140px',
                }}
              >
                Browse File
                <input
                  key={selectedFiles[doc.key] || Date.now()}
                  hidden
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleUpload(doc.id, e.target.files[0])}

                />
              </Button>
            </Box>
          </Box>
        </TableCell>

        <TableCell sx={{ width: "25%", border: `2px solid ${borderColor}` }}>
          {typeof uploaded?.remarks === "string" && uploaded.remarks.trim() !== "" && (
            <Typography
              sx={{
                fontStyle: "normal",
                color: "inherit",
              }}
            >
              {uploaded.remarks}
            </Typography>
          )}

          {uploaded?.status == 1 || uploaded?.status == 2 ? (
            <Typography
              sx={{
                mt: 0.5,
                fontSize: "14px",
                color: uploaded?.status == 1 ? "green" : "red",
                fontWeight: "bold",
              }}
            >
              {uploaded?.status == 1 ? "Verified" : "Rejected"}
            </Typography>
          ) : null}
        </TableCell>

        <TableCell sx={{ width: '10%', border: `2px solid ${borderColor}` }}>
          {uploaded && (
            <Button
              variant="contained"
              color="primary"
              href={`${API_BASE_URL}/ApplicantOnlineDocuments/${uploaded.file_path}`}
              target="_blank"
              startIcon={<VisibilityIcon />}
              sx={{
                height: '40px',
                textTransform: 'none',
                minWidth: '100px',
                width: '100%',
              }}
            >
              Preview
            </Button>
          )}
        </TableCell>


        <TableCell sx={{ width: '10%', border: `2px solid ${borderColor}` }}>
          {uploaded && (
            <Button
              onClick={() => handleDelete(uploaded.upload_id)}
              startIcon={<DeleteIcon />}
              sx={{
                backgroundColor: 'maroon',
                color: 'white',
                '&:hover': { backgroundColor: '#600000' },
                fontWeight: 'bold',
                height: '40px',
                textTransform: 'none',
                minWidth: '100px',
                width: '100%',
              }}
            >
              Delete
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      {/* ✅ Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleClose} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
          🎉 Application Submitted Successfully!
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ mt: 2, textAlign: "justify", fontSize: "16px" }}>
            Congratulations! You have successfully submitted your application to{" "}
            <strong>{companyName}</strong>.
          </Typography>

          <Typography sx={{ mt: 2, textAlign: "justify", fontSize: "16px" }}>
            Please wait for the <strong>Admission Office</strong> to contact you
            regarding the evaluation of your original documents that you uploaded.
          </Typography>

          <Typography sx={{ mt: 2, textAlign: "justify", fontSize: "15px" }}>
            Kindly check your Gmail account and Applicant Dashboard regularly for
            updates regarding your application status.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenModal(false)}
            sx={{

              fontWeight: "bold",
              textTransform: "none",
              minWidth: "120px",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>


      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',


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
          UPLOAD REQUIREMENTS
        </Typography>




      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // ✅ Center horizontally
          width: "100%",
          mt: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 2,
            width: "100%",
            p: 2,
            borderRadius: "10px",
            backgroundColor: "#fffaf5",
            border: "1px solid #6D2323",
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#6D2323",
              borderRadius: "8px",
              width: 50,
              height: 50,
              flexShrink: 0,
            }}
          >
            <ErrorIcon sx={{ color: "white", fontSize: 36 }} />
          </Box>

          {/* Text */}
          <Typography
            sx={{
              fontSize: "16px",
              fontFamily: "Arial",
              color: "#3e3e3e",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#6D2323" }}>Notice:</strong>{" "}
            Only files in <strong>JPG, JPEG, PNG, or PDF</strong> format are allowed for
            upload. Please make sure that the file you are submitting does not exceed
            the <strong>maximum file size of 4 MB</strong>. Any file that goes beyond
            the allowed size limit or is not in the required format will not be accepted
            by the system.
            <br />
            <br />
            To avoid delays in the processing of your application, kindly review and
            verify the file’s format and size before uploading. Thank you for your
            cooperation.
          </Typography>
        </Box>
      </Box>


      <Box sx={{ px: 2, marginLeft: "-10px" }}>
        {Object.entries(
          requirements.reduce((acc, r) => {
            const cat = r.category || "Main";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(r);
            return acc;
          }, {})
        ).map(([category, docs]) => (
          <Box key={category} sx={{ mt: 4 }}>
            <Container>
              <h1
                style={{
                  fontSize: "45px",
                  fontWeight: "bold",
                  textAlign: "center",
                  color: subtitleColor,
                  marginTop: "25px",
                }}
              >
                {category === "Medical"
                  ? "MEDICAL REQUIREMENTS"
                  : category === "Others"
                    ? "OTHER REQUIREMENTS"
                    : "MAIN REQUIREMENTS"}
              </h1>

              {/* 📝 Show message only below MAIN DOCUMENTS title */}
              {category !== "Medical" && category !== "Others" && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "18px",
                    marginTop: "10px",
                    marginBottom: "30px",
                    color: "#333",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    Complete the applicant form to secure your place for the upcoming academic year at{" "}
                    {shortTerm ? (
                      <>
                        <strong>{shortTerm.toUpperCase()}</strong> <br />
                        {companyName || ""}
                      </>
                    ) : (
                      companyName || ""
                    )}
                    .
                  </div>
                </div>
              )}
            </Container>

            <TableContainer
              component={Paper}
              sx={{ width: "95%", mt: 2, border: `2px solid ${borderColor}` }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", border: `2px solid ${borderColor}` }}>
                  <TableRow>
                    <TableCell sx={{ color: "white", border: `2px solid ${borderColor}` }}>Document</TableCell>
                    <TableCell sx={{ color: "white", border: `2px solid ${borderColor}` }}>Upload</TableCell>
                    <TableCell sx={{ color: "white", border: `2px solid ${borderColor}` }}>Remarks</TableCell>
                    <TableCell sx={{ color: "white", border: `2px solid ${borderColor}` }}>Preview</TableCell>
                    <TableCell sx={{ color: "white", border: `2px solid ${borderColor}` }}>Delete</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {docs.map((doc) =>
                    renderRow({
                      id: doc.id,
                      label: doc.description,
                      is_required: doc.is_required,
                      is_optional: doc.is_optional
                    })
                  )}

                </TableBody>

              </Table>
            </TableContainer>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            if (!checkAllRequiredUploads()) return;

            setSnack({
              open: true,
              severity: "success",
              message: "All required documents uploaded successfully.",
            });

            // example redirect
            window.location.href = "/applicant_dashboard";
          }}
          sx={{

            fontWeight: "bold",
            padding: "12px 40px",
            fontSize: "18px",
          }}
        >
          Submit Requirements
        </Button>
      </Box>

    </Box>
  );
};

export default RequirementUploader;