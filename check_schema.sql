-- Check if Phase 5 tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('session_invitations', 'challenges', 'skip_votes');

-- Check if invited_by column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'session_participants' 
AND column_name = 'invited_by';
