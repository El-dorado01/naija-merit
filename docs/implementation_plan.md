# Super Admin System Implementation Plan

## Goal Description
Implement a comprehensive Super Admin system with role-based access control (RBAC). Only super admins can perform all actions, while other admins have restricted permissions based on assigned roles.

## User Review Required

> [!IMPORTANT]
> **Admin Role Architecture**:
> - `super_admin`: Full system access (can create/manage admins)
> - `admin`: Restricted permissions based on assigned capabilities
> - Separate auth routes: `/api/v1/admin/auth/*` vs `/api/v1/auth/*`

> [!WARNING]
> **Breaking Change**: Current `admin` role in Profile will be refined. Existing admins may need migration.

## Proposed Changes

### Database Schema

#### [MODIFY] [schema.prisma](file:///c:/Users/hp/Desktop/naija-merit/prisma/schema.prisma)
- **Profile Model**:
  - Change `role` to support `super_admin` value
  - Add `permissions` field (JSON array) for granular access control
  - Add `createdBy` field to track admin creator

---

### NestJS Modules

#### [NEW] src/admin
- **AdminAuthController** (`/api/v1/admin/auth`):
  - `POST /login` - Admin-specific login
  - `POST /create-admin` (Super Admin only) - Create new admin accounts
  - `GET /admins` (Super Admin only) - List all admins
  - `PATCH /admins/:id/permissions` (Super Admin only) - Update admin permissions
  - `DELETE /admins/:id` (Super Admin only) - Remove admin access

- **AdminAuthService**:
  - `createAdmin(superAdminId, data)` - Create admin with permissions
  - `updatePermissions(adminId, permissions)` - Modify admin capabilities
  - `validateAdminAccess(adminId, requiredPermission)` - Check if admin can perform action

#### [NEW] Guards & Decorators
- **PermissionGuard**: Validates admin has required permission
- **@RequirePermission(permission)**: Decorator for endpoint protection
- **@SuperAdminOnly()**: Decorator restricting to super admin

---

### Permission System

**Permission Types** (stored as JSON array in Profile):
```typescript
[
  'manage_users',
  'manage_institutions', 
  'verify_records',
  'manage_events',
  'view_analytics',
  'manage_access_requests'
]
```

**Super Admin**: Has ALL permissions implicitly (no need to check array)

---

## Verification Plan

### Automated Tests
- Create super admin → Create regular admin → Verify permission enforcement
- Attempt restricted action with limited admin → Should fail
- Attempt same action with super admin → Should succeed

### Manual Verification
1. Create super admin account
2. Use super admin to create limited admin (only `verify_records` permission)
3. Login as limited admin
4. Attempt to create institution → Should be denied
5. Attempt to verify academic record → Should succeed
