-- Add 'timeout' to deployment status enum
ALTER TABLE shipkit_deployments 
DROP CONSTRAINT IF EXISTS shipkit_deployments_status_check;

ALTER TABLE shipkit_deployments 
ADD CONSTRAINT shipkit_deployments_status_check 
CHECK (status IN ('deploying', 'completed', 'failed', 'timeout'));