# Frontend — Civil42 Throttlers Hackathon

React + TypeScript frontend for a regional workforce and volunteer coordination platform focused on the Lublin area. The application enables searching for workers and volunteers by category, browsing by district on an interactive map, and managing crisis response events.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Environment Setup](#environment-setup)
3. [Project Structure](#project-structure)
4. [Pages & Views](#pages--views)
5. [Components](#components)
6. [Data Management](#data-management)
7. [User Roles & Data Protection](#user-roles--data-protection)
8. [Routing & Route Guards](#routing--route-guards)
9. [Authentication & Session Lifecycle](#authentication--session-lifecycle)
10. [Internationalization](#internationalization)
11. [WebSocket Integration](#websocket-integration)

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 4.x + Material-UI 7.x |
| Routing | React Router 7.9.4 |
| HTTP Client | Axios |
| Real-time | Socket.io-client |
| Maps | `@vis.gl/react-google-maps` |
| i18n | react-i18next |
| Notifications | Sonner (toasts) |
| UI Primitives | Radix UI (via shadcn-style wrappers) |

---

## Environment Setup

Create a `.env` file in the `frontend/` root:

```env
VITE_API_URL=http://localhost:3000/api/
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Both variables are required. The app will fail to initialize map views without `VITE_GOOGLE_MAPS_API_KEY` and all API calls will break without `VITE_API_URL`.

---

## Project Structure

```
src/
├── App.tsx                        # Route definitions + global providers
├── main.tsx                       # Entry point
├── pages/                         # One folder per route/view
│   ├── Login/
│   ├── Register/
│   ├── MainDashboard/
│   ├── Employees/
│   ├── CategoryDetail/
│   ├── EmployeeProfile/
│   ├── EmployeeMap/
│   │   └── districts.ts           # 27 Lublin district polygons + employee assignments
│   ├── SearchResults/
│   ├── Volunteers/
│   │   └── VolunteerSignup.tsx
│   ├── UserProfile/
│   ├── OrgProfile/
│   ├── Crisis/
│   ├── OwnerVerificationAdmin/
│   └── NotFound/
├── components/                    # Reusable UI components
│   ├── Animated/                  # BorderGlow, Radar, Threads backgrounds
│   ├── Buttons/
│   ├── Header/
│   ├── Modals/
│   ├── Redirects/                 # Route guard components
│   ├── Wrappers/
│   └── ui/                        # Radix UI primitives (button, dialog, select, …)
├── contexts/
│   └── AuthUserContext.tsx        # JWT state, token refresh, session expiry
├── hooks/
│   └── useAuthenticatedApi.ts     # Wraps API calls with automatic token injection
├── services/
│   ├── apiClient.ts               # Axios instance
│   ├── auth.ts                    # Profile, verification, open-hands-alert endpoints
│   ├── login.ts                   # Login endpoint
│   ├── crisis.ts                  # Crisis lifecycle endpoints
│   └── marketplace.ts             # Worker/volunteer search endpoints
├── data/
│   ├── employees.ts               # 97 mock employees
│   └── volunteers.ts              # 68 mock volunteers
├── types/
│   ├── types.ts                   # AppRoutePaths, AppApiPaths
│   ├── user.ts                    # AppUser, AccountType
│   ├── ids.ts                     # Opaque AccessToken / RefreshToken types
│   ├── login.ts                   # LoginResponseData
│   ├── websocket.ts               # WS event names and response shapes
│   └── envConfig.ts               # Typed env variables
├── i18n/
│   └── i18n.ts                    # i18next config
└── locales/
    └── pl/translation.json        # All Polish UI strings
```

---

## Pages & Views

### Public Pages (accessible without login)

#### `/` — Main Dashboard
Entry point of the application. Displays a hero section with an animated background, aggregate statistics (total employees, available count), and two primary CTA cards directing users to the Employees and Volunteers sections. Shows partner logos at the bottom. The employee count stat is derived live from `ALL_EMPLOYEES`.

#### `/employees` — Employees
Browsing hub for the workforce directory. Contains:
- **Stats bar** — total employees, currently available count, average years of experience, number of categories.
- **Spotlight section** — top 3 employees with longest experience who are currently available. The first card gets a gold star badge. Names are masked (`••••• •••••••`) for unauthenticated visitors.
- **Category grid** — 10 animated `BorderGlow` cards, each showing employee count, availability count, and a live availability progress bar. Each card links to `/category/:category`.
- **Popular category callout** — highlights the category with the most employees and links directly to it.

#### `/category/:category` — Category Detail
Filtered view of all employees within a single category (e.g., `construction`, `technology`). Uses the same card layout as the employees page but scoped to the selected category. Pulls from `ALL_EMPLOYEES`.

#### `/profile/:id` — Employee Profile
Detailed view for a single employee. Shows role, experience, location, and a Google Maps panel rendering the Lublin district polygon that corresponds to the employee's location. Contact details are only visible to authenticated users.

#### `/map` — Employee Map
Full interactive map of Lublin divided into 27 district polygons sourced from `districts.ts`. Each polygon is clickable and opens a sidebar listing all employees assigned to that district. Districts are color-coded. Hovering highlights the polygon; clicking shows employee count and individual cards. Uses `@vis.gl/react-google-maps` with custom `OverlayView` labels.

#### `/search` — Search Results
Unified search across both employees and volunteers, triggered by the `?q=` query parameter from the Header search bar. Results are debounced (500 ms). Features:
- **Tab switcher**: `Wszyscy` / `Pracownicy` / `Wolontariusze`
- **Wszyscy tab**: Merges employees and volunteers under shared category sections — not separated — so results for the same category appear together
- **Map view**: Toggleable side-by-side panel showing Lublin district polygons with a popup per district showing matched results
- Same contact visibility rules apply as on dedicated pages (see [User Roles & Data Protection](#user-roles--data-protection))

#### `/volunteers` — Volunteers
Browse volunteers by category. Features:
- **Info cards** — three tiles explaining social actions, crisis situations, and logistics support.
- **Category grid** — same `BorderGlow` style as Employees, showing volunteer counts and available counts per category. Clicking a category expands a card list inline beneath.
- **Expanded list** — each volunteer tile shows name (masked for guests), role, experience, availability badge, and contact info. Collapsed by clicking the category again or via "Zamknij".
- **CTA section** — prompts the user to sign up as a volunteer, linking to `/volunteers/signup`.

#### `/volunteers/signup` — Volunteer Signup
Multi-section form for registering as a volunteer:
- Personal information (name, phone, location)
- Availability types — social actions, crisis response, logistics support, medical assistance
- Equipment owned (vehicle, tools, machinery, etc.)
- Skills and specializations

Requires authentication — guests are redirected to `/login`.

### Authenticated-Only Pages

#### `/me/profile` — User Profile
Displays the current logged-in user's personal data, verification status, and category preferences. Supports inline editing of profile fields via `patchMyProfile`.

#### `/me/organization` — Organization Profile
Available to employer-type accounts. Shows organization name, NIP, REGON, institution type, and verification status. Government service organizations additionally see the **Open Hands Alert** feature — a form to broadcast an alert to multiple Lublin districts with configurable severity level and custom message, sent via `postOpenHandsAlert`.

### Owner-Only Pages

#### `/owner/verifications` — Verification Admin Panel
Accessible only to users with the `owner` role (enforced by `OwnerRoute`). Lists pending verification requests, filterable by type (`employer` / `gov_service`). Each request can be approved or rejected via dedicated API calls.

#### `/crisis` — Crisis Management
The most complex page in the application. Behavior varies significantly by user role:

| User State | View |
|---|---|
| Guest / not logged in | "No active crisis" informational screen |
| Logged-in non-owner, no active crisis | "No active crisis" informational screen |
| Logged-in non-owner, crisis active | Read-only map; user can declare availability per district |
| Owner, no active crisis | Informational screen + "Ogłoś sytuację kryzysową" button |
| Owner, crisis active | Full management view |

**Crisis map features:**
- 27 Lublin district polygons; affected districts highlighted in red
- Custom `OverlayView` labels showing district name + employee count + warning icon
- Clicking a district opens a role-specific sidebar
- **Owner sidebar**: add/manage requests per district, filter responders by category
- **User sidebar**: see responder count, declare personal availability (marks you as ready)
- **Start Crisis Modal**: title, description, severity (high / critical), affected districts selection
- **Add Request Modal**: per-district form with title, description, priority, and needed specialization categories
- **Notify All**: broadcasts to all responders via `postCrisisNotify`
- Header polls for active crisis every 30 seconds and shows a pulsing red badge when one is active

### Error Page

#### `*` — Not Found
Simple 404 page showing the app logo and "Strona nie istnieje" message.

---

## Components

### Route Guards (`src/components/Redirects/`)

| Component | Behavior |
|---|---|
| `AuthenticatedRoute` | Redirects to `/login` if `auth.user === null` |
| `UnauthenticatedRoute` | Redirects to `/` if `auth.user !== null` — prevents logged-in users accessing login/register |
| `OwnerRoute` | Redirects to `/` if user's decoded JWT role is not `owner` |

### Layout

- **`BaseLayout`** — wraps all main pages; renders `Header` and `SessionExpiredModal`
- **`BaseContentWrapper`** — page-level content container with consistent padding
- **`BaseDimmedBackground`** — lightly dimmed card container used in informational blocks

### Header (`src/components/Header/Header.tsx`)

- App logo linking to `/`
- Search input that navigates to `/search?q=...` on submit
- Live crisis status badge (pulses red when a crisis is active, polled every 30 s)
- Owner-only verification button when `user.accountType` warrants it
- Authenticated user: avatar dropdown with links to profile, organization, and logout
- Guest: "Zaloguj się" and "Zarejestruj" buttons

### SessionExpiredModal

Shown when `auth.hasExpired === true`. Blocks all interaction with a full-screen overlay. Closing it calls `resetAuth()`, clears tokens and user state, and effectively logs the user out.

### EmployeeCard

Reusable card used in category listings and spotlight sections. When `isAuthenticated` is false, the employee name is masked and the card link is disabled.

### Animated Components

- **`BorderGlow`** — canvas-based glow border that tracks the mouse cursor along card edges; used on all category cards throughout the app
- **`RadarBackground`** — SVG/CSS pulsing radar animation used on the MainDashboard hero
- **`ThreadsBackground`** — animated network/thread effect for decorative backgrounds

---

## Data Management

### Mock Data

All current employee and volunteer listings are static mock data loaded client-side. No backend call is made for the browsing pages.

**`src/data/employees.ts`** — `ALL_EMPLOYEES: Employee[]`
- 97 entries total
- 64 assigned to named Lublin districts (matched by location string to `districts.ts`)
- 33 from other Polish cities
- Fields: `id`, `name`, `role`, `category`, `location`, `experience` (years), `available`

**`src/data/volunteers.ts`** — `ALL_VOLUNTEERS: Volunteer[]`
- 68 entries across all 10 categories with intentionally varied counts per category:

  | Category | Count |
  |---|---|
  | transport | 11 |
  | technology | 10 |
  | healthcare | 9 |
  | construction | 8 |
  | automotive | 7 |
  | gastronomy | 6 |
  | education | 5 |
  | services | 5 |
  | agriculture | 4 |
  | trade | 3 |

- Fields: same as `Employee` plus `phone: string`
- Phone numbers are conditionally exposed (see [User Roles & Data Protection](#user-roles--data-protection))

**`src/pages/EmployeeMap/districts.ts`** — `LUBLIN_DISTRICTS: District[]`
- 27 Lublin districts, each with:
  - `id`, `name`, `color` (hex for polygon fill)
  - `center: { lat, lng }` for label placement
  - `polygon: { lat, lng }[]` — coordinate array for Google Maps rendering
  - `employees: Employee[]` — subset of `ALL_EMPLOYEES` filtered by location

### Services & API

All API functions accept an `AccessToken` as their first argument. They are never called directly in components — `callWithToken` from `useAuthenticatedApi` injects the token automatically.

| Service File | Key Functions |
|---|---|
| `auth.ts` | `getMyProfile`, `patchMyProfile`, `getUserMe`, `deleteMyAccount`, `postRefreshToken`, `postOpenHandsAlert`, `getOwnerPendingVerifications`, `approveOwnerVerification`, `rejectOwnerVerification` |
| `login.ts` | `handleUserLogin` |
| `crisis.ts` | `getActiveCrisis`, `postStartCrisis`, `postEndCrisis`, `getCrisisResponders`, `postCrisisRequest`, `postCrisisNotify` |
| `marketplace.ts` | `searchWorkers`, `searchVolunteers` |

### `useAuthenticatedApi` Hook

```ts
const { callWithToken, emitWithToken, websocketConnectWithToken } = useAuthenticatedApi()

// Automatically fetches a valid token (refreshing if needed) then calls the function
const profile = await callWithToken(getMyProfile)

// WebSocket equivalent
await emitWithToken(wsClient, 'event_name', payload)
```

### AuthUserContext

Central authentication state, persisted to `localStorage` under keys `accessToken` and `refreshToken`.

```ts
auth = {
  accessToken: AccessToken | null
  refreshToken: RefreshToken | null
  expiresIn: number | null       // Unix timestamp (seconds)
  user: AppUser | null           // { id, email, nickname, accountType }
  isLoading: boolean             // true during initial localStorage hydration
  hasExpired: boolean            // true when refresh failed
}
```

**Token refresh logic:**
- `getAccessToken()` checks if the current token expires within the next 120 seconds
- If so, calls `postRefreshToken(refreshToken)` before returning the token
- On refresh success: updates `localStorage` and all active WebSocket clients
- On refresh failure: sets `hasExpired: true` → triggers `SessionExpiredModal`

---

## User Roles & Data Protection

### User Types

| Type | How Determined |
|---|---|
| **Guest** | `auth.user === null` |
| **Worker** | `auth.user.accountType === 'worker'` |
| **Employer (Org)** | `auth.user.accountType === 'employer'` |
| **Government Service** | Employer + `profile.is_government_service === true` OR `profile.institution_type === 'government'` — requires extra `getMyProfile` call |
| **Owner** | JWT decoded role is `owner` — checked by `OwnerRoute` |

Government service detection cannot be derived from the JWT alone (which only carries `worker` / `employer`). Pages that differentiate government orgs — `Volunteers.tsx`, `SearchResults.tsx`, `OrgProfile.tsx`, `Crisis.tsx` — fetch the full profile via `callWithToken(getMyProfile)` on mount and store the result in local state.

### Feature Access Matrix

| Feature | Guest | Worker | Employer | Gov Service | Owner |
|---|---|---|---|---|---|
| View employee / volunteer lists | Yes | Yes | Yes | Yes | Yes |
| See names on listings | No (masked) | Yes | Yes | Yes | Yes |
| See employee contact info | No | Yes | Yes | Yes | Yes |
| See volunteer phone number | No | No | No | Yes | Yes |
| Send message to volunteer | No | Yes | Yes | Yes | Yes |
| Volunteer signup form | No | Yes | Yes | Yes | Yes |
| User profile (`/me/profile`) | No | Yes | Yes | Yes | Yes |
| Organization profile (`/me/organization`) | No | No | Yes | Yes | Yes |
| Open Hands Alert | No | No | No | Yes | Yes |
| Manage crisis events | No | No | No | No | Yes |
| Approve / reject verifications | No | No | No | No | Yes |

### Name Masking

Implemented consistently across all listing components:

```tsx
{isAuthenticated ? person.name : '••••• •••••••'}
```

Applied in: `Employees.tsx` (spotlight), `EmployeeProfile.tsx`, `Volunteers.tsx` (expanded list), `SearchResults.tsx` (all result cards).

### Volunteer Contact Display

Three-state contact block used in both `Volunteers.tsx` and the inline `VolunteerCard` in `SearchResults.tsx`:

```tsx
{!isAuthenticated ? (
  <><Lock size={11} /><span>Zaloguj się, aby nawiązać kontakt</span></>
) : isGovernmentOrg ? (
  <><Phone size={11} /><span>{volunteer.phone}</span></>
) : (
  <><Send size={11} /><span>Wyślij wiadomość</span></>
)}
```

### Route-Level Guards

| Route | Guard | Redirect Destination |
|---|---|---|
| `/me/profile` | `AuthenticatedRoute` | `/login` |
| `/me/organization` | `AuthenticatedRoute` | `/login` |
| `/volunteers/signup` | `AuthenticatedRoute` | `/login` |
| `/owner/verifications` | `AuthenticatedRoute` + `OwnerRoute` | `/` |

### Crisis Page In-Page Access Control

No route guard is applied. Logic runs inside the component:
- Guest or unauthenticated: `crisis` state set to `null` → no-crisis informational screen
- Logged-in non-owner, no active crisis: no-crisis screen without the start button
- Owner, no active crisis: no-crisis screen with "Ogłoś sytuację kryzysową"
- Active crisis, non-owner: read-only map with personal availability declaration
- Active crisis, owner: full management interface

---

## Routing & Route Guards

All routes are defined in `src/App.tsx`. Global providers wrapping the router:
- `StyledEngineProvider` — MUI CSS layer ordering
- `Toaster` — sonner notification outlet
- `AuthUserContext.Provider` — JWT auth state

```
/login                     UnauthenticatedRoute  →  Login
/register                  UnauthenticatedRoute  →  Register
/                          BaseLayout            →  MainDashboard
/employees                 BaseLayout            →  Employees
/category/:category        BaseLayout            →  CategoryDetail
/map                       BaseLayout            →  EmployeeMap
/search                    BaseLayout            →  SearchResults
/profile/:id               BaseLayout            →  EmployeeProfile
/volunteers                BaseLayout            →  Volunteers
/volunteers/signup         AuthenticatedRoute    →  BaseLayout  →  VolunteerSignup
/me/profile                AuthenticatedRoute    →  BaseLayout  →  UserProfile
/me/organization           AuthenticatedRoute    →  BaseLayout  →  OrgProfile
/owner/verifications       AuthenticatedRoute    →  OwnerRoute  →  BaseLayout  →  OwnerVerificationAdmin
/crisis                    BaseLayout            →  Crisis
*                          NotFound
```

`UnauthenticatedRoute` redirects already-authenticated users away from `/login` and `/register` back to `/`.

---

## Authentication & Session Lifecycle

### Login Flow
1. User submits credentials on `/login`
2. `handleUserLogin({ email, password })` → `POST /auth/login` → `{ accessToken, refreshToken }`
3. `setAuthTokens(accessToken, refreshToken)` decodes the JWT to extract `id`, `email`, `nickname`, `accountType`
4. Tokens and decoded claims stored in `localStorage` + React state
5. User redirected to `/`

### Token Refresh Flow
Triggered automatically before any API call when the token is within 120 seconds of expiry:
1. `getAccessToken()` detects upcoming expiry
2. Calls `postRefreshToken(refreshToken)` → `POST /auth/refresh-token`
3. New tokens stored in `localStorage` + React state
4. Active WebSocket clients receive an `update_token` emit with the new token
5. Original API call proceeds with the fresh token

### Session Expiry
If `postRefreshToken` fails:
1. `auth.hasExpired` set to `true`
2. `SessionExpiredModal` renders over the current page, blocking all interaction
3. User acknowledges → `resetAuth()` clears `localStorage` and resets all auth state
4. User is logged out; next navigation attempt redirects to `/login`

### Registration
Two separate endpoints and form flows:
- **Worker**: `POST /auth/register-user` — name, email, password, optional category preference
- **Organization**: `POST /auth/register-company` — organization name, NIP, REGON, institution type; supports `private` and `government` subtypes including military, emergency services (PSP/Pogotowie), police, public administration, NGO

---

## Internationalization

- **Library**: react-i18next
- **Language**: Polish only (`pl`)
- **Config**: `src/i18n/i18n.ts`
- **Translations**: `src/locales/pl/translation.json`

Translation keys are namespaced:

| Namespace | Contents |
|---|---|
| `shared.*` | Common buttons: yes, no, cancel, continue, goBack, ok |
| `login.*` | Login form labels and messages |
| `register.*` | Registration form labels |
| `dashboard.*` | Employee/volunteer status labels, category names, greeting |
| `volunteers.*` | Volunteers page title and subtitle |
| `notFound.*` | 404 page strings |
| `customCalendar.*` | Polish day and month names |
| `time.*` | Pluralized time units (days / hours / minutes / seconds) |
| `settings.*` | Profile settings and privacy labels |

Category names used across `Employees`, `Volunteers`, and `SearchResults` are all resolved via `t('dashboard.categories.${cat}')` to keep them consistent everywhere.

---

## WebSocket Integration

WebSocket connections are established and maintained with authenticated tokens via `websocketConnectWithToken` and `emitWithToken` from `useAuthenticatedApi`.

### Shared Event Types (`src/types/websocket.ts`)

| Event | Direction | Purpose |
|---|---|---|
| `update_token` | Client → Server | Sent after token refresh to keep WS session authenticated |
| `ws_auth_error` | Server → Client | Server rejects the WS token; triggers re-authentication |

### Auth Pattern

```ts
// Initial connection
await websocketConnectWithToken(wsClient)

// Every emit automatically uses a fresh token
await emitWithToken(wsClient, 'some_event', payload)
```

Token updates are propagated to all active WebSocket clients automatically during the refresh flow inside `AuthUserContext`, so long-lived connections never silently expire.
