# FortiGRC: Frontend UI Specification

## 1. Global UI & Navigation
* **Sidebar:** Add a new "Compliance" tab. Ensure navigation includes Dashboard, Risks, Compliance, Reports, and Settings.
* **Styling Framework:** Tailwind CSS, utilizing the existing dashboard layout.

## 2. Risk Registry View (`/risks`)
* **Data Table Columns:** Risk ID, Title, JNCSF Capability Category, Event Frequency, Event Magnitude (JOD), Status, Evidence Link.
* **"Add New Risk" Component (Modal/Drawer):**
    * **Input:** Risk Title (Text).
    * **Dropdown:** JNCSF Capability ('Architecture & Portfolio', 'Development', 'Delivery', 'Operations', 'Fundamental Capabilities', 'National Cyber Responsibility').
    * **Input:** Event Frequency (Number - representing quantitative annual occurrence rate to avoid qualitative subjectivity).
    * **Input:** Event Magnitude (Number - financial loss exposure in JOD).
    * **Dropdown:** Status ('Open', 'In Progress', 'Mitigated').
    * **Upload Zone:** Drag-and-drop file upload for "Supporting Documentation".

## 3. Compliance Management View (`/compliance`)
* **Data Table Columns:** Control Name, S.E.L.E.C.T Principle, Compliance Status, Audit Evidence.
* **"Add New Compliance Control" Component (Modal/Drawer):**
    * **Input:** Control Name (Text).
    * **Dropdown:** S.E.L.E.C.T Principle ('Strategic', 'Enterprise Driven', 'Livable', 'Economical', 'Capability Based', 'Trustable').
    * **Toggle:** Compliant / Non-Compliant.
    * **Upload Zone:** File upload area for audit evidence documentation.

## 4. Reports Dashboard (`/reports`)
* **Quantitative Exposure Chart:** Visualization (bar or line chart) displaying total financial exposure calculated from open risks.
* **JNCSF Posture Radar Chart:** Graphic showing the entity's maturity mapped against the six main JNCSF capabilities.
* **Export Controls:** "Generate Audit PDF" button to export a unified list of risks, linked controls, and evidence hyperlinks.

## 5. Settings Configuration (`/settings`)
* **Risk Appetite Parameters:** Input fields for admins to define acceptable financial loss thresholds.
* **Workforce Management:** Interface for managing user roles, access control, and tracking training/qualifications.
* **Zero Trust Configuration:** UI toggles to enforce Multi-Factor Authentication (MFA) and adjust session timeout limits.