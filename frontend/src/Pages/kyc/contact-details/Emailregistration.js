import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../../../services/api";

import emailregistration from "../../../assets/emailregistration.png";
import otp from "../../../assets/otp.png";
import exclamatory from "../../../assets/exclamatory.png";

import KycStepper from "../../../Components/kyc/KycStepper";

import KycInfoSection from "../../../Components/kyc/KycInfoSection";

const Emailregistration = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [applicationId, setApplicationId] = useState("");

  const [formData, setFormData] = useState({
    email: "",

    terms_accepted: false,
  });

  const [errors, setErrors] = useState({
    email: "",

    terms_accepted: "",

    general: "",
  });

  useEffect(() => {
    const savedApplicationId =
      location.state?.application_id || localStorage.getItem("application_id");

    if (!savedApplicationId) {
      navigate("/numberregistration");

      return;
    }

    setApplicationId(savedApplicationId);
    localStorage.setItem("application_id", String(savedApplicationId));
  }, [location.state, navigate]);

  const validateForm = () => {
    const newErrors = {
      email: "",

      terms_accepted: "",

      general: "",
    };

    let isValid = true;

    // EMAIL CHECK
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";

      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter valid email";

      isValid = false;
    }

    // TERMS CHECK
    if (!formData.terms_accepted) {
      newErrors.terms_accepted = "Please accept the Terms & Conditions to continue.";

      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,

      [name]: type === "checkbox" ? checked : value,
    }));

    // CLEAR ERROR
    setErrors((prev) => ({
      ...prev,

      [name]: "",

      general: "",
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const emailValue = formData.email.trim().toLowerCase();
      console.log("EMAIL VALUE:", emailValue);

      localStorage.setItem("email", emailValue);

      const savedEmail = localStorage.getItem("email");
      console.log("SAVED EMAIL:", savedEmail);

      if (!savedEmail) {
        setErrors((prev) => ({
          ...prev,
          general: "Email storage failed",
        }));
        return;
      }

      await api.post("/contact/send-email-otp", {
        application_id: applicationId,

        email: emailValue,

        terms_accepted: formData.terms_accepted,
      });
      toast.success("Email OTP sent successfully");

      navigate("/emailotp", {
        state: {
          email: emailValue,

          application_id: applicationId,
        },
      });
    } catch (error) {
      console.log("EMAIL ERROR:", error);

      setErrors((prev) => ({
        ...prev,

        general: error.response?.data?.message || "Failed to send email OTP",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container'>
      <KycStepper currentStep='contact' completedSteps={[]} />

      <div className='row'>
        {/* LEFT IMAGE */}
        <div className='col-lg-6 image-column'>
          <img
            src={emailregistration}
            alt='email-registration'
            className='emailregistrationimg'
          />
        </div>

        {/* RIGHT FORM */}
        <div className='col-lg-6 forms-card'>
          <div className='register-card'>
            <div className='logo-section'>
              <h2 className='text-center mb-4'>Email Address</h2>
            </div>

            {/* GOOGLE LOGIN */}
            {/* <div className='google-login-container'>
              <button className='google-btn' type='button'>
                <img
                  src='https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
                  alt='google'
                  className='google-icon'
                />
                Sign in with Google
              </button>

              <div className='divider'>
                <span>or</span>
              </div>
            </div> */}

            {/* EMAIL INPUT */}
            <div className='input-container'>
              <input
                type='email'
                name='email'
                className='input-field'
                placeholder='Enter your Mail ID'
                value={formData.email}
                onChange={handleChange}
              />

              <label className='floating-label'>
                Enter your Mail ID <span>*</span>
              </label>

              {errors.email && <p className='error-text'>{errors.email}</p>}
            </div>

            {/* TERMS */}
            <div className='d-flex checkbox-content' style={{ position: 'relative' }}>
              <input
                type='checkbox'
                id='terms'
                name='terms_accepted'
                className='checkbox'
                checked={formData.terms_accepted}
                onChange={handleChange}
              />

              <div className='terms-wrapper' style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <label htmlFor='terms' style={{ margin: 0, paddingRight: '4px' }}>
                  Accept all
                </label>
                <span 
                  className='terms-text'
                  onClick={(e) => {
                    e.preventDefault();
                    setShowModal(true);
                  }}
                  style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                >
                  Terms & Conditions*
                </span>

                {showModal && (
                  <div className="terms-popup" style={{
                      display: 'block',
                      position: 'absolute', top: '100%', left: '0', 
                      background: '#fff', border: '1px solid #ccc', padding: '15px', 
                      borderRadius: '5px', zIndex: 10, marginTop: '5px', width: '100%',
                      boxShadow: '0px 4px 6px rgba(0,0,0,0.1)'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                       <strong style={{ fontSize: '14px', color: '#000' }}>Terms & Conditions</strong>
                       <span style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }} onClick={() => setShowModal(false)}>✕</span>
                    </div>
                    <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>
                      I hereby give my consent to undertake the online KYC process for
                      opening a Trading/Demat account with Aionion Capital Market Services
                      Private Limited. I am voluntarily providing this email ID and mobile
                      number to AIONION CAPITAL MARKET SERVICES PRIVATE LIMITED for
                      communication purposes. I confirm that the provided email ID and
                      mobile number belong solely to me. I request all formal, informal, and
                      promotional communications to be sent to the provided email ID and
                      mobile number. Additionally, I voluntarily authorize AIONION CAPITAL
                      MARKET SERVICES PRIVATE LIMITED to send all trading and
                      transaction-related statements to this mobile number.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* TERMS ERROR */}
            {errors.terms_accepted && (
              <p className='error-text'>{errors.terms_accepted}</p>
            )}

            {/* GENERAL ERROR */}
            {errors.general && <p className='error-text'>{errors.general}</p>}

            {/* BUTTON */}
            <div onClick={() => { if (!formData.terms_accepted) validateForm(); }}>
              <button
                className='submit-btn'
                onClick={handleSubmit}
                disabled={loading || !formData.terms_accepted}
                type='button'
                style={{
                  pointerEvents: !formData.terms_accepted ? 'none' : 'auto',
                  opacity: !formData.terms_accepted ? 0.6 : 1
                }}
              >
                <img src={otp} alt='otp' className='btn-icon' />

                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>

            <div className='note-section'>
              <p>
                <strong style={{ fontSize: "16px" }}>Note :</strong>
              </p>
              <p className='aadhaar-text'>
                <span className='star-icon'>*</span> Online account opening
                requires your number to be linked with Aadhaar. You can check if
                your mobile number is linked to Aadhaar{" "}
                <a
                  href='https://myaadhaar.uidai.gov.in/verify-email-mobile'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='link-here'
                >
                  here
                </a>
                . If your mobile number isn't linked to Aadhaar, please open
                your account offline.
              </p>
            </div>
          </div>
        </div>
      </div>

      <KycInfoSection />
    </div>
  );
};

export default Emailregistration;
