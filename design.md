# Design System Specification

This document is the central reference for the project's typography tokens, color and theme tokens, and mapping between Figma design components and the Vuetify/custom components implemented in the project.

## 1. Overview

Use this specification as the single source of truth when translating Figma designs into Nuxt/Vuetify code. It covers:

- Typography tokens and their Vuetify utility classes.
- Primitive color palettes, opacity tokens, and active light/dark theme colors.
- Figma-to-project component mappings and component-level token usage.

The source values are based on the project's Vuetify configuration, including `@core/scss/template/libs/vuetify/_variables.scss` and [theme.ts](../plugins/vuetify/theme.ts).

## 2. Typography Specification

This section details the typography tokens configured for this project, based on the variables declared in `@core/scss/template/libs/vuetify/_variables.scss`.

### Base Font Family

- **Font Family:** `"Poppins", sans-serif` (with system-specific fallbacks)

### Typography Tokens Table

| Token Name | Size | Weight | Line Height | Letter Spacing | Text Transform | Vuetify Utility Class |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **h1** | `2.875rem` (46px) | `500` (Medium) | `4.25rem` (68px) | `normal` | — | `.text-h1` |
| **h2** | `2.375rem` (38px) | `500` (Medium) | `3.5rem` (56px) | `normal` | — | `.text-h2` |
| **h3** | `1.75rem` (28px) | `500` (Medium) | `2.625rem` (42px) | `normal` | — | `.text-h3` |
| **h4** | `1.5rem` (24px) | `500` (Medium) | `2.375rem` (38px) | `normal` | — | `.text-h4` |
| **h5** | `1.125rem` (18px) | `500` (Medium) | `1.75rem` (28px) | `normal` | — | `.text-h5` |
| **h6** | `0.9375rem` (15px) | — (Default) | `1.375rem` (22px) | `normal` | — | `.text-h6` |
| **subtitle-1** | `0.9375rem` (15px) | — (Default) | `1.375rem` (22px) | `normal` | — | `.text-subtitle-1` |
| **subtitle-2** | `0.8125rem` (13px) | — (Default) | `1.25rem` (20px) | `normal` | — | `.text-subtitle-2` |
| **body-1** | `0.9375rem` (15px) | — (Default) | `1.375rem` (22px) | `normal` | — | `.text-body-1` |
| **body-2** | `0.8125rem` (13px) | — (Default) | `1.25rem` (20px) | `normal` | — | `.text-body-2` |
| **caption** | `0.8125rem` (13px) | — (Default) | `1.125rem` (18px) | `0.025rem` | — | `.text-caption` |
| **overline** | — (Default) | `400` (Regular) | `0.875rem` (14px) | `0.05rem` | — | `.text-overline` |
| **button** | `0.9375rem` (15px) | `500` (Medium) | `1.375rem` (22px)* | `normal` | `capitalize` | `.text-button` |

\*Line-height for button token is configured separately via `$button-line-height`.

### Usage in Vuetify Components

Vuetify applies these typography settings automatically across components:

1. **Tags / Classes:** You can apply these styles to any element using the Vuetify CSS class equivalent (e.g., `<span class="text-h3">Title</span>`).
2. **Vuetify Buttons:** The `button` typography token properties (font-size, font-weight, capitalized transform) are automatically bound to the `<VBtn>` component via Vuetify's default compiler.

### Eyebrow / Overline Usage

- Use eyebrow or overline text above a main title only when it communicates real context, such as category, scope, status, or hierarchy.
- Do not add eyebrow text as decorative filler. Avoid redundant stacks where the eyebrow, title, and subtitle repeat the same message.
- Keep eyebrow copy short, specific, sentence case, and visually subordinate to the main title.
- Do not use arbitrary numbering, generic labels, or interchangeable phrases unless they communicate meaningful product context.

### Avoiding AI-Generated Visual Patterns

- Design must feel intentional and grounded in the product context, not assembled from generic AI patterns.
- Avoid decorative gradients, excessive badges, repeated rounded cards, arbitrary icons, unnecessary overlines, and vague or inflated copy.
- Every decorative element must support hierarchy, meaning, interaction, or accessibility. Remove decoration that adds no information.
- Choose one distinctive visual signature per page and keep the surrounding layout disciplined.

