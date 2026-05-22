# Registration and Login Flow

## Registration
1. User opens `/register`.
2. User fills the form: name, institution, phone, country, address, email, password.
3. Frontend sends `POST /api/auth/register`.
4. Backend validates:
   - all fields are filled
   - email format is valid
   - password is at least 8 characters
   - email is not already registered
5. Password is hashed with `bcrypt`.
6. User data is stored in table `pelanggan` with `status_registrasi='pending'`.
7. API returns success, frontend redirects to `/login`.

## Login
1. User opens `/login`.
2. User enters email and password.
3. Frontend sends `POST /api/auth/login`.
4. Backend checks account:
   - find email in table `pelanggan`
   - if not found, find in table `admin`
5. Backend verifies password (bcrypt, with plain-text fallback for initial seed rows).
6. If valid, backend sets `b2b_session` cookie (`httpOnly`) and returns `redirectTo`.
7. Frontend redirects:
   - `pelanggan` -> `/`
   - `admin` -> `/admin`
