# Frontend Data Fetching & Data Table Rules

This document outlines the standard patterns for data fetching, searching, sorting, and state management in the Hasmart frontend. Follow these rules to ensure consistency and maintainability across the application.

## 1. Service Layer

All API calls must be defined in a service file (e.g., `src/services/app/branch.service.ts`).

### Rules:

- **FilterQuery Interface**: Use `FilterQuery` from `src/types/common.ts` for parameters. This enables standard support for pagination, sorting, and searching.
- **Return Type**: Methods should return `Promise<BaseResponse<T[]>>` for lists or `Promise<BaseResponse<T>>` for single items.

**Example:**

```typescript
import { BaseResponse, FilterQuery } from "@/types/common";
import { Branch, BranchListResponse } from "@/types/app/branch";
import { axiosInstance } from "@/lib/axios";

export const branchService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<BranchListResponse>(
      "/app/branch",
      { params },
    );
    return response.data;
  },
  // ... other methods
};
```

## 2. React Query Hooks

Create custom hooks in `src/hooks/app/` (e.g., `use-branch.ts`) to wrap TanStack Query logic.

### Rules:

- **Standard Hook Name**: Start with `use[EntityName]s` for lists and `use[EntityName]` for details.
- **Query Keys**: Use a factory (`queryKeys` constant) to generate predictable keys. Include `params` in the key for lists to auto-refetch on filter changes.
- **Invalidation**: Use `useQueryClient` and `invalidationMap` in mutation `onSuccess` handlers to refresh data automatically.

**Example:**

```typescript
import { useQuery } from "@tanstack/react-query";
import { branchService } from "@/services/app/branch.service";
import { queryKeys } from "@/constants/query-keys";
import { FilterQuery } from "@/types/common";

export function useBranches(params?: FilterQuery) {
  return useQuery({
    queryKey: queryKeys.app.branch.list(params), // Triggers refetch when params change
    queryFn: () => branchService.list(params),
  });
}
```

## 3. Page Component Implementation

The page component (e.g., `BranchPage`) acts as the controller. It manages state and passes it to the hook and the `DataTable`.

### 3.1 State Management

Manage these states locally in the page component:

- **Pagination**: `useState<PaginationState>({ pageIndex: 0, pageSize: 10 })`
- **Sorting**: `useState<SortingState>([])`
- **Search Term**: `useState("")`
- **Debounced Search**: `useDebounce(searchTerm, 500)`

### 3.2 Hook Integration

Pass the state values to the custom hook. Transform standard table state (0-indexed) to API expectations (1-indexed) if needed.

```typescript
// 1. Define State
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});
const [sorting, setSorting] = useState<SortingState>([]);
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 500);

// 2. Fetch Data
const { data, isLoading } = useBranches({
  page: pagination.pageIndex + 1, // API uses 1-based indexing
  limit: pagination.pageSize,
  search: debouncedSearch, // Use debounced value
  sort: sorting[0]?.desc ? "desc" : "asc",
  sortBy: sorting[0]?.id, // Accessor key from column def
});
```

### 3.3 DataTable Configuration

Use the reusable `DataTable` component.

**Key Props:**

- `data`: `queryData?.data || []`
- `columns`: Define with `useMemo`. Use `DataTableColumnHeader` for sortable columns.
- `state`: Pass `{ pagination, sorting, columnVisibility }`.
- `pageCount`: `queryData?.pagination?.totalPages || -1`.
- **Manual Flags**: Set these to `true` to tell the table that the server handles data processing.
  - `manualPagination={true}`
  - `manualSorting={true}`
  - `manualFiltering={true}`
- `on...Change`: Connect state setters (`onPaginationChange`, etc.).

**Example:**

```tsx
<DataTable
  table={table} // Result of useReactTable hook
  columnsLength={columns.length}
  isLoading={isLoading}
/>
```

## 4. Global State (Branch Context)

For global application state like the **Currently Selected Branch**, use React Context (`BranchProvider`).

### Rules:

- **Usage**: Only use Context for state that needs to be accessed by many unrelated components (e.g., Sidebar, Navbar, Protected Routes).
- **Persistence**: Persist selection to `localStorage` within the provider if it needs to survive refreshes.
- **Updates**: When critical data changes (like deleting the active branch), update the context immediately to reflect the change in the UI.

**Example:**

```typescript
const { branch, setBranch } = useBranch();

// When switching:
setBranch(newBranch);
// When deleting active branch:
if (currentBranch.id === deletedId) setBranch(null);
```

## 5. Summary Checklist

- [ ] **Service**: defined with `FilterQuery`.
- [ ] **Hook**: accepts `params` and includes them in `queryKey`.
- [ ] **Page State**: `pagination`, `sorting`, `search` (with debounce) defined.
- [ ] **Table**: `manualPagination`, `manualSorting`, `manualFiltering` set to `true`.
- [ ] **Columns**: Use `DataTableColumnHeader` for sortable fields.
