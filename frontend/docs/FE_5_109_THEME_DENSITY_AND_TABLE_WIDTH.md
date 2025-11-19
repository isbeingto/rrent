# RRent UI Density & Table Specification (v1)

## 1. Global Typography & Density

### 1.1 Typography
- **Root Font Size**: 14px (Browser default, Ant Design default).
- **Line Height**: 1.5715 (Ant Design default).
- **Font Family**: System default (Inter, -apple-system, BlinkMacSystemFont, etc.).

### 1.2 Spacing & Layout
- **Page Container Padding**:
  - Desktop (≥1280px): `24px` (`p-6`)
  - Mobile (<1280px): `16px` (`p-4`)
- **Card/Section Padding**:
  - Content: `24px` (`p-6`)
  - Header: `16px` vertical, `24px` horizontal.
- **Section Vertical Spacing**: `24px` (`gap-6` or `mb-6`).

### 1.3 Table Density
- **Density Level**: `middle` (Ant Design `size="middle"`).
- **Row Height**: Approx `47px` - `54px`.
- **Cell Padding**: `12px 8px` (Ant Design middle default).
- **Header Height**: Approx `40px`.

## 2. List vs. Detail View Strategy

| Feature | List View (ResourceTable) | Detail View (Show Page) |
| :--- | :--- | :--- |
| **Density** | **Compact** (High information density) | **Comfortable** (Readability focus) |
| **Container** | Full width card, minimal outer padding | Sectioned cards, clear separation |
| **Actions** | Icons only or compact buttons | Full buttons with text |

## 3. Table Column Width & Alignment Standards

To ensure a consistent experience across all 6 core resources (Organizations, Properties, Units, Tenants, Leases, Payments), the following rules apply.

### 3.1 General Column Rules

| Column Type | Width Strategy | Alignment | Ellipsis | Example |
| :--- | :--- | :--- | :--- | :--- |
| **ID / Code** | Fixed (`80px` - `100px`) | Left | Yes | `#1024`, `ORG-01` |
| **Name / Title** | Flexible (No width or `minWidth`) | Left | Yes | `Sunset Apt`, `John Doe` |
| **Status** | Fixed (`100px` - `120px`) | Left/Center | No | `Active`, `Paid` (Tag) |
| **Date** | Fixed (`120px`) | Center/Left | No | `2023-10-01` |
| **Currency** | Fixed (`120px` - `150px`) | **Right** | Yes | `$1,200.00` |
| **Actions** | Fixed (`100px` - `120px`) | Center/Right | No | `Edit`, `Delete` |

### 3.2 Responsive Strategy (Breakpoints)

- **Desktop (≥1440px)**:
  - **Goal**: No horizontal scrollbar.
  - All key columns visible.
  - Actions column fully accessible.

- **Laptop / Tablet (1024px - 1439px)**:
  - **Goal**: Horizontal scrollbar allowed, but key info visible first.
  - **Strategy**:
    - `scroll={{ x: 1000 }}` (or similar min-width) enabled on Table.
    - Actions column can be `fixed: 'right'` if necessary (but prefer avoiding sticky if simple scroll works).
    - Priority: Name > Status > Actions > Amount > Date > ID.

- **Mobile (<1024px)**:
  - **Goal**: Usable via scroll.
  - Horizontal scroll is mandatory.
  - Consider hiding non-essential columns (e.g., Created At, ID) via `responsive: ['md']` if AntD supports it, or just let it scroll.

## 4. Resource-Specific Column Matrix

### 4.1 Organizations
| Column | Width | Align | Notes |
| :--- | :--- | :--- | :--- |
| Name | Flex | Left | Primary info |
| Code | 100px | Left | |
| Status | 100px | Left | |
| Created At | 120px | Center | |
| Actions | 100px | Center | |

### 4.2 Properties
| Column | Width | Align | Notes |
| :--- | :--- | :--- | :--- |
| Name | Flex | Left | |
| Organization | 200px | Left | Link to Org |
| Status | 100px | Left | |
| Created At | 120px | Center | |
| Actions | 100px | Center | |

### 4.3 Units
| Column | Width | Align | Notes |
| :--- | :--- | :--- | :--- |
| Unit Number | 120px | Left | |
| Property | Flex | Left | |
| Status | 100px | Left | Occupied/Vacant |
| Rent | 120px | Right | |
| Actions | 100px | Center | |

### 4.4 Tenants
| Column | Width | Align | Notes |
| :--- | :--- | :--- | :--- |
| Name | Flex | Left | |
| Email | 200px | Left | |
| Phone | 150px | Left | |
| Status | 100px | Left | |
| Actions | 100px | Center | |

### 4.5 Leases
| Column | Width | Align | Notes |
| :--- | :--- | :--- | :--- |
| Lease # | 100px | Left | |
| Tenant | Flex | Left | |
| Unit | 150px | Left | |
| Start Date | 120px | Center | |
| End Date | 120px | Center | |
| Status | 100px | Left | |
| Rent | 120px | Right | |
| Actions | 100px | Center | |

### 4.6 Payments
| Column | Width | Align | Notes |
| :--- | :--- | :--- | :--- |
| ID | 80px | Left | |
| Tenant | Flex | Left | |
| Lease | 120px | Left | |
| Amount | 120px | Right | |
| Due Date | 120px | Center | |
| Status | 100px | Left | |
| Method | 100px | Left | |
| Actions | 100px | Center | |

## 5. Manual Verification Checklist

- [x] **Global**: `MainLayout` uses `p-6` (desktop).
- [x] **Global**: Section spacing is consistent (`gap-6`).
- [x] **Table**: `ResourceTable` uses `size="middle"`.
- [x] **Table**: No horizontal scroll at 1440px for all 6 lists.
- [x] **Table**: Horizontal scroll appears gracefully at 1024px (content not crushed).
- [x] **Columns**: Amount columns are Right aligned.
- [x] **Columns**: Date columns are fixed width (~120px).
- [x] **Columns**: Actions column is visible and usable.
