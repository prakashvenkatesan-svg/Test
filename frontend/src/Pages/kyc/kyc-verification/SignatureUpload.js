import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import KycStepper from "../../../Components/kyc/KycStepper";
import signatureupload from "../../../assets/signatureupload.png";
import { getApiBaseUrl } from "../../../services/api";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const getSourceSize = (source) => ({
  width: source.videoWidth || source.naturalWidth || source.width || 0,
  height: source.videoHeight || source.naturalHeight || source.height || 0,
});

/**
 * Checks whether an image contains a usable signature.
 * This is client-side UX validation only. Repeat the same validation on the
 * backend before storing the file or running PAN signature matching.
 */
const analyseSignatureImage = (source, sourceType = "upload") => {
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(source);

  if (!sourceWidth || !sourceHeight) {
    return {
      valid: false,
      message:
        "The selected image could not be read. Please try another image.",
    };
  }

  if (sourceType === "capture" && (sourceWidth < 640 || sourceHeight < 360)) {
    return {
      valid: false,
      message:
        "Camera resolution is too low. Please clean the camera lens and capture again.",
    };
  }

  if (sourceType === "upload" && (sourceWidth < 200 || sourceHeight < 80)) {
    return {
      valid: false,
      message:
        "The signature image is too small. Please upload a clearer, higher-resolution image.",
    };
  }

  const analysisCanvas = document.createElement("canvas");
  const analysisWidth = 600;
  const analysisHeight = 240;

  analysisCanvas.width = analysisWidth;
  analysisCanvas.height = analysisHeight;

  const context = analysisCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    return {
      valid: false,
      message: "Image validation is not supported in this browser.",
    };
  }

  // Flatten transparent PNGs onto white so a transparent blank image is caught.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, analysisWidth, analysisHeight);
  context.drawImage(source, 0, 0, analysisWidth, analysisHeight);

  const imageData = context.getImageData(0, 0, analysisWidth, analysisHeight);
  const pixels = imageData.data;

  // For camera capture, validate the central area where the user is instructed
  // to place the signed paper. This reduces false positives from desk edges.
  const startX =
    sourceType === "capture" ? Math.floor(analysisWidth * 0.08) : 0;
  const endX =
    sourceType === "capture" ? Math.ceil(analysisWidth * 0.92) : analysisWidth;
  const startY =
    sourceType === "capture" ? Math.floor(analysisHeight * 0.12) : 0;
  const endY =
    sourceType === "capture"
      ? Math.ceil(analysisHeight * 0.88)
      : analysisHeight;

  const regionWidth = endX - startX;
  const regionHeight = endY - startY;
  const totalPixels = regionWidth * regionHeight;

  let brightnessTotal = 0;
  let brightnessSquaredTotal = 0;
  let darkPixels = 0;
  let strongEdges = 0;
  let minX = endX;
  let minY = endY;
  let maxX = -1;
  let maxY = -1;

  const getBrightness = (x, y) => {
    const index = (y * analysisWidth + x) * 4;
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];

    return 0.299 * red + 0.587 * green + 0.114 * blue;
  };

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const brightness = getBrightness(x, y);

      brightnessTotal += brightness;
      brightnessSquaredTotal += brightness * brightness;

      // Dark enough to be ink, while ignoring minor JPEG/off-white noise.
      if (brightness < 210) {
        darkPixels += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }

      if (x > startX && y > startY) {
        const leftDifference = Math.abs(brightness - getBrightness(x - 1, y));
        const topDifference = Math.abs(brightness - getBrightness(x, y - 1));

        if (leftDifference > 35 || topDifference > 35) {
          strongEdges += 1;
        }
      }
    }
  }

  const averageBrightness = brightnessTotal / totalPixels;
  const brightnessVariance = Math.max(
    0,
    brightnessSquaredTotal / totalPixels - averageBrightness ** 2,
  );
  const contrast = Math.sqrt(brightnessVariance);
  const inkRatio = darkPixels / totalPixels;
  const signatureWidth = maxX >= 0 ? maxX - minX + 1 : 0;
  const signatureHeight = maxY >= 0 ? maxY - minY + 1 : 0;

  if (averageBrightness < 55) {
    return {
      valid: false,
      message:
        "The image is too dark. Capture the signature again in better lighting.",
    };
  }

  if (darkPixels < 120 || inkRatio < 0.001 || contrast < 5) {
    return {
      valid: false,
      message:
        "No signature was detected. Please provide a clear signature on a plain background.",
    };
  }

  if (inkRatio > (sourceType === "capture" ? 0.3 : 0.45)) {
    return {
      valid: false,
      message:
        "The background is too dark or noisy. Use plain white paper and capture only the signature.",
    };
  }

  if (signatureWidth < 60 || signatureHeight < 10) {
    return {
      valid: false,
      message:
        "The signature is too small or incomplete. Please provide your complete signature.",
    };
  }

  if (sourceType === "capture" && strongEdges < 60) {
    return {
      valid: false,
      message:
        "The captured signature appears blurred. Hold the camera steady and capture again.",
    };
  }

  return {
    valid: true,
    metrics: {
      averageBrightness,
      contrast,
      inkRatio,
      signatureWidth,
      signatureHeight,
      strongEdges,
    },
  };
};

