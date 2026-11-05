# Security Specification & Threat Model — ARIQ Institutional System

## 1. Data Invariants & Zero-Trust Architecture
1. **Public Read-Only Access**:
   - Visitors can read `institutional_settings`, `news_categories`, published news (`news` where `estado == 'publicada'`), active courses (`courses`), and published events (`events`).
   - Unauthenticated or non-staff users CANNOT read drafts, internal notes, subscriber/applicant personal data (PII), or audit logs.
2. **PII Isolation & Applicant Protection**:
   - Course registrations (`course_registrations`) contain DNI, phone numbers, and emails.
   - Public visitors can INSERT a new registration with valid fields.
   - Only staff users (`admin`, `editor`, `operador`) can list or view registrations.
   - Public visitors CANNOT scrape or query the collection of registrations.
3. **Contact Inquiries**:
   - Public visitors can INSERT contact messages (`contact_messages`).
   - Only authenticated staff can read, search, update status, or add internal notes.
4. **Settings & Profiles Protection**:
   - Only `admin` can modify `institutional_settings` and `profiles`.
   - Normal users or operators cannot escalate themselves to `admin`.
5. **Auditing (`internal_logs`)**:
   - Logs are append-only by authenticated staff and readable only by `admin`. No deletions allowed.

## 2. The "Dirty Dozen" Threat Payloads (Blocked Invariants)
1. **Payload 01 (Ghost Privilege Escalation)**: Public user writes to `/profiles/{uid}` with `role: "admin"`.
   - *Expected*: PERMISSION_DENIED.
2. **Payload 02 (Draft Leak via List Query)**: Anonymous client executes `getDocs(collection('news'))` without filtering `estado == 'publicada'`.
   - *Expected*: PERMISSION_DENIED.
3. **Payload 03 (Registration Scraping)**: Anonymous visitor queries `/course_registrations`.
   - *Expected*: PERMISSION_DENIED.
4. **Payload 04 (Internal Notes Tampering)**: Visitor updates `/contact_messages/{id}` to set `notas_internas: "bypass"`.
   - *Expected*: PERMISSION_DENIED.
5. **Payload 05 (Setting Defacement)**: Authenticated `operador` updates `/institutional_settings/ariq_main`.
   - *Expected*: PERMISSION_DENIED.
6. **Payload 06 (Course Deletion by Operator)**: `operador` attempts `deleteDoc('/courses/{id}')`.
   - *Expected*: PERMISSION_DENIED.
7. **Payload 07 (Fake Audit Injection)**: Unauthenticated visitor writes to `/internal_logs`.
   - *Expected*: PERMISSION_DENIED.
8. **Payload 08 (ID Poisoning Attack)**: Attacker attempts write with a 2048-byte malicious document ID.
   - *Expected*: PERMISSION_DENIED via `isValidId()`.
9. **Payload 09 (Oversized Payload / Denial of Wallet)**: Attacker submits 500KB JSON payload to `/contact_messages`.
   - *Expected*: PERMISSION_DENIED via `.size() <= 2000` text limit.
10. **Payload 10 (Audit Log Deletion)**: Any user attempts `deleteDoc('/internal_logs/{id}')`.
    - *Expected*: PERMISSION_DENIED.
11. **Payload 11 (Unpublished Event Modification)**: Non-authenticated client modifies `/events/{id}`.
    - *Expected*: PERMISSION_DENIED.
12. **Payload 12 (Self-Assigned Role Mutation)**: User updates own profile document changing `role: 'editor'` to `'admin'`.
    - *Expected*: PERMISSION_DENIED.