## 3. Color Specification

This section details the color tokens, primitive palettes, opacity levels, and active light/dark Vuetify theme colors configured in [theme.ts](../plugins/vuetify/theme.ts).

### Primitive Primary Colors

The primary brand colors are configured as a green-based palette. These primitive colors serve as the foundation for the primary brand mappings across the application.

| Primitive Color Token | Light Theme Hex Value | Dark Theme Hex Value | Description / Typical Use Case |
| :--- | :--- | :--- | :--- |
| `primary-100` | `#DBFDDB` | `#DBFDDB` | Softest green, used for extremely light background tints |
| `primary-200` | `#B8FAB8` | `#B8FAB8` | Very light green accent tint |
| `primary-300` | `#81F483` | `#81F483` | Light green tint |
| `primary-400` | `#43E545` | `#43E545` | Light brand green |
| `primary-500` (Main) | `#10AF13` | `#10AF13` | **Primary Brand Color**, active selections, primary indicators |
| `primary-600` (Dark) | `#108513` | `#108513` | Primary hover states, active button states |
| `primary-700` | `#126915` | `#126915` | Dark green brand variant |
| `primary-800` | `#115614` | `#115614` | Deeper green brand variant |
| `primary-900` | `#033006` | `#10AF13` | Deepest background green tint (Light) / Active fallback (Dark) |

### Reference & Opacity Tokens

These tokens are generated using transparency (alpha channels) applied on the primary brand color (`#10AF13`). They are used for state overlays, backdrop effects, and subtle highlights.

| Token Name | Hex Code (with Alpha) | Equivalent Opacity | Description / Typical Use Case |
| :--- | :--- | :--- | :--- |
| `primary-opacity-lighter` | `#10AF1314` | `8%` | Very subtle hover overlays |
| `primary-opacity-light` | `#10AF1329` | `16%` | Focus states, selection indicators |
| `primary-opacity-main` | `#10AF133D` | `24%` | Active selection backgrounds |
| `primary-opacity-dark` | `#10AF1352` | `32%` | High contrast selection states |
| `primary-opacity-darker` | `#10AF1361` | `38%` | Strongest transparent brand overlay |

### Vuetify Light Theme Colors

The light theme configures standard Vuetify colors along with system background, surface, and grey level styling.

| Vuetify Color Key | Hex Value | Description / Usage |
| :--- | :--- | :--- |
| `primary` | `#10AF13` | Brand primary color (mapped to `lightPrimary500`) |
| `primary-darken-1` | `#108513` | Brand primary darken variant (mapped to `lightPrimary600`) |
| `on-primary` | `#FFFFFF` | Text/icon color placed on top of `primary` elements |
| `secondary` | `#8A8D93` | Secondary text, inactive states, auxiliary buttons |
| `secondary-darken-1` | `#7C7F84` | Secondary darken state |
| `on-secondary` | `#FFFFFF` | Text/icon color placed on top of `secondary` elements |
| `success` | `#56CA00` | Success indicators, success border outlines, validation green |
| `success-darken-1` | `#4DB600` | Darken success variant |
| `info` | `#16B1FF` | Informational banners, badges, cyan highlights |
| `warning` | `#FFB400` | Warnings, intermediate alert states |
| `error` | `#FF4C51` | Error states, validation text red, error dialogs |
| `background` | `#FAFAFA` | Default page background (updated to `grey-light` color) |
| `on-background` | `#2E263D` | Base body text color |
| `grey-light` | `#FAFAFA` | Figma design token for light grey background |
| `surface` | `#FFFFFF` | Card containers, menus, dialog backgrounds |
| `on-surface` | `#2E263D` | Text/icon color placed on top of `surface` elements |
| `track-bg` | `#F0F2F8` | Progress bar background track |
| `chat-bg` | `#F7F6FA` | Chat bubble background container |

### Vuetify Dark Theme Colors

The dark theme shifts backgrounds and surfaces to darker values while retaining the brand primary colors for consistent user experience.

