# Naija Merit - National Academic Portfolio Platform

**Nigeria's unified digital academic portfolio system** — tracking every student's journey from kindergarten to PhD, across all schools, with verified grades, certificates, extracurricular achievements, competitions, and hackathons.

## 🎯 Overview

Naija Merit creates transparent national rankings that spotlight raw talent early, reward excellence, and open doors to scholarships, mentorships, and jobs. Employers and agencies gain instant access to authentic, tamper-proof records, reducing bias and making merit the true pathway to opportunity.

For the first time, Nigerian students own a lifelong, portable profile that celebrates their full potential—academic and beyond—empowering a fairer, brighter future for the nation's youth.

---

## 🏗️ System Architecture

### Technology Stack

- **Backend Framework**: NestJS (Node.js)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: JWT with Passport
- **File Storage**: Local/Static serving (expandable to cloud)
- **API Style**: RESTful

### Module Structure

```
src/
├── auth/              # Authentication & authorization
├── admin/             # Super admin management
├── profile/           # User profile management
├── user/              # Public user endpoints
├── student/           # Student-specific features
├── institution/       # School/university management
├── academic-record/   # Academic records & grades
├── extracurricular/   # Activities & achievements
├── event/             # Competitions & hackathons
├── ranking/           # National scoring & leaderboards
├── recruitment/       # Company & recruiter features
├── access-request/    # Privacy & access control
├── guards/            # Authentication guards
├── decorators/        # Custom decorators
└── prisma/            # Database client
```

---

## 📊 Database Schema

### Core Models

#### **Profile**
- Central user model for all roles (student, school_admin, recruiter, admin, super_admin, teacher, event-organizer)
- NIN-based identity verification
-  `isOpenToRecruiters` flag for privacy control
- Links to institutions, companies, academic records

#### **Institution**
- Schools, universities, exam bodies (WAEC, JAMB, NECO)
- Configurable CGPA scale for tertiary institutions
- Bulk student registration (skeletal profiles)

#### **AcademicRecord**
- Verified academic records with grades, scores, class rank
- Session-based tracking for multiple sittings
- Verification workflow (school/admin approval)

#### **ExtracurricularActivity**
- Student activities with proof upload
- Admin verification required for scoring
- Institution-level tracking (primary/secondary/tertiary)

#### **Event** (Competitions/Hackathons)
- Recognized and unrecognized events
- Tiered scoring system (Tier 1-4)
- Event organizer management

#### **Company & Shortlist**
- Recruiter company profiles
- Student shortlisting with status tracking
- Access control integration

#### **AccessRequest**
- Two-layer privacy protection system
- Recruiter → Student access requests
- Admin approval workflow

---

## 🔐 Authentication & Authorization

### User Roles

1. **Super Admin**: Full system access, creates admins, approves roles
2. **Admin**: Permission-based access (manage_users, verify_records, etc.)
3. **School Admin**: Manages institution records, bulk uploads
4. **Teacher**: Uploads student records
5. **Event Organizer**: Creates competitions, records results
6. **Recruiter/Company**: Searches students, creates shortlists
7. **Student**: Owns profile, uploads extracurriculars, claims records

### Authentication Flow

1. **Registration**: `POST /api/v1/auth/register`
   - Creates profile with `isVerified: false`
   - Returns JWT token

2. **Login**: `POST /api/v1/auth/login`
   - Email/password authentication
   - Returns JWT with role & verification status

3. **NIN Verification**: `POST /api/v1/auth/verify-nin`
   - Links NIN to profile
   - **Profile Claiming**: If NIN matches skeletal profile (school-created), migrates all records
   - Sets `isVerified: true`

4. **Role Approval**: `POST /api/v1/admin/approve-role/:userId`
   - Super admin approves school/company/organizer roles

### Guards & Permissions

- **JwtAuthGuard**: Protects all authenticated routes
- **PermissionGuard**: Checks specific permissions (e.g., `verify_records`)
- **SuperAdminGuard**: Restricts to super admin only

---

## 🎓 Core Features

### 1. **Lifelong Academic Records**

Schools upload student records → Verified by admins → Permanent storage
- Multiple exam sittings supported (best result counted)
- Class percentile calculations for rankings
- Institution-specific CGPA scales

### 2. **Profile Claiming System**

- Schools create "skeletal profiles" with just NIN + Name
- Students register normally with own credentials
- On NIN verification, **all school records automatically migrate** to student's account
- Enables kindergarten → PhD record continuity

### 3. **National Ranking System**

Sophisticated scoring algorithm:
- **School Grades** (5 pts): Percentile-based
- **CGPA** (40 pts): Institution scale + percentile multiplier
- **Exam Bodies** (20-40 pts): JAMB, WAEC/NECO best sittings
- **Extracurriculars** (2-3 pts): By institution level
- **Competitions** (1-10 pts): Tiered (National → Basic)

**Endpoints**:
- `GET /api/v1/rankings/national?limit=100` - Public leaderboard
- `GET /api/v1/rankings/my-position` - Student's personal rank

### 4. **Recruitment & Privacy**

**Two-Layer Protection**:
1. Students must set `isOpenToRecruiters: true`
2. Recruiters must request + receive admin approval for full profile access

**Features**:
- Advanced student search with filters (GPA, region, score)
- Shortlisting with status tracking
- `hasFullAccess` flag indicates approval status

