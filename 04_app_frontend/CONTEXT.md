# Stage 04: App-Like Frontend & PWA Directory

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../_config/data_schema.json` | Contact schema, partner fields, and validation limits |
| Layer 4 (Working)   | `../03_hardened_api/output/api_test_results.md` | API contracts for `POST`, `PUT`, `GET`, and export |

## Process
1. Verify the React 19 + Tailwind CSS v4 frontend component structure in `src/`.
2. Inspect the responsive layout across desktop and mobile form factors:
   - `OnboardingScreen`: 3-mode startup gate: Sign In & Reconnect (with email OTP & workspace discovery), Create New Business, and Pair Device.
   - `WorkspaceHeader`: Responsive bar with business workspace switcher, live cloud/local sync status, pairing modal, and Supabase diagnostics modal (with table health checks and schema copier).
   - `LeadCaptureForm`: Multi-field contact form with partner disclosure toggle and real-time field error indicators.
   - `LeadDashboard`: Searchable directory with live filter, edit modal, and Excel download action.
3. Validate PWA configuration (`manifest.json` and install prompt hooks).
4. Generate the frontend architecture and build verification report.

## Outputs
- `src/`: Production frontend application components (including `OnboardingScreen.tsx`).
- `output/frontend_build_report.md`: Component hierarchy, responsive breakpoint validation, and PWA capabilities summary.
- **Review Gate**: Confirm first-time onboarding gate, responsive desktop and mobile UX, instant client-side validation feedback, and functional Excel export integration.
