-- Fix legacy enum value in Payload features_plans before Payload enum change
-- Purpose: Ensure there are no rows with value = 'muscles' prior to Payload
-- attempting to change the column type to the new enum without 'muscles'.
-- This prevents errors like:
--   invalid input value for enum payload.enum_features_plans: "muscles"

-- Map deprecated plan value to a supported value
update "payload"."features_plans"
set "value" = 'bones'
where "value" = 'muscles';

-- Note:
-- - Payload's migration will handle altering the enum type afterwards.
-- - If you prefer to map to 'brains' instead, change the target above.

