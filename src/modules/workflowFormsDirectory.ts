import type { WorkflowForm, WorkflowModule } from "./workflowCatalog";

export const GENERATED_WORKFLOW_FORMS_BY_ID: Record<number, WorkflowForm[]> = {
  "1": [
    {
      "id": "new_patient_registration",
      "title": "New Patient Registration Form",
      "purpose": "Capture and save new patient registration form data.",
      "fields": [
        {
          "key": "first_name",
          "label": "First name",
          "type": "text",
          "required": true,
          "note": "Legal first name as per national ID"
        },
        {
          "key": "middle_name",
          "label": "Middle name",
          "type": "text",
          "required": false,
          "note": "Middle name if applicable"
        },
        {
          "key": "last_name",
          "label": "Last name",
          "type": "text",
          "required": true,
          "note": "Surname / family name"
        },
        {
          "key": "date_of_birth",
          "label": "Date of birth",
          "type": "date",
          "required": true,
          "note": "Full DOB - used to calculate age"
        },
        {
          "key": "gender",
          "label": "Gender",
          "type": "select",
          "required": true,
          "options": [
            "Male",
            "Female",
            "Other"
          ],
          "note": "Male | Female | Other"
        },
        {
          "key": "marital_status",
          "label": "Marital status",
          "type": "select",
          "required": false,
          "options": [
            "Single",
            "Married",
            "Widowed",
            "Divorced"
          ],
          "note": "Single | Married | Widowed | Divorced"
        },
        {
          "key": "nationality",
          "label": "Nationality",
          "type": "text",
          "required": false,
          "note": "Country of citizenship"
        },
        {
          "key": "id_type",
          "label": "ID type",
          "type": "select",
          "required": true,
          "options": [
            "National ID",
            "Passport",
            "Birth cert",
            "Refugee",
            "Alien"
          ],
          "note": "National ID | Passport | Birth cert | Refugee | Alien"
        },
        {
          "key": "id_number",
          "label": "ID number",
          "type": "text",
          "required": true,
          "note": "Document identification number"
        },
        {
          "key": "sha_number",
          "label": "SHA number",
          "type": "text",
          "required": false,
          "note": "Social Health Authority number"
        },
        {
          "key": "primary_phone",
          "label": "Primary phone",
          "type": "tel",
          "required": true,
          "note": "Main contact mobile number"
        },
        {
          "key": "secondary_phone",
          "label": "Secondary phone",
          "type": "tel",
          "required": false,
          "note": "Alternate phone number"
        },
        {
          "key": "email_address",
          "label": "Email address",
          "type": "email",
          "required": false,
          "note": "For portal access and notifications"
        },
        {
          "key": "county",
          "label": "County",
          "type": "select",
          "required": true,
          "note": "Kenya county of residence"
        },
        {
          "key": "sub_county",
          "label": "Sub-county",
          "type": "select",
          "required": true,
          "note": "Sub-county within county"
        },
        {
          "key": "village_estate",
          "label": "Village / estate",
          "type": "text",
          "required": false,
          "note": "Village, estate or street name"
        },
        {
          "key": "address_line",
          "label": "Address line",
          "type": "text",
          "required": false,
          "note": "Physical or postal address"
        },
        {
          "key": "blood_group",
          "label": "Blood group",
          "type": "select",
          "required": false,
          "note": "ABO and Rh type if known"
        },
        {
          "key": "religion",
          "label": "Religion",
          "type": "select",
          "required": false,
          "note": "For dietary and pastoral care planning"
        },
        {
          "key": "occupation",
          "label": "Occupation",
          "type": "text",
          "required": false,
          "note": "Current occupation"
        },
        {
          "key": "education_level",
          "label": "Education level",
          "type": "select",
          "required": false,
          "options": [
            "None",
            "Primary",
            "Secondary",
            "Tertiary"
          ],
          "note": "None | Primary | Secondary | Tertiary"
        },
        {
          "key": "patient_photo",
          "label": "Patient photo",
          "type": "text",
          "required": false,
          "note": "Biometric photo for identity verification"
        }
      ]
    },
    {
      "id": "next_of_kin",
      "title": "Next of Kin Form",
      "purpose": "Capture and save next of kin form data.",
      "fields": [
        {
          "key": "full_name",
          "label": "Full name",
          "type": "text",
          "required": true,
          "note": "Complete name of next of kin"
        },
        {
          "key": "relationship",
          "label": "Relationship",
          "type": "select",
          "required": true,
          "options": [
            "Spouse",
            "Parent",
            "Child",
            "Sibling",
            "Guardian",
            "Other"
          ],
          "note": "Spouse | Parent | Child | Sibling | Guardian | Other"
        },
        {
          "key": "phone_number",
          "label": "Phone number",
          "type": "tel",
          "required": true,
          "note": "Primary contact number"
        },
        {
          "key": "email",
          "label": "Email",
          "type": "email",
          "required": false,
          "note": "Email address of next of kin"
        },
        {
          "key": "physical_address",
          "label": "Physical address",
          "type": "textarea",
          "required": false,
          "note": "Residential address"
        },
        {
          "key": "is_primary_contact",
          "label": "Is primary contact",
          "type": "checkbox",
          "required": true,
          "note": "Tick if this is the first emergency contact"
        },
        {
          "key": "has_consent_authority",
          "label": "Has consent authority",
          "type": "checkbox",
          "required": true,
          "note": "Tick if authorised to consent on behalf of patient"
        }
      ]
    },
    {
      "id": "insurance_registration",
      "title": "Insurance Registration Form",
      "purpose": "Capture and save insurance registration form data.",
      "fields": [
        {
          "key": "insurance_scheme",
          "label": "Insurance scheme",
          "type": "select",
          "required": true,
          "note": "Select insurer from approved scheme list"
        },
        {
          "key": "policy_number",
          "label": "Policy number",
          "type": "text",
          "required": true,
          "note": "Insurance policy or membership number"
        },
        {
          "key": "member_name_on_policy",
          "label": "Member name on policy",
          "type": "text",
          "required": true,
          "note": "Name as appearing on the insurance card"
        },
        {
          "key": "is_principal_member",
          "label": "Is principal member",
          "type": "select",
          "required": true,
          "options": [
            "Principal",
            "Dependent"
          ],
          "note": "Principal | Dependent"
        },
        {
          "key": "principal_id_number",
          "label": "Principal ID number",
          "type": "text",
          "required": false,
          "note": "If dependent: national ID of main member"
        },
        {
          "key": "policy_start_date",
          "label": "Policy start date",
          "type": "date",
          "required": false,
          "note": "Policy validity start"
        },
        {
          "key": "policy_expiry_date",
          "label": "Policy expiry date",
          "type": "date",
          "required": true,
          "note": "Policy expiry - system alerts if expired"
        },
        {
          "key": "annual_benefit_limit",
          "label": "Annual benefit limit",
          "type": "number",
          "required": false,
          "note": "Maximum coverage amount in KES"
        }
      ]
    }
  ],
  "2": [
    {
      "id": "admission",
      "title": "Admission Form",
      "purpose": "Capture and save admission form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "MRN - auto-fills demographics"
        },
        {
          "key": "admission_type",
          "label": "Admission type",
          "type": "select",
          "required": true,
          "options": [
            "Elective",
            "Emergency",
            "Transfer in",
            "Day case"
          ],
          "note": "Elective | Emergency | Transfer in | Day case"
        },
        {
          "key": "admission_source",
          "label": "Admission source",
          "type": "select",
          "required": true,
          "options": [
            "OPD",
            "Emergency",
            "Referral",
            "Theatre",
            "Direct"
          ],
          "note": "OPD | Emergency | Referral | Theatre | Direct"
        },
        {
          "key": "admitting_doctor",
          "label": "Admitting doctor",
          "type": "select",
          "required": true,
          "note": "Doctor requesting admission"
        },
        {
          "key": "admitting_diagnosis",
          "label": "Admitting diagnosis",
          "type": "text",
          "required": true,
          "note": "Working diagnosis at time of admission"
        },
        {
          "key": "ward",
          "label": "Ward",
          "type": "select",
          "required": true,
          "note": "Target ward"
        },
        {
          "key": "bed",
          "label": "Bed",
          "type": "select",
          "required": true,
          "note": "Available bed in selected ward"
        },
        {
          "key": "insurance_pre_authorisation",
          "label": "Insurance pre-authorisation",
          "type": "text",
          "required": false,
          "note": "Pre-auth reference number if insured"
        },
        {
          "key": "consent_obtained",
          "label": "Consent obtained",
          "type": "checkbox",
          "required": true,
          "note": "Confirm admission consent obtained"
        },
        {
          "key": "special_requirements",
          "label": "Special requirements",
          "type": "textarea",
          "required": false,
          "note": "Dietary, religious, or care requirements"
        }
      ]
    },
    {
      "id": "discharge",
      "title": "Discharge Form",
      "purpose": "Capture and save discharge form data.",
      "fields": [
        {
          "key": "discharge_type",
          "label": "Discharge type",
          "type": "select",
          "required": true,
          "options": [
            "Routine",
            "LAMA",
            "Transfer out",
            "Absconded",
            "Deceased",
            "Day case complete"
          ],
          "note": "Routine | LAMA | Transfer out | Absconded | Deceased | Day case complete"
        },
        {
          "key": "discharge_diagnosis",
          "label": "Discharge diagnosis",
          "type": "text",
          "required": true,
          "note": "Final confirmed diagnosis at discharge"
        },
        {
          "key": "summary_of_stay",
          "label": "Summary of stay",
          "type": "textarea",
          "required": true,
          "note": "Investigations done, procedures performed, treatment given"
        },
        {
          "key": "condition_at_discharge",
          "label": "Condition at discharge",
          "type": "select",
          "required": true,
          "options": [
            "Improved",
            "Stable",
            "Deteriorated",
            "Deceased"
          ],
          "note": "Improved | Stable | Deteriorated | Deceased"
        },
        {
          "key": "discharge_medications",
          "label": "Discharge medications",
          "type": "text",
          "required": true,
          "note": "All medications prescribed at discharge with dose, frequency, duration"
        },
        {
          "key": "follow_up_date",
          "label": "Follow-up date",
          "type": "date",
          "required": true,
          "note": "Date of next appointment"
        },
        {
          "key": "follow_up_doctor",
          "label": "Follow-up doctor",
          "type": "select",
          "required": false,
          "note": "Doctor to see at follow-up"
        },
        {
          "key": "follow_up_instructions",
          "label": "Follow-up instructions",
          "type": "textarea",
          "required": true,
          "note": "Warning signs to watch for, activity restrictions"
        },
        {
          "key": "wound_care_instructions",
          "label": "Wound care instructions",
          "type": "textarea",
          "required": false,
          "note": "For surgical or trauma patients"
        },
        {
          "key": "dietary_instructions",
          "label": "Dietary instructions",
          "type": "textarea",
          "required": false,
          "note": "Dietary modifications if needed"
        },
        {
          "key": "referring_back_to",
          "label": "Referring back to",
          "type": "text",
          "required": false,
          "note": "For transfer - facility receiving the patient"
        }
      ]
    },
    {
      "id": "ward_transfer",
      "title": "Ward Transfer Form",
      "purpose": "Capture and save ward transfer form data.",
      "fields": [
        {
          "key": "from_ward",
          "label": "From ward",
          "type": "text",
          "required": true,
          "note": "Current ward - auto-filled"
        },
        {
          "key": "from_bed",
          "label": "From bed",
          "type": "text",
          "required": true,
          "note": "Current bed - auto-filled"
        },
        {
          "key": "to_ward",
          "label": "To ward",
          "type": "select",
          "required": true,
          "note": "Destination ward"
        },
        {
          "key": "to_bed",
          "label": "To bed",
          "type": "select",
          "required": true,
          "note": "Available bed in destination ward"
        },
        {
          "key": "reason_for_transfer",
          "label": "Reason for transfer",
          "type": "textarea",
          "required": true,
          "note": "Clinical reason e.g. ICU escalation, step-down, bed availability"
        },
        {
          "key": "authorised_by",
          "label": "Authorised by",
          "type": "select",
          "required": true,
          "note": "Doctor approving the transfer"
        }
      ]
    }
  ],
  "4": [
    {
      "id": "appointment_booking",
      "title": "Appointment Booking Form",
      "purpose": "Capture and save appointment booking form data.",
      "fields": [
        {
          "key": "patient_search",
          "label": "Patient search",
          "type": "text",
          "required": true,
          "note": "Search by MRN, name, or ID number"
        },
        {
          "key": "appointment_type",
          "label": "Appointment type",
          "type": "select",
          "required": true,
          "options": [
            "New",
            "Follow-up",
            "Specialist",
            "Procedure",
            "Telemedicine"
          ],
          "note": "New | Follow-up | Specialist | Procedure | Telemedicine"
        },
        {
          "key": "preferred_doctor",
          "label": "Preferred doctor",
          "type": "select",
          "required": false,
          "note": "Select from available doctors"
        },
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Department or clinic"
        },
        {
          "key": "appointment_date",
          "label": "Appointment date",
          "type": "date",
          "required": true,
          "note": "Select from available slots calendar"
        },
        {
          "key": "appointment_time",
          "label": "Appointment time",
          "type": "time",
          "required": true,
          "note": "Available slot selected from calendar"
        },
        {
          "key": "chief_complaint",
          "label": "Chief complaint",
          "type": "text",
          "required": true,
          "note": "Patient's main reason for visit"
        },
        {
          "key": "booking_source",
          "label": "Booking source",
          "type": "select",
          "required": true,
          "options": [
            "Walk-in",
            "Phone",
            "Portal",
            "Referral"
          ],
          "note": "Walk-in | Phone | Portal | Referral"
        },
        {
          "key": "insurance_to_use",
          "label": "Insurance to use",
          "type": "select",
          "required": false,
          "note": "Active insurance scheme for this visit"
        },
        {
          "key": "notes",
          "label": "Notes",
          "type": "textarea",
          "required": false,
          "note": "Special scheduling instructions or requests"
        },
        {
          "key": "send_reminder",
          "label": "Send reminder",
          "type": "checkbox",
          "required": false,
          "note": "Tick to send SMS reminder to patient"
        }
      ]
    },
    {
      "id": "appointment_slot_configuration",
      "title": "Appointment Slot Configuration Form",
      "purpose": "Capture and save appointment slot configuration form data.",
      "fields": [
        {
          "key": "doctor",
          "label": "Doctor",
          "type": "select",
          "required": true,
          "note": "Doctor making their schedule available"
        },
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Clinic or consultation department"
        },
        {
          "key": "date",
          "label": "Date",
          "type": "date",
          "required": true,
          "note": "Date of availability"
        },
        {
          "key": "start_time",
          "label": "Start time",
          "type": "time",
          "required": true,
          "note": "Clinic start time"
        },
        {
          "key": "end_time",
          "label": "End time",
          "type": "time",
          "required": true,
          "note": "Clinic end time"
        },
        {
          "key": "slot_duration_minutes",
          "label": "Slot duration (minutes)",
          "type": "number",
          "required": true,
          "note": "Duration per appointment e.g. 15 | 20 | 30"
        },
        {
          "key": "slot_type",
          "label": "Slot type",
          "type": "select",
          "required": true,
          "options": [
            "OPD",
            "Telemedicine",
            "Procedure"
          ],
          "note": "OPD | Telemedicine | Procedure"
        },
        {
          "key": "maximum_patients",
          "label": "Maximum patients",
          "type": "number",
          "required": true,
          "note": "Maximum bookings for this session"
        }
      ]
    },
    {
      "id": "appointment_cancellation",
      "title": "Appointment Cancellation Form",
      "purpose": "Capture and save appointment cancellation form data.",
      "fields": [
        {
          "key": "cancellation_reason",
          "label": "Cancellation reason",
          "type": "select",
          "required": true,
          "options": [
            "Patient request",
            "Doctor unavailable",
            "Emergency",
            "Other"
          ],
          "note": "Patient request | Doctor unavailable | Emergency | Other"
        },
        {
          "key": "additional_notes",
          "label": "Additional notes",
          "type": "textarea",
          "required": false,
          "note": "Details about the cancellation"
        },
        {
          "key": "notify_patient",
          "label": "Notify patient",
          "type": "checkbox",
          "required": true,
          "note": "Send cancellation SMS/email to patient"
        },
        {
          "key": "reschedule_immediately",
          "label": "Reschedule immediately",
          "type": "checkbox",
          "required": false,
          "note": "Tick to open rebooking form immediately"
        }
      ]
    }
  ],
  "5": [
    {
      "id": "ward_configuration",
      "title": "Ward Configuration Form",
      "purpose": "Capture and save ward configuration form data.",
      "fields": [
        {
          "key": "ward_name",
          "label": "Ward name",
          "type": "text",
          "required": true,
          "note": "e.g. Male Medical Ward, Paediatric Ward"
        },
        {
          "key": "ward_type",
          "label": "Ward type",
          "type": "select",
          "required": true,
          "options": [
            "General",
            "Surgical",
            "Paediatric",
            "Maternity",
            "ICU",
            "NICU",
            "Isolation"
          ],
          "note": "General | Surgical | Paediatric | Maternity | ICU | NICU | Isolation"
        },
        {
          "key": "floor",
          "label": "Floor",
          "type": "text",
          "required": false,
          "note": "Building floor e.g. Ground, 1st, 2nd"
        },
        {
          "key": "total_beds",
          "label": "Total beds",
          "type": "number",
          "required": true,
          "note": "Total configured bed count"
        },
        {
          "key": "male_beds",
          "label": "Male beds",
          "type": "number",
          "required": false,
          "note": "Beds designated for male patients"
        },
        {
          "key": "female_beds",
          "label": "Female beds",
          "type": "number",
          "required": false,
          "note": "Beds designated for female patients"
        },
        {
          "key": "private_beds",
          "label": "Private beds",
          "type": "number",
          "required": false,
          "note": "Private room beds"
        },
        {
          "key": "ward_manager",
          "label": "Ward manager",
          "type": "select",
          "required": true,
          "note": "Staff member in charge of ward"
        }
      ]
    },
    {
      "id": "bed_status_update",
      "title": "Bed Status Update Form",
      "purpose": "Capture and save bed status update form data.",
      "fields": [
        {
          "key": "bed_number",
          "label": "Bed number",
          "type": "text",
          "required": true,
          "note": "Auto-filled from bed selection"
        },
        {
          "key": "status",
          "label": "Status",
          "type": "select",
          "required": true,
          "options": [
            "Available",
            "Occupied",
            "Cleaning",
            "Maintenance",
            "Reserved",
            "Closed"
          ],
          "note": "Available | Occupied | Cleaning | Maintenance | Reserved | Closed"
        },
        {
          "key": "housekeeping_notes",
          "label": "Housekeeping notes",
          "type": "text",
          "required": false,
          "note": "Special instructions for cleaning team"
        },
        {
          "key": "estimated_ready_time",
          "label": "Estimated ready time",
          "type": "time",
          "required": false,
          "note": "When bed will be ready for next patient"
        }
      ]
    }
  ],
  "6": [
    {
      "id": "clinical_encounter",
      "title": "Clinical Encounter Form",
      "purpose": "Capture and save clinical encounter form data.",
      "fields": [
        {
          "key": "chief_complaint",
          "label": "Chief complaint",
          "type": "text",
          "required": true,
          "note": "Reason for visit in patient's own words"
        },
        {
          "key": "history_of_presenting_illness",
          "label": "History of presenting illness",
          "type": "textarea",
          "required": true,
          "note": "Narrative: onset, duration, severity, progression, associated symptoms"
        },
        {
          "key": "past_medical_history",
          "label": "Past medical history",
          "type": "textarea",
          "required": false,
          "note": "Known conditions, hospitalisations, chronic diseases"
        },
        {
          "key": "past_surgical_history",
          "label": "Past surgical history",
          "type": "textarea",
          "required": false,
          "note": "Previous operations with dates"
        },
        {
          "key": "family_history",
          "label": "Family history",
          "type": "textarea",
          "required": false,
          "note": "Relevant family conditions - first-degree relatives"
        },
        {
          "key": "social_history",
          "label": "Social history",
          "type": "textarea",
          "required": false,
          "note": "Occupation, smoking, alcohol, substance use, living conditions"
        },
        {
          "key": "review_of_systems",
          "label": "Review of systems",
          "type": "checkbox",
          "required": false,
          "note": "Structured per-system enquiry"
        },
        {
          "key": "physical_examination",
          "label": "Physical examination",
          "type": "textarea",
          "required": true,
          "note": "Full examination findings per system"
        },
        {
          "key": "assessment_impression",
          "label": "Assessment / impression",
          "type": "textarea",
          "required": true,
          "note": "Clinical reasoning and differential diagnoses"
        },
        {
          "key": "plan",
          "label": "Plan",
          "type": "textarea",
          "required": true,
          "note": "Management plan - investigations, treatment, referrals"
        }
      ]
    },
    {
      "id": "diagnosis_entry",
      "title": "Diagnosis Entry Form",
      "purpose": "Capture and save diagnosis entry form data.",
      "fields": [
        {
          "key": "icd_10_code",
          "label": "ICD-10 code",
          "type": "text",
          "required": true,
          "note": "Searchable ICD-10 code and description"
        },
        {
          "key": "diagnosis_type",
          "label": "Diagnosis type",
          "type": "select",
          "required": true,
          "options": [
            "Principal",
            "Secondary",
            "Complication",
            "Comorbidity"
          ],
          "note": "Principal | Secondary | Complication | Comorbidity"
        },
        {
          "key": "status",
          "label": "Status",
          "type": "select",
          "required": true,
          "options": [
            "Provisional",
            "Confirmed",
            "Differential",
            "Ruled out"
          ],
          "note": "Provisional | Confirmed | Differential | Ruled out"
        },
        {
          "key": "onset_date",
          "label": "Onset date",
          "type": "date",
          "required": false,
          "note": "When condition began"
        },
        {
          "key": "is_chronic",
          "label": "Is chronic",
          "type": "checkbox",
          "required": false,
          "note": "Add to patient's problem list if chronic"
        },
        {
          "key": "notes",
          "label": "Notes",
          "type": "text",
          "required": false,
          "note": "Clinical notes on this diagnosis"
        }
      ]
    },
    {
      "id": "vital_signs",
      "title": "Vital Signs Form",
      "purpose": "Capture and save vital signs form data.",
      "fields": [
        {
          "key": "temperature_c",
          "label": "Temperature (°C)",
          "type": "number",
          "required": false,
          "note": "Body temperature - normal 36.1-37.2"
        },
        {
          "key": "pulse_bpm",
          "label": "Pulse (bpm)",
          "type": "number",
          "required": false,
          "note": "Heart rate - normal 60-100"
        },
        {
          "key": "systolic_bp_mmhg",
          "label": "Systolic BP (mmHg)",
          "type": "number",
          "required": false,
          "note": "Systolic blood pressure"
        },
        {
          "key": "diastolic_bp_mmhg",
          "label": "Diastolic BP (mmHg)",
          "type": "number",
          "required": false,
          "note": "Diastolic blood pressure"
        },
        {
          "key": "respiratory_rate",
          "label": "Respiratory rate",
          "type": "number",
          "required": false,
          "note": "Breaths per minute - normal 12-20"
        },
        {
          "key": "spo2",
          "label": "SpO2 (%)",
          "type": "number",
          "required": false,
          "note": "Oxygen saturation - normal 95%"
        },
        {
          "key": "gcs_eye",
          "label": "GCS Eye",
          "type": "select",
          "required": false,
          "note": "1-4 component score"
        },
        {
          "key": "gcs_verbal",
          "label": "GCS Verbal",
          "type": "select",
          "required": false,
          "note": "1-5 component score"
        },
        {
          "key": "gcs_motor",
          "label": "GCS Motor",
          "type": "select",
          "required": false,
          "note": "1-6 component score"
        },
        {
          "key": "weight_kg",
          "label": "Weight (kg)",
          "type": "number",
          "required": false,
          "note": "Body weight"
        },
        {
          "key": "height_cm",
          "label": "Height (cm)",
          "type": "number",
          "required": false,
          "note": "Height for BMI calculation"
        },
        {
          "key": "pain_score_0_10",
          "label": "Pain score (0–10)",
          "type": "text",
          "required": false,
          "note": "Numeric pain rating scale"
        },
        {
          "key": "blood_glucose_mmol_l",
          "label": "Blood glucose (mmol/L)",
          "type": "number",
          "required": false,
          "note": "Bedside glucose reading"
        },
        {
          "key": "urine_output_ml",
          "label": "Urine output (mL)",
          "type": "number",
          "required": false,
          "note": "Urine output for period"
        }
      ]
    },
    {
      "id": "progress_note",
      "title": "Progress Note Form",
      "purpose": "Capture and save progress note form data.",
      "fields": [
        {
          "key": "note_date_time",
          "label": "Note date/time",
          "type": "datetime-local",
          "required": true,
          "note": "Auto-filled with current timestamp"
        },
        {
          "key": "soap_subjective",
          "label": "SOAP - Subjective",
          "type": "textarea",
          "required": true,
          "note": "Patient-reported changes since last review"
        },
        {
          "key": "soap_objective",
          "label": "SOAP - Objective",
          "type": "textarea",
          "required": true,
          "note": "Examination findings and observation data"
        },
        {
          "key": "soap_assessment",
          "label": "SOAP - Assessment",
          "type": "textarea",
          "required": true,
          "note": "Clinical interpretation - improving, stable, deteriorating"
        },
        {
          "key": "soap_plan",
          "label": "SOAP - Plan",
          "type": "textarea",
          "required": true,
          "note": "Changes to management plan"
        }
      ]
    },
    {
      "id": "clinical_order",
      "title": "Clinical Order Form",
      "purpose": "Capture and save clinical order form data.",
      "fields": [
        {
          "key": "order_type",
          "label": "Order type",
          "type": "select",
          "required": true,
          "options": [
            "Lab",
            "Radiology",
            "Referral",
            "Diet",
            "Procedure",
            "Nursing",
            "Physiotherapy"
          ],
          "note": "Lab | Radiology | Referral | Diet | Procedure | Nursing | Physiotherapy"
        },
        {
          "key": "priority",
          "label": "Priority",
          "type": "select",
          "required": true,
          "options": [
            "Routine",
            "Urgent",
            "STAT"
          ],
          "note": "Routine | Urgent | STAT"
        },
        {
          "key": "clinical_indication",
          "label": "Clinical indication",
          "type": "text",
          "required": true,
          "note": "Reason for the order"
        },
        {
          "key": "special_instructions",
          "label": "Special instructions",
          "type": "text",
          "required": false,
          "note": "Additional instructions for the receiving department"
        }
      ]
    }
  ],
  "7": [
    {
      "id": "nursing_assessment",
      "title": "Nursing Assessment Form",
      "purpose": "Capture and save nursing assessment form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from admission"
        },
        {
          "key": "assessment_date_time",
          "label": "Assessment date/time",
          "type": "datetime-local",
          "required": true,
          "note": "Current timestamp"
        },
        {
          "key": "nursing_history",
          "label": "Nursing history",
          "type": "textarea",
          "required": true,
          "note": "Nursing-focused history - hygiene, mobility, nutrition, elimination"
        },
        {
          "key": "current_medications",
          "label": "Current medications",
          "type": "text",
          "required": true,
          "note": "List of all current medications being taken"
        },
        {
          "key": "allergies",
          "label": "Allergies",
          "type": "text",
          "required": true,
          "note": "Pulled from patient allergy record"
        },
        {
          "key": "mobility_status",
          "label": "Mobility status",
          "type": "select",
          "required": true,
          "options": [
            "Independent",
            "Assisted",
            "Dependent",
            "Bedbound"
          ],
          "note": "Independent | Assisted | Dependent | Bedbound"
        },
        {
          "key": "self_care_ability",
          "label": "Self-care ability",
          "type": "select",
          "required": true,
          "options": [
            "Independent",
            "Needs help",
            "Fully dependent"
          ],
          "note": "Independent | Needs help | Fully dependent"
        },
        {
          "key": "nutritional_status",
          "label": "Nutritional status",
          "type": "text",
          "required": true,
          "options": [
            "Adequate",
            "At risk",
            "Malnourished"
          ],
          "note": "Adequate | At risk | Malnourished"
        },
        {
          "key": "skin_integrity",
          "label": "Skin integrity",
          "type": "select",
          "required": true,
          "options": [
            "Intact",
            "Redness",
            "Wound",
            "Pressure injury"
          ],
          "note": "Intact | Redness | Wound | Pressure injury"
        },
        {
          "key": "risk_assessments",
          "label": "Risk assessments",
          "type": "checkbox",
          "required": true,
          "note": "Falls risk | Pressure injury risk | DVT risk | Nutritional risk"
        },
        {
          "key": "psychological_status",
          "label": "Psychological status",
          "type": "text",
          "required": false,
          "note": "Mood, anxiety, orientation to time and place"
        }
      ]
    },
    {
      "id": "medication_administration_record_mar",
      "title": "Medication Administration Record (MAR)",
      "purpose": "Capture and save medication administration record (mar) data.",
      "fields": [
        {
          "key": "drug_name",
          "label": "Drug name",
          "type": "text",
          "required": true,
          "note": "Auto-filled from prescription"
        },
        {
          "key": "dose",
          "label": "Dose",
          "type": "text",
          "required": true,
          "note": "Prescribed dose"
        },
        {
          "key": "route",
          "label": "Route",
          "type": "text",
          "required": true,
          "note": "Prescribed route"
        },
        {
          "key": "scheduled_time",
          "label": "Scheduled time",
          "type": "text",
          "required": true,
          "note": "Time drug is due"
        },
        {
          "key": "administration_time",
          "label": "Administration time",
          "type": "time",
          "required": true,
          "note": "Actual time drug was given"
        },
        {
          "key": "administered_by",
          "label": "Administered by",
          "type": "text",
          "required": true,
          "note": "Logged-in nurse - auto-filled"
        },
        {
          "key": "status",
          "label": "Status",
          "type": "select",
          "required": true,
          "options": [
            "Given",
            "Withheld",
            "Not given",
            "Patient refused"
          ],
          "note": "Given | Withheld | Not given | Patient refused"
        },
        {
          "key": "dose_given",
          "label": "Dose given",
          "type": "text",
          "required": false,
          "note": "If different from prescribed dose - state reason"
        },
        {
          "key": "administration_site",
          "label": "Administration site",
          "type": "text",
          "required": false,
          "note": "Injection site e.g. Left deltoid"
        },
        {
          "key": "withhold_reason",
          "label": "Withhold reason",
          "type": "text",
          "required": false,
          "note": "Mandatory if dose was withheld"
        }
      ]
    },
    {
      "id": "nursing_handover",
      "title": "Nursing Handover Form",
      "purpose": "Capture and save nursing handover form data.",
      "fields": [
        {
          "key": "ward",
          "label": "Ward",
          "type": "text",
          "required": true,
          "note": "Current ward - auto-filled"
        },
        {
          "key": "shift_handover_time",
          "label": "Shift handover time",
          "type": "datetime-local",
          "required": true,
          "note": "Time of handover"
        },
        {
          "key": "outgoing_nurse",
          "label": "Outgoing nurse",
          "type": "text",
          "required": true,
          "note": "Auto-filled from login"
        },
        {
          "key": "incoming_nurse",
          "label": "Incoming nurse",
          "type": "select",
          "required": true,
          "note": "Nurse receiving the handover"
        },
        {
          "key": "patient_summaries",
          "label": "Patient summaries",
          "type": "text",
          "required": true,
          "note": "Per-patient: current status, concerns, pending tasks"
        },
        {
          "key": "general_ward_notes",
          "label": "General ward notes",
          "type": "textarea",
          "required": false,
          "note": "Equipment issues, staffing concerns, incidents"
        },
        {
          "key": "incoming_nurse_acknowledgement",
          "label": "Incoming nurse acknowledgement",
          "type": "text",
          "required": true,
          "note": "Digital sign-off by incoming nurse"
        }
      ]
    },
    {
      "id": "fluid_balance_chart",
      "title": "Fluid Balance Chart",
      "purpose": "Capture and save fluid balance chart data.",
      "fields": [
        {
          "key": "recording_time",
          "label": "Recording time",
          "type": "datetime-local",
          "required": true,
          "note": "Hourly for ICU, 4-hourly for wards"
        },
        {
          "key": "oral_intake_ml",
          "label": "Oral intake (mL)",
          "type": "number",
          "required": false,
          "note": "Fluids taken by mouth"
        },
        {
          "key": "iv_fluids_ml",
          "label": "IV fluids (mL)",
          "type": "number",
          "required": false,
          "note": "Intravenous fluids infused"
        },
        {
          "key": "ng_feed_ml",
          "label": "NG feed (mL)",
          "type": "number",
          "required": false,
          "note": "Nasogastric feed volume"
        },
        {
          "key": "blood_products_ml",
          "label": "Blood products (mL)",
          "type": "number",
          "required": false,
          "note": "Blood or blood products given"
        },
        {
          "key": "urine_output_ml",
          "label": "Urine output (mL)",
          "type": "number",
          "required": false,
          "note": "Urine measured in catheter bag or urinal"
        },
        {
          "key": "drain_output_ml",
          "label": "Drain output (mL)",
          "type": "number",
          "required": false,
          "note": "Surgical drain drainage"
        },
        {
          "key": "vomit_ml",
          "label": "Vomit (mL)",
          "type": "number",
          "required": false,
          "note": "Vomit or NG aspirate"
        },
        {
          "key": "stool_ml",
          "label": "Stool (mL)",
          "type": "number",
          "required": false,
          "note": "Estimated stool output"
        }
      ]
    },
    {
      "id": "pressure_injury_braden_scale",
      "title": "Pressure Injury Braden Scale Form",
      "purpose": "Capture and save pressure injury braden scale form data.",
      "fields": [
        {
          "key": "sensory_perception",
          "label": "Sensory perception",
          "type": "select",
          "required": true,
          "note": "1-Completely limited to 4-No impairment"
        },
        {
          "key": "moisture",
          "label": "Moisture",
          "type": "select",
          "required": true,
          "note": "1-Constantly moist to 4-Rarely moist"
        },
        {
          "key": "activity",
          "label": "Activity",
          "type": "select",
          "required": true,
          "note": "1-Bedfast to 4-Walks frequently"
        },
        {
          "key": "mobility",
          "label": "Mobility",
          "type": "select",
          "required": true,
          "note": "1-Completely immobile to 4-No limitations"
        },
        {
          "key": "nutrition",
          "label": "Nutrition",
          "type": "select",
          "required": true,
          "note": "1-Very poor to 4-Excellent"
        },
        {
          "key": "friction_and_shear",
          "label": "Friction & shear",
          "type": "select",
          "required": true,
          "note": "1-Problem to 3-No apparent problem"
        },
        {
          "key": "existing_pressure_injuries",
          "label": "Existing pressure injuries",
          "type": "text",
          "required": false,
          "note": "Site, stage, size, description of current wounds"
        },
        {
          "key": "prevention_plan",
          "label": "Prevention plan",
          "type": "checkbox",
          "required": true,
          "note": "Repositioning | Heel offloading | Special mattress | Skin care"
        }
      ]
    }
  ],
  "8": [
    {
      "id": "lab_order",
      "title": "Lab Order Form",
      "purpose": "Capture and save lab order form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from encounter"
        },
        {
          "key": "ordering_doctor",
          "label": "Ordering doctor",
          "type": "text",
          "required": true,
          "note": "Auto-filled from encounter"
        },
        {
          "key": "tests_requested",
          "label": "Tests requested",
          "type": "text",
          "required": true,
          "note": "Multi-select from test catalogue with category and sample type"
        },
        {
          "key": "priority",
          "label": "Priority",
          "type": "select",
          "required": true,
          "options": [
            "Routine",
            "Urgent",
            "STAT"
          ],
          "note": "Routine | Urgent | STAT"
        },
        {
          "key": "clinical_indication",
          "label": "Clinical indication",
          "type": "text",
          "required": true,
          "note": "Why these tests are being ordered"
        },
        {
          "key": "special_instructions",
          "label": "Special instructions",
          "type": "text",
          "required": false,
          "note": "e.g. Fasting, timed specimen, specific time"
        }
      ]
    },
    {
      "id": "specimen_collection",
      "title": "Specimen Collection Form",
      "purpose": "Capture and save specimen collection form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from lab order"
        },
        {
          "key": "test_s_ordered",
          "label": "Test(s) ordered",
          "type": "text",
          "required": true,
          "note": "List of ordered tests"
        },
        {
          "key": "specimen_type",
          "label": "Specimen type",
          "type": "text",
          "required": true,
          "note": "Auto-filled based on test - blood, urine, swab"
        },
        {
          "key": "tube_type",
          "label": "Tube type",
          "type": "text",
          "required": true,
          "note": "Colour-coded tube e.g. EDTA purple, SST gold"
        },
        {
          "key": "volume_collected_ml",
          "label": "Volume collected (mL)",
          "type": "number",
          "required": true,
          "note": "Actual volume collected"
        },
        {
          "key": "collection_time",
          "label": "Collection time",
          "type": "datetime-local",
          "required": true,
          "note": "Exact time of collection"
        },
        {
          "key": "collected_by",
          "label": "Collected by",
          "type": "text",
          "required": true,
          "note": "Auto-filled - logged in phlebotomist"
        },
        {
          "key": "specimen_condition",
          "label": "Specimen condition",
          "type": "select",
          "required": true,
          "options": [
            "Adequate",
            "Haemolysed",
            "Clotted",
            "Insufficient",
            "Wrong tube"
          ],
          "note": "Adequate | Haemolysed | Clotted | Insufficient | Wrong tube"
        },
        {
          "key": "print_barcode_label",
          "label": "Print barcode label",
          "type": "text",
          "required": true,
          "note": "Auto-generates barcode label for tube"
        }
      ]
    },
    {
      "id": "result_entry",
      "title": "Result Entry Form",
      "purpose": "Capture and save result entry form data.",
      "fields": [
        {
          "key": "specimen_barcode",
          "label": "Specimen barcode",
          "type": "text",
          "required": true,
          "note": "Scan or type specimen barcode"
        },
        {
          "key": "analyte_name",
          "label": "Analyte name",
          "type": "text",
          "required": true,
          "note": "Auto-filled from test definition"
        },
        {
          "key": "result_value",
          "label": "Result value",
          "type": "text",
          "required": true,
          "note": "Numeric or text result"
        },
        {
          "key": "result_unit",
          "label": "Result unit",
          "type": "text",
          "required": true,
          "note": "Auto-filled from test definition"
        },
        {
          "key": "reference_range",
          "label": "Reference range",
          "type": "text",
          "required": true,
          "note": "Auto-calculated from patient age and gender"
        },
        {
          "key": "interpretation",
          "label": "Interpretation",
          "type": "select",
          "required": true,
          "options": [
            "Auto-flagged: Normal",
            "Low",
            "High",
            "Critical - editable"
          ],
          "note": "Auto-flagged: Normal | Low | High | Critical - editable"
        },
        {
          "key": "analyser_id",
          "label": "Analyser ID",
          "type": "select",
          "required": false,
          "note": "Instrument that produced the result"
        },
        {
          "key": "technician_notes",
          "label": "Technician notes",
          "type": "text",
          "required": false,
          "note": "Comments on result quality or methodology"
        },
        {
          "key": "critical_value_alert",
          "label": "Critical value alert",
          "type": "text",
          "required": true,
          "note": "Auto-triggers alert if critical threshold crossed"
        }
      ]
    },
    {
      "id": "quality_control",
      "title": "Quality Control Form",
      "purpose": "Capture and save quality control form data.",
      "fields": [
        {
          "key": "instrument",
          "label": "Instrument",
          "type": "select",
          "required": true,
          "note": "Analyser being quality controlled"
        },
        {
          "key": "test_analyte",
          "label": "Test / analyte",
          "type": "select",
          "required": true,
          "note": "Test being QC'd"
        },
        {
          "key": "qc_level",
          "label": "QC level",
          "type": "select",
          "required": true,
          "options": [
            "Level 1 (low)",
            "Level 2 (normal)",
            "Level 3 (high)"
          ],
          "note": "Level 1 (low) | Level 2 (normal) | Level 3 (high)"
        },
        {
          "key": "expected_value",
          "label": "Expected value",
          "type": "text",
          "required": true,
          "note": "Target value from QC lot insert"
        },
        {
          "key": "measured_value",
          "label": "Measured value",
          "type": "number",
          "required": true,
          "note": "Result obtained on QC material"
        },
        {
          "key": "westgard_rule_violated",
          "label": "Westgard rule violated",
          "type": "text",
          "required": true,
          "note": "Auto-checked against Westgard rules"
        },
        {
          "key": "qc_result",
          "label": "QC result",
          "type": "select",
          "required": true,
          "options": [
            "Pass",
            "Fail - auto-determined"
          ],
          "note": "Pass | Fail - auto-determined"
        },
        {
          "key": "action_taken",
          "label": "Action taken",
          "type": "textarea",
          "required": false,
          "note": "Required if QC fails - recalibration, repeat, engineer call"
        }
      ]
    }
  ],
  "9": [
    {
      "id": "radiology_request",
      "title": "Radiology Request Form",
      "purpose": "Capture and save radiology request form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from encounter"
        },
        {
          "key": "modality",
          "label": "Modality",
          "type": "select",
          "required": true,
          "options": [
            "X-Ray",
            "CT",
            "MRI",
            "Ultrasound",
            "Mammography",
            "Fluoroscopy"
          ],
          "note": "X-Ray | CT | MRI | Ultrasound | Mammography | Fluoroscopy"
        },
        {
          "key": "body_part_examination",
          "label": "Body part / examination",
          "type": "text",
          "required": true,
          "note": "Specific examination e.g. Chest PA view, CT abdomen with contrast"
        },
        {
          "key": "laterality",
          "label": "Laterality",
          "type": "select",
          "required": false,
          "options": [
            "Left",
            "Right",
            "Bilateral",
            "Not applicable"
          ],
          "note": "Left | Right | Bilateral | Not applicable"
        },
        {
          "key": "contrast_required",
          "label": "Contrast required",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "priority",
          "label": "Priority",
          "type": "select",
          "required": true,
          "options": [
            "Routine",
            "Urgent",
            "STAT"
          ],
          "note": "Routine | Urgent | STAT"
        },
        {
          "key": "clinical_indication",
          "label": "Clinical indication",
          "type": "textarea",
          "required": true,
          "note": "Reason for imaging - shown to radiographer"
        },
        {
          "key": "relevant_history",
          "label": "Relevant history",
          "type": "text",
          "required": false,
          "note": "Previous imaging, allergies, renal function for contrast"
        },
        {
          "key": "referring_doctor",
          "label": "Referring doctor",
          "type": "text",
          "required": true,
          "note": "Auto-filled from encounter"
        }
      ]
    },
    {
      "id": "radiography_technique",
      "title": "Radiography Technique Form",
      "purpose": "Capture and save radiography technique form data.",
      "fields": [
        {
          "key": "patient_id_check",
          "label": "Patient ID check",
          "type": "checkbox",
          "required": true,
          "note": "Confirm patient identity before imaging"
        },
        {
          "key": "modality_used",
          "label": "Modality used",
          "type": "text",
          "required": true,
          "note": "Auto-filled from order"
        },
        {
          "key": "patient_position",
          "label": "Patient position",
          "type": "text",
          "required": true,
          "note": "Position used e.g. PA erect, Left lateral decubitus"
        },
        {
          "key": "exposure_parameters",
          "label": "Exposure parameters",
          "type": "text",
          "required": false,
          "note": "kVp, mAs - for X-Ray"
        },
        {
          "key": "contrast_details",
          "label": "Contrast details",
          "type": "text",
          "required": false,
          "note": "Contrast agent, volume, route, batch number"
        },
        {
          "key": "scan_protocol",
          "label": "Scan protocol",
          "type": "text",
          "required": false,
          "note": "Protocol used for CT/MRI"
        },
        {
          "key": "radiographer_notes",
          "label": "Radiographer notes",
          "type": "text",
          "required": false,
          "note": "Technical notes on image acquisition"
        },
        {
          "key": "accession_number",
          "label": "Accession number",
          "type": "text",
          "required": true,
          "note": "Auto-generated RIS accession number"
        },
        {
          "key": "images_sent_to_pacs",
          "label": "Images sent to PACS",
          "type": "checkbox",
          "required": true,
          "note": "Confirm images transmitted to PACS viewer"
        }
      ]
    },
    {
      "id": "radiology_report",
      "title": "Radiology Report Form",
      "purpose": "Capture and save radiology report form data.",
      "fields": [
        {
          "key": "examination",
          "label": "Examination",
          "type": "text",
          "required": true,
          "note": "Auto-filled from order"
        },
        {
          "key": "technique",
          "label": "Technique",
          "type": "textarea",
          "required": true,
          "note": "Imaging technique, projections, contrast used"
        },
        {
          "key": "findings",
          "label": "Findings",
          "type": "textarea",
          "required": true,
          "note": "Detailed radiological findings - systematic description"
        },
        {
          "key": "impression",
          "label": "Impression",
          "type": "textarea",
          "required": true,
          "note": "Summary conclusion and diagnostic impression"
        },
        {
          "key": "recommendations",
          "label": "Recommendations",
          "type": "text",
          "required": false,
          "note": "Suggested follow-up imaging or clinical action"
        },
        {
          "key": "is_critical_finding",
          "label": "Is critical finding",
          "type": "checkbox",
          "required": true,
          "note": "Tick for critical findings requiring urgent communication"
        },
        {
          "key": "radiologist_signature",
          "label": "Radiologist signature",
          "type": "text",
          "required": true,
          "note": "Authorisation sign-off"
        }
      ]
    }
  ],
  "10": [
    {
      "id": "prescription_dispensing",
      "title": "Prescription Dispensing Form",
      "purpose": "Capture and save prescription dispensing form data.",
      "fields": [
        {
          "key": "prescription",
          "label": "Prescription",
          "type": "text",
          "required": true,
          "note": "Auto-filled from EMR prescription"
        },
        {
          "key": "drug_name",
          "label": "Drug name",
          "type": "text",
          "required": true,
          "note": "Generic name from formulary"
        },
        {
          "key": "dose_and_route",
          "label": "Dose and route",
          "type": "text",
          "required": true,
          "note": "Auto-filled from prescription"
        },
        {
          "key": "quantity_to_dispense",
          "label": "Quantity to dispense",
          "type": "number",
          "required": true,
          "note": "Units to give to patient"
        },
        {
          "key": "batch_number",
          "label": "Batch number",
          "type": "text",
          "required": true,
          "note": "Batch number from the dispensed pack"
        },
        {
          "key": "expiry_date",
          "label": "Expiry date",
          "type": "date",
          "required": true,
          "note": "Expiry date of dispensed batch"
        },
        {
          "key": "drug_interaction_check",
          "label": "Drug interaction check",
          "type": "text",
          "required": true,
          "note": "Auto-run at dispensing - alert displayed if interaction"
        },
        {
          "key": "interaction_override_reason",
          "label": "Interaction override reason",
          "type": "text",
          "required": false,
          "note": "Required if overriding a drug interaction alert"
        },
        {
          "key": "patient_counselled",
          "label": "Patient counselled",
          "type": "checkbox",
          "required": true,
          "note": "Confirm patient was counselled on drug use"
        },
        {
          "key": "dispensed_by",
          "label": "Dispensed by",
          "type": "text",
          "required": true,
          "note": "Auto-filled - logged in pharmacist"
        }
      ]
    },
    {
      "id": "drug_formulary_entry",
      "title": "Drug Formulary Entry Form",
      "purpose": "Capture and save drug formulary entry form data.",
      "fields": [
        {
          "key": "generic_name",
          "label": "Generic name",
          "type": "text",
          "required": true,
          "note": "WHO INN generic name"
        },
        {
          "key": "brand_names",
          "label": "Brand names",
          "type": "text",
          "required": false,
          "note": "Known brand names for this drug"
        },
        {
          "key": "drug_class",
          "label": "Drug class",
          "type": "select",
          "required": true,
          "note": "Pharmacological class e.g. PENICILLIN, SSRI, NSAID"
        },
        {
          "key": "therapeutic_category",
          "label": "Therapeutic category",
          "type": "select",
          "required": true,
          "options": [
            "Antibiotic",
            "Analgesic",
            "Antihypertensive",
            "etc."
          ],
          "note": "Antibiotic | Analgesic | Antihypertensive | etc."
        },
        {
          "key": "formulation",
          "label": "Formulation",
          "type": "select",
          "required": true,
          "options": [
            "Tablet",
            "Capsule",
            "Syrup",
            "Injection",
            "Cream",
            "Inhaler"
          ],
          "note": "Tablet | Capsule | Syrup | Injection | Cream | Inhaler"
        },
        {
          "key": "strength",
          "label": "Strength",
          "type": "text",
          "required": true,
          "note": "e.g. 500mg, 5mg/5mL"
        },
        {
          "key": "atc_code",
          "label": "ATC code",
          "type": "text",
          "required": false,
          "note": "WHO ATC classification code"
        },
        {
          "key": "is_controlled_substance",
          "label": "Is controlled substance",
          "type": "checkbox",
          "required": true,
          "note": "Tick for narcotics and psychotropics"
        },
        {
          "key": "is_on_essential_medicines_list",
          "label": "Is on essential medicines list",
          "type": "checkbox",
          "required": true,
          "note": "Kenya EML status"
        },
        {
          "key": "requires_prescription",
          "label": "Requires prescription",
          "type": "checkbox",
          "required": true,
          "note": "Untick for OTC drugs"
        },
        {
          "key": "minimum_stock_level",
          "label": "Minimum stock level",
          "type": "number",
          "required": true,
          "note": "Reorder trigger quantity"
        },
        {
          "key": "unit_cost_kes",
          "label": "Unit cost (KES)",
          "type": "number",
          "required": true,
          "note": "Cost to hospital per unit"
        },
        {
          "key": "selling_price_kes",
          "label": "Selling price (KES)",
          "type": "number",
          "required": true,
          "note": "Patient charge per unit"
        }
      ]
    },
    {
      "id": "pharmacy_return",
      "title": "Pharmacy Return Form",
      "purpose": "Capture and save pharmacy return form data.",
      "fields": [
        {
          "key": "return_type",
          "label": "Return type",
          "type": "select",
          "required": true,
          "options": [
            "Ward to pharmacy",
            "Patient return",
            "Expired",
            "Damaged",
            "Recall"
          ],
          "note": "Ward to pharmacy | Patient return | Expired | Damaged | Recall"
        },
        {
          "key": "drug",
          "label": "Drug",
          "type": "select",
          "required": true,
          "note": "Drug being returned"
        },
        {
          "key": "quantity_returned",
          "label": "Quantity returned",
          "type": "number",
          "required": true,
          "note": "Number of units returned"
        },
        {
          "key": "batch_number",
          "label": "Batch number",
          "type": "text",
          "required": true,
          "note": "Batch of returned drugs"
        },
        {
          "key": "reason_for_return",
          "label": "Reason for return",
          "type": "textarea",
          "required": true,
          "note": "Clinical or administrative reason"
        },
        {
          "key": "condition_on_return",
          "label": "Condition on return",
          "type": "select",
          "required": true,
          "options": [
            "Resaleable",
            "Destroyed",
            "Quarantined"
          ],
          "note": "Resaleable | Destroyed | Quarantined"
        }
      ]
    }
  ],
  "11": [
    {
      "id": "surgical_booking",
      "title": "Surgical Booking Form",
      "purpose": "Capture and save surgical booking form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from admission"
        },
        {
          "key": "procedure_name",
          "label": "Procedure name",
          "type": "text",
          "required": true,
          "note": "Name of procedure to be performed"
        },
        {
          "key": "procedure_codes",
          "label": "Procedure codes",
          "type": "text",
          "required": false,
          "note": "CPT or local procedure codes"
        },
        {
          "key": "lead_surgeon",
          "label": "Lead surgeon",
          "type": "select",
          "required": true,
          "note": "Primary operating surgeon"
        },
        {
          "key": "anaesthetist",
          "label": "Anaesthetist",
          "type": "select",
          "required": true,
          "note": "Assigned anaesthetist"
        },
        {
          "key": "theatre",
          "label": "Theatre",
          "type": "select",
          "required": true,
          "note": "Available operating theatre"
        },
        {
          "key": "surgery_date",
          "label": "Surgery date",
          "type": "date",
          "required": true,
          "note": "Planned date of surgery"
        },
        {
          "key": "start_time",
          "label": "Start time",
          "type": "time",
          "required": true,
          "note": "Planned start time"
        },
        {
          "key": "estimated_duration_min",
          "label": "Estimated duration (min)",
          "type": "number",
          "required": true,
          "note": "Expected duration in minutes"
        },
        {
          "key": "case_type",
          "label": "Case type",
          "type": "select",
          "required": true,
          "options": [
            "Elective",
            "Emergency",
            "Urgent"
          ],
          "note": "Elective | Emergency | Urgent"
        },
        {
          "key": "anaesthesia_type",
          "label": "Anaesthesia type",
          "type": "select",
          "required": true,
          "options": [
            "General",
            "Spinal",
            "Epidural",
            "Local",
            "Sedation",
            "Regional"
          ],
          "note": "General | Spinal | Epidural | Local | Sedation | Regional"
        },
        {
          "key": "asa_grade",
          "label": "ASA grade",
          "type": "select",
          "required": true,
          "options": [
            "ASA I",
            "II",
            "III",
            "IV",
            "V",
            "VI"
          ],
          "note": "ASA I | II | III | IV | V | VI"
        },
        {
          "key": "blood_required",
          "label": "Blood required",
          "type": "checkbox",
          "required": false,
          "note": "Tick if blood products may be needed"
        },
        {
          "key": "units_requested",
          "label": "Units requested",
          "type": "number",
          "required": false,
          "note": "Blood units to prepare"
        }
      ]
    },
    {
      "id": "pre_operative_checklist",
      "title": "Pre-operative Checklist",
      "purpose": "Capture and save pre-operative checklist data.",
      "fields": [
        {
          "key": "consent_signed",
          "label": "Consent signed",
          "type": "checkbox",
          "required": true,
          "note": "Surgical consent form obtained"
        },
        {
          "key": "anaesthetic_consent",
          "label": "Anaesthetic consent",
          "type": "checkbox",
          "required": true,
          "note": "Anaesthetic consent obtained"
        },
        {
          "key": "site_marked",
          "label": "Site marked",
          "type": "checkbox",
          "required": false,
          "note": "Surgical site marked if laterality applies"
        },
        {
          "key": "site_marking_confirmed",
          "label": "Site marking confirmed",
          "type": "checkbox",
          "required": false,
          "note": "Surgeon confirmed marking"
        },
        {
          "key": "allergies_checked",
          "label": "Allergies checked",
          "type": "checkbox",
          "required": true,
          "note": "Known allergies reviewed"
        },
        {
          "key": "fasting_confirmed",
          "label": "Fasting confirmed",
          "type": "checkbox",
          "required": true,
          "note": "Patient has fasted as required"
        },
        {
          "key": "fasting_duration_hours",
          "label": "Fasting duration (hours)",
          "type": "number",
          "required": true,
          "note": "Hours fasted - minimum 6h for solids, 2h for clear fluids"
        },
        {
          "key": "implants_removed",
          "label": "Implants removed",
          "type": "checkbox",
          "required": false,
          "note": "Dentures, hearing aids, jewellery, prosthetics removed"
        },
        {
          "key": "blood_results_available",
          "label": "Blood results available",
          "type": "checkbox",
          "required": true,
          "note": "Required pre-op bloods checked and available"
        },
        {
          "key": "imaging_available",
          "label": "Imaging available",
          "type": "checkbox",
          "required": false,
          "note": "Relevant imaging available for viewing in theatre"
        },
        {
          "key": "iv_access_secured",
          "label": "IV access secured",
          "type": "checkbox",
          "required": true,
          "note": "Intravenous cannula in situ"
        },
        {
          "key": "pre_medication_given",
          "label": "Pre-medication given",
          "type": "text",
          "required": false,
          "note": "Pre-med drugs given with time"
        },
        {
          "key": "patient_identity_confirmed",
          "label": "Patient identity confirmed",
          "type": "checkbox",
          "required": true,
          "note": "Patient name and DOB confirmed at gate"
        }
      ]
    },
    {
      "id": "anaesthesia_record",
      "title": "Anaesthesia Record Form",
      "purpose": "Capture and save anaesthesia record form data.",
      "fields": [
        {
          "key": "pre_op_assessment",
          "label": "Pre-op assessment",
          "type": "textarea",
          "required": true,
          "note": "Airway assessment, co-morbidities, anaesthetic plan"
        },
        {
          "key": "pre_medication",
          "label": "Pre-medication",
          "type": "text",
          "required": false,
          "note": "Pre-med drugs given"
        },
        {
          "key": "induction_agent",
          "label": "Induction agent",
          "type": "text",
          "required": true,
          "note": "Drug used for anaesthesia induction e.g. Propofol 2mg/kg"
        },
        {
          "key": "airway_management",
          "label": "Airway management",
          "type": "select",
          "required": true,
          "options": [
            "ETT",
            "LMA",
            "Mask",
            "Awake fibre-optic"
          ],
          "note": "ETT | LMA | Mask | Awake fibre-optic"
        },
        {
          "key": "ett_size",
          "label": "ETT size",
          "type": "text",
          "required": false,
          "note": "Tube size if intubated e.g. 7.5mm"
        },
        {
          "key": "maintenance_agent",
          "label": "Maintenance agent",
          "type": "text",
          "required": true,
          "note": "Drug/gas for maintenance e.g. Sevoflurane 2%, Propofol infusion"
        },
        {
          "key": "intraoperative_monitoring",
          "label": "Intraoperative monitoring",
          "type": "time",
          "required": true,
          "note": "BP, HR, SpO2, EtCO2, Temp - recorded every 5 minutes"
        },
        {
          "key": "total_fluid_input_ml",
          "label": "Total fluid input (mL)",
          "type": "number",
          "required": true,
          "note": "Total IV fluids given intraoperatively"
        },
        {
          "key": "estimated_blood_loss_ml",
          "label": "Estimated blood loss (mL)",
          "type": "number",
          "required": true,
          "note": "Estimated intraoperative blood loss"
        },
        {
          "key": "urine_output_ml",
          "label": "Urine output (mL)",
          "type": "number",
          "required": false,
          "note": "Intraoperative urine output if catheterised"
        },
        {
          "key": "reversal_agents",
          "label": "Reversal agents",
          "type": "text",
          "required": false,
          "note": "Reversal drugs given e.g. Neostigmine, Sugammadex"
        },
        {
          "key": "extubation_time",
          "label": "Extubation time",
          "type": "time",
          "required": false,
          "note": "If intubated - time of extubation"
        },
        {
          "key": "complications",
          "label": "Complications",
          "type": "textarea",
          "required": false,
          "note": "Any anaesthetic complications"
        },
        {
          "key": "recovery_notes",
          "label": "Recovery notes",
          "type": "textarea",
          "required": true,
          "note": "Post-anaesthesia recovery documentation"
        }
      ]
    },
    {
      "id": "swab_and_instrument_count",
      "title": "Swab & Instrument Count Form",
      "purpose": "Capture and save swab & instrument count form data.",
      "fields": [
        {
          "key": "count_type",
          "label": "Count type",
          "type": "select",
          "required": true,
          "options": [
            "Opening",
            "Pre-closure",
            "Closing",
            "Additional"
          ],
          "note": "Opening | Pre-closure | Closing | Additional"
        },
        {
          "key": "swab_count",
          "label": "Swab count",
          "type": "number",
          "required": true,
          "note": "Total swabs in field"
        },
        {
          "key": "instrument_count",
          "label": "Instrument count",
          "type": "number",
          "required": true,
          "note": "Total instruments accounted for"
        },
        {
          "key": "needle_count",
          "label": "Needle count",
          "type": "number",
          "required": true,
          "note": "Needles and sharps"
        },
        {
          "key": "count_correct",
          "label": "Count correct",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No - surgery must not close if No"
          ],
          "note": "Yes | No - surgery must not close if No"
        },
        {
          "key": "discrepancy_action",
          "label": "Discrepancy action",
          "type": "textarea",
          "required": false,
          "note": "Action taken if count incorrect"
        },
        {
          "key": "scrub_nurse",
          "label": "Scrub nurse",
          "type": "text",
          "required": true,
          "note": "Auto-filled"
        },
        {
          "key": "circulating_nurse",
          "label": "Circulating nurse",
          "type": "select",
          "required": true,
          "note": "Second nurse verifying the count"
        }
      ]
    },
    {
      "id": "operative_note",
      "title": "Operative Note Form",
      "purpose": "Capture and save operative note form data.",
      "fields": [
        {
          "key": "procedure_performed",
          "label": "Procedure performed",
          "type": "text",
          "required": true,
          "note": "Exact procedure(s) as performed"
        },
        {
          "key": "incision_type",
          "label": "Incision type",
          "type": "text",
          "required": true,
          "note": "Type and location of incision"
        },
        {
          "key": "intraoperative_findings",
          "label": "Intraoperative findings",
          "type": "textarea",
          "required": true,
          "note": "What was found on exploration"
        },
        {
          "key": "technique",
          "label": "Technique",
          "type": "textarea",
          "required": true,
          "note": "Step-by-step surgical technique"
        },
        {
          "key": "specimens_sent",
          "label": "Specimens sent",
          "type": "text",
          "required": false,
          "note": "Specimen type, site, destination laboratory"
        },
        {
          "key": "implants_used",
          "label": "Implants used",
          "type": "text",
          "required": false,
          "note": "Device name, serial number, lot number"
        },
        {
          "key": "drains_placed",
          "label": "Drains placed",
          "type": "text",
          "required": false,
          "note": "Type, site, and size of drain"
        },
        {
          "key": "closure_method",
          "label": "Closure method",
          "type": "text",
          "required": true,
          "note": "Wound closure layers and suture materials"
        },
        {
          "key": "complications",
          "label": "Complications",
          "type": "text",
          "required": false,
          "note": "Any intraoperative complications"
        },
        {
          "key": "post_op_instructions",
          "label": "Post-op instructions",
          "type": "textarea",
          "required": true,
          "note": "Instructions for nursing team - analgesia, monitoring, diet"
        }
      ]
    }
  ],
  "12": [
    {
      "id": "donor_registration",
      "title": "Donor Registration Form",
      "purpose": "Capture and save donor registration form data.",
      "fields": [
        {
          "key": "first_name",
          "label": "First name",
          "type": "text",
          "required": true,
          "note": "Donor first name"
        },
        {
          "key": "last_name",
          "label": "Last name",
          "type": "text",
          "required": true,
          "note": "Donor surname"
        },
        {
          "key": "date_of_birth",
          "label": "Date of birth",
          "type": "date",
          "required": true,
          "note": "Must be 16-65 years to donate"
        },
        {
          "key": "gender",
          "label": "Gender",
          "type": "select",
          "required": true,
          "options": [
            "Male",
            "Female"
          ],
          "note": "Male | Female"
        },
        {
          "key": "national_id",
          "label": "National ID",
          "type": "text",
          "required": true,
          "note": "National ID number"
        },
        {
          "key": "phone",
          "label": "Phone",
          "type": "tel",
          "required": true,
          "note": "Contact phone for donation recall"
        },
        {
          "key": "donor_type",
          "label": "Donor type",
          "type": "select",
          "required": true,
          "options": [
            "Voluntary",
            "Replacement",
            "Directed",
            "Autologous"
          ],
          "note": "Voluntary | Replacement | Directed | Autologous"
        },
        {
          "key": "previous_donations",
          "label": "Previous donations",
          "type": "number",
          "required": false,
          "note": "Number of previous donations at any facility"
        },
        {
          "key": "known_medical_conditions",
          "label": "Known medical conditions",
          "type": "textarea",
          "required": false,
          "note": "Any conditions that may affect eligibility"
        }
      ]
    },
    {
      "id": "pre_donation_screening",
      "title": "Pre-Donation Screening Form",
      "purpose": "Capture and save pre-donation screening form data.",
      "fields": [
        {
          "key": "donor",
          "label": "Donor",
          "type": "text",
          "required": true,
          "note": "Auto-filled from donor registration"
        },
        {
          "key": "haemoglobin_g_dl",
          "label": "Haemoglobin (g/dL)",
          "type": "number",
          "required": true,
          "note": "Must be 12.5 g/dL to donate"
        },
        {
          "key": "blood_pressure",
          "label": "Blood pressure",
          "type": "text",
          "required": true,
          "note": "Must be within normal limits"
        },
        {
          "key": "weight_kg",
          "label": "Weight (kg)",
          "type": "number",
          "required": true,
          "note": "Must be 50 kg to donate"
        },
        {
          "key": "temperature_c",
          "label": "Temperature (°C)",
          "type": "number",
          "required": true,
          "note": "Must be normal"
        },
        {
          "key": "medication_history",
          "label": "Medication history",
          "type": "textarea",
          "required": true,
          "note": "Any medications taken in last 7-14 days"
        },
        {
          "key": "recent_illness",
          "label": "Recent illness",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No - any illness in last 2 weeks"
          ],
          "note": "Yes | No - any illness in last 2 weeks"
        },
        {
          "key": "travel_history",
          "label": "Travel history",
          "type": "text",
          "required": false,
          "note": "Travel to malaria-endemic areas"
        },
        {
          "key": "risk_behaviour_screening",
          "label": "Risk behaviour screening",
          "type": "text",
          "required": true,
          "note": "Confidential lifestyle questions per KNBTS protocol"
        },
        {
          "key": "eligible_to_donate",
          "label": "Eligible to donate",
          "type": "text",
          "required": true,
          "note": "System determines eligibility - donor told outcome"
        }
      ]
    },
    {
      "id": "blood_unit_collection",
      "title": "Blood Unit Collection Form",
      "purpose": "Capture and save blood unit collection form data.",
      "fields": [
        {
          "key": "donor",
          "label": "Donor",
          "type": "text",
          "required": true,
          "note": "Auto-filled"
        },
        {
          "key": "bag_number",
          "label": "Bag number",
          "type": "text",
          "required": true,
          "note": "Blood bag barcode"
        },
        {
          "key": "volume_collected_ml",
          "label": "Volume collected (mL)",
          "type": "number",
          "required": true,
          "note": "Typically 450 mL"
        },
        {
          "key": "collection_time",
          "label": "Collection time",
          "type": "datetime-local",
          "required": true,
          "note": "Start and end time of collection"
        },
        {
          "key": "phlebotomist",
          "label": "Phlebotomist",
          "type": "text",
          "required": true,
          "note": "Auto-filled - logged in technician"
        },
        {
          "key": "adverse_reaction_during_donation",
          "label": "Adverse reaction during donation",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "reaction_details",
          "label": "Reaction details",
          "type": "text",
          "required": false,
          "note": "Description if adverse reaction occurred"
        }
      ]
    },
    {
      "id": "blood_request",
      "title": "Blood Request Form",
      "purpose": "Capture and save blood request form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from encounter"
        },
        {
          "key": "product_type",
          "label": "Product type",
          "type": "select",
          "required": true,
          "options": [
            "Packed RBC",
            "FFP",
            "Platelets",
            "Whole blood",
            "Cryoprecipitate"
          ],
          "note": "Packed RBC | FFP | Platelets | Whole blood | Cryoprecipitate"
        },
        {
          "key": "units_requested",
          "label": "Units requested",
          "type": "number",
          "required": true,
          "note": "Number of units needed"
        },
        {
          "key": "indication",
          "label": "Indication",
          "type": "textarea",
          "required": true,
          "note": "Clinical reason for transfusion"
        },
        {
          "key": "pre_transfusion_hb",
          "label": "Pre-transfusion Hb",
          "type": "number",
          "required": true,
          "note": "Current haemoglobin level"
        },
        {
          "key": "urgency",
          "label": "Urgency",
          "type": "select",
          "required": true,
          "options": [
            "Elective",
            "Urgent",
            "Emergency",
            "Massive transfusion protocol"
          ],
          "note": "Elective | Urgent | Emergency | Massive transfusion protocol"
        },
        {
          "key": "required_by",
          "label": "Required by",
          "type": "datetime-local",
          "required": true,
          "note": "When blood products are needed"
        },
        {
          "key": "consent_for_transfusion",
          "label": "Consent for transfusion",
          "type": "checkbox",
          "required": true,
          "note": "Confirm consent obtained"
        }
      ]
    },
    {
      "id": "crossmatch",
      "title": "Crossmatch Form",
      "purpose": "Capture and save crossmatch form data.",
      "fields": [
        {
          "key": "patient_blood_group",
          "label": "Patient blood group",
          "type": "text",
          "required": true,
          "note": "From patient records"
        },
        {
          "key": "blood_unit_number",
          "label": "Blood unit number",
          "type": "text",
          "required": true,
          "note": "Scan unit barcode"
        },
        {
          "key": "unit_blood_group",
          "label": "Unit blood group",
          "type": "text",
          "required": true,
          "note": "Auto-filled from unit record"
        },
        {
          "key": "technique_used",
          "label": "Technique used",
          "type": "select",
          "required": true,
          "options": [
            "Immediate spin",
            "Indirect Coombs",
            "Electronic",
            "Emergency"
          ],
          "note": "Immediate spin | Indirect Coombs | Electronic | Emergency"
        },
        {
          "key": "major_crossmatch_result",
          "label": "Major crossmatch result",
          "type": "select",
          "required": true,
          "options": [
            "Compatible",
            "Incompatible",
            "Pending"
          ],
          "note": "Compatible | Incompatible | Pending"
        },
        {
          "key": "antibody_screen",
          "label": "Antibody screen",
          "type": "select",
          "required": true,
          "options": [
            "Negative",
            "Positive"
          ],
          "note": "Negative | Positive"
        },
        {
          "key": "overall_result",
          "label": "Overall result",
          "type": "select",
          "required": true,
          "options": [
            "Compatible",
            "Incompatible",
            "Further testing required"
          ],
          "note": "Compatible | Incompatible | Further testing required"
        }
      ]
    },
    {
      "id": "transfusion_reaction_report",
      "title": "Transfusion Reaction Report",
      "purpose": "Capture and save transfusion reaction report data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from admission"
        },
        {
          "key": "blood_unit_transfused",
          "label": "Blood unit transfused",
          "type": "text",
          "required": true,
          "note": "Auto-filled from transfusion record"
        },
        {
          "key": "reaction_type",
          "label": "Reaction type",
          "type": "select",
          "required": true,
          "options": [
            "Febrile",
            "Allergic",
            "Haemolytic",
            "TACO",
            "TRALI",
            "Septic",
            "Anaphylaxis"
          ],
          "note": "Febrile | Allergic | Haemolytic | TACO | TRALI | Septic | Anaphylaxis"
        },
        {
          "key": "reaction_onset_time",
          "label": "Reaction onset time",
          "type": "datetime-local",
          "required": true,
          "note": "When symptoms started"
        },
        {
          "key": "symptoms",
          "label": "Symptoms",
          "type": "checkbox",
          "required": true,
          "note": "Fever | Rigors | Rash | Dyspnoea | Hypotension | Back pain | Haemoglobinuria"
        },
        {
          "key": "vital_signs_at_reaction",
          "label": "Vital signs at reaction",
          "type": "text",
          "required": true,
          "note": "BP, HR, Temp, SpO2"
        },
        {
          "key": "transfusion_stopped",
          "label": "Transfusion stopped",
          "type": "checkbox",
          "required": true,
          "note": "Confirm transfusion was stopped"
        },
        {
          "key": "treatment_given",
          "label": "Treatment given",
          "type": "text",
          "required": true,
          "note": "Emergency management steps"
        },
        {
          "key": "outcome",
          "label": "Outcome",
          "type": "select",
          "required": true,
          "options": [
            "Resolved",
            "Ongoing",
            "Death"
          ],
          "note": "Resolved | Ongoing | Death"
        }
      ]
    }
  ],
  "13": [
    {
      "id": "invoice_review_and_finalise",
      "title": "Invoice Review & Finalise Form",
      "purpose": "Capture and save invoice review & finalise form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from encounter"
        },
        {
          "key": "invoice_number",
          "label": "Invoice number",
          "type": "text",
          "required": true,
          "note": "System-generated invoice number"
        },
        {
          "key": "billing_period",
          "label": "Billing period",
          "type": "text",
          "required": true,
          "note": "Dates of service covered"
        },
        {
          "key": "line_items",
          "label": "Line items",
          "type": "text",
          "required": true,
          "note": "Auto-populated from all clinical events - doctor to verify"
        },
        {
          "key": "manual_charge_addition",
          "label": "Manual charge addition",
          "type": "text",
          "required": false,
          "note": "Add missed charge from charge master"
        },
        {
          "key": "discount_type",
          "label": "Discount type",
          "type": "select",
          "required": false,
          "options": [
            "Staff",
            "Charity",
            "Management",
            "SHA top-up",
            "Other"
          ],
          "note": "Staff | Charity | Management | SHA top-up | Other"
        },
        {
          "key": "discount_amount",
          "label": "Discount amount",
          "type": "number",
          "required": false,
          "note": "Discount in KES - requires approval above threshold"
        },
        {
          "key": "discount_authorised_by",
          "label": "Discount authorised by",
          "type": "select",
          "required": false,
          "note": "Manager who approved the discount"
        },
        {
          "key": "insurance_scheme",
          "label": "Insurance scheme",
          "type": "text",
          "required": false,
          "note": "Active scheme for this visit - auto-filled"
        },
        {
          "key": "insurance_coverage_amount",
          "label": "Insurance coverage amount",
          "type": "number",
          "required": false,
          "note": "Amount covered by insurance"
        },
        {
          "key": "patient_liability",
          "label": "Patient liability",
          "type": "text",
          "required": true,
          "note": "Total minus insurance coverage"
        }
      ]
    },
    {
      "id": "payment_receipt",
      "title": "Payment Receipt Form",
      "purpose": "Capture and save payment receipt form data.",
      "fields": [
        {
          "key": "invoice",
          "label": "Invoice",
          "type": "text",
          "required": true,
          "note": "Invoice being paid"
        },
        {
          "key": "amount_received",
          "label": "Amount received",
          "type": "number",
          "required": true,
          "note": "Amount of this payment"
        },
        {
          "key": "payment_method",
          "label": "Payment method",
          "type": "select",
          "required": true,
          "options": [
            "Cash",
            "MPESA",
            "Card",
            "Bank transfer",
            "Cheque",
            "Insurance",
            "Waiver"
          ],
          "note": "Cash | MPESA | Card | Bank transfer | Cheque | Insurance | Waiver"
        },
        {
          "key": "mpesa_reference",
          "label": "MPESA reference",
          "type": "text",
          "required": false,
          "note": "M-Pesa transaction confirmation code"
        },
        {
          "key": "card_last_4_digits",
          "label": "Card last 4 digits",
          "type": "text",
          "required": false,
          "note": "Last 4 digits of card used"
        },
        {
          "key": "bank_reference",
          "label": "Bank reference",
          "type": "text",
          "required": false,
          "note": "Bank transfer reference number"
        },
        {
          "key": "print_receipt",
          "label": "Print receipt",
          "type": "checkbox",
          "required": true,
          "note": "Auto-generates receipt on confirmation"
        }
      ]
    },
    {
      "id": "charge_master_entry",
      "title": "Charge Master Entry Form",
      "purpose": "Capture and save charge master entry form data.",
      "fields": [
        {
          "key": "charge_code",
          "label": "Charge code",
          "type": "text",
          "required": true,
          "note": "Internal charge code e.g. CONSULT-OPD-GP"
        },
        {
          "key": "description",
          "label": "Description",
          "type": "text",
          "required": true,
          "note": "Description shown on patient invoice"
        },
        {
          "key": "category",
          "label": "Category",
          "type": "select",
          "required": true,
          "options": [
            "Consultation",
            "Procedure",
            "Lab",
            "Radiology",
            "Drug",
            "Accommodation",
            "Theatre",
            "Blood",
            "Ambulance"
          ],
          "note": "Consultation | Procedure | Lab | Radiology | Drug | Accommodation | Theatre | Blood | Ambulance"
        },
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Department that provides this service"
        },
        {
          "key": "unit_price_kes",
          "label": "Unit price (KES)",
          "type": "number",
          "required": true,
          "note": "Standard price"
        },
        {
          "key": "sha_code",
          "label": "SHA code",
          "type": "text",
          "required": false,
          "note": "SHA benefit code for claim submission"
        },
        {
          "key": "sha_rate_kes",
          "label": "SHA rate (KES)",
          "type": "number",
          "required": false,
          "note": "SHA reimbursement rate"
        },
        {
          "key": "is_taxable",
          "label": "Is taxable",
          "type": "checkbox",
          "required": true,
          "note": "Tick if VAT applies"
        },
        {
          "key": "tax_rate",
          "label": "Tax rate (%)",
          "type": "number",
          "required": false,
          "note": "VAT percentage if taxable"
        },
        {
          "key": "effective_from",
          "label": "Effective from",
          "type": "date",
          "required": true,
          "note": "Date price becomes active"
        }
      ]
    },
    {
      "id": "bill_adjustment",
      "title": "Bill Adjustment Form",
      "purpose": "Capture and save bill adjustment form data.",
      "fields": [
        {
          "key": "invoice",
          "label": "Invoice",
          "type": "text",
          "required": true,
          "note": "Invoice being adjusted"
        },
        {
          "key": "adjustment_type",
          "label": "Adjustment type",
          "type": "select",
          "required": true,
          "options": [
            "Discount",
            "Write-off",
            "Correction",
            "Reversal"
          ],
          "note": "Discount | Write-off | Correction | Reversal"
        },
        {
          "key": "amount_adjusted",
          "label": "Amount adjusted",
          "type": "number",
          "required": true,
          "note": "Amount being adjusted"
        },
        {
          "key": "reason",
          "label": "Reason",
          "type": "textarea",
          "required": true,
          "note": "Detailed reason for adjustment"
        },
        {
          "key": "authorised_by",
          "label": "Authorised by",
          "type": "select",
          "required": true,
          "note": "Manager approving the adjustment"
        }
      ]
    }
  ],
  "14": [
    {
      "id": "insurance_scheme_setup",
      "title": "Insurance Scheme Setup Form",
      "purpose": "Capture and save insurance scheme setup form data.",
      "fields": [
        {
          "key": "scheme_name",
          "label": "Scheme name",
          "type": "text",
          "required": true,
          "note": "Full insurance scheme name"
        },
        {
          "key": "scheme_type",
          "label": "Scheme type",
          "type": "select",
          "required": true,
          "options": [
            "SHA",
            "SHA",
            "Private",
            "Corporate",
            "Government",
            "NGO"
          ],
          "note": "SHA | SHA | Private | Corporate | Government | NGO"
        },
        {
          "key": "insurer_contact",
          "label": "Insurer contact",
          "type": "text",
          "required": false,
          "note": "Claims desk contact name"
        },
        {
          "key": "claims_phone",
          "label": "Claims phone",
          "type": "tel",
          "required": false,
          "note": "Claims desk phone number"
        },
        {
          "key": "claims_email",
          "label": "Claims email",
          "type": "email",
          "required": false,
          "note": "Claims submission email"
        },
        {
          "key": "claims_api_url",
          "label": "Claims API URL",
          "type": "text",
          "required": false,
          "note": "Electronic claims API endpoint"
        },
        {
          "key": "pre_auth_required",
          "label": "Pre-auth required",
          "type": "checkbox",
          "required": true,
          "note": "Tick if pre-authorisation is needed"
        },
        {
          "key": "pre_auth_threshold_kes",
          "label": "Pre-auth threshold (KES)",
          "type": "number",
          "required": false,
          "note": "Cost above which pre-auth is required"
        },
        {
          "key": "claims_format",
          "label": "Claims format",
          "type": "select",
          "required": false,
          "options": [
            "EDI",
            "HL7",
            "FHIR",
            "Proprietary"
          ],
          "note": "EDI | HL7 | FHIR | Proprietary"
        }
      ]
    },
    {
      "id": "pre_authorisation_request",
      "title": "Pre-Authorisation Request Form",
      "purpose": "Capture and save pre-authorisation request form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from registration"
        },
        {
          "key": "insurance_scheme",
          "label": "Insurance scheme",
          "type": "text",
          "required": true,
          "note": "Patient's active insurance"
        },
        {
          "key": "admission_diagnosis",
          "label": "Admission diagnosis",
          "type": "text",
          "required": true,
          "note": "ICD-10 coded diagnosis"
        },
        {
          "key": "admission_type",
          "label": "Admission type",
          "type": "select",
          "required": true,
          "options": [
            "Elective",
            "Emergency"
          ],
          "note": "Elective | Emergency"
        },
        {
          "key": "requested_services",
          "label": "Requested services",
          "type": "textarea",
          "required": true,
          "note": "List of services requiring pre-auth"
        },
        {
          "key": "estimated_cost_kes",
          "label": "Estimated cost (KES)",
          "type": "number",
          "required": true,
          "note": "Estimated total cost of admission"
        },
        {
          "key": "expected_admission_date",
          "label": "Expected admission date",
          "type": "date",
          "required": true,
          "note": "Planned date of admission"
        },
        {
          "key": "clinical_justification",
          "label": "Clinical justification",
          "type": "textarea",
          "required": true,
          "note": "Medical necessity statement for the insurer"
        },
        {
          "key": "attending_doctor",
          "label": "Attending doctor",
          "type": "text",
          "required": true,
          "note": "Requesting clinician"
        }
      ]
    },
    {
      "id": "claim_submission",
      "title": "Claim Submission Form",
      "purpose": "Capture and save claim submission form data.",
      "fields": [
        {
          "key": "invoice",
          "label": "Invoice",
          "type": "text",
          "required": true,
          "note": "Invoice being claimed"
        },
        {
          "key": "insurance_scheme",
          "label": "Insurance scheme",
          "type": "text",
          "required": true,
          "note": "Target insurer"
        },
        {
          "key": "pre_auth_reference",
          "label": "Pre-auth reference",
          "type": "text",
          "required": false,
          "note": "Pre-authorisation number if applicable"
        },
        {
          "key": "diagnosis_codes",
          "label": "Diagnosis codes",
          "type": "text",
          "required": true,
          "note": "ICD-10 codes from encounter"
        },
        {
          "key": "procedure_codes",
          "label": "Procedure codes",
          "type": "text",
          "required": true,
          "note": "Procedure codes from billing"
        },
        {
          "key": "claim_amount_kes",
          "label": "Claim amount (KES)",
          "type": "text",
          "required": true,
          "note": "Total amount being claimed"
        },
        {
          "key": "supporting_documents",
          "label": "Supporting documents",
          "type": "file",
          "required": false,
          "note": "Discharge summary, lab results, imaging reports"
        }
      ]
    },
    {
      "id": "denial_response",
      "title": "Denial Response Form",
      "purpose": "Capture and save denial response form data.",
      "fields": [
        {
          "key": "denied_claim",
          "label": "Denied claim",
          "type": "text",
          "required": true,
          "note": "Reference to original claim"
        },
        {
          "key": "denial_code",
          "label": "Denial code",
          "type": "text",
          "required": true,
          "note": "Insurer's denial code"
        },
        {
          "key": "denial_reason",
          "label": "Denial reason",
          "type": "text",
          "required": true,
          "note": "Insurer's denial reason"
        },
        {
          "key": "appeal_decision",
          "label": "Appeal decision",
          "type": "select",
          "required": true,
          "options": [
            "Will appeal",
            "No appeal"
          ],
          "note": "Will appeal | No appeal"
        },
        {
          "key": "appeal_grounds",
          "label": "Appeal grounds",
          "type": "textarea",
          "required": true,
          "note": "Clinical and administrative basis for appeal"
        },
        {
          "key": "supporting_documents",
          "label": "Supporting documents",
          "type": "file",
          "required": false,
          "note": "Additional documentation to support appeal"
        }
      ]
    }
  ],
  "15": [
    {
      "id": "stock_item_registration",
      "title": "Stock Item Registration Form",
      "purpose": "Capture and save stock item registration form data.",
      "fields": [
        {
          "key": "item_code",
          "label": "Item code",
          "type": "text",
          "required": true,
          "note": "Internal stock code"
        },
        {
          "key": "item_name",
          "label": "Item name",
          "type": "text",
          "required": true,
          "note": "Full item name"
        },
        {
          "key": "category",
          "label": "Category",
          "type": "select",
          "required": true,
          "options": [
            "Drug",
            "Consumable",
            "Equipment",
            "Linen",
            "Food",
            "Stationery"
          ],
          "note": "Drug | Consumable | Equipment | Linen | Food | Stationery"
        },
        {
          "key": "unit_of_measure",
          "label": "Unit of measure",
          "type": "select",
          "required": true,
          "options": [
            "Tablet",
            "Box",
            "Vial",
            "Piece",
            "Kg",
            "Litre"
          ],
          "note": "Tablet | Box | Vial | Piece | Kg | Litre"
        },
        {
          "key": "reorder_level",
          "label": "Reorder level",
          "type": "number",
          "required": true,
          "note": "Minimum quantity before reorder triggered"
        },
        {
          "key": "reorder_quantity",
          "label": "Reorder quantity",
          "type": "number",
          "required": true,
          "note": "Standard quantity to order"
        },
        {
          "key": "unit_cost_kes",
          "label": "Unit cost (KES)",
          "type": "number",
          "required": true,
          "note": "Cost to hospital per unit"
        },
        {
          "key": "selling_price_kes",
          "label": "Selling price (KES)",
          "type": "number",
          "required": false,
          "note": "Patient charge if applicable"
        },
        {
          "key": "storage_location",
          "label": "Storage location",
          "type": "text",
          "required": false,
          "note": "Store, shelf, or refrigerator location"
        },
        {
          "key": "is_controlled",
          "label": "Is controlled",
          "type": "checkbox",
          "required": true,
          "note": "Tick for narcotics and restricted items"
        }
      ]
    },
    {
      "id": "purchase_requisition",
      "title": "Purchase Requisition Form",
      "purpose": "Capture and save purchase requisition form data.",
      "fields": [
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Department requesting items"
        },
        {
          "key": "urgency",
          "label": "Urgency",
          "type": "select",
          "required": true,
          "options": [
            "Routine",
            "Urgent",
            "Critical"
          ],
          "note": "Routine | Urgent | Critical"
        },
        {
          "key": "required_by_date",
          "label": "Required by date",
          "type": "date",
          "required": false,
          "note": "When items are needed"
        },
        {
          "key": "items_requested",
          "label": "Items requested",
          "type": "text",
          "required": true,
          "note": "Item, quantity, and justification per line"
        },
        {
          "key": "justification",
          "label": "Justification",
          "type": "textarea",
          "required": true,
          "note": "Reason for the requisition"
        }
      ]
    },
    {
      "id": "purchase_order",
      "title": "Purchase Order Form",
      "purpose": "Capture and save purchase order form data.",
      "fields": [
        {
          "key": "supplier",
          "label": "Supplier",
          "type": "select",
          "required": true,
          "note": "Selected supplier from directory"
        },
        {
          "key": "items",
          "label": "Items",
          "type": "text",
          "required": true,
          "note": "Item, quantity, unit price per line"
        },
        {
          "key": "expected_delivery_date",
          "label": "Expected delivery date",
          "type": "date",
          "required": true,
          "note": "Agreed delivery date"
        },
        {
          "key": "delivery_instructions",
          "label": "Delivery instructions",
          "type": "text",
          "required": false,
          "note": "Special delivery or packing instructions"
        },
        {
          "key": "total_value_kes",
          "label": "Total value (KES)",
          "type": "text",
          "required": true,
          "note": "Sum of all line items"
        }
      ]
    },
    {
      "id": "goods_received_note_grn",
      "title": "Goods Received Note (GRN)",
      "purpose": "Capture and save goods received note (grn) data.",
      "fields": [
        {
          "key": "purchase_order",
          "label": "Purchase order",
          "type": "select",
          "required": true,
          "note": "PO being received against"
        },
        {
          "key": "supplier_delivery_note_number",
          "label": "Supplier delivery note number",
          "type": "text",
          "required": false,
          "note": "Supplier's delivery note reference"
        },
        {
          "key": "delivery_date",
          "label": "Delivery date",
          "type": "date",
          "required": true,
          "note": "Date goods physically received"
        },
        {
          "key": "items_received",
          "label": "Items received",
          "type": "text",
          "required": true,
          "note": "Item, ordered qty, received qty, batch, expiry, condition"
        },
        {
          "key": "items_rejected",
          "label": "Items rejected",
          "type": "text",
          "required": false,
          "note": "Items rejected - reason per item"
        },
        {
          "key": "received_by",
          "label": "Received by",
          "type": "text",
          "required": true,
          "note": "Store keeper - auto-filled from login"
        }
      ]
    },
    {
      "id": "stock_count",
      "title": "Stock Count Form",
      "purpose": "Capture and save stock count form data.",
      "fields": [
        {
          "key": "count_type",
          "label": "Count type",
          "type": "select",
          "required": true,
          "options": [
            "Full",
            "Cycle count",
            "Spot check"
          ],
          "note": "Full | Cycle count | Spot check"
        },
        {
          "key": "location",
          "label": "Location",
          "type": "select",
          "required": true,
          "note": "Store or area being counted"
        },
        {
          "key": "item",
          "label": "Item",
          "type": "select",
          "required": true,
          "note": "Item being counted"
        },
        {
          "key": "batch_number",
          "label": "Batch number",
          "type": "text",
          "required": false,
          "note": "Specific batch being counted"
        },
        {
          "key": "system_quantity",
          "label": "System quantity",
          "type": "text",
          "required": true,
          "note": "Auto-filled from inventory"
        },
        {
          "key": "physical_quantity",
          "label": "Physical quantity",
          "type": "number",
          "required": true,
          "note": "Actually counted quantity"
        },
        {
          "key": "variance_reason",
          "label": "Variance reason",
          "type": "text",
          "required": false,
          "note": "Explanation if variance exists"
        }
      ]
    }
  ],
  "16": [
    {
      "id": "employee_registration",
      "title": "Employee Registration Form",
      "purpose": "Capture and save employee registration form data.",
      "fields": [
        {
          "key": "first_name",
          "label": "First name",
          "type": "text",
          "required": true,
          "note": "Employee first name"
        },
        {
          "key": "last_name",
          "label": "Last name",
          "type": "text",
          "required": true,
          "note": "Employee surname"
        },
        {
          "key": "date_of_birth",
          "label": "Date of birth",
          "type": "date",
          "required": true,
          "note": "Date of birth"
        },
        {
          "key": "gender",
          "label": "Gender",
          "type": "select",
          "required": true,
          "options": [
            "Male",
            "Female",
            "Other"
          ],
          "note": "Male | Female | Other"
        },
        {
          "key": "national_id",
          "label": "National ID",
          "type": "text",
          "required": true,
          "note": "National ID number"
        },
        {
          "key": "kra_pin",
          "label": "KRA PIN",
          "type": "text",
          "required": true,
          "note": "For payroll PAYE processing"
        },
        {
          "key": "nssf_number",
          "label": "NSSF number",
          "type": "text",
          "required": true,
          "note": "NSSF membership number"
        },
        {
          "key": "sha_number",
          "label": "SHA number",
          "type": "text",
          "required": true,
          "note": "SHA membership number"
        },
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Department where employee works"
        },
        {
          "key": "job_title",
          "label": "Job title",
          "type": "text",
          "required": true,
          "note": "Position title"
        },
        {
          "key": "cadre",
          "label": "Cadre",
          "type": "select",
          "required": false,
          "options": [
            "Kenya health cadre - Physician",
            "Nurse",
            "Pharmacist",
            "etc."
          ],
          "note": "Kenya health cadre - Physician | Nurse | Pharmacist | etc."
        },
        {
          "key": "professional_registration_number",
          "label": "Professional registration number",
          "type": "text",
          "required": false,
          "note": "Board registration e.g. KMPDB, NCK, PPB"
        },
        {
          "key": "reg_expiry_date",
          "label": "Reg expiry date",
          "type": "date",
          "required": false,
          "note": "Registration expiry - system sends renewal alerts"
        },
        {
          "key": "hire_date",
          "label": "Hire date",
          "type": "date",
          "required": true,
          "note": "Employment start date"
        },
        {
          "key": "contract_type",
          "label": "Contract type",
          "type": "select",
          "required": true,
          "options": [
            "Permanent",
            "Contract",
            "Locum",
            "Intern",
            "Volunteer"
          ],
          "note": "Permanent | Contract | Locum | Intern | Volunteer"
        },
        {
          "key": "basic_salary_kes",
          "label": "Basic salary (KES)",
          "type": "number",
          "required": true,
          "note": "Monthly basic salary"
        },
        {
          "key": "bank_name",
          "label": "Bank name",
          "type": "select",
          "required": true,
          "note": "Bank for salary payment"
        },
        {
          "key": "bank_account_number",
          "label": "Bank account number",
          "type": "text",
          "required": true,
          "note": "Salary account number - encrypted"
        },
        {
          "key": "staff_photo",
          "label": "Staff photo",
          "type": "text",
          "required": false,
          "note": "Employee photo"
        }
      ]
    },
    {
      "id": "leave_application",
      "title": "Leave Application Form",
      "purpose": "Capture and save leave application form data.",
      "fields": [
        {
          "key": "employee",
          "label": "Employee",
          "type": "text",
          "required": true,
          "note": "Auto-filled from login"
        },
        {
          "key": "leave_type",
          "label": "Leave type",
          "type": "select",
          "required": true,
          "options": [
            "Annual",
            "Sick",
            "Maternity",
            "Paternity",
            "Compassionate",
            "Study",
            "Unpaid"
          ],
          "note": "Annual | Sick | Maternity | Paternity | Compassionate | Study | Unpaid"
        },
        {
          "key": "start_date",
          "label": "Start date",
          "type": "date",
          "required": true,
          "note": "Leave start date"
        },
        {
          "key": "end_date",
          "label": "End date",
          "type": "date",
          "required": true,
          "note": "Leave end date"
        },
        {
          "key": "number_of_days",
          "label": "Number of days",
          "type": "text",
          "required": true,
          "note": "Calculated excluding weekends and public holidays"
        },
        {
          "key": "reason",
          "label": "Reason",
          "type": "textarea",
          "required": false,
          "note": "Reason for leave request"
        },
        {
          "key": "attach_supporting_document",
          "label": "Attach supporting document",
          "type": "file",
          "required": false,
          "note": "Medical certificate if sick leave"
        }
      ]
    },
    {
      "id": "payroll_processing",
      "title": "Payroll Processing Form",
      "purpose": "Capture and save payroll processing form data.",
      "fields": [
        {
          "key": "payroll_month",
          "label": "Payroll month",
          "type": "text",
          "required": true,
          "note": "Month being processed"
        },
        {
          "key": "basic_salary",
          "label": "Basic salary",
          "type": "text",
          "required": true,
          "note": "From employment contract"
        },
        {
          "key": "allowances",
          "label": "Allowances",
          "type": "text",
          "required": false,
          "note": "House, transport, call, hardship - per contract"
        },
        {
          "key": "gross_pay",
          "label": "Gross pay",
          "type": "text",
          "required": true,
          "note": "Basic + all allowances"
        },
        {
          "key": "paye_tax",
          "label": "PAYE tax",
          "type": "text",
          "required": true,
          "note": "Auto-calculated per KRA tax bands"
        },
        {
          "key": "nssf_deduction",
          "label": "NSSF deduction",
          "type": "text",
          "required": true,
          "note": "Statutory NSSF contribution"
        },
        {
          "key": "sha_deduction",
          "label": "SHA deduction",
          "type": "text",
          "required": true,
          "note": "Statutory SHA/SHA contribution"
        },
        {
          "key": "other_deductions",
          "label": "Other deductions",
          "type": "text",
          "required": false,
          "note": "Salary advance, loan repayment, fines"
        },
        {
          "key": "net_pay",
          "label": "Net pay",
          "type": "text",
          "required": true,
          "note": "Gross minus all deductions"
        }
      ]
    },
    {
      "id": "performance_review",
      "title": "Performance Review Form",
      "purpose": "Capture and save performance review form data.",
      "fields": [
        {
          "key": "employee",
          "label": "Employee",
          "type": "select",
          "required": true,
          "note": "Employee being reviewed"
        },
        {
          "key": "review_period",
          "label": "Review period",
          "type": "select",
          "required": true,
          "options": [
            "H1",
            "H2",
            "Annual - half-year or annual"
          ],
          "note": "H1 | H2 | Annual - half-year or annual"
        },
        {
          "key": "kpi_scores",
          "label": "KPI scores",
          "type": "text",
          "required": true,
          "note": "Per KPI: name, target, achieved, score"
        },
        {
          "key": "overall_rating",
          "label": "Overall rating",
          "type": "select",
          "required": true,
          "options": [
            "Outstanding",
            "Exceeds expectations",
            "Meets",
            "Below",
            "Unsatisfactory"
          ],
          "note": "Outstanding | Exceeds expectations | Meets | Below | Unsatisfactory"
        },
        {
          "key": "strengths",
          "label": "Strengths",
          "type": "textarea",
          "required": true,
          "note": "Key achievements and strengths"
        },
        {
          "key": "areas_for_improvement",
          "label": "Areas for improvement",
          "type": "textarea",
          "required": true,
          "note": "Development areas identified"
        },
        {
          "key": "development_plan",
          "label": "Development plan",
          "type": "textarea",
          "required": true,
          "note": "Agreed training and development actions"
        },
        {
          "key": "employee_comments",
          "label": "Employee comments",
          "type": "textarea",
          "required": false,
          "note": "Employee response to the review"
        }
      ]
    },
    {
      "id": "disciplinary",
      "title": "Disciplinary Form",
      "purpose": "Capture and save disciplinary form data.",
      "fields": [
        {
          "key": "employee",
          "label": "Employee",
          "type": "select",
          "required": true,
          "note": "Subject of disciplinary action"
        },
        {
          "key": "incident_date",
          "label": "Incident date",
          "type": "date",
          "required": true,
          "note": "Date misconduct occurred"
        },
        {
          "key": "category",
          "label": "Category",
          "type": "select",
          "required": true,
          "options": [
            "Misconduct",
            "Gross misconduct",
            "Absenteeism",
            "Negligence",
            "Substance abuse"
          ],
          "note": "Misconduct | Gross misconduct | Absenteeism | Negligence | Substance abuse"
        },
        {
          "key": "description",
          "label": "Description",
          "type": "textarea",
          "required": true,
          "note": "Detailed account of the misconduct"
        },
        {
          "key": "witnesses",
          "label": "Witnesses",
          "type": "text",
          "required": false,
          "note": "Names of witnesses to the incident"
        },
        {
          "key": "hearing_date",
          "label": "Hearing date",
          "type": "date",
          "required": false,
          "note": "Date of disciplinary hearing"
        },
        {
          "key": "hearing_outcome",
          "label": "Hearing outcome",
          "type": "textarea",
          "required": false,
          "note": "Findings and decision"
        },
        {
          "key": "sanction",
          "label": "Sanction",
          "type": "select",
          "required": false,
          "options": [
            "Verbal warning",
            "Written warning",
            "Final warning",
            "Suspension",
            "Dismissal"
          ],
          "note": "Verbal warning | Written warning | Final warning | Suspension | Dismissal"
        }
      ]
    }
  ],
  "17": [
    {
      "id": "doctor_profile",
      "title": "Doctor Profile Form",
      "purpose": "Capture and save doctor profile form data.",
      "fields": [
        {
          "key": "staff_member",
          "label": "Staff member",
          "type": "text",
          "required": true,
          "note": "Linked from HR staff record"
        },
        {
          "key": "specialisation",
          "label": "Specialisation",
          "type": "select",
          "required": true,
          "note": "Primary and secondary specialties"
        },
        {
          "key": "kmpdb_licence_number",
          "label": "KMPDB licence number",
          "type": "text",
          "required": true,
          "note": "Kenya Medical Practitioners Board registration"
        },
        {
          "key": "licence_expiry_date",
          "label": "Licence expiry date",
          "type": "date",
          "required": true,
          "note": "Sends alert 90 and 30 days before expiry"
        },
        {
          "key": "sub_specialties",
          "label": "Sub-specialties",
          "type": "text",
          "required": false,
          "note": "Additional sub-specialty qualifications"
        },
        {
          "key": "consultation_types",
          "label": "Consultation types",
          "type": "checkbox",
          "required": true,
          "note": "OPD | Inpatient | Emergency | Telemedicine | Procedure"
        },
        {
          "key": "department_assignment",
          "label": "Department assignment",
          "type": "select",
          "required": true,
          "note": "Primary department"
        },
        {
          "key": "on_call_eligible",
          "label": "On-call eligible",
          "type": "checkbox",
          "required": true,
          "note": "Tick if doctor does on-call duties"
        }
      ]
    },
    {
      "id": "on_call_schedule",
      "title": "On-Call Schedule Form",
      "purpose": "Capture and save on-call schedule form data.",
      "fields": [
        {
          "key": "doctor",
          "label": "Doctor",
          "type": "select",
          "required": true,
          "note": "Doctor being scheduled"
        },
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Specialty on-call"
        },
        {
          "key": "call_date",
          "label": "Call date",
          "type": "date",
          "required": true,
          "note": "Date of on-call duty"
        },
        {
          "key": "call_type",
          "label": "Call type",
          "type": "select",
          "required": true,
          "options": [
            "Primary",
            "Backup",
            "Consultant"
          ],
          "note": "Primary | Backup | Consultant"
        },
        {
          "key": "start_time",
          "label": "Start time",
          "type": "time",
          "required": true,
          "note": "On-call start time"
        },
        {
          "key": "end_time",
          "label": "End time",
          "type": "time",
          "required": true,
          "note": "On-call end time"
        },
        {
          "key": "contact_phone",
          "label": "Contact phone",
          "type": "tel",
          "required": true,
          "note": "Phone number to call during this period"
        }
      ]
    }
  ],
  "18": [
    {
      "id": "asset_registration",
      "title": "Asset Registration Form",
      "purpose": "Capture and save asset registration form data.",
      "fields": [
        {
          "key": "asset_name",
          "label": "Asset name",
          "type": "text",
          "required": true,
          "note": "Equipment or furniture name"
        },
        {
          "key": "asset_category",
          "label": "Asset category",
          "type": "select",
          "required": true,
          "options": [
            "Biomedical",
            "Furniture",
            "IT",
            "Vehicle",
            "Linen",
            "Other"
          ],
          "note": "Biomedical | Furniture | IT | Vehicle | Linen | Other"
        },
        {
          "key": "manufacturer",
          "label": "Manufacturer",
          "type": "text",
          "required": false,
          "note": "Manufacturer name"
        },
        {
          "key": "model",
          "label": "Model",
          "type": "text",
          "required": false,
          "note": "Model number or name"
        },
        {
          "key": "serial_number",
          "label": "Serial number",
          "type": "text",
          "required": false,
          "note": "Manufacturer serial number"
        },
        {
          "key": "year_purchased",
          "label": "Year purchased",
          "type": "number",
          "required": true,
          "note": "Year of purchase"
        },
        {
          "key": "purchase_cost_kes",
          "label": "Purchase cost (KES)",
          "type": "number",
          "required": true,
          "note": "Purchase price"
        },
        {
          "key": "department_location",
          "label": "Department location",
          "type": "select",
          "required": true,
          "note": "Department where asset is located"
        },
        {
          "key": "room",
          "label": "Room",
          "type": "text",
          "required": false,
          "note": "Specific room or bay"
        },
        {
          "key": "warranty_expiry",
          "label": "Warranty expiry",
          "type": "date",
          "required": false,
          "note": "Warranty expiry date"
        },
        {
          "key": "service_interval_months",
          "label": "Service interval (months)",
          "type": "number",
          "required": true,
          "note": "Frequency of preventive maintenance"
        }
      ]
    },
    {
      "id": "maintenance_request",
      "title": "Maintenance Request Form",
      "purpose": "Capture and save maintenance request form data.",
      "fields": [
        {
          "key": "asset",
          "label": "Asset",
          "type": "select",
          "required": false,
          "note": "Asset needing maintenance - or describe if not in system"
        },
        {
          "key": "issue_description",
          "label": "Issue description",
          "type": "textarea",
          "required": true,
          "note": "Detailed description of the problem"
        },
        {
          "key": "priority",
          "label": "Priority",
          "type": "select",
          "required": true,
          "options": [
            "Low",
            "Medium",
            "High",
            "Critical"
          ],
          "note": "Low | Medium | High | Critical"
        },
        {
          "key": "requested_by",
          "label": "Requested by",
          "type": "text",
          "required": true,
          "note": "Auto-filled - logged in staff member"
        },
        {
          "key": "department",
          "label": "Department",
          "type": "text",
          "required": true,
          "note": "Auto-filled from user profile"
        }
      ]
    },
    {
      "id": "maintenance_record",
      "title": "Maintenance Record Form",
      "purpose": "Capture and save maintenance record form data.",
      "fields": [
        {
          "key": "asset",
          "label": "Asset",
          "type": "text",
          "required": true,
          "note": "Asset serviced"
        },
        {
          "key": "maintenance_type",
          "label": "Maintenance type",
          "type": "select",
          "required": true,
          "options": [
            "Preventive",
            "Corrective",
            "Calibration",
            "Inspection"
          ],
          "note": "Preventive | Corrective | Calibration | Inspection"
        },
        {
          "key": "work_performed",
          "label": "Work performed",
          "type": "textarea",
          "required": true,
          "note": "Detailed description of work done"
        },
        {
          "key": "parts_replaced",
          "label": "Parts replaced",
          "type": "text",
          "required": false,
          "note": "Parts or consumables replaced with cost"
        },
        {
          "key": "service_provider",
          "label": "Service provider",
          "type": "text",
          "required": true,
          "note": "Internal team or external company"
        },
        {
          "key": "downtime_hours",
          "label": "Downtime (hours)",
          "type": "number",
          "required": false,
          "note": "How long asset was out of service"
        },
        {
          "key": "cost_kes",
          "label": "Cost (KES)",
          "type": "number",
          "required": false,
          "note": "Total maintenance cost"
        },
        {
          "key": "next_service_date",
          "label": "Next service date",
          "type": "date",
          "required": true,
          "note": "Next scheduled maintenance"
        }
      ]
    }
  ],
  "19": [
    {
      "id": "custom_report_builder",
      "title": "Custom Report Builder Form",
      "purpose": "Capture and save custom report builder form data.",
      "fields": [
        {
          "key": "report_name",
          "label": "Report name",
          "type": "text",
          "required": true,
          "note": "Name for this report template"
        },
        {
          "key": "report_category",
          "label": "Report category",
          "type": "select",
          "required": true,
          "options": [
            "Clinical",
            "Financial",
            "HR",
            "Quality",
            "MOH Statutory",
            "Management"
          ],
          "note": "Clinical | Financial | HR | Quality | MOH Statutory | Management"
        },
        {
          "key": "data_source_modules",
          "label": "Data source modules",
          "type": "select",
          "required": true,
          "note": "Select modules to pull data from"
        },
        {
          "key": "fields_to_include",
          "label": "Fields to include",
          "type": "text",
          "required": true,
          "note": "Select specific fields from chosen modules"
        },
        {
          "key": "filter_criteria",
          "label": "Filter criteria",
          "type": "text",
          "required": false,
          "note": "Date range, department, doctor, diagnosis code etc."
        },
        {
          "key": "grouping",
          "label": "Grouping",
          "type": "select",
          "required": false,
          "options": [
            "Group results by: Department",
            "Doctor",
            "Date",
            "Diagnosis"
          ],
          "note": "Group results by: Department | Doctor | Date | Diagnosis"
        },
        {
          "key": "aggregations",
          "label": "Aggregations",
          "type": "checkbox",
          "required": false,
          "note": "Count | Sum | Average | Min | Max"
        },
        {
          "key": "output_format",
          "label": "Output format",
          "type": "select",
          "required": true,
          "options": [
            "PDF",
            "Excel",
            "CSV",
            "Chart"
          ],
          "note": "PDF | Excel | CSV | Chart"
        },
        {
          "key": "schedule",
          "label": "Schedule",
          "type": "select",
          "required": false,
          "options": [
            "One-time",
            "Daily",
            "Weekly",
            "Monthly"
          ],
          "note": "One-time | Daily | Weekly | Monthly"
        }
      ]
    },
    {
      "id": "report_run_parameters",
      "title": "Report Run Parameters Form",
      "purpose": "Capture and save report run parameters form data.",
      "fields": [
        {
          "key": "report_template",
          "label": "Report template",
          "type": "text",
          "required": true,
          "note": "Selected report"
        },
        {
          "key": "date_from",
          "label": "Date from",
          "type": "date",
          "required": true,
          "note": "Start date for report data"
        },
        {
          "key": "date_to",
          "label": "Date to",
          "type": "date",
          "required": true,
          "note": "End date for report data"
        },
        {
          "key": "department_filter",
          "label": "Department filter",
          "type": "select",
          "required": false,
          "note": "Filter to specific department - blank for all"
        },
        {
          "key": "doctor_filter",
          "label": "Doctor filter",
          "type": "select",
          "required": false,
          "note": "Filter to specific doctor - blank for all"
        },
        {
          "key": "output_format",
          "label": "Output format",
          "type": "select",
          "required": true,
          "options": [
            "PDF",
            "Excel",
            "CSV"
          ],
          "note": "PDF | Excel | CSV"
        }
      ]
    }
  ],
  "20": [
    {
      "id": "user_account_creation",
      "title": "User Account Creation Form",
      "purpose": "Capture and save user account creation form data.",
      "fields": [
        {
          "key": "staff_member",
          "label": "Staff member",
          "type": "select",
          "required": true,
          "note": "Link to HR staff record"
        },
        {
          "key": "username",
          "label": "Username",
          "type": "text",
          "required": true,
          "note": "Unique login username - auto-suggested from name"
        },
        {
          "key": "email",
          "label": "Email",
          "type": "email",
          "required": true,
          "note": "Work email for notifications and MFA"
        },
        {
          "key": "primary_role",
          "label": "Primary role",
          "type": "select",
          "required": true,
          "note": "Select from defined roles"
        },
        {
          "key": "additional_roles",
          "label": "Additional roles",
          "type": "select",
          "required": false,
          "note": "Supplementary module-level permissions"
        },
        {
          "key": "mfa_required",
          "label": "MFA required",
          "type": "checkbox",
          "required": true,
          "note": "Tick to enforce MFA - mandatory for clinical roles"
        },
        {
          "key": "shift_start",
          "label": "Shift start",
          "type": "time",
          "required": false,
          "note": "For time-based access control"
        },
        {
          "key": "shift_end",
          "label": "Shift end",
          "type": "time",
          "required": false,
          "note": "System denies login outside shift hours"
        }
      ]
    },
    {
      "id": "role_configuration",
      "title": "Role Configuration Form",
      "purpose": "Capture and save role configuration form data.",
      "fields": [
        {
          "key": "role_name",
          "label": "Role name",
          "type": "text",
          "required": true,
          "note": "Role identifier e.g. PHARMACIST, BILLING_OFFICER"
        },
        {
          "key": "display_name",
          "label": "Display name",
          "type": "text",
          "required": true,
          "note": "Human-readable label"
        },
        {
          "key": "is_clinical",
          "label": "Is clinical",
          "type": "checkbox",
          "required": true,
          "note": "Tick if role accesses clinical data"
        },
        {
          "key": "module_permissions",
          "label": "Module permissions",
          "type": "select",
          "required": true,
          "options": [
            "Per module: Read",
            "Create",
            "Update",
            "Delete",
            "Approve",
            "Export"
          ],
          "note": "Per module: Read | Create | Update | Delete | Approve | Export"
        }
      ]
    },
    {
      "id": "break_glass_access",
      "title": "Break-Glass Access Form",
      "purpose": "Capture and save break-glass access form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Patient whose records need emergency access"
        },
        {
          "key": "reason",
          "label": "Reason",
          "type": "select",
          "required": true,
          "options": [
            "Emergency treatment",
            "Life-threatening situation",
            "Legal requirement"
          ],
          "note": "Emergency treatment | Life-threatening situation | Legal requirement"
        },
        {
          "key": "justification",
          "label": "Justification",
          "type": "textarea",
          "required": true,
          "note": "Detailed clinical justification - mandatory"
        },
        {
          "key": "supervisor_notification",
          "label": "Supervisor notification",
          "type": "checkbox",
          "required": true,
          "note": "Tick to automatically notify supervisor of break-glass access"
        }
      ]
    }
  ],
  "21": [
    {
      "id": "telemedicine_session_booking",
      "title": "Telemedicine Session Booking Form",
      "purpose": "Capture and save telemedicine session booking form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Patient MRN or search by name"
        },
        {
          "key": "doctor",
          "label": "Doctor",
          "type": "select",
          "required": true,
          "note": "Doctor for the telemedicine session"
        },
        {
          "key": "session_type",
          "label": "Session type",
          "type": "select",
          "required": true,
          "options": [
            "New consultation",
            "Follow-up",
            "Specialist referral"
          ],
          "note": "New consultation | Follow-up | Specialist referral"
        },
        {
          "key": "date_and_time",
          "label": "Date and time",
          "type": "datetime-local",
          "required": true,
          "note": "From available telemedicine slots"
        },
        {
          "key": "chief_complaint",
          "label": "Chief complaint",
          "type": "text",
          "required": true,
          "note": "Reason for virtual consultation"
        },
        {
          "key": "patient_device",
          "label": "Patient device",
          "type": "select",
          "required": false,
          "options": [
            "Web",
            "iOS",
            "Android - for technical support"
          ],
          "note": "Web | iOS | Android - for technical support"
        },
        {
          "key": "consent_for_telemedicine",
          "label": "Consent for telemedicine",
          "type": "checkbox",
          "required": true,
          "note": "Patient consents to virtual consultation and recording policy"
        }
      ]
    },
    {
      "id": "telemedicine_consultation",
      "title": "Telemedicine Consultation Form",
      "purpose": "Capture and save telemedicine consultation form data.",
      "fields": [
        {
          "key": "technical_check",
          "label": "Technical check",
          "type": "checkbox",
          "required": true,
          "note": "Audio OK | Video OK | Patient identity confirmed"
        },
        {
          "key": "session_notes",
          "label": "Session notes",
          "type": "textarea",
          "required": true,
          "note": "Consultation notes - same fields as OPD consultation"
        },
        {
          "key": "diagnosis",
          "label": "Diagnosis",
          "type": "text",
          "required": true,
          "note": "ICD-10 coded diagnosis"
        },
        {
          "key": "management_plan",
          "label": "Management plan",
          "type": "textarea",
          "required": true,
          "note": "Treatment plan including virtual prescriptions"
        },
        {
          "key": "prescription_issued",
          "label": "Prescription issued",
          "type": "checkbox",
          "required": false,
          "note": "Tick to open digital prescription form"
        },
        {
          "key": "investigations_ordered",
          "label": "Investigations ordered",
          "type": "checkbox",
          "required": false,
          "note": "Tests to be done at nearest facility"
        },
        {
          "key": "follow_up",
          "label": "Follow-up",
          "type": "select",
          "required": true,
          "options": [
            "Telemedicine",
            "Physical visit",
            "No follow-up needed"
          ],
          "note": "Telemedicine | Physical visit | No follow-up needed"
        },
        {
          "key": "referral_to_physical",
          "label": "Referral to physical",
          "type": "checkbox",
          "required": false,
          "note": "Tick if physical attendance is needed"
        }
      ]
    }
  ],
  "22": [
    {
      "id": "audit_query",
      "title": "Audit Query Form",
      "purpose": "Capture and save audit query form data.",
      "fields": [
        {
          "key": "date_range",
          "label": "Date range",
          "type": "date",
          "required": true,
          "note": "Period to search audit trail"
        },
        {
          "key": "user",
          "label": "User",
          "type": "select",
          "required": false,
          "note": "Filter by specific user"
        },
        {
          "key": "module",
          "label": "Module",
          "type": "select",
          "required": false,
          "note": "Filter by module"
        },
        {
          "key": "action_type",
          "label": "Action type",
          "type": "select",
          "required": false,
          "options": [
            "Insert",
            "Update",
            "Delete",
            "Login",
            "Export"
          ],
          "note": "Insert | Update | Delete | Login | Export"
        },
        {
          "key": "record_id",
          "label": "Record ID",
          "type": "text",
          "required": false,
          "note": "Specific record to trace all changes"
        },
        {
          "key": "patient_mrn",
          "label": "Patient MRN",
          "type": "text",
          "required": false,
          "note": "All actions on this patient's records"
        }
      ]
    },
    {
      "id": "chain_integrity_verification",
      "title": "Chain Integrity Verification Form",
      "purpose": "Capture and save chain integrity verification form data.",
      "fields": [
        {
          "key": "from_entry_id",
          "label": "From entry ID",
          "type": "number",
          "required": true,
          "note": "Start of chain to verify"
        },
        {
          "key": "to_entry_id",
          "label": "To entry ID",
          "type": "number",
          "required": true,
          "note": "End of chain to verify"
        },
        {
          "key": "verification_result",
          "label": "Verification result",
          "type": "select",
          "required": true,
          "options": [
            "Pass - chain intact",
            "Fail - tampering detected"
          ],
          "note": "Pass - chain intact | Fail - tampering detected"
        }
      ]
    }
  ],
  "24": [
    {
      "id": "portal_account_registration",
      "title": "Portal Account Registration Form",
      "purpose": "Capture and save portal account registration form data.",
      "fields": [
        {
          "key": "mrn",
          "label": "MRN",
          "type": "text",
          "required": true,
          "note": "Medical record number from facility registration"
        },
        {
          "key": "date_of_birth",
          "label": "Date of birth",
          "type": "date",
          "required": true,
          "note": "Verified against hospital records"
        },
        {
          "key": "phone_number",
          "label": "Phone number",
          "type": "tel",
          "required": true,
          "note": "Registered phone for OTP verification"
        },
        {
          "key": "email_address",
          "label": "Email address",
          "type": "email",
          "required": true,
          "note": "Login email"
        },
        {
          "key": "create_password",
          "label": "Create password",
          "type": "text",
          "required": true,
          "note": "Minimum 8 characters with complexity requirements"
        },
        {
          "key": "confirm_password",
          "label": "Confirm password",
          "type": "text",
          "required": true,
          "note": "Must match password field"
        },
        {
          "key": "notification_preferences",
          "label": "Notification preferences",
          "type": "checkbox",
          "required": false,
          "note": "SMS | Email | WhatsApp - what to receive"
        }
      ]
    },
    {
      "id": "appointment_booking_portal",
      "title": "Appointment Booking (Portal)",
      "purpose": "Capture and save appointment booking (portal) data.",
      "fields": [
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Clinic or specialty"
        },
        {
          "key": "appointment_type",
          "label": "Appointment type",
          "type": "select",
          "required": true,
          "options": [
            "New",
            "Follow-up",
            "Telemedicine"
          ],
          "note": "New | Follow-up | Telemedicine"
        },
        {
          "key": "preferred_date",
          "label": "Preferred date",
          "type": "date",
          "required": true,
          "note": "Select from available calendar"
        },
        {
          "key": "available_slot",
          "label": "Available slot",
          "type": "select",
          "required": true,
          "note": "Choose from doctor's available times"
        },
        {
          "key": "chief_complaint",
          "label": "Chief complaint",
          "type": "text",
          "required": true,
          "note": "Reason for appointment"
        },
        {
          "key": "insurance_to_use",
          "label": "Insurance to use",
          "type": "select",
          "required": false,
          "note": "Active insurance scheme for this visit"
        }
      ]
    },
    {
      "id": "patient_feedback_form_portal",
      "title": "Patient Feedback Form (Portal)",
      "purpose": "Capture and save patient feedback form (portal) data.",
      "fields": [
        {
          "key": "visit_date",
          "label": "Visit date",
          "type": "date",
          "required": true,
          "note": "Date of the visit being rated"
        },
        {
          "key": "overall_satisfaction",
          "label": "Overall satisfaction",
          "type": "text",
          "required": true,
          "note": "1-5 star rating"
        },
        {
          "key": "staff_attitude",
          "label": "Staff attitude",
          "type": "text",
          "required": false,
          "note": "1-5 rating"
        },
        {
          "key": "cleanliness",
          "label": "Cleanliness",
          "type": "text",
          "required": false,
          "note": "1-5 rating"
        },
        {
          "key": "wait_time",
          "label": "Wait time",
          "type": "text",
          "required": false,
          "note": "1-5 rating"
        },
        {
          "key": "would_recommend",
          "label": "Would recommend",
          "type": "text",
          "required": true,
          "note": "Net Promoter Score 0-10"
        },
        {
          "key": "comments",
          "label": "Comments",
          "type": "textarea",
          "required": false,
          "note": "Free-text feedback"
        }
      ]
    }
  ],
  "25": [
    {
      "id": "emergency_triage",
      "title": "Emergency Triage Form",
      "purpose": "Capture and save emergency triage form data.",
      "fields": [
        {
          "key": "patient_name",
          "label": "Patient name",
          "type": "text",
          "required": true,
          "note": "Full name - MRN auto-searched or created"
        },
        {
          "key": "arrival_mode",
          "label": "Arrival mode",
          "type": "select",
          "required": true,
          "options": [
            "Walk-in",
            "Ambulance",
            "Police",
            "Referred",
            "Air"
          ],
          "note": "Walk-in | Ambulance | Police | Referred | Air"
        },
        {
          "key": "triage_category",
          "label": "Triage category",
          "type": "select",
          "required": true,
          "options": [
            "P1 Immediate",
            "P2 Urgent",
            "P3 Semi-urgent",
            "P4 Non-urgent",
            "P5 Dead"
          ],
          "note": "P1 Immediate | P2 Urgent | P3 Semi-urgent | P4 Non-urgent | P5 Dead"
        },
        {
          "key": "triage_system",
          "label": "Triage system",
          "type": "select",
          "required": true,
          "options": [
            "MTS",
            "SATS",
            "ESI",
            "START"
          ],
          "note": "MTS | SATS | ESI | START"
        },
        {
          "key": "chief_complaint",
          "label": "Chief complaint",
          "type": "text",
          "required": true,
          "note": "Primary emergency complaint"
        },
        {
          "key": "mechanism_of_injury",
          "label": "Mechanism of injury",
          "type": "text",
          "required": false,
          "note": "For trauma: how injury occurred"
        },
        {
          "key": "airway",
          "label": "Airway",
          "type": "select",
          "required": true,
          "options": [
            "Patent",
            "Compromised",
            "Obstructed"
          ],
          "note": "Patent | Compromised | Obstructed"
        },
        {
          "key": "breathing",
          "label": "Breathing",
          "type": "select",
          "required": true,
          "options": [
            "Adequate",
            "Inadequate",
            "Absent"
          ],
          "note": "Adequate | Inadequate | Absent"
        },
        {
          "key": "circulation",
          "label": "Circulation",
          "type": "select",
          "required": true,
          "options": [
            "Normal",
            "Compromised",
            "Absent"
          ],
          "note": "Normal | Compromised | Absent"
        },
        {
          "key": "disability_avpu",
          "label": "Disability (AVPU)",
          "type": "select",
          "required": true,
          "options": [
            "Alert",
            "Voice",
            "Pain",
            "Unresponsive"
          ],
          "note": "Alert | Voice | Pain | Unresponsive"
        },
        {
          "key": "temperature_c",
          "label": "Temperature (°C)",
          "type": "number",
          "required": true,
          "note": "Body temperature"
        },
        {
          "key": "pulse_bpm",
          "label": "Pulse (bpm)",
          "type": "number",
          "required": true,
          "note": "Heart rate"
        },
        {
          "key": "blood_pressure",
          "label": "Blood pressure",
          "type": "text",
          "required": true,
          "note": "Systolic/Diastolic"
        },
        {
          "key": "respiratory_rate",
          "label": "Respiratory rate",
          "type": "number",
          "required": true,
          "note": "Breaths per minute"
        },
        {
          "key": "spo2",
          "label": "SpO2 (%)",
          "type": "number",
          "required": true,
          "note": "Oxygen saturation"
        },
        {
          "key": "gcs_total",
          "label": "GCS total",
          "type": "number",
          "required": true,
          "note": "Glasgow Coma Scale 3-15"
        },
        {
          "key": "pain_score",
          "label": "Pain score",
          "type": "text",
          "required": true,
          "note": "0-10 scale"
        },
        {
          "key": "blood_glucose",
          "label": "Blood glucose",
          "type": "number",
          "required": false,
          "note": "Bedside glucose mmol/L"
        },
        {
          "key": "pregnancy_status",
          "label": "Pregnancy status",
          "type": "select",
          "required": false,
          "note": "If applicable - female of reproductive age"
        },
        {
          "key": "allergies",
          "label": "Allergies",
          "type": "checkbox",
          "required": true,
          "note": "Confirm allergy status checked"
        },
        {
          "key": "resuscitation_bay_needed",
          "label": "Resuscitation bay needed",
          "type": "checkbox",
          "required": false,
          "note": "Tick to activate resuscitation bay"
        },
        {
          "key": "pre_arrival_notification",
          "label": "Pre-arrival notification",
          "type": "checkbox",
          "required": false,
          "note": "Tick if ambulance pre-notified"
        }
      ]
    },
    {
      "id": "emergency_encounter",
      "title": "Emergency Encounter Form",
      "purpose": "Capture and save emergency encounter form data.",
      "fields": [
        {
          "key": "clinical_assessment",
          "label": "Clinical assessment",
          "type": "textarea",
          "required": true,
          "note": "Full clinical assessment by emergency doctor"
        },
        {
          "key": "working_diagnosis",
          "label": "Working diagnosis",
          "type": "text",
          "required": true,
          "note": "Emergency diagnosis - ICD-10 coded"
        },
        {
          "key": "investigations_ordered",
          "label": "Investigations ordered",
          "type": "checkbox",
          "required": false,
          "note": "Labs, imaging, ECG, blood cultures"
        },
        {
          "key": "resuscitation_actions",
          "label": "Resuscitation actions",
          "type": "textarea",
          "required": false,
          "note": "Detailed resuscitation steps performed"
        },
        {
          "key": "treatments_given",
          "label": "Treatments given",
          "type": "text",
          "required": false,
          "note": "Drugs and interventions in emergency department"
        },
        {
          "key": "disposition",
          "label": "Disposition",
          "type": "select",
          "required": true,
          "options": [
            "Admitted",
            "ICU",
            "Theatre",
            "Discharged",
            "Transferred",
            "Deceased"
          ],
          "note": "Admitted | ICU | Theatre | Discharged | Transferred | Deceased"
        },
        {
          "key": "disposition_time",
          "label": "Disposition time",
          "type": "datetime-local",
          "required": true,
          "note": "Time disposition decision was made"
        },
        {
          "key": "trauma_team_activated",
          "label": "Trauma team activated",
          "type": "checkbox",
          "required": false,
          "note": "Tick if trauma team was paged"
        }
      ]
    },
    {
      "id": "trauma_documentation",
      "title": "Trauma Documentation Form",
      "purpose": "Capture and save trauma documentation form data.",
      "fields": [
        {
          "key": "time_of_injury",
          "label": "Time of injury",
          "type": "datetime-local",
          "required": true,
          "note": "When injury occurred"
        },
        {
          "key": "injury_mechanism",
          "label": "Injury mechanism",
          "type": "select",
          "required": true,
          "options": [
            "MVA",
            "Fall",
            "Assault",
            "Gunshot",
            "Stab",
            "Burns",
            "Drowning",
            "Other"
          ],
          "note": "MVA | Fall | Assault | Gunshot | Stab | Burns | Drowning | Other"
        },
        {
          "key": "body_regions_injured",
          "label": "Body regions injured",
          "type": "checkbox",
          "required": true,
          "note": "Head | Neck | Chest | Abdomen | Pelvis | Spine | Upper limb | Lower limb"
        },
        {
          "key": "injury_severity_score",
          "label": "Injury severity score",
          "type": "number",
          "required": false,
          "note": "ISS - calculated from AIS scores per region"
        },
        {
          "key": "police_case_number",
          "label": "Police case number",
          "type": "text",
          "required": false,
          "note": "P3 form or OB number if police case"
        },
        {
          "key": "tetanus_status",
          "label": "Tetanus status",
          "type": "select",
          "required": false,
          "options": [
            "Up to date",
            "Not up to date",
            "Unknown"
          ],
          "note": "Up to date | Not up to date | Unknown"
        },
        {
          "key": "tetanus_given",
          "label": "Tetanus given",
          "type": "checkbox",
          "required": false,
          "note": "Tick if tetanus prophylaxis administered"
        }
      ]
    }
  ],
  "28": [
    {
      "id": "token_issuance",
      "title": "Token Issuance Form",
      "purpose": "Capture and save token issuance form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Patient MRN or name - auto-filled from registration"
        },
        {
          "key": "service_type",
          "label": "Service type",
          "type": "select",
          "required": true,
          "options": [
            "OPD",
            "Lab",
            "Pharmacy",
            "Billing",
            "Radiology",
            "Triage"
          ],
          "note": "OPD | Lab | Pharmacy | Billing | Radiology | Triage"
        },
        {
          "key": "priority_level",
          "label": "Priority level",
          "type": "select",
          "required": true,
          "options": [
            "Normal",
            "Urgent",
            "Emergency - affects queue position"
          ],
          "note": "Normal | Urgent | Emergency - affects queue position"
        },
        {
          "key": "linked_appointment",
          "label": "Linked appointment",
          "type": "select",
          "required": false,
          "note": "Appointment number if pre-booked"
        },
        {
          "key": "counter_assignment",
          "label": "Counter assignment",
          "type": "select",
          "required": false,
          "note": "Specific counter if directed"
        }
      ]
    },
    {
      "id": "counter_configuration",
      "title": "Counter Configuration Form",
      "purpose": "Capture and save counter configuration form data.",
      "fields": [
        {
          "key": "counter_name",
          "label": "Counter name",
          "type": "text",
          "required": true,
          "note": "e.g. OPD Room 3, Lab Counter 1"
        },
        {
          "key": "service_type",
          "label": "Service type",
          "type": "select",
          "required": true,
          "note": "Service this counter handles"
        },
        {
          "key": "assigned_staff",
          "label": "Assigned staff",
          "type": "select",
          "required": true,
          "note": "User currently operating this counter"
        },
        {
          "key": "is_open",
          "label": "Is open",
          "type": "text",
          "required": true,
          "note": "Open or closed status for the day"
        }
      ]
    }
  ],
  "31": [
    {
      "id": "patient_satisfaction_survey",
      "title": "Patient Satisfaction Survey Form",
      "purpose": "Capture and save patient satisfaction survey form data.",
      "fields": [
        {
          "key": "visit_type",
          "label": "Visit type",
          "type": "select",
          "required": true,
          "options": [
            "OPD",
            "Inpatient",
            "Emergency",
            "Telemedicine"
          ],
          "note": "OPD | Inpatient | Emergency | Telemedicine"
        },
        {
          "key": "overall_satisfaction",
          "label": "Overall satisfaction",
          "type": "text",
          "required": true,
          "note": "1 (Very poor) to 5 (Excellent)"
        },
        {
          "key": "staff_attitude",
          "label": "Staff attitude",
          "type": "text",
          "required": false,
          "note": "How staff treated you"
        },
        {
          "key": "cleanliness",
          "label": "Cleanliness",
          "type": "text",
          "required": false,
          "note": "Cleanliness of facility"
        },
        {
          "key": "wait_time",
          "label": "Wait time",
          "type": "text",
          "required": false,
          "note": "How long you waited"
        },
        {
          "key": "explanation_of_condition",
          "label": "Explanation of condition",
          "type": "text",
          "required": false,
          "note": "How well your condition was explained"
        },
        {
          "key": "would_recommend_facility",
          "label": "Would recommend facility",
          "type": "text",
          "required": true,
          "note": "0-10 Net Promoter Score"
        },
        {
          "key": "best_aspect",
          "label": "Best aspect",
          "type": "text",
          "required": false,
          "note": "What you liked most"
        },
        {
          "key": "improvement_suggestion",
          "label": "Improvement suggestion",
          "type": "textarea",
          "required": false,
          "note": "What could be better"
        }
      ]
    },
    {
      "id": "complaint_compliment",
      "title": "Complaint / Compliment Form",
      "purpose": "Capture and save complaint / compliment form data.",
      "fields": [
        {
          "key": "type",
          "label": "Type",
          "type": "select",
          "required": true,
          "options": [
            "Complaint",
            "Compliment",
            "Suggestion"
          ],
          "note": "Complaint | Compliment | Suggestion"
        },
        {
          "key": "department_involved",
          "label": "Department involved",
          "type": "select",
          "required": true,
          "note": "Department the feedback is about"
        },
        {
          "key": "date_of_incident",
          "label": "Date of incident",
          "type": "date",
          "required": false,
          "note": "When the incident occurred if complaint"
        },
        {
          "key": "staff_involved",
          "label": "Staff involved",
          "type": "text",
          "required": false,
          "note": "Name of staff if known - anonymous to them"
        },
        {
          "key": "description",
          "label": "Description",
          "type": "textarea",
          "required": true,
          "note": "Detailed description of the compliment or complaint"
        },
        {
          "key": "preferred_resolution",
          "label": "Preferred resolution",
          "type": "text",
          "required": false,
          "note": "What outcome patient would like if complaint"
        },
        {
          "key": "contact_for_follow_up",
          "label": "Contact for follow-up",
          "type": "select",
          "required": false,
          "options": [
            "Yes - contact me",
            "No - anonymous"
          ],
          "note": "Yes - contact me | No - anonymous"
        }
      ]
    }
  ],
  "34": [
    {
      "id": "integration_configuration",
      "title": "Integration Configuration Form",
      "purpose": "Capture and save integration configuration form data.",
      "fields": [
        {
          "key": "integration_name",
          "label": "Integration name",
          "type": "select",
          "required": true,
          "options": [
            "SHA",
            "KHIS",
            "MPESA",
            "KEMSA",
            "Lab analyser",
            "PACS"
          ],
          "note": "SHA | KHIS | MPESA | KEMSA | Lab analyser | PACS"
        },
        {
          "key": "base_url",
          "label": "Base URL",
          "type": "text",
          "required": true,
          "note": "API base endpoint"
        },
        {
          "key": "authentication_type",
          "label": "Authentication type",
          "type": "select",
          "required": true,
          "options": [
            "Basic",
            "OAuth2",
            "API key",
            "JWT",
            "Certificate"
          ],
          "note": "Basic | OAuth2 | API key | JWT | Certificate"
        },
        {
          "key": "client_id_username",
          "label": "Client ID / Username",
          "type": "text",
          "required": false,
          "note": "Authentication credential"
        },
        {
          "key": "client_secret_password",
          "label": "Client secret / Password",
          "type": "text",
          "required": false,
          "note": "Stored encrypted - never shown after save"
        },
        {
          "key": "message_format",
          "label": "Message format",
          "type": "select",
          "required": true,
          "options": [
            "JSON",
            "XML",
            "HL7 v2",
            "FHIR R4",
            "EDI"
          ],
          "note": "JSON | XML | HL7 v2 | FHIR R4 | EDI"
        },
        {
          "key": "timeout_seconds",
          "label": "Timeout (seconds)",
          "type": "number",
          "required": true,
          "note": "Request timeout"
        },
        {
          "key": "retry_attempts",
          "label": "Retry attempts",
          "type": "number",
          "required": true,
          "note": "Retries on failure"
        }
      ]
    },
    {
      "id": "integration_test",
      "title": "Integration Test Form",
      "purpose": "Capture and save integration test form data.",
      "fields": [
        {
          "key": "integration",
          "label": "Integration",
          "type": "text",
          "required": true,
          "note": "Integration being tested"
        },
        {
          "key": "test_type",
          "label": "Test type",
          "type": "select",
          "required": true,
          "options": [
            "Connectivity ping",
            "Authentication test",
            "Sample transaction"
          ],
          "note": "Connectivity ping | Authentication test | Sample transaction"
        },
        {
          "key": "test_result",
          "label": "Test result",
          "type": "select",
          "required": true,
          "options": [
            "Success",
            "Failed",
            "Timeout - with response time"
          ],
          "note": "Success | Failed | Timeout - with response time"
        }
      ]
    }
  ],
  "36": [
    {
      "id": "triage_assessment",
      "title": "Triage Assessment Form",
      "purpose": "Capture and save triage assessment form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Patient MRN"
        },
        {
          "key": "triage_level",
          "label": "Triage level",
          "type": "select",
          "required": true,
          "options": [
            "1-Immediate",
            "2-Urgent",
            "3-Semi-urgent",
            "4-Non-urgent"
          ],
          "note": "1-Immediate | 2-Urgent | 3-Semi-urgent | 4-Non-urgent"
        },
        {
          "key": "chief_complaint",
          "label": "Chief complaint",
          "type": "text",
          "required": true,
          "note": "Primary presenting complaint"
        },
        {
          "key": "temperature_c",
          "label": "Temperature (°C)",
          "type": "number",
          "required": true,
          "note": "Axillary or oral temperature"
        },
        {
          "key": "pulse_bpm",
          "label": "Pulse (bpm)",
          "type": "number",
          "required": true,
          "note": "Heart rate in beats per minute"
        },
        {
          "key": "blood_pressure",
          "label": "Blood pressure",
          "type": "text",
          "required": true,
          "note": "Systolic/Diastolic e.g. 120/80"
        },
        {
          "key": "respiratory_rate",
          "label": "Respiratory rate",
          "type": "number",
          "required": true,
          "note": "Breaths per minute"
        },
        {
          "key": "spo2",
          "label": "SpO2 (%)",
          "type": "number",
          "required": true,
          "note": "Oxygen saturation"
        },
        {
          "key": "weight_kg",
          "label": "Weight (kg)",
          "type": "number",
          "required": false,
          "note": "Current body weight"
        },
        {
          "key": "height_cm",
          "label": "Height (cm)",
          "type": "number",
          "required": false,
          "note": "Current height for BMI"
        },
        {
          "key": "pain_score",
          "label": "Pain score",
          "type": "text",
          "required": true,
          "note": "0-10 numeric pain rating scale"
        },
        {
          "key": "blood_glucose_mmol_l",
          "label": "Blood glucose (mmol/L)",
          "type": "number",
          "required": false,
          "note": "Bedside glucose if indicated"
        },
        {
          "key": "pregnancy_status",
          "label": "Pregnancy status",
          "type": "select",
          "required": false,
          "note": "For females of reproductive age"
        },
        {
          "key": "weeks_gestation",
          "label": "Weeks gestation",
          "type": "number",
          "required": false,
          "note": "If pregnant - gestation in weeks"
        },
        {
          "key": "allergies_confirmed",
          "label": "Allergies confirmed",
          "type": "checkbox",
          "required": true,
          "note": "Tick to confirm allergy status checked"
        }
      ]
    },
    {
      "id": "opd_consultation",
      "title": "OPD Consultation Form",
      "purpose": "Capture and save opd consultation form data.",
      "fields": [
        {
          "key": "chief_complaint",
          "label": "Chief complaint",
          "type": "text",
          "required": true,
          "note": "Main reason for visit in patient's words"
        },
        {
          "key": "history_of_presenting_illness",
          "label": "History of presenting illness",
          "type": "textarea",
          "required": true,
          "note": "Detailed narrative - onset, duration, character, severity"
        },
        {
          "key": "past_medical_history",
          "label": "Past medical history",
          "type": "textarea",
          "required": false,
          "note": "Previous diagnoses and hospitalisations"
        },
        {
          "key": "past_surgical_history",
          "label": "Past surgical history",
          "type": "textarea",
          "required": false,
          "note": "Previous operations"
        },
        {
          "key": "family_history",
          "label": "Family history",
          "type": "textarea",
          "required": false,
          "note": "Relevant family medical conditions"
        },
        {
          "key": "social_history",
          "label": "Social history",
          "type": "textarea",
          "required": false,
          "note": "Smoking, alcohol, occupation, living situation"
        },
        {
          "key": "review_of_systems",
          "label": "Review of systems",
          "type": "checkbox",
          "required": false,
          "note": "Systematic inquiry per body system"
        },
        {
          "key": "general_examination",
          "label": "General examination",
          "type": "textarea",
          "required": true,
          "note": "General appearance and overall impression"
        },
        {
          "key": "systemic_examination",
          "label": "Systemic examination",
          "type": "textarea",
          "required": true,
          "note": "Per-system examination findings"
        },
        {
          "key": "working_diagnosis",
          "label": "Working diagnosis",
          "type": "text",
          "required": true,
          "note": "ICD-10 coded diagnosis - searchable"
        },
        {
          "key": "additional_diagnoses",
          "label": "Additional diagnoses",
          "type": "text",
          "required": false,
          "note": "Secondary or differential diagnoses"
        },
        {
          "key": "management_plan",
          "label": "Management plan",
          "type": "textarea",
          "required": true,
          "note": "Treatment decisions and clinical instructions"
        },
        {
          "key": "follow_up_instructions",
          "label": "Follow-up instructions",
          "type": "text",
          "required": false,
          "note": "When and where to return"
        },
        {
          "key": "referral_needed",
          "label": "Referral needed",
          "type": "checkbox",
          "required": false,
          "note": "Tick to open referral form"
        }
      ]
    },
    {
      "id": "opd_referral",
      "title": "OPD Referral Form",
      "purpose": "Capture and save opd referral form data.",
      "fields": [
        {
          "key": "referred_to_department",
          "label": "Referred to department",
          "type": "select",
          "required": true,
          "note": "Internal specialist department"
        },
        {
          "key": "referred_to_doctor",
          "label": "Referred to doctor",
          "type": "select",
          "required": false,
          "note": "Specific doctor if known"
        },
        {
          "key": "reason_for_referral",
          "label": "Reason for referral",
          "type": "textarea",
          "required": true,
          "note": "Clinical justification and specific questions"
        },
        {
          "key": "urgency",
          "label": "Urgency",
          "type": "select",
          "required": true,
          "options": [
            "Routine",
            "Urgent",
            "Emergency"
          ],
          "note": "Routine | Urgent | Emergency"
        },
        {
          "key": "clinical_summary",
          "label": "Clinical summary",
          "type": "textarea",
          "required": true,
          "note": "Relevant history, findings, and treatment to date"
        }
      ]
    }
  ],
  "37": [
    {
      "id": "pregnancy_registration",
      "title": "Pregnancy Registration Form",
      "purpose": "Capture and save pregnancy registration form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from patient registration"
        },
        {
          "key": "last_menstrual_period_lmp",
          "label": "Last menstrual period (LMP)",
          "type": "date",
          "required": true,
          "note": "First day of last normal period"
        },
        {
          "key": "edd_by_lmp",
          "label": "EDD by LMP",
          "type": "text",
          "required": true,
          "note": "Auto-calculated using Naegele's rule"
        },
        {
          "key": "gravida",
          "label": "Gravida",
          "type": "number",
          "required": true,
          "note": "Total number of pregnancies including current"
        },
        {
          "key": "para",
          "label": "Para",
          "type": "number",
          "required": true,
          "note": "Previous deliveries at or after 20 weeks"
        },
        {
          "key": "previous_caesarean_sections",
          "label": "Previous Caesarean sections",
          "type": "number",
          "required": false,
          "note": "Number of previous CS"
        },
        {
          "key": "previous_losses",
          "label": "Previous losses",
          "type": "number",
          "required": false,
          "note": "Miscarriages, stillbirths, ectopic pregnancies"
        },
        {
          "key": "blood_group",
          "label": "Blood group",
          "type": "select",
          "required": false,
          "note": "ABO and Rh - confirm in this pregnancy"
        },
        {
          "key": "high_risk_factors",
          "label": "High risk factors",
          "type": "checkbox",
          "required": false,
          "note": "Hypertension | Diabetes | Multiple pregnancy | Previous CS | Others"
        }
      ]
    },
    {
      "id": "anc_visit",
      "title": "ANC Visit Form",
      "purpose": "Capture and save anc visit form data.",
      "fields": [
        {
          "key": "visit_number",
          "label": "Visit number",
          "type": "text",
          "required": true,
          "note": "Sequential ANC visit count"
        },
        {
          "key": "gestation_weeks",
          "label": "Gestation (weeks)",
          "type": "number",
          "required": true,
          "note": "Gestational age at this visit"
        },
        {
          "key": "weight_kg",
          "label": "Weight (kg)",
          "type": "number",
          "required": true,
          "note": "Maternal weight"
        },
        {
          "key": "blood_pressure",
          "label": "Blood pressure",
          "type": "text",
          "required": true,
          "note": "Systolic/Diastolic"
        },
        {
          "key": "fundal_height_cm",
          "label": "Fundal height (cm)",
          "type": "number",
          "required": true,
          "note": "Symphysis-fundus measurement"
        },
        {
          "key": "fetal_heart_rate_bpm",
          "label": "Fetal heart rate (bpm)",
          "type": "number",
          "required": true,
          "note": "Fetal heart rate"
        },
        {
          "key": "fetal_presentation",
          "label": "Fetal presentation",
          "type": "select",
          "required": true,
          "options": [
            "Cephalic",
            "Breech",
            "Transverse",
            "Oblique"
          ],
          "note": "Cephalic | Breech | Transverse | Oblique"
        },
        {
          "key": "fetal_movements",
          "label": "Fetal movements",
          "type": "select",
          "required": true,
          "options": [
            "Present",
            "Absent",
            "Reduced"
          ],
          "note": "Present | Absent | Reduced"
        },
        {
          "key": "oedema",
          "label": "Oedema",
          "type": "select",
          "required": true,
          "options": [
            "None",
            "Mild",
            "Moderate",
            "Severe"
          ],
          "note": "None | Mild | Moderate | Severe"
        },
        {
          "key": "urine_protein",
          "label": "Urine protein",
          "type": "select",
          "required": true,
          "options": [
            "Nil",
            "Trace",
            "1+",
            "2+",
            "3+"
          ],
          "note": "Nil | Trace | 1+ | 2+ | 3+"
        },
        {
          "key": "haemoglobin_g_dl",
          "label": "Haemoglobin (g/dL)",
          "type": "number",
          "required": true,
          "note": "Haemoglobin level"
        },
        {
          "key": "hiv_status",
          "label": "HIV status",
          "type": "select",
          "required": true,
          "options": [
            "Positive",
            "Negative",
            "Unknown",
            "Declined"
          ],
          "note": "Positive | Negative | Unknown | Declined"
        },
        {
          "key": "malaria_test",
          "label": "Malaria test",
          "type": "select",
          "required": false,
          "options": [
            "Positive",
            "Negative"
          ],
          "note": "Positive | Negative"
        },
        {
          "key": "syphilis_test",
          "label": "Syphilis test",
          "type": "select",
          "required": false,
          "options": [
            "Reactive",
            "Non-reactive"
          ],
          "note": "Reactive | Non-reactive"
        },
        {
          "key": "tetanus_dose_given",
          "label": "Tetanus dose given",
          "type": "select",
          "required": false,
          "note": "TT dose number 1-5"
        },
        {
          "key": "iron_folate_given",
          "label": "Iron-folate given",
          "type": "checkbox",
          "required": false,
          "note": "Tick if iron-folate tablets dispensed"
        },
        {
          "key": "ipt_given",
          "label": "IPT given",
          "type": "checkbox",
          "required": false,
          "note": "Intermittent preventive treatment for malaria"
        },
        {
          "key": "llin_given",
          "label": "LLIN given",
          "type": "checkbox",
          "required": false,
          "note": "Long-lasting insecticide net issued"
        },
        {
          "key": "counselling_topics",
          "label": "Counselling topics",
          "type": "checkbox",
          "required": false,
          "note": "Birth plan | Danger signs | Breastfeeding | FP"
        },
        {
          "key": "next_visit_date",
          "label": "Next visit date",
          "type": "date",
          "required": true,
          "note": "Date of next scheduled ANC"
        }
      ]
    },
    {
      "id": "delivery_birth_record",
      "title": "Delivery / Birth Record Form",
      "purpose": "Capture and save delivery / birth record form data.",
      "fields": [
        {
          "key": "gestation_at_delivery",
          "label": "Gestation at delivery",
          "type": "number",
          "required": true,
          "note": "Weeks at time of delivery"
        },
        {
          "key": "onset_of_labour",
          "label": "Onset of labour",
          "type": "select",
          "required": true,
          "options": [
            "Spontaneous",
            "Induced",
            "Elective CS",
            "Emergency CS"
          ],
          "note": "Spontaneous | Induced | Elective CS | Emergency CS"
        },
        {
          "key": "labour_duration_hours",
          "label": "Labour duration (hours)",
          "type": "number",
          "required": true,
          "note": "Total duration of active labour"
        },
        {
          "key": "delivery_mode",
          "label": "Delivery mode",
          "type": "select",
          "required": true,
          "options": [
            "SVD",
            "Assisted vaginal",
            "CS emergency",
            "CS elective"
          ],
          "note": "SVD | Assisted vaginal | CS emergency | CS elective"
        },
        {
          "key": "cs_indication",
          "label": "CS indication",
          "type": "text",
          "required": false,
          "note": "Mandatory if caesarean section"
        },
        {
          "key": "anaesthesia_type",
          "label": "Anaesthesia type",
          "type": "select",
          "required": false,
          "options": [
            "General",
            "Spinal",
            "Epidural - for operative deliveries"
          ],
          "note": "General | Spinal | Epidural - for operative deliveries"
        },
        {
          "key": "estimated_blood_loss_ml",
          "label": "Estimated blood loss (mL)",
          "type": "number",
          "required": true,
          "note": "Blood loss during delivery"
        },
        {
          "key": "oxytocin_given",
          "label": "Oxytocin given",
          "type": "checkbox",
          "required": true,
          "note": "Active management of third stage"
        },
        {
          "key": "perineal_trauma",
          "label": "Perineal trauma",
          "type": "select",
          "required": true,
          "options": [
            "Intact",
            "Abrasion",
            "Degree 1-4",
            "Episiotomy"
          ],
          "note": "Intact | Abrasion | Degree 1-4 | Episiotomy"
        },
        {
          "key": "placenta_delivery",
          "label": "Placenta delivery",
          "type": "select",
          "required": true,
          "options": [
            "Spontaneous",
            "Manual",
            "Retained"
          ],
          "note": "Spontaneous | Manual | Retained"
        },
        {
          "key": "placenta_complete",
          "label": "Placenta complete",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No - checked on examination"
          ],
          "note": "Yes | No - checked on examination"
        },
        {
          "key": "complications",
          "label": "Complications",
          "type": "textarea",
          "required": false,
          "note": "PPH, cord prolapse, shoulder dystocia, other"
        },
        {
          "key": "delivered_by",
          "label": "Delivered by",
          "type": "text",
          "required": true,
          "note": "Auto-filled - logged in midwife/doctor"
        }
      ]
    },
    {
      "id": "newborn_assessment",
      "title": "Newborn Assessment Form",
      "purpose": "Capture and save newborn assessment form data.",
      "fields": [
        {
          "key": "birth_order",
          "label": "Birth order",
          "type": "number",
          "required": true,
          "note": "1 for singleton, 1 or 2 for twins"
        },
        {
          "key": "sex",
          "label": "Sex",
          "type": "select",
          "required": true,
          "options": [
            "Male",
            "Female",
            "Indeterminate"
          ],
          "note": "Male | Female | Indeterminate"
        },
        {
          "key": "birth_weight_grams",
          "label": "Birth weight (grams)",
          "type": "number",
          "required": true,
          "note": "Weight immediately after delivery"
        },
        {
          "key": "birth_length_cm",
          "label": "Birth length (cm)",
          "type": "number",
          "required": false,
          "note": "Crown-heel length"
        },
        {
          "key": "head_circumference_cm",
          "label": "Head circumference (cm)",
          "type": "number",
          "required": false,
          "note": "Occipitofrontal circumference"
        },
        {
          "key": "apgar_at_1_minute",
          "label": "APGAR at 1 minute",
          "type": "number",
          "required": true,
          "note": "APGAR score 0-10"
        },
        {
          "key": "apgar_at_5_minutes",
          "label": "APGAR at 5 minutes",
          "type": "number",
          "required": true,
          "note": "APGAR score 0-10"
        },
        {
          "key": "apgar_at_10_minutes",
          "label": "APGAR at 10 minutes",
          "type": "number",
          "required": false,
          "note": "If 6 at 5 minutes"
        },
        {
          "key": "resuscitation_needed",
          "label": "Resuscitation needed",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "resuscitation_type",
          "label": "Resuscitation type",
          "type": "select",
          "required": false,
          "options": [
            "Stimulation",
            "Bag-mask",
            "Intubation",
            "CPR"
          ],
          "note": "Stimulation | Bag-mask | Intubation | CPR"
        },
        {
          "key": "birth_outcome",
          "label": "Birth outcome",
          "type": "select",
          "required": true,
          "options": [
            "Alive",
            "Fresh stillbirth",
            "Macerated stillbirth"
          ],
          "note": "Alive | Fresh stillbirth | Macerated stillbirth"
        },
        {
          "key": "birth_defects",
          "label": "Birth defects",
          "type": "textarea",
          "required": false,
          "note": "Congenital abnormalities if any"
        },
        {
          "key": "vitamin_k_given",
          "label": "Vitamin K given",
          "type": "checkbox",
          "required": true,
          "note": "IM Vitamin K 1mg given"
        },
        {
          "key": "eye_prophylaxis",
          "label": "Eye prophylaxis",
          "type": "checkbox",
          "required": true,
          "note": "Tetracycline eye ointment applied"
        },
        {
          "key": "bcg_given",
          "label": "BCG given",
          "type": "checkbox",
          "required": true,
          "note": "BCG vaccine administered at birth"
        },
        {
          "key": "opv0_given",
          "label": "OPV0 given",
          "type": "checkbox",
          "required": true,
          "note": "Oral polio vaccine birth dose"
        },
        {
          "key": "admitted_to_nicu",
          "label": "Admitted to NICU",
          "type": "checkbox",
          "required": false,
          "note": "Tick if baby needs NICU admission"
        }
      ]
    },
    {
      "id": "partograph",
      "title": "Partograph Form",
      "purpose": "Capture and save partograph form data.",
      "fields": [
        {
          "key": "labour_start_time",
          "label": "Labour start time",
          "type": "datetime-local",
          "required": true,
          "note": "Time active labour began"
        },
        {
          "key": "membranes_status",
          "label": "Membranes status",
          "type": "select",
          "required": true,
          "options": [
            "Intact",
            "Ruptured spontaneous",
            "Ruptured artificial"
          ],
          "note": "Intact | Ruptured spontaneous | Ruptured artificial"
        },
        {
          "key": "time_of_rom",
          "label": "Time of ROM",
          "type": "datetime-local",
          "required": false,
          "note": "Time of rupture of membranes"
        },
        {
          "key": "liquor_colour",
          "label": "Liquor colour",
          "type": "select",
          "required": false,
          "options": [
            "Clear",
            "Thin meconium",
            "Thick meconium",
            "Blood-stained"
          ],
          "note": "Clear | Thin meconium | Thick meconium | Blood-stained"
        },
        {
          "key": "cervical_dilation_cm",
          "label": "Cervical dilation (cm)",
          "type": "number",
          "required": true,
          "note": "Plotted every 4 hours - 0-10 cm"
        },
        {
          "key": "fetal_head_station",
          "label": "Fetal head station",
          "type": "select",
          "required": true,
          "options": [
            "-3",
            "-2",
            "-1",
            "0",
            "+1",
            "+2",
            "+3"
          ],
          "note": "-3 | -2 | -1 | 0 | +1 | +2 | +3"
        },
        {
          "key": "fetal_heart_rate",
          "label": "Fetal heart rate",
          "type": "number",
          "required": true,
          "note": "Every 30 minutes - normal 110-160 bpm"
        },
        {
          "key": "contractions_per_10_min",
          "label": "Contractions per 10 min",
          "type": "number",
          "required": true,
          "note": "Frequency of uterine contractions"
        },
        {
          "key": "contraction_duration_sec",
          "label": "Contraction duration (sec)",
          "type": "number",
          "required": true,
          "note": "Duration of each contraction"
        },
        {
          "key": "alert_line_crossed",
          "label": "Alert line crossed",
          "type": "text",
          "required": true,
          "note": "System flags if progress crosses alert line"
        },
        {
          "key": "action_line_crossed",
          "label": "Action line crossed",
          "type": "text",
          "required": true,
          "note": "System flags if progress crosses action line"
        }
      ]
    }
  ],
  "38": [
    {
      "id": "icu_admission_assessment",
      "title": "ICU Admission Assessment Form",
      "purpose": "Capture and save icu admission assessment form data.",
      "fields": [
        {
          "key": "admission_diagnosis",
          "label": "Admission diagnosis",
          "type": "text",
          "required": true,
          "note": "Primary reason for ICU admission"
        },
        {
          "key": "apache_ii_score",
          "label": "APACHE II score",
          "type": "text",
          "required": true,
          "note": "Calculated from vitals and labs - predictive mortality score"
        },
        {
          "key": "sofa_score",
          "label": "SOFA score",
          "type": "text",
          "required": true,
          "note": "Sequential Organ Failure Assessment score"
        },
        {
          "key": "admission_source",
          "label": "Admission source",
          "type": "select",
          "required": true,
          "options": [
            "Ward",
            "Emergency",
            "Theatre",
            "Direct",
            "Transfer"
          ],
          "note": "Ward | Emergency | Theatre | Direct | Transfer"
        },
        {
          "key": "code_status",
          "label": "Code status",
          "type": "select",
          "required": true,
          "options": [
            "Full resuscitation",
            "DNR - must be documented"
          ],
          "note": "Full resuscitation | DNR - must be documented"
        },
        {
          "key": "ventilated",
          "label": "Ventilated",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "vasopressors",
          "label": "Vasopressors",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "renal_replacement",
          "label": "Renal replacement",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "current_medications",
          "label": "Current medications",
          "type": "text",
          "required": true,
          "note": "All current medications"
        },
        {
          "key": "allergies",
          "label": "Allergies",
          "type": "text",
          "required": true,
          "note": "From patient allergy record"
        },
        {
          "key": "informed_consent_for_icu",
          "label": "Informed consent for ICU",
          "type": "checkbox",
          "required": true,
          "note": "Family/guardian consent for ICU admission"
        }
      ]
    },
    {
      "id": "icu_daily_assessment",
      "title": "ICU Daily Assessment Form",
      "purpose": "Capture and save icu daily assessment form data.",
      "fields": [
        {
          "key": "assessment_date",
          "label": "Assessment date",
          "type": "date",
          "required": true,
          "note": "Date of daily ICU round"
        },
        {
          "key": "rass_score",
          "label": "RASS score",
          "type": "select",
          "required": true,
          "note": "-5 Unarousable to +4 Combative"
        },
        {
          "key": "cam_icu",
          "label": "CAM-ICU",
          "type": "select",
          "required": true,
          "options": [
            "Positive",
            "Negative - delirium screen"
          ],
          "note": "Positive | Negative - delirium screen"
        },
        {
          "key": "pain_score_cpot",
          "label": "Pain score (CPOT)",
          "type": "text",
          "required": true,
          "note": "Critical Care Pain Observation Tool 0-8"
        },
        {
          "key": "ventilator_mode",
          "label": "Ventilator mode",
          "type": "select",
          "required": false,
          "options": [
            "VC-AC",
            "PC-AC",
            "SIMV",
            "CPAP",
            "SPONT"
          ],
          "note": "VC-AC | PC-AC | SIMV | CPAP | SPONT"
        },
        {
          "key": "fio2",
          "label": "FiO2 (%)",
          "type": "number",
          "required": false,
          "note": "Fraction of inspired oxygen"
        },
        {
          "key": "peep_cmh2o",
          "label": "PEEP (cmH2O)",
          "type": "number",
          "required": false,
          "note": "Positive end-expiratory pressure"
        },
        {
          "key": "vasopressors",
          "label": "Vasopressors",
          "type": "text",
          "required": false,
          "note": "Vasopressor drugs and infusion rates"
        },
        {
          "key": "fluid_balance_ml",
          "label": "Fluid balance (mL)",
          "type": "text",
          "required": true,
          "note": "Calculated from fluid balance chart"
        },
        {
          "key": "nutrition_route",
          "label": "Nutrition route",
          "type": "select",
          "required": true,
          "options": [
            "Oral",
            "NG tube",
            "PEG",
            "TPN",
            "Nil"
          ],
          "note": "Oral | NG tube | PEG | TPN | Nil"
        },
        {
          "key": "daily_icu_goals",
          "label": "Daily ICU goals",
          "type": "textarea",
          "required": true,
          "note": "Goals set by consultant for the day"
        },
        {
          "key": "sat_performed",
          "label": "SAT performed",
          "type": "checkbox",
          "required": false,
          "note": "Spontaneous awakening trial done"
        },
        {
          "key": "sbt_performed",
          "label": "SBT performed",
          "type": "checkbox",
          "required": false,
          "note": "Spontaneous breathing trial done"
        }
      ]
    },
    {
      "id": "ventilator_record",
      "title": "Ventilator Record Form",
      "purpose": "Capture and save ventilator record form data.",
      "fields": [
        {
          "key": "recording_time",
          "label": "Recording time",
          "type": "datetime-local",
          "required": true,
          "note": "Hourly recording"
        },
        {
          "key": "mode",
          "label": "Mode",
          "type": "select",
          "required": true,
          "options": [
            "VC-AC",
            "PC-AC",
            "SIMV",
            "PRVC",
            "CPAP",
            "HFNC",
            "BiPAP"
          ],
          "note": "VC-AC | PC-AC | SIMV | PRVC | CPAP | HFNC | BiPAP"
        },
        {
          "key": "fio2",
          "label": "FiO2 (%)",
          "type": "number",
          "required": true,
          "note": "21-100%"
        },
        {
          "key": "tidal_volume_ml",
          "label": "Tidal volume (mL)",
          "type": "number",
          "required": false,
          "note": "Set tidal volume"
        },
        {
          "key": "set_rate_bpm",
          "label": "Set rate (bpm)",
          "type": "number",
          "required": false,
          "note": "Set respiratory rate"
        },
        {
          "key": "total_rate_bpm",
          "label": "Total rate (bpm)",
          "type": "number",
          "required": true,
          "note": "Total rate including spontaneous breaths"
        },
        {
          "key": "peep_cmh2o",
          "label": "PEEP (cmH2O)",
          "type": "number",
          "required": true,
          "note": "Set PEEP"
        },
        {
          "key": "peak_inspiratory_pressure",
          "label": "Peak inspiratory pressure",
          "type": "number",
          "required": true,
          "note": "PIP in cmH2O"
        },
        {
          "key": "plateau_pressure",
          "label": "Plateau pressure",
          "type": "number",
          "required": false,
          "note": "Pplat - must remain below 30 cmH2O"
        },
        {
          "key": "spo2",
          "label": "SpO2 (%)",
          "type": "number",
          "required": true,
          "note": "Oxygen saturation"
        },
        {
          "key": "etco2_mmhg",
          "label": "EtCO2 (mmHg)",
          "type": "number",
          "required": false,
          "note": "End-tidal CO2"
        }
      ]
    }
  ],
  "39": [
    {
      "id": "journal_entry",
      "title": "Journal Entry Form",
      "purpose": "Capture and save journal entry form data.",
      "fields": [
        {
          "key": "entry_date",
          "label": "Entry date",
          "type": "date",
          "required": true,
          "note": "Accounting date - must be within open period"
        },
        {
          "key": "description",
          "label": "Description",
          "type": "text",
          "required": true,
          "note": "What this journal records"
        },
        {
          "key": "source_module",
          "label": "Source module",
          "type": "select",
          "required": true,
          "options": [
            "Billing",
            "Payroll",
            "Inventory",
            "Manual"
          ],
          "note": "Billing | Payroll | Inventory | Manual"
        },
        {
          "key": "debit_account",
          "label": "Debit account",
          "type": "text",
          "required": true,
          "note": "Account being debited"
        },
        {
          "key": "debit_amount_kes",
          "label": "Debit amount (KES)",
          "type": "number",
          "required": true,
          "note": "Debit amount"
        },
        {
          "key": "credit_account",
          "label": "Credit account",
          "type": "text",
          "required": true,
          "note": "Account being credited"
        },
        {
          "key": "credit_amount_kes",
          "label": "Credit amount (KES)",
          "type": "number",
          "required": true,
          "note": "Credit amount - must equal debit"
        },
        {
          "key": "cost_centre",
          "label": "Cost centre",
          "type": "select",
          "required": false,
          "note": "Departmental cost centre for allocation"
        }
      ]
    },
    {
      "id": "chart_of_accounts",
      "title": "Chart of Accounts Form",
      "purpose": "Capture and save chart of accounts form data.",
      "fields": [
        {
          "key": "account_code",
          "label": "Account code",
          "type": "text",
          "required": true,
          "note": "Unique account code e.g. 1100, 4200"
        },
        {
          "key": "account_name",
          "label": "Account name",
          "type": "text",
          "required": true,
          "note": "Descriptive account name"
        },
        {
          "key": "account_type",
          "label": "Account type",
          "type": "select",
          "required": true,
          "options": [
            "Asset",
            "Liability",
            "Equity",
            "Revenue",
            "Expense"
          ],
          "note": "Asset | Liability | Equity | Revenue | Expense"
        },
        {
          "key": "sub_type",
          "label": "Sub-type",
          "type": "select",
          "required": false,
          "options": [
            "Current asset",
            "Fixed asset",
            "Current liability",
            "etc."
          ],
          "note": "Current asset | Fixed asset | Current liability | etc."
        },
        {
          "key": "parent_account",
          "label": "Parent account",
          "type": "select",
          "required": false,
          "note": "Parent account for hierarchical reporting"
        },
        {
          "key": "normal_balance",
          "label": "Normal balance",
          "type": "select",
          "required": true,
          "options": [
            "Debit",
            "Credit"
          ],
          "note": "Debit | Credit"
        }
      ]
    },
    {
      "id": "bank_reconciliation",
      "title": "Bank Reconciliation Form",
      "purpose": "Capture and save bank reconciliation form data.",
      "fields": [
        {
          "key": "bank_account",
          "label": "Bank account",
          "type": "select",
          "required": true,
          "note": "Account being reconciled"
        },
        {
          "key": "statement_date",
          "label": "Statement date",
          "type": "date",
          "required": true,
          "note": "Date of bank statement"
        },
        {
          "key": "statement_closing_balance_kes",
          "label": "Statement closing balance (KES)",
          "type": "number",
          "required": true,
          "note": "Balance per bank statement"
        },
        {
          "key": "book_closing_balance_kes",
          "label": "Book closing balance (KES)",
          "type": "text",
          "required": true,
          "note": "Balance per general ledger"
        },
        {
          "key": "outstanding_deposits",
          "label": "Outstanding deposits",
          "type": "number",
          "required": true,
          "note": "Deposits recorded in books but not on statement"
        },
        {
          "key": "outstanding_cheques",
          "label": "Outstanding cheques",
          "type": "number",
          "required": true,
          "note": "Cheques issued but not yet cleared"
        },
        {
          "key": "bank_errors",
          "label": "Bank errors",
          "type": "number",
          "required": false,
          "note": "Errors on bank statement"
        },
        {
          "key": "book_errors",
          "label": "Book errors",
          "type": "number",
          "required": false,
          "note": "Errors in books requiring correction"
        }
      ]
    }
  ],
  "40": [
    {
      "id": "staffing_forecast",
      "title": "Staffing Forecast Form",
      "purpose": "Capture and save staffing forecast form data.",
      "fields": [
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Department being forecasted"
        },
        {
          "key": "forecast_period",
          "label": "Forecast period",
          "type": "text",
          "required": true,
          "note": "Month being forecasted"
        },
        {
          "key": "forecast_horizon_months",
          "label": "Forecast horizon (months)",
          "type": "number",
          "required": true,
          "note": "How many months ahead e.g. 3 | 6 | 12"
        },
        {
          "key": "expected_patient_volume",
          "label": "Expected patient volume",
          "type": "number",
          "required": true,
          "note": "Predicted patient encounters or bed-days"
        },
        {
          "key": "required_staffing_by_cadre",
          "label": "Required staffing by cadre",
          "type": "select",
          "required": true,
          "options": [
            "Doctors",
            "Nurses",
            "Technicians",
            "Admin - required count"
          ],
          "note": "Doctors | Nurses | Technicians | Admin - required count"
        },
        {
          "key": "current_staffing_by_cadre",
          "label": "Current staffing by cadre",
          "type": "text",
          "required": true,
          "note": "Auto-pulled from HR active headcount"
        },
        {
          "key": "forecast_model",
          "label": "Forecast model",
          "type": "select",
          "required": true,
          "options": [
            "Historical trend",
            "Acuity-based",
            "AI forecast"
          ],
          "note": "Historical trend | Acuity-based | AI forecast"
        },
        {
          "key": "recommendations",
          "label": "Recommendations",
          "type": "textarea",
          "required": true,
          "note": "Recruitment, redeployment, or training recommendations"
        }
      ]
    }
  ],
  "41": [
    {
      "id": "security_incident_report",
      "title": "Security Incident Report Form",
      "purpose": "Capture and save security incident report form data.",
      "fields": [
        {
          "key": "incident_type",
          "label": "Incident type",
          "type": "select",
          "required": true,
          "options": [
            "Unauthorized access",
            "Malware",
            "Data breach",
            "Phishing",
            "Ransomware",
            "Physical",
            "DDoS"
          ],
          "note": "Unauthorized access | Malware | Data breach | Phishing | Ransomware | Physical | DDoS"
        },
        {
          "key": "severity",
          "label": "Severity",
          "type": "select",
          "required": true,
          "options": [
            "Low",
            "Medium",
            "High",
            "Critical"
          ],
          "note": "Low | Medium | High | Critical"
        },
        {
          "key": "date_time_detected",
          "label": "Date/time detected",
          "type": "datetime-local",
          "required": true,
          "note": "When the incident was first detected"
        },
        {
          "key": "affected_systems",
          "label": "Affected systems",
          "type": "text",
          "required": true,
          "note": "List of affected servers, modules, or users"
        },
        {
          "key": "description",
          "label": "Description",
          "type": "textarea",
          "required": true,
          "note": "Detailed incident description"
        },
        {
          "key": "immediate_actions_taken",
          "label": "Immediate actions taken",
          "type": "textarea",
          "required": true,
          "note": "Containment steps already taken"
        },
        {
          "key": "data_compromised",
          "label": "Data compromised",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No",
            "Unknown"
          ],
          "note": "Yes | No | Unknown"
        },
        {
          "key": "patient_data_affected",
          "label": "Patient data affected",
          "type": "select",
          "required": false,
          "options": [
            "Yes",
            "No - triggers DPA notification if Yes"
          ],
          "note": "Yes | No - triggers DPA notification if Yes"
        },
        {
          "key": "odpc_notification_required",
          "label": "ODPC notification required",
          "type": "checkbox",
          "required": false,
          "note": "Auto-checked if patient data was compromised"
        }
      ]
    },
    {
      "id": "system_configuration_change",
      "title": "System Configuration Change Form",
      "purpose": "Capture and save system configuration change form data.",
      "fields": [
        {
          "key": "change_type",
          "label": "Change type",
          "type": "select",
          "required": true,
          "options": [
            "Server config",
            "Network",
            "Firewall",
            "User access",
            "Software update"
          ],
          "note": "Server config | Network | Firewall | User access | Software update"
        },
        {
          "key": "description",
          "label": "Description",
          "type": "textarea",
          "required": true,
          "note": "What change is being made"
        },
        {
          "key": "justification",
          "label": "Justification",
          "type": "textarea",
          "required": true,
          "note": "Business or security reason"
        },
        {
          "key": "risk_assessment",
          "label": "Risk assessment",
          "type": "select",
          "required": true,
          "options": [
            "Low",
            "Medium",
            "High - risk of this change"
          ],
          "note": "Low | Medium | High - risk of this change"
        },
        {
          "key": "rollback_plan",
          "label": "Rollback plan",
          "type": "textarea",
          "required": true,
          "note": "How to undo if change causes problems"
        },
        {
          "key": "change_window",
          "label": "Change window",
          "type": "datetime-local",
          "required": true,
          "note": "When the change will be implemented"
        },
        {
          "key": "approved_by",
          "label": "Approved by",
          "type": "select",
          "required": true,
          "note": "IT manager or CTO"
        }
      ]
    }
  ],
  "42": [
    {
      "id": "duty_roster",
      "title": "Duty Roster Form",
      "purpose": "Capture and save duty roster form data.",
      "fields": [
        {
          "key": "ward",
          "label": "Ward",
          "type": "select",
          "required": true,
          "note": "Ward being rostered"
        },
        {
          "key": "month",
          "label": "Month",
          "type": "text",
          "required": true,
          "note": "Roster month"
        },
        {
          "key": "staff_member",
          "label": "Staff member",
          "type": "select",
          "required": true,
          "note": "Nurse being scheduled"
        },
        {
          "key": "shift_date",
          "label": "Shift date",
          "type": "date",
          "required": true,
          "note": "Date of duty"
        },
        {
          "key": "shift_type",
          "label": "Shift type",
          "type": "select",
          "required": true,
          "options": [
            "Day",
            "Night",
            "Evening",
            "Split",
            "On-call"
          ],
          "note": "Day | Night | Evening | Split | On-call"
        },
        {
          "key": "start_time",
          "label": "Start time",
          "type": "time",
          "required": true,
          "note": "Shift start"
        },
        {
          "key": "end_time",
          "label": "End time",
          "type": "time",
          "required": true,
          "note": "Shift end"
        },
        {
          "key": "notes",
          "label": "Notes",
          "type": "text",
          "required": false,
          "note": "Swap notes or special instructions"
        }
      ]
    },
    {
      "id": "nursing_competency_assessment",
      "title": "Nursing Competency Assessment Form",
      "purpose": "Capture and save nursing competency assessment form data.",
      "fields": [
        {
          "key": "staff_member",
          "label": "Staff member",
          "type": "select",
          "required": true,
          "note": "Nurse being assessed"
        },
        {
          "key": "competency",
          "label": "Competency",
          "type": "text",
          "required": true,
          "note": "Skill being assessed e.g. IV Cannulation"
        },
        {
          "key": "assessment_date",
          "label": "Assessment date",
          "type": "date",
          "required": true,
          "note": "Date of assessment"
        },
        {
          "key": "assessment_method",
          "label": "Assessment method",
          "type": "select",
          "required": true,
          "options": [
            "Direct observation",
            "Simulation",
            "Written test"
          ],
          "note": "Direct observation | Simulation | Written test"
        },
        {
          "key": "result",
          "label": "Result",
          "type": "select",
          "required": true,
          "options": [
            "Competent",
            "Not yet competent",
            "Requires supervision"
          ],
          "note": "Competent | Not yet competent | Requires supervision"
        },
        {
          "key": "assessor_notes",
          "label": "Assessor notes",
          "type": "textarea",
          "required": false,
          "note": "Observations during assessment"
        },
        {
          "key": "expiry_date",
          "label": "Expiry date",
          "type": "date",
          "required": true,
          "note": "When reassessment is required"
        }
      ]
    }
  ],
  "44": [
    {
      "id": "denial_management",
      "title": "Denial Management Form",
      "purpose": "Capture and save denial management form data.",
      "fields": [
        {
          "key": "denied_claim",
          "label": "Denied claim",
          "type": "text",
          "required": true,
          "note": "Reference to denied claim"
        },
        {
          "key": "denial_category",
          "label": "Denial category",
          "type": "select",
          "required": true,
          "options": [
            "Eligibility",
            "Pre-auth",
            "Medical necessity",
            "Coding",
            "Timely filing",
            "Documentation"
          ],
          "note": "Eligibility | Pre-auth | Medical necessity | Coding | Timely filing | Documentation"
        },
        {
          "key": "denial_amount_kes",
          "label": "Denial amount (KES)",
          "type": "text",
          "required": true,
          "note": "Amount denied"
        },
        {
          "key": "appeal_decision",
          "label": "Appeal decision",
          "type": "select",
          "required": true,
          "options": [
            "Will appeal",
            "No appeal"
          ],
          "note": "Will appeal | No appeal"
        },
        {
          "key": "appeal_grounds",
          "label": "Appeal grounds",
          "type": "textarea",
          "required": true,
          "note": "Clinical and administrative basis for appeal"
        },
        {
          "key": "action_taken",
          "label": "Action taken",
          "type": "select",
          "required": true,
          "options": [
            "Appealed",
            "Rebilled",
            "Written off",
            "Patient liability"
          ],
          "note": "Appealed | Rebilled | Written off | Patient liability"
        }
      ]
    },
    {
      "id": "write_off_authorisation",
      "title": "Write-off Authorisation Form",
      "purpose": "Capture and save write-off authorisation form data.",
      "fields": [
        {
          "key": "invoice",
          "label": "Invoice",
          "type": "text",
          "required": true,
          "note": "Invoice being written off"
        },
        {
          "key": "outstanding_amount_kes",
          "label": "Outstanding amount (KES)",
          "type": "text",
          "required": true,
          "note": "Amount to be written off"
        },
        {
          "key": "write_off_reason",
          "label": "Write-off reason",
          "type": "select",
          "required": true,
          "options": [
            "Bad debt",
            "Charity",
            "Management decision",
            "Insolvency",
            "Error"
          ],
          "note": "Bad debt | Charity | Management decision | Insolvency | Error"
        },
        {
          "key": "authorised_by",
          "label": "Authorised by",
          "type": "select",
          "required": true,
          "note": "Finance director or CEO"
        },
        {
          "key": "notes",
          "label": "Notes",
          "type": "textarea",
          "required": true,
          "note": "Detailed justification for write-off"
        }
      ]
    }
  ],
  "45": [
    {
      "id": "cost_centre_setup",
      "title": "Cost Centre Setup Form",
      "purpose": "Capture and save cost centre setup form data.",
      "fields": [
        {
          "key": "cost_centre_code",
          "label": "Cost centre code",
          "type": "text",
          "required": true,
          "note": "Unique code e.g. CC-OPD, CC-LAB"
        },
        {
          "key": "cost_centre_name",
          "label": "Cost centre name",
          "type": "text",
          "required": true,
          "note": "Name of cost centre"
        },
        {
          "key": "department",
          "label": "Department",
          "type": "select",
          "required": true,
          "note": "Linked department"
        },
        {
          "key": "annual_budget_kes",
          "label": "Annual budget (KES)",
          "type": "number",
          "required": true,
          "note": "Annual budget allocation"
        },
        {
          "key": "is_revenue_centre",
          "label": "Is revenue centre",
          "type": "checkbox",
          "required": true,
          "note": "Tick if cost centre also generates revenue"
        }
      ]
    },
    {
      "id": "cost_allocation",
      "title": "Cost Allocation Form",
      "purpose": "Capture and save cost allocation form data.",
      "fields": [
        {
          "key": "allocation_period",
          "label": "Allocation period",
          "type": "select",
          "required": true,
          "note": "Month being allocated"
        },
        {
          "key": "from_cost_centre",
          "label": "From cost centre",
          "type": "select",
          "required": true,
          "note": "Support department distributing costs"
        },
        {
          "key": "to_cost_centre",
          "label": "To cost centre",
          "type": "select",
          "required": true,
          "note": "Clinical department receiving overhead"
        },
        {
          "key": "allocation_method",
          "label": "Allocation method",
          "type": "select",
          "required": true,
          "options": [
            "Floor area",
            "Headcount",
            "Revenue",
            "Usage",
            "Direct",
            "Step-down"
          ],
          "note": "Floor area | Headcount | Revenue | Usage | Direct | Step-down"
        },
        {
          "key": "allocation_basis_value",
          "label": "Allocation basis value",
          "type": "number",
          "required": true,
          "note": "The driver e.g. 450 sqm floor area"
        },
        {
          "key": "amount_to_allocate_kes",
          "label": "Amount to allocate (KES)",
          "type": "number",
          "required": true,
          "note": "Total amount to distribute"
        }
      ]
    }
  ],
  "47": [
    {
      "id": "workflow_definition",
      "title": "Workflow Definition Form",
      "purpose": "Capture and save workflow definition form data.",
      "fields": [
        {
          "key": "workflow_name",
          "label": "Workflow name",
          "type": "text",
          "required": true,
          "note": "Descriptive name e.g. Auto-bill on lab result"
        },
        {
          "key": "trigger_module",
          "label": "Trigger module",
          "type": "select",
          "required": true,
          "note": "Module that fires the trigger event"
        },
        {
          "key": "trigger_event",
          "label": "Trigger event",
          "type": "select",
          "required": true,
          "note": "Select from available events in that module"
        },
        {
          "key": "trigger_conditions",
          "label": "Trigger conditions",
          "type": "text",
          "required": false,
          "note": "Additional conditions - field, operator, value"
        },
        {
          "key": "actions",
          "label": "Actions",
          "type": "text",
          "required": true,
          "note": "Ordered list of actions to execute with target module and payload"
        },
        {
          "key": "on_error_action",
          "label": "On error action",
          "type": "select",
          "required": true,
          "options": [
            "Retry",
            "Skip",
            "Alert",
            "Halt"
          ],
          "note": "Retry | Skip | Alert | Halt"
        },
        {
          "key": "max_retries",
          "label": "Max retries",
          "type": "number",
          "required": true,
          "note": "How many times to retry failed actions"
        }
      ]
    }
  ],
  "48": [
    {
      "id": "dispatch",
      "title": "Dispatch Form",
      "purpose": "Capture and save dispatch form data.",
      "fields": [
        {
          "key": "call_received_time",
          "label": "Call received time",
          "type": "datetime-local",
          "required": true,
          "note": "Exact time emergency call was received"
        },
        {
          "key": "caller_name",
          "label": "Caller name",
          "type": "text",
          "required": false,
          "note": "Name of person who called"
        },
        {
          "key": "caller_phone",
          "label": "Caller phone",
          "type": "tel",
          "required": true,
          "note": "Phone number of caller"
        },
        {
          "key": "scene_address",
          "label": "Scene address",
          "type": "text",
          "required": true,
          "note": "Location of emergency - as specific as possible"
        },
        {
          "key": "gps_coordinates",
          "label": "GPS coordinates",
          "type": "text",
          "required": false,
          "note": "Auto-capture GPS from caller or map pin"
        },
        {
          "key": "call_type",
          "label": "Call type",
          "type": "select",
          "required": true,
          "options": [
            "Medical",
            "Trauma",
            "Obstetric",
            "Paediatric",
            "Cardiac",
            "Psychiatric",
            "Fire",
            "RTA"
          ],
          "note": "Medical | Trauma | Obstetric | Paediatric | Cardiac | Psychiatric | Fire | RTA"
        },
        {
          "key": "patient_condition",
          "label": "Patient condition",
          "type": "text",
          "required": false,
          "note": "Brief patient status from caller"
        },
        {
          "key": "ambulance_assigned",
          "label": "Ambulance assigned",
          "type": "select",
          "required": true,
          "note": "Vehicle to dispatch"
        },
        {
          "key": "crew_assigned",
          "label": "Crew assigned",
          "type": "select",
          "required": true,
          "note": "Paramedic team for this call"
        },
        {
          "key": "dispatch_time",
          "label": "Dispatch time",
          "type": "datetime-local",
          "required": true,
          "note": "Time ambulance was dispatched"
        }
      ]
    },
    {
      "id": "scene_report",
      "title": "Scene Report Form",
      "purpose": "Capture and save scene report form data.",
      "fields": [
        {
          "key": "en_route_time",
          "label": "En route time",
          "type": "time",
          "required": true,
          "note": "Time vehicle started moving"
        },
        {
          "key": "scene_arrival_time",
          "label": "Scene arrival time",
          "type": "time",
          "required": true,
          "note": "Time vehicle arrived at scene"
        },
        {
          "key": "patient_found",
          "label": "Patient found",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No",
            "Deceased at scene"
          ],
          "note": "Yes | No | Deceased at scene"
        },
        {
          "key": "patient_name",
          "label": "Patient name",
          "type": "text",
          "required": false,
          "note": "Patient name if obtainable"
        },
        {
          "key": "age_estimate",
          "label": "Age estimate",
          "type": "text",
          "required": false,
          "note": "Estimated age if ID not available"
        },
        {
          "key": "scene_assessment",
          "label": "Scene assessment",
          "type": "textarea",
          "required": true,
          "note": "Scene safety, mechanism, patient condition"
        },
        {
          "key": "vital_signs_at_scene",
          "label": "Vital signs at scene",
          "type": "text",
          "required": true,
          "note": "BP, HR, RR, SpO2, GCS, Temp"
        },
        {
          "key": "pre_hospital_interventions",
          "label": "Pre-hospital interventions",
          "type": "textarea",
          "required": true,
          "note": "Airway management, IV access, drugs given, immobilisation"
        },
        {
          "key": "departed_scene_time",
          "label": "Departed scene time",
          "type": "time",
          "required": true,
          "note": "Time vehicle left scene"
        },
        {
          "key": "hospital_arrival_time",
          "label": "Hospital arrival time",
          "type": "time",
          "required": true,
          "note": "Time patient arrived at hospital"
        },
        {
          "key": "handover_to",
          "label": "Handover to",
          "type": "text",
          "required": true,
          "note": "Name of receiving clinician"
        },
        {
          "key": "handover_notes",
          "label": "Handover notes",
          "type": "textarea",
          "required": true,
          "note": "Verbal handover content documented"
        }
      ]
    },
    {
      "id": "fleet_maintenance_record",
      "title": "Fleet Maintenance Record",
      "purpose": "Capture and save fleet maintenance record data.",
      "fields": [
        {
          "key": "ambulance",
          "label": "Ambulance",
          "type": "select",
          "required": true,
          "note": "Vehicle registration"
        },
        {
          "key": "maintenance_type",
          "label": "Maintenance type",
          "type": "select",
          "required": true,
          "options": [
            "Preventive",
            "Corrective",
            "Inspection"
          ],
          "note": "Preventive | Corrective | Inspection"
        },
        {
          "key": "service_date",
          "label": "Service date",
          "type": "date",
          "required": true,
          "note": "Date of service"
        },
        {
          "key": "mileage",
          "label": "Mileage",
          "type": "number",
          "required": true,
          "note": "Odometer reading at service"
        },
        {
          "key": "work_performed",
          "label": "Work performed",
          "type": "textarea",
          "required": true,
          "note": "Description of maintenance work done"
        },
        {
          "key": "parts_replaced",
          "label": "Parts replaced",
          "type": "text",
          "required": false,
          "note": "Parts or consumables replaced"
        },
        {
          "key": "cost_kes",
          "label": "Cost (KES)",
          "type": "number",
          "required": false,
          "note": "Total maintenance cost"
        },
        {
          "key": "next_service_due",
          "label": "Next service due",
          "type": "date",
          "required": true,
          "note": "Next scheduled maintenance date"
        },
        {
          "key": "serviced_by",
          "label": "Serviced by",
          "type": "text",
          "required": true,
          "note": "Mechanic or garage name"
        }
      ]
    }
  ],
  "49": [
    {
      "id": "retail_sale",
      "title": "Retail Sale Form",
      "purpose": "Capture and save retail sale form data.",
      "fields": [
        {
          "key": "customer_type",
          "label": "Customer type",
          "type": "select",
          "required": true,
          "options": [
            "Patient",
            "Visitor",
            "Staff",
            "Walk-in"
          ],
          "note": "Patient | Visitor | Staff | Walk-in"
        },
        {
          "key": "patient_mrn",
          "label": "Patient MRN",
          "type": "text",
          "required": false,
          "note": "If selling to registered patient"
        },
        {
          "key": "drug_item",
          "label": "Drug / item",
          "type": "text",
          "required": true,
          "note": "Search from formulary or OTC list"
        },
        {
          "key": "quantity",
          "label": "Quantity",
          "type": "number",
          "required": true,
          "note": "Number of units to sell"
        },
        {
          "key": "unit_price",
          "label": "Unit price",
          "type": "text",
          "required": true,
          "note": "Auto-filled from formulary selling price"
        },
        {
          "key": "payment_method",
          "label": "Payment method",
          "type": "select",
          "required": true,
          "options": [
            "Cash",
            "MPESA",
            "Card",
            "Staff deduction"
          ],
          "note": "Cash | MPESA | Card | Staff deduction"
        },
        {
          "key": "mpesa_reference",
          "label": "MPESA reference",
          "type": "text",
          "required": false,
          "note": "M-Pesa transaction code if MPESA payment"
        },
        {
          "key": "print_receipt",
          "label": "Print receipt",
          "type": "checkbox",
          "required": true,
          "note": "Auto-selected - generates receipt on confirm"
        }
      ]
    }
  ],
  "50": [
    {
      "id": "nicu_admission",
      "title": "NICU Admission Form",
      "purpose": "Capture and save nicu admission form data.",
      "fields": [
        {
          "key": "baby_patient",
          "label": "Baby patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from newborn registration"
        },
        {
          "key": "mother_patient",
          "label": "Mother patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from delivery record"
        },
        {
          "key": "gestational_age",
          "label": "Gestational age",
          "type": "number",
          "required": true,
          "note": "Gestational age in weeks at birth"
        },
        {
          "key": "birth_weight_grams",
          "label": "Birth weight (grams)",
          "type": "number",
          "required": true,
          "note": "Birth weight"
        },
        {
          "key": "apgar_scores",
          "label": "APGAR scores",
          "type": "text",
          "required": true,
          "note": "Auto-filled from delivery record"
        },
        {
          "key": "admission_diagnosis",
          "label": "Admission diagnosis",
          "type": "text",
          "required": true,
          "note": "Primary reason for NICU admission"
        },
        {
          "key": "admission_source",
          "label": "Admission source",
          "type": "select",
          "required": true,
          "options": [
            "Delivery room",
            "Ward",
            "Emergency",
            "Transfer"
          ],
          "note": "Delivery room | Ward | Emergency | Transfer"
        },
        {
          "key": "incubator_assigned",
          "label": "Incubator assigned",
          "type": "select",
          "required": true,
          "note": "Select available incubator"
        },
        {
          "key": "code_status",
          "label": "Code status",
          "type": "select",
          "required": true,
          "options": [
            "Full resuscitation",
            "Comfort care",
            "DNR"
          ],
          "note": "Full resuscitation | Comfort care | DNR"
        },
        {
          "key": "consent_obtained",
          "label": "Consent obtained",
          "type": "checkbox",
          "required": true,
          "note": "Parent/guardian consent for NICU care"
        }
      ]
    },
    {
      "id": "nicu_daily_record",
      "title": "NICU Daily Record Form",
      "purpose": "Capture and save nicu daily record form data.",
      "fields": [
        {
          "key": "day_of_life",
          "label": "Day of life",
          "type": "text",
          "required": true,
          "note": "Auto-calculated from birth date"
        },
        {
          "key": "weight_grams",
          "label": "Weight (grams)",
          "type": "number",
          "required": true,
          "note": "Daily weight - expected trajectory tracked"
        },
        {
          "key": "temperature_c",
          "label": "Temperature (°C)",
          "type": "number",
          "required": true,
          "note": "Axillary temperature"
        },
        {
          "key": "incubator_temperature",
          "label": "Incubator temperature",
          "type": "number",
          "required": true,
          "note": "Set temperature of incubator"
        },
        {
          "key": "incubator_humidity",
          "label": "Incubator humidity (%)",
          "type": "number",
          "required": false,
          "note": "Relative humidity set in incubator"
        },
        {
          "key": "respiratory_support",
          "label": "Respiratory support",
          "type": "select",
          "required": true,
          "options": [
            "None",
            "Oxygen",
            "CPAP",
            "HFNC",
            "Ventilator"
          ],
          "note": "None | Oxygen | CPAP | HFNC | Ventilator"
        },
        {
          "key": "fio2",
          "label": "FiO2 (%)",
          "type": "number",
          "required": false,
          "note": "Oxygen concentration if on support"
        },
        {
          "key": "spo2",
          "label": "SpO2 (%)",
          "type": "number",
          "required": true,
          "note": "Target 90-95% for premature babies"
        },
        {
          "key": "phototherapy",
          "label": "Phototherapy",
          "type": "checkbox",
          "required": true,
          "note": "Tick if phototherapy active"
        },
        {
          "key": "phototherapy_hours_today",
          "label": "Phototherapy hours today",
          "type": "number",
          "required": false,
          "note": "Hours under phototherapy this day"
        },
        {
          "key": "bilirubin_mol_l",
          "label": "Bilirubin (µmol/L)",
          "type": "number",
          "required": false,
          "note": "Total serum bilirubin"
        },
        {
          "key": "feeding_type",
          "label": "Feeding type",
          "type": "select",
          "required": true,
          "options": [
            "Breast milk",
            "Formula",
            "Donor milk",
            "NPO"
          ],
          "note": "Breast milk | Formula | Donor milk | NPO"
        },
        {
          "key": "feed_volume_ml_kg_day",
          "label": "Feed volume (mL/kg/day)",
          "type": "number",
          "required": true,
          "note": "Total daily feed volume"
        },
        {
          "key": "iv_fluid_rate_ml_kg_day",
          "label": "IV fluid rate (mL/kg/day)",
          "type": "number",
          "required": false,
          "note": "IV maintenance fluid rate"
        },
        {
          "key": "kangaroo_care_hours",
          "label": "Kangaroo care hours",
          "type": "number",
          "required": false,
          "note": "Hours of skin-to-skin care today"
        },
        {
          "key": "antibiotics",
          "label": "Antibiotics",
          "type": "text",
          "required": false,
          "note": "Current antibiotic drugs and day of treatment"
        },
        {
          "key": "assessment_notes",
          "label": "Assessment notes",
          "type": "textarea",
          "required": true,
          "note": "Daily clinical assessment narrative"
        }
      ]
    }
  ],
  "51": [
    {
      "id": "body_reception",
      "title": "Body Reception Form",
      "purpose": "Capture and save body reception form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": false,
          "note": "Link to patient MRN if known"
        },
        {
          "key": "body_received_from",
          "label": "Body received from",
          "type": "select",
          "required": true,
          "options": [
            "Inpatient ward",
            "Emergency",
            "Theatre",
            "Home",
            "Scene",
            "Police",
            "Coroner"
          ],
          "note": "Inpatient ward | Emergency | Theatre | Home | Scene | Police | Coroner"
        },
        {
          "key": "received_at_time",
          "label": "Received at time",
          "type": "datetime",
          "required": true,
          "note": "Time body arrived in mortuary"
        },
        {
          "key": "sex",
          "label": "Sex",
          "type": "select",
          "required": true,
          "options": [
            "Male",
            "Female",
            "Unknown"
          ],
          "note": "Male | Female | Unknown"
        },
        {
          "key": "approximate_age",
          "label": "Approximate age",
          "type": "text",
          "required": false,
          "note": "Estimated age if identity not confirmed"
        },
        {
          "key": "body_condition",
          "label": "Body condition",
          "type": "select",
          "required": true,
          "options": [
            "Fresh",
            "Early decomposition",
            "Advanced decomposition",
            "Embalmed"
          ],
          "note": "Fresh | Early decomposition | Advanced decomposition | Embalmed"
        },
        {
          "key": "identifying_features",
          "label": "Identifying features",
          "type": "textarea",
          "required": false,
          "note": "Physical description for identification"
        },
        {
          "key": "compartment_assigned",
          "label": "Compartment assigned",
          "type": "select",
          "required": true,
          "note": "Cold storage compartment number"
        },
        {
          "key": "police_case",
          "label": "Police case",
          "type": "checkbox",
          "required": true,
          "note": "Tick if death involves police investigation"
        },
        {
          "key": "police_reference",
          "label": "Police reference",
          "type": "text",
          "required": false,
          "note": "OB number or case reference"
        },
        {
          "key": "accompanying_documentation",
          "label": "Accompanying documentation",
          "type": "text",
          "required": true,
          "note": "Death notification | Medical certificate | Police release"
        }
      ]
    },
    {
      "id": "death_certificate",
      "title": "Death Certificate Form",
      "purpose": "Capture and save death certificate form data.",
      "fields": [
        {
          "key": "deceased_name",
          "label": "Deceased name",
          "type": "text",
          "required": true,
          "note": "Full legal name"
        },
        {
          "key": "date_of_death",
          "label": "Date of death",
          "type": "date",
          "required": true,
          "note": "Certified date of death"
        },
        {
          "key": "time_of_death",
          "label": "Time of death",
          "type": "time",
          "required": false,
          "note": "Time if known"
        },
        {
          "key": "place_of_death",
          "label": "Place of death",
          "type": "text",
          "required": true,
          "note": "Hospital name and ward or location"
        },
        {
          "key": "cause_ia_immediate_cause",
          "label": "Cause Ia — Immediate cause",
          "type": "text",
          "required": true,
          "note": "Disease directly causing death"
        },
        {
          "key": "cause_ib_antecedent_cause",
          "label": "Cause Ib — Antecedent cause",
          "type": "text",
          "required": false,
          "note": "Disease leading to immediate cause"
        },
        {
          "key": "cause_ic_underlying_cause",
          "label": "Cause Ic — Underlying cause",
          "type": "text",
          "required": false,
          "note": "Disease leading to Ib"
        },
        {
          "key": "cause_ii_contributing_conditions",
          "label": "Cause II — Contributing conditions",
          "type": "text",
          "required": false,
          "note": "Other conditions contributing to death"
        },
        {
          "key": "icd_10_code",
          "label": "ICD-10 code",
          "type": "text",
          "required": true,
          "note": "Code for underlying cause of death"
        },
        {
          "key": "manner_of_death",
          "label": "Manner of death",
          "type": "select",
          "required": true,
          "options": [
            "Natural",
            "Accident",
            "Homicide",
            "Suicide",
            "Undetermined"
          ],
          "note": "Natural | Accident | Homicide | Suicide | Undetermined"
        },
        {
          "key": "post_mortem_performed",
          "label": "Post-mortem performed",
          "type": "text",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "certifying_doctor",
          "label": "Certifying doctor",
          "type": "text",
          "required": true,
          "note": "Auto-filled - logged in doctor"
        }
      ]
    },
    {
      "id": "body_release",
      "title": "Body Release Form",
      "purpose": "Capture and save body release form data.",
      "fields": [
        {
          "key": "released_to_name",
          "label": "Released to name",
          "type": "text",
          "required": true,
          "note": "Full name of person collecting body"
        },
        {
          "key": "collector_id_number",
          "label": "Collector ID number",
          "type": "text",
          "required": true,
          "note": "National ID of collector"
        },
        {
          "key": "relationship_to_deceased",
          "label": "Relationship to deceased",
          "type": "select",
          "required": true,
          "options": [
            "Spouse",
            "Parent",
            "Child",
            "Sibling",
            "Funeral home",
            "Other"
          ],
          "note": "Spouse | Parent | Child | Sibling | Funeral home | Other"
        },
        {
          "key": "funeral_home_name",
          "label": "Funeral home name",
          "type": "text",
          "required": false,
          "note": "If released to funeral home"
        },
        {
          "key": "burial_permit_number",
          "label": "Burial permit number",
          "type": "text",
          "required": true,
          "note": "County burial permit reference"
        },
        {
          "key": "death_certificate_issued",
          "label": "Death certificate issued",
          "type": "checkbox",
          "required": true,
          "note": "Confirm death certificate was given"
        },
        {
          "key": "outstanding_bill_cleared",
          "label": "Outstanding bill cleared",
          "type": "checkbox",
          "required": true,
          "note": "Confirm hospital bill is fully settled"
        }
      ]
    }
  ],
  "52": [
    {
      "id": "cdss_rule_configuration",
      "title": "CDSS Rule Configuration Form",
      "purpose": "Capture and save cdss rule configuration form data.",
      "fields": [
        {
          "key": "rule_name",
          "label": "Rule name",
          "type": "text",
          "required": true,
          "note": "Descriptive name for the clinical rule"
        },
        {
          "key": "trigger_event",
          "label": "Trigger event",
          "type": "select",
          "required": true,
          "options": [
            "Prescribe",
            "Order lab",
            "Admit",
            "Vital sign",
            "Discharge",
            "Result"
          ],
          "note": "Prescribe | Order lab | Admit | Vital sign | Discharge | Result"
        },
        {
          "key": "condition_logic",
          "label": "Condition logic",
          "type": "text",
          "required": true,
          "note": "SQL or JSON rule expression evaluated against patient data"
        },
        {
          "key": "alert_severity",
          "label": "Alert severity",
          "type": "select",
          "required": true,
          "options": [
            "Info",
            "Warning",
            "Critical",
            "Hard stop"
          ],
          "note": "Info | Warning | Critical | Hard stop"
        },
        {
          "key": "alert_message",
          "label": "Alert message",
          "type": "textarea",
          "required": true,
          "note": "Message shown to clinician when rule fires"
        },
        {
          "key": "can_be_overridden",
          "label": "Can be overridden",
          "type": "checkbox",
          "required": true,
          "note": "Untick for hard stops that cannot be bypassed"
        },
        {
          "key": "override_requires_reason",
          "label": "Override requires reason",
          "type": "checkbox",
          "required": true,
          "note": "Tick to require documented justification"
        },
        {
          "key": "guideline_source",
          "label": "Guideline source",
          "type": "text",
          "required": false,
          "note": "Evidence source e.g. WHO, Kenya National Formulary 2023"
        }
      ]
    },
    {
      "id": "cdss_alert_override",
      "title": "CDSS Alert Override Form",
      "purpose": "Capture and save cdss alert override form data.",
      "fields": [
        {
          "key": "alert",
          "label": "Alert",
          "type": "text",
          "required": true,
          "note": "Rule that fired - shown in context"
        },
        {
          "key": "override_reason",
          "label": "Override reason",
          "type": "select",
          "required": true,
          "options": [
            "Benefit outweighs risk",
            "Alternative not available",
            "Patient specific factor",
            "Allergist reviewed"
          ],
          "note": "Benefit outweighs risk | Alternative not available | Patient specific factor | Allergist reviewed"
        },
        {
          "key": "clinical_justification",
          "label": "Clinical justification",
          "type": "textarea",
          "required": true,
          "note": "Detailed clinical reasoning for overriding the alert"
        }
      ]
    }
  ],
  "53": [
    {
      "id": "ai_alert_review",
      "title": "AI Alert Review Form",
      "purpose": "Capture and save ai alert review form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Patient flagged by AI model"
        },
        {
          "key": "risk_type",
          "label": "Risk type",
          "type": "text",
          "required": true,
          "options": [
            "Readmission",
            "Deterioration",
            "Sepsis",
            "Revenue anomaly"
          ],
          "note": "Readmission | Deterioration | Sepsis | Revenue anomaly"
        },
        {
          "key": "risk_score",
          "label": "Risk score",
          "type": "text",
          "required": true,
          "note": "AI confidence score 0-100%"
        },
        {
          "key": "contributing_factors",
          "label": "Contributing factors",
          "type": "text",
          "required": true,
          "note": "Factors the AI used to determine risk"
        },
        {
          "key": "clinician_assessment",
          "label": "Clinician assessment",
          "type": "select",
          "required": true,
          "options": [
            "Agree - will act",
            "Disagree - not at risk",
            "Uncertain"
          ],
          "note": "Agree - will act | Disagree - not at risk | Uncertain"
        },
        {
          "key": "action_planned",
          "label": "Action planned",
          "type": "textarea",
          "required": false,
          "note": "What action will be taken in response to this alert"
        },
        {
          "key": "review_notes",
          "label": "Review notes",
          "type": "text",
          "required": false,
          "note": "Any clinical notes on the AI prediction"
        }
      ]
    }
  ],
  "54": [
    {
      "id": "support_ticket",
      "title": "Support Ticket Form",
      "purpose": "Capture and save support ticket form data.",
      "fields": [
        {
          "key": "category",
          "label": "Category",
          "type": "select",
          "required": true,
          "options": [
            "IT",
            "Maintenance",
            "Biomedical",
            "Housekeeping",
            "HR",
            "Security"
          ],
          "note": "IT | Maintenance | Biomedical | Housekeeping | HR | Security"
        },
        {
          "key": "sub_category",
          "label": "Sub-category",
          "type": "select",
          "required": true,
          "options": [
            "Network",
            "Hardware",
            "Plumbing",
            "Electrical",
            "Equipment",
            "Other"
          ],
          "note": "Network | Hardware | Plumbing | Electrical | Equipment | Other"
        },
        {
          "key": "priority",
          "label": "Priority",
          "type": "select",
          "required": true,
          "options": [
            "Low",
            "Medium",
            "High",
            "Critical"
          ],
          "note": "Low | Medium | High | Critical"
        },
        {
          "key": "title",
          "label": "Title",
          "type": "text",
          "required": true,
          "note": "Short issue description - max 100 characters"
        },
        {
          "key": "description",
          "label": "Description",
          "type": "textarea",
          "required": true,
          "note": "Detailed description - what happened, when, impact"
        },
        {
          "key": "affected_asset",
          "label": "Affected asset",
          "type": "select",
          "required": false,
          "note": "Asset from asset register if applicable"
        },
        {
          "key": "attach_screenshot",
          "label": "Attach screenshot",
          "type": "text",
          "required": false,
          "note": "Screenshot or photo of the issue"
        }
      ]
    },
    {
      "id": "ticket_resolution",
      "title": "Ticket Resolution Form",
      "purpose": "Capture and save ticket resolution form data.",
      "fields": [
        {
          "key": "resolution_notes",
          "label": "Resolution notes",
          "type": "textarea",
          "required": true,
          "note": "What was done to resolve the issue"
        },
        {
          "key": "time_spent_hours",
          "label": "Time spent (hours)",
          "type": "number",
          "required": true,
          "note": "Total time to resolve"
        },
        {
          "key": "parts_used",
          "label": "Parts used",
          "type": "text",
          "required": false,
          "note": "Any parts or consumables used"
        },
        {
          "key": "requester_satisfaction",
          "label": "Requester satisfaction",
          "type": "text",
          "required": false,
          "note": "1-5 star rating from requester"
        }
      ]
    }
  ],
  "55": [
    {
      "id": "patient_diet_order",
      "title": "Patient Diet Order Form",
      "purpose": "Capture and save patient diet order form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from admission"
        },
        {
          "key": "diet_type",
          "label": "Diet type",
          "type": "select",
          "required": true,
          "options": [
            "Normal",
            "Diabetic",
            "Low-sodium",
            "Renal",
            "Soft",
            "Liquid",
            "NPO",
            "High-protein",
            "Vegetarian",
            "Halal",
            "Low-fat"
          ],
          "note": "Normal | Diabetic | Low-sodium | Renal | Soft | Liquid | NPO | High-protein | Vegetarian | Halal | Low-fat"
        },
        {
          "key": "texture",
          "label": "Texture",
          "type": "select",
          "required": false,
          "options": [
            "Regular",
            "Soft",
            "Minced",
            "Pureed",
            "Liquid - for dysphagia"
          ],
          "note": "Regular | Soft | Minced | Pureed | Liquid - for dysphagia"
        },
        {
          "key": "caloric_target",
          "label": "Caloric target",
          "type": "number",
          "required": false,
          "note": "Daily calorie target if prescribed by dietitian"
        },
        {
          "key": "fluid_restriction_ml",
          "label": "Fluid restriction (mL)",
          "type": "number",
          "required": false,
          "note": "Daily fluid limit if restricted"
        },
        {
          "key": "allergens_to_exclude",
          "label": "Allergens to exclude",
          "type": "checkbox",
          "required": false,
          "note": "Nuts | Gluten | Dairy | Eggs | Seafood | Soy"
        },
        {
          "key": "special_instructions",
          "label": "Special instructions",
          "type": "text",
          "required": false,
          "note": "Additional preparation notes for kitchen"
        },
        {
          "key": "start_date",
          "label": "Start date",
          "type": "date",
          "required": true,
          "note": "When this diet order begins"
        },
        {
          "key": "ordered_by",
          "label": "Ordered by",
          "type": "text",
          "required": true,
          "note": "Doctor or dietitian - auto-filled"
        }
      ]
    },
    {
      "id": "canteen_pos",
      "title": "Canteen POS Form",
      "purpose": "Capture and save canteen pos form data.",
      "fields": [
        {
          "key": "customer_type",
          "label": "Customer type",
          "type": "select",
          "required": true,
          "options": [
            "Staff",
            "Visitor",
            "Patient",
            "Other"
          ],
          "note": "Staff | Visitor | Patient | Other"
        },
        {
          "key": "staff_id",
          "label": "Staff ID",
          "type": "select",
          "required": false,
          "note": "If selling to staff - enables salary deduction option"
        },
        {
          "key": "items",
          "label": "Items",
          "type": "select",
          "required": true,
          "note": "Items selected from menu with quantities"
        },
        {
          "key": "total",
          "label": "Total",
          "type": "text",
          "required": true,
          "note": "Sum of selected items"
        },
        {
          "key": "payment_method",
          "label": "Payment method",
          "type": "select",
          "required": true,
          "options": [
            "Cash",
            "MPESA",
            "Staff salary deduction",
            "Credit"
          ],
          "note": "Cash | MPESA | Staff salary deduction | Credit"
        }
      ]
    }
  ],
  "56": [
    {
      "id": "physiotherapy_initial_assessment",
      "title": "Physiotherapy Initial Assessment Form",
      "purpose": "Capture and save physiotherapy initial assessment form data.",
      "fields": [
        {
          "key": "referral_diagnosis",
          "label": "Referral diagnosis",
          "type": "text",
          "required": true,
          "note": "From referring clinician's order"
        },
        {
          "key": "subjective",
          "label": "Subjective",
          "type": "textarea",
          "required": true,
          "note": "Patient-reported symptoms, history, functional limitations"
        },
        {
          "key": "objective_measurements",
          "label": "Objective measurements",
          "type": "text",
          "required": true,
          "options": [
            "ROM per joint",
            "Muscle strength grades",
            "Balance tests",
            "Functional scores"
          ],
          "note": "ROM per joint | Muscle strength grades | Balance tests | Functional scores"
        },
        {
          "key": "pain_score_0_10",
          "label": "Pain score (0–10)",
          "type": "text",
          "required": true,
          "note": "Current pain level"
        },
        {
          "key": "functional_status",
          "label": "Functional status",
          "type": "textarea",
          "required": true,
          "note": "Activities of daily living - what patient can and cannot do"
        },
        {
          "key": "barthel_index_score",
          "label": "Barthel Index score",
          "type": "text",
          "required": false,
          "note": "Functional independence measure 0-100"
        },
        {
          "key": "physiotherapy_diagnosis",
          "label": "Physiotherapy diagnosis",
          "type": "textarea",
          "required": true,
          "note": "Physiotherapist's clinical impression"
        },
        {
          "key": "treatment_goals",
          "label": "Treatment goals",
          "type": "text",
          "required": true,
          "note": "Short-term and long-term goals with measurable targets"
        },
        {
          "key": "treatment_plan",
          "label": "Treatment plan",
          "type": "textarea",
          "required": true,
          "note": "Planned interventions, modalities, and exercise programme"
        },
        {
          "key": "sessions_prescribed",
          "label": "Sessions prescribed",
          "type": "number",
          "required": true,
          "note": "Total sessions planned"
        },
        {
          "key": "frequency_per_week",
          "label": "Frequency per week",
          "type": "number",
          "required": true,
          "note": "Session frequency"
        }
      ]
    },
    {
      "id": "physiotherapy_session_record",
      "title": "Physiotherapy Session Record",
      "purpose": "Capture and save physiotherapy session record data.",
      "fields": [
        {
          "key": "session_number",
          "label": "Session number",
          "type": "text",
          "required": true,
          "note": "Sequential within this treatment episode"
        },
        {
          "key": "pain_score",
          "label": "Pain score",
          "type": "text",
          "required": true,
          "note": "Pain at start of session 0-10"
        },
        {
          "key": "treatment_given",
          "label": "Treatment given",
          "type": "text",
          "required": true,
          "options": [
            "Modalities: TENS",
            "Ultrasound",
            "Heat",
            "Ice",
            "Traction",
            "Massage - with parameters"
          ],
          "note": "Modalities: TENS | Ultrasound | Heat | Ice | Traction | Massage - with parameters"
        },
        {
          "key": "exercises",
          "label": "Exercises",
          "type": "text",
          "required": true,
          "note": "Exercises with sets, reps, resistance, and notes"
        },
        {
          "key": "patient_response",
          "label": "Patient response",
          "type": "text",
          "required": true,
          "note": "How patient tolerated treatment"
        },
        {
          "key": "progress_notes",
          "label": "Progress notes",
          "type": "textarea",
          "required": true,
          "note": "Progress toward goals - objective measurements if done"
        },
        {
          "key": "home_exercise_programme",
          "label": "Home exercise programme",
          "type": "text",
          "required": false,
          "note": "Exercises given for home between sessions"
        }
      ]
    }
  ],
  "57": [
    {
      "id": "nutritional_screening",
      "title": "Nutritional Screening Form",
      "purpose": "Capture and save nutritional screening form data.",
      "fields": [
        {
          "key": "screening_tool",
          "label": "Screening tool",
          "type": "select",
          "required": true,
          "options": [
            "MUST",
            "NRS-2002",
            "MNA",
            "STAMP"
          ],
          "note": "MUST | NRS-2002 | MNA | STAMP"
        },
        {
          "key": "weight_kg",
          "label": "Weight (kg)",
          "type": "number",
          "required": true,
          "note": "Current measured weight"
        },
        {
          "key": "height_cm",
          "label": "Height (cm)",
          "type": "number",
          "required": true,
          "note": "Measured height"
        },
        {
          "key": "bmi",
          "label": "BMI",
          "type": "text",
          "required": true,
          "note": "Auto-calculated from weight and height"
        },
        {
          "key": "usual_body_weight_kg",
          "label": "Usual body weight (kg)",
          "type": "number",
          "required": false,
          "note": "Pre-illness or usual weight"
        },
        {
          "key": "unintentional_weight_loss",
          "label": "Unintentional weight loss",
          "type": "select",
          "required": true,
          "options": [
            "None",
            "<5% in 3 months",
            "5-10%",
            ">10%"
          ],
          "note": "None | <5% in 3 months | 5-10% | >10%"
        },
        {
          "key": "appetite",
          "label": "Appetite",
          "type": "select",
          "required": true,
          "options": [
            "Good",
            "Fair",
            "Poor",
            "Absent"
          ],
          "note": "Good | Fair | Poor | Absent"
        },
        {
          "key": "disease_severity",
          "label": "Disease severity",
          "type": "select",
          "required": true,
          "options": [
            "No stress",
            "Mild",
            "Moderate",
            "Severe"
          ],
          "note": "No stress | Mild | Moderate | Severe"
        },
        {
          "key": "screening_score",
          "label": "Screening score",
          "type": "text",
          "required": true,
          "note": "Calculated risk score"
        },
        {
          "key": "risk_category",
          "label": "Risk category",
          "type": "text",
          "required": true,
          "options": [
            "Low",
            "Medium",
            "High"
          ],
          "note": "Low | Medium | High"
        }
      ]
    },
    {
      "id": "nutrition_assessment",
      "title": "Nutrition Assessment Form",
      "purpose": "Capture and save nutrition assessment form data.",
      "fields": [
        {
          "key": "24_hour_dietary_recall",
          "label": "24-hour dietary recall",
          "type": "textarea",
          "required": true,
          "note": "Everything eaten and drunk in the previous 24 hours"
        },
        {
          "key": "swallowing_status",
          "label": "Swallowing status",
          "type": "select",
          "required": true,
          "options": [
            "Normal",
            "Mild dysphagia",
            "Severe dysphagia",
            "NPO"
          ],
          "note": "Normal | Mild dysphagia | Severe dysphagia | NPO"
        },
        {
          "key": "gut_function",
          "label": "Gut function",
          "type": "select",
          "required": true,
          "options": [
            "Normal",
            "Diarrhoea",
            "Constipation",
            "Malabsorption"
          ],
          "note": "Normal | Diarrhoea | Constipation | Malabsorption"
        },
        {
          "key": "serum_albumin_g_dl",
          "label": "Serum albumin (g/dL)",
          "type": "number",
          "required": false,
          "note": "Biochemical marker of nutritional status"
        },
        {
          "key": "clinical_signs_of_malnutrition",
          "label": "Clinical signs of malnutrition",
          "type": "text",
          "required": false,
          "note": "Oedema | Muscle wasting | Hair loss | Skin changes | Angular stomatitis"
        },
        {
          "key": "energy_requirement_kcal_day",
          "label": "Energy requirement (kcal/day)",
          "type": "number",
          "required": true,
          "note": "Calculated or estimated daily energy need"
        },
        {
          "key": "protein_requirement_g_day",
          "label": "Protein requirement (g/day)",
          "type": "number",
          "required": true,
          "note": "Daily protein requirement"
        },
        {
          "key": "nutrition_diagnosis",
          "label": "Nutrition diagnosis",
          "type": "textarea",
          "required": true,
          "note": "PES statement: Problem | Etiology | Signs and symptoms"
        }
      ]
    },
    {
      "id": "nutrition_care_plan",
      "title": "Nutrition Care Plan Form",
      "purpose": "Capture and save nutrition care plan form data.",
      "fields": [
        {
          "key": "nutrition_support_type",
          "label": "Nutrition support type",
          "type": "select",
          "required": true,
          "options": [
            "Oral diet",
            "Oral supplement",
            "Enteral NG",
            "TPN",
            "Combined"
          ],
          "note": "Oral diet | Oral supplement | Enteral NG | TPN | Combined"
        },
        {
          "key": "diet_type",
          "label": "Diet type",
          "type": "select",
          "required": false,
          "options": [
            "Normal",
            "Diabetic",
            "Renal",
            "Cardiac",
            "Low-sodium",
            "Liquid",
            "Soft"
          ],
          "note": "Normal | Diabetic | Renal | Cardiac | Low-sodium | Liquid | Soft"
        },
        {
          "key": "enteral_formula",
          "label": "Enteral formula",
          "type": "text",
          "required": false,
          "note": "Brand/type of enteral feed"
        },
        {
          "key": "feed_rate_ml_hour",
          "label": "Feed rate (mL/hour)",
          "type": "number",
          "required": false,
          "note": "Enteral feed rate"
        },
        {
          "key": "total_daily_volume_ml",
          "label": "Total daily volume (mL)",
          "type": "number",
          "required": false,
          "note": "Total enteral volume target"
        },
        {
          "key": "tpn_composition",
          "label": "TPN composition",
          "type": "text",
          "required": false,
          "note": "Dextrose, amino acids, lipids, electrolytes composition"
        },
        {
          "key": "monitoring_plan",
          "label": "Monitoring plan",
          "type": "text",
          "required": true,
          "note": "Parameters to monitor - weight, glucose, electrolytes"
        },
        {
          "key": "review_date",
          "label": "Review date",
          "type": "date",
          "required": true,
          "note": "Next scheduled nutrition review"
        }
      ]
    }
  ],
  "58": [
    {
      "id": "dental_examination",
      "title": "Dental Examination Form",
      "purpose": "Capture and save dental examination form data.",
      "fields": [
        {
          "key": "notation_system",
          "label": "Notation system",
          "type": "select",
          "required": true,
          "options": [
            "FDI",
            "Universal",
            "Palmer"
          ],
          "note": "FDI | Universal | Palmer"
        },
        {
          "key": "tooth_chart",
          "label": "Tooth chart",
          "type": "text",
          "required": true,
          "note": "Visual tooth chart - click per tooth to record status and treatment needed"
        },
        {
          "key": "periodontal_probing_depths",
          "label": "Periodontal probing depths",
          "type": "text",
          "required": false,
          "note": "Pocket depths per tooth per surface"
        },
        {
          "key": "occlusion_class",
          "label": "Occlusion class",
          "type": "select",
          "required": false,
          "options": [
            "Angle Class I",
            "II",
            "III"
          ],
          "note": "Angle Class I | II | III"
        },
        {
          "key": "oral_hygiene_status",
          "label": "Oral hygiene status",
          "type": "select",
          "required": true,
          "options": [
            "Good",
            "Fair",
            "Poor"
          ],
          "note": "Good | Fair | Poor"
        },
        {
          "key": "plaque_index",
          "label": "Plaque index",
          "type": "number",
          "required": false,
          "note": "0-3 plaque index score"
        },
        {
          "key": "gingival_index",
          "label": "Gingival index",
          "type": "number",
          "required": false,
          "note": "0-3 gingival index score"
        },
        {
          "key": "chief_dental_complaint",
          "label": "Chief dental complaint",
          "type": "text",
          "required": true,
          "note": "Main reason for visit"
        },
        {
          "key": "dental_history",
          "label": "Dental history",
          "type": "textarea",
          "required": false,
          "note": "Previous dental treatment, dental anxiety level"
        },
        {
          "key": "radiographs_required",
          "label": "Radiographs required",
          "type": "checkbox",
          "required": false,
          "note": "Periapical | Bitewing | OPG | CBCT"
        }
      ]
    },
    {
      "id": "dental_treatment_record",
      "title": "Dental Treatment Record",
      "purpose": "Capture and save dental treatment record data.",
      "fields": [
        {
          "key": "tooth_number",
          "label": "Tooth number",
          "type": "select",
          "required": true,
          "note": "Specific tooth treated"
        },
        {
          "key": "tooth_surfaces",
          "label": "Tooth surfaces",
          "type": "checkbox",
          "required": false,
          "note": "Mesial | Distal | Buccal | Lingual | Occlusal | Incisal"
        },
        {
          "key": "procedure",
          "label": "Procedure",
          "type": "select",
          "required": true,
          "options": [
            "Extraction",
            "Amalgam",
            "Composite",
            "RCT",
            "Crown",
            "Scaling",
            "Other"
          ],
          "note": "Extraction | Amalgam | Composite | RCT | Crown | Scaling | Other"
        },
        {
          "key": "anaesthesia_type",
          "label": "Anaesthesia type",
          "type": "select",
          "required": true,
          "options": [
            "None",
            "Local infiltration",
            "Block",
            "Sedation",
            "General"
          ],
          "note": "None | Local infiltration | Block | Sedation | General"
        },
        {
          "key": "anaesthetic_used",
          "label": "Anaesthetic used",
          "type": "text",
          "required": false,
          "note": "Drug and volume e.g. Lignocaine 2% 1.8mL"
        },
        {
          "key": "materials_used",
          "label": "Materials used",
          "type": "text",
          "required": false,
          "note": "Restorative material and shade if applicable"
        },
        {
          "key": "complications",
          "label": "Complications",
          "type": "text",
          "required": false,
          "note": "Any procedural complications"
        },
        {
          "key": "post_op_instructions",
          "label": "Post-op instructions",
          "type": "textarea",
          "required": true,
          "note": "Care instructions given to patient"
        }
      ]
    }
  ],
  "59": [
    {
      "id": "hai_surveillance",
      "title": "HAI Surveillance Form",
      "purpose": "Capture and save hai surveillance form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from admission"
        },
        {
          "key": "hai_type",
          "label": "HAI type",
          "type": "select",
          "required": true,
          "options": [
            "SSI",
            "CAUTI",
            "CLABSI",
            "VAP",
            "CDI",
            "MRSA",
            "Other"
          ],
          "note": "SSI | CAUTI | CLABSI | VAP | CDI | MRSA | Other"
        },
        {
          "key": "diagnosis_date",
          "label": "Diagnosis date",
          "type": "date",
          "required": true,
          "note": "Date HAI was identified"
        },
        {
          "key": "implicated_device",
          "label": "Implicated device",
          "type": "select",
          "required": false,
          "options": [
            "Urinary catheter",
            "Central line",
            "Ventilator",
            "Surgical site",
            "NA"
          ],
          "note": "Urinary catheter | Central line | Ventilator | Surgical site | NA"
        },
        {
          "key": "device_insertion_date",
          "label": "Device insertion date",
          "type": "date",
          "required": false,
          "note": "For device-day calculation"
        },
        {
          "key": "causative_organism",
          "label": "Causative organism",
          "type": "text",
          "required": false,
          "note": "Organism identified on culture"
        },
        {
          "key": "is_multi_drug_resistant",
          "label": "Is multi-drug resistant",
          "type": "checkbox",
          "required": true,
          "note": "MRSA | VRE | ESBL | CRE - tick if MDR"
        },
        {
          "key": "treatment_given",
          "label": "Treatment given",
          "type": "text",
          "required": false,
          "note": "Antibiotic and other treatment"
        },
        {
          "key": "outcome",
          "label": "Outcome",
          "type": "select",
          "required": true,
          "options": [
            "Resolved",
            "Ongoing",
            "Transferred",
            "Deceased"
          ],
          "note": "Resolved | Ongoing | Transferred | Deceased"
        }
      ]
    },
    {
      "id": "cssd_sterilisation_cycle",
      "title": "CSSD Sterilisation Cycle Form",
      "purpose": "Capture and save cssd sterilisation cycle form data.",
      "fields": [
        {
          "key": "autoclave_id",
          "label": "Autoclave ID",
          "type": "select",
          "required": true,
          "note": "Specific autoclave machine"
        },
        {
          "key": "cycle_number",
          "label": "Cycle number",
          "type": "text",
          "required": true,
          "note": "Sequential machine cycle number"
        },
        {
          "key": "cycle_type",
          "label": "Cycle type",
          "type": "select",
          "required": true,
          "options": [
            "Gravity",
            "Pre-vacuum",
            "Flash",
            "ETO",
            "Plasma"
          ],
          "note": "Gravity | Pre-vacuum | Flash | ETO | Plasma"
        },
        {
          "key": "temperature_c",
          "label": "Temperature (°C)",
          "type": "text",
          "required": true,
          "note": "Auto-read from machine - typically 134C"
        },
        {
          "key": "pressure_bar",
          "label": "Pressure (bar)",
          "type": "text",
          "required": true,
          "note": "Auto-read from machine"
        },
        {
          "key": "hold_time_minutes",
          "label": "Hold time (minutes)",
          "type": "text",
          "required": true,
          "note": "Time at sterilising temperature"
        },
        {
          "key": "chemical_indicator_result",
          "label": "Chemical indicator result",
          "type": "select",
          "required": true,
          "options": [
            "Pass",
            "Fail"
          ],
          "note": "Pass | Fail"
        },
        {
          "key": "bowie_dick_result",
          "label": "Bowie-Dick result",
          "type": "select",
          "required": false,
          "options": [
            "Pass",
            "Fail - for pre-vacuum cycles only"
          ],
          "note": "Pass | Fail - for pre-vacuum cycles only"
        },
        {
          "key": "biological_indicator_result",
          "label": "Biological indicator result",
          "type": "select",
          "required": false,
          "options": [
            "Pass",
            "Fail",
            "Pending - weekly spore test"
          ],
          "note": "Pass | Fail | Pending - weekly spore test"
        },
        {
          "key": "loads_in_this_cycle",
          "label": "Loads in this cycle",
          "type": "text",
          "required": true,
          "note": "Instrument trays with tray code and description"
        },
        {
          "key": "cycle_passed",
          "label": "Cycle passed",
          "type": "text",
          "required": true,
          "note": "Auto-determined from all indicator results"
        }
      ]
    },
    {
      "id": "hand_hygiene_audit",
      "title": "Hand Hygiene Audit Form",
      "purpose": "Capture and save hand hygiene audit form data.",
      "fields": [
        {
          "key": "ward",
          "label": "Ward",
          "type": "select",
          "required": true,
          "note": "Ward being audited"
        },
        {
          "key": "audit_date",
          "label": "Audit date",
          "type": "date",
          "required": true,
          "note": "Date of observation"
        },
        {
          "key": "observation_duration_min",
          "label": "Observation duration (min)",
          "type": "number",
          "required": true,
          "note": "How long observations were done"
        },
        {
          "key": "total_opportunities",
          "label": "Total opportunities",
          "type": "number",
          "required": true,
          "note": "Total hand hygiene opportunities observed"
        },
        {
          "key": "opportunities_taken",
          "label": "Opportunities taken",
          "type": "number",
          "required": true,
          "note": "Times hand hygiene was actually performed"
        },
        {
          "key": "compliance_rate",
          "label": "Compliance rate",
          "type": "text",
          "required": true,
          "note": "Calculated percentage"
        },
        {
          "key": "by_moment",
          "label": "By moment",
          "type": "text",
          "required": true,
          "note": "Compliance per WHO 5 moments"
        },
        {
          "key": "by_cadre",
          "label": "By cadre",
          "type": "text",
          "required": false,
          "options": [
            "Nurses",
            "Doctors",
            "Allied",
            "Support"
          ],
          "note": "Nurses | Doctors | Allied | Support"
        },
        {
          "key": "handrub_available",
          "label": "Handrub available",
          "type": "checkbox",
          "required": true,
          "note": "Alcohol handrub at all points of care"
        },
        {
          "key": "sinks_functional",
          "label": "Sinks functional",
          "type": "checkbox",
          "required": true,
          "note": "Hand washing sinks in working order"
        }
      ]
    }
  ],
  "60": [
    {
      "id": "chw_registration",
      "title": "CHW Registration Form",
      "purpose": "Capture and save chw registration form data.",
      "fields": [
        {
          "key": "full_name",
          "label": "Full name",
          "type": "text",
          "required": true,
          "note": "CHW full name"
        },
        {
          "key": "national_id",
          "label": "National ID",
          "type": "text",
          "required": true,
          "note": "National ID number"
        },
        {
          "key": "phone",
          "label": "Phone",
          "type": "tel",
          "required": true,
          "note": "Mobile number - primary contact"
        },
        {
          "key": "cadre",
          "label": "Cadre",
          "type": "select",
          "required": true,
          "options": [
            "CHV",
            "CHP",
            "Supervisor"
          ],
          "note": "CHV | CHP | Supervisor"
        },
        {
          "key": "assigned_village",
          "label": "Assigned village",
          "type": "text",
          "required": true,
          "note": "Village or estate assigned"
        },
        {
          "key": "sub_location",
          "label": "Sub-location",
          "type": "select",
          "required": true,
          "note": "Administrative sub-location"
        },
        {
          "key": "supervisor",
          "label": "Supervisor",
          "type": "select",
          "required": false,
          "note": "Supervising CHW or health officer"
        }
      ]
    },
    {
      "id": "household_registration",
      "title": "Household Registration Form",
      "purpose": "Capture and save household registration form data.",
      "fields": [
        {
          "key": "chw",
          "label": "CHW",
          "type": "text",
          "required": true,
          "note": "Auto-filled from login"
        },
        {
          "key": "head_of_household",
          "label": "Head of household",
          "type": "text",
          "required": true,
          "note": "Name of household head"
        },
        {
          "key": "phone",
          "label": "Phone",
          "type": "tel",
          "required": false,
          "note": "Household contact number"
        },
        {
          "key": "village",
          "label": "Village",
          "type": "text",
          "required": true,
          "note": "Village name"
        },
        {
          "key": "gps_location",
          "label": "GPS location",
          "type": "text",
          "required": false,
          "note": "Auto-capture GPS coordinates"
        },
        {
          "key": "water_source",
          "label": "Water source",
          "type": "select",
          "required": true,
          "options": [
            "Piped",
            "Borehole",
            "River",
            "Rain",
            "Vendor"
          ],
          "note": "Piped | Borehole | River | Rain | Vendor"
        },
        {
          "key": "sanitation",
          "label": "Sanitation",
          "type": "select",
          "required": true,
          "options": [
            "Flush toilet",
            "Pit latrine",
            "Open defecation"
          ],
          "note": "Flush toilet | Pit latrine | Open defecation"
        },
        {
          "key": "number_of_members",
          "label": "Number of members",
          "type": "number",
          "required": true,
          "note": "Total household members"
        }
      ]
    },
    {
      "id": "chw_home_visit",
      "title": "CHW Home Visit Form",
      "purpose": "Capture and save chw home visit form data.",
      "fields": [
        {
          "key": "household",
          "label": "Household",
          "type": "select",
          "required": true,
          "note": "Household being visited"
        },
        {
          "key": "visit_type",
          "label": "Visit type",
          "type": "select",
          "required": true,
          "options": [
            "Routine",
            "ANC follow-up",
            "PNC",
            "Immunisation",
            "Chronic disease",
            "Defaulter tracing"
          ],
          "note": "Routine | ANC follow-up | PNC | Immunisation | Chronic disease | Defaulter tracing"
        },
        {
          "key": "members_present",
          "label": "Members present",
          "type": "number",
          "required": true,
          "note": "Household members seen during visit"
        },
        {
          "key": "services_provided",
          "label": "Services provided",
          "type": "text",
          "required": true,
          "note": "Health education | Screening | Referral | Immunisation | FP counselling"
        },
        {
          "key": "findings",
          "label": "Findings",
          "type": "textarea",
          "required": true,
          "note": "Health findings during the visit"
        },
        {
          "key": "referrals_made",
          "label": "Referrals made",
          "type": "number",
          "required": false,
          "note": "Number of patients referred to facility"
        },
        {
          "key": "gps_confirmation",
          "label": "GPS confirmation",
          "type": "text",
          "required": true,
          "note": "Auto-capture to confirm location of visit"
        },
        {
          "key": "next_visit_date",
          "label": "Next visit date",
          "type": "date",
          "required": false,
          "note": "Date of next scheduled visit"
        }
      ]
    }
  ],
  "61": [
    {
      "id": "informed_consent",
      "title": "Informed Consent Form",
      "purpose": "Capture and save informed consent form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from encounter"
        },
        {
          "key": "consent_type",
          "label": "Consent type",
          "type": "select",
          "required": true,
          "options": [
            "Surgical",
            "Anaesthesia",
            "Blood transfusion",
            "HIV testing",
            "Research",
            "Data processing",
            "Photography"
          ],
          "note": "Surgical | Anaesthesia | Blood transfusion | HIV testing | Research | Data processing | Photography"
        },
        {
          "key": "consent_form_version",
          "label": "Consent form version",
          "type": "text",
          "required": true,
          "note": "Auto-selected current version"
        },
        {
          "key": "procedure_explained",
          "label": "Procedure explained",
          "type": "checkbox",
          "required": true,
          "note": "Confirm procedure was explained to patient"
        },
        {
          "key": "questions_answered",
          "label": "Questions answered",
          "type": "checkbox",
          "required": true,
          "note": "Confirm patient's questions were answered"
        },
        {
          "key": "language_of_explanation",
          "label": "Language of explanation",
          "type": "select",
          "required": true,
          "options": [
            "English",
            "Swahili",
            "Kikuyu",
            "Other"
          ],
          "note": "English | Swahili | Kikuyu | Other"
        },
        {
          "key": "patient_consents",
          "label": "Patient consents",
          "type": "select",
          "required": true,
          "options": [
            "Yes - I consent",
            "No - I refuse"
          ],
          "note": "Yes - I consent | No - I refuse"
        },
        {
          "key": "refusal_reason",
          "label": "Refusal reason",
          "type": "text",
          "required": false,
          "note": "Required if patient refuses"
        },
        {
          "key": "consented_by",
          "label": "Consented by",
          "type": "text",
          "required": true,
          "note": "Name of patient or guardian giving consent"
        },
        {
          "key": "relationship_to_patient",
          "label": "Relationship to patient",
          "type": "select",
          "required": false,
          "options": [
            "Self",
            "Parent",
            "Guardian",
            "Spouse",
            "Next of kin - if not patient"
          ],
          "note": "Self | Parent | Guardian | Spouse | Next of kin - if not patient"
        },
        {
          "key": "patient_guardian_signature",
          "label": "Patient/guardian signature",
          "type": "text",
          "required": true,
          "note": "Digital signature or thumbprint capture"
        },
        {
          "key": "witness_name",
          "label": "Witness name",
          "type": "text",
          "required": true,
          "note": "Name of witness present during consent"
        },
        {
          "key": "witness_signature",
          "label": "Witness signature",
          "type": "text",
          "required": true,
          "note": "Witness digital signature"
        },
        {
          "key": "obtained_by",
          "label": "Obtained by",
          "type": "text",
          "required": true,
          "note": "Auto-filled - clinician obtaining consent"
        }
      ]
    }
  ],
  "62": [
    {
      "id": "outgoing_referral",
      "title": "Outgoing Referral Form",
      "purpose": "Capture and save outgoing referral form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled from encounter"
        },
        {
          "key": "receiving_facility",
          "label": "Receiving facility",
          "type": "select",
          "required": true,
          "note": "Select from facility directory - searchable by name or MFL"
        },
        {
          "key": "receiving_specialist",
          "label": "Receiving specialist",
          "type": "text",
          "required": false,
          "note": "Specific doctor or department at receiving facility"
        },
        {
          "key": "specialty_required",
          "label": "Specialty required",
          "type": "select",
          "required": true,
          "note": "Specialty service being sought"
        },
        {
          "key": "urgency",
          "label": "Urgency",
          "type": "select",
          "required": true,
          "options": [
            "Routine",
            "Urgent",
            "Emergency"
          ],
          "note": "Routine | Urgent | Emergency"
        },
        {
          "key": "reason_for_referral",
          "label": "Reason for referral",
          "type": "textarea",
          "required": true,
          "note": "Clinical reason and specific questions for receiving team"
        },
        {
          "key": "clinical_summary",
          "label": "Clinical summary",
          "type": "textarea",
          "required": true,
          "note": "History, findings, investigations done, treatment given"
        },
        {
          "key": "investigations_attached",
          "label": "Investigations attached",
          "type": "checkbox",
          "required": false,
          "note": "Lab results | Imaging | ECG | Other reports"
        },
        {
          "key": "transport_mode",
          "label": "Transport mode",
          "type": "select",
          "required": true,
          "options": [
            "Self",
            "Ambulance",
            "Police",
            "Air evacuation"
          ],
          "note": "Self | Ambulance | Police | Air evacuation"
        },
        {
          "key": "accompanying_person",
          "label": "Accompanying person",
          "type": "text",
          "required": false,
          "note": "Name of person accompanying patient"
        }
      ]
    },
    {
      "id": "referral_feedback",
      "title": "Referral Feedback Form",
      "purpose": "Capture and save referral feedback form data.",
      "fields": [
        {
          "key": "referral",
          "label": "Referral",
          "type": "text",
          "required": true,
          "note": "Referral being responded to"
        },
        {
          "key": "patient_arrived",
          "label": "Patient arrived",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "arrival_date",
          "label": "Arrival date",
          "type": "date",
          "required": false,
          "note": "Date patient presented at receiving facility"
        },
        {
          "key": "assessment_findings",
          "label": "Assessment findings",
          "type": "textarea",
          "required": true,
          "note": "Specialist assessment at receiving facility"
        },
        {
          "key": "diagnosis_confirmed",
          "label": "Diagnosis confirmed",
          "type": "text",
          "required": true,
          "note": "Confirmed or revised diagnosis"
        },
        {
          "key": "treatment_given",
          "label": "Treatment given",
          "type": "text",
          "required": true,
          "note": "Interventions performed at receiving facility"
        },
        {
          "key": "outcome",
          "label": "Outcome",
          "type": "select",
          "required": true,
          "options": [
            "Admitted",
            "Treated and returned",
            "Ongoing follow-up",
            "Deceased"
          ],
          "note": "Admitted | Treated and returned | Ongoing follow-up | Deceased"
        },
        {
          "key": "patient_returned_to_referring_facility",
          "label": "Patient returned to referring facility",
          "type": "select",
          "required": false,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        }
      ]
    }
  ],
  "63": [
    {
      "id": "document_upload",
      "title": "Document Upload Form",
      "purpose": "Capture and save document upload form data.",
      "fields": [
        {
          "key": "document_type",
          "label": "Document type",
          "type": "select",
          "required": true,
          "options": [
            "Clinical",
            "Financial",
            "Legal",
            "HR",
            "Administrative",
            "Consent",
            "Referral",
            "Insurance"
          ],
          "note": "Clinical | Financial | Legal | HR | Administrative | Consent | Referral | Insurance"
        },
        {
          "key": "document_title",
          "label": "Document title",
          "type": "text",
          "required": true,
          "note": "Descriptive title"
        },
        {
          "key": "file_upload",
          "label": "File upload",
          "type": "file",
          "required": true,
          "note": "PDF, image, or Office document - max 50 MB"
        },
        {
          "key": "linked_patient",
          "label": "Linked patient",
          "type": "text",
          "required": false,
          "note": "Patient MRN if patient-related document"
        },
        {
          "key": "linked_encounter",
          "label": "Linked encounter",
          "type": "select",
          "required": false,
          "note": "Specific encounter if applicable"
        },
        {
          "key": "linked_staff",
          "label": "Linked staff",
          "type": "select",
          "required": false,
          "note": "Staff record if HR document"
        },
        {
          "key": "tags",
          "label": "Tags",
          "type": "text",
          "required": false,
          "note": "Keywords for searchability"
        },
        {
          "key": "access_level",
          "label": "Access level",
          "type": "select",
          "required": true,
          "options": [
            "Public",
            "Clinical only",
            "Restricted",
            "Confidential"
          ],
          "note": "Public | Clinical only | Restricted | Confidential"
        },
        {
          "key": "expiry_date",
          "label": "Expiry date",
          "type": "date",
          "required": false,
          "note": "For time-limited documents like insurance pre-auth letters"
        }
      ]
    }
  ],
  "64": [
    {
      "id": "notification_template",
      "title": "Notification Template Form",
      "purpose": "Capture and save notification template form data.",
      "fields": [
        {
          "key": "template_code",
          "label": "Template code",
          "type": "text",
          "required": true,
          "note": "Unique identifier e.g. APPOINTMENT_REMINDER"
        },
        {
          "key": "channel",
          "label": "Channel",
          "type": "select",
          "required": true,
          "options": [
            "SMS",
            "WhatsApp",
            "Email",
            "All"
          ],
          "note": "SMS | WhatsApp | Email | All"
        },
        {
          "key": "language",
          "label": "Language",
          "type": "select",
          "required": true,
          "options": [
            "English",
            "Swahili"
          ],
          "note": "English | Swahili"
        },
        {
          "key": "subject_line",
          "label": "Subject line",
          "type": "text",
          "required": false,
          "note": "Email subject - not needed for SMS"
        },
        {
          "key": "message_body",
          "label": "Message body",
          "type": "textarea",
          "required": true,
          "note": "Message with placeholders e.g. Dear {{patient_name}}, your appointment is on {{date}}"
        },
        {
          "key": "whatsapp_template_name",
          "label": "WhatsApp template name",
          "type": "text",
          "required": false,
          "note": "Approved WhatsApp Business API template name"
        }
      ]
    },
    {
      "id": "manual_notification",
      "title": "Manual Notification Form",
      "purpose": "Capture and save manual notification form data.",
      "fields": [
        {
          "key": "recipient",
          "label": "Recipient",
          "type": "text",
          "required": true,
          "note": "Patient or staff member to notify"
        },
        {
          "key": "channel",
          "label": "Channel",
          "type": "select",
          "required": true,
          "options": [
            "SMS",
            "WhatsApp",
            "Email"
          ],
          "note": "SMS | WhatsApp | Email"
        },
        {
          "key": "message",
          "label": "Message",
          "type": "textarea",
          "required": true,
          "note": "Custom message - or select from templates"
        },
        {
          "key": "template",
          "label": "Template",
          "type": "select",
          "required": false,
          "note": "Select a pre-approved template"
        },
        {
          "key": "send_now_or_schedule",
          "label": "Send now or schedule",
          "type": "select",
          "required": true,
          "options": [
            "Send immediately",
            "Schedule for later"
          ],
          "note": "Send immediately | Schedule for later"
        },
        {
          "key": "scheduled_time",
          "label": "Scheduled time",
          "type": "datetime-local",
          "required": false,
          "note": "If scheduling - when to send"
        }
      ]
    }
  ],
  "65": [
    {
      "id": "medical_device_registration",
      "title": "Medical Device Registration Form",
      "purpose": "Capture and save medical device registration form data.",
      "fields": [
        {
          "key": "asset",
          "label": "Asset",
          "type": "select",
          "required": true,
          "note": "Link to existing asset in facility_assets"
        },
        {
          "key": "device_class",
          "label": "Device class",
          "type": "select",
          "required": true,
          "options": [
            "Class A",
            "B",
            "C",
            "D - Kenya MDA classification"
          ],
          "note": "Class A | B | C | D - Kenya MDA classification"
        },
        {
          "key": "intended_use",
          "label": "Intended use",
          "type": "textarea",
          "required": true,
          "note": "Manufacturer's intended medical purpose"
        },
        {
          "key": "udi",
          "label": "UDI",
          "type": "text",
          "required": true,
          "note": "Unique Device Identifier - from device label"
        },
        {
          "key": "gmdn_code",
          "label": "GMDN code",
          "type": "text",
          "required": false,
          "note": "Global Medical Device Nomenclature code"
        },
        {
          "key": "risk_classification",
          "label": "Risk classification",
          "type": "select",
          "required": true,
          "options": [
            "Low",
            "Medium",
            "High",
            "Critical"
          ],
          "note": "Low | Medium | High | Critical"
        },
        {
          "key": "ppb_registration_number",
          "label": "PPB registration number",
          "type": "text",
          "required": false,
          "note": "Kenya Pharmacy and Poisons Board approval"
        },
        {
          "key": "is_single_use",
          "label": "Is single use",
          "type": "select",
          "required": true,
          "options": [
            "Yes - cannot be reprocessed",
            "No - reusable"
          ],
          "note": "Yes - cannot be reprocessed | No - reusable"
        },
        {
          "key": "max_reprocessing_cycles",
          "label": "Max reprocessing cycles",
          "type": "number",
          "required": false,
          "note": "If reusable - manufacturer limit on reprocessing"
        },
        {
          "key": "software_version",
          "label": "Software version",
          "type": "text",
          "required": false,
          "note": "Current firmware or software version"
        },
        {
          "key": "is_implantable",
          "label": "Is implantable",
          "type": "checkbox",
          "required": false,
          "note": "Tick if device is implanted in patient body"
        }
      ]
    },
    {
      "id": "calibration_record",
      "title": "Calibration Record Form",
      "purpose": "Capture and save calibration record form data.",
      "fields": [
        {
          "key": "asset",
          "label": "Asset",
          "type": "text",
          "required": true,
          "note": "Device being calibrated"
        },
        {
          "key": "calibration_type",
          "label": "Calibration type",
          "type": "select",
          "required": true,
          "options": [
            "Internal",
            "External",
            "Manufacturer",
            "NIST-traceable"
          ],
          "note": "Internal | External | Manufacturer | NIST-traceable"
        },
        {
          "key": "calibration_date",
          "label": "Calibration date",
          "type": "date",
          "required": true,
          "note": "Date performed"
        },
        {
          "key": "calibrating_technician",
          "label": "Calibrating technician",
          "type": "text",
          "required": true,
          "note": "Name of calibrating person or company"
        },
        {
          "key": "reference_standard_used",
          "label": "Reference standard used",
          "type": "text",
          "required": true,
          "note": "Traceable reference standard e.g. KEBS-certified thermometer"
        },
        {
          "key": "pre_calibration_reading",
          "label": "Pre-calibration reading",
          "type": "text",
          "required": true,
          "note": "Device reading before adjustment"
        },
        {
          "key": "post_calibration_reading",
          "label": "Post-calibration reading",
          "type": "text",
          "required": true,
          "note": "Device reading after calibration"
        },
        {
          "key": "within_tolerance",
          "label": "Within tolerance",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "adjustment_made",
          "label": "Adjustment made",
          "type": "select",
          "required": true,
          "options": [
            "Yes",
            "No"
          ],
          "note": "Yes | No"
        },
        {
          "key": "certificate_number",
          "label": "Certificate number",
          "type": "text",
          "required": false,
          "note": "Calibration certificate reference"
        },
        {
          "key": "next_calibration_due",
          "label": "Next calibration due",
          "type": "date",
          "required": true,
          "note": "Next calibration date"
        }
      ]
    }
  ],
  "66": [
    {
      "id": "migration_job_setup",
      "title": "Migration Job Setup Form",
      "purpose": "Capture and save migration job setup form data.",
      "fields": [
        {
          "key": "source_system_name",
          "label": "Source system name",
          "type": "text",
          "required": true,
          "note": "Name of the old HMIS being migrated from"
        },
        {
          "key": "source_type",
          "label": "Source type",
          "type": "select",
          "required": true,
          "options": [
            "Database",
            "CSV",
            "Excel",
            "JSON",
            "FHIR",
            "API"
          ],
          "note": "Database | CSV | Excel | JSON | FHIR | API"
        },
        {
          "key": "connection_method",
          "label": "Connection method",
          "type": "select",
          "required": true,
          "options": [
            "Direct DB connection",
            "File upload",
            "API endpoint"
          ],
          "note": "Direct DB connection | File upload | API endpoint"
        },
        {
          "key": "host_url",
          "label": "Host / URL",
          "type": "text",
          "required": false,
          "note": "Database host or API URL if direct connection"
        },
        {
          "key": "database_name",
          "label": "Database name",
          "type": "text",
          "required": false,
          "note": "Database name if direct DB connection"
        },
        {
          "key": "username",
          "label": "Username",
          "type": "text",
          "required": false,
          "note": "Read-only database username"
        },
        {
          "key": "password",
          "label": "Password",
          "type": "text",
          "required": false,
          "note": "Database password - encrypted immediately"
        },
        {
          "key": "port",
          "label": "Port",
          "type": "number",
          "required": false,
          "note": "Database port if non-default"
        },
        {
          "key": "upload_files",
          "label": "Upload files",
          "type": "file",
          "required": false,
          "note": "For CSV/Excel/JSON/FHIR file-based migration"
        },
        {
          "key": "test_connection",
          "label": "Test connection",
          "type": "text",
          "required": true,
          "note": "Verify source system is accessible before proceeding"
        }
      ]
    },
    {
      "id": "field_mapping",
      "title": "Field Mapping Form",
      "purpose": "Capture and save field mapping form data.",
      "fields": [
        {
          "key": "source_table",
          "label": "Source table",
          "type": "text",
          "required": true,
          "note": "Auto-populated from schema discovery"
        },
        {
          "key": "source_field",
          "label": "Source field",
          "type": "text",
          "required": true,
          "note": "Source field name and detected type"
        },
        {
          "key": "target_table",
          "label": "Target table",
          "type": "select",
          "required": true,
          "note": "Medilink target table"
        },
        {
          "key": "target_field",
          "label": "Target field",
          "type": "select",
          "required": true,
          "note": "Medilink target field"
        },
        {
          "key": "conflict_type",
          "label": "Conflict type",
          "type": "select",
          "required": true,
          "options": [
            "Direct match",
            "Type mismatch",
            "Source only",
            "Target only",
            "Semantic"
          ],
          "note": "Direct match | Type mismatch | Source only | Target only | Semantic"
        },
        {
          "key": "resolution",
          "label": "Resolution",
          "type": "select",
          "required": true,
          "options": [
            "Auto",
            "Manual",
            "AI assisted",
            "Custom function",
            "Discard",
            "Extend"
          ],
          "note": "Auto | Manual | AI assisted | Custom function | Discard | Extend"
        },
        {
          "key": "transform_function",
          "label": "Transform function",
          "type": "text",
          "required": false,
          "note": "Python or SQL transformation for Type 2 conflicts"
        },
        {
          "key": "lookup_table",
          "label": "Lookup table",
          "type": "text",
          "required": false,
          "note": "Value translation table for semantic conflicts e.g. 1Male, 2Female"
        }
      ]
    },
    {
      "id": "validation_report_review",
      "title": "Validation Report Review Form",
      "purpose": "Capture and save validation report review form data.",
      "fields": [
        {
          "key": "migration_job",
          "label": "Migration job",
          "type": "text",
          "required": true,
          "note": "Job being reviewed"
        },
        {
          "key": "error_record",
          "label": "Error record",
          "type": "text",
          "required": true,
          "note": "Source record with error"
        },
        {
          "key": "error_type",
          "label": "Error type",
          "type": "select",
          "required": true,
          "options": [
            "Validation",
            "Transformation",
            "Reference",
            "Duplicate",
            "Encoding"
          ],
          "note": "Validation | Transformation | Reference | Duplicate | Encoding"
        },
        {
          "key": "error_message",
          "label": "Error message",
          "type": "text",
          "required": true,
          "note": "Detailed error description"
        },
        {
          "key": "resolution_action",
          "label": "Resolution action",
          "type": "select",
          "required": true,
          "options": [
            "Fix source data",
            "Skip record",
            "Manual entry",
            "Map differently"
          ],
          "note": "Fix source data | Skip record | Manual entry | Map differently"
        },
        {
          "key": "resolution_notes",
          "label": "Resolution notes",
          "type": "text",
          "required": false,
          "note": "How this error was resolved"
        }
      ]
    },
    {
      "id": "migration_approval",
      "title": "Migration Approval Form",
      "purpose": "Capture and save migration approval form data.",
      "fields": [
        {
          "key": "migration_job",
          "label": "Migration job",
          "type": "text",
          "required": true,
          "note": "Job being approved for live migration"
        },
        {
          "key": "dry_run_summary",
          "label": "Dry run summary",
          "type": "select",
          "required": true,
          "options": [
            "Records passed",
            "Failed",
            "Skipped"
          ],
          "note": "Records passed | Failed | Skipped"
        },
        {
          "key": "snapshot_id",
          "label": "Snapshot ID",
          "type": "text",
          "required": true,
          "note": "Pre-migration database snapshot reference - for rollback"
        },
        {
          "key": "schedule_migration",
          "label": "Schedule migration",
          "type": "datetime-local",
          "required": true,
          "note": "When to run the live migration - typically overnight"
        },
        {
          "key": "migration_admin_approval",
          "label": "Migration admin approval",
          "type": "text",
          "required": true,
          "note": "Tenant migration administrator sign-off"
        },
        {
          "key": "medilink_engineer_approval",
          "label": "Medilink engineer approval",
          "type": "text",
          "required": true,
          "note": "Medilink co-approval - dual authorisation required"
        }
      ]
    }
  ],
  "67": [
    {
      "id": "incident_report",
      "title": "Incident Report Form",
      "purpose": "Capture and save incident report form data.",
      "fields": [
        {
          "key": "incident_date",
          "label": "Incident date",
          "type": "date",
          "required": true,
          "note": "Date incident occurred"
        },
        {
          "key": "incident_time",
          "label": "Incident time",
          "type": "time",
          "required": false,
          "note": "Approximate time if known"
        },
        {
          "key": "patient_involved",
          "label": "Patient involved",
          "type": "text",
          "required": false,
          "note": "Patient MRN - blank for staff-only incidents"
        },
        {
          "key": "location",
          "label": "Location",
          "type": "select",
          "required": true,
          "note": "Department or area where incident occurred"
        },
        {
          "key": "incident_type",
          "label": "Incident type",
          "type": "select",
          "required": true,
          "options": [
            "Medication error",
            "Fall",
            "Pressure injury",
            "Wrong site",
            "HAI",
            "Equipment failure",
            "Near miss",
            "Complaint"
          ],
          "note": "Medication error | Fall | Pressure injury | Wrong site | HAI | Equipment failure | Near miss | Complaint"
        },
        {
          "key": "severity",
          "label": "Severity",
          "type": "select",
          "required": true,
          "options": [
            "Near miss",
            "Minor",
            "Moderate",
            "Major",
            "Sentinel event"
          ],
          "note": "Near miss | Minor | Moderate | Major | Sentinel event"
        },
        {
          "key": "description",
          "label": "Description",
          "type": "textarea",
          "required": true,
          "note": "Detailed, factual account of what happened"
        },
        {
          "key": "immediate_actions_taken",
          "label": "Immediate actions taken",
          "type": "textarea",
          "required": true,
          "note": "What was done immediately after the incident"
        },
        {
          "key": "patient_outcome",
          "label": "Patient outcome",
          "type": "text",
          "required": false,
          "note": "Effect on patient if applicable"
        }
      ]
    },
    {
      "id": "root_cause_analysis_rca",
      "title": "Root Cause Analysis (RCA) Form",
      "purpose": "Capture and save root cause analysis (rca) form data.",
      "fields": [
        {
          "key": "incident",
          "label": "Incident",
          "type": "text",
          "required": true,
          "note": "Linked incident being investigated"
        },
        {
          "key": "rca_team_members",
          "label": "RCA team members",
          "type": "text",
          "required": true,
          "note": "All members of the investigation team"
        },
        {
          "key": "rca_methodology",
          "label": "RCA methodology",
          "type": "select",
          "required": true,
          "options": [
            "Fishbone",
            "5 Whys",
            "FMEA",
            "Fault tree",
            "London Protocol"
          ],
          "note": "Fishbone | 5 Whys | FMEA | Fault tree | London Protocol"
        },
        {
          "key": "event_timeline",
          "label": "Event timeline",
          "type": "text",
          "required": true,
          "note": "Chronological sequence of events - time, event, person"
        },
        {
          "key": "contributing_factors",
          "label": "Contributing factors",
          "type": "text",
          "required": true,
          "options": [
            "Per category: Patient",
            "Staff",
            "Environment",
            "Equipment",
            "Communication"
          ],
          "note": "Per category: Patient | Staff | Environment | Equipment | Communication"
        },
        {
          "key": "root_causes",
          "label": "Root causes",
          "type": "textarea",
          "required": true,
          "note": "Identified fundamental causes"
        },
        {
          "key": "recommendations",
          "label": "Recommendations",
          "type": "text",
          "required": true,
          "note": "Action, responsible person, due date, priority per recommendation"
        },
        {
          "key": "lessons_learned",
          "label": "Lessons learned",
          "type": "textarea",
          "required": true,
          "note": "Key learnings for system-wide sharing"
        }
      ]
    },
    {
      "id": "clinical_audit",
      "title": "Clinical Audit Form",
      "purpose": "Capture and save clinical audit form data.",
      "fields": [
        {
          "key": "audit_title",
          "label": "Audit title",
          "type": "text",
          "required": true,
          "note": "Name of the audit e.g. Hand Hygiene Compliance Audit"
        },
        {
          "key": "audit_topic",
          "label": "Audit topic",
          "type": "text",
          "required": true,
          "note": "Clinical area or process being audited"
        },
        {
          "key": "standard_or_criteria",
          "label": "Standard or criteria",
          "type": "textarea",
          "required": true,
          "note": "What standard is being measured against"
        },
        {
          "key": "sample_size",
          "label": "Sample size",
          "type": "number",
          "required": true,
          "note": "Number of records or observations in the audit"
        },
        {
          "key": "audit_period",
          "label": "Audit period",
          "type": "text",
          "required": true,
          "note": "Data collection period"
        },
        {
          "key": "audit_findings",
          "label": "Audit findings",
          "type": "text",
          "required": true,
          "note": "Per criterion: compliance %, numerator, denominator, notes"
        },
        {
          "key": "recommendations",
          "label": "Recommendations",
          "type": "textarea",
          "required": true,
          "note": "What needs to change based on findings"
        },
        {
          "key": "action_plan",
          "label": "Action plan",
          "type": "text",
          "required": true,
          "note": "Specific actions with owner and due date"
        },
        {
          "key": "re_audit_date",
          "label": "Re-audit date",
          "type": "date",
          "required": true,
          "note": "When to re-audit to measure improvement"
        }
      ]
    },
    {
      "id": "accreditation_checklist",
      "title": "Accreditation Checklist Form",
      "purpose": "Capture and save accreditation checklist form data.",
      "fields": [
        {
          "key": "accreditation_body",
          "label": "Accreditation body",
          "type": "select",
          "required": true,
          "options": [
            "KQMH",
            "JCI",
            "ISO 9001",
            "SafeCare",
            "WHO SARA"
          ],
          "note": "KQMH | JCI | ISO 9001 | SafeCare | WHO SARA"
        },
        {
          "key": "standard_code",
          "label": "Standard code",
          "type": "text",
          "required": true,
          "note": "Standard item code"
        },
        {
          "key": "requirement",
          "label": "Requirement",
          "type": "text",
          "required": true,
          "note": "Full standard requirement text"
        },
        {
          "key": "compliance_status",
          "label": "Compliance status",
          "type": "select",
          "required": true,
          "options": [
            "Compliant",
            "Partially compliant",
            "Non-compliant",
            "Not applicable"
          ],
          "note": "Compliant | Partially compliant | Non-compliant | Not applicable"
        },
        {
          "key": "evidence_description",
          "label": "Evidence description",
          "type": "textarea",
          "required": true,
          "note": "What evidence demonstrates compliance"
        },
        {
          "key": "evidence_documents",
          "label": "Evidence documents",
          "type": "text",
          "required": false,
          "note": "Upload supporting documents"
        },
        {
          "key": "gap_description",
          "label": "Gap description",
          "type": "textarea",
          "required": false,
          "note": "What is missing for full compliance - required if not compliant"
        },
        {
          "key": "target_compliance_date",
          "label": "Target compliance date",
          "type": "date",
          "required": false,
          "note": "When full compliance will be achieved"
        }
      ]
    }
  ],
  "68": [
    {
      "id": "growth_monitoring",
      "title": "Growth Monitoring Form",
      "purpose": "Capture and save growth monitoring form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Auto-filled - child patient"
        },
        {
          "key": "age_months",
          "label": "Age (months)",
          "type": "text",
          "required": true,
          "note": "Auto-calculated from date of birth"
        },
        {
          "key": "weight_kg",
          "label": "Weight (kg)",
          "type": "number",
          "required": true,
          "note": "Weight to 3 decimal places for infants"
        },
        {
          "key": "height_length_cm",
          "label": "Height / Length (cm)",
          "type": "number",
          "required": true,
          "note": "Recumbent length for under 2 years, standing height for 2"
        },
        {
          "key": "head_circumference_cm",
          "label": "Head circumference (cm)",
          "type": "number",
          "required": false,
          "note": "For children under 5 years"
        },
        {
          "key": "muac_cm",
          "label": "MUAC (cm)",
          "type": "number",
          "required": false,
          "note": "Mid-upper arm circumference - SAM screening"
        },
        {
          "key": "oedema_present",
          "label": "Oedema present",
          "type": "checkbox",
          "required": true,
          "note": "Bilateral pitting oedema - sign of kwashiorkor"
        },
        {
          "key": "weight_for_age_z_score",
          "label": "Weight-for-age z-score",
          "type": "text",
          "required": true,
          "note": "Auto-calculated from WHO Child Growth Standards"
        },
        {
          "key": "height_for_age_z_score",
          "label": "Height-for-age z-score",
          "type": "text",
          "required": true,
          "note": "Stunting indicator"
        },
        {
          "key": "weight_for_height_z_score",
          "label": "Weight-for-height z-score",
          "type": "text",
          "required": true,
          "note": "Wasting indicator"
        },
        {
          "key": "nutritional_status",
          "label": "Nutritional status",
          "type": "text",
          "required": true,
          "options": [
            "Normal",
            "Mild",
            "Moderate",
            "Severe malnutrition",
            "Overweight"
          ],
          "note": "Normal | Mild | Moderate | Severe malnutrition | Overweight"
        }
      ]
    },
    {
      "id": "immunisation_record",
      "title": "Immunisation Record Form",
      "purpose": "Capture and save immunisation record form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Child patient - auto-filled"
        },
        {
          "key": "vaccine",
          "label": "Vaccine",
          "type": "select",
          "required": true,
          "options": [
            "BCG",
            "OPV0",
            "HepB birth",
            "Penta",
            "PCV",
            "Rota",
            "MR",
            "Yellow Fever",
            "Others"
          ],
          "note": "BCG | OPV0 | HepB birth | Penta | PCV | Rota | MR | Yellow Fever | Others"
        },
        {
          "key": "dose_number",
          "label": "Dose number",
          "type": "select",
          "required": true,
          "options": [
            "Dose 1",
            "2",
            "3",
            "Booster per Kenya EPI schedule"
          ],
          "note": "Dose 1 | 2 | 3 | Booster per Kenya EPI schedule"
        },
        {
          "key": "date_administered",
          "label": "Date administered",
          "type": "date",
          "required": true,
          "note": "Date vaccine was given"
        },
        {
          "key": "batch_number",
          "label": "Batch number",
          "type": "text",
          "required": true,
          "note": "Vaccine batch for traceability"
        },
        {
          "key": "expiry_date",
          "label": "Expiry date",
          "type": "date",
          "required": true,
          "note": "Vaccine vial expiry date"
        },
        {
          "key": "administration_site",
          "label": "Administration site",
          "type": "select",
          "required": true,
          "options": [
            "Left deltoid",
            "Right anterolateral thigh",
            "Oral"
          ],
          "note": "Left deltoid | Right anterolateral thigh | Oral"
        },
        {
          "key": "route",
          "label": "Route",
          "type": "select",
          "required": true,
          "options": [
            "IM",
            "SC",
            "ID",
            "Oral",
            "Intranasal"
          ],
          "note": "IM | SC | ID | Oral | Intranasal"
        },
        {
          "key": "administered_by",
          "label": "Administered by",
          "type": "text",
          "required": true,
          "note": "Auto-filled - vaccinating nurse"
        },
        {
          "key": "adverse_reaction_noted",
          "label": "Adverse reaction noted",
          "type": "text",
          "required": false,
          "note": "Any immediate adverse events observed"
        }
      ]
    },
    {
      "id": "imci_assessment",
      "title": "IMCI Assessment Form",
      "purpose": "Capture and save imci assessment form data.",
      "fields": [
        {
          "key": "age_of_child",
          "label": "Age of child",
          "type": "text",
          "required": true,
          "note": "Auto-calculated - IMCI applies to 2 months to 5 years"
        },
        {
          "key": "danger_signs",
          "label": "Danger signs",
          "type": "text",
          "required": true,
          "note": "Cannot feed | Vomits everything | Convulsions | Lethargic/unconscious"
        },
        {
          "key": "main_symptoms",
          "label": "Main symptoms",
          "type": "text",
          "required": true,
          "note": "Cough | Diarrhoea | Fever | Ear problem | Malnutrition/anaemia"
        },
        {
          "key": "cough_duration_days",
          "label": "Cough duration (days)",
          "type": "number",
          "required": false,
          "note": "If cough present"
        },
        {
          "key": "diarrhoea_duration_days",
          "label": "Diarrhoea duration (days)",
          "type": "number",
          "required": false,
          "note": "If diarrhoea present"
        },
        {
          "key": "fever_duration_days",
          "label": "Fever duration (days)",
          "type": "number",
          "required": false,
          "note": "If fever present"
        },
        {
          "key": "malaria_rdt_result",
          "label": "Malaria RDT result",
          "type": "select",
          "required": false,
          "options": [
            "Positive",
            "Negative",
            "Not done"
          ],
          "note": "Positive | Negative | Not done"
        },
        {
          "key": "imci_classification",
          "label": "IMCI classification",
          "type": "text",
          "required": true,
          "note": "IMCI disease classification based on findings"
        },
        {
          "key": "treatment",
          "label": "Treatment",
          "type": "text",
          "required": true,
          "note": "IMCI standard treatment per classification"
        }
      ]
    }
  ],
  "69": [
    {
      "id": "home_care_plan",
      "title": "Home Care Plan Form",
      "purpose": "Capture and save home care plan form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Discharged patient - auto-filled"
        },
        {
          "key": "linked_discharge_summary",
          "label": "Linked discharge summary",
          "type": "text",
          "required": false,
          "note": "Auto-linked from discharge"
        },
        {
          "key": "assigned_nurse",
          "label": "Assigned nurse",
          "type": "select",
          "required": true,
          "note": "Primary home care nurse"
        },
        {
          "key": "start_date",
          "label": "Start date",
          "type": "date",
          "required": true,
          "note": "Home care commencement date"
        },
        {
          "key": "services_required",
          "label": "Services required",
          "type": "text",
          "required": true,
          "note": "Wound care | Medication | Physiotherapy | Palliative | Monitoring | Dialysis"
        },
        {
          "key": "visit_frequency",
          "label": "Visit frequency",
          "type": "select",
          "required": true,
          "options": [
            "Daily",
            "Alternate days",
            "Twice weekly",
            "Weekly"
          ],
          "note": "Daily | Alternate days | Twice weekly | Weekly"
        },
        {
          "key": "equipment_to_provide",
          "label": "Equipment to provide",
          "type": "text",
          "required": false,
          "note": "Equipment name, delivery date, return date"
        },
        {
          "key": "goals",
          "label": "Goals",
          "type": "textarea",
          "required": true,
          "note": "Recovery targets and measurable outcomes"
        },
        {
          "key": "emergency_escalation_plan",
          "label": "Emergency escalation plan",
          "type": "textarea",
          "required": true,
          "note": "Criteria for calling for help and contact numbers"
        }
      ]
    },
    {
      "id": "home_visit_record",
      "title": "Home Visit Record Form",
      "purpose": "Capture and save home visit record form data.",
      "fields": [
        {
          "key": "care_plan",
          "label": "Care plan",
          "type": "text",
          "required": true,
          "note": "Auto-linked plan"
        },
        {
          "key": "visit_date",
          "label": "Visit date",
          "type": "date",
          "required": true,
          "note": "Date of visit"
        },
        {
          "key": "gps_location",
          "label": "GPS location",
          "type": "text",
          "required": true,
          "note": "Auto-capture GPS at visit - confirms home location"
        },
        {
          "key": "visit_start_time",
          "label": "Visit start time",
          "type": "time",
          "required": true,
          "note": "Arrival time"
        },
        {
          "key": "visit_end_time",
          "label": "Visit end time",
          "type": "time",
          "required": true,
          "note": "Departure time"
        },
        {
          "key": "vital_signs",
          "label": "Vital signs",
          "type": "text",
          "required": true,
          "options": [
            "BP",
            "HR",
            "Temp",
            "SpO2",
            "Weight"
          ],
          "note": "BP | HR | Temp | SpO2 | Weight"
        },
        {
          "key": "clinical_findings",
          "label": "Clinical findings",
          "type": "textarea",
          "required": true,
          "note": "Assessment findings"
        },
        {
          "key": "interventions_performed",
          "label": "Interventions performed",
          "type": "textarea",
          "required": true,
          "note": "Care activities done - wound care, injections, monitoring"
        },
        {
          "key": "medications_given",
          "label": "Medications given",
          "type": "text",
          "required": false,
          "note": "Drugs administered during visit"
        },
        {
          "key": "patient_concerns",
          "label": "Patient concerns",
          "type": "text",
          "required": false,
          "note": "Issues raised by patient or caregiver"
        },
        {
          "key": "escalation_required",
          "label": "Escalation required",
          "type": "text",
          "required": true,
          "options": [
            "Yes - needs hospital",
            "No - continue at home"
          ],
          "note": "Yes - needs hospital | No - continue at home"
        },
        {
          "key": "escalation_reason",
          "label": "Escalation reason",
          "type": "text",
          "required": false,
          "note": "Clinical reason if escalation needed"
        }
      ]
    }
  ],
  "70": [
    {
      "id": "research_protocol_registration",
      "title": "Research Protocol Registration Form",
      "purpose": "Capture and save research protocol registration form data.",
      "fields": [
        {
          "key": "protocol_number",
          "label": "Protocol number",
          "type": "text",
          "required": true,
          "note": "Unique protocol identifier"
        },
        {
          "key": "full_title",
          "label": "Full title",
          "type": "textarea",
          "required": true,
          "note": "Complete protocol title"
        },
        {
          "key": "short_title",
          "label": "Short title",
          "type": "text",
          "required": true,
          "note": "Abbreviated title for display"
        },
        {
          "key": "study_type",
          "label": "Study type",
          "type": "select",
          "required": true,
          "options": [
            "Interventional",
            "Observational",
            "Diagnostic",
            "Registry",
            "Survey"
          ],
          "note": "Interventional | Observational | Diagnostic | Registry | Survey"
        },
        {
          "key": "phase",
          "label": "Phase",
          "type": "select",
          "required": false,
          "options": [
            "I",
            "II",
            "III",
            "IV",
            "Not applicable - for clinical trials"
          ],
          "note": "I | II | III | IV | Not applicable - for clinical trials"
        },
        {
          "key": "sponsor",
          "label": "Sponsor",
          "type": "text",
          "required": true,
          "note": "Funding organisation or sponsor"
        },
        {
          "key": "principal_investigator",
          "label": "Principal investigator",
          "type": "select",
          "required": true,
          "note": "Select from qualified staff"
        },
        {
          "key": "irb_approval_number",
          "label": "IRB approval number",
          "type": "text",
          "required": true,
          "note": "Ethics committee approval reference"
        },
        {
          "key": "irb_approval_date",
          "label": "IRB approval date",
          "type": "date",
          "required": true,
          "note": "Date ethics approval was granted"
        },
        {
          "key": "irb_expiry_date",
          "label": "IRB expiry date",
          "type": "date",
          "required": true,
          "note": "Ethics approval expiry - system sends renewal alerts"
        },
        {
          "key": "target_enrolment",
          "label": "Target enrolment",
          "type": "number",
          "required": true,
          "note": "Number of participants to recruit"
        },
        {
          "key": "inclusion_criteria",
          "label": "Inclusion criteria",
          "type": "textarea",
          "required": true,
          "note": "Who may participate"
        },
        {
          "key": "exclusion_criteria",
          "label": "Exclusion criteria",
          "type": "textarea",
          "required": true,
          "note": "Who may not participate"
        }
      ]
    },
    {
      "id": "patient_enrolment",
      "title": "Patient Enrolment Form",
      "purpose": "Capture and save patient enrolment form data.",
      "fields": [
        {
          "key": "patient",
          "label": "Patient",
          "type": "text",
          "required": true,
          "note": "Patient MRN - check inclusion/exclusion criteria"
        },
        {
          "key": "protocol",
          "label": "Protocol",
          "type": "text",
          "required": true,
          "note": "Study being enrolled into"
        },
        {
          "key": "screen_date",
          "label": "Screen date",
          "type": "date",
          "required": true,
          "note": "Date screening was performed"
        },
        {
          "key": "screening_passed",
          "label": "Screening passed",
          "type": "text",
          "required": true,
          "options": [
            "Yes - enrol",
            "No - screen failure"
          ],
          "note": "Yes - enrol | No - screen failure"
        },
        {
          "key": "screen_failure_reason",
          "label": "Screen failure reason",
          "type": "text",
          "required": false,
          "note": "If failed - which criterion was not met"
        },
        {
          "key": "consent_record",
          "label": "Consent record",
          "type": "text",
          "required": true,
          "note": "Research consent must be recorded first"
        },
        {
          "key": "study_arm",
          "label": "Study arm",
          "type": "select",
          "required": false,
          "options": [
            "Treatment",
            "Placebo",
            "Control - for randomised trials"
          ],
          "note": "Treatment | Placebo | Control - for randomised trials"
        },
        {
          "key": "enrolment_date",
          "label": "Enrolment date",
          "type": "date",
          "required": true,
          "note": "Date patient officially enrolled"
        }
      ]
    },
    {
      "id": "adverse_event_report",
      "title": "Adverse Event Report Form",
      "purpose": "Capture and save adverse event report form data.",
      "fields": [
        {
          "key": "participant",
          "label": "Participant",
          "type": "text",
          "required": true,
          "note": "Study participant"
        },
        {
          "key": "ae_description",
          "label": "AE description",
          "type": "textarea",
          "required": true,
          "note": "Detailed description of adverse event"
        },
        {
          "key": "onset_date",
          "label": "Onset date",
          "type": "date",
          "required": true,
          "note": "When the AE began"
        },
        {
          "key": "ctcae_grade",
          "label": "CTCAE grade",
          "type": "select",
          "required": true,
          "options": [
            "Grade 1 (mild)",
            "2",
            "3",
            "4",
            "5 (death)"
          ],
          "note": "Grade 1 (mild) | 2 | 3 | 4 | 5 (death)"
        },
        {
          "key": "is_serious",
          "label": "Is serious",
          "type": "text",
          "required": true,
          "options": [
            "Yes (SAE)",
            "No (AE) - serious = hospitalisation, life-threatening, death, disability"
          ],
          "note": "Yes (SAE) | No (AE) - serious = hospitalisation, life-threatening, death, disability"
        },
        {
          "key": "sae_criteria_met",
          "label": "SAE criteria met",
          "type": "text",
          "required": false,
          "note": "Death | Life-threatening | Hospitalisation | Disability | Congenital"
        },
        {
          "key": "relatedness_to_study",
          "label": "Relatedness to study",
          "type": "select",
          "required": true,
          "options": [
            "Unrelated",
            "Unlikely",
            "Possible",
            "Probable",
            "Definite"
          ],
          "note": "Unrelated | Unlikely | Possible | Probable | Definite"
        },
        {
          "key": "action_taken",
          "label": "Action taken",
          "type": "select",
          "required": true,
          "options": [
            "None",
            "Dose reduced",
            "Drug stopped",
            "Treated symptomatically"
          ],
          "note": "None | Dose reduced | Drug stopped | Treated symptomatically"
        },
        {
          "key": "outcome",
          "label": "Outcome",
          "type": "select",
          "required": true,
          "options": [
            "Resolved",
            "Resolving",
            "Not resolved",
            "Fatal",
            "Unknown"
          ],
          "note": "Resolved | Resolving | Not resolved | Fatal | Unknown"
        },
        {
          "key": "reported_to_sponsor",
          "label": "Reported to sponsor",
          "type": "datetime",
          "required": false,
          "note": "When SAE was reported to study sponsor - required within 24h for SAEs"
        }
      ]
    }
  ]
};

export const GENERATED_WORKFLOW_MODULES: WorkflowModule[] = [
  {
    "id": 48,
    "name": "Ambulance",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Ambulance records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "dispatch",
        "title": "Dispatch Form",
        "purpose": "Capture and save dispatch form data.",
        "fields": [
          {
            "key": "call_received_time",
            "label": "Call received time",
            "type": "datetime-local",
            "required": true,
            "note": "Exact time emergency call was received"
          },
          {
            "key": "caller_name",
            "label": "Caller name",
            "type": "text",
            "required": false,
            "note": "Name of person who called"
          },
          {
            "key": "caller_phone",
            "label": "Caller phone",
            "type": "tel",
            "required": true,
            "note": "Phone number of caller"
          },
          {
            "key": "scene_address",
            "label": "Scene address",
            "type": "text",
            "required": true,
            "note": "Location of emergency - as specific as possible"
          },
          {
            "key": "gps_coordinates",
            "label": "GPS coordinates",
            "type": "text",
            "required": false,
            "note": "Auto-capture GPS from caller or map pin"
          },
          {
            "key": "call_type",
            "label": "Call type",
            "type": "select",
            "required": true,
            "options": [
              "Medical",
              "Trauma",
              "Obstetric",
              "Paediatric",
              "Cardiac",
              "Psychiatric",
              "Fire",
              "RTA"
            ],
            "note": "Medical | Trauma | Obstetric | Paediatric | Cardiac | Psychiatric | Fire | RTA"
          },
          {
            "key": "patient_condition",
            "label": "Patient condition",
            "type": "text",
            "required": false,
            "note": "Brief patient status from caller"
          },
          {
            "key": "ambulance_assigned",
            "label": "Ambulance assigned",
            "type": "select",
            "required": true,
            "note": "Vehicle to dispatch"
          },
          {
            "key": "crew_assigned",
            "label": "Crew assigned",
            "type": "select",
            "required": true,
            "note": "Paramedic team for this call"
          },
          {
            "key": "dispatch_time",
            "label": "Dispatch time",
            "type": "datetime-local",
            "required": true,
            "note": "Time ambulance was dispatched"
          }
        ]
      },
      {
        "id": "scene_report",
        "title": "Scene Report Form",
        "purpose": "Capture and save scene report form data.",
        "fields": [
          {
            "key": "en_route_time",
            "label": "En route time",
            "type": "time",
            "required": true,
            "note": "Time vehicle started moving"
          },
          {
            "key": "scene_arrival_time",
            "label": "Scene arrival time",
            "type": "time",
            "required": true,
            "note": "Time vehicle arrived at scene"
          },
          {
            "key": "patient_found",
            "label": "Patient found",
            "type": "select",
            "required": true,
            "options": [
              "Yes",
              "No",
              "Deceased at scene"
            ],
            "note": "Yes | No | Deceased at scene"
          },
          {
            "key": "patient_name",
            "label": "Patient name",
            "type": "text",
            "required": false,
            "note": "Patient name if obtainable"
          },
          {
            "key": "age_estimate",
            "label": "Age estimate",
            "type": "text",
            "required": false,
            "note": "Estimated age if ID not available"
          },
          {
            "key": "scene_assessment",
            "label": "Scene assessment",
            "type": "textarea",
            "required": true,
            "note": "Scene safety, mechanism, patient condition"
          },
          {
            "key": "vital_signs_at_scene",
            "label": "Vital signs at scene",
            "type": "text",
            "required": true,
            "note": "BP, HR, RR, SpO2, GCS, Temp"
          },
          {
            "key": "pre_hospital_interventions",
            "label": "Pre-hospital interventions",
            "type": "textarea",
            "required": true,
            "note": "Airway management, IV access, drugs given, immobilisation"
          },
          {
            "key": "departed_scene_time",
            "label": "Departed scene time",
            "type": "time",
            "required": true,
            "note": "Time vehicle left scene"
          },
          {
            "key": "hospital_arrival_time",
            "label": "Hospital arrival time",
            "type": "time",
            "required": true,
            "note": "Time patient arrived at hospital"
          },
          {
            "key": "handover_to",
            "label": "Handover to",
            "type": "text",
            "required": true,
            "note": "Name of receiving clinician"
          },
          {
            "key": "handover_notes",
            "label": "Handover notes",
            "type": "textarea",
            "required": true,
            "note": "Verbal handover content documented"
          }
        ]
      },
      {
        "id": "fleet_maintenance_record",
        "title": "Fleet Maintenance Record",
        "purpose": "Capture and save fleet maintenance record data.",
        "fields": [
          {
            "key": "ambulance",
            "label": "Ambulance",
            "type": "select",
            "required": true,
            "note": "Vehicle registration"
          },
          {
            "key": "maintenance_type",
            "label": "Maintenance type",
            "type": "select",
            "required": true,
            "options": [
              "Preventive",
              "Corrective",
              "Inspection"
            ],
            "note": "Preventive | Corrective | Inspection"
          },
          {
            "key": "service_date",
            "label": "Service date",
            "type": "date",
            "required": true,
            "note": "Date of service"
          },
          {
            "key": "mileage",
            "label": "Mileage",
            "type": "number",
            "required": true,
            "note": "Odometer reading at service"
          },
          {
            "key": "work_performed",
            "label": "Work performed",
            "type": "textarea",
            "required": true,
            "note": "Description of maintenance work done"
          },
          {
            "key": "parts_replaced",
            "label": "Parts replaced",
            "type": "text",
            "required": false,
            "note": "Parts or consumables replaced"
          },
          {
            "key": "cost_kes",
            "label": "Cost (KES)",
            "type": "number",
            "required": false,
            "note": "Total maintenance cost"
          },
          {
            "key": "next_service_due",
            "label": "Next service due",
            "type": "date",
            "required": true,
            "note": "Next scheduled maintenance date"
          },
          {
            "key": "serviced_by",
            "label": "Serviced by",
            "type": "text",
            "required": true,
            "note": "Mechanic or garage name"
          }
        ]
      }
    ]
  },
  {
    "id": 49,
    "name": "Pharmacy POS",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Pharmacy POS records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "retail_sale",
        "title": "Retail Sale Form",
        "purpose": "Capture and save retail sale form data.",
        "fields": [
          {
            "key": "customer_type",
            "label": "Customer type",
            "type": "select",
            "required": true,
            "options": [
              "Patient",
              "Visitor",
              "Staff",
              "Walk-in"
            ],
            "note": "Patient | Visitor | Staff | Walk-in"
          },
          {
            "key": "patient_mrn",
            "label": "Patient MRN",
            "type": "text",
            "required": false,
            "note": "If selling to registered patient"
          },
          {
            "key": "drug_item",
            "label": "Drug / item",
            "type": "text",
            "required": true,
            "note": "Search from formulary or OTC list"
          },
          {
            "key": "quantity",
            "label": "Quantity",
            "type": "number",
            "required": true,
            "note": "Number of units to sell"
          },
          {
            "key": "unit_price",
            "label": "Unit price",
            "type": "text",
            "required": true,
            "note": "Auto-filled from formulary selling price"
          },
          {
            "key": "payment_method",
            "label": "Payment method",
            "type": "select",
            "required": true,
            "options": [
              "Cash",
              "MPESA",
              "Card",
              "Staff deduction"
            ],
            "note": "Cash | MPESA | Card | Staff deduction"
          },
          {
            "key": "mpesa_reference",
            "label": "MPESA reference",
            "type": "text",
            "required": false,
            "note": "M-Pesa transaction code if MPESA payment"
          },
          {
            "key": "print_receipt",
            "label": "Print receipt",
            "type": "checkbox",
            "required": true,
            "note": "Auto-selected - generates receipt on confirm"
          }
        ]
      }
    ]
  },
  {
    "id": 50,
    "name": "NICU",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture NICU records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "nicu_admission",
        "title": "NICU Admission Form",
        "purpose": "Capture and save nicu admission form data.",
        "fields": [
          {
            "key": "baby_patient",
            "label": "Baby patient",
            "type": "text",
            "required": true,
            "note": "Auto-filled from newborn registration"
          },
          {
            "key": "mother_patient",
            "label": "Mother patient",
            "type": "text",
            "required": true,
            "note": "Auto-filled from delivery record"
          },
          {
            "key": "gestational_age",
            "label": "Gestational age",
            "type": "number",
            "required": true,
            "note": "Gestational age in weeks at birth"
          },
          {
            "key": "birth_weight_grams",
            "label": "Birth weight (grams)",
            "type": "number",
            "required": true,
            "note": "Birth weight"
          },
          {
            "key": "apgar_scores",
            "label": "APGAR scores",
            "type": "text",
            "required": true,
            "note": "Auto-filled from delivery record"
          },
          {
            "key": "admission_diagnosis",
            "label": "Admission diagnosis",
            "type": "text",
            "required": true,
            "note": "Primary reason for NICU admission"
          },
          {
            "key": "admission_source",
            "label": "Admission source",
            "type": "select",
            "required": true,
            "options": [
              "Delivery room",
              "Ward",
              "Emergency",
              "Transfer"
            ],
            "note": "Delivery room | Ward | Emergency | Transfer"
          },
          {
            "key": "incubator_assigned",
            "label": "Incubator assigned",
            "type": "select",
            "required": true,
            "note": "Select available incubator"
          },
          {
            "key": "code_status",
            "label": "Code status",
            "type": "select",
            "required": true,
            "options": [
              "Full resuscitation",
              "Comfort care",
              "DNR"
            ],
            "note": "Full resuscitation | Comfort care | DNR"
          },
          {
            "key": "consent_obtained",
            "label": "Consent obtained",
            "type": "checkbox",
            "required": true,
            "note": "Parent/guardian consent for NICU care"
          }
        ]
      },
      {
        "id": "nicu_daily_record",
        "title": "NICU Daily Record Form",
        "purpose": "Capture and save nicu daily record form data.",
        "fields": [
          {
            "key": "day_of_life",
            "label": "Day of life",
            "type": "text",
            "required": true,
            "note": "Auto-calculated from birth date"
          },
          {
            "key": "weight_grams",
            "label": "Weight (grams)",
            "type": "number",
            "required": true,
            "note": "Daily weight - expected trajectory tracked"
          },
          {
            "key": "temperature_c",
            "label": "Temperature (°C)",
            "type": "number",
            "required": true,
            "note": "Axillary temperature"
          },
          {
            "key": "incubator_temperature",
            "label": "Incubator temperature",
            "type": "number",
            "required": true,
            "note": "Set temperature of incubator"
          },
          {
            "key": "incubator_humidity",
            "label": "Incubator humidity (%)",
            "type": "number",
            "required": false,
            "note": "Relative humidity set in incubator"
          },
          {
            "key": "respiratory_support",
            "label": "Respiratory support",
            "type": "select",
            "required": true,
            "options": [
              "None",
              "Oxygen",
              "CPAP",
              "HFNC",
              "Ventilator"
            ],
            "note": "None | Oxygen | CPAP | HFNC | Ventilator"
          },
          {
            "key": "fio2",
            "label": "FiO2 (%)",
            "type": "number",
            "required": false,
            "note": "Oxygen concentration if on support"
          },
          {
            "key": "spo2",
            "label": "SpO2 (%)",
            "type": "number",
            "required": true,
            "note": "Target 90-95% for premature babies"
          },
          {
            "key": "phototherapy",
            "label": "Phototherapy",
            "type": "checkbox",
            "required": true,
            "note": "Tick if phototherapy active"
          },
          {
            "key": "phototherapy_hours_today",
            "label": "Phototherapy hours today",
            "type": "number",
            "required": false,
            "note": "Hours under phototherapy this day"
          },
          {
            "key": "bilirubin_mol_l",
            "label": "Bilirubin (µmol/L)",
            "type": "number",
            "required": false,
            "note": "Total serum bilirubin"
          },
          {
            "key": "feeding_type",
            "label": "Feeding type",
            "type": "select",
            "required": true,
            "options": [
              "Breast milk",
              "Formula",
              "Donor milk",
              "NPO"
            ],
            "note": "Breast milk | Formula | Donor milk | NPO"
          },
          {
            "key": "feed_volume_ml_kg_day",
            "label": "Feed volume (mL/kg/day)",
            "type": "number",
            "required": true,
            "note": "Total daily feed volume"
          },
          {
            "key": "iv_fluid_rate_ml_kg_day",
            "label": "IV fluid rate (mL/kg/day)",
            "type": "number",
            "required": false,
            "note": "IV maintenance fluid rate"
          },
          {
            "key": "kangaroo_care_hours",
            "label": "Kangaroo care hours",
            "type": "number",
            "required": false,
            "note": "Hours of skin-to-skin care today"
          },
          {
            "key": "antibiotics",
            "label": "Antibiotics",
            "type": "text",
            "required": false,
            "note": "Current antibiotic drugs and day of treatment"
          },
          {
            "key": "assessment_notes",
            "label": "Assessment notes",
            "type": "textarea",
            "required": true,
            "note": "Daily clinical assessment narrative"
          }
        ]
      }
    ]
  },
  {
    "id": 51,
    "name": "Mortuary",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Mortuary records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "body_reception",
        "title": "Body Reception Form",
        "purpose": "Capture and save body reception form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": false,
            "note": "Link to patient MRN if known"
          },
          {
            "key": "body_received_from",
            "label": "Body received from",
            "type": "select",
            "required": true,
            "options": [
              "Inpatient ward",
              "Emergency",
              "Theatre",
              "Home",
              "Scene",
              "Police",
              "Coroner"
            ],
            "note": "Inpatient ward | Emergency | Theatre | Home | Scene | Police | Coroner"
          },
          {
            "key": "received_at_time",
            "label": "Received at time",
            "type": "datetime",
            "required": true,
            "note": "Time body arrived in mortuary"
          },
          {
            "key": "sex",
            "label": "Sex",
            "type": "select",
            "required": true,
            "options": [
              "Male",
              "Female",
              "Unknown"
            ],
            "note": "Male | Female | Unknown"
          },
          {
            "key": "approximate_age",
            "label": "Approximate age",
            "type": "text",
            "required": false,
            "note": "Estimated age if identity not confirmed"
          },
          {
            "key": "body_condition",
            "label": "Body condition",
            "type": "select",
            "required": true,
            "options": [
              "Fresh",
              "Early decomposition",
              "Advanced decomposition",
              "Embalmed"
            ],
            "note": "Fresh | Early decomposition | Advanced decomposition | Embalmed"
          },
          {
            "key": "identifying_features",
            "label": "Identifying features",
            "type": "textarea",
            "required": false,
            "note": "Physical description for identification"
          },
          {
            "key": "compartment_assigned",
            "label": "Compartment assigned",
            "type": "select",
            "required": true,
            "note": "Cold storage compartment number"
          },
          {
            "key": "police_case",
            "label": "Police case",
            "type": "checkbox",
            "required": true,
            "note": "Tick if death involves police investigation"
          },
          {
            "key": "police_reference",
            "label": "Police reference",
            "type": "text",
            "required": false,
            "note": "OB number or case reference"
          },
          {
            "key": "accompanying_documentation",
            "label": "Accompanying documentation",
            "type": "text",
            "required": true,
            "note": "Death notification | Medical certificate | Police release"
          }
        ]
      },
      {
        "id": "death_certificate",
        "title": "Death Certificate Form",
        "purpose": "Capture and save death certificate form data.",
        "fields": [
          {
            "key": "deceased_name",
            "label": "Deceased name",
            "type": "text",
            "required": true,
            "note": "Full legal name"
          },
          {
            "key": "date_of_death",
            "label": "Date of death",
            "type": "date",
            "required": true,
            "note": "Certified date of death"
          },
          {
            "key": "time_of_death",
            "label": "Time of death",
            "type": "time",
            "required": false,
            "note": "Time if known"
          },
          {
            "key": "place_of_death",
            "label": "Place of death",
            "type": "text",
            "required": true,
            "note": "Hospital name and ward or location"
          },
          {
            "key": "cause_ia_immediate_cause",
            "label": "Cause Ia — Immediate cause",
            "type": "text",
            "required": true,
            "note": "Disease directly causing death"
          },
          {
            "key": "cause_ib_antecedent_cause",
            "label": "Cause Ib — Antecedent cause",
            "type": "text",
            "required": false,
            "note": "Disease leading to immediate cause"
          },
          {
            "key": "cause_ic_underlying_cause",
            "label": "Cause Ic — Underlying cause",
            "type": "text",
            "required": false,
            "note": "Disease leading to Ib"
          },
          {
            "key": "cause_ii_contributing_conditions",
            "label": "Cause II — Contributing conditions",
            "type": "text",
            "required": false,
            "note": "Other conditions contributing to death"
          },
          {
            "key": "icd_10_code",
            "label": "ICD-10 code",
            "type": "text",
            "required": true,
            "note": "Code for underlying cause of death"
          },
          {
            "key": "manner_of_death",
            "label": "Manner of death",
            "type": "select",
            "required": true,
            "options": [
              "Natural",
              "Accident",
              "Homicide",
              "Suicide",
              "Undetermined"
            ],
            "note": "Natural | Accident | Homicide | Suicide | Undetermined"
          },
          {
            "key": "post_mortem_performed",
            "label": "Post-mortem performed",
            "type": "text",
            "required": true,
            "options": [
              "Yes",
              "No"
            ],
            "note": "Yes | No"
          },
          {
            "key": "certifying_doctor",
            "label": "Certifying doctor",
            "type": "text",
            "required": true,
            "note": "Auto-filled - logged in doctor"
          }
        ]
      },
      {
        "id": "body_release",
        "title": "Body Release Form",
        "purpose": "Capture and save body release form data.",
        "fields": [
          {
            "key": "released_to_name",
            "label": "Released to name",
            "type": "text",
            "required": true,
            "note": "Full name of person collecting body"
          },
          {
            "key": "collector_id_number",
            "label": "Collector ID number",
            "type": "text",
            "required": true,
            "note": "National ID of collector"
          },
          {
            "key": "relationship_to_deceased",
            "label": "Relationship to deceased",
            "type": "select",
            "required": true,
            "options": [
              "Spouse",
              "Parent",
              "Child",
              "Sibling",
              "Funeral home",
              "Other"
            ],
            "note": "Spouse | Parent | Child | Sibling | Funeral home | Other"
          },
          {
            "key": "funeral_home_name",
            "label": "Funeral home name",
            "type": "text",
            "required": false,
            "note": "If released to funeral home"
          },
          {
            "key": "burial_permit_number",
            "label": "Burial permit number",
            "type": "text",
            "required": true,
            "note": "County burial permit reference"
          },
          {
            "key": "death_certificate_issued",
            "label": "Death certificate issued",
            "type": "checkbox",
            "required": true,
            "note": "Confirm death certificate was given"
          },
          {
            "key": "outstanding_bill_cleared",
            "label": "Outstanding bill cleared",
            "type": "checkbox",
            "required": true,
            "note": "Confirm hospital bill is fully settled"
          }
        ]
      }
    ]
  },
  {
    "id": 52,
    "name": "Clinical Decision Support (CDSS)",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Clinical Decision Support (CDSS) records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "cdss_rule_configuration",
        "title": "CDSS Rule Configuration Form",
        "purpose": "Capture and save cdss rule configuration form data.",
        "fields": [
          {
            "key": "rule_name",
            "label": "Rule name",
            "type": "text",
            "required": true,
            "note": "Descriptive name for the clinical rule"
          },
          {
            "key": "trigger_event",
            "label": "Trigger event",
            "type": "select",
            "required": true,
            "options": [
              "Prescribe",
              "Order lab",
              "Admit",
              "Vital sign",
              "Discharge",
              "Result"
            ],
            "note": "Prescribe | Order lab | Admit | Vital sign | Discharge | Result"
          },
          {
            "key": "condition_logic",
            "label": "Condition logic",
            "type": "text",
            "required": true,
            "note": "SQL or JSON rule expression evaluated against patient data"
          },
          {
            "key": "alert_severity",
            "label": "Alert severity",
            "type": "select",
            "required": true,
            "options": [
              "Info",
              "Warning",
              "Critical",
              "Hard stop"
            ],
            "note": "Info | Warning | Critical | Hard stop"
          },
          {
            "key": "alert_message",
            "label": "Alert message",
            "type": "textarea",
            "required": true,
            "note": "Message shown to clinician when rule fires"
          },
          {
            "key": "can_be_overridden",
            "label": "Can be overridden",
            "type": "checkbox",
            "required": true,
            "note": "Untick for hard stops that cannot be bypassed"
          },
          {
            "key": "override_requires_reason",
            "label": "Override requires reason",
            "type": "checkbox",
            "required": true,
            "note": "Tick to require documented justification"
          },
          {
            "key": "guideline_source",
            "label": "Guideline source",
            "type": "text",
            "required": false,
            "note": "Evidence source e.g. WHO, Kenya National Formulary 2023"
          }
        ]
      },
      {
        "id": "cdss_alert_override",
        "title": "CDSS Alert Override Form",
        "purpose": "Capture and save cdss alert override form data.",
        "fields": [
          {
            "key": "alert",
            "label": "Alert",
            "type": "text",
            "required": true,
            "note": "Rule that fired - shown in context"
          },
          {
            "key": "override_reason",
            "label": "Override reason",
            "type": "select",
            "required": true,
            "options": [
              "Benefit outweighs risk",
              "Alternative not available",
              "Patient specific factor",
              "Allergist reviewed"
            ],
            "note": "Benefit outweighs risk | Alternative not available | Patient specific factor | Allergist reviewed"
          },
          {
            "key": "clinical_justification",
            "label": "Clinical justification",
            "type": "textarea",
            "required": true,
            "note": "Detailed clinical reasoning for overriding the alert"
          }
        ]
      }
    ]
  },
  {
    "id": 53,
    "name": "AI Analytics",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture AI Analytics records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "ai_alert_review",
        "title": "AI Alert Review Form",
        "purpose": "Capture and save ai alert review form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Patient flagged by AI model"
          },
          {
            "key": "risk_type",
            "label": "Risk type",
            "type": "text",
            "required": true,
            "options": [
              "Readmission",
              "Deterioration",
              "Sepsis",
              "Revenue anomaly"
            ],
            "note": "Readmission | Deterioration | Sepsis | Revenue anomaly"
          },
          {
            "key": "risk_score",
            "label": "Risk score",
            "type": "text",
            "required": true,
            "note": "AI confidence score 0-100%"
          },
          {
            "key": "contributing_factors",
            "label": "Contributing factors",
            "type": "text",
            "required": true,
            "note": "Factors the AI used to determine risk"
          },
          {
            "key": "clinician_assessment",
            "label": "Clinician assessment",
            "type": "select",
            "required": true,
            "options": [
              "Agree - will act",
              "Disagree - not at risk",
              "Uncertain"
            ],
            "note": "Agree - will act | Disagree - not at risk | Uncertain"
          },
          {
            "key": "action_planned",
            "label": "Action planned",
            "type": "textarea",
            "required": false,
            "note": "What action will be taken in response to this alert"
          },
          {
            "key": "review_notes",
            "label": "Review notes",
            "type": "text",
            "required": false,
            "note": "Any clinical notes on the AI prediction"
          }
        ]
      }
    ]
  },
  {
    "id": 54,
    "name": "Helpdesk",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Helpdesk records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "support_ticket",
        "title": "Support Ticket Form",
        "purpose": "Capture and save support ticket form data.",
        "fields": [
          {
            "key": "category",
            "label": "Category",
            "type": "select",
            "required": true,
            "options": [
              "IT",
              "Maintenance",
              "Biomedical",
              "Housekeeping",
              "HR",
              "Security"
            ],
            "note": "IT | Maintenance | Biomedical | Housekeeping | HR | Security"
          },
          {
            "key": "sub_category",
            "label": "Sub-category",
            "type": "select",
            "required": true,
            "options": [
              "Network",
              "Hardware",
              "Plumbing",
              "Electrical",
              "Equipment",
              "Other"
            ],
            "note": "Network | Hardware | Plumbing | Electrical | Equipment | Other"
          },
          {
            "key": "priority",
            "label": "Priority",
            "type": "select",
            "required": true,
            "options": [
              "Low",
              "Medium",
              "High",
              "Critical"
            ],
            "note": "Low | Medium | High | Critical"
          },
          {
            "key": "title",
            "label": "Title",
            "type": "text",
            "required": true,
            "note": "Short issue description - max 100 characters"
          },
          {
            "key": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "note": "Detailed description - what happened, when, impact"
          },
          {
            "key": "affected_asset",
            "label": "Affected asset",
            "type": "select",
            "required": false,
            "note": "Asset from asset register if applicable"
          },
          {
            "key": "attach_screenshot",
            "label": "Attach screenshot",
            "type": "text",
            "required": false,
            "note": "Screenshot or photo of the issue"
          }
        ]
      },
      {
        "id": "ticket_resolution",
        "title": "Ticket Resolution Form",
        "purpose": "Capture and save ticket resolution form data.",
        "fields": [
          {
            "key": "resolution_notes",
            "label": "Resolution notes",
            "type": "textarea",
            "required": true,
            "note": "What was done to resolve the issue"
          },
          {
            "key": "time_spent_hours",
            "label": "Time spent (hours)",
            "type": "number",
            "required": true,
            "note": "Total time to resolve"
          },
          {
            "key": "parts_used",
            "label": "Parts used",
            "type": "text",
            "required": false,
            "note": "Any parts or consumables used"
          },
          {
            "key": "requester_satisfaction",
            "label": "Requester satisfaction",
            "type": "text",
            "required": false,
            "note": "1-5 star rating from requester"
          }
        ]
      }
    ]
  },
  {
    "id": 55,
    "name": "Canteen",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Canteen records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "patient_diet_order",
        "title": "Patient Diet Order Form",
        "purpose": "Capture and save patient diet order form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Auto-filled from admission"
          },
          {
            "key": "diet_type",
            "label": "Diet type",
            "type": "select",
            "required": true,
            "options": [
              "Normal",
              "Diabetic",
              "Low-sodium",
              "Renal",
              "Soft",
              "Liquid",
              "NPO",
              "High-protein",
              "Vegetarian",
              "Halal",
              "Low-fat"
            ],
            "note": "Normal | Diabetic | Low-sodium | Renal | Soft | Liquid | NPO | High-protein | Vegetarian | Halal | Low-fat"
          },
          {
            "key": "texture",
            "label": "Texture",
            "type": "select",
            "required": false,
            "options": [
              "Regular",
              "Soft",
              "Minced",
              "Pureed",
              "Liquid - for dysphagia"
            ],
            "note": "Regular | Soft | Minced | Pureed | Liquid - for dysphagia"
          },
          {
            "key": "caloric_target",
            "label": "Caloric target",
            "type": "number",
            "required": false,
            "note": "Daily calorie target if prescribed by dietitian"
          },
          {
            "key": "fluid_restriction_ml",
            "label": "Fluid restriction (mL)",
            "type": "number",
            "required": false,
            "note": "Daily fluid limit if restricted"
          },
          {
            "key": "allergens_to_exclude",
            "label": "Allergens to exclude",
            "type": "checkbox",
            "required": false,
            "note": "Nuts | Gluten | Dairy | Eggs | Seafood | Soy"
          },
          {
            "key": "special_instructions",
            "label": "Special instructions",
            "type": "text",
            "required": false,
            "note": "Additional preparation notes for kitchen"
          },
          {
            "key": "start_date",
            "label": "Start date",
            "type": "date",
            "required": true,
            "note": "When this diet order begins"
          },
          {
            "key": "ordered_by",
            "label": "Ordered by",
            "type": "text",
            "required": true,
            "note": "Doctor or dietitian - auto-filled"
          }
        ]
      },
      {
        "id": "canteen_pos",
        "title": "Canteen POS Form",
        "purpose": "Capture and save canteen pos form data.",
        "fields": [
          {
            "key": "customer_type",
            "label": "Customer type",
            "type": "select",
            "required": true,
            "options": [
              "Staff",
              "Visitor",
              "Patient",
              "Other"
            ],
            "note": "Staff | Visitor | Patient | Other"
          },
          {
            "key": "staff_id",
            "label": "Staff ID",
            "type": "select",
            "required": false,
            "note": "If selling to staff - enables salary deduction option"
          },
          {
            "key": "items",
            "label": "Items",
            "type": "select",
            "required": true,
            "note": "Items selected from menu with quantities"
          },
          {
            "key": "total",
            "label": "Total",
            "type": "text",
            "required": true,
            "note": "Sum of selected items"
          },
          {
            "key": "payment_method",
            "label": "Payment method",
            "type": "select",
            "required": true,
            "options": [
              "Cash",
              "MPESA",
              "Staff salary deduction",
              "Credit"
            ],
            "note": "Cash | MPESA | Staff salary deduction | Credit"
          }
        ]
      }
    ]
  },
  {
    "id": 56,
    "name": "Physiotherapy & Rehabilitation",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Physiotherapy & Rehabilitation records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "physiotherapy_initial_assessment",
        "title": "Physiotherapy Initial Assessment Form",
        "purpose": "Capture and save physiotherapy initial assessment form data.",
        "fields": [
          {
            "key": "referral_diagnosis",
            "label": "Referral diagnosis",
            "type": "text",
            "required": true,
            "note": "From referring clinician's order"
          },
          {
            "key": "subjective",
            "label": "Subjective",
            "type": "textarea",
            "required": true,
            "note": "Patient-reported symptoms, history, functional limitations"
          },
          {
            "key": "objective_measurements",
            "label": "Objective measurements",
            "type": "text",
            "required": true,
            "options": [
              "ROM per joint",
              "Muscle strength grades",
              "Balance tests",
              "Functional scores"
            ],
            "note": "ROM per joint | Muscle strength grades | Balance tests | Functional scores"
          },
          {
            "key": "pain_score_0_10",
            "label": "Pain score (0–10)",
            "type": "text",
            "required": true,
            "note": "Current pain level"
          },
          {
            "key": "functional_status",
            "label": "Functional status",
            "type": "textarea",
            "required": true,
            "note": "Activities of daily living - what patient can and cannot do"
          },
          {
            "key": "barthel_index_score",
            "label": "Barthel Index score",
            "type": "text",
            "required": false,
            "note": "Functional independence measure 0-100"
          },
          {
            "key": "physiotherapy_diagnosis",
            "label": "Physiotherapy diagnosis",
            "type": "textarea",
            "required": true,
            "note": "Physiotherapist's clinical impression"
          },
          {
            "key": "treatment_goals",
            "label": "Treatment goals",
            "type": "text",
            "required": true,
            "note": "Short-term and long-term goals with measurable targets"
          },
          {
            "key": "treatment_plan",
            "label": "Treatment plan",
            "type": "textarea",
            "required": true,
            "note": "Planned interventions, modalities, and exercise programme"
          },
          {
            "key": "sessions_prescribed",
            "label": "Sessions prescribed",
            "type": "number",
            "required": true,
            "note": "Total sessions planned"
          },
          {
            "key": "frequency_per_week",
            "label": "Frequency per week",
            "type": "number",
            "required": true,
            "note": "Session frequency"
          }
        ]
      },
      {
        "id": "physiotherapy_session_record",
        "title": "Physiotherapy Session Record",
        "purpose": "Capture and save physiotherapy session record data.",
        "fields": [
          {
            "key": "session_number",
            "label": "Session number",
            "type": "text",
            "required": true,
            "note": "Sequential within this treatment episode"
          },
          {
            "key": "pain_score",
            "label": "Pain score",
            "type": "text",
            "required": true,
            "note": "Pain at start of session 0-10"
          },
          {
            "key": "treatment_given",
            "label": "Treatment given",
            "type": "text",
            "required": true,
            "options": [
              "Modalities: TENS",
              "Ultrasound",
              "Heat",
              "Ice",
              "Traction",
              "Massage - with parameters"
            ],
            "note": "Modalities: TENS | Ultrasound | Heat | Ice | Traction | Massage - with parameters"
          },
          {
            "key": "exercises",
            "label": "Exercises",
            "type": "text",
            "required": true,
            "note": "Exercises with sets, reps, resistance, and notes"
          },
          {
            "key": "patient_response",
            "label": "Patient response",
            "type": "text",
            "required": true,
            "note": "How patient tolerated treatment"
          },
          {
            "key": "progress_notes",
            "label": "Progress notes",
            "type": "textarea",
            "required": true,
            "note": "Progress toward goals - objective measurements if done"
          },
          {
            "key": "home_exercise_programme",
            "label": "Home exercise programme",
            "type": "text",
            "required": false,
            "note": "Exercises given for home between sessions"
          }
        ]
      }
    ]
  },
  {
    "id": 57,
    "name": "Nutrition & Dietetics",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Nutrition & Dietetics records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "nutritional_screening",
        "title": "Nutritional Screening Form",
        "purpose": "Capture and save nutritional screening form data.",
        "fields": [
          {
            "key": "screening_tool",
            "label": "Screening tool",
            "type": "select",
            "required": true,
            "options": [
              "MUST",
              "NRS-2002",
              "MNA",
              "STAMP"
            ],
            "note": "MUST | NRS-2002 | MNA | STAMP"
          },
          {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": true,
            "note": "Current measured weight"
          },
          {
            "key": "height_cm",
            "label": "Height (cm)",
            "type": "number",
            "required": true,
            "note": "Measured height"
          },
          {
            "key": "bmi",
            "label": "BMI",
            "type": "text",
            "required": true,
            "note": "Auto-calculated from weight and height"
          },
          {
            "key": "usual_body_weight_kg",
            "label": "Usual body weight (kg)",
            "type": "number",
            "required": false,
            "note": "Pre-illness or usual weight"
          },
          {
            "key": "unintentional_weight_loss",
            "label": "Unintentional weight loss",
            "type": "select",
            "required": true,
            "options": [
              "None",
              "<5% in 3 months",
              "5-10%",
              ">10%"
            ],
            "note": "None | <5% in 3 months | 5-10% | >10%"
          },
          {
            "key": "appetite",
            "label": "Appetite",
            "type": "select",
            "required": true,
            "options": [
              "Good",
              "Fair",
              "Poor",
              "Absent"
            ],
            "note": "Good | Fair | Poor | Absent"
          },
          {
            "key": "disease_severity",
            "label": "Disease severity",
            "type": "select",
            "required": true,
            "options": [
              "No stress",
              "Mild",
              "Moderate",
              "Severe"
            ],
            "note": "No stress | Mild | Moderate | Severe"
          },
          {
            "key": "screening_score",
            "label": "Screening score",
            "type": "text",
            "required": true,
            "note": "Calculated risk score"
          },
          {
            "key": "risk_category",
            "label": "Risk category",
            "type": "text",
            "required": true,
            "options": [
              "Low",
              "Medium",
              "High"
            ],
            "note": "Low | Medium | High"
          }
        ]
      },
      {
        "id": "nutrition_assessment",
        "title": "Nutrition Assessment Form",
        "purpose": "Capture and save nutrition assessment form data.",
        "fields": [
          {
            "key": "24_hour_dietary_recall",
            "label": "24-hour dietary recall",
            "type": "textarea",
            "required": true,
            "note": "Everything eaten and drunk in the previous 24 hours"
          },
          {
            "key": "swallowing_status",
            "label": "Swallowing status",
            "type": "select",
            "required": true,
            "options": [
              "Normal",
              "Mild dysphagia",
              "Severe dysphagia",
              "NPO"
            ],
            "note": "Normal | Mild dysphagia | Severe dysphagia | NPO"
          },
          {
            "key": "gut_function",
            "label": "Gut function",
            "type": "select",
            "required": true,
            "options": [
              "Normal",
              "Diarrhoea",
              "Constipation",
              "Malabsorption"
            ],
            "note": "Normal | Diarrhoea | Constipation | Malabsorption"
          },
          {
            "key": "serum_albumin_g_dl",
            "label": "Serum albumin (g/dL)",
            "type": "number",
            "required": false,
            "note": "Biochemical marker of nutritional status"
          },
          {
            "key": "clinical_signs_of_malnutrition",
            "label": "Clinical signs of malnutrition",
            "type": "text",
            "required": false,
            "note": "Oedema | Muscle wasting | Hair loss | Skin changes | Angular stomatitis"
          },
          {
            "key": "energy_requirement_kcal_day",
            "label": "Energy requirement (kcal/day)",
            "type": "number",
            "required": true,
            "note": "Calculated or estimated daily energy need"
          },
          {
            "key": "protein_requirement_g_day",
            "label": "Protein requirement (g/day)",
            "type": "number",
            "required": true,
            "note": "Daily protein requirement"
          },
          {
            "key": "nutrition_diagnosis",
            "label": "Nutrition diagnosis",
            "type": "textarea",
            "required": true,
            "note": "PES statement: Problem | Etiology | Signs and symptoms"
          }
        ]
      },
      {
        "id": "nutrition_care_plan",
        "title": "Nutrition Care Plan Form",
        "purpose": "Capture and save nutrition care plan form data.",
        "fields": [
          {
            "key": "nutrition_support_type",
            "label": "Nutrition support type",
            "type": "select",
            "required": true,
            "options": [
              "Oral diet",
              "Oral supplement",
              "Enteral NG",
              "TPN",
              "Combined"
            ],
            "note": "Oral diet | Oral supplement | Enteral NG | TPN | Combined"
          },
          {
            "key": "diet_type",
            "label": "Diet type",
            "type": "select",
            "required": false,
            "options": [
              "Normal",
              "Diabetic",
              "Renal",
              "Cardiac",
              "Low-sodium",
              "Liquid",
              "Soft"
            ],
            "note": "Normal | Diabetic | Renal | Cardiac | Low-sodium | Liquid | Soft"
          },
          {
            "key": "enteral_formula",
            "label": "Enteral formula",
            "type": "text",
            "required": false,
            "note": "Brand/type of enteral feed"
          },
          {
            "key": "feed_rate_ml_hour",
            "label": "Feed rate (mL/hour)",
            "type": "number",
            "required": false,
            "note": "Enteral feed rate"
          },
          {
            "key": "total_daily_volume_ml",
            "label": "Total daily volume (mL)",
            "type": "number",
            "required": false,
            "note": "Total enteral volume target"
          },
          {
            "key": "tpn_composition",
            "label": "TPN composition",
            "type": "text",
            "required": false,
            "note": "Dextrose, amino acids, lipids, electrolytes composition"
          },
          {
            "key": "monitoring_plan",
            "label": "Monitoring plan",
            "type": "text",
            "required": true,
            "note": "Parameters to monitor - weight, glucose, electrolytes"
          },
          {
            "key": "review_date",
            "label": "Review date",
            "type": "date",
            "required": true,
            "note": "Next scheduled nutrition review"
          }
        ]
      }
    ]
  },
  {
    "id": 58,
    "name": "Dental",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Dental records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "dental_examination",
        "title": "Dental Examination Form",
        "purpose": "Capture and save dental examination form data.",
        "fields": [
          {
            "key": "notation_system",
            "label": "Notation system",
            "type": "select",
            "required": true,
            "options": [
              "FDI",
              "Universal",
              "Palmer"
            ],
            "note": "FDI | Universal | Palmer"
          },
          {
            "key": "tooth_chart",
            "label": "Tooth chart",
            "type": "text",
            "required": true,
            "note": "Visual tooth chart - click per tooth to record status and treatment needed"
          },
          {
            "key": "periodontal_probing_depths",
            "label": "Periodontal probing depths",
            "type": "text",
            "required": false,
            "note": "Pocket depths per tooth per surface"
          },
          {
            "key": "occlusion_class",
            "label": "Occlusion class",
            "type": "select",
            "required": false,
            "options": [
              "Angle Class I",
              "II",
              "III"
            ],
            "note": "Angle Class I | II | III"
          },
          {
            "key": "oral_hygiene_status",
            "label": "Oral hygiene status",
            "type": "select",
            "required": true,
            "options": [
              "Good",
              "Fair",
              "Poor"
            ],
            "note": "Good | Fair | Poor"
          },
          {
            "key": "plaque_index",
            "label": "Plaque index",
            "type": "number",
            "required": false,
            "note": "0-3 plaque index score"
          },
          {
            "key": "gingival_index",
            "label": "Gingival index",
            "type": "number",
            "required": false,
            "note": "0-3 gingival index score"
          },
          {
            "key": "chief_dental_complaint",
            "label": "Chief dental complaint",
            "type": "text",
            "required": true,
            "note": "Main reason for visit"
          },
          {
            "key": "dental_history",
            "label": "Dental history",
            "type": "textarea",
            "required": false,
            "note": "Previous dental treatment, dental anxiety level"
          },
          {
            "key": "radiographs_required",
            "label": "Radiographs required",
            "type": "checkbox",
            "required": false,
            "note": "Periapical | Bitewing | OPG | CBCT"
          }
        ]
      },
      {
        "id": "dental_treatment_record",
        "title": "Dental Treatment Record",
        "purpose": "Capture and save dental treatment record data.",
        "fields": [
          {
            "key": "tooth_number",
            "label": "Tooth number",
            "type": "select",
            "required": true,
            "note": "Specific tooth treated"
          },
          {
            "key": "tooth_surfaces",
            "label": "Tooth surfaces",
            "type": "checkbox",
            "required": false,
            "note": "Mesial | Distal | Buccal | Lingual | Occlusal | Incisal"
          },
          {
            "key": "procedure",
            "label": "Procedure",
            "type": "select",
            "required": true,
            "options": [
              "Extraction",
              "Amalgam",
              "Composite",
              "RCT",
              "Crown",
              "Scaling",
              "Other"
            ],
            "note": "Extraction | Amalgam | Composite | RCT | Crown | Scaling | Other"
          },
          {
            "key": "anaesthesia_type",
            "label": "Anaesthesia type",
            "type": "select",
            "required": true,
            "options": [
              "None",
              "Local infiltration",
              "Block",
              "Sedation",
              "General"
            ],
            "note": "None | Local infiltration | Block | Sedation | General"
          },
          {
            "key": "anaesthetic_used",
            "label": "Anaesthetic used",
            "type": "text",
            "required": false,
            "note": "Drug and volume e.g. Lignocaine 2% 1.8mL"
          },
          {
            "key": "materials_used",
            "label": "Materials used",
            "type": "text",
            "required": false,
            "note": "Restorative material and shade if applicable"
          },
          {
            "key": "complications",
            "label": "Complications",
            "type": "text",
            "required": false,
            "note": "Any procedural complications"
          },
          {
            "key": "post_op_instructions",
            "label": "Post-op instructions",
            "type": "textarea",
            "required": true,
            "note": "Care instructions given to patient"
          }
        ]
      }
    ]
  },
  {
    "id": 59,
    "name": "Infection Control & CSSD",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Infection Control & CSSD records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "hai_surveillance",
        "title": "HAI Surveillance Form",
        "purpose": "Capture and save hai surveillance form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Auto-filled from admission"
          },
          {
            "key": "hai_type",
            "label": "HAI type",
            "type": "select",
            "required": true,
            "options": [
              "SSI",
              "CAUTI",
              "CLABSI",
              "VAP",
              "CDI",
              "MRSA",
              "Other"
            ],
            "note": "SSI | CAUTI | CLABSI | VAP | CDI | MRSA | Other"
          },
          {
            "key": "diagnosis_date",
            "label": "Diagnosis date",
            "type": "date",
            "required": true,
            "note": "Date HAI was identified"
          },
          {
            "key": "implicated_device",
            "label": "Implicated device",
            "type": "select",
            "required": false,
            "options": [
              "Urinary catheter",
              "Central line",
              "Ventilator",
              "Surgical site",
              "NA"
            ],
            "note": "Urinary catheter | Central line | Ventilator | Surgical site | NA"
          },
          {
            "key": "device_insertion_date",
            "label": "Device insertion date",
            "type": "date",
            "required": false,
            "note": "For device-day calculation"
          },
          {
            "key": "causative_organism",
            "label": "Causative organism",
            "type": "text",
            "required": false,
            "note": "Organism identified on culture"
          },
          {
            "key": "is_multi_drug_resistant",
            "label": "Is multi-drug resistant",
            "type": "checkbox",
            "required": true,
            "note": "MRSA | VRE | ESBL | CRE - tick if MDR"
          },
          {
            "key": "treatment_given",
            "label": "Treatment given",
            "type": "text",
            "required": false,
            "note": "Antibiotic and other treatment"
          },
          {
            "key": "outcome",
            "label": "Outcome",
            "type": "select",
            "required": true,
            "options": [
              "Resolved",
              "Ongoing",
              "Transferred",
              "Deceased"
            ],
            "note": "Resolved | Ongoing | Transferred | Deceased"
          }
        ]
      },
      {
        "id": "cssd_sterilisation_cycle",
        "title": "CSSD Sterilisation Cycle Form",
        "purpose": "Capture and save cssd sterilisation cycle form data.",
        "fields": [
          {
            "key": "autoclave_id",
            "label": "Autoclave ID",
            "type": "select",
            "required": true,
            "note": "Specific autoclave machine"
          },
          {
            "key": "cycle_number",
            "label": "Cycle number",
            "type": "text",
            "required": true,
            "note": "Sequential machine cycle number"
          },
          {
            "key": "cycle_type",
            "label": "Cycle type",
            "type": "select",
            "required": true,
            "options": [
              "Gravity",
              "Pre-vacuum",
              "Flash",
              "ETO",
              "Plasma"
            ],
            "note": "Gravity | Pre-vacuum | Flash | ETO | Plasma"
          },
          {
            "key": "temperature_c",
            "label": "Temperature (°C)",
            "type": "text",
            "required": true,
            "note": "Auto-read from machine - typically 134C"
          },
          {
            "key": "pressure_bar",
            "label": "Pressure (bar)",
            "type": "text",
            "required": true,
            "note": "Auto-read from machine"
          },
          {
            "key": "hold_time_minutes",
            "label": "Hold time (minutes)",
            "type": "text",
            "required": true,
            "note": "Time at sterilising temperature"
          },
          {
            "key": "chemical_indicator_result",
            "label": "Chemical indicator result",
            "type": "select",
            "required": true,
            "options": [
              "Pass",
              "Fail"
            ],
            "note": "Pass | Fail"
          },
          {
            "key": "bowie_dick_result",
            "label": "Bowie-Dick result",
            "type": "select",
            "required": false,
            "options": [
              "Pass",
              "Fail - for pre-vacuum cycles only"
            ],
            "note": "Pass | Fail - for pre-vacuum cycles only"
          },
          {
            "key": "biological_indicator_result",
            "label": "Biological indicator result",
            "type": "select",
            "required": false,
            "options": [
              "Pass",
              "Fail",
              "Pending - weekly spore test"
            ],
            "note": "Pass | Fail | Pending - weekly spore test"
          },
          {
            "key": "loads_in_this_cycle",
            "label": "Loads in this cycle",
            "type": "text",
            "required": true,
            "note": "Instrument trays with tray code and description"
          },
          {
            "key": "cycle_passed",
            "label": "Cycle passed",
            "type": "text",
            "required": true,
            "note": "Auto-determined from all indicator results"
          }
        ]
      },
      {
        "id": "hand_hygiene_audit",
        "title": "Hand Hygiene Audit Form",
        "purpose": "Capture and save hand hygiene audit form data.",
        "fields": [
          {
            "key": "ward",
            "label": "Ward",
            "type": "select",
            "required": true,
            "note": "Ward being audited"
          },
          {
            "key": "audit_date",
            "label": "Audit date",
            "type": "date",
            "required": true,
            "note": "Date of observation"
          },
          {
            "key": "observation_duration_min",
            "label": "Observation duration (min)",
            "type": "number",
            "required": true,
            "note": "How long observations were done"
          },
          {
            "key": "total_opportunities",
            "label": "Total opportunities",
            "type": "number",
            "required": true,
            "note": "Total hand hygiene opportunities observed"
          },
          {
            "key": "opportunities_taken",
            "label": "Opportunities taken",
            "type": "number",
            "required": true,
            "note": "Times hand hygiene was actually performed"
          },
          {
            "key": "compliance_rate",
            "label": "Compliance rate",
            "type": "text",
            "required": true,
            "note": "Calculated percentage"
          },
          {
            "key": "by_moment",
            "label": "By moment",
            "type": "text",
            "required": true,
            "note": "Compliance per WHO 5 moments"
          },
          {
            "key": "by_cadre",
            "label": "By cadre",
            "type": "text",
            "required": false,
            "options": [
              "Nurses",
              "Doctors",
              "Allied",
              "Support"
            ],
            "note": "Nurses | Doctors | Allied | Support"
          },
          {
            "key": "handrub_available",
            "label": "Handrub available",
            "type": "checkbox",
            "required": true,
            "note": "Alcohol handrub at all points of care"
          },
          {
            "key": "sinks_functional",
            "label": "Sinks functional",
            "type": "checkbox",
            "required": true,
            "note": "Hand washing sinks in working order"
          }
        ]
      }
    ]
  },
  {
    "id": 60,
    "name": "Community Health & CHW",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Community Health & CHW records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "chw_registration",
        "title": "CHW Registration Form",
        "purpose": "Capture and save chw registration form data.",
        "fields": [
          {
            "key": "full_name",
            "label": "Full name",
            "type": "text",
            "required": true,
            "note": "CHW full name"
          },
          {
            "key": "national_id",
            "label": "National ID",
            "type": "text",
            "required": true,
            "note": "National ID number"
          },
          {
            "key": "phone",
            "label": "Phone",
            "type": "tel",
            "required": true,
            "note": "Mobile number - primary contact"
          },
          {
            "key": "cadre",
            "label": "Cadre",
            "type": "select",
            "required": true,
            "options": [
              "CHV",
              "CHP",
              "Supervisor"
            ],
            "note": "CHV | CHP | Supervisor"
          },
          {
            "key": "assigned_village",
            "label": "Assigned village",
            "type": "text",
            "required": true,
            "note": "Village or estate assigned"
          },
          {
            "key": "sub_location",
            "label": "Sub-location",
            "type": "select",
            "required": true,
            "note": "Administrative sub-location"
          },
          {
            "key": "supervisor",
            "label": "Supervisor",
            "type": "select",
            "required": false,
            "note": "Supervising CHW or health officer"
          }
        ]
      },
      {
        "id": "household_registration",
        "title": "Household Registration Form",
        "purpose": "Capture and save household registration form data.",
        "fields": [
          {
            "key": "chw",
            "label": "CHW",
            "type": "text",
            "required": true,
            "note": "Auto-filled from login"
          },
          {
            "key": "head_of_household",
            "label": "Head of household",
            "type": "text",
            "required": true,
            "note": "Name of household head"
          },
          {
            "key": "phone",
            "label": "Phone",
            "type": "tel",
            "required": false,
            "note": "Household contact number"
          },
          {
            "key": "village",
            "label": "Village",
            "type": "text",
            "required": true,
            "note": "Village name"
          },
          {
            "key": "gps_location",
            "label": "GPS location",
            "type": "text",
            "required": false,
            "note": "Auto-capture GPS coordinates"
          },
          {
            "key": "water_source",
            "label": "Water source",
            "type": "select",
            "required": true,
            "options": [
              "Piped",
              "Borehole",
              "River",
              "Rain",
              "Vendor"
            ],
            "note": "Piped | Borehole | River | Rain | Vendor"
          },
          {
            "key": "sanitation",
            "label": "Sanitation",
            "type": "select",
            "required": true,
            "options": [
              "Flush toilet",
              "Pit latrine",
              "Open defecation"
            ],
            "note": "Flush toilet | Pit latrine | Open defecation"
          },
          {
            "key": "number_of_members",
            "label": "Number of members",
            "type": "number",
            "required": true,
            "note": "Total household members"
          }
        ]
      },
      {
        "id": "chw_home_visit",
        "title": "CHW Home Visit Form",
        "purpose": "Capture and save chw home visit form data.",
        "fields": [
          {
            "key": "household",
            "label": "Household",
            "type": "select",
            "required": true,
            "note": "Household being visited"
          },
          {
            "key": "visit_type",
            "label": "Visit type",
            "type": "select",
            "required": true,
            "options": [
              "Routine",
              "ANC follow-up",
              "PNC",
              "Immunisation",
              "Chronic disease",
              "Defaulter tracing"
            ],
            "note": "Routine | ANC follow-up | PNC | Immunisation | Chronic disease | Defaulter tracing"
          },
          {
            "key": "members_present",
            "label": "Members present",
            "type": "number",
            "required": true,
            "note": "Household members seen during visit"
          },
          {
            "key": "services_provided",
            "label": "Services provided",
            "type": "text",
            "required": true,
            "note": "Health education | Screening | Referral | Immunisation | FP counselling"
          },
          {
            "key": "findings",
            "label": "Findings",
            "type": "textarea",
            "required": true,
            "note": "Health findings during the visit"
          },
          {
            "key": "referrals_made",
            "label": "Referrals made",
            "type": "number",
            "required": false,
            "note": "Number of patients referred to facility"
          },
          {
            "key": "gps_confirmation",
            "label": "GPS confirmation",
            "type": "text",
            "required": true,
            "note": "Auto-capture to confirm location of visit"
          },
          {
            "key": "next_visit_date",
            "label": "Next visit date",
            "type": "date",
            "required": false,
            "note": "Date of next scheduled visit"
          }
        ]
      }
    ]
  },
  {
    "id": 61,
    "name": "Consent Management",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Consent Management records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "informed_consent",
        "title": "Informed Consent Form",
        "purpose": "Capture and save informed consent form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Auto-filled from encounter"
          },
          {
            "key": "consent_type",
            "label": "Consent type",
            "type": "select",
            "required": true,
            "options": [
              "Surgical",
              "Anaesthesia",
              "Blood transfusion",
              "HIV testing",
              "Research",
              "Data processing",
              "Photography"
            ],
            "note": "Surgical | Anaesthesia | Blood transfusion | HIV testing | Research | Data processing | Photography"
          },
          {
            "key": "consent_form_version",
            "label": "Consent form version",
            "type": "text",
            "required": true,
            "note": "Auto-selected current version"
          },
          {
            "key": "procedure_explained",
            "label": "Procedure explained",
            "type": "checkbox",
            "required": true,
            "note": "Confirm procedure was explained to patient"
          },
          {
            "key": "questions_answered",
            "label": "Questions answered",
            "type": "checkbox",
            "required": true,
            "note": "Confirm patient's questions were answered"
          },
          {
            "key": "language_of_explanation",
            "label": "Language of explanation",
            "type": "select",
            "required": true,
            "options": [
              "English",
              "Swahili",
              "Kikuyu",
              "Other"
            ],
            "note": "English | Swahili | Kikuyu | Other"
          },
          {
            "key": "patient_consents",
            "label": "Patient consents",
            "type": "select",
            "required": true,
            "options": [
              "Yes - I consent",
              "No - I refuse"
            ],
            "note": "Yes - I consent | No - I refuse"
          },
          {
            "key": "refusal_reason",
            "label": "Refusal reason",
            "type": "text",
            "required": false,
            "note": "Required if patient refuses"
          },
          {
            "key": "consented_by",
            "label": "Consented by",
            "type": "text",
            "required": true,
            "note": "Name of patient or guardian giving consent"
          },
          {
            "key": "relationship_to_patient",
            "label": "Relationship to patient",
            "type": "select",
            "required": false,
            "options": [
              "Self",
              "Parent",
              "Guardian",
              "Spouse",
              "Next of kin - if not patient"
            ],
            "note": "Self | Parent | Guardian | Spouse | Next of kin - if not patient"
          },
          {
            "key": "patient_guardian_signature",
            "label": "Patient/guardian signature",
            "type": "text",
            "required": true,
            "note": "Digital signature or thumbprint capture"
          },
          {
            "key": "witness_name",
            "label": "Witness name",
            "type": "text",
            "required": true,
            "note": "Name of witness present during consent"
          },
          {
            "key": "witness_signature",
            "label": "Witness signature",
            "type": "text",
            "required": true,
            "note": "Witness digital signature"
          },
          {
            "key": "obtained_by",
            "label": "Obtained by",
            "type": "text",
            "required": true,
            "note": "Auto-filled - clinician obtaining consent"
          }
        ]
      }
    ]
  },
  {
    "id": 62,
    "name": "Inter-Facility Referral Management",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Inter-Facility Referral Management records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "outgoing_referral",
        "title": "Outgoing Referral Form",
        "purpose": "Capture and save outgoing referral form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Auto-filled from encounter"
          },
          {
            "key": "receiving_facility",
            "label": "Receiving facility",
            "type": "select",
            "required": true,
            "note": "Select from facility directory - searchable by name or MFL"
          },
          {
            "key": "receiving_specialist",
            "label": "Receiving specialist",
            "type": "text",
            "required": false,
            "note": "Specific doctor or department at receiving facility"
          },
          {
            "key": "specialty_required",
            "label": "Specialty required",
            "type": "select",
            "required": true,
            "note": "Specialty service being sought"
          },
          {
            "key": "urgency",
            "label": "Urgency",
            "type": "select",
            "required": true,
            "options": [
              "Routine",
              "Urgent",
              "Emergency"
            ],
            "note": "Routine | Urgent | Emergency"
          },
          {
            "key": "reason_for_referral",
            "label": "Reason for referral",
            "type": "textarea",
            "required": true,
            "note": "Clinical reason and specific questions for receiving team"
          },
          {
            "key": "clinical_summary",
            "label": "Clinical summary",
            "type": "textarea",
            "required": true,
            "note": "History, findings, investigations done, treatment given"
          },
          {
            "key": "investigations_attached",
            "label": "Investigations attached",
            "type": "checkbox",
            "required": false,
            "note": "Lab results | Imaging | ECG | Other reports"
          },
          {
            "key": "transport_mode",
            "label": "Transport mode",
            "type": "select",
            "required": true,
            "options": [
              "Self",
              "Ambulance",
              "Police",
              "Air evacuation"
            ],
            "note": "Self | Ambulance | Police | Air evacuation"
          },
          {
            "key": "accompanying_person",
            "label": "Accompanying person",
            "type": "text",
            "required": false,
            "note": "Name of person accompanying patient"
          }
        ]
      },
      {
        "id": "referral_feedback",
        "title": "Referral Feedback Form",
        "purpose": "Capture and save referral feedback form data.",
        "fields": [
          {
            "key": "referral",
            "label": "Referral",
            "type": "text",
            "required": true,
            "note": "Referral being responded to"
          },
          {
            "key": "patient_arrived",
            "label": "Patient arrived",
            "type": "select",
            "required": true,
            "options": [
              "Yes",
              "No"
            ],
            "note": "Yes | No"
          },
          {
            "key": "arrival_date",
            "label": "Arrival date",
            "type": "date",
            "required": false,
            "note": "Date patient presented at receiving facility"
          },
          {
            "key": "assessment_findings",
            "label": "Assessment findings",
            "type": "textarea",
            "required": true,
            "note": "Specialist assessment at receiving facility"
          },
          {
            "key": "diagnosis_confirmed",
            "label": "Diagnosis confirmed",
            "type": "text",
            "required": true,
            "note": "Confirmed or revised diagnosis"
          },
          {
            "key": "treatment_given",
            "label": "Treatment given",
            "type": "text",
            "required": true,
            "note": "Interventions performed at receiving facility"
          },
          {
            "key": "outcome",
            "label": "Outcome",
            "type": "select",
            "required": true,
            "options": [
              "Admitted",
              "Treated and returned",
              "Ongoing follow-up",
              "Deceased"
            ],
            "note": "Admitted | Treated and returned | Ongoing follow-up | Deceased"
          },
          {
            "key": "patient_returned_to_referring_facility",
            "label": "Patient returned to referring facility",
            "type": "select",
            "required": false,
            "options": [
              "Yes",
              "No"
            ],
            "note": "Yes | No"
          }
        ]
      }
    ]
  },
  {
    "id": 63,
    "name": "Document Management System",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Document Management System records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "document_upload",
        "title": "Document Upload Form",
        "purpose": "Capture and save document upload form data.",
        "fields": [
          {
            "key": "document_type",
            "label": "Document type",
            "type": "select",
            "required": true,
            "options": [
              "Clinical",
              "Financial",
              "Legal",
              "HR",
              "Administrative",
              "Consent",
              "Referral",
              "Insurance"
            ],
            "note": "Clinical | Financial | Legal | HR | Administrative | Consent | Referral | Insurance"
          },
          {
            "key": "document_title",
            "label": "Document title",
            "type": "text",
            "required": true,
            "note": "Descriptive title"
          },
          {
            "key": "file_upload",
            "label": "File upload",
            "type": "file",
            "required": true,
            "note": "PDF, image, or Office document - max 50 MB"
          },
          {
            "key": "linked_patient",
            "label": "Linked patient",
            "type": "text",
            "required": false,
            "note": "Patient MRN if patient-related document"
          },
          {
            "key": "linked_encounter",
            "label": "Linked encounter",
            "type": "select",
            "required": false,
            "note": "Specific encounter if applicable"
          },
          {
            "key": "linked_staff",
            "label": "Linked staff",
            "type": "select",
            "required": false,
            "note": "Staff record if HR document"
          },
          {
            "key": "tags",
            "label": "Tags",
            "type": "text",
            "required": false,
            "note": "Keywords for searchability"
          },
          {
            "key": "access_level",
            "label": "Access level",
            "type": "select",
            "required": true,
            "options": [
              "Public",
              "Clinical only",
              "Restricted",
              "Confidential"
            ],
            "note": "Public | Clinical only | Restricted | Confidential"
          },
          {
            "key": "expiry_date",
            "label": "Expiry date",
            "type": "date",
            "required": false,
            "note": "For time-limited documents like insurance pre-auth letters"
          }
        ]
      }
    ]
  },
  {
    "id": 64,
    "name": "SMS & WhatsApp Notifications",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture SMS & WhatsApp Notifications records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "notification_template",
        "title": "Notification Template Form",
        "purpose": "Capture and save notification template form data.",
        "fields": [
          {
            "key": "template_code",
            "label": "Template code",
            "type": "text",
            "required": true,
            "note": "Unique identifier e.g. APPOINTMENT_REMINDER"
          },
          {
            "key": "channel",
            "label": "Channel",
            "type": "select",
            "required": true,
            "options": [
              "SMS",
              "WhatsApp",
              "Email",
              "All"
            ],
            "note": "SMS | WhatsApp | Email | All"
          },
          {
            "key": "language",
            "label": "Language",
            "type": "select",
            "required": true,
            "options": [
              "English",
              "Swahili"
            ],
            "note": "English | Swahili"
          },
          {
            "key": "subject_line",
            "label": "Subject line",
            "type": "text",
            "required": false,
            "note": "Email subject - not needed for SMS"
          },
          {
            "key": "message_body",
            "label": "Message body",
            "type": "textarea",
            "required": true,
            "note": "Message with placeholders e.g. Dear {{patient_name}}, your appointment is on {{date}}"
          },
          {
            "key": "whatsapp_template_name",
            "label": "WhatsApp template name",
            "type": "text",
            "required": false,
            "note": "Approved WhatsApp Business API template name"
          }
        ]
      },
      {
        "id": "manual_notification",
        "title": "Manual Notification Form",
        "purpose": "Capture and save manual notification form data.",
        "fields": [
          {
            "key": "recipient",
            "label": "Recipient",
            "type": "text",
            "required": true,
            "note": "Patient or staff member to notify"
          },
          {
            "key": "channel",
            "label": "Channel",
            "type": "select",
            "required": true,
            "options": [
              "SMS",
              "WhatsApp",
              "Email"
            ],
            "note": "SMS | WhatsApp | Email"
          },
          {
            "key": "message",
            "label": "Message",
            "type": "textarea",
            "required": true,
            "note": "Custom message - or select from templates"
          },
          {
            "key": "template",
            "label": "Template",
            "type": "select",
            "required": false,
            "note": "Select a pre-approved template"
          },
          {
            "key": "send_now_or_schedule",
            "label": "Send now or schedule",
            "type": "select",
            "required": true,
            "options": [
              "Send immediately",
              "Schedule for later"
            ],
            "note": "Send immediately | Schedule for later"
          },
          {
            "key": "scheduled_time",
            "label": "Scheduled time",
            "type": "datetime-local",
            "required": false,
            "note": "If scheduling - when to send"
          }
        ]
      }
    ]
  },
  {
    "id": 65,
    "name": "Biomedical Equipment Management",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Biomedical Equipment Management records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "medical_device_registration",
        "title": "Medical Device Registration Form",
        "purpose": "Capture and save medical device registration form data.",
        "fields": [
          {
            "key": "asset",
            "label": "Asset",
            "type": "select",
            "required": true,
            "note": "Link to existing asset in facility_assets"
          },
          {
            "key": "device_class",
            "label": "Device class",
            "type": "select",
            "required": true,
            "options": [
              "Class A",
              "B",
              "C",
              "D - Kenya MDA classification"
            ],
            "note": "Class A | B | C | D - Kenya MDA classification"
          },
          {
            "key": "intended_use",
            "label": "Intended use",
            "type": "textarea",
            "required": true,
            "note": "Manufacturer's intended medical purpose"
          },
          {
            "key": "udi",
            "label": "UDI",
            "type": "text",
            "required": true,
            "note": "Unique Device Identifier - from device label"
          },
          {
            "key": "gmdn_code",
            "label": "GMDN code",
            "type": "text",
            "required": false,
            "note": "Global Medical Device Nomenclature code"
          },
          {
            "key": "risk_classification",
            "label": "Risk classification",
            "type": "select",
            "required": true,
            "options": [
              "Low",
              "Medium",
              "High",
              "Critical"
            ],
            "note": "Low | Medium | High | Critical"
          },
          {
            "key": "ppb_registration_number",
            "label": "PPB registration number",
            "type": "text",
            "required": false,
            "note": "Kenya Pharmacy and Poisons Board approval"
          },
          {
            "key": "is_single_use",
            "label": "Is single use",
            "type": "select",
            "required": true,
            "options": [
              "Yes - cannot be reprocessed",
              "No - reusable"
            ],
            "note": "Yes - cannot be reprocessed | No - reusable"
          },
          {
            "key": "max_reprocessing_cycles",
            "label": "Max reprocessing cycles",
            "type": "number",
            "required": false,
            "note": "If reusable - manufacturer limit on reprocessing"
          },
          {
            "key": "software_version",
            "label": "Software version",
            "type": "text",
            "required": false,
            "note": "Current firmware or software version"
          },
          {
            "key": "is_implantable",
            "label": "Is implantable",
            "type": "checkbox",
            "required": false,
            "note": "Tick if device is implanted in patient body"
          }
        ]
      },
      {
        "id": "calibration_record",
        "title": "Calibration Record Form",
        "purpose": "Capture and save calibration record form data.",
        "fields": [
          {
            "key": "asset",
            "label": "Asset",
            "type": "text",
            "required": true,
            "note": "Device being calibrated"
          },
          {
            "key": "calibration_type",
            "label": "Calibration type",
            "type": "select",
            "required": true,
            "options": [
              "Internal",
              "External",
              "Manufacturer",
              "NIST-traceable"
            ],
            "note": "Internal | External | Manufacturer | NIST-traceable"
          },
          {
            "key": "calibration_date",
            "label": "Calibration date",
            "type": "date",
            "required": true,
            "note": "Date performed"
          },
          {
            "key": "calibrating_technician",
            "label": "Calibrating technician",
            "type": "text",
            "required": true,
            "note": "Name of calibrating person or company"
          },
          {
            "key": "reference_standard_used",
            "label": "Reference standard used",
            "type": "text",
            "required": true,
            "note": "Traceable reference standard e.g. KEBS-certified thermometer"
          },
          {
            "key": "pre_calibration_reading",
            "label": "Pre-calibration reading",
            "type": "text",
            "required": true,
            "note": "Device reading before adjustment"
          },
          {
            "key": "post_calibration_reading",
            "label": "Post-calibration reading",
            "type": "text",
            "required": true,
            "note": "Device reading after calibration"
          },
          {
            "key": "within_tolerance",
            "label": "Within tolerance",
            "type": "select",
            "required": true,
            "options": [
              "Yes",
              "No"
            ],
            "note": "Yes | No"
          },
          {
            "key": "adjustment_made",
            "label": "Adjustment made",
            "type": "select",
            "required": true,
            "options": [
              "Yes",
              "No"
            ],
            "note": "Yes | No"
          },
          {
            "key": "certificate_number",
            "label": "Certificate number",
            "type": "text",
            "required": false,
            "note": "Calibration certificate reference"
          },
          {
            "key": "next_calibration_due",
            "label": "Next calibration due",
            "type": "date",
            "required": true,
            "note": "Next calibration date"
          }
        ]
      }
    ]
  },
  {
    "id": 66,
    "name": "Migration",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Migration records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "migration_job_setup",
        "title": "Migration Job Setup Form",
        "purpose": "Capture and save migration job setup form data.",
        "fields": [
          {
            "key": "source_system_name",
            "label": "Source system name",
            "type": "text",
            "required": true,
            "note": "Name of the old HMIS being migrated from"
          },
          {
            "key": "source_type",
            "label": "Source type",
            "type": "select",
            "required": true,
            "options": [
              "Database",
              "CSV",
              "Excel",
              "JSON",
              "FHIR",
              "API"
            ],
            "note": "Database | CSV | Excel | JSON | FHIR | API"
          },
          {
            "key": "connection_method",
            "label": "Connection method",
            "type": "select",
            "required": true,
            "options": [
              "Direct DB connection",
              "File upload",
              "API endpoint"
            ],
            "note": "Direct DB connection | File upload | API endpoint"
          },
          {
            "key": "host_url",
            "label": "Host / URL",
            "type": "text",
            "required": false,
            "note": "Database host or API URL if direct connection"
          },
          {
            "key": "database_name",
            "label": "Database name",
            "type": "text",
            "required": false,
            "note": "Database name if direct DB connection"
          },
          {
            "key": "username",
            "label": "Username",
            "type": "text",
            "required": false,
            "note": "Read-only database username"
          },
          {
            "key": "password",
            "label": "Password",
            "type": "text",
            "required": false,
            "note": "Database password - encrypted immediately"
          },
          {
            "key": "port",
            "label": "Port",
            "type": "number",
            "required": false,
            "note": "Database port if non-default"
          },
          {
            "key": "upload_files",
            "label": "Upload files",
            "type": "file",
            "required": false,
            "note": "For CSV/Excel/JSON/FHIR file-based migration"
          },
          {
            "key": "test_connection",
            "label": "Test connection",
            "type": "text",
            "required": true,
            "note": "Verify source system is accessible before proceeding"
          }
        ]
      },
      {
        "id": "field_mapping",
        "title": "Field Mapping Form",
        "purpose": "Capture and save field mapping form data.",
        "fields": [
          {
            "key": "source_table",
            "label": "Source table",
            "type": "text",
            "required": true,
            "note": "Auto-populated from schema discovery"
          },
          {
            "key": "source_field",
            "label": "Source field",
            "type": "text",
            "required": true,
            "note": "Source field name and detected type"
          },
          {
            "key": "target_table",
            "label": "Target table",
            "type": "select",
            "required": true,
            "note": "Medilink target table"
          },
          {
            "key": "target_field",
            "label": "Target field",
            "type": "select",
            "required": true,
            "note": "Medilink target field"
          },
          {
            "key": "conflict_type",
            "label": "Conflict type",
            "type": "select",
            "required": true,
            "options": [
              "Direct match",
              "Type mismatch",
              "Source only",
              "Target only",
              "Semantic"
            ],
            "note": "Direct match | Type mismatch | Source only | Target only | Semantic"
          },
          {
            "key": "resolution",
            "label": "Resolution",
            "type": "select",
            "required": true,
            "options": [
              "Auto",
              "Manual",
              "AI assisted",
              "Custom function",
              "Discard",
              "Extend"
            ],
            "note": "Auto | Manual | AI assisted | Custom function | Discard | Extend"
          },
          {
            "key": "transform_function",
            "label": "Transform function",
            "type": "text",
            "required": false,
            "note": "Python or SQL transformation for Type 2 conflicts"
          },
          {
            "key": "lookup_table",
            "label": "Lookup table",
            "type": "text",
            "required": false,
            "note": "Value translation table for semantic conflicts e.g. 1Male, 2Female"
          }
        ]
      },
      {
        "id": "validation_report_review",
        "title": "Validation Report Review Form",
        "purpose": "Capture and save validation report review form data.",
        "fields": [
          {
            "key": "migration_job",
            "label": "Migration job",
            "type": "text",
            "required": true,
            "note": "Job being reviewed"
          },
          {
            "key": "error_record",
            "label": "Error record",
            "type": "text",
            "required": true,
            "note": "Source record with error"
          },
          {
            "key": "error_type",
            "label": "Error type",
            "type": "select",
            "required": true,
            "options": [
              "Validation",
              "Transformation",
              "Reference",
              "Duplicate",
              "Encoding"
            ],
            "note": "Validation | Transformation | Reference | Duplicate | Encoding"
          },
          {
            "key": "error_message",
            "label": "Error message",
            "type": "text",
            "required": true,
            "note": "Detailed error description"
          },
          {
            "key": "resolution_action",
            "label": "Resolution action",
            "type": "select",
            "required": true,
            "options": [
              "Fix source data",
              "Skip record",
              "Manual entry",
              "Map differently"
            ],
            "note": "Fix source data | Skip record | Manual entry | Map differently"
          },
          {
            "key": "resolution_notes",
            "label": "Resolution notes",
            "type": "text",
            "required": false,
            "note": "How this error was resolved"
          }
        ]
      },
      {
        "id": "migration_approval",
        "title": "Migration Approval Form",
        "purpose": "Capture and save migration approval form data.",
        "fields": [
          {
            "key": "migration_job",
            "label": "Migration job",
            "type": "text",
            "required": true,
            "note": "Job being approved for live migration"
          },
          {
            "key": "dry_run_summary",
            "label": "Dry run summary",
            "type": "select",
            "required": true,
            "options": [
              "Records passed",
              "Failed",
              "Skipped"
            ],
            "note": "Records passed | Failed | Skipped"
          },
          {
            "key": "snapshot_id",
            "label": "Snapshot ID",
            "type": "text",
            "required": true,
            "note": "Pre-migration database snapshot reference - for rollback"
          },
          {
            "key": "schedule_migration",
            "label": "Schedule migration",
            "type": "datetime-local",
            "required": true,
            "note": "When to run the live migration - typically overnight"
          },
          {
            "key": "migration_admin_approval",
            "label": "Migration admin approval",
            "type": "text",
            "required": true,
            "note": "Tenant migration administrator sign-off"
          },
          {
            "key": "medilink_engineer_approval",
            "label": "Medilink engineer approval",
            "type": "text",
            "required": true,
            "note": "Medilink co-approval - dual authorisation required"
          }
        ]
      }
    ]
  },
  {
    "id": 67,
    "name": "Quality Assurance",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Quality Assurance records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "incident_report",
        "title": "Incident Report Form",
        "purpose": "Capture and save incident report form data.",
        "fields": [
          {
            "key": "incident_date",
            "label": "Incident date",
            "type": "date",
            "required": true,
            "note": "Date incident occurred"
          },
          {
            "key": "incident_time",
            "label": "Incident time",
            "type": "time",
            "required": false,
            "note": "Approximate time if known"
          },
          {
            "key": "patient_involved",
            "label": "Patient involved",
            "type": "text",
            "required": false,
            "note": "Patient MRN - blank for staff-only incidents"
          },
          {
            "key": "location",
            "label": "Location",
            "type": "select",
            "required": true,
            "note": "Department or area where incident occurred"
          },
          {
            "key": "incident_type",
            "label": "Incident type",
            "type": "select",
            "required": true,
            "options": [
              "Medication error",
              "Fall",
              "Pressure injury",
              "Wrong site",
              "HAI",
              "Equipment failure",
              "Near miss",
              "Complaint"
            ],
            "note": "Medication error | Fall | Pressure injury | Wrong site | HAI | Equipment failure | Near miss | Complaint"
          },
          {
            "key": "severity",
            "label": "Severity",
            "type": "select",
            "required": true,
            "options": [
              "Near miss",
              "Minor",
              "Moderate",
              "Major",
              "Sentinel event"
            ],
            "note": "Near miss | Minor | Moderate | Major | Sentinel event"
          },
          {
            "key": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "note": "Detailed, factual account of what happened"
          },
          {
            "key": "immediate_actions_taken",
            "label": "Immediate actions taken",
            "type": "textarea",
            "required": true,
            "note": "What was done immediately after the incident"
          },
          {
            "key": "patient_outcome",
            "label": "Patient outcome",
            "type": "text",
            "required": false,
            "note": "Effect on patient if applicable"
          }
        ]
      },
      {
        "id": "root_cause_analysis_rca",
        "title": "Root Cause Analysis (RCA) Form",
        "purpose": "Capture and save root cause analysis (rca) form data.",
        "fields": [
          {
            "key": "incident",
            "label": "Incident",
            "type": "text",
            "required": true,
            "note": "Linked incident being investigated"
          },
          {
            "key": "rca_team_members",
            "label": "RCA team members",
            "type": "text",
            "required": true,
            "note": "All members of the investigation team"
          },
          {
            "key": "rca_methodology",
            "label": "RCA methodology",
            "type": "select",
            "required": true,
            "options": [
              "Fishbone",
              "5 Whys",
              "FMEA",
              "Fault tree",
              "London Protocol"
            ],
            "note": "Fishbone | 5 Whys | FMEA | Fault tree | London Protocol"
          },
          {
            "key": "event_timeline",
            "label": "Event timeline",
            "type": "text",
            "required": true,
            "note": "Chronological sequence of events - time, event, person"
          },
          {
            "key": "contributing_factors",
            "label": "Contributing factors",
            "type": "text",
            "required": true,
            "options": [
              "Per category: Patient",
              "Staff",
              "Environment",
              "Equipment",
              "Communication"
            ],
            "note": "Per category: Patient | Staff | Environment | Equipment | Communication"
          },
          {
            "key": "root_causes",
            "label": "Root causes",
            "type": "textarea",
            "required": true,
            "note": "Identified fundamental causes"
          },
          {
            "key": "recommendations",
            "label": "Recommendations",
            "type": "text",
            "required": true,
            "note": "Action, responsible person, due date, priority per recommendation"
          },
          {
            "key": "lessons_learned",
            "label": "Lessons learned",
            "type": "textarea",
            "required": true,
            "note": "Key learnings for system-wide sharing"
          }
        ]
      },
      {
        "id": "clinical_audit",
        "title": "Clinical Audit Form",
        "purpose": "Capture and save clinical audit form data.",
        "fields": [
          {
            "key": "audit_title",
            "label": "Audit title",
            "type": "text",
            "required": true,
            "note": "Name of the audit e.g. Hand Hygiene Compliance Audit"
          },
          {
            "key": "audit_topic",
            "label": "Audit topic",
            "type": "text",
            "required": true,
            "note": "Clinical area or process being audited"
          },
          {
            "key": "standard_or_criteria",
            "label": "Standard or criteria",
            "type": "textarea",
            "required": true,
            "note": "What standard is being measured against"
          },
          {
            "key": "sample_size",
            "label": "Sample size",
            "type": "number",
            "required": true,
            "note": "Number of records or observations in the audit"
          },
          {
            "key": "audit_period",
            "label": "Audit period",
            "type": "text",
            "required": true,
            "note": "Data collection period"
          },
          {
            "key": "audit_findings",
            "label": "Audit findings",
            "type": "text",
            "required": true,
            "note": "Per criterion: compliance %, numerator, denominator, notes"
          },
          {
            "key": "recommendations",
            "label": "Recommendations",
            "type": "textarea",
            "required": true,
            "note": "What needs to change based on findings"
          },
          {
            "key": "action_plan",
            "label": "Action plan",
            "type": "text",
            "required": true,
            "note": "Specific actions with owner and due date"
          },
          {
            "key": "re_audit_date",
            "label": "Re-audit date",
            "type": "date",
            "required": true,
            "note": "When to re-audit to measure improvement"
          }
        ]
      },
      {
        "id": "accreditation_checklist",
        "title": "Accreditation Checklist Form",
        "purpose": "Capture and save accreditation checklist form data.",
        "fields": [
          {
            "key": "accreditation_body",
            "label": "Accreditation body",
            "type": "select",
            "required": true,
            "options": [
              "KQMH",
              "JCI",
              "ISO 9001",
              "SafeCare",
              "WHO SARA"
            ],
            "note": "KQMH | JCI | ISO 9001 | SafeCare | WHO SARA"
          },
          {
            "key": "standard_code",
            "label": "Standard code",
            "type": "text",
            "required": true,
            "note": "Standard item code"
          },
          {
            "key": "requirement",
            "label": "Requirement",
            "type": "text",
            "required": true,
            "note": "Full standard requirement text"
          },
          {
            "key": "compliance_status",
            "label": "Compliance status",
            "type": "select",
            "required": true,
            "options": [
              "Compliant",
              "Partially compliant",
              "Non-compliant",
              "Not applicable"
            ],
            "note": "Compliant | Partially compliant | Non-compliant | Not applicable"
          },
          {
            "key": "evidence_description",
            "label": "Evidence description",
            "type": "textarea",
            "required": true,
            "note": "What evidence demonstrates compliance"
          },
          {
            "key": "evidence_documents",
            "label": "Evidence documents",
            "type": "text",
            "required": false,
            "note": "Upload supporting documents"
          },
          {
            "key": "gap_description",
            "label": "Gap description",
            "type": "textarea",
            "required": false,
            "note": "What is missing for full compliance - required if not compliant"
          },
          {
            "key": "target_compliance_date",
            "label": "Target compliance date",
            "type": "date",
            "required": false,
            "note": "When full compliance will be achieved"
          }
        ]
      }
    ]
  },
  {
    "id": 68,
    "name": "Paediatrics",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Paediatrics records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "growth_monitoring",
        "title": "Growth Monitoring Form",
        "purpose": "Capture and save growth monitoring form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Auto-filled - child patient"
          },
          {
            "key": "age_months",
            "label": "Age (months)",
            "type": "text",
            "required": true,
            "note": "Auto-calculated from date of birth"
          },
          {
            "key": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": true,
            "note": "Weight to 3 decimal places for infants"
          },
          {
            "key": "height_length_cm",
            "label": "Height / Length (cm)",
            "type": "number",
            "required": true,
            "note": "Recumbent length for under 2 years, standing height for 2"
          },
          {
            "key": "head_circumference_cm",
            "label": "Head circumference (cm)",
            "type": "number",
            "required": false,
            "note": "For children under 5 years"
          },
          {
            "key": "muac_cm",
            "label": "MUAC (cm)",
            "type": "number",
            "required": false,
            "note": "Mid-upper arm circumference - SAM screening"
          },
          {
            "key": "oedema_present",
            "label": "Oedema present",
            "type": "checkbox",
            "required": true,
            "note": "Bilateral pitting oedema - sign of kwashiorkor"
          },
          {
            "key": "weight_for_age_z_score",
            "label": "Weight-for-age z-score",
            "type": "text",
            "required": true,
            "note": "Auto-calculated from WHO Child Growth Standards"
          },
          {
            "key": "height_for_age_z_score",
            "label": "Height-for-age z-score",
            "type": "text",
            "required": true,
            "note": "Stunting indicator"
          },
          {
            "key": "weight_for_height_z_score",
            "label": "Weight-for-height z-score",
            "type": "text",
            "required": true,
            "note": "Wasting indicator"
          },
          {
            "key": "nutritional_status",
            "label": "Nutritional status",
            "type": "text",
            "required": true,
            "options": [
              "Normal",
              "Mild",
              "Moderate",
              "Severe malnutrition",
              "Overweight"
            ],
            "note": "Normal | Mild | Moderate | Severe malnutrition | Overweight"
          }
        ]
      },
      {
        "id": "immunisation_record",
        "title": "Immunisation Record Form",
        "purpose": "Capture and save immunisation record form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Child patient - auto-filled"
          },
          {
            "key": "vaccine",
            "label": "Vaccine",
            "type": "select",
            "required": true,
            "options": [
              "BCG",
              "OPV0",
              "HepB birth",
              "Penta",
              "PCV",
              "Rota",
              "MR",
              "Yellow Fever",
              "Others"
            ],
            "note": "BCG | OPV0 | HepB birth | Penta | PCV | Rota | MR | Yellow Fever | Others"
          },
          {
            "key": "dose_number",
            "label": "Dose number",
            "type": "select",
            "required": true,
            "options": [
              "Dose 1",
              "2",
              "3",
              "Booster per Kenya EPI schedule"
            ],
            "note": "Dose 1 | 2 | 3 | Booster per Kenya EPI schedule"
          },
          {
            "key": "date_administered",
            "label": "Date administered",
            "type": "date",
            "required": true,
            "note": "Date vaccine was given"
          },
          {
            "key": "batch_number",
            "label": "Batch number",
            "type": "text",
            "required": true,
            "note": "Vaccine batch for traceability"
          },
          {
            "key": "expiry_date",
            "label": "Expiry date",
            "type": "date",
            "required": true,
            "note": "Vaccine vial expiry date"
          },
          {
            "key": "administration_site",
            "label": "Administration site",
            "type": "select",
            "required": true,
            "options": [
              "Left deltoid",
              "Right anterolateral thigh",
              "Oral"
            ],
            "note": "Left deltoid | Right anterolateral thigh | Oral"
          },
          {
            "key": "route",
            "label": "Route",
            "type": "select",
            "required": true,
            "options": [
              "IM",
              "SC",
              "ID",
              "Oral",
              "Intranasal"
            ],
            "note": "IM | SC | ID | Oral | Intranasal"
          },
          {
            "key": "administered_by",
            "label": "Administered by",
            "type": "text",
            "required": true,
            "note": "Auto-filled - vaccinating nurse"
          },
          {
            "key": "adverse_reaction_noted",
            "label": "Adverse reaction noted",
            "type": "text",
            "required": false,
            "note": "Any immediate adverse events observed"
          }
        ]
      },
      {
        "id": "imci_assessment",
        "title": "IMCI Assessment Form",
        "purpose": "Capture and save imci assessment form data.",
        "fields": [
          {
            "key": "age_of_child",
            "label": "Age of child",
            "type": "text",
            "required": true,
            "note": "Auto-calculated - IMCI applies to 2 months to 5 years"
          },
          {
            "key": "danger_signs",
            "label": "Danger signs",
            "type": "text",
            "required": true,
            "note": "Cannot feed | Vomits everything | Convulsions | Lethargic/unconscious"
          },
          {
            "key": "main_symptoms",
            "label": "Main symptoms",
            "type": "text",
            "required": true,
            "note": "Cough | Diarrhoea | Fever | Ear problem | Malnutrition/anaemia"
          },
          {
            "key": "cough_duration_days",
            "label": "Cough duration (days)",
            "type": "number",
            "required": false,
            "note": "If cough present"
          },
          {
            "key": "diarrhoea_duration_days",
            "label": "Diarrhoea duration (days)",
            "type": "number",
            "required": false,
            "note": "If diarrhoea present"
          },
          {
            "key": "fever_duration_days",
            "label": "Fever duration (days)",
            "type": "number",
            "required": false,
            "note": "If fever present"
          },
          {
            "key": "malaria_rdt_result",
            "label": "Malaria RDT result",
            "type": "select",
            "required": false,
            "options": [
              "Positive",
              "Negative",
              "Not done"
            ],
            "note": "Positive | Negative | Not done"
          },
          {
            "key": "imci_classification",
            "label": "IMCI classification",
            "type": "text",
            "required": true,
            "note": "IMCI disease classification based on findings"
          },
          {
            "key": "treatment",
            "label": "Treatment",
            "type": "text",
            "required": true,
            "note": "IMCI standard treatment per classification"
          }
        ]
      }
    ]
  },
  {
    "id": 69,
    "name": "Home Care",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Home Care records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "home_care_plan",
        "title": "Home Care Plan Form",
        "purpose": "Capture and save home care plan form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Discharged patient - auto-filled"
          },
          {
            "key": "linked_discharge_summary",
            "label": "Linked discharge summary",
            "type": "text",
            "required": false,
            "note": "Auto-linked from discharge"
          },
          {
            "key": "assigned_nurse",
            "label": "Assigned nurse",
            "type": "select",
            "required": true,
            "note": "Primary home care nurse"
          },
          {
            "key": "start_date",
            "label": "Start date",
            "type": "date",
            "required": true,
            "note": "Home care commencement date"
          },
          {
            "key": "services_required",
            "label": "Services required",
            "type": "text",
            "required": true,
            "note": "Wound care | Medication | Physiotherapy | Palliative | Monitoring | Dialysis"
          },
          {
            "key": "visit_frequency",
            "label": "Visit frequency",
            "type": "select",
            "required": true,
            "options": [
              "Daily",
              "Alternate days",
              "Twice weekly",
              "Weekly"
            ],
            "note": "Daily | Alternate days | Twice weekly | Weekly"
          },
          {
            "key": "equipment_to_provide",
            "label": "Equipment to provide",
            "type": "text",
            "required": false,
            "note": "Equipment name, delivery date, return date"
          },
          {
            "key": "goals",
            "label": "Goals",
            "type": "textarea",
            "required": true,
            "note": "Recovery targets and measurable outcomes"
          },
          {
            "key": "emergency_escalation_plan",
            "label": "Emergency escalation plan",
            "type": "textarea",
            "required": true,
            "note": "Criteria for calling for help and contact numbers"
          }
        ]
      },
      {
        "id": "home_visit_record",
        "title": "Home Visit Record Form",
        "purpose": "Capture and save home visit record form data.",
        "fields": [
          {
            "key": "care_plan",
            "label": "Care plan",
            "type": "text",
            "required": true,
            "note": "Auto-linked plan"
          },
          {
            "key": "visit_date",
            "label": "Visit date",
            "type": "date",
            "required": true,
            "note": "Date of visit"
          },
          {
            "key": "gps_location",
            "label": "GPS location",
            "type": "text",
            "required": true,
            "note": "Auto-capture GPS at visit - confirms home location"
          },
          {
            "key": "visit_start_time",
            "label": "Visit start time",
            "type": "time",
            "required": true,
            "note": "Arrival time"
          },
          {
            "key": "visit_end_time",
            "label": "Visit end time",
            "type": "time",
            "required": true,
            "note": "Departure time"
          },
          {
            "key": "vital_signs",
            "label": "Vital signs",
            "type": "text",
            "required": true,
            "options": [
              "BP",
              "HR",
              "Temp",
              "SpO2",
              "Weight"
            ],
            "note": "BP | HR | Temp | SpO2 | Weight"
          },
          {
            "key": "clinical_findings",
            "label": "Clinical findings",
            "type": "textarea",
            "required": true,
            "note": "Assessment findings"
          },
          {
            "key": "interventions_performed",
            "label": "Interventions performed",
            "type": "textarea",
            "required": true,
            "note": "Care activities done - wound care, injections, monitoring"
          },
          {
            "key": "medications_given",
            "label": "Medications given",
            "type": "text",
            "required": false,
            "note": "Drugs administered during visit"
          },
          {
            "key": "patient_concerns",
            "label": "Patient concerns",
            "type": "text",
            "required": false,
            "note": "Issues raised by patient or caregiver"
          },
          {
            "key": "escalation_required",
            "label": "Escalation required",
            "type": "text",
            "required": true,
            "options": [
              "Yes - needs hospital",
              "No - continue at home"
            ],
            "note": "Yes - needs hospital | No - continue at home"
          },
          {
            "key": "escalation_reason",
            "label": "Escalation reason",
            "type": "text",
            "required": false,
            "note": "Clinical reason if escalation needed"
          }
        ]
      }
    ]
  },
  {
    "id": 70,
    "name": "Clinical Research",
    "premium": false,
    "stages": [
      {
        "id": "stage_1",
        "label": "Data Capture",
        "description": "Capture Clinical Research records from the documented HMIS form catalogue.",
        "vitalsCollected": "None",
        "servicesProvided": "Form submission and record persistence",
        "queueRouting": "As configured by workflow",
        "interModuleLinks": "Shared backend module action record"
      }
    ],
    "forms": [
      {
        "id": "research_protocol_registration",
        "title": "Research Protocol Registration Form",
        "purpose": "Capture and save research protocol registration form data.",
        "fields": [
          {
            "key": "protocol_number",
            "label": "Protocol number",
            "type": "text",
            "required": true,
            "note": "Unique protocol identifier"
          },
          {
            "key": "full_title",
            "label": "Full title",
            "type": "textarea",
            "required": true,
            "note": "Complete protocol title"
          },
          {
            "key": "short_title",
            "label": "Short title",
            "type": "text",
            "required": true,
            "note": "Abbreviated title for display"
          },
          {
            "key": "study_type",
            "label": "Study type",
            "type": "select",
            "required": true,
            "options": [
              "Interventional",
              "Observational",
              "Diagnostic",
              "Registry",
              "Survey"
            ],
            "note": "Interventional | Observational | Diagnostic | Registry | Survey"
          },
          {
            "key": "phase",
            "label": "Phase",
            "type": "select",
            "required": false,
            "options": [
              "I",
              "II",
              "III",
              "IV",
              "Not applicable - for clinical trials"
            ],
            "note": "I | II | III | IV | Not applicable - for clinical trials"
          },
          {
            "key": "sponsor",
            "label": "Sponsor",
            "type": "text",
            "required": true,
            "note": "Funding organisation or sponsor"
          },
          {
            "key": "principal_investigator",
            "label": "Principal investigator",
            "type": "select",
            "required": true,
            "note": "Select from qualified staff"
          },
          {
            "key": "irb_approval_number",
            "label": "IRB approval number",
            "type": "text",
            "required": true,
            "note": "Ethics committee approval reference"
          },
          {
            "key": "irb_approval_date",
            "label": "IRB approval date",
            "type": "date",
            "required": true,
            "note": "Date ethics approval was granted"
          },
          {
            "key": "irb_expiry_date",
            "label": "IRB expiry date",
            "type": "date",
            "required": true,
            "note": "Ethics approval expiry - system sends renewal alerts"
          },
          {
            "key": "target_enrolment",
            "label": "Target enrolment",
            "type": "number",
            "required": true,
            "note": "Number of participants to recruit"
          },
          {
            "key": "inclusion_criteria",
            "label": "Inclusion criteria",
            "type": "textarea",
            "required": true,
            "note": "Who may participate"
          },
          {
            "key": "exclusion_criteria",
            "label": "Exclusion criteria",
            "type": "textarea",
            "required": true,
            "note": "Who may not participate"
          }
        ]
      },
      {
        "id": "patient_enrolment",
        "title": "Patient Enrolment Form",
        "purpose": "Capture and save patient enrolment form data.",
        "fields": [
          {
            "key": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "note": "Patient MRN - check inclusion/exclusion criteria"
          },
          {
            "key": "protocol",
            "label": "Protocol",
            "type": "text",
            "required": true,
            "note": "Study being enrolled into"
          },
          {
            "key": "screen_date",
            "label": "Screen date",
            "type": "date",
            "required": true,
            "note": "Date screening was performed"
          },
          {
            "key": "screening_passed",
            "label": "Screening passed",
            "type": "text",
            "required": true,
            "options": [
              "Yes - enrol",
              "No - screen failure"
            ],
            "note": "Yes - enrol | No - screen failure"
          },
          {
            "key": "screen_failure_reason",
            "label": "Screen failure reason",
            "type": "text",
            "required": false,
            "note": "If failed - which criterion was not met"
          },
          {
            "key": "consent_record",
            "label": "Consent record",
            "type": "text",
            "required": true,
            "note": "Research consent must be recorded first"
          },
          {
            "key": "study_arm",
            "label": "Study arm",
            "type": "select",
            "required": false,
            "options": [
              "Treatment",
              "Placebo",
              "Control - for randomised trials"
            ],
            "note": "Treatment | Placebo | Control - for randomised trials"
          },
          {
            "key": "enrolment_date",
            "label": "Enrolment date",
            "type": "date",
            "required": true,
            "note": "Date patient officially enrolled"
          }
        ]
      },
      {
        "id": "adverse_event_report",
        "title": "Adverse Event Report Form",
        "purpose": "Capture and save adverse event report form data.",
        "fields": [
          {
            "key": "participant",
            "label": "Participant",
            "type": "text",
            "required": true,
            "note": "Study participant"
          },
          {
            "key": "ae_description",
            "label": "AE description",
            "type": "textarea",
            "required": true,
            "note": "Detailed description of adverse event"
          },
          {
            "key": "onset_date",
            "label": "Onset date",
            "type": "date",
            "required": true,
            "note": "When the AE began"
          },
          {
            "key": "ctcae_grade",
            "label": "CTCAE grade",
            "type": "select",
            "required": true,
            "options": [
              "Grade 1 (mild)",
              "2",
              "3",
              "4",
              "5 (death)"
            ],
            "note": "Grade 1 (mild) | 2 | 3 | 4 | 5 (death)"
          },
          {
            "key": "is_serious",
            "label": "Is serious",
            "type": "text",
            "required": true,
            "options": [
              "Yes (SAE)",
              "No (AE) - serious = hospitalisation, life-threatening, death, disability"
            ],
            "note": "Yes (SAE) | No (AE) - serious = hospitalisation, life-threatening, death, disability"
          },
          {
            "key": "sae_criteria_met",
            "label": "SAE criteria met",
            "type": "text",
            "required": false,
            "note": "Death | Life-threatening | Hospitalisation | Disability | Congenital"
          },
          {
            "key": "relatedness_to_study",
            "label": "Relatedness to study",
            "type": "select",
            "required": true,
            "options": [
              "Unrelated",
              "Unlikely",
              "Possible",
              "Probable",
              "Definite"
            ],
            "note": "Unrelated | Unlikely | Possible | Probable | Definite"
          },
          {
            "key": "action_taken",
            "label": "Action taken",
            "type": "select",
            "required": true,
            "options": [
              "None",
              "Dose reduced",
              "Drug stopped",
              "Treated symptomatically"
            ],
            "note": "None | Dose reduced | Drug stopped | Treated symptomatically"
          },
          {
            "key": "outcome",
            "label": "Outcome",
            "type": "select",
            "required": true,
            "options": [
              "Resolved",
              "Resolving",
              "Not resolved",
              "Fatal",
              "Unknown"
            ],
            "note": "Resolved | Resolving | Not resolved | Fatal | Unknown"
          },
          {
            "key": "reported_to_sponsor",
            "label": "Reported to sponsor",
            "type": "datetime",
            "required": false,
            "note": "When SAE was reported to study sponsor - required within 24h for SAEs"
          }
        ]
      }
    ]
  }
];
