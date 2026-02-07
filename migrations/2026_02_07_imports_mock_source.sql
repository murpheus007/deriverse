-- Extend imports.source_type to include 'mock'
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname
    INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.imports'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%source_type%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.imports DROP CONSTRAINT IF EXISTS %I', c_name);
  END IF;
END $$;

ALTER TABLE public.imports
  ADD CONSTRAINT imports_source_type_check
  CHECK (source_type IN ('csv', 'indexer', 'api', 'manual', 'mock'));
