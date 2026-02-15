-- Add encrypted provider API key storage for model registry entries.
-- Keys are encrypted application-side before insert/update.

ALTER TABLE public.model_registry
  ADD COLUMN IF NOT EXISTS api_key_ciphertext text,
  ADD COLUMN IF NOT EXISTS api_key_last4 text;