const loadImageFile = (imageFile) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(imageFile);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("INVALID_IMAGE"));
    };

    image.src = objectUrl;
  });

const validateImageFile = async (imageFile, sourceType) => {
  if (!imageFile || imageFile.size === 0) {
    return {
      valid: false,
      message: "The selected image is empty. Please choose another image.",
    };
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(imageFile.type) &&
    !/\.(jpe?g|png)$/i.test(imageFile.name)
  ) {
    return {
      valid: false,
      message: "Only JPG, JPEG and PNG signature images are allowed.",
    };
  }

  if (imageFile.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: "File size must be less than 2 MB.",
    };
  }

  try {
    const image = await loadImageFile(imageFile);
    return analyseSignatureImage(image, sourceType);
  } catch {
    return {
      valid: false,
      message:
        "The selected file is not a valid image. Please choose a JPG, JPEG or PNG image.",
    };
  }
};

const SignatureUpload = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(
    window.innerWidth <= 1024,
  );

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPointRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const capturedPreviewRef = useRef("");
  const strokeStatsRef = useRef({ strokes: 0, points: 0, distance: 0 });

  const replaceCapturedPreview = (nextPreview = "") => {
    if (capturedPreviewRef.current) {
      URL.revokeObjectURL(capturedPreviewRef.current);
    }

    capturedPreviewRef.current = nextPreview;
    setCapturedPreview(nextPreview);
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobileOrTablet = window.innerWidth <= 1024;

      setIsMobileOrTablet(mobileOrTablet);

      if (!mobileOrTablet && activeTab === "capture") {
        setActiveTab("upload");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "capture") {
      stopCamera();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !cameraStreamRef.current) {
      return undefined;
    }

    const video = videoRef.current;
    video.srcObject = cameraStreamRef.current;

    video.play().catch((cameraError) => {
      console.error(cameraError);
      setError("Unable to start the camera preview. Please try again.");
      stopCamera();
    });

    return undefined;
  }, [cameraActive]);

  useEffect(
    () => () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (capturedPreviewRef.current) {
        URL.revokeObjectURL(capturedPreviewRef.current);
      }
    },
    [],
  );

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setError("");
  };

  const clearOtherMethods = (selectedMethod) => {
    if (selectedMethod !== "upload") {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    if (selectedMethod !== "draw") {
      setSignatureImage(null);
    }

    if (selectedMethod !== "capture") {
      setCapturedPhoto(null);
      replaceCapturedPreview("");
    }
  };

  // ==========================
  // Upload Signature File
  // ==========================
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setValidating(true);
    setError("");

    const result = await validateImageFile(selectedFile, "upload");

    if (!result.valid) {
      setFile(null);
      event.target.value = "";
      setError(result.message);
      setValidating(false);
      return;
    }

    clearOtherMethods("upload");
    setFile(selectedFile);
    setValidating(false);
  };

  const removeSelectedFile = () => {
    setFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ==========================
  // Signature Pad
  // ==========================
  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = event.touches?.[0] || event.changedTouches?.[0] || event;

    return {
      x: (point.clientX - rect.left) * (canvas.width / rect.width),
      y: (point.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const point = getCoordinates(event);

    isDrawing.current = true;
    lastPointRef.current = point;
    strokeStatsRef.current.strokes += 1;

    context.beginPath();
    context.moveTo(point.x, point.y);

    clearOtherMethods("draw");
    setError("");
  };

  const draw = (event) => {
    if (!isDrawing.current) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const point = getCoordinates(event);
    const previousPoint = lastPointRef.current;

    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#101010";
    context.lineTo(point.x, point.y);
    context.stroke();

    if (previousPoint) {
      strokeStatsRef.current.distance += Math.hypot(
        point.x - previousPoint.x,
        point.y - previousPoint.y,
      );
    }

    strokeStatsRef.current.points += 1;
    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;

    isDrawing.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    isDrawing.current = false;
    lastPointRef.current = null;
    strokeStatsRef.current = { strokes: 0, points: 0, distance: 0 };
    setSignatureImage(null);
    setError("");
  };

  const validateSignaturePad = () => {
    const canvas = canvasRef.current;
    const { strokes, points, distance } = strokeStatsRef.current;

    if (!canvas || !signatureImage) {
      return { valid: false, message: "Please draw your signature." };
    }

    if (strokes < 1 || points < 5 || distance < 50) {
      return {
        valid: false,
        message:
          "The drawn signature is too short. Please draw your complete signature.",
      };
    }

    return analyseSignatureImage(canvas, "draw");
  };

  // ==========================
  // Camera Functions
  // ==========================
  const openCamera = async () => {
    try {
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not supported in this browser.");
        return;
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 360 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraActive(true);
    } catch (cameraError) {
      console.error(cameraError);

      if (
        cameraError.name === "NotAllowedError" ||
        cameraError.name === "SecurityError"
      ) {
        setError("Camera permission was denied. Please allow camera access.");
      } else if (cameraError.name === "NotFoundError") {
        setError("No camera was found on this device.");
      } else if (cameraError.name === "OverconstrainedError") {
        setError("The camera does not support the required resolution.");
      } else {
        setError("Unable to open the camera. Please try again.");
      }
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const captureCanvas = cameraCanvasRef.current;

    if (
      !video ||
      !captureCanvas ||
      video.readyState < 2 ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setError("Camera is not ready. Please wait and try again.");
      return;
    }

    setValidating(true);
    setError("");

    const context = captureCanvas.getContext("2d");

    if (!context) {
      setError("Camera capture is not supported in this browser.");
      setValidating(false);
      return;
    }

    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    const validation = analyseSignatureImage(captureCanvas, "capture");

    if (!validation.valid) {
      setError(validation.message);
      setValidating(false);
      return;
    }

    captureCanvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Failed to capture the photo. Please try again.");
          setValidating(false);
          return;
        }

        const photoFile = new File(
          [blob],
          `signature-photo-${Date.now()}.jpg`,
          { type: "image/jpeg" },
        );
        const nextPreview = URL.createObjectURL(blob);

        clearOtherMethods("capture");
        setCapturedPhoto(photoFile);
        replaceCapturedPreview(nextPreview);
        setError("");
        setValidating(false);
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    replaceCapturedPreview("");
    setError("");
    openCamera();
  };

  // ==========================
  // Upload To Backend
  // ==========================
  const validateCurrentSelection = async () => {
    if (activeTab === "upload") {
      if (!file) {
        return { valid: false, message: "Please upload a signature image." };
      }

      return validateImageFile(file, "upload");
    }

    if (activeTab === "draw") {
      return validateSignaturePad();
    }

    if (!capturedPhoto) {
      return {
        valid: false,
        message: "Please capture your signature photo.",
      };
    }

    return validateImageFile(capturedPhoto, "capture");
  };

  const handleUpload = async () => {
    const applicationId = localStorage.getItem("application_id");

    if (!applicationId) {
      setError("Application ID is missing. Please restart the KYC process.");
      return;
    }

    try {
      setValidating(true);
      setError("");

      const validation = await validateCurrentSelection();

      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      setValidating(false);
      setUploading(true);

      const formData = new FormData();
      formData.append("application_id", applicationId);
      
      const signatureMethodMap = {
        upload: "upload_signature",
        draw: "signature_pad",
        capture: "capture_photo",
      };
      formData.append("signature_method", signatureMethodMap[activeTab]);

      if (activeTab === "draw") {
        formData.append("signature_base64", signatureImage);
      } else if (activeTab === "capture") {
        formData.append("signature", capturedPhoto);
      } else {
        formData.append("signature", file);
      }

      // Do not set Content-Type manually. Axios adds the multipart boundary.
      const response = await axios.post(
        `${getApiBaseUrl()}/signature/upload`,
        formData
      );

      if (response.data?.success) {
        navigate("/schemedetail");
        return;
      }

      setError(response.data?.message || "Failed to upload signature.");
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError.response?.data?.message ||
          "Failed to upload signature. Please try again.",
      );
    } finally {
      setValidating(false);
      setUploading(false);
    }
  };

  const submitDisabled = uploading || validating;

  return (
    <div className="container">
      <KycStepper
        currentStep="complete"
        completedSteps={["contact", "identify", "personal", "scheme"]}
      />

      <div className="row signature-upload-row">
        <div className="col-lg-6 upload-signature">
          <img
            src={signatureupload}
            alt="Signature upload illustration"
            className="signatureuploadimg"
          />
        </div>

        <div className="col-lg-6">
          <div className="esign-card signature-main-card">
            <h4 className="signature-page-title">Signature Upload</h4>

            <p className="signature-page-subtitle">
              Choose one method to submit your signature.
            </p>

            {error && (
              <div className="signature-error-box" role="alert">
                {error}
              </div>
            )}

            <div className="signature-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "upload"}
                className={`signature-tab ${
                  activeTab === "upload" ? "active" : ""
                }`}
                onClick={() => handleTabChange("upload")}
              >
                Upload Signature
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "draw"}
                className={`signature-tab ${
                  activeTab === "draw" ? "active" : ""
                }`}
                onClick={() => handleTabChange("draw")}
              >
                Signature Pad
              </button>

              {isMobileOrTablet && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "capture"}
                  className={`signature-tab ${
                    activeTab === "capture" ? "active" : ""
                  }`}
                  onClick={() => handleTabChange("capture")}
                >
                  Capture Photo
                </button>
              )}
            </div>

            <div className="signature-tab-content">
              {activeTab === "upload" && (
                <div className="signature-upload-content">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="signatureFile"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    hidden
                    onChange={handleFileChange}
                  />

                  <label
                    htmlFor="signatureFile"
                    className="signature-file-upload-box"
                  >
                    <div className="upload-file-icon">↑</div>
                    <p>Choose a Signature</p>
                    <small>JPG, JPEG or PNG up to 2 MB</small>
                    <span className="browse-file-btn">Browse File</span>
                  </label>

                  {file && (
                    <div className="selected-file-box">
                      <span className="selected-file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={removeSelectedFile}
                        aria-label="Remove selected signature"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "draw" && (
                <div className="signature-pad-content">
                  <div className="signature-pad-heading-row">
                    <label>Draw Your Signature</label>
                    <button
                      type="button"
                      className="clear-signature-btn"
                      onClick={clearSignature}
                    >
                      Clear
                    </button>
                  </div>

                  <div className="signature-canvas-wrapper">
                    <canvas
                      ref={canvasRef}
                      width={700}
                      height={220}
                      className="signature-canvas"
                      style={{ touchAction: "none" }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>

                  <p className="signature-pad-note">
                    Use your finger or mouse to sign inside the box.
                  </p>
                </div>
              )}

              {activeTab === "capture" && isMobileOrTablet && (
                <div className="signature-camera-content">
                  {!cameraActive && !capturedPreview && (
                    <div className="camera-start-box">
                      <div className="camera-icon">⌕</div>
                      <h5>Capture Signature Photo</h5>
                      <p>
                        Place the signed white paper in good lighting and keep
                        the complete signature in the centre.
                      </p>
                      <button
                        type="button"
                        className="camera-action-btn"
                        onClick={openCamera}
                      >
                        Open Camera
                      </button>
                    </div>
                  )}

                  {cameraActive && (
                    <div
                      className="camera-preview-wrapper"
                      style={{ position: "relative" }}
                    >
                      <video
                        ref={videoRef}
                        className="camera-video"
                        autoPlay
                        playsInline
                        muted
                      />

                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: "8%",
                          right: "8%",
                          top: "12%",
                          bottom: "12%",
                          border: "2px dashed rgba(255,255,255,0.9)",
                          borderRadius: "8px",
                          pointerEvents: "none",
                          boxShadow: "0 0 0 9999px rgba(0,0,0,0.12)",
                        }}
                      />

                      <div className="camera-buttons-row">
                        <button
                          type="button"
                          className="camera-cancel-btn"
                          onClick={stopCamera}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="camera-capture-btn"
                          onClick={capturePhoto}
                          disabled={validating}
                        >
                          {validating ? "Checking..." : "Capture Photo"}
                        </button>
                      </div>
                    </div>
                  )}

                  {capturedPreview && !cameraActive && (
                    <div className="captured-image-wrapper">
                      <img
                        src={capturedPreview}
                        alt="Captured signature"
                        className="captured-signature-image"
                      />
                      <button
                        type="button"
                        className="retake-photo-btn"
                        onClick={retakePhoto}
                      >
                        Retake Photo
                      </button>
                    </div>
                  )}

                  <canvas ref={cameraCanvasRef} hidden />
                </div>
              )}
            </div>

            <button
              type="button"
              className="upload-btn signature-submit-btn"
              onClick={handleUpload}
              disabled={submitDisabled}
            >
              {uploading
                ? "Uploading..."
                : validating
                  ? "Validating..."
                  : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureUpload;
