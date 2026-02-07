# Frontend Route & Layout

## Routing Rules

1. **Root (`/`)**:
   - Check authentication (token in localStorage).
   - If authenticated -> redirect to `/dashboard/overview`.
   - If not authenticated -> redirect to `/login`.

2. **Login (`/login`)**:
   - Authentication page.
   - Stores JWT token in `localStorage`.

3. **Dashboard (`/dashboard` & `/dashboard/*`)**:
   - **Protected Route**: Requires valid token.
   - **Branch Selection (`/dashboard`)**:
     - If no branch selected in `localStorage` -> Show branch selection.
     - If branch selected -> Redirect to `/dashboard/overview`.
   - **Overview (`/dashboard/overview`)**: Main dashboard view.

## Layout Structure

### Dashboard Layout (`/dashboard/layout.tsx`)

- **Wrapper**: `AuthGuard` checks for token.
- **Sidebar**:
  - 3-level navigation (Module -> Category -> Page).
  - Uses `Collapsible` for expandable menus.
- **Navbar**:
  - Top bar.
  - **Branch Selector**: Dropdown to switch active branch.
  - **User Menu**: Profile and Logout.

## Implemented Routes (Placeholders)

- **App**:
  - `/dashboard/app/user`
  - `/dashboard/app/branch`
- **Master Data**:
  - `/dashboard/master/items`
  - `/dashboard/master/item-categories`
  - `/dashboard/master/members`
  - `/dashboard/master/member-categories`
  - `/dashboard/master/suppliers`
  - `/dashboard/master/units`
- **Transactions**:
  - `/dashboard/transaction/purchase`
  - `/dashboard/transaction/purchase-return`
  - `/dashboard/transaction/sales`
  - `/dashboard/transaction/sales-return`
  - `/dashboard/transaction/sell`
  - `/dashboard/transaction/sell-return`
  - `/dashboard/transaction/adjust-stock`
  - `/dashboard/transaction/transfer`
