DO $$
BEGIN
    -- Attempt to create the vector extension if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        CREATE EXTENSION vector;
    END IF;

    -- Add the embedding column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'guide_guide_entry'
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE guide_guide_entry ADD COLUMN embedding vector(1536);
    END IF;

    -- Create the index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'guide_guide_entries_embedding_idx'
    ) THEN
        CREATE INDEX guide_guide_entries_embedding_idx ON guide_guide_entry USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
    END IF;

EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privileges to create vector extension. Please contact your database administrator.';
    WHEN undefined_function THEN
        RAISE NOTICE 'Vector extension not available. Please ensure the vector extension is installed on the database server.';
    WHEN OTHERS THEN
        RAISE NOTICE 'An error occurred: %', SQLERRM;
END $$;