---

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)
```http
POST   /register          # Create account
POST   /login             # Login
POST   /verify-nin        # Verify NIN & claim profile
POST   /forgot-password   # Request password reset
POST   /reset-password    # Reset password with token
POST   /logout            # Logout (token blacklist)
```

### Admin (`/api/v1/admin`)
```http
POST   /create-admin               # Create admin (super admin only)
GET    /admins                     # List all admins
PATCH  /admins/:id/permissions     # Update permissions
DELETE /admins/:id                 # Remove admin
POST   /approve-role/:userId       # Approve school/company/organizer
GET    /users                      # List all users (filtered)
POST   /recognize-event/:eventId   # Mark event as recognized
```

### Institutions (`/api/v1/institution`)
```http
POST   /                    # Register institution (admin)
GET    /                    # List all institutions
POST   /:id/students        # Bulk upload students (school admin)
GET    /:id/analytics       # Institution statistics
```

### Academic Records (`/api/v1/academics`)
```http
POST   /              # Add record (school/teacher)
GET    /my            # View own records (student)
GET    /:studentId    # View student's records (with access control)
PATCH  /:id           # Update record (school/admin)
POST   /verify/:id    # Verify record (requires permission)
```

### Extracurriculars (`/api/v1/extracurriculars`)
```http
POST   /              # Add activity (student/school/organizer)
GET    /my            # View own activities
GET    /:studentId    # View student's activities (access control)
POST   /verify/:id    # Verify activity (admin)
DELETE /:id           # Delete activity (owner/admin)
```

### Events (`/api/v1/events`)
```http
POST   /                      # Create event (verified organizer)
POST   /:id/participants      # Add participant/result (organizer)
GET    /                      # List recognized events (public)
GET    /:id/results           # View event results/rankings
```

### Rankings (`/api/v1/rankings`)
```http
GET    /national?limit=100    # National leaderboard (public)
GET    /my-position           # Personal ranking (student)
```

### Recruitment (`/api/v1/companies`, `/api/v1/recruitment`, `/api/v1/students`)
```http
POST   /companies                        # Register company (recruiter)
GET    /students/search?gpa=3.5&...      # Advanced search (recruiter)
POST   /recruitment/shortlist            # Shortlist students
GET    /recruitment/my-shortlists        # View shortlists
```

### Profile (`/api/v1/profile`)
```http
GET    /me                    # Get own profile
PATCH  /me                    # Update profile
POST   /me/avatar             # Upload avatar
PATCH  /me/recruiter-consent  # Toggle isOpenToRecruiters
```

### Access Requests (`/api/v1/access`)
```http
POST   /request/:studentId    # Request access (recruiter)
GET    /my-requests            # View sent requests
POST   /approve/:requestId     # Approve request (admin)
POST   /reject/:requestId      # Reject request (admin)
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- pnpm (preferred) or npm

### Installation

```bash
# Clone repository
git clone <repo-url>
cd naija-merit

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# Generate Prisma client
pnpm prisma:generate

# Push schema to database
npx prisma db push

# (Optional) Seed NIN database
pnpm prisma:seed
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### Running the Application

```bash
# Development
pnpm run start:dev

# Production build
pnpm run build
pnpm run start:prod
```

### API Documentation

After starting the server, API is available at:
- **Base URL**: `http://localhost:3000/api/v1`
- **Global Prefix**: `/api/v1` (configured in `main.ts`)

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

---

## 📁 Project Structure

```
naija-merit/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── [modules]/              # Feature modules (12 total)
│   ├── guards/                 # Auth guards
│   ├── decorators/             # Custom decorators
│   └── prisma/                 # Prisma service
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed-nin.ts             # NIN seed data
├── docs/                       # API documentation
│   ├── walkthrough.md          # Complete API guide
│   ├── task.md                 # Implementation checklist
│   └── implementation_plan.md  # Architecture decisions
├── uploads/                    # Static file storage
└── package.json
```

---

## 🔑 Key Concepts

### Skeletal Profiles
Schools can register students before they have accounts, creating profiles with:
- NIN + Name only (no password)
- Linked to institution
- `isVerified: true` (school vouches for identity)

When student creates account and verifies NIN → **all records automatically migrate**

### Best Sitting Logic
For WAEC/NECO/JAMB:
- Records grouped by `session` field
- Each sitting scored separately
- **Only best result counts** for rankings

### Auto-Verification
Uploads are auto-verified based on uploader role:
- School admins/teachers → Auto-verified
- Verified event organizers → Auto-verified
- Students → Requires admin approval

### Access Control Matrix
| Action | Student (Self) | Student (Other) | School Admin | Recruiter | Admin |
|--------|---------------|-----------------|--------------|-----------|-------|
| View basic profile | ✅ | ✅ | ✅ | ✅ (if open) | ✅ |
| View full records | ✅ | ❌ | ✅ | Requires AccessRequest | ✅ |
| Edit records | ❌ | ❌ | ✅ | ❌ | ✅ |
| Verify records | ❌ | ❌ | ✅ | ❌ | ✅ |

---

## 🤝 Contributing

This is a production-ready backend for a national merit system. Future enhancements:
- Real-time notifications
- Cloud storage integration (AWS S3/Cloudinary)
- Advanced analytics dashboard
- AI-powered talent matching
- Mobile app integration

---

## 📄 License

UNLICENSED - Private Project

---

## 👥 Contact

For support or inquiries, contact the development team.

**Built with NestJS** • **Powered by Prisma** • **Secured by JWT**
