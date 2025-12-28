# Naija Merit Backend Walkthrough

The backend for Naija Merit is now set up with NestJS and Prisma. Here is how to verify the functionality.

## Prerequisites
1.  Ensure dependencies are installed: `npm install`
2.  Database is synced: `npx prisma db push`
3.  Start server: `npm run start:dev` (Server runs on http://localhost:3000)

## API Endpoints

### 1. Authentication
*   **Register**
    *   `POST /api/v1/auth/register`
    *   Body: `{ "email": "student@example.com", "password": "securePass123", "role": "student", "fullName": "New Student" }`
*   **Login**
    *   `POST /api/v1/auth/login`
    *   Body: `{ "email": "student@example.com", "password": "securePass123" }`
    *   **Response**: Returns `{ access_token, user }`. Use `access_token` as Bearer token for protected routes.
*   **Verify NIN**
    *   `POST /api/v1/auth/verify-nin`
    *   Body: `{ "userId": "UUID_FROM_LOGIN", "nin": "20014567890" }`
*   **Password Recovery**
    *   `POST /api/v1/auth/forgot-password` -> `{ "email": "..." }`
    *   `POST /api/v1/auth/reset-password` -> `{ "token": "TOKEN_FROM_CONSOLE", "newPassword": "..." }`
*   **Logout**
    *   `POST /api/v1/auth/logout`
    *   Header: `Authorization: Bearer <token>`
    *   Note: Token will be invalidated (blacklisted).

### 2. Students
*   **Create Student**
    *   `POST /student`
    *   Body: `{ "nin": "20014567890", "fullName": "Chukwudi Okonkwo", "email": "chukwudi@example.com" }`
*   **Get My Profile**
    *   `GET /api/v1/profile`
    *   Headers: `Authorization: Bearer <token>`
*   **Update My Profile**
    *   `PATCH /api/v1/profile`
    *   Body: `{ "fullName": "...", "isOpenToRecruiters": true }` (Set to true to allow recruiter requests)
*   **Upload Avatar (Generic)**
    *   `POST /api/v1/profile/avatar`
    *   Body: `multipart/form-data` -> `file`: (image) (userId is auto-extracted from token)

### 4. Public Users (Search)
*   **Search Users**
    *   `GET /api/v1/users?role=student&verified=true`
    *   `GET /api/v1/users/:id`
    *   Returns sanitized profile (Redacted) unless viewer is Admin OR Recruiter with Approved Access.

### 5. Access Control (Privacy)
*   **Request Access (Recruiter)**
    *   `POST /api/v1/access/request/:studentId`
    *   Requires student.isOpenToRecruiters = true.
*   **Approve Request (Admin)**
    *   `PATCH /api/v1/access/approve/:requestId`
*   **View Pending Requests (Admin)**
    *   `GET /api/v1/access/pending`
*   **Note**: Once approved, Recruiter gets full view of student profile via `GET /api/v1/users/:id`.

### 3. Institutions (Schools)
*   **Register School (Admin)**
    *   `POST /institution`
    *   Body: `{ "name": "Kings College", "type": "Secondary", "state": "Lagos" }`
    *   **Response**: `{ institution: {...}, credentials: { loginId: "admin_x@kings.com", password: "Password@123" } }`
    *   *Note: Save these credentials immediately!*
*   **Bulk Upload Students (School Admin)**
    *   `POST /institution/:id/students`
    *   Body: `[ { "fullName": "Student A", "email": "a@school.com", "nin": "..." }, ... ]`
    *   *Requires School Admin Token.*
*   **Get Analytics (School Admin)**
    *   `GET /institution/:id/analytics`
    *   Returns student count, record count, etc.
*   **List Schools (Public)**
    *   `GET /institution`

### 2. Academic Records
*   **Base URL**: `/api/v1/academics`
*   **Add Record (School/Admin/Teacher Only)**
    *   `POST /`
    *   Body: `{ "studentId": "...", "institutionId": "...", "subject": "Math", "score": 95, "session": "2023/2024", "term": "1st" }`
*   **Get My Records (Student)**
    *   `GET /my` (Auth Token Required)
*   **Get Student Records (Secure)**
    *   `GET /:studentId`
    *   **Access Rules**:
        *   Allowed if: Self, Admin, School Admin.
        *   Allowed if: Recruiter WITH Approved Access.
        *   Denied otherwise.
*   **Verify Record (School/Admin Only)**
    *   `POST /verify/:id`
    *   Marks record as authentic (`isVerified: true`, `verifiedBy: adminId`).
*   **Update Record (School/Admin Only)**
    *   `PATCH /:id`
    *   Body: `{ "score": 98 }`

### 5. Extracurriculars
*   **Base URL**: `/api/v1/extracurriculars`
*   **Add Activity**
    *   `POST /`
    *   Body: `{ "title": "Math Club", "category": "Academic", "role": "President", "date": "2024-01-01", "proofUrl": "http://image.url" }`
*   **Get My Activities**
    *   `GET /my`
*   **Verify Activity (Admin)**
    *   `POST /verify/:id`
    *   Marks as verified.

### 6. Events (Competitions, Hackathons)
*   **Base URL**: `/api/v1/events`
*   **Create Event (Organizer Only)**
    *   `POST /`
    *   Body: `{ "name": "Hackathon 2024", "type": "hackathon", "date": "...", "recognized": true }`
    *   *Requires Verified Organizer Account.*
*   **Add Participant/Result (Organizer Only)**
    *   `POST /:id/participants`
    *   Body: `{ "studentId": "UUID", "position": "1st Place", "score": 98.5, "award": "Gold Medal" }`
*   **List Events (Public)**
    *   `GET /`
*   **View Results**
    *   `GET /:id/results`
    *   Returns rankings/results for specific event.

### 7. Super Admin Management
*   **Base URL**: `/api/v1/admin`
*   **Authentication**: All endpoints require JWT + role verification

#### Admin Creation & Management (Super Admin Only)

*   **Create Admin**
    *   `POST /create-admin`
    *   Body: 
    ```json
    {
      "email": "admin@example.com",
      "fullName": "Admin Name",
      "password": "secure123",
      "permissions": ["verify_records", "manage_institutions"]
    }
    ```
    *   Only `super_admin` can create admin accounts

*   **List Admins** - `GET /admins` (Super Admin Only)
*   **Update Permissions** - `PATCH /admins/:id/permissions` (Super Admin Only)
*   **Delete Admin** - `DELETE /admins/:id` (Super Admin Only)

#### User & Role Management (Super Admin Only)

*   **Approve Role**
    *   `POST /approve-role/:userId`
    *   Body: `{ "role": "school_admin" }`
    *   Approves school/company/event organizer accounts
    *   Automatically sets `isVerified: true`

*   **Manage All Users**
    *   `GET /users`
    *   Optional filters: `{ "role": "student", "isVerified": true }`
    *   Returns all users in the system

*   **Recognize Event**
    *   `POST /recognize-event/:eventId`
    *   Marks event as officially recognized (affects student scoring)
    *   Sets `isRecognized: true` on the event


#### Permission Types

```javascript
[
  'manage_users',          // Manage user profiles
  'manage_institutions',   // Create/edit institutions  
  'verify_records',        // Verify academic/extracurricular records
  'manage_events',         // Create/manage events
  'view_analytics',        // View system analytics
  'manage_access_requests' // Approve/reject recruiter access
]
```

**Super Admin**: Has ALL permissions implicitly.

#### Protected Endpoints

- `POST /institution` → Requires `manage_institutions`
- `POST /academics/verify/:id` → Requires `verify_records`
- `POST /extracurriculars/verify/:id` → Requires `verify_records`

### 8. Rankings & Scoring System
*   **Base URL**: `/api/v1/rankings`

#### Endpoints

*   **National Leaderboard** (Public)
    *   `GET /national?limit=100&level=ss3`
    *   Returns ranked list of students by total score
    *   Optional filters: `limit` (default: 100), `level` (e.g., 'ss3', 'undergraduate')
    *   Response includes: rank, student info, scores breakdown

*   **My Position** (Student Only)
    *   `GET /my-position`
    *   Returns authenticated student's ranking position
    *   Includes: rank, percentile, total students, score breakdown

#### Scoring System Breakdown

**Total Score Components**:

1. **School Grades** (Max: 5 points)
   - Based on class percentile ranking
   - Top 5% = 5 pts, Top 10% = 4 pts, Top 25% = 3 pts, Top 50% = 2 pts, Bottom 50% = 1 pt

2. **CGPA** (Max: 40 points with multiplier)
   - Base: `(Student CGPA / Max CGPA) × 40`
   - Percentile multiplier: Top 5% = ×1.5, Top 10% = ×1.3, Top 25% = ×1.2

3. **Exam Bodies** (Max: 20-40 points)
   - **JAMB/UTME**: `(Score / 400) × 40` (e.g., 300+ = 30 points)
   - **WAEC/NECO**: Grade points system
     - A1=7, B2=6, B3=5, C4=4, C5=3, C6=2, D7=1, E8=0
     - Formula: `(Sum of grade points / Max possible) × 20`

4. **Extracurriculars**
   - **Student-uploaded (admin verified)**: 2 points per activity
   - **Institution-uploaded**: 
     - Primary school: 1 point
     - Secondary school: 2 points
     - Tertiary institution: 3 points

5. **Competitions & Events** (Tiered, 1-10 points)
   - **Tier 1 (Elite)**: National/International events
     - 1st place: 10 points
     - 2nd place: 9 points
     - 3rd place: 8 points
     - **Participants**: 5 points
   - **Tier 2 (High)**: State/Regional events
     - 1st place: 7 points
     - 2nd place: 6 points
     - 3rd place: 5 points
     - **Participants**: 3 points
   - **Tier 3 (Strong)**: Events with certificate/award
     - 1st with award: 4 points
     - 2nd with award: 3 points
     - 3rd with award: 2 points
     - **Participants**: 1 point
   - **Tier 4 (Basic)**: General participation = 1 point
   - *Note*: Only recognized events (`isRecognized: true`) count

**Important Notes**:
- **Best Sitting Only**: For WAEC/NECO/JAMB, only the best sitting (grouped by session) is counted
- **CGPA Scale**: Institutions can set their CGPA scale (default 5.0)
- **Class Percentile**: Real percentile calculated from `classRank` and `classSize` in academic records

**Tie-Breaker**: CGPA is used to break ties in total score.

### 9. Companies & Recruiters Module
*   **Base URLs**: `/api/v1/companies`, `/api/v1/recruitment`, `/api/v1/students`

#### Company Registration

*   **Register Company** (Recruiter/Company Role)
    *   `POST /companies`
    *   Body: `{ "name": "TechCorp", "industry": "Technology", "website": "techcorp.com", "description": "..." }`
    *   Creates company profile linked to recruiter's account
    *   One company per recruiter profile

#### Student Search & Shortlisting

*   **Advanced Student Search** (Recruiter Only)
    *   `GET /students/search?gpa=3.5&region=lagos&minScore=85`
    *   Filters:
      - `gpa`: Minimum CGPA
      - `minScore`: Minimum total score
      - `region`: State/region filter
      - `skills`: Skills keyword (future enhancement)
      - `level`: Academic level filter
    *   **Access Control**:
      - Only returns students with `isOpenToRecruiters: true`
      - `hasFullAccess` flag indicates if recruiter has approved access request
      - Basic info always visible, full profile requires approved AccessRequest

*   **Create Shortlist** (Recruiter Only)
    *   `POST /recruitment/shortlist`
    *   Body: `{ "studentIds": ["uuid1", "uuid2"], "notes": "Top candidates" }`
    *   Only students with `isOpenToRecruiters: true` can be shortlisted
    *   Tracks status: shortlisted, interviewed, offered, rejected

*   **View My Shortlists** (Recruiter Only)
    *   `GET /recruitment/my-shortlists`
    *   Returns all shortlisted students for the recruiter's company

#### Access Control Summary

> [!IMPORTANT]
> **Two-Layer Protection for Student Privacy**:
> 1. **`isOpenToRecruiters` flag**: Students must opt-in to be searchable
> 2. **AccessRequest system**: Recruiters must request and receive admin approval to view full profiles
> 
> Recruiters can only see basic info (name, score) without approval. Full academic records, contact details require approved access request.

## Next Steps
-   Frontend integration (Next.js).
-   Add robust JWT Authentication.
-   Implement File Uploads (for result proofs).
