const insertEsignAuditLogQuery = `
  INSERT INTO public.esign_audit_logs (
    application_id,
    kyc_name,
    aadhaar_esign_name,
    match_percentage,
    validation_status,
    failure_reason,
    created_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, NOW())
  RETURNING *;
`;

module.exports = {
  insertEsignAuditLogQuery
};
