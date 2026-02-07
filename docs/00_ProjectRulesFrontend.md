# Frontend Rules - JICA Investment System

Panduan standar untuk pengembangan frontend Next.js 15 dengan TailwindCSS dan shadcn/ui.

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # UI components (shadcn + custom)
│   │   └── ui/              # shadcn/ui components
│   ├── constants/           # Constants & environment variables
│   │   ├── env.ts           # Environment variables (NEVER call process.env directly)
│   │   ├── query-keys.ts    # TanStack Query keys & invalidation map
│   │   └── index.ts         # Storage keys, response codes
│   ├── hooks/               # Custom React hooks
│   │   └── use-auth.ts      # Re-export from providers (backward compat)
│   ├── lib/                 # Utilities & configurations
│   │   ├── auth/            # Auth utilities (tokens, helpers)
│   │   ├── api.ts           # API request utilities
│   │   ├── axios.ts         # Axios instance with interceptors
│   │   └── utils.ts         # General utilities (cn function)
│   ├── providers/           # React Context Providers
│   │   ├── query-provider.tsx   # TanStack Query client
│   │   ├── auth-provider.tsx    # Auth context (global state)
│   │   └── index.ts
│   ├── services/            # API services (organized by module)
│   │   ├── app/             # App module
│   │   ├── master/          # Master module
│   │   ├── transaction/     # Transaction module
│   └── types/               # TypeScript type definitions
├── .env                     # Environment variables
└── Md/                      # Documentation
```

---

## Global State Management

### React Context for Auth

Gunakan **React Context** untuk global auth state:

```typescript
// Di layout.tsx - wrap app dengan providers
import { QueryProvider, AuthProvider } from "@/providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

```typescript
// Akses auth state di component
import { useAuth } from "@/hooks/use-auth";

const { user, login, logout, isAuthenticated } = useAuth();
```

---

## TanStack Query untuk Data Fetching

### Basic Query Usage

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidationMap } from "@/constants";
import { getItems, createItem } from "@/services";

// Query
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.master.items.list(),
  queryFn: getItems,
});

// Mutation dengan invalidation
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    // Invalidate related queries
    invalidationMap.item().forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  },
});
```

### Query Keys Pattern

Query keys didefinisikan di `constants/query-keys.ts` dengan factory pattern:

```typescript
import { queryKeys } from "@/constants";

// Get query key
queryKeys.master.items.list(); // ['master', 'items', 'list']
queryKeys.master.items.detail("123"); // ['master', 'items', 'detail', '123']
```

### Query Invalidation Rules

**PENTING:** Setelah mutation, invalidate queries terkait untuk mencegah stale data:

| Mutation     | Invalidate                                                |
| ------------ | --------------------------------------------------------- |
| Login/Logout | `auth.all`, `organizations.my()`                          |
| Create Item  | `master.items.list`, `master.items.detail`, `dashboard.*` |

```typescript
// Gunakan invalidationMap dari constants
import { invalidationMap } from "@/constants";

// Setelah buat transaction
invalidationMap.transactionSales(itemId).forEach((key) => {
  queryClient.invalidateQueries({ queryKey: key });
});
```

---

## Coding Conventions

### 1. Environment Variables

**NEVER** panggil `process.env` langsung. Gunakan `@/constants`:

```typescript
import { ENV } from "@/constants";
const url = ENV.API_URL;
```

### 2. API Response Handling

Semua response mengikuti format `BaseResponse<T>`:

```typescript
interface BaseResponse<T> {
  metaData: MetaData;
  data: T | null | undefined;
  errors?: {
    message?: string; // readable message
    details?: {
      message: string;
      code: string;
      path: string[];
    }[];
  };
  filterQuery?: FilterQuery | null; // optional chaining
  pagination?: PaginationInfo | null; // optional chaining
}

interface MetaData {
  code: number;
  timestamp: string;
  status: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

### 3. Services Structure

Services diorganisir per module:

```typescript
// Import by namespace
import { itemService } from "@/services/master";
await itemService.list();
```

### 4. Error Handling dengan TanStack Query

```typescript
const mutation = useMutation({
  mutationFn: createProject,
  onError: (error) => {
    if (isValidationError(error)) {
      Object.entries(error.validationErrors).forEach(([field, message]) => {
        form.setError(field, { message });
      });
    } else if (isApiError(error)) {
      toast.error(error?.errors?.message || "Terjadi kesalahan");
    }
  },
});
```

### 5. Authentication

```typescript
import { useAuth } from "@/hooks/use-auth";

const {
  user,
  login,
  logout,
  isAuthenticated,
  isLoggingIn, // loading state dari mutation
} = useAuth();
```

---

## Component Guidelines

### 1. shadcn/ui Components

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
```

### 2. Form Handling

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### 3. Client Components

Tambahkan `'use client'` untuk components dengan:

- Hooks (useState, useQuery, dll)
- Browser APIs
- Event handlers

---

## API Integration Pattern

### Query dengan Custom Hook (Recommended)

```typescript
// src/hooks/use-items.ts
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { itemService } from "@/services";

export function useItems() {
  return useQuery({
    queryKey: queryKeys.master.items.list(),
    queryFn: itemService.list,
  });
}
```

### Mutation dengan Proper Invalidation

```typescript
// src/hooks/use-create-item.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidationMap } from "@/constants";
import { itemService } from "@/services";

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => itemService.create(data),
    onSuccess: () => {
      // Invalidate all related queries
      invalidationMap.master.items.list().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
```

---

## File Naming Conventions

| Type       | Convention                         | Example             |
| ---------- | ---------------------------------- | ------------------- |
| Components | kebab-case                         | `login-form.tsx`    |
| Hooks      | kebab-case with `use-` prefix      | `use-items.ts`      |
| Services   | kebab-case with `.service` suffix  | `auth.service.ts`   |
| Providers  | kebab-case with `-provider` suffix | `auth-provider.tsx` |
| Types      | kebab-case                         | `organization.ts`   |

---

## Important Rules

1. **Indonesia UI Text**: All UI text (labels, messages, placeholders, buttons, toasts) MUST be in Indonesia
2. **Query Keys**: Always use `queryKeys` from constants, never hardcode
3. **Invalidation**: After mutation, MUST invalidate related queries via `invalidationMap`
4. **Pagination/FilterQuery**: Use optional chaining (`?.`)
5. **SSR Safety**: Check `typeof window !== 'undefined'` for browser APIs
6. **Type Safety**: All API responses and requests must be typed
7. **Modular Services**: Separate services per module
8. **Context First**: For global state (Auth, Selected Branch, Theme), use React Context instead of local state. Persist to localStorage if needed but access via Context.
9. **API/Backend API Gateway**: Use API Gateway for all API calls, Forwarded into "/api/:path\*" (Check next.config.ts)
10. **Login Form**: Use `name` (not email) for login authentication. Use `shadcn/ui` form components with `zod` validation.
