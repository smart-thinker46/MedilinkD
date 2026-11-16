# Medilink-Desktop Form Redesign – QA Checklist

## Global
- [ ] App loads without console errors (`npm run dev` / `npm run build`).
- [ ] All modals open/close with Escape key and backdrop click.
- [ ] Focus moves into modal on open and returns on close.
- [ ] Tab order follows visual order; no focus traps.
- [ ] Black sidebar gradient renders on every redesigned modal.
- [ ] Fields are flat (no card wrappers); labels use `.module-form-field` span.
- [ ] Submit buttons use `.form-btn.form-btn-primary.module-form-submit`.
- [ ] Responsive: dual-column layout collapses on ≤768 px viewport.

## Patient Registration
- [ ] Four-step wizard navigates correctly.
- [ ] Draft save/restore works (`hmis_patient_draft`).
- [ ] Duplicate detection modal renders matches and requires override reason.
- [ ] Submission succeeds and patient list updates.

## Module Forms (spot-check)
For each converted module, verify:
- [ ] **Canteen** – diet, consumption, operational forms submit; fields flat.
- [ ] **HR** – all HrModal forms (Text, Area, Select, StaffSelect, Upload) submit.
- [ ] **Inventory** – InventoryModal and PO modals submit; validation intact.
- [ ] **Nursing** – workflow popup submits.
- [ ] **OT** – waiting-list and OT modals (12 forms) submit.
- [ ] **Payroll** – Generate Payslip modal submits.
- [ ] **Queue Management** – token/counter form submits.
- [ ] **Account Settings** – password change/reset + theme controls work.
- [ ] **AI Central/Chat** – workspace/compose forms submit.
- [ ] **Communication** – SMS/Email forms submit.
- [ ] **EHR** – clinical notes and radiology order forms submit.
- [ ] **Facilities** – Register Asset / Report Issue modals submit.
- [ ] **Finance** – Finance and Journals forms submit.
- [ ] **Integrations** – integration forms submit.
- [ ] **Patient/Portal views** – portal forms submit.
- [ ] **Setup/Signup** – setup and signup forms submit.
- [ ] **User Management** – user forms submit.
- [ ] **Workforce Planning** – all WfModal forms submit.

## Accessibility
- [ ] All interactive elements have visible focus indicators.
- [ ] Color contrast meets WCAG AA for text on black sidebar.
- [ ] Screen reader announces modal title and close button.
- [ ] Form errors are announced (aria-live or role="alert").

## Performance
- [ ] No layout shift when opening modals.
- [ ] Modal animation (prfPopIn) runs smoothly.

## Sign-off
- [ ] QA approved by: __________  Date: __________