| Vuetify Color Key | Hex Value | Description / Usage |
| :--- | :--- | :--- |
| `primary` | `#10AF13` | Brand primary color (uses `staticPrimaryColor`) |
| `primary-darken-1` | `#108513` | Brand primary darken variant (uses `staticPrimaryDarkenColor`) |
| `on-primary` | `#FFFFFF` | Text/icon color placed on top of `primary` elements |
| `secondary` | `#8A8D93` | Secondary text, inactive states |
| `success` | `#56CA00` | Success indicators |
| `info` | `#16B1FF` | Informational alerts and indicators |
| `warning` | `#FFB400` | Warning messages and indicators |
| `error` | `#FF4C51` | Failure notifications and fields |
| `background` | `#28243D` | Dark mode base layout background |
| `on-background` | `#E7E3FC` | High-readability white/grey text for dark backgrounds |
| `surface` | `#312D4B` | Dark mode card container and surface background |
| `on-surface` | `#E7E3FC` | Text/icon color placed on top of `surface` elements |
| `track-bg` | `#474360` | Dark mode progress track |
| `chat-bg` | `#373452` | Dark mode chat bubble container |

### Grey Palette Specification

Grey tokens are utilized for semantic text weights, borders, dividers, and various shades of grey elements.

| Grey Token | Light Mode Hex Value | Dark Mode Hex Value | Main Usage |
| :--- | :--- | :--- | :--- |
| `grey-light` | `#FAFAFA` | - | Figma design token for light grey background |
| `grey-50` | `#FAFAFA` | `#2A2E42` | Very light tint / container offsets |
| `grey-100` | `#F5F5F5` | `#2F3349` | Divider lines and border outlines |
| `grey-200` | `#EEEEEE` | `#4A5072` | Layout grid dividers |
| `grey-300` | `#E0E0E0` | `#5E6692` | Placeholders, disabled elements |
| `grey-400` | `#BDBDBD` | `#7983BB` | Secondary border colors |
| `grey-500` | `#9E9E9E` | `#8692D0` | Standard muted texts and secondary icons |
| `grey-600` | `#757575` | `#AAB3DE` | Active states on muted content |
| `grey-700` | `#616161` | `#B6BEE3` | Medium emphasis content |
| `grey-800` | `#424242` | `#CFD3EC` | High emphasis dark text (Light theme) |
| `grey-900` | `#212121` | `#E7E9F6` | Title texts / near-black headers |

## 4. Figma-to-Project Component Mapping

This section establishes the mapping between Figma design components and the Vuetify/custom components implemented in the project.

### Agent Workflow: Figma-to-Code Execution

When using Figma MCP to read design properties:

