SELECT
  ordinal_position,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bse_data'
ORDER BY ordinal_position;



SELECT COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bse_data';



BEGIN;

DELETE FROM signature_uploads WHERE application_id = 49;
DELETE FROM pan_card_upload WHERE application_id = 49;

DELETE FROM digilocker_details WHERE application_id = '49';
DELETE FROM identity_verifications WHERE application_id = 49;

DELETE FROM nominee_details WHERE application_id = 49;
DELETE FROM personal_details WHERE application_id = 49;
DELETE FROM bank_details WHERE application_id = 49;
DELETE FROM payments_details WHERE application_id = 49;
DELETE FROM contact_details WHERE application_id = 49;

DELETE FROM kyc_process WHERE application_id = 49;

UPDATE stamp_paper_master
SET assigned_application_id = NULL
WHERE assigned_application_id = 49;

DELETE FROM kyc_applications WHERE id = 49;

COMMIT;