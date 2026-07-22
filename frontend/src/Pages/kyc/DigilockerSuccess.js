import React, { useEffect } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import api from "../../services/api";

const DigilockerSuccess = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const id = searchParams.get("id");

      console.log("DIGILOCKER ID:", id);

      // POLLING
      const interval = setInterval(async () => {
        const statusResponse = await api.get(
          `/digilocker/status/${id}`
        );

        const statusData = statusResponse.data.data;

        console.log("STATUS:", statusData);

        if (
          statusData.status === "authenticated"
        ) {
          clearInterval(interval);

          // FETCH AADHAAR
          // CVL KRA: pass application_id so backend can upload Aadhaar XML to S3
          const applicationId = localStorage.getItem("application_id");
          const aadhaarResponse = await api.get(
            `/digilocker/aadhaar/${id}${applicationId ? `?application_id=${applicationId}` : ``}`
          );

          const aadhaarData =
            aadhaarResponse.data.data.aadhaar;

          console.log(
            "AADHAAR DATA:",
            aadhaarData
          );

          navigate("/digilocker-details", {
            state: {
              digilockerData: aadhaarData,
            },
          });
        }
      }, 3000);
    } catch (error) {
      console.log(
        error.response?.data || error.message
      );
    }
  };

  return (
    <div className="container py-5 text-center">
      <h3>
        Fetching DigiLocker Details...
      </h3>
    </div>
  );
};

export default DigilockerSuccess;