1. **Extract design tokens:** Check node's colors, typography style, border-radius, and layer name.
2. **Compare with Project Tokens:**
   - Colors: See [Color Specification](#3-color-specification) (e.g. mapping Figma `#10AF13` to `primary`).
   - Typography: See [Typography Specification](#2-typography-specification) (e.g. mapping body sizes to `text-body-*`).
3. **Select Component:** Look up matching component in mapping table below.
4. **Implement:** Write clean Nuxt code utilizing mapped components and design tokens.

### Component Mapping Table

| Figma Component | Vuetify / Project Component | Used on (count of page) | Pages Used In |
| :--- | :--- | :---: | :--- |
| **Card** (Container, Paper) | `VCard` / `VCardText` | 13 | `index.vue`, `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `attendance-detail.vue`, `login.vue`, `dashboard-teacher.vue`, `attendance.vue`, `user.vue`, `classes.vue`, `schedule.vue`, `design-system.vue`, `meeting-journal/create.vue` |
| **Button** (Primary, Secondary, Icon) | `VBtn` | 12 | `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `attendance-detail.vue`, `login.vue`, `dashboard-teacher.vue`, `attendance.vue`, `user.vue`, `classes.vue`, `schedule.vue`, `design-system.vue`, `meeting-journal/create.vue` |
| **Text Field** (Input, Search) | `VTextField` | 12 | `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `attendance-detail.vue`, `login.vue`, `dashboard-teacher.vue`, `attendance.vue`, `user.vue`, `classes.vue`, `schedule.vue`, `design-system.vue`, `meeting-journal/create.vue` |
| **Row Grid** (Horizontal Layout) | `VRow` | 11 | `user-variant-2.vue`, `attendance-detail.vue`, `login.vue`, `dashboard-teacher.vue`, `attendance.vue`, `user.vue`, `classes.vue`, `schedule.vue`, `design-system.vue`, `account-settings.vue`, `meeting-journal/create.vue` |
| **Column Grid** (Vertical Grid) | `VCol` | 11 | `user-variant-2.vue`, `attendance-detail.vue`, `login.vue`, `dashboard-teacher.vue`, `attendance.vue`, `user.vue`, `classes.vue`, `schedule.vue`, `design-system.vue`, `account-settings.vue`, `meeting-journal/create.vue` |
| **Avatar** (User Photo, Initials) | `VAvatar` | 10 | `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `attendance-detail.vue`, `dashboard-teacher.vue`, `attendance.vue`, `user.vue`, `classes.vue`, `design-system.vue`, `meeting-journal/create.vue` |
| **Icon** | `VIcon` | 9 | `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `attendance-detail.vue`, `dashboard-teacher.vue`, `attendance.vue`, `user.vue`, `design-system.vue`, `meeting-journal/create.vue` |
| **Dropdown** (Select) | `VSelect` | 8 | `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `attendance.vue`, `user.vue`, `classes.vue`, `design-system.vue`, `meeting-journal/create.vue` |
| **Chip** (Tag, Status Badge) | `VChip` | 8 | `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `attendance-detail.vue`, `dashboard-teacher.vue`, `attendance.vue`, `classes.vue`, `design-system.vue` |
| **Snackbar** (Toast message) | `VSnackbar` | 8 | `assessments.vue`, `attendance-detail.vue`, `dashboard-teacher.vue`, `attendance.vue`, `classes.vue`, `schedule.vue`, `design-system.vue`, `meeting-journal/create.vue` |
| **Divider** (Separator Line) | `VDivider` | 7 | `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `dashboard-teacher.vue`, `attendance.vue`, `schedule.vue`, `design-system.vue` |
| **Tooltip** | `VTooltip` | 6 | `user-variant-2.vue`, `reports.vue`, `assessments.vue`, `user.vue`, `classes.vue`, `design-system.vue` |
| **Section Title** | `UiSectionHeader` | 5 | `user-variant-2.vue`, `attendance-detail.vue`, `user.vue`, `account-settings.vue`, `meeting-journal/create.vue` |
| **Table** (Custom Query View) | `UiTableView` | 3 | `attendance-detail.vue`, `classes.vue`, `design-system.vue` |
| **Data Table** | `VDataTable` / `VDataTableServer` | 4 | `reports.vue`, `assessments.vue`, `attendance-detail.vue`, `design-system.vue` (VDataTableServer in `user-variant-2.vue`, `user.vue`) |
| **List Group** / **Navigation List** | `VList` / `VListItem` | 4 | `user-variant-2.vue`, `user.vue`, `classes.vue`, `design-system.vue` |
| **Toggle Button Group** | `VBtnToggle` | 4 | `reports.vue`, `assessments.vue`, `schedule.vue`, `design-system.vue` |
| **Tabs** | `VTabs` / `VTab` | 3 | `reports.vue`, `assessments.vue`, `design-system.vue` |
| **Checkbox** | `VCheckbox` | 3 | `dashboard-teacher.vue`, `design-system.vue`, `meeting-journal/create.vue` |
| **Dialog / Modal** | `VDialog` | 3 | `classes.vue`, `schedule.vue`, `meeting-journal/create.vue` |
| **Autocomplete / Search Combobox** | `UiAutoComplete` / `VAutocomplete` | 2 / 1 | `user-variant-2.vue`, `user.vue` (VAutocomplete in `attendance.vue`) |
| **Menu / Popover** | `VMenu` | 2 | `user-variant-2.vue`, `user.vue` |
| **Skeleton Loader** | `VSkeletonLoader` | 2 | `reports.vue`, `assessments.vue` |
| **Expansion Panel / Accordion** | `VExpansionPanels` | 1 | `meeting-journal/create.vue` |
| **Radio Group / Radio Button** | `VRadioGroup` / `VRadio` | 1 | `schedule.vue` |
| **Alert Banner** | `VAlert` | 1 | `design-system.vue` |
| **Text Area** (Multi-line Input) | `VTextarea` | 1 | `meeting-journal/create.vue` |

### Detailed Token Application by Component

Below details what specific color and typography tokens are configured on these components within the codebase.

#### Layout & Grid (`VRow`, `VCol`)

- **Typography:** None.
- **Colors:** Implicitly inherits `background` (`#FAFAFA` in light theme, `#28243D` in dark theme).
- **Layout rule:** Page-level and section-level layouts must use Vuetify `VRow` and `VCol`. Do not use raw `div`-based CSS Grid for outer page shells or primary columns.
- **Spacing rule:** Use `gap: 24px` (`gap-6` equivalent) between primary layout sections. Keep spacing consistent across desktop, tablet, and mobile breakpoints.
- **Sizing rule:** Use `cols="12"` as the mobile baseline, then add Vuetify breakpoint props such as `sm`, `md`, or `lg` for larger layouts.

#### Teacher Dashboard Shell

- Use Vuetify's standard 12-column grid: `VRow` with `VCol cols="12" lg="8"` for the main content and `VCol cols="12" lg="4"` for the sidebar.
- Keep the default `VRow`/`VCol` gutters, which provide 24px visual separation between columns and rows. Do not add a second 24px gap on top of those gutters.
- Keep the main content and sidebar stacks at `gap: 24px` internally.
- Use the direct welcome headline (`Good morning, Julie.`) with supporting copy below; do not add a decorative eyebrow above the main title.
- Keep `min-width: 0` on dashboard content containers so tables can shrink without horizontal overflow.
- Keep dashboard-specific internal grids only for local content patterns such as summary cards or schedule rows; outer page layout remains `VRow`/`VCol`.

#### Cards (`VCard`, `VCardText`, `VCardTitle`, `VCardActions`)

- **Typography:** Titles map to `h6` or `subtitle-1`. Text maps to `body-2` or `body-1`.
- **Colors:**
  - `VCard` default background uses `surface` (`#FFFFFF` light, `#312D4B` dark).
  - Borders/actions use `grey-100` (`#F5F5F5` light, `#2F3349` dark).

#### Buttons & Actions (`VBtn`, `VIcon`)

- **Typography:** `VBtn` automatically maps properties of the `button` typography token (15px, medium weight).
- **Shape:** Every `VBtn` variant uses a full rounded corner radius (`rounded="pill"`, equivalent to `border-radius: 999px`). Keep this rule for flat, outlined, text, tonal, elevated, plain, and icon buttons. Use `VBtnToggle` only when grouped controls require a separate group container treatment.
- **Colors:**
  - Primary button: `primary` (`#10AF13`). Hover/Pressed states: `primary-darken-1` (`#108513`).
  - Secondary button: `secondary` (`#8A8D93`).
  - Error/Delete button: `error` (`#FF4C51`).
  - Icons: Inherit text colors (`text-primary`, `text-secondary`) or dynamic status colors.

#### Forms & Inputs (`VTextField`, `VSelect`, `UiAutoComplete`, `VCheckbox`, `VSwitch`)

- **Typography:** Labels and input values use `body-2` (13px).
- **Colors:**
  - Borders/Bases: Standard Vuetify input border tokens.
  - Active selection color: `primary` (`#10AF13`).

#### Lists & Navigation (`VList`, `VListItem`, `VListItemTitle`, `VListItemSubtitle`)

- **Typography:** `VListItemTitle` uses `body-1` (15px). `VListItemSubtitle` uses `body-2` (13px) or `caption` (13px with wider spacing).
- **Colors:** Active list item uses `primary` text/bg overlay. Muted list items use `text-secondary` or `disabled` color.

#### Tables & Data Representation (`UiTableView`, `VDataTable`, `VDataTableServer`)

- **Typography:** Table headers use `subtitle-2` or `overline`. Cell text uses `body-2`.
- **Colors:** Row borders use `grey-100`. Alternate rows or hover states use `grey-50` (`#FAFAFA` light, `#2A2E42` dark).
- **Responsive pattern:** Keep `VDataTable` for desktop and use `UiTableView`'s optional `mobileCards` mode with an explicit `mobile-cards` slot when mobile needs different content grouping or action hierarchy. Avoid `nth-child` and pseudo-element labels for structural transformations.
