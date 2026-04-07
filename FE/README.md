# Frontend Architecture & Setup Guide

This document provides a comprehensive overview of the Frontend (FE) architecture and structure. It is designed to help AI agents and developers quickly understand the system, conventions, and tech stack in order to effectively contribute to the codebase.

## Tech Stack Overview

- **Core:** React 19, TypeScript
- **Build Tool:** Vite (with React Compiler enabled)
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4, Ant Design (antd)
- **State Management:** Zustand (global UI state), `@tanstack/react-query` (server state/caching)
- **Networking:** Axios, `@microsoft/signalr` (Realtime data/notifications)
- **Icons:** `@ant-design/icons`, `@heroicons/react`
- **Other:** `react-hot-toast` (notifications), `@headlessui/react`

---

## Directory Structure (`src/`)

```text
src/
├── api/          # API services utilizing Axios instance
├── assets/       # Static assets (images, global SVGs)
├── auth/         # Authentication Context and Providers
├── components/   # Reusable "Dumb" / Presentational UI components
├── hooks/        # Custom React Hooks
├── layout/       # App layout structures (Sidebars, Headers)
├── mock/         # Mock data for testing
├── pages/        # Route-level components/views
├── routes/       # React Router setup & Route Guards
├── types/        # TypeScript Interfaces & Types
└── utils/        # Helper functions & formatters
```

### Deep Dive into Directories

- **`api/`**: Contains API communication logic. Setup uses `axios` (`httpClient.ts`) with interceptors for authentication. Divided by domains (e.g., `amenitiesApi.ts`, `usersApi.ts`, `roomsApi.ts`).
- **`auth/`**: Authentication context and provider hooks. `appAuth.tsx` contains the Provider, `useAppAuth.ts` is the hook for components to consume auth state.
- **`components/`**: Reusable UI components. Includes base UI elements: `Input.tsx`, `Table.tsx`, `Modal.tsx`, `Select.tsx`, `Badge.tsx`, `Tabs.tsx`, `Pagination.tsx`. Also includes specific shared blocks like `NotificationBell.tsx`.
- **`hooks/`**: Custom React hooks. E.g., `usePermissionCheck.ts` manages RBAC (Role-Based Access Control) logic, and `useRealtimeNotifications.ts` manages the SignalR connection for live updates.
- **`layout/`**: Structure of the main view areas. `AppLayout.tsx` wraps the whole application context, while `AdminLayout.tsx` defines the layout specifically for admin domains with `Sidebar.tsx` & `Header.tsx`.
- **`pages/`**: Page-level components, grouped by feature or role. It includes error pages (`NotFoundPage`, `ForbiddenPage`) and an `admin/` subsystem containing domain views (e.g., `RoomsPage.tsx`, `DashboardPage.tsx`).
- **`routes/`**: Application routing setup. `AppRouter.tsx` defines route hierarchy using React Router DOM. `RouteGuards.tsx` wraps protected routes enforcing authentication or authorization.
- **`types/`**: Global TypeScript definitions (`models.ts`, `table.ts`, `roleName.ts`). Use this folder to declare payloads, models, and shared interfaces.
- **`utils/`**: Utility helper functions (e.g., `format.ts` for text/date formatting, `table.ts` for processing table logic).

---

## Core Conventions for Agents & Developers

### 1. Adding a New API Endpoint
1. Define the interfaces for request payloads and response DTOs in `src/types/models.ts`.
2. Add a new file or update existing ones in `src/api/` (e.g., `api/featureApi.ts`). Ensure it utilizes the pre-configured `httpClient.ts`.
3. **DO NOT** store remote API data in global `zustand` stores. Instead, rely entirely on `@tanstack/react-query` inside your pages or component layers to fetch, cache, and mutate data.

### 2. Creating Pages & Components
- **Components**: Place highly reusable UI components in `src/components/`. If a component is highly specific to a single page's business logic, keep it co-located with the page rather than cluttering `src/components/`. 
- **Pages**: Add new domain pages under `src/pages/` (or `src/pages/admin/` if it requires admin privileges). 
- **Routing**: Always register new pages inside `src/routes/AppRouter.tsx`. If it requires role-based access, wrap the route target with `RouteGuards.tsx`.

### 3. State Management & Authentication
- **Auth**: Use the standard `useAppAuth()` from `src/auth/useAppAuth.ts` to access context (`user`, `token`, `login`, `logout` variables).
- **Permissions / RBAC**: Always use `usePermissionCheck()` to conditionally hide/show sensitive UI elements based on the current user roles.

### 4. Styling Guidelines
- The application relies heavily on **Tailwind CSS v4**. Use Tailwind utilitarian classes for standard layouts and styling.
- **Ant Design (antd)** is used for complex structural components. When modifying Antd components, adjust the class attributes carefully to blend with the Tailwind theme if necessary.

### 5. Realtime Features Integration
- Realtime operations are tracked via **SignalR**. 
- If adding new WebSocket/SignalR events, declare the listener payload inside `types/`, then update `src/hooks/useRealtimeNotifications.ts` to map the event string to app behavior (like state invalidation or local toast alerts).

## Workflow Suggestion for AI Agents
When tasked with exploring, debugging, or introducing changes to this repository:
1. Double-check `types/models.ts` before adding new state logic to ensure you are respecting the existing data contracts.
2. Maximize the reuse of `src/components/` (like `Table`, `Modal`, `Input`) rather than building raw HTML components styled from scratch with Tailwind.
3. Be consistent with file naming: **PascalCase** for React files (`.tsx`), and **camelCase** for hooks, configs, logic, and APIs (`.ts`).
