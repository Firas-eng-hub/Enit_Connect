-- Security fix (pentest M-05): admin passwords were stored and compared in plaintext.
-- Hash every remaining plaintext admin password with bcrypt via pgcrypto.
-- pgcrypto's crypt(..., gen_salt('bf')) yields $2a$ hashes that node `bcrypt` verifies.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE admins
SET password = crypt(password, gen_salt('bf', 10)),
    updated_at = now()
WHERE password IS NOT NULL
  AND password NOT LIKE '$2%';
