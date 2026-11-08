export const FORMS_DIRECTORY: Record<string, { forms: { name: string; description?: string; fields: { name: string; label: string; type?: string; required?: boolean; placeholder?: string; helper?: string; options?: string[]; multiple?: boolean; disabled?: boolean; }[]; }[] }> = 
{
  "patients": {
    "forms": [
      {
        "name": "New Patient Registration Form",
        "description": "Capture new patient registration details.",
        "fields": [
          {
            "name": "first_name",
            "label": "First name",
            "type": "text",
            "required": true,
            "helper": "Legal first name as per national ID",
            "placeholder": "Legal first name as per national ID"
          },
          {
            "name": "middle_name",
            "label": "Middle name",
            "type": "text",
            "required": false,
            "helper": "Middle name if applicable",
            "placeholder": "Middle name if applicable"
          },
          {
            "name": "last_name",
            "label": "Last name",
            "type": "text",
            "required": true,
            "helper": "Surname / family name",
            "placeholder": "Surname / family name"
          },
          {
            "name": "date_of_birth",
            "label": "Date of birth",
            "type": "date",
            "required": true,
            "helper": "Full DOB - used to calculate age"
          },
          {
            "name": "gender",
            "label": "Gender",
            "type": "select",
            "required": true,
            "helper": "Male | Female | Other",
            "options": [
              "Male",
              "Female",
              "Other"
            ]
          },
          {
            "name": "marital_status",
            "label": "Marital status",
            "type": "select",
            "required": false,
            "helper": "Single | Married | Widowed | Divorced",
            "options": [
              "Single",
              "Married",
              "Widowed",
              "Divorced"
            ]
          },
          {
            "name": "nationality",
            "label": "Nationality",
            "type": "text",
            "required": false,
            "helper": "Country of citizenship",
            "placeholder": "Country of citizenship"
          },
          {
            "name": "id_type",
            "label": "ID type",
            "type": "select",
            "required": true,
            "helper": "National ID | Passport | Birth cert | Refugee | Alien",
            "options": [
              "National ID",
              "Passport",
              "Birth cert",
              "Refugee",
              "Alien"
            ]
          },
          {
            "name": "id_number",
            "label": "ID number",
            "type": "text",
            "required": true,
            "helper": "Document identification number",
            "placeholder": "Document identification number"
          },
          {
            "name": "nhif_number",
            "label": "SHA number",
            "type": "text",
            "required": false,
            "helper": "SHA membership number",
            "placeholder": "SHA membership number"
          },
          {
            "name": "sha_number",
            "label": "SHA number",
            "type": "text",
            "required": false,
            "helper": "Social Health Authority number",
            "placeholder": "Social Health Authority number"
          },
          {
            "name": "primary_phone",
            "label": "Primary phone",
            "type": "tel",
            "required": true,
            "helper": "Main contact mobile number",
            "placeholder": "Main contact mobile number"
          },
          {
            "name": "secondary_phone",
            "label": "Secondary phone",
            "type": "tel",
            "required": false,
            "helper": "Alternate phone number",
            "placeholder": "Alternate phone number"
          },
          {
            "name": "email_address",
            "label": "Email address",
            "type": "email",
            "required": false,
            "helper": "For portal access and notifications",
            "placeholder": "For portal access and notifications"
          },
          {
            "name": "county",
            "label": "County",
            "type": "select",
            "required": true,
            "helper": "Kenya county of residence"
          },
          {
            "name": "sub_county",
            "label": "Sub-county",
            "type": "select",
            "required": true,
            "helper": "Sub-county within county"
          },
          {
            "name": "village_estate",
            "label": "Village / estate",
            "type": "text",
            "required": false,
            "helper": "Village, estate or street name",
            "placeholder": "Village, estate or street name"
          },
          {
            "name": "address_line",
            "label": "Address line",
            "type": "text",
            "required": false,
            "helper": "Physical or postal address",
            "placeholder": "Physical or postal address"
          },
          {
            "name": "blood_group",
            "label": "Blood group",
            "type": "select",
            "required": false,
            "helper": "ABO and Rh type if known"
          },
          {
            "name": "religion",
            "label": "Religion",
            "type": "select",
            "required": false,
            "helper": "For dietary and pastoral care planning"
          },
          {
            "name": "occupation",
            "label": "Occupation",
            "type": "text",
            "required": false,
            "helper": "Current occupation",
            "placeholder": "Current occupation"
          },
          {
            "name": "education_level",
            "label": "Education level",
            "type": "select",
            "required": false,
            "helper": "None | Primary | Secondary | Tertiary",
            "options": [
              "None",
              "Primary",
              "Secondary",
              "Tertiary"
            ]
          },
          {
            "name": "patient_photo",
            "label": "Patient photo",
            "type": "file",
            "required": false,
            "helper": "Biometric photo for identity verification"
          }
        ]
      },
      {
        "name": "Next of Kin Form",
        "description": "Capture next of kin details.",
        "fields": [
          {
            "name": "full_name",
            "label": "Full name",
            "type": "text",
            "required": true,
            "helper": "Complete name of next of kin",
            "placeholder": "Complete name of next of kin"
          },
          {
            "name": "relationship",
            "label": "Relationship",
            "type": "select",
            "required": true,
            "helper": "Spouse | Parent | Child | Sibling | Guardian | Other",
            "options": [
              "Spouse",
              "Parent",
              "Child",
              "Sibling",
              "Guardian",
              "Other"
            ]
          },
          {
            "name": "phone_number",
            "label": "Phone number",
            "type": "tel",
            "required": true,
            "helper": "Primary contact number",
            "placeholder": "Primary contact number"
          },
          {
            "name": "email",
            "label": "Email",
            "type": "email",
            "required": false,
            "helper": "Email address of next of kin",
            "placeholder": "Email address of next of kin"
          },
          {
            "name": "physical_address",
            "label": "Physical address",
            "type": "textarea",
            "required": false,
            "helper": "Residential address"
          },
          {
            "name": "is_primary_contact",
            "label": "Is primary contact",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if this is the first emergency contact"
          },
          {
            "name": "has_consent_authority",
            "label": "Has consent authority",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if authorised to consent on behalf of patient"
          }
        ]
      },
      {
        "name": "Insurance Registration Form",
        "description": "Capture insurance registration details.",
        "fields": [
          {
            "name": "insurance_scheme",
            "label": "Insurance scheme",
            "type": "select",
            "required": true,
            "helper": "Select insurer from approved scheme list"
          },
          {
            "name": "policy_number",
            "label": "Policy number",
            "type": "text",
            "required": true,
            "helper": "Insurance policy or membership number",
            "placeholder": "Insurance policy or membership number"
          },
          {
            "name": "member_name_on_policy",
            "label": "Member name on policy",
            "type": "text",
            "required": true,
            "helper": "Name as appearing on the insurance card",
            "placeholder": "Name as appearing on the insurance card"
          },
          {
            "name": "is_principal_member",
            "label": "Is principal member",
            "type": "text",
            "required": true,
            "helper": "Principal | Dependent",
            "placeholder": "Principal | Dependent"
          },
          {
            "name": "principal_id_number",
            "label": "Principal ID number",
            "type": "text",
            "required": false,
            "helper": "If dependent: national ID of main member",
            "placeholder": "If dependent: national ID of main member"
          },
          {
            "name": "policy_start_date",
            "label": "Policy start date",
            "type": "date",
            "required": false,
            "helper": "Policy validity start"
          },
          {
            "name": "policy_expiry_date",
            "label": "Policy expiry date",
            "type": "date",
            "required": true,
            "helper": "Policy expiry - system alerts if expired"
          },
          {
            "name": "annual_benefit_limit",
            "label": "Annual benefit limit",
            "type": "number",
            "required": false,
            "helper": "Maximum coverage amount in KES",
            "placeholder": "Maximum coverage amount in KES"
          }
        ]
      }
    ]
  },
  "appointments": {
    "forms": [
      {
        "name": "Appointment Booking Form",
        "description": "Capture appointment booking details.",
        "fields": [
          {
            "name": "patient_search",
            "label": "Patient search",
            "type": "text",
            "required": true,
            "helper": "Search by MRN, name, or ID number",
            "placeholder": "Search by MRN, name, or ID number"
          },
          {
            "name": "appointment_type",
            "label": "Appointment type",
            "type": "select",
            "required": true,
            "helper": "New | Follow-up | Specialist | Procedure | Telemedicine",
            "options": [
              "New",
              "Follow-up",
              "Specialist",
              "Procedure",
              "Telemedicine"
            ]
          },
          {
            "name": "preferred_doctor",
            "label": "Preferred doctor",
            "type": "select",
            "required": false,
            "helper": "Select from available doctors"
          },
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Department or clinic"
          },
          {
            "name": "appointment_date",
            "label": "Appointment date",
            "type": "date",
            "required": true,
            "helper": "Select from available slots calendar"
          },
          {
            "name": "appointment_time",
            "label": "Appointment time",
            "type": "time",
            "required": true,
            "helper": "Available slot selected from calendar"
          },
          {
            "name": "chief_complaint",
            "label": "Chief complaint",
            "type": "text",
            "required": true,
            "helper": "Patient's main reason for visit",
            "placeholder": "Patient's main reason for visit"
          },
          {
            "name": "booking_source",
            "label": "Booking source",
            "type": "select",
            "required": true,
            "helper": "Walk-in | Phone | Portal | Referral",
            "options": [
              "Walk-in",
              "Phone",
              "Portal",
              "Referral"
            ]
          },
          {
            "name": "insurance_to_use",
            "label": "Insurance to use",
            "type": "select",
            "required": false,
            "helper": "Active insurance scheme for this visit"
          },
          {
            "name": "notes",
            "label": "Notes",
            "type": "textarea",
            "required": false,
            "helper": "Special scheduling instructions or requests"
          },
          {
            "name": "send_reminder",
            "label": "Send reminder",
            "type": "checkbox",
            "required": false,
            "helper": "Tick to send SMS reminder to patient"
          }
        ]
      },
      {
        "name": "Appointment Slot Configuration Form",
        "description": "Capture appointment slot configuration details.",
        "fields": [
          {
            "name": "doctor",
            "label": "Doctor",
            "type": "select",
            "required": true,
            "helper": "Doctor making their schedule available"
          },
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Clinic or consultation department"
          },
          {
            "name": "date",
            "label": "Date",
            "type": "date",
            "required": true,
            "helper": "Date of availability"
          },
          {
            "name": "start_time",
            "label": "Start time",
            "type": "time",
            "required": true,
            "helper": "Clinic start time"
          },
          {
            "name": "end_time",
            "label": "End time",
            "type": "time",
            "required": true,
            "helper": "Clinic end time"
          },
          {
            "name": "slot_duration_minutes",
            "label": "Slot duration (minutes)",
            "type": "number",
            "required": true,
            "helper": "Duration per appointment e.g. 15 | 20 | 30",
            "placeholder": "Duration per appointment e.g. 15 | 20 | 30"
          },
          {
            "name": "slot_type",
            "label": "Slot type",
            "type": "select",
            "required": true,
            "helper": "OPD | Telemedicine | Procedure",
            "options": [
              "OPD",
              "Telemedicine",
              "Procedure"
            ]
          },
          {
            "name": "maximum_patients",
            "label": "Maximum patients",
            "type": "number",
            "required": true,
            "helper": "Maximum bookings for this session",
            "placeholder": "Maximum bookings for this session"
          }
        ]
      },
      {
        "name": "Appointment Cancellation Form",
        "description": "Capture appointment cancellation details.",
        "fields": [
          {
            "name": "cancellation_reason",
            "label": "Cancellation reason",
            "type": "select",
            "required": true,
            "helper": "Patient request | Doctor unavailable | Emergency | Other",
            "options": [
              "Patient request",
              "Doctor unavailable",
              "Emergency",
              "Other"
            ]
          },
          {
            "name": "additional_notes",
            "label": "Additional notes",
            "type": "textarea",
            "required": false,
            "helper": "Details about the cancellation"
          },
          {
            "name": "notify_patient",
            "label": "Notify patient",
            "type": "checkbox",
            "required": true,
            "helper": "Send cancellation SMS/email to patient"
          },
          {
            "name": "reschedule_immediately",
            "label": "Reschedule immediately",
            "type": "checkbox",
            "required": false,
            "helper": "Tick to open rebooking form immediately"
          }
        ]
      }
    ]
  },
  "queue": {
    "forms": [
      {
        "name": "Token Issuance Form",
        "description": "Capture token issuance details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient ID / MRN",
            "type": "text",
            "required": true,
            "helper": "Registered patient ID or MRN from check-in/registration",
            "placeholder": "Enter patient ID or MRN"
          },
          {
            "name": "service_type",
            "label": "Service type",
            "type": "select",
            "required": true,
            "helper": "OPD | Lab | Pharmacy | Billing | Radiology | Triage",
            "options": [
              "OPD",
              "Lab",
              "Pharmacy",
              "Billing",
              "Radiology",
              "Triage"
            ]
          },
          {
            "name": "priority_level",
            "label": "Priority level",
            "type": "select",
            "required": true,
            "helper": "Normal | Urgent | Emergency - affects queue position",
            "options": [
              "Normal",
              "Urgent",
              "Emergency — affects queue position"
            ]
          },
          {
            "name": "linked_appointment",
            "label": "Linked appointment",
            "type": "text",
            "required": false,
            "helper": "Appointment number if pre-booked",
            "placeholder": "APT-0001"
          },
          {
            "name": "counter_assignment",
            "label": "Counter assignment",
            "type": "text",
            "required": false,
            "helper": "Specific room or counter if directed",
            "placeholder": "OPD Room 3"
          }
        ]
      },
      {
        "name": "Counter Configuration Form",
        "description": "Capture counter configuration details.",
        "fields": [
          {
            "name": "counter_name",
            "label": "Counter name",
            "type": "text",
            "required": true,
            "helper": "e.g. OPD Room 3, Lab Counter 1",
            "placeholder": "e.g. OPD Room 3, Lab Counter 1"
          },
          {
            "name": "service_type",
            "label": "Service type",
            "type": "select",
            "required": true,
            "helper": "Service this counter handles",
            "options": [
              "OPD",
              "Lab",
              "Pharmacy",
              "Billing",
              "Radiology",
              "Triage"
            ]
          },
          {
            "name": "assigned_staff",
            "label": "Assigned staff",
            "type": "text",
            "required": true,
            "helper": "User currently operating this counter",
            "placeholder": "Staff ID or name"
          },
          {
            "name": "is_open",
            "label": "Is open",
            "type": "select",
            "required": true,
            "helper": "Open or closed status for the day",
            "options": [
              "Open",
              "Closed"
            ]
          }
        ]
      }
    ]
  },
  "opd": {
    "forms": [
      {
        "name": "Triage Assessment Form",
        "description": "Capture triage assessment details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Patient MRN",
            "placeholder": "Patient MRN"
          },
          {
            "name": "triage_level",
            "label": "Triage level",
            "type": "select",
            "required": true,
            "helper": "1-Immediate | 2-Urgent | 3-Semi-urgent | 4-Non-urgent",
            "options": [
              "1-Immediate",
              "2-Urgent",
              "3-Semi-urgent",
              "4-Non-urgent"
            ]
          },
          {
            "name": "chief_complaint",
            "label": "Chief complaint",
            "type": "text",
            "required": true,
            "helper": "Primary presenting complaint",
            "placeholder": "Primary presenting complaint"
          },
          {
            "name": "temperature_c",
            "label": "Temperature (°C)",
            "type": "number",
            "required": true,
            "helper": "Axillary or oral temperature",
            "placeholder": "Axillary or oral temperature"
          },
          {
            "name": "pulse_bpm",
            "label": "Pulse (bpm)",
            "type": "number",
            "required": true,
            "helper": "Heart rate in beats per minute",
            "placeholder": "Heart rate in beats per minute"
          },
          {
            "name": "blood_pressure",
            "label": "Blood pressure",
            "type": "text",
            "required": true,
            "helper": "Systolic/Diastolic e.g. 120/80",
            "placeholder": "Systolic/Diastolic e.g. 120/80"
          },
          {
            "name": "respiratory_rate",
            "label": "Respiratory rate",
            "type": "number",
            "required": true,
            "helper": "Breaths per minute",
            "placeholder": "Breaths per minute"
          },
          {
            "name": "spo2",
            "label": "SpO2 (%)",
            "type": "number",
            "required": true,
            "helper": "Oxygen saturation",
            "placeholder": "Oxygen saturation"
          },
          {
            "name": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false,
            "helper": "Current body weight",
            "placeholder": "Current body weight"
          },
          {
            "name": "height_cm",
            "label": "Height (cm)",
            "type": "number",
            "required": false,
            "helper": "Current height for BMI",
            "placeholder": "Current height for BMI"
          },
          {
            "name": "pain_score",
            "label": "Pain score",
            "type": "text",
            "required": true,
            "helper": "0–10 numeric pain rating scale",
            "placeholder": "0–10 numeric pain rating scale"
          },
          {
            "name": "gcs_total",
            "label": "GCS total",
            "type": "number",
            "required": false,
            "helper": "Glasgow Coma Scale total. Below 9 triggers Priority 1 escalation.",
            "placeholder": "3–15"
          },
          {
            "name": "blood_glucose_mmol_l",
            "label": "Blood glucose (mmol/L)",
            "type": "number",
            "required": false,
            "helper": "Bedside glucose if indicated",
            "placeholder": "Bedside glucose if indicated"
          },
          {
            "name": "pregnancy_status",
            "label": "Pregnancy status",
            "type": "select",
            "required": false,
            "helper": "For females of reproductive age"
          },
          {
            "name": "weeks_gestation",
            "label": "Weeks gestation",
            "type": "number",
            "required": false,
            "helper": "If pregnant - gestation in weeks",
            "placeholder": "If pregnant - gestation in weeks"
          },
          {
            "name": "allergies_confirmed",
            "label": "Allergies confirmed",
            "type": "checkbox",
            "required": true,
            "helper": "Tick to confirm allergy status checked"
          }
        ]
      },
      {
        "name": "OPD Consultation Form",
        "description": "Capture opd consultation details.",
        "fields": [
          {
            "name": "chief_complaint",
            "label": "Chief complaint",
            "type": "text",
            "required": true,
            "helper": "Main reason for visit in patient's words",
            "placeholder": "Main reason for visit in patient's words"
          },
          {
            "name": "history_of_presenting_illness",
            "label": "History of presenting illness",
            "type": "textarea",
            "required": true,
            "helper": "Detailed narrative - onset, duration, character, severity"
          },
          {
            "name": "past_medical_history",
            "label": "Past medical history",
            "type": "textarea",
            "required": false,
            "helper": "Previous diagnoses and hospitalisations"
          },
          {
            "name": "past_surgical_history",
            "label": "Past surgical history",
            "type": "textarea",
            "required": false,
            "helper": "Previous operations"
          },
          {
            "name": "family_history",
            "label": "Family history",
            "type": "textarea",
            "required": false,
            "helper": "Relevant family medical conditions"
          },
          {
            "name": "social_history",
            "label": "Social history",
            "type": "textarea",
            "required": false,
            "helper": "Smoking, alcohol, occupation, living situation"
          },
          {
            "name": "review_of_systems",
            "label": "Review of systems",
            "type": "text",
            "required": false,
            "helper": "Systematic inquiry per body system",
            "placeholder": "Systematic inquiry per body system"
          },
          {
            "name": "general_examination",
            "label": "General examination",
            "type": "textarea",
            "required": true,
            "helper": "General appearance and overall impression"
          },
          {
            "name": "systemic_examination",
            "label": "Systemic examination",
            "type": "textarea",
            "required": true,
            "helper": "Per-system examination findings"
          },
          {
            "name": "working_diagnosis",
            "label": "Working diagnosis",
            "type": "text",
            "required": true,
            "helper": "ICD-10 coded diagnosis - searchable",
            "placeholder": "ICD-10 coded diagnosis - searchable"
          },
          {
            "name": "additional_diagnoses",
            "label": "Additional diagnoses",
            "type": "text",
            "required": false,
            "helper": "Secondary or differential diagnoses",
            "placeholder": "Secondary or differential diagnoses"
          },
          {
            "name": "management_plan",
            "label": "Management plan",
            "type": "textarea",
            "required": true,
            "helper": "Treatment decisions and clinical instructions"
          },
          {
            "name": "follow_up_instructions",
            "label": "Follow-up instructions",
            "type": "text",
            "required": false,
            "helper": "When and where to return",
            "placeholder": "When and where to return"
          },
          {
            "name": "referral_needed",
            "label": "Referral needed",
            "type": "checkbox",
            "required": false,
            "helper": "Tick to open referral form"
          }
        ]
      },
      {
        "name": "OPD Referral Form",
        "description": "Capture opd referral details.",
        "fields": [
          {
            "name": "referred_to_department",
            "label": "Referred to department",
            "type": "select",
            "required": true,
            "helper": "Internal specialist department"
          },
          {
            "name": "referred_to_doctor",
            "label": "Referred to doctor",
            "type": "select",
            "required": false,
            "helper": "Specific doctor if known"
          },
          {
            "name": "reason_for_referral",
            "label": "Reason for referral",
            "type": "textarea",
            "required": true,
            "helper": "Clinical justification and specific questions"
          },
          {
            "name": "urgency",
            "label": "Urgency",
            "type": "select",
            "required": true,
            "helper": "Routine | Urgent | Emergency",
            "options": [
              "Routine",
              "Urgent",
              "Emergency"
            ]
          },
          {
            "name": "clinical_summary",
            "label": "Clinical summary",
            "type": "textarea",
            "required": true,
            "helper": "Relevant history, findings, and treatment to date"
          }
        ]
      }
    ]
  },
  "ipd": {
    "forms": [
      {
        "name": "Admission Form",
        "description": "Capture admission details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "MRN - auto-fills demographics",
            "placeholder": "MRN - auto-fills demographics"
          },
          {
            "name": "admission_type",
            "label": "Admission type",
            "type": "select",
            "required": true,
            "helper": "Elective | Emergency | Transfer in | Day case",
            "options": [
              "Elective",
              "Emergency",
              "Transfer in",
              "Day case"
            ]
          },
          {
            "name": "admission_source",
            "label": "Admission source",
            "type": "select",
            "required": true,
            "helper": "OPD | Emergency | Referral | Theatre | Direct",
            "options": [
              "OPD",
              "Emergency",
              "Referral",
              "Theatre",
              "Direct"
            ]
          },
          {
            "name": "admitting_doctor",
            "label": "Admitting doctor",
            "type": "select",
            "required": true,
            "helper": "Doctor requesting admission"
          },
          {
            "name": "admitting_diagnosis",
            "label": "Admitting diagnosis",
            "type": "text",
            "required": true,
            "helper": "Working diagnosis at time of admission",
            "placeholder": "Working diagnosis at time of admission"
          },
          {
            "name": "ward",
            "label": "Ward",
            "type": "select",
            "required": true,
            "helper": "Target ward"
          },
          {
            "name": "bed",
            "label": "Bed",
            "type": "select",
            "required": true,
            "helper": "Available bed in selected ward"
          },
          {
            "name": "insurance_pre_authorisation",
            "label": "Insurance pre-authorisation",
            "type": "text",
            "required": false,
            "helper": "Pre-auth reference number if insured",
            "placeholder": "Pre-auth reference number if insured"
          },
          {
            "name": "consent_obtained",
            "label": "Consent obtained",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm admission consent obtained"
          },
          {
            "name": "special_requirements",
            "label": "Special requirements",
            "type": "textarea",
            "required": false,
            "helper": "Dietary, religious, or care requirements"
          }
        ]
      },
      {
        "name": "Discharge Form",
        "description": "Capture discharge details.",
        "fields": [
          {
            "name": "discharge_type",
            "label": "Discharge type",
            "type": "select",
            "required": true,
            "helper": "Routine | LAMA | Transfer out | Absconded | Deceased | Day case complete",
            "options": [
              "Routine",
              "LAMA",
              "Transfer out",
              "Absconded",
              "Deceased",
              "Day case complete"
            ]
          },
          {
            "name": "discharge_diagnosis",
            "label": "Discharge diagnosis",
            "type": "text",
            "required": true,
            "helper": "Final confirmed diagnosis at discharge",
            "placeholder": "Final confirmed diagnosis at discharge"
          },
          {
            "name": "summary_of_stay",
            "label": "Summary of stay",
            "type": "textarea",
            "required": true,
            "helper": "Investigations done, procedures performed, treatment given"
          },
          {
            "name": "condition_at_discharge",
            "label": "Condition at discharge",
            "type": "select",
            "required": true,
            "helper": "Improved | Stable | Deteriorated | Deceased",
            "options": [
              "Improved",
              "Stable",
              "Deteriorated",
              "Deceased"
            ]
          },
          {
            "name": "discharge_medications",
            "label": "Discharge medications",
            "type": "text",
            "required": true,
            "helper": "All medications prescribed at discharge with dose, frequency, duration",
            "placeholder": "All medications prescribed at discharge with dose, frequency, duration"
          },
          {
            "name": "follow_up_date",
            "label": "Follow-up date",
            "type": "date",
            "required": true,
            "helper": "Date of next appointment"
          },
          {
            "name": "follow_up_doctor",
            "label": "Follow-up doctor",
            "type": "select",
            "required": false,
            "helper": "Doctor to see at follow-up"
          },
          {
            "name": "follow_up_instructions",
            "label": "Follow-up instructions",
            "type": "textarea",
            "required": true,
            "helper": "Warning signs to watch for, activity restrictions"
          },
          {
            "name": "wound_care_instructions",
            "label": "Wound care instructions",
            "type": "textarea",
            "required": false,
            "helper": "For surgical or trauma patients"
          },
          {
            "name": "dietary_instructions",
            "label": "Dietary instructions",
            "type": "textarea",
            "required": false,
            "helper": "Dietary modifications if needed"
          },
          {
            "name": "referring_back_to",
            "label": "Referring back to",
            "type": "text",
            "required": false,
            "helper": "For transfer - facility receiving the patient",
            "placeholder": "For transfer - facility receiving the patient"
          }
        ]
      },
      {
        "name": "Ward Transfer Form",
        "description": "Capture ward transfer details.",
        "fields": [
          {
            "name": "from_ward",
            "label": "From ward",
            "type": "text",
            "required": true,
            "helper": "Current ward - auto-filled",
            "placeholder": "Current ward - auto-filled"
          },
          {
            "name": "from_bed",
            "label": "From bed",
            "type": "text",
            "required": true,
            "helper": "Current bed - auto-filled",
            "placeholder": "Current bed - auto-filled"
          },
          {
            "name": "to_ward",
            "label": "To ward",
            "type": "select",
            "required": true,
            "helper": "Destination ward"
          },
          {
            "name": "to_bed",
            "label": "To bed",
            "type": "select",
            "required": true,
            "helper": "Available bed in destination ward"
          },
          {
            "name": "reason_for_transfer",
            "label": "Reason for transfer",
            "type": "textarea",
            "required": true,
            "helper": "Clinical reason e.g. ICU escalation, step-down, bed availability"
          },
          {
            "name": "authorised_by",
            "label": "Authorised by",
            "type": "select",
            "required": true,
            "helper": "Doctor approving the transfer"
          }
        ]
      }
    ]
  },
  "emergency": {
    "forms": [
      {
        "name": "Emergency Triage Form",
        "description": "Capture emergency triage details.",
        "fields": [
          {
            "name": "patient_name",
            "label": "Patient name",
            "type": "text",
            "required": true,
            "helper": "Full name - MRN auto-searched or created",
            "placeholder": "Full name - MRN auto-searched or created"
          },
          {
            "name": "arrival_mode",
            "label": "Arrival mode",
            "type": "select",
            "required": true,
            "helper": "Walk-in | Ambulance | Police | Referred | Air",
            "options": [
              "Walk-in",
              "Ambulance",
              "Police",
              "Referred",
              "Air"
            ]
          },
          {
            "name": "triage_category",
            "label": "Triage category",
            "type": "select",
            "required": true,
            "helper": "P1 Immediate | P2 Urgent | P3 Semi-urgent | P4 Non-urgent | P5 Dead",
            "options": [
              "P1 Immediate",
              "P2 Urgent",
              "P3 Semi-urgent",
              "P4 Non-urgent",
              "P5 Dead"
            ]
          },
          {
            "name": "triage_system",
            "label": "Triage system",
            "type": "select",
            "required": true,
            "helper": "MTS | SATS | ESI | START",
            "options": [
              "MTS",
              "SATS",
              "ESI",
              "START"
            ]
          },
          {
            "name": "chief_complaint",
            "label": "Chief complaint",
            "type": "text",
            "required": true,
            "helper": "Primary emergency complaint",
            "placeholder": "Primary emergency complaint"
          },
          {
            "name": "mechanism_of_injury",
            "label": "Mechanism of injury",
            "type": "text",
            "required": false,
            "helper": "For trauma: how injury occurred",
            "placeholder": "For trauma: how injury occurred"
          },
          {
            "name": "airway",
            "label": "Airway",
            "type": "select",
            "required": true,
            "helper": "Patent | Compromised | Obstructed",
            "options": [
              "Patent",
              "Compromised",
              "Obstructed"
            ]
          },
          {
            "name": "breathing",
            "label": "Breathing",
            "type": "select",
            "required": true,
            "helper": "Adequate | Inadequate | Absent",
            "options": [
              "Adequate",
              "Inadequate",
              "Absent"
            ]
          },
          {
            "name": "circulation",
            "label": "Circulation",
            "type": "select",
            "required": true,
            "helper": "Normal | Compromised | Absent",
            "options": [
              "Normal",
              "Compromised",
              "Absent"
            ]
          },
          {
            "name": "disability_avpu",
            "label": "Disability (AVPU)",
            "type": "select",
            "required": true,
            "helper": "Alert | Voice | Pain | Unresponsive",
            "options": [
              "Alert",
              "Voice",
              "Pain",
              "Unresponsive"
            ]
          },
          {
            "name": "temperature_c",
            "label": "Temperature (°C)",
            "type": "number",
            "required": true,
            "helper": "Body temperature",
            "placeholder": "Body temperature"
          },
          {
            "name": "pulse_bpm",
            "label": "Pulse (bpm)",
            "type": "number",
            "required": true,
            "helper": "Heart rate",
            "placeholder": "Heart rate"
          },
          {
            "name": "blood_pressure",
            "label": "Blood pressure",
            "type": "text",
            "required": true,
            "helper": "Systolic/Diastolic",
            "placeholder": "Systolic/Diastolic"
          },
          {
            "name": "respiratory_rate",
            "label": "Respiratory rate",
            "type": "number",
            "required": true,
            "helper": "Breaths per minute",
            "placeholder": "Breaths per minute"
          },
          {
            "name": "spo2",
            "label": "SpO2 (%)",
            "type": "number",
            "required": true,
            "helper": "Oxygen saturation",
            "placeholder": "Oxygen saturation"
          },
          {
            "name": "gcs_total",
            "label": "GCS total",
            "type": "number",
            "required": true,
            "helper": "Glasgow Coma Scale 3–15",
            "placeholder": "Glasgow Coma Scale 3–15"
          },
          {
            "name": "pain_score",
            "label": "Pain score",
            "type": "text",
            "required": true,
            "helper": "0–10 scale",
            "placeholder": "0–10 scale"
          },
          {
            "name": "blood_glucose",
            "label": "Blood glucose",
            "type": "number",
            "required": false,
            "helper": "Bedside glucose mmol/L",
            "placeholder": "Bedside glucose mmol/L"
          },
          {
            "name": "pregnancy_status",
            "label": "Pregnancy status",
            "type": "select",
            "required": false,
            "helper": "If applicable - female of reproductive age"
          },
          {
            "name": "allergies",
            "label": "Allergies",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm allergy status checked"
          },
          {
            "name": "resuscitation_bay_needed",
            "label": "Resuscitation bay needed",
            "type": "checkbox",
            "required": false,
            "helper": "Tick to activate resuscitation bay"
          },
          {
            "name": "pre_arrival_notification",
            "label": "Pre-arrival notification",
            "type": "checkbox",
            "required": false,
            "helper": "Tick if ambulance pre-notified"
          }
        ]
      },
      {
        "name": "Emergency Encounter Form",
        "description": "Capture emergency encounter details.",
        "fields": [
          {
            "name": "clinical_assessment",
            "label": "Clinical assessment",
            "type": "textarea",
            "required": true,
            "helper": "Full clinical assessment by emergency doctor"
          },
          {
            "name": "working_diagnosis",
            "label": "Working diagnosis",
            "type": "text",
            "required": true,
            "helper": "Emergency diagnosis - ICD-10 coded",
            "placeholder": "Emergency diagnosis - ICD-10 coded"
          },
          {
            "name": "investigations_ordered",
            "label": "Investigations ordered",
            "type": "text",
            "required": false,
            "helper": "Labs, imaging, ECG, blood cultures",
            "placeholder": "Labs, imaging, ECG, blood cultures"
          },
          {
            "name": "resuscitation_actions",
            "label": "Resuscitation actions",
            "type": "textarea",
            "required": false,
            "helper": "Detailed resuscitation steps performed"
          },
          {
            "name": "treatments_given",
            "label": "Treatments given",
            "type": "text",
            "required": false,
            "helper": "Drugs and interventions in emergency department",
            "placeholder": "Drugs and interventions in emergency department"
          },
          {
            "name": "disposition",
            "label": "Disposition",
            "type": "select",
            "required": true,
            "helper": "Admitted | ICU | Theatre | Discharged | Transferred | Deceased",
            "options": [
              "Admitted",
              "ICU",
              "Theatre",
              "Discharged",
              "Transferred",
              "Deceased"
            ]
          },
          {
            "name": "disposition_time",
            "label": "Disposition time",
            "type": "datetime",
            "required": true,
            "helper": "Time disposition decision was made"
          },
          {
            "name": "trauma_team_activated",
            "label": "Trauma team activated",
            "type": "checkbox",
            "required": false,
            "helper": "Tick if trauma team was paged"
          }
        ]
      },
      {
        "name": "Trauma Documentation Form",
        "description": "Capture trauma documentation details.",
        "fields": [
          {
            "name": "time_of_injury",
            "label": "Time of injury",
            "type": "datetime",
            "required": true,
            "helper": "When injury occurred"
          },
          {
            "name": "injury_mechanism",
            "label": "Injury mechanism",
            "type": "select",
            "required": true,
            "helper": "MVA | Fall | Assault | Gunshot | Stab | Burns | Drowning | Other",
            "options": [
              "MVA",
              "Fall",
              "Assault",
              "Gunshot",
              "Stab",
              "Burns",
              "Drowning",
              "Other"
            ]
          },
          {
            "name": "body_regions_injured",
            "label": "Body regions injured",
            "type": "text",
            "required": true,
            "helper": "Head | Neck | Chest | Abdomen | Pelvis | Spine | Upper limb | Lower limb",
            "placeholder": "Head | Neck | Chest | Abdomen | Pelvis | Spine | Upper limb | Lower limb"
          },
          {
            "name": "injury_severity_score",
            "label": "Injury severity score",
            "type": "number",
            "required": false,
            "helper": "ISS - calculated from AIS scores per region",
            "placeholder": "ISS - calculated from AIS scores per region"
          },
          {
            "name": "police_case_number",
            "label": "Police case number",
            "type": "text",
            "required": false,
            "helper": "P3 form or OB number if police case",
            "placeholder": "P3 form or OB number if police case"
          },
          {
            "name": "tetanus_status",
            "label": "Tetanus status",
            "type": "select",
            "required": false,
            "helper": "Up to date | Not up to date | Unknown",
            "options": [
              "Up to date",
              "Not up to date",
              "Unknown"
            ]
          },
          {
            "name": "tetanus_given",
            "label": "Tetanus given",
            "type": "checkbox",
            "required": false,
            "helper": "Tick if tetanus prophylaxis administered"
          }
        ]
      }
    ]
  },
  "ambulance": {
    "forms": [
      {
        "name": "Dispatch Form",
        "description": "Capture dispatch details.",
        "fields": [
          {
            "name": "call_received_time",
            "label": "Call received time",
            "type": "datetime",
            "required": true,
            "helper": "Exact time emergency call was received"
          },
          {
            "name": "caller_name",
            "label": "Caller name",
            "type": "text",
            "required": false,
            "helper": "Name of person who called",
            "placeholder": "Name of person who called"
          },
          {
            "name": "caller_phone",
            "label": "Caller phone",
            "type": "tel",
            "required": true,
            "helper": "Phone number of caller",
            "placeholder": "Phone number of caller"
          },
          {
            "name": "scene_address",
            "label": "Scene address",
            "type": "text",
            "required": true,
            "helper": "Location of emergency - as specific as possible",
            "placeholder": "Location of emergency - as specific as possible"
          },
          {
            "name": "gps_coordinates",
            "label": "GPS coordinates",
            "type": "text",
            "required": false,
            "helper": "Auto-capture GPS from caller or map pin",
            "placeholder": "Auto-capture GPS from caller or map pin"
          },
          {
            "name": "call_type",
            "label": "Call type",
            "type": "select",
            "required": true,
            "helper": "Medical | Trauma | Obstetric | Paediatric | Cardiac | Psychiatric | Fire | RTA",
            "options": [
              "Medical",
              "Trauma",
              "Obstetric",
              "Paediatric",
              "Cardiac",
              "Psychiatric",
              "Fire",
              "RTA"
            ]
          },
          {
            "name": "patient_condition",
            "label": "Patient condition",
            "type": "text",
            "required": false,
            "helper": "Brief patient status from caller",
            "placeholder": "Brief patient status from caller"
          },
          {
            "name": "ambulance_assigned",
            "label": "Ambulance assigned",
            "type": "select",
            "required": true,
            "helper": "Vehicle to dispatch"
          },
          {
            "name": "crew_assigned",
            "label": "Crew assigned",
            "type": "text",
            "required": true,
            "helper": "Paramedic team for this call",
            "placeholder": "Paramedic team for this call"
          },
          {
            "name": "dispatch_time",
            "label": "Dispatch time",
            "type": "datetime",
            "required": true,
            "helper": "Time ambulance was dispatched"
          }
        ]
      },
      {
        "name": "Scene Report Form",
        "description": "Capture scene report details.",
        "fields": [
          {
            "name": "en_route_time",
            "label": "En route time",
            "type": "time",
            "required": true,
            "helper": "Time vehicle started moving"
          },
          {
            "name": "scene_arrival_time",
            "label": "Scene arrival time",
            "type": "time",
            "required": true,
            "helper": "Time vehicle arrived at scene"
          },
          {
            "name": "patient_found",
            "label": "Patient found",
            "type": "text",
            "required": true,
            "helper": "Yes | No | Deceased at scene",
            "placeholder": "Yes | No | Deceased at scene"
          },
          {
            "name": "patient_name",
            "label": "Patient name",
            "type": "text",
            "required": false,
            "helper": "Patient name if obtainable",
            "placeholder": "Patient name if obtainable"
          },
          {
            "name": "age_estimate",
            "label": "Age estimate",
            "type": "text",
            "required": false,
            "helper": "Estimated age if ID not available",
            "placeholder": "Estimated age if ID not available"
          },
          {
            "name": "scene_assessment",
            "label": "Scene assessment",
            "type": "textarea",
            "required": true,
            "helper": "Scene safety, mechanism, patient condition"
          },
          {
            "name": "vital_signs_at_scene",
            "label": "Vital signs at scene",
            "type": "text",
            "required": true,
            "helper": "BP, HR, RR, SpO2, GCS, Temp",
            "placeholder": "BP, HR, RR, SpO2, GCS, Temp"
          },
          {
            "name": "pre_hospital_interventions",
            "label": "Pre-hospital interventions",
            "type": "textarea",
            "required": true,
            "helper": "Airway management, IV access, drugs given, immobilisation"
          },
          {
            "name": "departed_scene_time",
            "label": "Departed scene time",
            "type": "time",
            "required": true,
            "helper": "Time vehicle left scene"
          },
          {
            "name": "hospital_arrival_time",
            "label": "Hospital arrival time",
            "type": "time",
            "required": true,
            "helper": "Time patient arrived at hospital"
          },
          {
            "name": "handover_to",
            "label": "Handover to",
            "type": "text",
            "required": true,
            "helper": "Name of receiving clinician",
            "placeholder": "Name of receiving clinician"
          },
          {
            "name": "handover_notes",
            "label": "Handover notes",
            "type": "textarea",
            "required": true,
            "helper": "Verbal handover content documented"
          }
        ]
      },
      {
        "name": "Fleet Maintenance Record",
        "description": "Capture fleet maintenance record details.",
        "fields": [
          {
            "name": "ambulance",
            "label": "Ambulance",
            "type": "select",
            "required": true,
            "helper": "Vehicle registration"
          },
          {
            "name": "maintenance_type",
            "label": "Maintenance type",
            "type": "select",
            "required": true,
            "helper": "Preventive | Corrective | Inspection",
            "options": [
              "Preventive",
              "Corrective",
              "Inspection"
            ]
          },
          {
            "name": "service_date",
            "label": "Service date",
            "type": "date",
            "required": true,
            "helper": "Date of service"
          },
          {
            "name": "mileage",
            "label": "Mileage",
            "type": "number",
            "required": true,
            "helper": "Odometer reading at service",
            "placeholder": "Odometer reading at service"
          },
          {
            "name": "work_performed",
            "label": "Work performed",
            "type": "textarea",
            "required": true,
            "helper": "Description of maintenance work done"
          },
          {
            "name": "parts_replaced",
            "label": "Parts replaced",
            "type": "text",
            "required": false,
            "helper": "Parts or consumables replaced",
            "placeholder": "Parts or consumables replaced"
          },
          {
            "name": "cost_kes",
            "label": "Cost (KES)",
            "type": "number",
            "required": false,
            "helper": "Total maintenance cost",
            "placeholder": "Total maintenance cost"
          },
          {
            "name": "next_service_due",
            "label": "Next service due",
            "type": "date",
            "required": true,
            "helper": "Next scheduled maintenance date"
          },
          {
            "name": "serviced_by",
            "label": "Serviced by",
            "type": "text",
            "required": true,
            "helper": "Mechanic or garage name",
            "placeholder": "Mechanic or garage name"
          }
        ]
      }
    ]
  },
  "wards": {
    "forms": [
      {
        "name": "Ward Configuration Form",
        "description": "Capture ward configuration details.",
        "fields": [
          {
            "name": "ward_name",
            "label": "Ward name",
            "type": "text",
            "required": true,
            "helper": "e.g. Male Medical Ward, Paediatric Ward",
            "placeholder": "e.g. Male Medical Ward, Paediatric Ward"
          },
          {
            "name": "ward_type",
            "label": "Ward type",
            "type": "select",
            "required": true,
            "helper": "General | Surgical | Paediatric | Maternity | ICU | NICU | Isolation",
            "options": [
              "General",
              "Surgical",
              "Paediatric",
              "Maternity",
              "ICU",
              "NICU",
              "Isolation"
            ]
          },
          {
            "name": "floor",
            "label": "Floor",
            "type": "text",
            "required": false,
            "helper": "Building floor e.g. Ground, 1st, 2nd",
            "placeholder": "Building floor e.g. Ground, 1st, 2nd"
          },
          {
            "name": "total_beds",
            "label": "Total beds",
            "type": "number",
            "required": true,
            "helper": "Total configured bed count",
            "placeholder": "Total configured bed count"
          },
          {
            "name": "male_beds",
            "label": "Male beds",
            "type": "number",
            "required": false,
            "helper": "Beds designated for male patients",
            "placeholder": "Beds designated for male patients"
          },
          {
            "name": "female_beds",
            "label": "Female beds",
            "type": "number",
            "required": false,
            "helper": "Beds designated for female patients",
            "placeholder": "Beds designated for female patients"
          },
          {
            "name": "private_beds",
            "label": "Private beds",
            "type": "number",
            "required": false,
            "helper": "Private room beds",
            "placeholder": "Private room beds"
          },
          {
            "name": "ward_manager",
            "label": "Ward manager",
            "type": "select",
            "required": true,
            "helper": "Staff member in charge of ward"
          }
        ]
      },
      {
        "name": "Bed Status Update Form",
        "description": "Capture bed status update details.",
        "fields": [
          {
            "name": "bed_number",
            "label": "Bed number",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from bed selection",
            "placeholder": "Auto-filled from bed selection"
          },
          {
            "name": "status",
            "label": "Status",
            "type": "select",
            "required": true,
            "helper": "Available | Occupied | Cleaning | Maintenance | Reserved | Closed",
            "options": [
              "Available",
              "Occupied",
              "Cleaning",
              "Maintenance",
              "Reserved",
              "Closed"
            ]
          },
          {
            "name": "housekeeping_notes",
            "label": "Housekeeping notes",
            "type": "text",
            "required": false,
            "helper": "Special instructions for cleaning team",
            "placeholder": "Special instructions for cleaning team"
          },
          {
            "name": "estimated_ready_time",
            "label": "Estimated ready time",
            "type": "time",
            "required": false,
            "helper": "When bed will be ready for next patient"
          }
        ]
      }
    ]
  },
  "ehr": {
    "forms": [
      {
        "name": "Clinical Encounter Form",
        "description": "Capture clinical encounter details.",
        "fields": [
          {
            "name": "chief_complaint",
            "label": "Chief complaint",
            "type": "text",
            "required": true,
            "helper": "Reason for visit in patient's own words",
            "placeholder": "Reason for visit in patient's own words"
          },
          {
            "name": "history_of_presenting_illness",
            "label": "History of presenting illness",
            "type": "textarea",
            "required": true,
            "helper": "Narrative: onset, duration, severity, progression, associated symptoms"
          },
          {
            "name": "past_medical_history",
            "label": "Past medical history",
            "type": "textarea",
            "required": false,
            "helper": "Known conditions, hospitalisations, chronic diseases"
          },
          {
            "name": "past_surgical_history",
            "label": "Past surgical history",
            "type": "textarea",
            "required": false,
            "helper": "Previous operations with dates"
          },
          {
            "name": "family_history",
            "label": "Family history",
            "type": "textarea",
            "required": false,
            "helper": "Relevant family conditions - first-degree relatives"
          },
          {
            "name": "social_history",
            "label": "Social history",
            "type": "textarea",
            "required": false,
            "helper": "Occupation, smoking, alcohol, substance use, living conditions"
          },
          {
            "name": "review_of_systems",
            "label": "Review of systems",
            "type": "text",
            "required": false,
            "helper": "Structured per-system enquiry",
            "placeholder": "Structured per-system enquiry"
          },
          {
            "name": "physical_examination",
            "label": "Physical examination",
            "type": "textarea",
            "required": true,
            "helper": "Full examination findings per system"
          },
          {
            "name": "assessment_impression",
            "label": "Assessment / impression",
            "type": "textarea",
            "required": true,
            "helper": "Clinical reasoning and differential diagnoses"
          },
          {
            "name": "plan",
            "label": "Plan",
            "type": "textarea",
            "required": true,
            "helper": "Management plan - investigations, treatment, referrals"
          }
        ]
      },
      {
        "name": "Diagnosis Entry Form",
        "description": "Capture diagnosis entry details.",
        "fields": [
          {
            "name": "icd_10_code",
            "label": "ICD-10 code",
            "type": "text",
            "required": true,
            "helper": "Searchable ICD-10 code and description",
            "placeholder": "Searchable ICD-10 code and description"
          },
          {
            "name": "diagnosis_type",
            "label": "Diagnosis type",
            "type": "select",
            "required": true,
            "helper": "Principal | Secondary | Complication | Comorbidity",
            "options": [
              "Principal",
              "Secondary",
              "Complication",
              "Comorbidity"
            ]
          },
          {
            "name": "status",
            "label": "Status",
            "type": "select",
            "required": true,
            "helper": "Provisional | Confirmed | Differential | Ruled out",
            "options": [
              "Provisional",
              "Confirmed",
              "Differential",
              "Ruled out"
            ]
          },
          {
            "name": "onset_date",
            "label": "Onset date",
            "type": "date",
            "required": false,
            "helper": "When condition began"
          },
          {
            "name": "is_chronic",
            "label": "Is chronic",
            "type": "checkbox",
            "required": false,
            "helper": "Add to patient's problem list if chronic"
          },
          {
            "name": "notes",
            "label": "Notes",
            "type": "text",
            "required": false,
            "helper": "Clinical notes on this diagnosis",
            "placeholder": "Clinical notes on this diagnosis"
          }
        ]
      },
      {
        "name": "Vital Signs Form",
        "description": "Capture vital signs details.",
        "fields": [
          {
            "name": "temperature_c",
            "label": "Temperature (°C)",
            "type": "number",
            "required": false,
            "helper": "Body temperature - normal 36.1–37.2",
            "placeholder": "Body temperature - normal 36.1–37.2"
          },
          {
            "name": "pulse_bpm",
            "label": "Pulse (bpm)",
            "type": "number",
            "required": false,
            "helper": "Heart rate - normal 60–100",
            "placeholder": "Heart rate - normal 60–100"
          },
          {
            "name": "systolic_bp_mmhg",
            "label": "Systolic BP (mmHg)",
            "type": "number",
            "required": false,
            "helper": "Systolic blood pressure",
            "placeholder": "Systolic blood pressure"
          },
          {
            "name": "diastolic_bp_mmhg",
            "label": "Diastolic BP (mmHg)",
            "type": "number",
            "required": false,
            "helper": "Diastolic blood pressure",
            "placeholder": "Diastolic blood pressure"
          },
          {
            "name": "respiratory_rate",
            "label": "Respiratory rate",
            "type": "number",
            "required": false,
            "helper": "Breaths per minute - normal 12–20",
            "placeholder": "Breaths per minute - normal 12–20"
          },
          {
            "name": "spo2",
            "label": "SpO2 (%)",
            "type": "number",
            "required": false,
            "helper": "Oxygen saturation - normal ≥95%",
            "placeholder": "Oxygen saturation - normal ≥95%"
          },
          {
            "name": "gcs_eye",
            "label": "GCS Eye",
            "type": "select",
            "required": false,
            "helper": "1–4 component score"
          },
          {
            "name": "gcs_verbal",
            "label": "GCS Verbal",
            "type": "select",
            "required": false,
            "helper": "1–5 component score"
          },
          {
            "name": "gcs_motor",
            "label": "GCS Motor",
            "type": "select",
            "required": false,
            "helper": "1–6 component score"
          },
          {
            "name": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": false,
            "helper": "Body weight",
            "placeholder": "Body weight"
          },
          {
            "name": "height_cm",
            "label": "Height (cm)",
            "type": "number",
            "required": false,
            "helper": "Height for BMI calculation",
            "placeholder": "Height for BMI calculation"
          },
          {
            "name": "pain_score_0_10",
            "label": "Pain score (0–10)",
            "type": "text",
            "required": false,
            "helper": "Numeric pain rating scale",
            "placeholder": "Numeric pain rating scale"
          },
          {
            "name": "blood_glucose_mmol_l",
            "label": "Blood glucose (mmol/L)",
            "type": "number",
            "required": false,
            "helper": "Bedside glucose reading",
            "placeholder": "Bedside glucose reading"
          },
          {
            "name": "urine_output_ml",
            "label": "Urine output (mL)",
            "type": "number",
            "required": false,
            "helper": "Urine output for period",
            "placeholder": "Urine output for period"
          }
        ]
      },
      {
        "name": "Progress Note Form",
        "description": "Capture progress note details.",
        "fields": [
          {
            "name": "note_date_time",
            "label": "Note date/time",
            "type": "datetime",
            "required": true,
            "helper": "Auto-filled with current timestamp"
          },
          {
            "name": "soap_subjective",
            "label": "SOAP — Subjective",
            "type": "textarea",
            "required": true,
            "helper": "Patient-reported changes since last review"
          },
          {
            "name": "soap_objective",
            "label": "SOAP — Objective",
            "type": "textarea",
            "required": true,
            "helper": "Examination findings and observation data"
          },
          {
            "name": "soap_assessment",
            "label": "SOAP — Assessment",
            "type": "textarea",
            "required": true,
            "helper": "Clinical interpretation - improving, stable, deteriorating"
          },
          {
            "name": "soap_plan",
            "label": "SOAP — Plan",
            "type": "textarea",
            "required": true,
            "helper": "Changes to management plan"
          }
        ]
      },
      {
        "name": "Clinical Order Form",
        "description": "Capture clinical order details.",
        "fields": [
          {
            "name": "order_type",
            "label": "Order type",
            "type": "select",
            "required": true,
            "helper": "Lab | Radiology | Referral | Diet | Procedure | Nursing | Physiotherapy",
            "options": [
              "Lab",
              "Radiology",
              "Referral",
              "Diet",
              "Procedure",
              "Nursing",
              "Physiotherapy"
            ]
          },
          {
            "name": "priority",
            "label": "Priority",
            "type": "select",
            "required": true,
            "helper": "Routine | Urgent | STAT",
            "options": [
              "Routine",
              "Urgent",
              "STAT"
            ]
          },
          {
            "name": "clinical_indication",
            "label": "Clinical indication",
            "type": "text",
            "required": true,
            "helper": "Reason for the order",
            "placeholder": "Reason for the order"
          },
          {
            "name": "special_instructions",
            "label": "Special instructions",
            "type": "text",
            "required": false,
            "helper": "Additional instructions for the receiving department",
            "placeholder": "Additional instructions for the receiving department"
          }
        ]
      }
    ]
  },
  "nursing": {
    "forms": [
      {
        "name": "Nursing Assessment Form",
        "description": "Capture nursing assessment details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from admission",
            "placeholder": "Auto-filled from admission"
          },
          {
            "name": "assessment_date_time",
            "label": "Assessment date/time",
            "type": "datetime",
            "required": true,
            "helper": "Current timestamp"
          },
          {
            "name": "nursing_history",
            "label": "Nursing history",
            "type": "textarea",
            "required": true,
            "helper": "Nursing-focused history - hygiene, mobility, nutrition, elimination"
          },
          {
            "name": "current_medications",
            "label": "Current medications",
            "type": "text",
            "required": true,
            "helper": "List of all current medications being taken",
            "placeholder": "List of all current medications being taken"
          },
          {
            "name": "allergies",
            "label": "Allergies",
            "type": "text",
            "required": true,
            "helper": "Pulled from patient allergy record",
            "placeholder": "Pulled from patient allergy record"
          },
          {
            "name": "mobility_status",
            "label": "Mobility status",
            "type": "select",
            "required": true,
            "helper": "Independent | Assisted | Dependent | Bedbound",
            "options": [
              "Independent",
              "Assisted",
              "Dependent",
              "Bedbound"
            ]
          },
          {
            "name": "self_care_ability",
            "label": "Self-care ability",
            "type": "select",
            "required": true,
            "helper": "Independent | Needs help | Fully dependent",
            "options": [
              "Independent",
              "Needs help",
              "Fully dependent"
            ]
          },
          {
            "name": "nutritional_status",
            "label": "Nutritional status",
            "type": "select",
            "required": true,
            "helper": "Adequate | At risk | Malnourished",
            "options": [
              "Adequate",
              "At risk",
              "Malnourished"
            ]
          },
          {
            "name": "skin_integrity",
            "label": "Skin integrity",
            "type": "select",
            "required": true,
            "helper": "Intact | Redness | Wound | Pressure injury",
            "options": [
              "Intact",
              "Redness",
              "Wound",
              "Pressure injury"
            ]
          },
          {
            "name": "risk_assessments",
            "label": "Risk assessments",
            "type": "text",
            "required": true,
            "helper": "Falls risk | Pressure injury risk | DVT risk | Nutritional risk",
            "placeholder": "Falls risk | Pressure injury risk | DVT risk | Nutritional risk"
          },
          {
            "name": "psychological_status",
            "label": "Psychological status",
            "type": "text",
            "required": false,
            "helper": "Mood, anxiety, orientation to time and place",
            "placeholder": "Mood, anxiety, orientation to time and place"
          }
        ]
      },
      {
        "name": "Medication Administration Record (MAR)",
        "description": "Capture medication administration record (mar) details.",
        "fields": [
          {
            "name": "drug_name",
            "label": "Drug name",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from prescription",
            "placeholder": "Auto-filled from prescription"
          },
          {
            "name": "dose",
            "label": "Dose",
            "type": "text",
            "required": true,
            "helper": "Prescribed dose",
            "placeholder": "Prescribed dose"
          },
          {
            "name": "route",
            "label": "Route",
            "type": "text",
            "required": true,
            "helper": "Prescribed route",
            "placeholder": "Prescribed route"
          },
          {
            "name": "scheduled_time",
            "label": "Scheduled time",
            "type": "text",
            "required": true,
            "helper": "Time drug is due",
            "placeholder": "Time drug is due"
          },
          {
            "name": "administration_time",
            "label": "Administration time",
            "type": "time",
            "required": true,
            "helper": "Actual time drug was given"
          },
          {
            "name": "administered_by",
            "label": "Administered by",
            "type": "text",
            "required": true,
            "helper": "Logged-in nurse - auto-filled",
            "placeholder": "Logged-in nurse - auto-filled"
          },
          {
            "name": "status",
            "label": "Status",
            "type": "select",
            "required": true,
            "helper": "Given | Withheld | Not given | Patient refused",
            "options": [
              "Given",
              "Withheld",
              "Not given",
              "Patient refused"
            ]
          },
          {
            "name": "dose_given",
            "label": "Dose given",
            "type": "text",
            "required": false,
            "helper": "If different from prescribed dose - state reason",
            "placeholder": "If different from prescribed dose - state reason"
          },
          {
            "name": "administration_site",
            "label": "Administration site",
            "type": "text",
            "required": false,
            "helper": "Injection site e.g. Left deltoid",
            "placeholder": "Injection site e.g. Left deltoid"
          },
          {
            "name": "withhold_reason",
            "label": "Withhold reason",
            "type": "text",
            "required": false,
            "helper": "Mandatory if dose was withheld",
            "placeholder": "Mandatory if dose was withheld"
          }
        ]
      },
      {
        "name": "Nursing Handover Form",
        "description": "Capture nursing handover details.",
        "fields": [
          {
            "name": "ward",
            "label": "Ward",
            "type": "text",
            "required": true,
            "helper": "Current ward - auto-filled",
            "placeholder": "Current ward - auto-filled"
          },
          {
            "name": "shift_handover_time",
            "label": "Shift handover time",
            "type": "datetime",
            "required": true,
            "helper": "Time of handover"
          },
          {
            "name": "outgoing_nurse",
            "label": "Outgoing nurse",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from login",
            "placeholder": "Auto-filled from login"
          },
          {
            "name": "incoming_nurse",
            "label": "Incoming nurse",
            "type": "select",
            "required": true,
            "helper": "Nurse receiving the handover"
          },
          {
            "name": "patient_summaries",
            "label": "Patient summaries",
            "type": "text",
            "required": true,
            "helper": "Per-patient: current status, concerns, pending tasks",
            "placeholder": "Per-patient: current status, concerns, pending tasks"
          },
          {
            "name": "general_ward_notes",
            "label": "General ward notes",
            "type": "textarea",
            "required": false,
            "helper": "Equipment issues, staffing concerns, incidents"
          },
          {
            "name": "incoming_nurse_acknowledgement",
            "label": "Incoming nurse acknowledgement",
            "type": "text",
            "required": true,
            "helper": "Digital sign-off by incoming nurse",
            "placeholder": "Digital sign-off by incoming nurse"
          }
        ]
      },
      {
        "name": "Fluid Balance Chart",
        "description": "Capture fluid balance chart details.",
        "fields": [
          {
            "name": "recording_time",
            "label": "Recording time",
            "type": "datetime",
            "required": true,
            "helper": "Hourly for ICU, 4-hourly for wards"
          },
          {
            "name": "oral_intake_ml",
            "label": "Oral intake (mL)",
            "type": "number",
            "required": false,
            "helper": "Fluids taken by mouth",
            "placeholder": "Fluids taken by mouth"
          },
          {
            "name": "iv_fluids_ml",
            "label": "IV fluids (mL)",
            "type": "number",
            "required": false,
            "helper": "Intravenous fluids infused",
            "placeholder": "Intravenous fluids infused"
          },
          {
            "name": "ng_feed_ml",
            "label": "NG feed (mL)",
            "type": "number",
            "required": false,
            "helper": "Nasogastric feed volume",
            "placeholder": "Nasogastric feed volume"
          },
          {
            "name": "blood_products_ml",
            "label": "Blood products (mL)",
            "type": "number",
            "required": false,
            "helper": "Blood or blood products given",
            "placeholder": "Blood or blood products given"
          },
          {
            "name": "urine_output_ml",
            "label": "Urine output (mL)",
            "type": "number",
            "required": false,
            "helper": "Urine measured in catheter bag or urinal",
            "placeholder": "Urine measured in catheter bag or urinal"
          },
          {
            "name": "drain_output_ml",
            "label": "Drain output (mL)",
            "type": "number",
            "required": false,
            "helper": "Surgical drain drainage",
            "placeholder": "Surgical drain drainage"
          },
          {
            "name": "vomit_ml",
            "label": "Vomit (mL)",
            "type": "number",
            "required": false,
            "helper": "Vomit or NG aspirate",
            "placeholder": "Vomit or NG aspirate"
          },
          {
            "name": "stool_ml",
            "label": "Stool (mL)",
            "type": "number",
            "required": false,
            "helper": "Estimated stool output",
            "placeholder": "Estimated stool output"
          }
        ]
      },
      {
        "name": "Pressure Injury Braden Scale Form",
        "description": "Capture pressure injury braden scale details.",
        "fields": [
          {
            "name": "sensory_perception",
            "label": "Sensory perception",
            "type": "select",
            "required": true,
            "helper": "1-Completely limited to 4-No impairment"
          },
          {
            "name": "moisture",
            "label": "Moisture",
            "type": "select",
            "required": true,
            "helper": "1-Constantly moist to 4-Rarely moist"
          },
          {
            "name": "activity",
            "label": "Activity",
            "type": "select",
            "required": true,
            "helper": "1-Bedfast to 4-Walks frequently"
          },
          {
            "name": "mobility",
            "label": "Mobility",
            "type": "select",
            "required": true,
            "helper": "1-Completely immobile to 4-No limitations"
          },
          {
            "name": "nutrition",
            "label": "Nutrition",
            "type": "select",
            "required": true,
            "helper": "1-Very poor to 4-Excellent"
          },
          {
            "name": "friction_and_shear",
            "label": "Friction & shear",
            "type": "select",
            "required": true,
            "helper": "1-Problem to 3-No apparent problem"
          },
          {
            "name": "existing_pressure_injuries",
            "label": "Existing pressure injuries",
            "type": "text",
            "required": false,
            "helper": "Site, stage, size, description of current wounds",
            "placeholder": "Site, stage, size, description of current wounds"
          },
          {
            "name": "prevention_plan",
            "label": "Prevention plan",
            "type": "text",
            "required": true,
            "helper": "Repositioning | Heel offloading | Special mattress | Skin care",
            "placeholder": "Repositioning | Heel offloading | Special mattress | Skin care"
          }
        ]
      }
    ]
  },
  "nursing-admin": {
    "forms": [
      {
        "name": "Duty Roster Form",
        "description": "Capture duty roster details.",
        "fields": [
          {
            "name": "ward",
            "label": "Ward",
            "type": "select",
            "required": true,
            "helper": "Ward being rostered"
          },
          {
            "name": "month",
            "label": "Month",
            "type": "text",
            "required": true,
            "helper": "Roster month",
            "placeholder": "Roster month"
          },
          {
            "name": "staff_member",
            "label": "Staff member",
            "type": "select",
            "required": true,
            "helper": "Nurse being scheduled"
          },
          {
            "name": "shift_date",
            "label": "Shift date",
            "type": "date",
            "required": true,
            "helper": "Date of duty"
          },
          {
            "name": "shift_type",
            "label": "Shift type",
            "type": "select",
            "required": true,
            "helper": "Day | Night | Evening | Split | On-call",
            "options": [
              "Day",
              "Night",
              "Evening",
              "Split",
              "On-call"
            ]
          },
          {
            "name": "start_time",
            "label": "Start time",
            "type": "time",
            "required": true,
            "helper": "Shift start"
          },
          {
            "name": "end_time",
            "label": "End time",
            "type": "time",
            "required": true,
            "helper": "Shift end"
          },
          {
            "name": "notes",
            "label": "Notes",
            "type": "text",
            "required": false,
            "helper": "Swap notes or special instructions",
            "placeholder": "Swap notes or special instructions"
          }
        ]
      },
      {
        "name": "Nursing Competency Assessment Form",
        "description": "Capture nursing competency assessment details.",
        "fields": [
          {
            "name": "staff_member",
            "label": "Staff member",
            "type": "select",
            "required": true,
            "helper": "Nurse being assessed"
          },
          {
            "name": "competency",
            "label": "Competency",
            "type": "text",
            "required": true,
            "helper": "Skill being assessed e.g. IV Cannulation",
            "placeholder": "Skill being assessed e.g. IV Cannulation"
          },
          {
            "name": "assessment_date",
            "label": "Assessment date",
            "type": "date",
            "required": true,
            "helper": "Date of assessment"
          },
          {
            "name": "assessment_method",
            "label": "Assessment method",
            "type": "select",
            "required": true,
            "helper": "Direct observation | Simulation | Written test",
            "options": [
              "Direct observation",
              "Simulation",
              "Written test"
            ]
          },
          {
            "name": "result",
            "label": "Result",
            "type": "select",
            "required": true,
            "helper": "Competent | Not yet competent | Requires supervision",
            "options": [
              "Competent",
              "Not yet competent",
              "Requires supervision"
            ]
          },
          {
            "name": "assessor_notes",
            "label": "Assessor notes",
            "type": "textarea",
            "required": false,
            "helper": "Observations during assessment"
          },
          {
            "name": "expiry_date",
            "label": "Expiry date",
            "type": "date",
            "required": true,
            "helper": "When reassessment is required"
          }
        ]
      }
    ]
  },
  "lab": {
    "forms": [
      {
        "name": "Lab Order Form",
        "description": "Capture lab order details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from encounter",
            "placeholder": "Auto-filled from encounter"
          },
          {
            "name": "ordering_doctor",
            "label": "Ordering doctor",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from encounter",
            "placeholder": "Auto-filled from encounter"
          },
          {
            "name": "tests_requested",
            "label": "Tests requested",
            "type": "text",
            "required": true,
            "helper": "Multi-select from test catalogue with category and sample type",
            "placeholder": "Multi-select from test catalogue with category and sample type"
          },
          {
            "name": "priority",
            "label": "Priority",
            "type": "select",
            "required": true,
            "helper": "Routine | Urgent | STAT",
            "options": [
              "Routine",
              "Urgent",
              "STAT"
            ]
          },
          {
            "name": "clinical_indication",
            "label": "Clinical indication",
            "type": "text",
            "required": true,
            "helper": "Why these tests are being ordered",
            "placeholder": "Why these tests are being ordered"
          },
          {
            "name": "special_instructions",
            "label": "Special instructions",
            "type": "text",
            "required": false,
            "helper": "e.g. Fasting, timed specimen, specific time",
            "placeholder": "e.g. Fasting, timed specimen, specific time"
          }
        ]
      },
      {
        "name": "Specimen Collection Form",
        "description": "Capture specimen collection details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from lab order",
            "placeholder": "Auto-filled from lab order"
          },
          {
            "name": "test_s_ordered",
            "label": "Test(s) ordered",
            "type": "text",
            "required": true,
            "helper": "List of ordered tests",
            "placeholder": "List of ordered tests"
          },
          {
            "name": "specimen_type",
            "label": "Specimen type",
            "type": "text",
            "required": true,
            "helper": "Auto-filled based on test - blood, urine, swab",
            "placeholder": "Auto-filled based on test - blood, urine, swab"
          },
          {
            "name": "tube_type",
            "label": "Tube type",
            "type": "text",
            "required": true,
            "helper": "Colour-coded tube e.g. EDTA purple, SST gold",
            "placeholder": "Colour-coded tube e.g. EDTA purple, SST gold"
          },
          {
            "name": "volume_collected_ml",
            "label": "Volume collected (mL)",
            "type": "number",
            "required": true,
            "helper": "Actual volume collected",
            "placeholder": "Actual volume collected"
          },
          {
            "name": "collection_time",
            "label": "Collection time",
            "type": "datetime",
            "required": true,
            "helper": "Exact time of collection"
          },
          {
            "name": "collected_by",
            "label": "Collected by",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - logged in phlebotomist",
            "placeholder": "Auto-filled - logged in phlebotomist"
          },
          {
            "name": "specimen_condition",
            "label": "Specimen condition",
            "type": "select",
            "required": true,
            "helper": "Adequate | Haemolysed | Clotted | Insufficient | Wrong tube",
            "options": [
              "Adequate",
              "Haemolysed",
              "Clotted",
              "Insufficient",
              "Wrong tube"
            ]
          },
          {
            "name": "print_barcode_label",
            "label": "Print barcode label",
            "type": "text",
            "required": true,
            "helper": "Auto-generates barcode label for tube",
            "placeholder": "Auto-generates barcode label for tube"
          }
        ]
      },
      {
        "name": "Result Entry Form",
        "description": "Capture result entry details.",
        "fields": [
          {
            "name": "specimen_barcode",
            "label": "Specimen barcode",
            "type": "text",
            "required": true,
            "helper": "Scan or type specimen barcode",
            "placeholder": "Scan or type specimen barcode"
          },
          {
            "name": "analyte_name",
            "label": "Analyte name",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from test definition",
            "placeholder": "Auto-filled from test definition"
          },
          {
            "name": "result_value",
            "label": "Result value",
            "type": "text",
            "required": true,
            "helper": "Numeric or text result",
            "placeholder": "Numeric or text result"
          },
          {
            "name": "result_unit",
            "label": "Result unit",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from test definition",
            "placeholder": "Auto-filled from test definition"
          },
          {
            "name": "reference_range",
            "label": "Reference range",
            "type": "text",
            "required": true,
            "helper": "Auto-calculated from patient age and gender",
            "placeholder": "Auto-calculated from patient age and gender"
          },
          {
            "name": "interpretation",
            "label": "Interpretation",
            "type": "text",
            "required": true,
            "helper": "Auto-flagged: Normal | Low | High | Critical - editable",
            "placeholder": "Auto-flagged: Normal | Low | High | Critical - editable"
          },
          {
            "name": "analyser_id",
            "label": "Analyser ID",
            "type": "select",
            "required": false,
            "helper": "Instrument that produced the result"
          },
          {
            "name": "technician_notes",
            "label": "Technician notes",
            "type": "text",
            "required": false,
            "helper": "Comments on result quality or methodology",
            "placeholder": "Comments on result quality or methodology"
          },
          {
            "name": "critical_value_alert",
            "label": "Critical value alert",
            "type": "text",
            "required": true,
            "helper": "Auto-triggers alert if critical threshold crossed",
            "placeholder": "Auto-triggers alert if critical threshold crossed"
          }
        ]
      },
      {
        "name": "Quality Control Form",
        "description": "Capture quality control details.",
        "fields": [
          {
            "name": "instrument",
            "label": "Instrument",
            "type": "select",
            "required": true,
            "helper": "Analyser being quality controlled"
          },
          {
            "name": "test_analyte",
            "label": "Test / analyte",
            "type": "select",
            "required": true,
            "helper": "Test being QC'd"
          },
          {
            "name": "qc_level",
            "label": "QC level",
            "type": "select",
            "required": true,
            "helper": "Level 1 (low) | Level 2 (normal) | Level 3 (high)",
            "options": [
              "Level 1 (low)",
              "Level 2 (normal)",
              "Level 3 (high)"
            ]
          },
          {
            "name": "expected_value",
            "label": "Expected value",
            "type": "text",
            "required": true,
            "helper": "Target value from QC lot insert",
            "placeholder": "Target value from QC lot insert"
          },
          {
            "name": "measured_value",
            "label": "Measured value",
            "type": "number",
            "required": true,
            "helper": "Result obtained on QC material",
            "placeholder": "Result obtained on QC material"
          },
          {
            "name": "westgard_rule_violated",
            "label": "Westgard rule violated",
            "type": "text",
            "required": true,
            "helper": "Auto-checked against Westgard rules",
            "placeholder": "Auto-checked against Westgard rules"
          },
          {
            "name": "qc_result",
            "label": "QC result",
            "type": "text",
            "required": true,
            "helper": "Pass | Fail - auto-determined",
            "placeholder": "Pass | Fail - auto-determined"
          },
          {
            "name": "action_taken",
            "label": "Action taken",
            "type": "textarea",
            "required": false,
            "helper": "Required if QC fails - recalibration, repeat, engineer call"
          }
        ]
      }
    ]
  },
  "radiology": {
    "forms": [
      {
        "name": "Radiology Request Form",
        "description": "Capture radiology request details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from encounter",
            "placeholder": "Auto-filled from encounter"
          },
          {
            "name": "modality",
            "label": "Modality",
            "type": "select",
            "required": true,
            "helper": "X-Ray | CT | MRI | Ultrasound | Mammography | Fluoroscopy",
            "options": [
              "X-Ray",
              "CT",
              "MRI",
              "Ultrasound",
              "Mammography",
              "Fluoroscopy"
            ]
          },
          {
            "name": "body_part_examination",
            "label": "Body part / examination",
            "type": "text",
            "required": true,
            "helper": "Specific examination e.g. Chest PA view, CT abdomen with contrast",
            "placeholder": "Specific examination e.g. Chest PA view, CT abdomen with contrast"
          },
          {
            "name": "laterality",
            "label": "Laterality",
            "type": "select",
            "required": false,
            "helper": "Left | Right | Bilateral | Not applicable",
            "options": [
              "Left",
              "Right",
              "Bilateral",
              "Not applicable"
            ]
          },
          {
            "name": "contrast_required",
            "label": "Contrast required",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "priority",
            "label": "Priority",
            "type": "select",
            "required": true,
            "helper": "Routine | Urgent | STAT",
            "options": [
              "Routine",
              "Urgent",
              "STAT"
            ]
          },
          {
            "name": "clinical_indication",
            "label": "Clinical indication",
            "type": "textarea",
            "required": true,
            "helper": "Reason for imaging - shown to radiographer"
          },
          {
            "name": "relevant_history",
            "label": "Relevant history",
            "type": "text",
            "required": false,
            "helper": "Previous imaging, allergies, renal function for contrast",
            "placeholder": "Previous imaging, allergies, renal function for contrast"
          },
          {
            "name": "referring_doctor",
            "label": "Referring doctor",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from encounter",
            "placeholder": "Auto-filled from encounter"
          }
        ]
      },
      {
        "name": "Radiography Technique Form",
        "description": "Capture radiography technique details.",
        "fields": [
          {
            "name": "patient_id_check",
            "label": "Patient ID check",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm patient identity before imaging"
          },
          {
            "name": "modality_used",
            "label": "Modality used",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from order",
            "placeholder": "Auto-filled from order"
          },
          {
            "name": "patient_position",
            "label": "Patient position",
            "type": "text",
            "required": true,
            "helper": "Position used e.g. PA erect, Left lateral decubitus",
            "placeholder": "Position used e.g. PA erect, Left lateral decubitus"
          },
          {
            "name": "exposure_parameters",
            "label": "Exposure parameters",
            "type": "text",
            "required": false,
            "helper": "kVp, mAs - for X-Ray",
            "placeholder": "kVp, mAs - for X-Ray"
          },
          {
            "name": "contrast_details",
            "label": "Contrast details",
            "type": "text",
            "required": false,
            "helper": "Contrast agent, volume, route, batch number",
            "placeholder": "Contrast agent, volume, route, batch number"
          },
          {
            "name": "scan_protocol",
            "label": "Scan protocol",
            "type": "text",
            "required": false,
            "helper": "Protocol used for CT/MRI",
            "placeholder": "Protocol used for CT/MRI"
          },
          {
            "name": "radiographer_notes",
            "label": "Radiographer notes",
            "type": "text",
            "required": false,
            "helper": "Technical notes on image acquisition",
            "placeholder": "Technical notes on image acquisition"
          },
          {
            "name": "accession_number",
            "label": "Accession number",
            "type": "text",
            "required": true,
            "helper": "Auto-generated RIS accession number",
            "placeholder": "Auto-generated RIS accession number"
          },
          {
            "name": "images_sent_to_pacs",
            "label": "Images sent to PACS",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm images transmitted to PACS viewer"
          }
        ]
      },
      {
        "name": "Radiology Report Form",
        "description": "Capture radiology report details.",
        "fields": [
          {
            "name": "examination",
            "label": "Examination",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from order",
            "placeholder": "Auto-filled from order"
          },
          {
            "name": "technique",
            "label": "Technique",
            "type": "textarea",
            "required": true,
            "helper": "Imaging technique, projections, contrast used"
          },
          {
            "name": "findings",
            "label": "Findings",
            "type": "textarea",
            "required": true,
            "helper": "Detailed radiological findings - systematic description"
          },
          {
            "name": "impression",
            "label": "Impression",
            "type": "textarea",
            "required": true,
            "helper": "Summary conclusion and diagnostic impression"
          },
          {
            "name": "recommendations",
            "label": "Recommendations",
            "type": "text",
            "required": false,
            "helper": "Suggested follow-up imaging or clinical action",
            "placeholder": "Suggested follow-up imaging or clinical action"
          },
          {
            "name": "is_critical_finding",
            "label": "Is critical finding",
            "type": "checkbox",
            "required": true,
            "helper": "Tick for critical findings requiring urgent communication"
          },
          {
            "name": "radiologist_signature",
            "label": "Radiologist signature",
            "type": "text",
            "required": true,
            "helper": "Authorisation sign-off",
            "placeholder": "Authorisation sign-off"
          }
        ]
      }
    ]
  },
  "pharmacy": {
    "forms": [
      {
        "name": "Prescription Dispensing Form",
        "description": "Capture prescription dispensing details.",
        "fields": [
          {
            "name": "prescription",
            "label": "Prescription",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from EMR prescription",
            "placeholder": "Auto-filled from EMR prescription"
          },
          {
            "name": "drug_name",
            "label": "Drug name",
            "type": "text",
            "required": true,
            "helper": "Generic name from formulary",
            "placeholder": "Generic name from formulary"
          },
          {
            "name": "dose_and_route",
            "label": "Dose and route",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from prescription",
            "placeholder": "Auto-filled from prescription"
          },
          {
            "name": "quantity_to_dispense",
            "label": "Quantity to dispense",
            "type": "number",
            "required": true,
            "helper": "Units to give to patient",
            "placeholder": "Units to give to patient"
          },
          {
            "name": "batch_number",
            "label": "Batch number",
            "type": "text",
            "required": true,
            "helper": "Batch number from the dispensed pack",
            "placeholder": "Batch number from the dispensed pack"
          },
          {
            "name": "expiry_date",
            "label": "Expiry date",
            "type": "date",
            "required": true,
            "helper": "Expiry date of dispensed batch"
          },
          {
            "name": "drug_interaction_check",
            "label": "Drug interaction check",
            "type": "text",
            "required": true,
            "helper": "Auto-run at dispensing - alert displayed if interaction",
            "placeholder": "Auto-run at dispensing - alert displayed if interaction"
          },
          {
            "name": "interaction_override_reason",
            "label": "Interaction override reason",
            "type": "text",
            "required": false,
            "helper": "Required if overriding a drug interaction alert",
            "placeholder": "Required if overriding a drug interaction alert"
          },
          {
            "name": "patient_counselled",
            "label": "Patient counselled",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm patient was counselled on drug use"
          },
          {
            "name": "dispensed_by",
            "label": "Dispensed by",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - logged in pharmacist",
            "placeholder": "Auto-filled - logged in pharmacist"
          }
        ]
      },
      {
        "name": "Drug Formulary Entry Form",
        "description": "Capture drug formulary entry details.",
        "fields": [
          {
            "name": "generic_name",
            "label": "Generic name",
            "type": "text",
            "required": true,
            "helper": "WHO INN generic name",
            "placeholder": "WHO INN generic name"
          },
          {
            "name": "brand_names",
            "label": "Brand names",
            "type": "text",
            "required": false,
            "helper": "Known brand names for this drug",
            "placeholder": "Known brand names for this drug"
          },
          {
            "name": "drug_class",
            "label": "Drug class",
            "type": "select",
            "required": true,
            "helper": "Pharmacological class e.g. PENICILLIN, SSRI, NSAID"
          },
          {
            "name": "therapeutic_category",
            "label": "Therapeutic category",
            "type": "select",
            "required": true,
            "helper": "Antibiotic | Analgesic | Antihypertensive | etc.",
            "options": [
              "Antibiotic",
              "Analgesic",
              "Antihypertensive",
              "etc."
            ]
          },
          {
            "name": "formulation",
            "label": "Formulation",
            "type": "select",
            "required": true,
            "helper": "Tablet | Capsule | Syrup | Injection | Cream | Inhaler",
            "options": [
              "Tablet",
              "Capsule",
              "Syrup",
              "Injection",
              "Cream",
              "Inhaler"
            ]
          },
          {
            "name": "strength",
            "label": "Strength",
            "type": "text",
            "required": true,
            "helper": "e.g. 500mg, 5mg/5mL",
            "placeholder": "e.g. 500mg, 5mg/5mL"
          },
          {
            "name": "atc_code",
            "label": "ATC code",
            "type": "text",
            "required": false,
            "helper": "WHO ATC classification code",
            "placeholder": "WHO ATC classification code"
          },
          {
            "name": "is_controlled_substance",
            "label": "Is controlled substance",
            "type": "checkbox",
            "required": true,
            "helper": "Tick for narcotics and psychotropics"
          },
          {
            "name": "is_on_essential_medicines_list",
            "label": "Is on essential medicines list",
            "type": "checkbox",
            "required": true,
            "helper": "Kenya EML status"
          },
          {
            "name": "requires_prescription",
            "label": "Requires prescription",
            "type": "checkbox",
            "required": true,
            "helper": "Untick for OTC drugs"
          },
          {
            "name": "minimum_stock_level",
            "label": "Minimum stock level",
            "type": "number",
            "required": true,
            "helper": "Reorder trigger quantity",
            "placeholder": "Reorder trigger quantity"
          },
          {
            "name": "unit_cost_kes",
            "label": "Unit cost (KES)",
            "type": "number",
            "required": true,
            "helper": "Cost to hospital per unit",
            "placeholder": "Cost to hospital per unit"
          },
          {
            "name": "selling_price_kes",
            "label": "Selling price (KES)",
            "type": "number",
            "required": true,
            "helper": "Patient charge per unit",
            "placeholder": "Patient charge per unit"
          }
        ]
      },
      {
        "name": "Pharmacy Return Form",
        "description": "Capture pharmacy return details.",
        "fields": [
          {
            "name": "return_type",
            "label": "Return type",
            "type": "select",
            "required": true,
            "helper": "Ward to pharmacy | Patient return | Expired | Damaged | Recall",
            "options": [
              "Ward to pharmacy",
              "Patient return",
              "Expired",
              "Damaged",
              "Recall"
            ]
          },
          {
            "name": "drug",
            "label": "Drug",
            "type": "select",
            "required": true,
            "helper": "Drug being returned"
          },
          {
            "name": "quantity_returned",
            "label": "Quantity returned",
            "type": "number",
            "required": true,
            "helper": "Number of units returned",
            "placeholder": "Number of units returned"
          },
          {
            "name": "batch_number",
            "label": "Batch number",
            "type": "text",
            "required": true,
            "helper": "Batch of returned drugs",
            "placeholder": "Batch of returned drugs"
          },
          {
            "name": "reason_for_return",
            "label": "Reason for return",
            "type": "textarea",
            "required": true,
            "helper": "Clinical or administrative reason"
          },
          {
            "name": "condition_on_return",
            "label": "Condition on return",
            "type": "select",
            "required": true,
            "helper": "Resaleable | Destroyed | Quarantined",
            "options": [
              "Resaleable",
              "Destroyed",
              "Quarantined"
            ]
          }
        ]
      }
    ]
  },
  "pharmacy-pos": {
    "forms": [
      {
        "name": "Retail Sale Form",
        "description": "Capture retail sale details.",
        "fields": [
          {
            "name": "customer_type",
            "label": "Customer type",
            "type": "select",
            "required": true,
            "helper": "Patient | Visitor | Staff | Walk-in",
            "options": [
              "Patient",
              "Visitor",
              "Staff",
              "Walk-in"
            ]
          },
          {
            "name": "patient_mrn",
            "label": "Patient MRN",
            "type": "text",
            "required": false,
            "helper": "If selling to registered patient",
            "placeholder": "If selling to registered patient"
          },
          {
            "name": "drug_item",
            "label": "Drug / item",
            "type": "text",
            "required": true,
            "helper": "Search from formulary or OTC list",
            "placeholder": "Search from formulary or OTC list"
          },
          {
            "name": "quantity",
            "label": "Quantity",
            "type": "number",
            "required": true,
            "helper": "Number of units to sell",
            "placeholder": "Number of units to sell"
          },
          {
            "name": "unit_price",
            "label": "Unit price",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from formulary selling price",
            "placeholder": "Auto-filled from formulary selling price"
          },
          {
            "name": "payment_method",
            "label": "Payment method",
            "type": "select",
            "required": true,
            "helper": "Cash | MPESA | Card | Staff deduction",
            "options": [
              "Cash",
              "MPESA",
              "Card",
              "Staff deduction"
            ]
          },
          {
            "name": "mpesa_reference",
            "label": "MPESA reference",
            "type": "text",
            "required": false,
            "helper": "M-Pesa transaction code if MPESA payment",
            "placeholder": "M-Pesa transaction code if MPESA payment"
          },
          {
            "name": "print_receipt",
            "label": "Print receipt",
            "type": "checkbox",
            "required": true,
            "helper": "Auto-selected - generates receipt on confirm"
          }
        ]
      }
    ]
  },
  "blood-bank": {
    "forms": [
      {
        "name": "Donor Registration Form",
        "description": "Capture donor registration details.",
        "fields": [
          {
            "name": "first_name",
            "label": "First name",
            "type": "text",
            "required": true,
            "helper": "Donor first name",
            "placeholder": "Donor first name"
          },
          {
            "name": "last_name",
            "label": "Last name",
            "type": "text",
            "required": true,
            "helper": "Donor surname",
            "placeholder": "Donor surname"
          },
          {
            "name": "date_of_birth",
            "label": "Date of birth",
            "type": "date",
            "required": true,
            "helper": "Must be 16–65 years to donate"
          },
          {
            "name": "gender",
            "label": "Gender",
            "type": "select",
            "required": true,
            "helper": "Male | Female",
            "options": [
              "Male",
              "Female"
            ]
          },
          {
            "name": "national_id",
            "label": "National ID",
            "type": "text",
            "required": true,
            "helper": "National ID number",
            "placeholder": "National ID number"
          },
          {
            "name": "phone",
            "label": "Phone",
            "type": "tel",
            "required": true,
            "helper": "Contact phone for donation recall",
            "placeholder": "Contact phone for donation recall"
          },
          {
            "name": "donor_type",
            "label": "Donor type",
            "type": "select",
            "required": true,
            "helper": "Voluntary | Replacement | Directed | Autologous",
            "options": [
              "Voluntary",
              "Replacement",
              "Directed",
              "Autologous"
            ]
          },
          {
            "name": "previous_donations",
            "label": "Previous donations",
            "type": "number",
            "required": false,
            "helper": "Number of previous donations at any facility",
            "placeholder": "Number of previous donations at any facility"
          },
          {
            "name": "known_medical_conditions",
            "label": "Known medical conditions",
            "type": "textarea",
            "required": false,
            "helper": "Any conditions that may affect eligibility"
          }
        ]
      },
      {
        "name": "Pre-Donation Screening Form",
        "description": "Capture pre-donation screening details.",
        "fields": [
          {
            "name": "donor",
            "label": "Donor",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from donor registration",
            "placeholder": "Auto-filled from donor registration"
          },
          {
            "name": "haemoglobin_g_dl",
            "label": "Haemoglobin (g/dL)",
            "type": "number",
            "required": true,
            "helper": "Must be ≥12.5 g/dL to donate",
            "placeholder": "Must be ≥12.5 g/dL to donate"
          },
          {
            "name": "blood_pressure",
            "label": "Blood pressure",
            "type": "text",
            "required": true,
            "helper": "Must be within normal limits",
            "placeholder": "Must be within normal limits"
          },
          {
            "name": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": true,
            "helper": "Must be ≥50 kg to donate",
            "placeholder": "Must be ≥50 kg to donate"
          },
          {
            "name": "temperature_c",
            "label": "Temperature (°C)",
            "type": "number",
            "required": true,
            "helper": "Must be normal",
            "placeholder": "Must be normal"
          },
          {
            "name": "medication_history",
            "label": "Medication history",
            "type": "textarea",
            "required": true,
            "helper": "Any medications taken in last 7–14 days"
          },
          {
            "name": "recent_illness",
            "label": "Recent illness",
            "type": "text",
            "required": true,
            "helper": "Yes | No - any illness in last 2 weeks",
            "placeholder": "Yes | No - any illness in last 2 weeks"
          },
          {
            "name": "travel_history",
            "label": "Travel history",
            "type": "text",
            "required": false,
            "helper": "Travel to malaria-endemic areas",
            "placeholder": "Travel to malaria-endemic areas"
          },
          {
            "name": "risk_behaviour_screening",
            "label": "Risk behaviour screening",
            "type": "text",
            "required": true,
            "helper": "Confidential lifestyle questions per KNBTS protocol",
            "placeholder": "Confidential lifestyle questions per KNBTS protocol"
          },
          {
            "name": "eligible_to_donate",
            "label": "Eligible to donate",
            "type": "text",
            "required": true,
            "helper": "System determines eligibility - donor told outcome",
            "placeholder": "System determines eligibility - donor told outcome"
          }
        ]
      },
      {
        "name": "Blood Unit Collection Form",
        "description": "Capture blood unit collection details.",
        "fields": [
          {
            "name": "donor",
            "label": "Donor",
            "type": "text",
            "required": true,
            "helper": "Auto-filled",
            "placeholder": "Auto-filled"
          },
          {
            "name": "bag_number",
            "label": "Bag number",
            "type": "text",
            "required": true,
            "helper": "Blood bag barcode",
            "placeholder": "Blood bag barcode"
          },
          {
            "name": "volume_collected_ml",
            "label": "Volume collected (mL)",
            "type": "number",
            "required": true,
            "helper": "Typically 450 mL",
            "placeholder": "Typically 450 mL"
          },
          {
            "name": "collection_time",
            "label": "Collection time",
            "type": "datetime",
            "required": true,
            "helper": "Start and end time of collection"
          },
          {
            "name": "phlebotomist",
            "label": "Phlebotomist",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - logged in technician",
            "placeholder": "Auto-filled - logged in technician"
          },
          {
            "name": "adverse_reaction_during_donation",
            "label": "Adverse reaction during donation",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "reaction_details",
            "label": "Reaction details",
            "type": "text",
            "required": false,
            "helper": "Description if adverse reaction occurred",
            "placeholder": "Description if adverse reaction occurred"
          }
        ]
      },
      {
        "name": "Blood Request Form",
        "description": "Capture blood request details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from encounter",
            "placeholder": "Auto-filled from encounter"
          },
          {
            "name": "product_type",
            "label": "Product type",
            "type": "select",
            "required": true,
            "helper": "Packed RBC | FFP | Platelets | Whole blood | Cryoprecipitate",
            "options": [
              "Packed RBC",
              "FFP",
              "Platelets",
              "Whole blood",
              "Cryoprecipitate"
            ]
          },
          {
            "name": "units_requested",
            "label": "Units requested",
            "type": "number",
            "required": true,
            "helper": "Number of units needed",
            "placeholder": "Number of units needed"
          },
          {
            "name": "indication",
            "label": "Indication",
            "type": "textarea",
            "required": true,
            "helper": "Clinical reason for transfusion"
          },
          {
            "name": "pre_transfusion_hb",
            "label": "Pre-transfusion Hb",
            "type": "number",
            "required": true,
            "helper": "Current haemoglobin level",
            "placeholder": "Current haemoglobin level"
          },
          {
            "name": "urgency",
            "label": "Urgency",
            "type": "select",
            "required": true,
            "helper": "Elective | Urgent | Emergency | Massive transfusion protocol",
            "options": [
              "Elective",
              "Urgent",
              "Emergency",
              "Massive transfusion protocol"
            ]
          },
          {
            "name": "required_by",
            "label": "Required by",
            "type": "datetime",
            "required": true,
            "helper": "When blood products are needed"
          },
          {
            "name": "consent_for_transfusion",
            "label": "Consent for transfusion",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm consent obtained"
          }
        ]
      },
      {
        "name": "Crossmatch Form",
        "description": "Capture crossmatch details.",
        "fields": [
          {
            "name": "patient_blood_group",
            "label": "Patient blood group",
            "type": "text",
            "required": true,
            "helper": "From patient records",
            "placeholder": "From patient records"
          },
          {
            "name": "blood_unit_number",
            "label": "Blood unit number",
            "type": "text",
            "required": true,
            "helper": "Scan unit barcode",
            "placeholder": "Scan unit barcode"
          },
          {
            "name": "unit_blood_group",
            "label": "Unit blood group",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from unit record",
            "placeholder": "Auto-filled from unit record"
          },
          {
            "name": "technique_used",
            "label": "Technique used",
            "type": "select",
            "required": true,
            "helper": "Immediate spin | Indirect Coombs | Electronic | Emergency",
            "options": [
              "Immediate spin",
              "Indirect Coombs",
              "Electronic",
              "Emergency"
            ]
          },
          {
            "name": "major_crossmatch_result",
            "label": "Major crossmatch result",
            "type": "select",
            "required": true,
            "helper": "Compatible | Incompatible | Pending",
            "options": [
              "Compatible",
              "Incompatible",
              "Pending"
            ]
          },
          {
            "name": "antibody_screen",
            "label": "Antibody screen",
            "type": "select",
            "required": true,
            "helper": "Negative | Positive",
            "options": [
              "Negative",
              "Positive"
            ]
          },
          {
            "name": "overall_result",
            "label": "Overall result",
            "type": "text",
            "required": true,
            "helper": "Compatible | Incompatible | Further testing required",
            "placeholder": "Compatible | Incompatible | Further testing required"
          }
        ]
      },
      {
        "name": "Transfusion Reaction Report",
        "description": "Capture transfusion reaction report details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from admission",
            "placeholder": "Auto-filled from admission"
          },
          {
            "name": "blood_unit_transfused",
            "label": "Blood unit transfused",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from transfusion record",
            "placeholder": "Auto-filled from transfusion record"
          },
          {
            "name": "reaction_type",
            "label": "Reaction type",
            "type": "select",
            "required": true,
            "helper": "Febrile | Allergic | Haemolytic | TACO | TRALI | Septic | Anaphylaxis",
            "options": [
              "Febrile",
              "Allergic",
              "Haemolytic",
              "TACO",
              "TRALI",
              "Septic",
              "Anaphylaxis"
            ]
          },
          {
            "name": "reaction_onset_time",
            "label": "Reaction onset time",
            "type": "datetime",
            "required": true,
            "helper": "When symptoms started"
          },
          {
            "name": "symptoms",
            "label": "Symptoms",
            "type": "textarea",
            "required": true,
            "helper": "Fever | Rigors | Rash | Dyspnoea | Hypotension | Back pain | Haemoglobinuria",
            "placeholder": "Fever | Rigors | Rash | Dyspnoea | Hypotension | Back pain | Haemoglobinuria"
          },
          {
            "name": "vital_signs_at_reaction",
            "label": "Vital signs at reaction",
            "type": "text",
            "required": true,
            "helper": "BP, HR, Temp, SpO2",
            "placeholder": "BP, HR, Temp, SpO2"
          },
          {
            "name": "transfusion_stopped",
            "label": "Transfusion stopped",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm transfusion was stopped"
          },
          {
            "name": "treatment_given",
            "label": "Treatment given",
            "type": "textarea",
            "required": true,
            "helper": "Emergency management steps"
          },
          {
            "name": "outcome",
            "label": "Outcome",
            "type": "select",
            "required": true,
            "helper": "Resolved | Ongoing | Death",
            "options": [
              "Resolved",
              "Ongoing",
              "Death"
            ]
          }
        ]
      }
    ]
  },
  "ot": {
    "forms": [
      {
        "name": "Surgical Booking Form",
        "description": "Capture surgical booking details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from admission",
            "placeholder": "Auto-filled from admission"
          },
          {
            "name": "procedure_name",
            "label": "Procedure name",
            "type": "text",
            "required": true,
            "helper": "Name of procedure to be performed",
            "placeholder": "Name of procedure to be performed"
          },
          {
            "name": "procedure_codes",
            "label": "Procedure codes",
            "type": "text",
            "required": false,
            "helper": "CPT or local procedure codes",
            "placeholder": "CPT or local procedure codes"
          },
          {
            "name": "lead_surgeon",
            "label": "Lead surgeon",
            "type": "select",
            "required": true,
            "helper": "Primary operating surgeon"
          },
          {
            "name": "anaesthetist",
            "label": "Anaesthetist",
            "type": "select",
            "required": true,
            "helper": "Assigned anaesthetist"
          },
          {
            "name": "theatre",
            "label": "Theatre",
            "type": "select",
            "required": true,
            "helper": "Available operating theatre"
          },
          {
            "name": "surgery_date",
            "label": "Surgery date",
            "type": "date",
            "required": true,
            "helper": "Planned date of surgery"
          },
          {
            "name": "start_time",
            "label": "Start time",
            "type": "time",
            "required": true,
            "helper": "Planned start time"
          },
          {
            "name": "estimated_duration_min",
            "label": "Estimated duration (min)",
            "type": "number",
            "required": true,
            "helper": "Expected duration in minutes",
            "placeholder": "Expected duration in minutes"
          },
          {
            "name": "case_type",
            "label": "Case type",
            "type": "select",
            "required": true,
            "helper": "Elective | Emergency | Urgent",
            "options": [
              "Elective",
              "Emergency",
              "Urgent"
            ]
          },
          {
            "name": "anaesthesia_type",
            "label": "Anaesthesia type",
            "type": "select",
            "required": true,
            "helper": "General | Spinal | Epidural | Local | Sedation | Regional",
            "options": [
              "General",
              "Spinal",
              "Epidural",
              "Local",
              "Sedation",
              "Regional"
            ]
          },
          {
            "name": "asa_grade",
            "label": "ASA grade",
            "type": "select",
            "required": true,
            "helper": "ASA I | II | III | IV | V | VI",
            "options": [
              "ASA I",
              "II",
              "III",
              "IV",
              "V",
              "VI"
            ]
          },
          {
            "name": "blood_required",
            "label": "Blood required",
            "type": "checkbox",
            "required": false,
            "helper": "Tick if blood products may be needed"
          },
          {
            "name": "units_requested",
            "label": "Units requested",
            "type": "number",
            "required": false,
            "helper": "Blood units to prepare",
            "placeholder": "Blood units to prepare"
          }
        ]
      },
      {
        "name": "Pre-operative Checklist",
        "description": "Capture pre-operative checklist details.",
        "fields": [
          {
            "name": "consent_signed",
            "label": "Consent signed",
            "type": "checkbox",
            "required": true,
            "helper": "Surgical consent form obtained"
          },
          {
            "name": "anaesthetic_consent",
            "label": "Anaesthetic consent",
            "type": "checkbox",
            "required": true,
            "helper": "Anaesthetic consent obtained"
          },
          {
            "name": "site_marked",
            "label": "Site marked",
            "type": "checkbox",
            "required": false,
            "helper": "Surgical site marked if laterality applies"
          },
          {
            "name": "site_marking_confirmed",
            "label": "Site marking confirmed",
            "type": "checkbox",
            "required": false,
            "helper": "Surgeon confirmed marking"
          },
          {
            "name": "allergies_checked",
            "label": "Allergies checked",
            "type": "checkbox",
            "required": true,
            "helper": "Known allergies reviewed"
          },
          {
            "name": "fasting_confirmed",
            "label": "Fasting confirmed",
            "type": "checkbox",
            "required": true,
            "helper": "Patient has fasted as required"
          },
          {
            "name": "fasting_duration_hours",
            "label": "Fasting duration (hours)",
            "type": "number",
            "required": true,
            "helper": "Hours fasted - minimum 6h for solids, 2h for clear fluids",
            "placeholder": "Hours fasted - minimum 6h for solids, 2h for clear fluids"
          },
          {
            "name": "implants_removed",
            "label": "Implants removed",
            "type": "checkbox",
            "required": false,
            "helper": "Dentures, hearing aids, jewellery, prosthetics removed"
          },
          {
            "name": "blood_results_available",
            "label": "Blood results available",
            "type": "checkbox",
            "required": true,
            "helper": "Required pre-op bloods checked and available"
          },
          {
            "name": "imaging_available",
            "label": "Imaging available",
            "type": "checkbox",
            "required": false,
            "helper": "Relevant imaging available for viewing in theatre"
          },
          {
            "name": "iv_access_secured",
            "label": "IV access secured",
            "type": "checkbox",
            "required": true,
            "helper": "Intravenous cannula in situ"
          },
          {
            "name": "pre_medication_given",
            "label": "Pre-medication given",
            "type": "text",
            "required": false,
            "helper": "Pre-med drugs given with time",
            "placeholder": "Pre-med drugs given with time"
          },
          {
            "name": "patient_identity_confirmed",
            "label": "Patient identity confirmed",
            "type": "checkbox",
            "required": true,
            "helper": "Patient name and DOB confirmed at gate"
          }
        ]
      },
      {
        "name": "Anaesthesia Record Form",
        "description": "Capture anaesthesia record details.",
        "fields": [
          {
            "name": "pre_op_assessment",
            "label": "Pre-op assessment",
            "type": "textarea",
            "required": true,
            "helper": "Airway assessment, co-morbidities, anaesthetic plan"
          },
          {
            "name": "pre_medication",
            "label": "Pre-medication",
            "type": "text",
            "required": false,
            "helper": "Pre-med drugs given",
            "placeholder": "Pre-med drugs given"
          },
          {
            "name": "induction_agent",
            "label": "Induction agent",
            "type": "text",
            "required": true,
            "helper": "Drug used for anaesthesia induction e.g. Propofol 2mg/kg",
            "placeholder": "Drug used for anaesthesia induction e.g. Propofol 2mg/kg"
          },
          {
            "name": "airway_management",
            "label": "Airway management",
            "type": "select",
            "required": true,
            "helper": "ETT | LMA | Mask | Awake fibre-optic",
            "options": [
              "ETT",
              "LMA",
              "Mask",
              "Awake fibre-optic"
            ]
          },
          {
            "name": "ett_size",
            "label": "ETT size",
            "type": "text",
            "required": false,
            "helper": "Tube size if intubated e.g. 7.5mm",
            "placeholder": "Tube size if intubated e.g. 7.5mm"
          },
          {
            "name": "maintenance_agent",
            "label": "Maintenance agent",
            "type": "text",
            "required": true,
            "helper": "Drug/gas for maintenance e.g. Sevoflurane 2%, Propofol infusion",
            "placeholder": "Drug/gas for maintenance e.g. Sevoflurane 2%, Propofol infusion"
          },
          {
            "name": "intraoperative_monitoring",
            "label": "Intraoperative monitoring",
            "type": "text",
            "required": true,
            "helper": "BP, HR, SpO2, EtCO2, Temp - recorded every 5 minutes",
            "placeholder": "BP, HR, SpO2, EtCO2, Temp - recorded every 5 minutes"
          },
          {
            "name": "total_fluid_input_ml",
            "label": "Total fluid input (mL)",
            "type": "number",
            "required": true,
            "helper": "Total IV fluids given intraoperatively",
            "placeholder": "Total IV fluids given intraoperatively"
          },
          {
            "name": "estimated_blood_loss_ml",
            "label": "Estimated blood loss (mL)",
            "type": "number",
            "required": true,
            "helper": "Estimated intraoperative blood loss",
            "placeholder": "Estimated intraoperative blood loss"
          },
          {
            "name": "urine_output_ml",
            "label": "Urine output (mL)",
            "type": "number",
            "required": false,
            "helper": "Intraoperative urine output if catheterised",
            "placeholder": "Intraoperative urine output if catheterised"
          },
          {
            "name": "reversal_agents",
            "label": "Reversal agents",
            "type": "text",
            "required": false,
            "helper": "Reversal drugs given e.g. Neostigmine, Sugammadex",
            "placeholder": "Reversal drugs given e.g. Neostigmine, Sugammadex"
          },
          {
            "name": "extubation_time",
            "label": "Extubation time",
            "type": "time",
            "required": false,
            "helper": "If intubated - time of extubation"
          },
          {
            "name": "complications",
            "label": "Complications",
            "type": "textarea",
            "required": false,
            "helper": "Any anaesthetic complications"
          },
          {
            "name": "recovery_notes",
            "label": "Recovery notes",
            "type": "textarea",
            "required": true,
            "helper": "Post-anaesthesia recovery documentation"
          }
        ]
      },
      {
        "name": "Swab & Instrument Count Form",
        "description": "Capture swab & instrument count details.",
        "fields": [
          {
            "name": "count_type",
            "label": "Count type",
            "type": "select",
            "required": true,
            "helper": "Opening | Pre-closure | Closing | Additional",
            "options": [
              "Opening",
              "Pre-closure",
              "Closing",
              "Additional"
            ]
          },
          {
            "name": "swab_count",
            "label": "Swab count",
            "type": "number",
            "required": true,
            "helper": "Total swabs in field",
            "placeholder": "Total swabs in field"
          },
          {
            "name": "instrument_count",
            "label": "Instrument count",
            "type": "number",
            "required": true,
            "helper": "Total instruments accounted for",
            "placeholder": "Total instruments accounted for"
          },
          {
            "name": "needle_count",
            "label": "Needle count",
            "type": "number",
            "required": true,
            "helper": "Needles and sharps",
            "placeholder": "Needles and sharps"
          },
          {
            "name": "count_correct",
            "label": "Count correct",
            "type": "text",
            "required": true,
            "helper": "Yes | No - surgery must not close if No",
            "placeholder": "Yes | No - surgery must not close if No"
          },
          {
            "name": "discrepancy_action",
            "label": "Discrepancy action",
            "type": "textarea",
            "required": false,
            "helper": "Action taken if count incorrect"
          },
          {
            "name": "scrub_nurse",
            "label": "Scrub nurse",
            "type": "text",
            "required": true,
            "helper": "Auto-filled",
            "placeholder": "Auto-filled"
          },
          {
            "name": "circulating_nurse",
            "label": "Circulating nurse",
            "type": "select",
            "required": true,
            "helper": "Second nurse verifying the count"
          }
        ]
      },
      {
        "name": "Operative Note Form",
        "description": "Capture operative note details.",
        "fields": [
          {
            "name": "procedure_performed",
            "label": "Procedure performed",
            "type": "text",
            "required": true,
            "helper": "Exact procedure(s) as performed",
            "placeholder": "Exact procedure(s) as performed"
          },
          {
            "name": "incision_type",
            "label": "Incision type",
            "type": "text",
            "required": true,
            "helper": "Type and location of incision",
            "placeholder": "Type and location of incision"
          },
          {
            "name": "intraoperative_findings",
            "label": "Intraoperative findings",
            "type": "textarea",
            "required": true,
            "helper": "What was found on exploration"
          },
          {
            "name": "technique",
            "label": "Technique",
            "type": "textarea",
            "required": true,
            "helper": "Step-by-step surgical technique"
          },
          {
            "name": "specimens_sent",
            "label": "Specimens sent",
            "type": "text",
            "required": false,
            "helper": "Specimen type, site, destination laboratory",
            "placeholder": "Specimen type, site, destination laboratory"
          },
          {
            "name": "implants_used",
            "label": "Implants used",
            "type": "text",
            "required": false,
            "helper": "Device name, serial number, lot number",
            "placeholder": "Device name, serial number, lot number"
          },
          {
            "name": "drains_placed",
            "label": "Drains placed",
            "type": "text",
            "required": false,
            "helper": "Type, site, and size of drain",
            "placeholder": "Type, site, and size of drain"
          },
          {
            "name": "closure_method",
            "label": "Closure method",
            "type": "text",
            "required": true,
            "helper": "Wound closure layers and suture materials",
            "placeholder": "Wound closure layers and suture materials"
          },
          {
            "name": "complications",
            "label": "Complications",
            "type": "text",
            "required": false,
            "helper": "Any intraoperative complications",
            "placeholder": "Any intraoperative complications"
          },
          {
            "name": "post_op_instructions",
            "label": "Post-op instructions",
            "type": "textarea",
            "required": true,
            "helper": "Instructions for nursing team - analgesia, monitoring, diet"
          }
        ]
      }
    ]
  },
  "icu": {
    "forms": [
      {
        "name": "ICU Admission Assessment Form",
        "description": "Capture icu admission assessment details.",
        "fields": [
          {
            "name": "admission_diagnosis",
            "label": "Admission diagnosis",
            "type": "text",
            "required": true,
            "helper": "Primary reason for ICU admission",
            "placeholder": "Primary reason for ICU admission"
          },
          {
            "name": "apache_ii_score",
            "label": "APACHE II score",
            "type": "text",
            "required": true,
            "helper": "Calculated from vitals and labs - predictive mortality score",
            "placeholder": "Calculated from vitals and labs - predictive mortality score"
          },
          {
            "name": "sofa_score",
            "label": "SOFA score",
            "type": "text",
            "required": true,
            "helper": "Sequential Organ Failure Assessment score",
            "placeholder": "Sequential Organ Failure Assessment score"
          },
          {
            "name": "admission_source",
            "label": "Admission source",
            "type": "select",
            "required": true,
            "helper": "Ward | Emergency | Theatre | Direct | Transfer",
            "options": [
              "Ward",
              "Emergency",
              "Theatre",
              "Direct",
              "Transfer"
            ]
          },
          {
            "name": "code_status",
            "label": "Code status",
            "type": "select",
            "required": true,
            "helper": "Full resuscitation | DNR - must be documented",
            "options": [
              "Full resuscitation",
              "DNR — must be documented"
            ]
          },
          {
            "name": "ventilated",
            "label": "Ventilated",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "vasopressors",
            "label": "Vasopressors",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "renal_replacement",
            "label": "Renal replacement",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "current_medications",
            "label": "Current medications",
            "type": "text",
            "required": true,
            "helper": "All current medications",
            "placeholder": "All current medications"
          },
          {
            "name": "allergies",
            "label": "Allergies",
            "type": "text",
            "required": true,
            "helper": "From patient allergy record",
            "placeholder": "From patient allergy record"
          },
          {
            "name": "informed_consent_for_icu",
            "label": "Informed consent for ICU",
            "type": "checkbox",
            "required": true,
            "helper": "Family/guardian consent for ICU admission"
          }
        ]
      },
      {
        "name": "ICU Daily Assessment Form",
        "description": "Capture icu daily assessment details.",
        "fields": [
          {
            "name": "assessment_date",
            "label": "Assessment date",
            "type": "date",
            "required": true,
            "helper": "Date of daily ICU round"
          },
          {
            "name": "rass_score",
            "label": "RASS score",
            "type": "select",
            "required": true,
            "helper": "-5 Unarousable to +4 Combative"
          },
          {
            "name": "cam_icu",
            "label": "CAM-ICU",
            "type": "text",
            "required": true,
            "helper": "Positive | Negative - delirium screen",
            "placeholder": "Positive | Negative - delirium screen"
          },
          {
            "name": "pain_score_cpot",
            "label": "Pain score (CPOT)",
            "type": "text",
            "required": true,
            "helper": "Critical Care Pain Observation Tool 0–8",
            "placeholder": "Critical Care Pain Observation Tool 0–8"
          },
          {
            "name": "ventilator_mode",
            "label": "Ventilator mode",
            "type": "select",
            "required": false,
            "helper": "VC-AC | PC-AC | SIMV | CPAP | SPONT",
            "options": [
              "VC-AC",
              "PC-AC",
              "SIMV",
              "CPAP",
              "SPONT"
            ]
          },
          {
            "name": "fio2",
            "label": "FiO2 (%)",
            "type": "number",
            "required": false,
            "helper": "Fraction of inspired oxygen",
            "placeholder": "Fraction of inspired oxygen"
          },
          {
            "name": "peep_cmh2o",
            "label": "PEEP (cmH2O)",
            "type": "number",
            "required": false,
            "helper": "Positive end-expiratory pressure",
            "placeholder": "Positive end-expiratory pressure"
          },
          {
            "name": "vasopressors",
            "label": "Vasopressors",
            "type": "text",
            "required": false,
            "helper": "Vasopressor drugs and infusion rates",
            "placeholder": "Vasopressor drugs and infusion rates"
          },
          {
            "name": "fluid_balance_ml",
            "label": "Fluid balance (mL)",
            "type": "text",
            "required": true,
            "helper": "Calculated from fluid balance chart",
            "placeholder": "Calculated from fluid balance chart"
          },
          {
            "name": "nutrition_route",
            "label": "Nutrition route",
            "type": "select",
            "required": true,
            "helper": "Oral | NG tube | PEG | TPN | Nil",
            "options": [
              "Oral",
              "NG tube",
              "PEG",
              "TPN",
              "Nil"
            ]
          },
          {
            "name": "daily_icu_goals",
            "label": "Daily ICU goals",
            "type": "textarea",
            "required": true,
            "helper": "Goals set by consultant for the day"
          },
          {
            "name": "sat_performed",
            "label": "SAT performed",
            "type": "checkbox",
            "required": false,
            "helper": "Spontaneous awakening trial done"
          },
          {
            "name": "sbt_performed",
            "label": "SBT performed",
            "type": "checkbox",
            "required": false,
            "helper": "Spontaneous breathing trial done"
          }
        ]
      },
      {
        "name": "Ventilator Record Form",
        "description": "Capture ventilator record details.",
        "fields": [
          {
            "name": "recording_time",
            "label": "Recording time",
            "type": "datetime",
            "required": true,
            "helper": "Hourly recording"
          },
          {
            "name": "mode",
            "label": "Mode",
            "type": "select",
            "required": true,
            "helper": "VC-AC | PC-AC | SIMV | PRVC | CPAP | HFNC | BiPAP",
            "options": [
              "VC-AC",
              "PC-AC",
              "SIMV",
              "PRVC",
              "CPAP",
              "HFNC",
              "BiPAP"
            ]
          },
          {
            "name": "fio2",
            "label": "FiO2 (%)",
            "type": "number",
            "required": true,
            "helper": "21–100%",
            "placeholder": "21–100%"
          },
          {
            "name": "tidal_volume_ml",
            "label": "Tidal volume (mL)",
            "type": "number",
            "required": false,
            "helper": "Set tidal volume",
            "placeholder": "Set tidal volume"
          },
          {
            "name": "set_rate_bpm",
            "label": "Set rate (bpm)",
            "type": "number",
            "required": false,
            "helper": "Set respiratory rate",
            "placeholder": "Set respiratory rate"
          },
          {
            "name": "total_rate_bpm",
            "label": "Total rate (bpm)",
            "type": "number",
            "required": true,
            "helper": "Total rate including spontaneous breaths",
            "placeholder": "Total rate including spontaneous breaths"
          },
          {
            "name": "peep_cmh2o",
            "label": "PEEP (cmH2O)",
            "type": "number",
            "required": true,
            "helper": "Set PEEP",
            "placeholder": "Set PEEP"
          },
          {
            "name": "peak_inspiratory_pressure",
            "label": "Peak inspiratory pressure",
            "type": "number",
            "required": true,
            "helper": "PIP in cmH2O",
            "placeholder": "PIP in cmH2O"
          },
          {
            "name": "plateau_pressure",
            "label": "Plateau pressure",
            "type": "number",
            "required": false,
            "helper": "Pplat - must remain below 30 cmH2O",
            "placeholder": "Pplat - must remain below 30 cmH2O"
          },
          {
            "name": "spo2",
            "label": "SpO2 (%)",
            "type": "number",
            "required": true,
            "helper": "Oxygen saturation",
            "placeholder": "Oxygen saturation"
          },
          {
            "name": "etco2_mmhg",
            "label": "EtCO2 (mmHg)",
            "type": "number",
            "required": false,
            "helper": "End-tidal CO2",
            "placeholder": "End-tidal CO2"
          }
        ]
      }
    ]
  },
  "maternity": {
    "forms": [
      {
        "name": "Pregnancy Registration Form",
        "description": "Capture pregnancy registration details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from patient registration",
            "placeholder": "Auto-filled from patient registration"
          },
          {
            "name": "last_menstrual_period_lmp",
            "label": "Last menstrual period (LMP)",
            "type": "date",
            "required": true,
            "helper": "First day of last normal period"
          },
          {
            "name": "edd_by_lmp",
            "label": "EDD by LMP",
            "type": "text",
            "required": true,
            "helper": "Auto-calculated using Naegele's rule",
            "placeholder": "Auto-calculated using Naegele's rule"
          },
          {
            "name": "gravida",
            "label": "Gravida",
            "type": "number",
            "required": true,
            "helper": "Total number of pregnancies including current",
            "placeholder": "Total number of pregnancies including current"
          },
          {
            "name": "para",
            "label": "Para",
            "type": "number",
            "required": true,
            "helper": "Previous deliveries at or after 20 weeks",
            "placeholder": "Previous deliveries at or after 20 weeks"
          },
          {
            "name": "previous_caesarean_sections",
            "label": "Previous Caesarean sections",
            "type": "number",
            "required": false,
            "helper": "Number of previous CS",
            "placeholder": "Number of previous CS"
          },
          {
            "name": "previous_losses",
            "label": "Previous losses",
            "type": "number",
            "required": false,
            "helper": "Miscarriages, stillbirths, ectopic pregnancies",
            "placeholder": "Miscarriages, stillbirths, ectopic pregnancies"
          },
          {
            "name": "blood_group",
            "label": "Blood group",
            "type": "select",
            "required": false,
            "helper": "ABO and Rh - confirm in this pregnancy"
          },
          {
            "name": "high_risk_factors",
            "label": "High risk factors",
            "type": "text",
            "required": false,
            "helper": "Hypertension | Diabetes | Multiple pregnancy | Previous CS | Others",
            "placeholder": "Hypertension | Diabetes | Multiple pregnancy | Previous CS | Others"
          }
        ]
      },
      {
        "name": "ANC Visit Form",
        "description": "Capture anc visit details.",
        "fields": [
          {
            "name": "visit_number",
            "label": "Visit number",
            "type": "text",
            "required": true,
            "helper": "Sequential ANC visit count",
            "placeholder": "Sequential ANC visit count"
          },
          {
            "name": "gestation_weeks",
            "label": "Gestation (weeks)",
            "type": "number",
            "required": true,
            "helper": "Gestational age at this visit",
            "placeholder": "Gestational age at this visit"
          },
          {
            "name": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": true,
            "helper": "Maternal weight",
            "placeholder": "Maternal weight"
          },
          {
            "name": "blood_pressure",
            "label": "Blood pressure",
            "type": "text",
            "required": true,
            "helper": "Systolic/Diastolic",
            "placeholder": "Systolic/Diastolic"
          },
          {
            "name": "fundal_height_cm",
            "label": "Fundal height (cm)",
            "type": "number",
            "required": true,
            "helper": "Symphysis-fundus measurement",
            "placeholder": "Symphysis-fundus measurement"
          },
          {
            "name": "fetal_heart_rate_bpm",
            "label": "Fetal heart rate (bpm)",
            "type": "number",
            "required": true,
            "helper": "Fetal heart rate",
            "placeholder": "Fetal heart rate"
          },
          {
            "name": "fetal_presentation",
            "label": "Fetal presentation",
            "type": "select",
            "required": true,
            "helper": "Cephalic | Breech | Transverse | Oblique",
            "options": [
              "Cephalic",
              "Breech",
              "Transverse",
              "Oblique"
            ]
          },
          {
            "name": "fetal_movements",
            "label": "Fetal movements",
            "type": "select",
            "required": true,
            "helper": "Present | Absent | Reduced",
            "options": [
              "Present",
              "Absent",
              "Reduced"
            ]
          },
          {
            "name": "oedema",
            "label": "Oedema",
            "type": "select",
            "required": true,
            "helper": "None | Mild | Moderate | Severe",
            "options": [
              "None",
              "Mild",
              "Moderate",
              "Severe"
            ]
          },
          {
            "name": "urine_protein",
            "label": "Urine protein",
            "type": "select",
            "required": true,
            "helper": "Nil | Trace | 1+ | 2+ | 3+",
            "options": [
              "Nil",
              "Trace",
              "1+",
              "2+",
              "3+"
            ]
          },
          {
            "name": "haemoglobin_g_dl",
            "label": "Haemoglobin (g/dL)",
            "type": "number",
            "required": true,
            "helper": "Haemoglobin level",
            "placeholder": "Haemoglobin level"
          },
          {
            "name": "hiv_status",
            "label": "HIV status",
            "type": "select",
            "required": true,
            "helper": "Positive | Negative | Unknown | Declined",
            "options": [
              "Positive",
              "Negative",
              "Unknown",
              "Declined"
            ]
          },
          {
            "name": "malaria_test",
            "label": "Malaria test",
            "type": "select",
            "required": false,
            "helper": "Positive | Negative",
            "options": [
              "Positive",
              "Negative"
            ]
          },
          {
            "name": "syphilis_test",
            "label": "Syphilis test",
            "type": "select",
            "required": false,
            "helper": "Reactive | Non-reactive",
            "options": [
              "Reactive",
              "Non-reactive"
            ]
          },
          {
            "name": "tetanus_dose_given",
            "label": "Tetanus dose given",
            "type": "select",
            "required": false,
            "helper": "TT dose number 1–5"
          },
          {
            "name": "iron_folate_given",
            "label": "Iron-folate given",
            "type": "checkbox",
            "required": false,
            "helper": "Tick if iron-folate tablets dispensed"
          },
          {
            "name": "ipt_given",
            "label": "IPT given",
            "type": "checkbox",
            "required": false,
            "helper": "Intermittent preventive treatment for malaria"
          },
          {
            "name": "llin_given",
            "label": "LLIN given",
            "type": "checkbox",
            "required": false,
            "helper": "Long-lasting insecticide net issued"
          },
          {
            "name": "counselling_topics",
            "label": "Counselling topics",
            "type": "text",
            "required": false,
            "helper": "Birth plan | Danger signs | Breastfeeding | FP",
            "placeholder": "Birth plan | Danger signs | Breastfeeding | FP"
          },
          {
            "name": "next_visit_date",
            "label": "Next visit date",
            "type": "date",
            "required": true,
            "helper": "Date of next scheduled ANC"
          }
        ]
      },
      {
        "name": "Delivery / Birth Record Form",
        "description": "Capture delivery / birth record details.",
        "fields": [
          {
            "name": "gestation_at_delivery",
            "label": "Gestation at delivery",
            "type": "number",
            "required": true,
            "helper": "Weeks at time of delivery",
            "placeholder": "Weeks at time of delivery"
          },
          {
            "name": "onset_of_labour",
            "label": "Onset of labour",
            "type": "select",
            "required": true,
            "helper": "Spontaneous | Induced | Elective CS | Emergency CS",
            "options": [
              "Spontaneous",
              "Induced",
              "Elective CS",
              "Emergency CS"
            ]
          },
          {
            "name": "labour_duration_hours",
            "label": "Labour duration (hours)",
            "type": "number",
            "required": true,
            "helper": "Total duration of active labour",
            "placeholder": "Total duration of active labour"
          },
          {
            "name": "delivery_mode",
            "label": "Delivery mode",
            "type": "select",
            "required": true,
            "helper": "SVD | Assisted vaginal | CS emergency | CS elective",
            "options": [
              "SVD",
              "Assisted vaginal",
              "CS emergency",
              "CS elective"
            ]
          },
          {
            "name": "cs_indication",
            "label": "CS indication",
            "type": "text",
            "required": false,
            "helper": "Mandatory if caesarean section",
            "placeholder": "Mandatory if caesarean section"
          },
          {
            "name": "anaesthesia_type",
            "label": "Anaesthesia type",
            "type": "select",
            "required": false,
            "helper": "General | Spinal | Epidural - for operative deliveries",
            "options": [
              "General",
              "Spinal",
              "Epidural — for operative deliveries"
            ]
          },
          {
            "name": "estimated_blood_loss_ml",
            "label": "Estimated blood loss (mL)",
            "type": "number",
            "required": true,
            "helper": "Blood loss during delivery",
            "placeholder": "Blood loss during delivery"
          },
          {
            "name": "oxytocin_given",
            "label": "Oxytocin given",
            "type": "checkbox",
            "required": true,
            "helper": "Active management of third stage"
          },
          {
            "name": "perineal_trauma",
            "label": "Perineal trauma",
            "type": "select",
            "required": true,
            "helper": "Intact | Abrasion | Degree 1–4 | Episiotomy",
            "options": [
              "Intact",
              "Abrasion",
              "Degree 1–4",
              "Episiotomy"
            ]
          },
          {
            "name": "placenta_delivery",
            "label": "Placenta delivery",
            "type": "select",
            "required": true,
            "helper": "Spontaneous | Manual | Retained",
            "options": [
              "Spontaneous",
              "Manual",
              "Retained"
            ]
          },
          {
            "name": "placenta_complete",
            "label": "Placenta complete",
            "type": "text",
            "required": true,
            "helper": "Yes | No - checked on examination",
            "placeholder": "Yes | No - checked on examination"
          },
          {
            "name": "complications",
            "label": "Complications",
            "type": "textarea",
            "required": false,
            "helper": "PPH, cord prolapse, shoulder dystocia, other"
          },
          {
            "name": "delivered_by",
            "label": "Delivered by",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - logged in midwife/doctor",
            "placeholder": "Auto-filled - logged in midwife/doctor"
          }
        ]
      },
      {
        "name": "Newborn Assessment Form",
        "description": "Capture newborn assessment details.",
        "fields": [
          {
            "name": "birth_order",
            "label": "Birth order",
            "type": "number",
            "required": true,
            "helper": "1 for singleton, 1 or 2 for twins",
            "placeholder": "1 for singleton, 1 or 2 for twins"
          },
          {
            "name": "sex",
            "label": "Sex",
            "type": "select",
            "required": true,
            "helper": "Male | Female | Indeterminate",
            "options": [
              "Male",
              "Female",
              "Indeterminate"
            ]
          },
          {
            "name": "birth_weight_grams",
            "label": "Birth weight (grams)",
            "type": "number",
            "required": true,
            "helper": "Weight immediately after delivery",
            "placeholder": "Weight immediately after delivery"
          },
          {
            "name": "birth_length_cm",
            "label": "Birth length (cm)",
            "type": "number",
            "required": false,
            "helper": "Crown-heel length",
            "placeholder": "Crown-heel length"
          },
          {
            "name": "head_circumference_cm",
            "label": "Head circumference (cm)",
            "type": "number",
            "required": false,
            "helper": "Occipitofrontal circumference",
            "placeholder": "Occipitofrontal circumference"
          },
          {
            "name": "apgar_at_1_minute",
            "label": "APGAR at 1 minute",
            "type": "number",
            "required": true,
            "helper": "APGAR score 0–10",
            "placeholder": "APGAR score 0–10"
          },
          {
            "name": "apgar_at_5_minutes",
            "label": "APGAR at 5 minutes",
            "type": "number",
            "required": true,
            "helper": "APGAR score 0–10",
            "placeholder": "APGAR score 0–10"
          },
          {
            "name": "apgar_at_10_minutes",
            "label": "APGAR at 10 minutes",
            "type": "number",
            "required": false,
            "helper": "If ≤6 at 5 minutes",
            "placeholder": "If ≤6 at 5 minutes"
          },
          {
            "name": "resuscitation_needed",
            "label": "Resuscitation needed",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "resuscitation_type",
            "label": "Resuscitation type",
            "type": "text",
            "required": false,
            "helper": "Stimulation | Bag-mask | Intubation | CPR",
            "placeholder": "Stimulation | Bag-mask | Intubation | CPR"
          },
          {
            "name": "birth_outcome",
            "label": "Birth outcome",
            "type": "select",
            "required": true,
            "helper": "Alive | Fresh stillbirth | Macerated stillbirth",
            "options": [
              "Alive",
              "Fresh stillbirth",
              "Macerated stillbirth"
            ]
          },
          {
            "name": "birth_defects",
            "label": "Birth defects",
            "type": "textarea",
            "required": false,
            "helper": "Congenital abnormalities if any"
          },
          {
            "name": "vitamin_k_given",
            "label": "Vitamin K given",
            "type": "checkbox",
            "required": true,
            "helper": "IM Vitamin K 1mg given"
          },
          {
            "name": "eye_prophylaxis",
            "label": "Eye prophylaxis",
            "type": "checkbox",
            "required": true,
            "helper": "Tetracycline eye ointment applied"
          },
          {
            "name": "bcg_given",
            "label": "BCG given",
            "type": "checkbox",
            "required": true,
            "helper": "BCG vaccine administered at birth"
          },
          {
            "name": "opv0_given",
            "label": "OPV0 given",
            "type": "checkbox",
            "required": true,
            "helper": "Oral polio vaccine birth dose"
          },
          {
            "name": "admitted_to_nicu",
            "label": "Admitted to NICU",
            "type": "checkbox",
            "required": false,
            "helper": "Tick if baby needs NICU admission"
          }
        ]
      },
      {
        "name": "Partograph Form",
        "description": "Capture partograph details.",
        "fields": [
          {
            "name": "labour_start_time",
            "label": "Labour start time",
            "type": "datetime",
            "required": true,
            "helper": "Time active labour began"
          },
          {
            "name": "membranes_status",
            "label": "Membranes status",
            "type": "select",
            "required": true,
            "helper": "Intact | Ruptured spontaneous | Ruptured artificial",
            "options": [
              "Intact",
              "Ruptured spontaneous",
              "Ruptured artificial"
            ]
          },
          {
            "name": "time_of_rom",
            "label": "Time of ROM",
            "type": "datetime",
            "required": false,
            "helper": "Time of rupture of membranes"
          },
          {
            "name": "liquor_colour",
            "label": "Liquor colour",
            "type": "select",
            "required": false,
            "helper": "Clear | Thin meconium | Thick meconium | Blood-stained",
            "options": [
              "Clear",
              "Thin meconium",
              "Thick meconium",
              "Blood-stained"
            ]
          },
          {
            "name": "cervical_dilation_cm",
            "label": "Cervical dilation (cm)",
            "type": "number",
            "required": true,
            "helper": "Plotted every 4 hours - 0–10 cm",
            "placeholder": "Plotted every 4 hours - 0–10 cm"
          },
          {
            "name": "fetal_head_station",
            "label": "Fetal head station",
            "type": "select",
            "required": true,
            "helper": "-3 | -2 | -1 | 0 | +1 | +2 | +3",
            "options": [
              "-3",
              "-2",
              "-1",
              "0",
              "+1",
              "+2",
              "+3"
            ]
          },
          {
            "name": "fetal_heart_rate",
            "label": "Fetal heart rate",
            "type": "number",
            "required": true,
            "helper": "Every 30 minutes - normal 110–160 bpm",
            "placeholder": "Every 30 minutes - normal 110–160 bpm"
          },
          {
            "name": "contractions_per_10_min",
            "label": "Contractions per 10 min",
            "type": "number",
            "required": true,
            "helper": "Frequency of uterine contractions",
            "placeholder": "Frequency of uterine contractions"
          },
          {
            "name": "contraction_duration_sec",
            "label": "Contraction duration (sec)",
            "type": "number",
            "required": true,
            "helper": "Duration of each contraction",
            "placeholder": "Duration of each contraction"
          },
          {
            "name": "alert_line_crossed",
            "label": "Alert line crossed",
            "type": "text",
            "required": true,
            "helper": "System flags if progress crosses alert line",
            "placeholder": "System flags if progress crosses alert line"
          },
          {
            "name": "action_line_crossed",
            "label": "Action line crossed",
            "type": "text",
            "required": true,
            "helper": "System flags if progress crosses action line",
            "placeholder": "System flags if progress crosses action line"
          }
        ]
      }
    ]
  },
  "nicu": {
    "forms": [
      {
        "name": "NICU Admission Form",
        "description": "Capture nicu admission details.",
        "fields": [
          {
            "name": "baby_patient",
            "label": "Baby patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from newborn registration",
            "placeholder": "Auto-filled from newborn registration"
          },
          {
            "name": "mother_patient",
            "label": "Mother patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from delivery record",
            "placeholder": "Auto-filled from delivery record"
          },
          {
            "name": "gestational_age",
            "label": "Gestational age",
            "type": "number",
            "required": true,
            "helper": "Gestational age in weeks at birth",
            "placeholder": "Gestational age in weeks at birth"
          },
          {
            "name": "birth_weight_grams",
            "label": "Birth weight (grams)",
            "type": "number",
            "required": true,
            "helper": "Birth weight",
            "placeholder": "Birth weight"
          },
          {
            "name": "apgar_scores",
            "label": "APGAR scores",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from delivery record",
            "placeholder": "Auto-filled from delivery record"
          },
          {
            "name": "admission_diagnosis",
            "label": "Admission diagnosis",
            "type": "text",
            "required": true,
            "helper": "Primary reason for NICU admission",
            "placeholder": "Primary reason for NICU admission"
          },
          {
            "name": "admission_source",
            "label": "Admission source",
            "type": "select",
            "required": true,
            "helper": "Delivery room | Ward | Emergency | Transfer",
            "options": [
              "Delivery room",
              "Ward",
              "Emergency",
              "Transfer"
            ]
          },
          {
            "name": "incubator_assigned",
            "label": "Incubator assigned",
            "type": "select",
            "required": true,
            "helper": "Select available incubator"
          },
          {
            "name": "code_status",
            "label": "Code status",
            "type": "select",
            "required": true,
            "helper": "Full resuscitation | Comfort care | DNR",
            "options": [
              "Full resuscitation",
              "Comfort care",
              "DNR"
            ]
          },
          {
            "name": "consent_obtained",
            "label": "Consent obtained",
            "type": "checkbox",
            "required": true,
            "helper": "Parent/guardian consent for NICU care"
          }
        ]
      },
      {
        "name": "NICU Daily Record Form",
        "description": "Capture nicu daily record details.",
        "fields": [
          {
            "name": "day_of_life",
            "label": "Day of life",
            "type": "text",
            "required": true,
            "helper": "Auto-calculated from birth date",
            "placeholder": "Auto-calculated from birth date"
          },
          {
            "name": "weight_grams",
            "label": "Weight (grams)",
            "type": "number",
            "required": true,
            "helper": "Daily weight - expected trajectory tracked",
            "placeholder": "Daily weight - expected trajectory tracked"
          },
          {
            "name": "temperature_c",
            "label": "Temperature (°C)",
            "type": "number",
            "required": true,
            "helper": "Axillary temperature",
            "placeholder": "Axillary temperature"
          },
          {
            "name": "incubator_temperature",
            "label": "Incubator temperature",
            "type": "number",
            "required": true,
            "helper": "Set temperature of incubator",
            "placeholder": "Set temperature of incubator"
          },
          {
            "name": "incubator_humidity",
            "label": "Incubator humidity (%)",
            "type": "number",
            "required": false,
            "helper": "Relative humidity set in incubator",
            "placeholder": "Relative humidity set in incubator"
          },
          {
            "name": "respiratory_support",
            "label": "Respiratory support",
            "type": "select",
            "required": true,
            "helper": "None | Oxygen | CPAP | HFNC | Ventilator",
            "options": [
              "None",
              "Oxygen",
              "CPAP",
              "HFNC",
              "Ventilator"
            ]
          },
          {
            "name": "fio2",
            "label": "FiO2 (%)",
            "type": "number",
            "required": false,
            "helper": "Oxygen concentration if on support",
            "placeholder": "Oxygen concentration if on support"
          },
          {
            "name": "spo2",
            "label": "SpO2 (%)",
            "type": "number",
            "required": true,
            "helper": "Target 90–95% for premature babies",
            "placeholder": "Target 90–95% for premature babies"
          },
          {
            "name": "phototherapy",
            "label": "Phototherapy",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if phototherapy active"
          },
          {
            "name": "phototherapy_hours_today",
            "label": "Phototherapy hours today",
            "type": "number",
            "required": false,
            "helper": "Hours under phototherapy this day",
            "placeholder": "Hours under phototherapy this day"
          },
          {
            "name": "bilirubin_mol_l",
            "label": "Bilirubin (µmol/L)",
            "type": "number",
            "required": false,
            "helper": "Total serum bilirubin",
            "placeholder": "Total serum bilirubin"
          },
          {
            "name": "feeding_type",
            "label": "Feeding type",
            "type": "select",
            "required": true,
            "helper": "Breast milk | Formula | Donor milk | NPO",
            "options": [
              "Breast milk",
              "Formula",
              "Donor milk",
              "NPO"
            ]
          },
          {
            "name": "feed_volume_ml_kg_day",
            "label": "Feed volume (mL/kg/day)",
            "type": "number",
            "required": true,
            "helper": "Total daily feed volume",
            "placeholder": "Total daily feed volume"
          },
          {
            "name": "iv_fluid_rate_ml_kg_day",
            "label": "IV fluid rate (mL/kg/day)",
            "type": "number",
            "required": false,
            "helper": "IV maintenance fluid rate",
            "placeholder": "IV maintenance fluid rate"
          },
          {
            "name": "kangaroo_care_hours",
            "label": "Kangaroo care hours",
            "type": "number",
            "required": false,
            "helper": "Hours of skin-to-skin care today",
            "placeholder": "Hours of skin-to-skin care today"
          },
          {
            "name": "antibiotics",
            "label": "Antibiotics",
            "type": "text",
            "required": false,
            "helper": "Current antibiotic drugs and day of treatment",
            "placeholder": "Current antibiotic drugs and day of treatment"
          },
          {
            "name": "assessment_notes",
            "label": "Assessment notes",
            "type": "textarea",
            "required": true,
            "helper": "Daily clinical assessment narrative"
          }
        ]
      }
    ]
  },
  "mortuary": {
    "forms": [
      {
        "name": "Body Reception Form",
        "description": "Capture body reception details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": false,
            "helper": "Link to patient MRN if known",
            "placeholder": "Link to patient MRN if known"
          },
          {
            "name": "body_received_from",
            "label": "Body received from",
            "type": "select",
            "required": true,
            "helper": "Inpatient ward | Emergency | Theatre | Home | Scene | Police | Coroner",
            "options": [
              "Inpatient ward",
              "Emergency",
              "Theatre",
              "Home",
              "Scene",
              "Police",
              "Coroner"
            ]
          },
          {
            "name": "received_at_time",
            "label": "Received at time",
            "type": "datetime",
            "required": true,
            "helper": "Time body arrived in mortuary"
          },
          {
            "name": "sex",
            "label": "Sex",
            "type": "select",
            "required": true,
            "helper": "Male | Female | Unknown",
            "options": [
              "Male",
              "Female",
              "Unknown"
            ]
          },
          {
            "name": "approximate_age",
            "label": "Approximate age",
            "type": "text",
            "required": false,
            "helper": "Estimated age if identity not confirmed",
            "placeholder": "Estimated age if identity not confirmed"
          },
          {
            "name": "body_condition",
            "label": "Body condition",
            "type": "select",
            "required": true,
            "helper": "Fresh | Early decomposition | Advanced decomposition | Embalmed",
            "options": [
              "Fresh",
              "Early decomposition",
              "Advanced decomposition",
              "Embalmed"
            ]
          },
          {
            "name": "identifying_features",
            "label": "Identifying features",
            "type": "textarea",
            "required": false,
            "helper": "Physical description for identification"
          },
          {
            "name": "compartment_assigned",
            "label": "Compartment assigned",
            "type": "select",
            "required": true,
            "helper": "Cold storage compartment number"
          },
          {
            "name": "police_case",
            "label": "Police case",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if death involves police investigation"
          },
          {
            "name": "police_reference",
            "label": "Police reference",
            "type": "text",
            "required": false,
            "helper": "OB number or case reference",
            "placeholder": "OB number or case reference"
          },
          {
            "name": "accompanying_documentation",
            "label": "Accompanying documentation",
            "type": "text",
            "required": true,
            "helper": "Death notification | Medical certificate | Police release",
            "placeholder": "Death notification | Medical certificate | Police release"
          }
        ]
      },
      {
        "name": "Death Certificate Form",
        "description": "Capture death certificate details.",
        "fields": [
          {
            "name": "deceased_name",
            "label": "Deceased name",
            "type": "text",
            "required": true,
            "helper": "Full legal name",
            "placeholder": "Full legal name"
          },
          {
            "name": "date_of_death",
            "label": "Date of death",
            "type": "date",
            "required": true,
            "helper": "Certified date of death"
          },
          {
            "name": "time_of_death",
            "label": "Time of death",
            "type": "time",
            "required": false,
            "helper": "Time if known"
          },
          {
            "name": "place_of_death",
            "label": "Place of death",
            "type": "text",
            "required": true,
            "helper": "Hospital name and ward or location",
            "placeholder": "Hospital name and ward or location"
          },
          {
            "name": "cause_ia_immediate_cause",
            "label": "Cause Ia — Immediate cause",
            "type": "text",
            "required": true,
            "helper": "Disease directly causing death",
            "placeholder": "Disease directly causing death"
          },
          {
            "name": "cause_ib_antecedent_cause",
            "label": "Cause Ib — Antecedent cause",
            "type": "text",
            "required": false,
            "helper": "Disease leading to immediate cause",
            "placeholder": "Disease leading to immediate cause"
          },
          {
            "name": "cause_ic_underlying_cause",
            "label": "Cause Ic — Underlying cause",
            "type": "text",
            "required": false,
            "helper": "Disease leading to Ib",
            "placeholder": "Disease leading to Ib"
          },
          {
            "name": "cause_ii_contributing_conditions",
            "label": "Cause II — Contributing conditions",
            "type": "text",
            "required": false,
            "helper": "Other conditions contributing to death",
            "placeholder": "Other conditions contributing to death"
          },
          {
            "name": "icd_10_code",
            "label": "ICD-10 code",
            "type": "text",
            "required": true,
            "helper": "Code for underlying cause of death",
            "placeholder": "Code for underlying cause of death"
          },
          {
            "name": "manner_of_death",
            "label": "Manner of death",
            "type": "select",
            "required": true,
            "helper": "Natural | Accident | Homicide | Suicide | Undetermined",
            "options": [
              "Natural",
              "Accident",
              "Homicide",
              "Suicide",
              "Undetermined"
            ]
          },
          {
            "name": "post_mortem_performed",
            "label": "Post-mortem performed",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "certifying_doctor",
            "label": "Certifying doctor",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - logged in doctor",
            "placeholder": "Auto-filled - logged in doctor"
          }
        ]
      },
      {
        "name": "Body Release Form",
        "description": "Capture body release details.",
        "fields": [
          {
            "name": "released_to_name",
            "label": "Released to name",
            "type": "text",
            "required": true,
            "helper": "Full name of person collecting body",
            "placeholder": "Full name of person collecting body"
          },
          {
            "name": "collector_id_number",
            "label": "Collector ID number",
            "type": "text",
            "required": true,
            "helper": "National ID of collector",
            "placeholder": "National ID of collector"
          },
          {
            "name": "relationship_to_deceased",
            "label": "Relationship to deceased",
            "type": "select",
            "required": true,
            "helper": "Spouse | Parent | Child | Sibling | Funeral home | Other",
            "options": [
              "Spouse",
              "Parent",
              "Child",
              "Sibling",
              "Funeral home",
              "Other"
            ]
          },
          {
            "name": "funeral_home_name",
            "label": "Funeral home name",
            "type": "text",
            "required": false,
            "helper": "If released to funeral home",
            "placeholder": "If released to funeral home"
          },
          {
            "name": "burial_permit_number",
            "label": "Burial permit number",
            "type": "text",
            "required": true,
            "helper": "County burial permit reference",
            "placeholder": "County burial permit reference"
          },
          {
            "name": "death_certificate_issued",
            "label": "Death certificate issued",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm death certificate was given"
          },
          {
            "name": "outstanding_bill_cleared",
            "label": "Outstanding bill cleared",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm hospital bill is fully settled"
          }
        ]
      }
    ]
  },
  "billing": {
    "forms": [
      {
        "name": "Invoice Review & Finalise Form",
        "description": "Capture invoice review & finalise details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from encounter",
            "placeholder": "Auto-filled from encounter"
          },
          {
            "name": "invoice_number",
            "label": "Invoice number",
            "type": "text",
            "required": true,
            "helper": "System-generated invoice number",
            "placeholder": "System-generated invoice number"
          },
          {
            "name": "billing_period",
            "label": "Billing period",
            "type": "text",
            "required": true,
            "helper": "Dates of service covered",
            "placeholder": "Dates of service covered"
          },
          {
            "name": "line_items",
            "label": "Line items",
            "type": "text",
            "required": true,
            "helper": "Auto-populated from all clinical events - doctor to verify",
            "placeholder": "Auto-populated from all clinical events - doctor to verify"
          },
          {
            "name": "manual_charge_addition",
            "label": "Manual charge addition",
            "type": "text",
            "required": false,
            "helper": "Add missed charge from charge master",
            "placeholder": "Add missed charge from charge master"
          },
          {
            "name": "discount_type",
            "label": "Discount type",
            "type": "select",
            "required": false,
            "helper": "Staff | Charity | Management | SHA top-up | Other",
            "options": [
              "Staff",
              "Charity",
              "Management",
              "SHA top-up",
              "Other"
            ]
          },
          {
            "name": "discount_amount",
            "label": "Discount amount",
            "type": "number",
            "required": false,
            "helper": "Discount in KES - requires approval above threshold",
            "placeholder": "Discount in KES - requires approval above threshold"
          },
          {
            "name": "discount_authorised_by",
            "label": "Discount authorised by",
            "type": "select",
            "required": false,
            "helper": "Manager who approved the discount"
          },
          {
            "name": "insurance_scheme",
            "label": "Insurance scheme",
            "type": "text",
            "required": false,
            "helper": "Active scheme for this visit - auto-filled",
            "placeholder": "Active scheme for this visit - auto-filled"
          },
          {
            "name": "insurance_coverage_amount",
            "label": "Insurance coverage amount",
            "type": "number",
            "required": false,
            "helper": "Amount covered by insurance",
            "placeholder": "Amount covered by insurance"
          },
          {
            "name": "patient_liability",
            "label": "Patient liability",
            "type": "text",
            "required": true,
            "helper": "Total minus insurance coverage",
            "placeholder": "Total minus insurance coverage"
          }
        ]
      },
      {
        "name": "Payment Receipt Form",
        "description": "Capture payment receipt details.",
        "fields": [
          {
            "name": "invoice",
            "label": "Invoice",
            "type": "text",
            "required": true,
            "helper": "Invoice being paid",
            "placeholder": "Invoice being paid"
          },
          {
            "name": "amount_received",
            "label": "Amount received",
            "type": "number",
            "required": true,
            "helper": "Amount of this payment",
            "placeholder": "Amount of this payment"
          },
          {
            "name": "payment_method",
            "label": "Payment method",
            "type": "select",
            "required": true,
            "helper": "Cash | MPESA | Card | Bank transfer | Cheque | Insurance | Waiver",
            "options": [
              "Cash",
              "MPESA",
              "Card",
              "Bank transfer",
              "Cheque",
              "Insurance",
              "Waiver"
            ]
          },
          {
            "name": "mpesa_reference",
            "label": "MPESA reference",
            "type": "text",
            "required": false,
            "helper": "M-Pesa transaction confirmation code",
            "placeholder": "M-Pesa transaction confirmation code"
          },
          {
            "name": "card_last_4_digits",
            "label": "Card last 4 digits",
            "type": "text",
            "required": false,
            "helper": "Last 4 digits of card used",
            "placeholder": "Last 4 digits of card used"
          },
          {
            "name": "bank_reference",
            "label": "Bank reference",
            "type": "text",
            "required": false,
            "helper": "Bank transfer reference number",
            "placeholder": "Bank transfer reference number"
          },
          {
            "name": "print_receipt",
            "label": "Print receipt",
            "type": "checkbox",
            "required": true,
            "helper": "Auto-generates receipt on confirmation"
          }
        ]
      },
      {
        "name": "Charge Master Entry Form",
        "description": "Capture charge master entry details.",
        "fields": [
          {
            "name": "charge_code",
            "label": "Charge code",
            "type": "text",
            "required": true,
            "helper": "Internal charge code e.g. CONSULT-OPD-GP",
            "placeholder": "Internal charge code e.g. CONSULT-OPD-GP"
          },
          {
            "name": "description",
            "label": "Description",
            "type": "text",
            "required": true,
            "helper": "Description shown on patient invoice",
            "placeholder": "Description shown on patient invoice"
          },
          {
            "name": "category",
            "label": "Category",
            "type": "select",
            "required": true,
            "helper": "Consultation | Procedure | Lab | Radiology | Drug | Accommodation | Theatre | Blood | Ambulance",
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
            ]
          },
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Department that provides this service"
          },
          {
            "name": "unit_price_kes",
            "label": "Unit price (KES)",
            "type": "number",
            "required": true,
            "helper": "Standard price",
            "placeholder": "Standard price"
          },
          {
            "name": "nhif_code",
            "label": "SHA code",
            "type": "text",
            "required": false,
            "helper": "SHA benefit code for claim submission",
            "placeholder": "SHA benefit code for claim submission"
          },
          {
            "name": "nhif_rate_kes",
            "label": "SHA rate (KES)",
            "type": "number",
            "required": false,
            "helper": "SHA reimbursement rate",
            "placeholder": "SHA reimbursement rate"
          },
          {
            "name": "is_taxable",
            "label": "Is taxable",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if VAT applies"
          },
          {
            "name": "tax_rate",
            "label": "Tax rate (%)",
            "type": "number",
            "required": false,
            "helper": "VAT percentage if taxable",
            "placeholder": "VAT percentage if taxable"
          },
          {
            "name": "effective_from",
            "label": "Effective from",
            "type": "date",
            "required": true,
            "helper": "Date price becomes active"
          }
        ]
      },
      {
        "name": "Bill Adjustment Form",
        "description": "Capture bill adjustment details.",
        "fields": [
          {
            "name": "invoice",
            "label": "Invoice",
            "type": "text",
            "required": true,
            "helper": "Invoice being adjusted",
            "placeholder": "Invoice being adjusted"
          },
          {
            "name": "adjustment_type",
            "label": "Adjustment type",
            "type": "select",
            "required": true,
            "helper": "Discount | Write-off | Correction | Reversal",
            "options": [
              "Discount",
              "Write-off",
              "Correction",
              "Reversal"
            ]
          },
          {
            "name": "amount_adjusted",
            "label": "Amount adjusted",
            "type": "number",
            "required": true,
            "helper": "Amount being adjusted",
            "placeholder": "Amount being adjusted"
          },
          {
            "name": "reason",
            "label": "Reason",
            "type": "textarea",
            "required": true,
            "helper": "Detailed reason for adjustment"
          },
          {
            "name": "authorised_by",
            "label": "Authorised by",
            "type": "select",
            "required": true,
            "helper": "Manager approving the adjustment"
          }
        ]
      }
    ]
  },
  "insurance": {
    "forms": [
      {
        "name": "Insurance Scheme Setup Form",
        "description": "Capture insurance scheme setup details.",
        "fields": [
          {
            "name": "scheme_name",
            "label": "Scheme name",
            "type": "text",
            "required": true,
            "helper": "Full insurance scheme name",
            "placeholder": "Full insurance scheme name"
          },
          {
            "name": "scheme_type",
            "label": "Scheme type",
            "type": "select",
            "required": true,
            "helper": "SHA | Private | Corporate | Government | NGO",
            "options": [
              "SHA",
              "Private",
              "Corporate",
              "Government",
              "NGO"
            ]
          },
          {
            "name": "insurer_contact",
            "label": "Insurer contact",
            "type": "text",
            "required": false,
            "helper": "Claims desk contact name",
            "placeholder": "Claims desk contact name"
          },
          {
            "name": "claims_phone",
            "label": "Claims phone",
            "type": "tel",
            "required": false,
            "helper": "Claims desk phone number",
            "placeholder": "Claims desk phone number"
          },
          {
            "name": "claims_email",
            "label": "Claims email",
            "type": "email",
            "required": false,
            "helper": "Claims submission email",
            "placeholder": "Claims submission email"
          },
          {
            "name": "claims_api_url",
            "label": "Claims API URL",
            "type": "url",
            "required": false,
            "helper": "Electronic claims API endpoint",
            "placeholder": "Electronic claims API endpoint"
          },
          {
            "name": "pre_auth_required",
            "label": "Pre-auth required",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if pre-authorisation is needed"
          },
          {
            "name": "pre_auth_threshold_kes",
            "label": "Pre-auth threshold (KES)",
            "type": "number",
            "required": false,
            "helper": "Cost above which pre-auth is required",
            "placeholder": "Cost above which pre-auth is required"
          },
          {
            "name": "claims_format",
            "label": "Claims format",
            "type": "select",
            "required": false,
            "helper": "EDI | HL7 | FHIR | Proprietary",
            "options": [
              "EDI",
              "HL7",
              "FHIR",
              "Proprietary"
            ]
          }
        ]
      },
      {
        "name": "Pre-Authorisation Request Form",
        "description": "Capture pre-authorisation request details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from registration",
            "placeholder": "Auto-filled from registration"
          },
          {
            "name": "insurance_scheme",
            "label": "Insurance scheme",
            "type": "text",
            "required": true,
            "helper": "Patient's active insurance",
            "placeholder": "Patient's active insurance"
          },
          {
            "name": "admission_diagnosis",
            "label": "Admission diagnosis",
            "type": "text",
            "required": true,
            "helper": "ICD-10 coded diagnosis",
            "placeholder": "ICD-10 coded diagnosis"
          },
          {
            "name": "admission_type",
            "label": "Admission type",
            "type": "select",
            "required": true,
            "helper": "Elective | Emergency",
            "options": [
              "Elective",
              "Emergency"
            ]
          },
          {
            "name": "requested_services",
            "label": "Requested services",
            "type": "textarea",
            "required": true,
            "helper": "List of services requiring pre-auth"
          },
          {
            "name": "estimated_cost_kes",
            "label": "Estimated cost (KES)",
            "type": "number",
            "required": true,
            "helper": "Estimated total cost of admission",
            "placeholder": "Estimated total cost of admission"
          },
          {
            "name": "expected_admission_date",
            "label": "Expected admission date",
            "type": "date",
            "required": true,
            "helper": "Planned date of admission"
          },
          {
            "name": "clinical_justification",
            "label": "Clinical justification",
            "type": "textarea",
            "required": true,
            "helper": "Medical necessity statement for the insurer"
          },
          {
            "name": "attending_doctor",
            "label": "Attending doctor",
            "type": "text",
            "required": true,
            "helper": "Requesting clinician",
            "placeholder": "Requesting clinician"
          }
        ]
      },
      {
        "name": "Claim Submission Form",
        "description": "Capture claim submission details.",
        "fields": [
          {
            "name": "invoice",
            "label": "Invoice",
            "type": "text",
            "required": true,
            "helper": "Invoice being claimed",
            "placeholder": "Invoice being claimed"
          },
          {
            "name": "insurance_scheme",
            "label": "Insurance scheme",
            "type": "text",
            "required": true,
            "helper": "Target insurer",
            "placeholder": "Target insurer"
          },
          {
            "name": "pre_auth_reference",
            "label": "Pre-auth reference",
            "type": "text",
            "required": false,
            "helper": "Pre-authorisation number if applicable",
            "placeholder": "Pre-authorisation number if applicable"
          },
          {
            "name": "diagnosis_codes",
            "label": "Diagnosis codes",
            "type": "text",
            "required": true,
            "helper": "ICD-10 codes from encounter",
            "placeholder": "ICD-10 codes from encounter"
          },
          {
            "name": "procedure_codes",
            "label": "Procedure codes",
            "type": "text",
            "required": true,
            "helper": "Procedure codes from billing",
            "placeholder": "Procedure codes from billing"
          },
          {
            "name": "claim_amount_kes",
            "label": "Claim amount (KES)",
            "type": "text",
            "required": true,
            "helper": "Total amount being claimed",
            "placeholder": "Total amount being claimed"
          },
          {
            "name": "supporting_documents",
            "label": "Supporting documents",
            "type": "text",
            "required": false,
            "helper": "Discharge summary, lab results, imaging reports",
            "placeholder": "Discharge summary, lab results, imaging reports"
          }
        ]
      },
      {
        "name": "Denial Response Form",
        "description": "Capture denial response details.",
        "fields": [
          {
            "name": "denied_claim",
            "label": "Denied claim",
            "type": "text",
            "required": true,
            "helper": "Reference to original claim",
            "placeholder": "Reference to original claim"
          },
          {
            "name": "denial_code",
            "label": "Denial code",
            "type": "text",
            "required": true,
            "helper": "Insurer's denial code",
            "placeholder": "Insurer's denial code"
          },
          {
            "name": "denial_reason",
            "label": "Denial reason",
            "type": "text",
            "required": true,
            "helper": "Insurer's denial reason",
            "placeholder": "Insurer's denial reason"
          },
          {
            "name": "appeal_decision",
            "label": "Appeal decision",
            "type": "select",
            "required": true,
            "helper": "Will appeal | No appeal",
            "options": [
              "Will appeal",
              "No appeal"
            ]
          },
          {
            "name": "appeal_grounds",
            "label": "Appeal grounds",
            "type": "textarea",
            "required": true,
            "helper": "Clinical and administrative basis for appeal"
          },
          {
            "name": "supporting_documents",
            "label": "Supporting documents",
            "type": "text",
            "required": false,
            "helper": "Additional documentation to support appeal",
            "placeholder": "Additional documentation to support appeal"
          }
        ]
      }
    ]
  },
  "inventory": {
    "forms": [
      {
        "name": "Stock Item Registration Form",
        "description": "Capture stock item registration details.",
        "fields": [
          {
            "name": "item_code",
            "label": "Item code",
            "type": "text",
            "required": true,
            "helper": "Internal stock code",
            "placeholder": "Internal stock code"
          },
          {
            "name": "item_name",
            "label": "Item name",
            "type": "text",
            "required": true,
            "helper": "Full item name",
            "placeholder": "Full item name"
          },
          {
            "name": "category",
            "label": "Category",
            "type": "select",
            "required": true,
            "helper": "Drug | Consumable | Equipment | Linen | Food | Stationery",
            "options": [
              "Drug",
              "Consumable",
              "Equipment",
              "Linen",
              "Food",
              "Stationery"
            ]
          },
          {
            "name": "unit_of_measure",
            "label": "Unit of measure",
            "type": "select",
            "required": true,
            "helper": "Tablet | Box | Vial | Piece | Kg | Litre",
            "options": [
              "Tablet",
              "Box",
              "Vial",
              "Piece",
              "Kg",
              "Litre"
            ]
          },
          {
            "name": "reorder_level",
            "label": "Reorder level",
            "type": "number",
            "required": true,
            "helper": "Minimum quantity before reorder triggered",
            "placeholder": "Minimum quantity before reorder triggered"
          },
          {
            "name": "reorder_quantity",
            "label": "Reorder quantity",
            "type": "number",
            "required": true,
            "helper": "Standard quantity to order",
            "placeholder": "Standard quantity to order"
          },
          {
            "name": "unit_cost_kes",
            "label": "Unit cost (KES)",
            "type": "number",
            "required": true,
            "helper": "Cost to hospital per unit",
            "placeholder": "Cost to hospital per unit"
          },
          {
            "name": "selling_price_kes",
            "label": "Selling price (KES)",
            "type": "number",
            "required": false,
            "helper": "Patient charge if applicable",
            "placeholder": "Patient charge if applicable"
          },
          {
            "name": "storage_location",
            "label": "Storage location",
            "type": "text",
            "required": false,
            "helper": "Store, shelf, or refrigerator location",
            "placeholder": "Store, shelf, or refrigerator location"
          },
          {
            "name": "vendor_supplier",
            "label": "Vendor / supplier",
            "type": "text",
            "required": true,
            "helper": "Record the vendor or supplier who supplied this item to the hospital",
            "placeholder": "e.g. KEMSA, MedSource, Surgipharm"
          },
          {
            "name": "supplier_delivery_reference",
            "label": "Supplier delivery reference",
            "type": "text",
            "required": false,
            "helper": "Invoice, delivery note, or purchase order reference from the supplier",
            "placeholder": "Supplier invoice / delivery note number"
          },
          {
            "name": "is_controlled",
            "label": "Is controlled",
            "type": "checkbox",
            "required": true,
            "helper": "Tick for narcotics and restricted items"
          }
        ]
      },
      {
        "name": "Vendor / Supplier Registration Form",
        "description": "Create and maintain hospital vendor and supplier records used by inventory, procurement, and stock receiving.",
        "fields": [
          {
            "name": "supplier_name",
            "label": "Vendor / supplier name",
            "type": "text",
            "required": true,
            "helper": "Registered supplier or vendor name",
            "placeholder": "e.g. KEMSA"
          },
          {
            "name": "supplier_type",
            "label": "Supplier type",
            "type": "select",
            "required": true,
            "helper": "Primary category of goods supplied",
            "options": [
              "Drug supplier",
              "Consumables supplier",
              "Equipment vendor",
              "Food supplier",
              "Linen supplier",
              "Stationery supplier",
              "General vendor"
            ]
          },
          {
            "name": "contact_person",
            "label": "Contact person",
            "type": "text",
            "required": true,
            "helper": "Main person responsible for hospital account",
            "placeholder": "Supplier account manager"
          },
          {
            "name": "phone_number",
            "label": "Phone number",
            "type": "tel",
            "required": true,
            "helper": "Supplier contact phone number",
            "placeholder": "+254..."
          },
          {
            "name": "email",
            "label": "Email",
            "type": "email",
            "required": false,
            "helper": "Supplier email for purchase orders and delivery follow-up",
            "placeholder": "supplier@example.com"
          },
          {
            "name": "physical_address",
            "label": "Physical address",
            "type": "text",
            "required": false,
            "helper": "Supplier office, warehouse, or dispatch address",
            "placeholder": "Street, town, county"
          },
          {
            "name": "kra_pin",
            "label": "KRA PIN",
            "type": "text",
            "required": false,
            "helper": "Supplier tax identifier",
            "placeholder": "KRA PIN"
          },
          {
            "name": "payment_terms",
            "label": "Payment terms",
            "type": "select",
            "required": false,
            "helper": "Agreed settlement terms",
            "options": [
              "Cash on delivery",
              "7 days",
              "14 days",
              "30 days",
              "60 days",
              "Contract terms"
            ]
          },
          {
            "name": "status",
            "label": "Status",
            "type": "select",
            "required": true,
            "helper": "Supplier approval status",
            "options": [
              "Active",
              "Pending approval",
              "Suspended",
              "Blacklisted"
            ]
          },
          {
            "name": "notes",
            "label": "Notes",
            "type": "textarea",
            "required": false,
            "helper": "Special delivery conditions, contract notes, or compliance requirements"
          }
        ]
      },
      {
        "name": "Purchase Requisition Form",
        "description": "Capture purchase requisition details.",
        "fields": [
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Department requesting items"
          },
          {
            "name": "urgency",
            "label": "Urgency",
            "type": "select",
            "required": true,
            "helper": "Routine | Urgent | Critical",
            "options": [
              "Routine",
              "Urgent",
              "Critical"
            ]
          },
          {
            "name": "required_by_date",
            "label": "Required by date",
            "type": "date",
            "required": false,
            "helper": "When items are needed"
          },
          {
            "name": "items_requested",
            "label": "Items requested",
            "type": "text",
            "required": true,
            "helper": "Item, quantity, and justification per line",
            "placeholder": "Item, quantity, and justification per line"
          },
          {
            "name": "justification",
            "label": "Justification",
            "type": "textarea",
            "required": true,
            "helper": "Reason for the requisition"
          }
        ]
      },
      {
        "name": "Purchase Order Form",
        "description": "Capture purchase order details.",
        "fields": [
          {
            "name": "supplier",
            "label": "Supplier",
            "type": "select",
            "required": true,
            "helper": "Selected supplier from directory"
          },
          {
            "name": "items",
            "label": "Items",
            "type": "text",
            "required": true,
            "helper": "Item, quantity, unit price per line",
            "placeholder": "Item, quantity, unit price per line"
          },
          {
            "name": "expected_delivery_date",
            "label": "Expected delivery date",
            "type": "date",
            "required": true,
            "helper": "Agreed delivery date"
          },
          {
            "name": "delivery_instructions",
            "label": "Delivery instructions",
            "type": "text",
            "required": false,
            "helper": "Special delivery or packing instructions",
            "placeholder": "Special delivery or packing instructions"
          },
          {
            "name": "total_value_kes",
            "label": "Total value (KES)",
            "type": "text",
            "required": true,
            "helper": "Sum of all line items",
            "placeholder": "Sum of all line items"
          }
        ]
      },
      {
        "name": "Goods Received Note (GRN)",
        "description": "Capture goods received note (grn) details.",
        "fields": [
          {
            "name": "purchase_order",
            "label": "Purchase order",
            "type": "select",
            "required": true,
            "helper": "PO being received against"
          },
          {
            "name": "supplier",
            "label": "Supplier",
            "type": "select",
            "required": true,
            "helper": "Select the supplier/vendor delivering the received products",
            "options": [
              "KEMSA",
              "MedSource Kenya",
              "Surgipharm",
              "Laborex Kenya",
              "Mission for Essential Drugs and Supplies",
              "Other"
            ]
          },
          {
            "name": "supplier_delivery_note_number",
            "label": "Supplier delivery note number",
            "type": "text",
            "required": false,
            "helper": "Supplier's delivery note reference",
            "placeholder": "Supplier's delivery note reference"
          },
          {
            "name": "delivery_date",
            "label": "Delivery date",
            "type": "date",
            "required": true,
            "helper": "Date goods physically received"
          },
          {
            "name": "items_received",
            "label": "Items received",
            "type": "text",
            "required": true,
            "helper": "Item, ordered qty, received qty, batch, expiry, condition",
            "placeholder": "Item, ordered qty, received qty, batch, expiry, condition"
          },
          {
            "name": "items_rejected",
            "label": "Items rejected",
            "type": "text",
            "required": false,
            "helper": "Items rejected - reason per item",
            "placeholder": "Items rejected - reason per item"
          },
          {
            "name": "received_by",
            "label": "Received by",
            "type": "text",
            "required": true,
            "helper": "Store keeper - auto-filled from login",
            "placeholder": "Store keeper - auto-filled from login"
          }
        ]
      },
      {
        "name": "Stock Count Form",
        "description": "Capture stock count details.",
        "fields": [
          {
            "name": "count_type",
            "label": "Count type",
            "type": "select",
            "required": true,
            "helper": "Full | Cycle count | Spot check",
            "options": [
              "Full",
              "Cycle count",
              "Spot check"
            ]
          },
          {
            "name": "location",
            "label": "Location",
            "type": "select",
            "required": true,
            "helper": "Store or area being counted"
          },
          {
            "name": "item",
            "label": "Item",
            "type": "select",
            "required": true,
            "helper": "Item being counted"
          },
          {
            "name": "batch_number",
            "label": "Batch number",
            "type": "text",
            "required": false,
            "helper": "Specific batch being counted",
            "placeholder": "Specific batch being counted"
          },
          {
            "name": "system_quantity",
            "label": "System quantity",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from inventory",
            "placeholder": "Auto-filled from inventory"
          },
          {
            "name": "physical_quantity",
            "label": "Physical quantity",
            "type": "number",
            "required": true,
            "helper": "Actually counted quantity",
            "placeholder": "Actually counted quantity"
          },
          {
            "name": "variance_reason",
            "label": "Variance reason",
            "type": "text",
            "required": false,
            "helper": "Explanation if variance exists",
            "placeholder": "Explanation if variance exists"
          }
        ]
      }
    ]
  },
  "hr": {
    "forms": [
      {
        "name": "Employee Registration Form",
        "description": "Capture employee registration details.",
        "fields": [
          {
            "name": "first_name",
            "label": "First name",
            "type": "text",
            "required": true,
            "helper": "Employee first name",
            "placeholder": "Employee first name"
          },
          {
            "name": "last_name",
            "label": "Last name",
            "type": "text",
            "required": true,
            "helper": "Employee surname",
            "placeholder": "Employee surname"
          },
          {
            "name": "date_of_birth",
            "label": "Date of birth",
            "type": "date",
            "required": true,
            "helper": "Date of birth"
          },
          {
            "name": "gender",
            "label": "Gender",
            "type": "select",
            "required": true,
            "helper": "Male | Female | Other",
            "options": [
              "Male",
              "Female",
              "Other"
            ]
          },
          {
            "name": "national_id",
            "label": "National ID",
            "type": "text",
            "required": true,
            "helper": "National ID number",
            "placeholder": "National ID number"
          },
          {
            "name": "kra_pin",
            "label": "KRA PIN",
            "type": "text",
            "required": true,
            "helper": "For payroll PAYE processing",
            "placeholder": "For payroll PAYE processing"
          },
          {
            "name": "nssf_number",
            "label": "NSSF number",
            "type": "text",
            "required": true,
            "helper": "NSSF membership number",
            "placeholder": "NSSF membership number"
          },
          {
            "name": "nhif_number",
            "label": "SHA number",
            "type": "text",
            "required": true,
            "helper": "SHA membership number",
            "placeholder": "SHA membership number"
          },
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Department where employee works"
          },
          {
            "name": "job_title",
            "label": "Job title",
            "type": "text",
            "required": true,
            "helper": "Position title",
            "placeholder": "Position title"
          },
          {
            "name": "cadre",
            "label": "Cadre",
            "type": "select",
            "required": false,
            "helper": "Kenya health cadre - Physician | Nurse | Pharmacist | etc.",
            "options": [
              "Kenya health cadre — Physician",
              "Nurse",
              "Pharmacist",
              "etc."
            ]
          },
          {
            "name": "professional_registration_number",
            "label": "Professional registration number",
            "type": "text",
            "required": false,
            "helper": "Board registration e.g. KMPDB, NCK, PPB",
            "placeholder": "Board registration e.g. KMPDB, NCK, PPB"
          },
          {
            "name": "reg_expiry_date",
            "label": "Reg expiry date",
            "type": "date",
            "required": false,
            "helper": "Registration expiry - system sends renewal alerts"
          },
          {
            "name": "hire_date",
            "label": "Hire date",
            "type": "date",
            "required": true,
            "helper": "Employment start date"
          },
          {
            "name": "contract_type",
            "label": "Contract type",
            "type": "select",
            "required": true,
            "helper": "Permanent | Contract | Locum | Intern | Volunteer",
            "options": [
              "Permanent",
              "Contract",
              "Locum",
              "Intern",
              "Volunteer"
            ]
          },
          {
            "name": "basic_salary_kes",
            "label": "Basic salary (KES)",
            "type": "number",
            "required": true,
            "helper": "Monthly basic salary",
            "placeholder": "Monthly basic salary"
          },
          {
            "name": "bank_name",
            "label": "Bank name",
            "type": "select",
            "required": true,
            "helper": "Bank for salary payment"
          },
          {
            "name": "bank_account_number",
            "label": "Bank account number",
            "type": "text",
            "required": true,
            "helper": "Salary account number - encrypted",
            "placeholder": "Salary account number - encrypted"
          },
          {
            "name": "staff_photo",
            "label": "Staff photo",
            "type": "file",
            "required": false,
            "helper": "Employee photo"
          }
        ]
      },
      {
        "name": "Leave Application Form",
        "description": "Capture leave application details.",
        "fields": [
          {
            "name": "employee",
            "label": "Employee",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from login",
            "placeholder": "Auto-filled from login"
          },
          {
            "name": "leave_type",
            "label": "Leave type",
            "type": "select",
            "required": true,
            "helper": "Annual | Sick | Maternity | Paternity | Compassionate | Study | Unpaid",
            "options": [
              "Annual",
              "Sick",
              "Maternity",
              "Paternity",
              "Compassionate",
              "Study",
              "Unpaid"
            ]
          },
          {
            "name": "start_date",
            "label": "Start date",
            "type": "date",
            "required": true,
            "helper": "Leave start date"
          },
          {
            "name": "end_date",
            "label": "End date",
            "type": "date",
            "required": true,
            "helper": "Leave end date"
          },
          {
            "name": "number_of_days",
            "label": "Number of days",
            "type": "text",
            "required": true,
            "helper": "Calculated excluding weekends and public holidays",
            "placeholder": "Calculated excluding weekends and public holidays"
          },
          {
            "name": "reason",
            "label": "Reason",
            "type": "textarea",
            "required": false,
            "helper": "Reason for leave request"
          },
          {
            "name": "attach_supporting_document",
            "label": "Attach supporting document",
            "type": "text",
            "required": false,
            "helper": "Medical certificate if sick leave",
            "placeholder": "Medical certificate if sick leave"
          }
        ]
      },
      {
        "name": "Payroll Processing Form",
        "description": "Capture payroll processing details.",
        "fields": [
          {
            "name": "payroll_month",
            "label": "Payroll month",
            "type": "text",
            "required": true,
            "helper": "Month being processed",
            "placeholder": "Month being processed"
          },
          {
            "name": "basic_salary",
            "label": "Basic salary",
            "type": "text",
            "required": true,
            "helper": "From employment contract",
            "placeholder": "From employment contract"
          },
          {
            "name": "allowances",
            "label": "Allowances",
            "type": "text",
            "required": false,
            "helper": "House, transport, call, hardship - per contract",
            "placeholder": "House, transport, call, hardship - per contract"
          },
          {
            "name": "gross_pay",
            "label": "Gross pay",
            "type": "text",
            "required": true,
            "helper": "Basic + all allowances",
            "placeholder": "Basic + all allowances"
          },
          {
            "name": "paye_tax",
            "label": "PAYE tax",
            "type": "text",
            "required": true,
            "helper": "Auto-calculated per KRA tax bands",
            "placeholder": "Auto-calculated per KRA tax bands"
          },
          {
            "name": "nssf_deduction",
            "label": "NSSF deduction",
            "type": "text",
            "required": true,
            "helper": "Statutory NSSF contribution",
            "placeholder": "Statutory NSSF contribution"
          },
          {
            "name": "nhif_deduction",
            "label": "SHA deduction",
            "type": "text",
            "required": true,
            "helper": "Statutory SHA contribution",
            "placeholder": "Statutory SHA contribution"
          },
          {
            "name": "other_deductions",
            "label": "Other deductions",
            "type": "text",
            "required": false,
            "helper": "Salary advance, loan repayment, fines",
            "placeholder": "Salary advance, loan repayment, fines"
          },
          {
            "name": "net_pay",
            "label": "Net pay",
            "type": "text",
            "required": true,
            "helper": "Gross minus all deductions",
            "placeholder": "Gross minus all deductions"
          }
        ]
      },
      {
        "name": "Performance Review Form",
        "description": "Capture performance review details.",
        "fields": [
          {
            "name": "employee",
            "label": "Employee",
            "type": "select",
            "required": true,
            "helper": "Employee being reviewed"
          },
          {
            "name": "review_period",
            "label": "Review period",
            "type": "select",
            "required": true,
            "helper": "H1 | H2 | Annual - half-year or annual",
            "options": [
              "H1",
              "H2",
              "Annual — half-year or annual"
            ]
          },
          {
            "name": "kpi_scores",
            "label": "KPI scores",
            "type": "text",
            "required": true,
            "helper": "Per KPI: name, target, achieved, score",
            "placeholder": "Per KPI: name, target, achieved, score"
          },
          {
            "name": "overall_rating",
            "label": "Overall rating",
            "type": "select",
            "required": true,
            "helper": "Outstanding | Exceeds expectations | Meets | Below | Unsatisfactory",
            "options": [
              "Outstanding",
              "Exceeds expectations",
              "Meets",
              "Below",
              "Unsatisfactory"
            ]
          },
          {
            "name": "strengths",
            "label": "Strengths",
            "type": "textarea",
            "required": true,
            "helper": "Key achievements and strengths"
          },
          {
            "name": "areas_for_improvement",
            "label": "Areas for improvement",
            "type": "textarea",
            "required": true,
            "helper": "Development areas identified"
          },
          {
            "name": "development_plan",
            "label": "Development plan",
            "type": "textarea",
            "required": true,
            "helper": "Agreed training and development actions"
          },
          {
            "name": "employee_comments",
            "label": "Employee comments",
            "type": "textarea",
            "required": false,
            "helper": "Employee response to the review"
          }
        ]
      },
      {
        "name": "Disciplinary Form",
        "description": "Capture disciplinary details.",
        "fields": [
          {
            "name": "employee",
            "label": "Employee",
            "type": "select",
            "required": true,
            "helper": "Subject of disciplinary action"
          },
          {
            "name": "incident_date",
            "label": "Incident date",
            "type": "date",
            "required": true,
            "helper": "Date misconduct occurred"
          },
          {
            "name": "category",
            "label": "Category",
            "type": "select",
            "required": true,
            "helper": "Misconduct | Gross misconduct | Absenteeism | Negligence | Substance abuse",
            "options": [
              "Misconduct",
              "Gross misconduct",
              "Absenteeism",
              "Negligence",
              "Substance abuse"
            ]
          },
          {
            "name": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "helper": "Detailed account of the misconduct"
          },
          {
            "name": "witnesses",
            "label": "Witnesses",
            "type": "text",
            "required": false,
            "helper": "Names of witnesses to the incident",
            "placeholder": "Names of witnesses to the incident"
          },
          {
            "name": "hearing_date",
            "label": "Hearing date",
            "type": "date",
            "required": false,
            "helper": "Date of disciplinary hearing"
          },
          {
            "name": "hearing_outcome",
            "label": "Hearing outcome",
            "type": "textarea",
            "required": false,
            "helper": "Findings and decision"
          },
          {
            "name": "sanction",
            "label": "Sanction",
            "type": "select",
            "required": false,
            "helper": "Verbal warning | Written warning | Final warning | Suspension | Dismissal",
            "options": [
              "Verbal warning",
              "Written warning",
              "Final warning",
              "Suspension",
              "Dismissal"
            ]
          }
        ]
      }
    ]
  },
  "doctors": {
    "forms": [
      {
        "name": "Doctor Profile Form",
        "description": "Capture doctor profile details.",
        "fields": [
          {
            "name": "staff_member",
            "label": "Staff member",
            "type": "text",
            "required": true,
            "helper": "Linked from HR staff record",
            "placeholder": "Linked from HR staff record"
          },
          {
            "name": "specialisation",
            "label": "Specialisation",
            "type": "text",
            "required": true,
            "helper": "Primary and secondary specialties",
            "placeholder": "Primary and secondary specialties"
          },
          {
            "name": "kmpdb_licence_number",
            "label": "KMPDB licence number",
            "type": "text",
            "required": true,
            "helper": "Kenya Medical Practitioners Board registration",
            "placeholder": "Kenya Medical Practitioners Board registration"
          },
          {
            "name": "licence_expiry_date",
            "label": "Licence expiry date",
            "type": "date",
            "required": true,
            "helper": "Sends alert 90 and 30 days before expiry"
          },
          {
            "name": "sub_specialties",
            "label": "Sub-specialties",
            "type": "text",
            "required": false,
            "helper": "Additional sub-specialty qualifications",
            "placeholder": "Additional sub-specialty qualifications"
          },
          {
            "name": "consultation_types",
            "label": "Consultation types",
            "type": "text",
            "required": true,
            "helper": "OPD | Inpatient | Emergency | Telemedicine | Procedure",
            "placeholder": "OPD | Inpatient | Emergency | Telemedicine | Procedure"
          },
          {
            "name": "department_assignment",
            "label": "Department assignment",
            "type": "select",
            "required": true,
            "helper": "Primary department"
          },
          {
            "name": "on_call_eligible",
            "label": "On-call eligible",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if doctor does on-call duties"
          }
        ]
      },
      {
        "name": "On-Call Schedule Form",
        "description": "Capture on-call schedule details.",
        "fields": [
          {
            "name": "doctor",
            "label": "Doctor",
            "type": "select",
            "required": true,
            "helper": "Doctor being scheduled"
          },
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Specialty on-call"
          },
          {
            "name": "call_date",
            "label": "Call date",
            "type": "date",
            "required": true,
            "helper": "Date of on-call duty"
          },
          {
            "name": "call_type",
            "label": "Call type",
            "type": "select",
            "required": true,
            "helper": "Primary | Backup | Consultant",
            "options": [
              "Primary",
              "Backup",
              "Consultant"
            ]
          },
          {
            "name": "start_time",
            "label": "Start time",
            "type": "time",
            "required": true,
            "helper": "On-call start time"
          },
          {
            "name": "end_time",
            "label": "End time",
            "type": "time",
            "required": true,
            "helper": "On-call end time"
          },
          {
            "name": "contact_phone",
            "label": "Contact phone",
            "type": "tel",
            "required": true,
            "helper": "Phone number to call during this period",
            "placeholder": "Phone number to call during this period"
          }
        ]
      }
    ]
  },
  "facility": {
    "forms": [
      {
        "name": "Asset Registration Form",
        "description": "Capture asset registration details.",
        "fields": [
          {
            "name": "asset_name",
            "label": "Asset name",
            "type": "text",
            "required": true,
            "helper": "Equipment or furniture name",
            "placeholder": "Equipment or furniture name"
          },
          {
            "name": "asset_category",
            "label": "Asset category",
            "type": "select",
            "required": true,
            "helper": "Biomedical | Furniture | IT | Vehicle | Linen | Other",
            "options": [
              "Biomedical",
              "Furniture",
              "IT",
              "Vehicle",
              "Linen",
              "Other"
            ]
          },
          {
            "name": "manufacturer",
            "label": "Manufacturer",
            "type": "text",
            "required": false,
            "helper": "Manufacturer name",
            "placeholder": "Manufacturer name"
          },
          {
            "name": "model",
            "label": "Model",
            "type": "text",
            "required": false,
            "helper": "Model number or name",
            "placeholder": "Model number or name"
          },
          {
            "name": "serial_number",
            "label": "Serial number",
            "type": "text",
            "required": false,
            "helper": "Manufacturer serial number",
            "placeholder": "Manufacturer serial number"
          },
          {
            "name": "year_purchased",
            "label": "Year purchased",
            "type": "number",
            "required": true,
            "helper": "Year of purchase",
            "placeholder": "Year of purchase"
          },
          {
            "name": "purchase_cost_kes",
            "label": "Purchase cost (KES)",
            "type": "number",
            "required": true,
            "helper": "Purchase price",
            "placeholder": "Purchase price"
          },
          {
            "name": "department_location",
            "label": "Department location",
            "type": "select",
            "required": true,
            "helper": "Department where asset is located"
          },
          {
            "name": "room",
            "label": "Room",
            "type": "text",
            "required": false,
            "helper": "Specific room or bay",
            "placeholder": "Specific room or bay"
          },
          {
            "name": "warranty_expiry",
            "label": "Warranty expiry",
            "type": "date",
            "required": false,
            "helper": "Warranty expiry date"
          },
          {
            "name": "service_interval_months",
            "label": "Service interval (months)",
            "type": "number",
            "required": true,
            "helper": "Frequency of preventive maintenance",
            "placeholder": "Frequency of preventive maintenance"
          }
        ]
      },
      {
        "name": "Maintenance Request Form",
        "description": "Capture maintenance request details.",
        "fields": [
          {
            "name": "asset",
            "label": "Asset",
            "type": "select",
            "required": false,
            "helper": "Asset needing maintenance - or describe if not in system"
          },
          {
            "name": "issue_description",
            "label": "Issue description",
            "type": "textarea",
            "required": true,
            "helper": "Detailed description of the problem"
          },
          {
            "name": "priority",
            "label": "Priority",
            "type": "select",
            "required": true,
            "helper": "Low | Medium | High | Critical",
            "options": [
              "Low",
              "Medium",
              "High",
              "Critical"
            ]
          },
          {
            "name": "requested_by",
            "label": "Requested by",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - logged in staff member",
            "placeholder": "Auto-filled - logged in staff member"
          },
          {
            "name": "department",
            "label": "Department",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from user profile",
            "placeholder": "Auto-filled from user profile"
          }
        ]
      },
      {
        "name": "Maintenance Record Form",
        "description": "Capture maintenance record details.",
        "fields": [
          {
            "name": "asset",
            "label": "Asset",
            "type": "text",
            "required": true,
            "helper": "Asset serviced",
            "placeholder": "Asset serviced"
          },
          {
            "name": "maintenance_type",
            "label": "Maintenance type",
            "type": "select",
            "required": true,
            "helper": "Preventive | Corrective | Calibration | Inspection",
            "options": [
              "Preventive",
              "Corrective",
              "Calibration",
              "Inspection"
            ]
          },
          {
            "name": "work_performed",
            "label": "Work performed",
            "type": "textarea",
            "required": true,
            "helper": "Detailed description of work done"
          },
          {
            "name": "parts_replaced",
            "label": "Parts replaced",
            "type": "text",
            "required": false,
            "helper": "Parts or consumables replaced with cost",
            "placeholder": "Parts or consumables replaced with cost"
          },
          {
            "name": "service_provider",
            "label": "Service provider",
            "type": "text",
            "required": true,
            "helper": "Internal team or external company",
            "placeholder": "Internal team or external company"
          },
          {
            "name": "downtime_hours",
            "label": "Downtime (hours)",
            "type": "number",
            "required": false,
            "helper": "How long asset was out of service",
            "placeholder": "How long asset was out of service"
          },
          {
            "name": "cost_kes",
            "label": "Cost (KES)",
            "type": "number",
            "required": false,
            "helper": "Total maintenance cost",
            "placeholder": "Total maintenance cost"
          },
          {
            "name": "next_service_date",
            "label": "Next service date",
            "type": "date",
            "required": true,
            "helper": "Next scheduled maintenance"
          }
        ]
      }
    ]
  },
  "accounting": {
    "forms": [
      {
        "name": "Journal Entry Form",
        "description": "Capture journal entry details.",
        "fields": [
          {
            "name": "entry_date",
            "label": "Entry date",
            "type": "date",
            "required": true,
            "helper": "Accounting date - must be within open period"
          },
          {
            "name": "description",
            "label": "Description",
            "type": "text",
            "required": true,
            "helper": "What this journal records",
            "placeholder": "What this journal records"
          },
          {
            "name": "source_module",
            "label": "Source module",
            "type": "select",
            "required": true,
            "helper": "Billing | Payroll | Inventory | Manual",
            "options": [
              "Billing",
              "Payroll",
              "Inventory",
              "Manual"
            ]
          },
          {
            "name": "debit_account",
            "label": "Debit account",
            "type": "text",
            "required": true,
            "helper": "Account being debited",
            "placeholder": "Account being debited"
          },
          {
            "name": "debit_amount_kes",
            "label": "Debit amount (KES)",
            "type": "number",
            "required": true,
            "helper": "Debit amount",
            "placeholder": "Debit amount"
          },
          {
            "name": "credit_account",
            "label": "Credit account",
            "type": "text",
            "required": true,
            "helper": "Account being credited",
            "placeholder": "Account being credited"
          },
          {
            "name": "credit_amount_kes",
            "label": "Credit amount (KES)",
            "type": "number",
            "required": true,
            "helper": "Credit amount - must equal debit",
            "placeholder": "Credit amount - must equal debit"
          },
          {
            "name": "cost_centre",
            "label": "Cost centre",
            "type": "select",
            "required": false,
            "helper": "Departmental cost centre for allocation"
          }
        ]
      },
      {
        "name": "Chart of Accounts Form",
        "description": "Capture chart of accounts details.",
        "fields": [
          {
            "name": "account_code",
            "label": "Account code",
            "type": "text",
            "required": true,
            "helper": "Unique account code e.g. 1100, 4200",
            "placeholder": "Unique account code e.g. 1100, 4200"
          },
          {
            "name": "account_name",
            "label": "Account name",
            "type": "text",
            "required": true,
            "helper": "Descriptive account name",
            "placeholder": "Descriptive account name"
          },
          {
            "name": "account_type",
            "label": "Account type",
            "type": "select",
            "required": true,
            "helper": "Asset | Liability | Equity | Revenue | Expense",
            "options": [
              "Asset",
              "Liability",
              "Equity",
              "Revenue",
              "Expense"
            ]
          },
          {
            "name": "sub_type",
            "label": "Sub-type",
            "type": "select",
            "required": false,
            "helper": "Current asset | Fixed asset | Current liability | etc.",
            "options": [
              "Current asset",
              "Fixed asset",
              "Current liability",
              "etc."
            ]
          },
          {
            "name": "parent_account",
            "label": "Parent account",
            "type": "select",
            "required": false,
            "helper": "Parent account for hierarchical reporting"
          },
          {
            "name": "normal_balance",
            "label": "Normal balance",
            "type": "select",
            "required": true,
            "helper": "Debit | Credit",
            "options": [
              "Debit",
              "Credit"
            ]
          }
        ]
      },
      {
        "name": "Bank Reconciliation Form",
        "description": "Capture bank reconciliation details.",
        "fields": [
          {
            "name": "bank_account",
            "label": "Bank account",
            "type": "select",
            "required": true,
            "helper": "Account being reconciled"
          },
          {
            "name": "statement_date",
            "label": "Statement date",
            "type": "date",
            "required": true,
            "helper": "Date of bank statement"
          },
          {
            "name": "statement_closing_balance_kes",
            "label": "Statement closing balance (KES)",
            "type": "number",
            "required": true,
            "helper": "Balance per bank statement",
            "placeholder": "Balance per bank statement"
          },
          {
            "name": "book_closing_balance_kes",
            "label": "Book closing balance (KES)",
            "type": "text",
            "required": true,
            "helper": "Balance per general ledger",
            "placeholder": "Balance per general ledger"
          },
          {
            "name": "outstanding_deposits",
            "label": "Outstanding deposits",
            "type": "number",
            "required": true,
            "helper": "Deposits recorded in books but not on statement",
            "placeholder": "Deposits recorded in books but not on statement"
          },
          {
            "name": "outstanding_cheques",
            "label": "Outstanding cheques",
            "type": "number",
            "required": true,
            "helper": "Cheques issued but not yet cleared",
            "placeholder": "Cheques issued but not yet cleared"
          },
          {
            "name": "bank_errors",
            "label": "Bank errors",
            "type": "number",
            "required": false,
            "helper": "Errors on bank statement",
            "placeholder": "Errors on bank statement"
          },
          {
            "name": "book_errors",
            "label": "Book errors",
            "type": "number",
            "required": false,
            "helper": "Errors in books requiring correction",
            "placeholder": "Errors in books requiring correction"
          }
        ]
      }
    ]
  },
  "cost-accounting": {
    "forms": [
      {
        "name": "Cost Centre Setup Form",
        "description": "Capture cost centre setup details.",
        "fields": [
          {
            "name": "cost_centre_code",
            "label": "Cost centre code",
            "type": "text",
            "required": true,
            "helper": "Unique code e.g. CC-OPD, CC-LAB",
            "placeholder": "Unique code e.g. CC-OPD, CC-LAB"
          },
          {
            "name": "cost_centre_name",
            "label": "Cost centre name",
            "type": "text",
            "required": true,
            "helper": "Name of cost centre",
            "placeholder": "Name of cost centre"
          },
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Linked department"
          },
          {
            "name": "annual_budget_kes",
            "label": "Annual budget (KES)",
            "type": "number",
            "required": true,
            "helper": "Annual budget allocation",
            "placeholder": "Annual budget allocation"
          },
          {
            "name": "is_revenue_centre",
            "label": "Is revenue centre",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if cost centre also generates revenue"
          }
        ]
      },
      {
        "name": "Cost Allocation Form",
        "description": "Capture cost allocation details.",
        "fields": [
          {
            "name": "allocation_period",
            "label": "Allocation period",
            "type": "select",
            "required": true,
            "helper": "Month being allocated"
          },
          {
            "name": "from_cost_centre",
            "label": "From cost centre",
            "type": "select",
            "required": true,
            "helper": "Support department distributing costs"
          },
          {
            "name": "to_cost_centre",
            "label": "To cost centre",
            "type": "select",
            "required": true,
            "helper": "Clinical department receiving overhead"
          },
          {
            "name": "allocation_method",
            "label": "Allocation method",
            "type": "select",
            "required": true,
            "helper": "Floor area | Headcount | Revenue | Usage | Direct | Step-down",
            "options": [
              "Floor area",
              "Headcount",
              "Revenue",
              "Usage",
              "Direct",
              "Step-down"
            ]
          },
          {
            "name": "allocation_basis_value",
            "label": "Allocation basis value",
            "type": "number",
            "required": true,
            "helper": "The driver e.g. 450 sqm floor area",
            "placeholder": "The driver e.g. 450 sqm floor area"
          },
          {
            "name": "amount_to_allocate_kes",
            "label": "Amount to allocate (KES)",
            "type": "number",
            "required": true,
            "helper": "Total amount to distribute",
            "placeholder": "Total amount to distribute"
          }
        ]
      }
    ]
  },
  "revenue": {
    "forms": [
      {
        "name": "Denial Management Form",
        "description": "Capture denial management details.",
        "fields": [
          {
            "name": "denied_claim",
            "label": "Denied claim",
            "type": "text",
            "required": true,
            "helper": "Reference to denied claim",
            "placeholder": "Reference to denied claim"
          },
          {
            "name": "denial_category",
            "label": "Denial category",
            "type": "select",
            "required": true,
            "helper": "Eligibility | Pre-auth | Medical necessity | Coding | Timely filing | Documentation",
            "options": [
              "Eligibility",
              "Pre-auth",
              "Medical necessity",
              "Coding",
              "Timely filing",
              "Documentation"
            ]
          },
          {
            "name": "denial_amount_kes",
            "label": "Denial amount (KES)",
            "type": "text",
            "required": true,
            "helper": "Amount denied",
            "placeholder": "Amount denied"
          },
          {
            "name": "appeal_decision",
            "label": "Appeal decision",
            "type": "select",
            "required": true,
            "helper": "Will appeal | No appeal",
            "options": [
              "Will appeal",
              "No appeal"
            ]
          },
          {
            "name": "appeal_grounds",
            "label": "Appeal grounds",
            "type": "textarea",
            "required": true,
            "helper": "Clinical and administrative basis for appeal"
          },
          {
            "name": "action_taken",
            "label": "Action taken",
            "type": "select",
            "required": true,
            "helper": "Appealed | Rebilled | Written off | Patient liability",
            "options": [
              "Appealed",
              "Rebilled",
              "Written off",
              "Patient liability"
            ]
          }
        ]
      },
      {
        "name": "Write-off Authorisation Form",
        "description": "Capture write-off authorisation details.",
        "fields": [
          {
            "name": "invoice",
            "label": "Invoice",
            "type": "text",
            "required": true,
            "helper": "Invoice being written off",
            "placeholder": "Invoice being written off"
          },
          {
            "name": "outstanding_amount_kes",
            "label": "Outstanding amount (KES)",
            "type": "text",
            "required": true,
            "helper": "Amount to be written off",
            "placeholder": "Amount to be written off"
          },
          {
            "name": "write_off_reason",
            "label": "Write-off reason",
            "type": "select",
            "required": true,
            "helper": "Bad debt | Charity | Management decision | Insolvency | Error",
            "options": [
              "Bad debt",
              "Charity",
              "Management decision",
              "Insolvency",
              "Error"
            ]
          },
          {
            "name": "authorised_by",
            "label": "Authorised by",
            "type": "select",
            "required": true,
            "helper": "Finance director or CEO"
          },
          {
            "name": "notes",
            "label": "Notes",
            "type": "textarea",
            "required": true,
            "helper": "Detailed justification for write-off"
          }
        ]
      }
    ]
  },
  "reporting": {
    "forms": [
      {
        "name": "Custom Report Builder Form",
        "description": "Capture custom report builder details.",
        "fields": [
          {
            "name": "report_name",
            "label": "Report name",
            "type": "text",
            "required": true,
            "helper": "Name for this report template",
            "placeholder": "Name for this report template"
          },
          {
            "name": "report_category",
            "label": "Report category",
            "type": "select",
            "required": true,
            "helper": "Clinical | Financial | HR | Quality | MOH Statutory | Management",
            "options": [
              "Clinical",
              "Financial",
              "HR",
              "Quality",
              "MOH Statutory",
              "Management"
            ]
          },
          {
            "name": "data_source_modules",
            "label": "Data source modules",
            "type": "text",
            "required": true,
            "helper": "Select modules to pull data from",
            "placeholder": "Select modules to pull data from"
          },
          {
            "name": "fields_to_include",
            "label": "Fields to include",
            "type": "text",
            "required": true,
            "helper": "Select specific fields from chosen modules",
            "placeholder": "Select specific fields from chosen modules"
          },
          {
            "name": "filter_criteria",
            "label": "Filter criteria",
            "type": "text",
            "required": false,
            "helper": "Date range, department, doctor, diagnosis code etc.",
            "placeholder": "Date range, department, doctor, diagnosis code etc."
          },
          {
            "name": "grouping",
            "label": "Grouping",
            "type": "select",
            "required": false,
            "helper": "Group results by: Department | Doctor | Date | Diagnosis",
            "options": [
              "Group results by: Department",
              "Doctor",
              "Date",
              "Diagnosis"
            ]
          },
          {
            "name": "aggregations",
            "label": "Aggregations",
            "type": "text",
            "required": false,
            "helper": "Count | Sum | Average | Min | Max",
            "placeholder": "Count | Sum | Average | Min | Max"
          },
          {
            "name": "output_format",
            "label": "Output format",
            "type": "select",
            "required": true,
            "helper": "PDF | Excel | CSV | Chart",
            "options": [
              "PDF",
              "Excel",
              "CSV",
              "Chart"
            ]
          },
          {
            "name": "schedule",
            "label": "Schedule",
            "type": "select",
            "required": false,
            "helper": "One-time | Daily | Weekly | Monthly",
            "options": [
              "One-time",
              "Daily",
              "Weekly",
              "Monthly"
            ]
          }
        ]
      },
      {
        "name": "Report Run Parameters Form",
        "description": "Capture report run parameters details.",
        "fields": [
          {
            "name": "report_template",
            "label": "Report template",
            "type": "text",
            "required": true,
            "helper": "Selected report",
            "placeholder": "Selected report"
          },
          {
            "name": "date_from",
            "label": "Date from",
            "type": "date",
            "required": true,
            "helper": "Start date for report data"
          },
          {
            "name": "date_to",
            "label": "Date to",
            "type": "date",
            "required": true,
            "helper": "End date for report data"
          },
          {
            "name": "department_filter",
            "label": "Department filter",
            "type": "select",
            "required": false,
            "helper": "Filter to specific department - blank for all"
          },
          {
            "name": "doctor_filter",
            "label": "Doctor filter",
            "type": "select",
            "required": false,
            "helper": "Filter to specific doctor - blank for all"
          },
          {
            "name": "output_format",
            "label": "Output format",
            "type": "select",
            "required": true,
            "helper": "PDF | Excel | CSV",
            "options": [
              "PDF",
              "Excel",
              "CSV"
            ]
          }
        ]
      }
    ]
  },
  "security": {
    "forms": [
      {
        "name": "User Account Creation Form",
        "description": "Capture user account creation details.",
        "fields": [
          {
            "name": "staff_member",
            "label": "Staff member",
            "type": "select",
            "required": true,
            "helper": "Link to HR staff record"
          },
          {
            "name": "username",
            "label": "Username",
            "type": "text",
            "required": true,
            "helper": "Unique login username - auto-suggested from name",
            "placeholder": "Unique login username - auto-suggested from name"
          },
          {
            "name": "email",
            "label": "Email",
            "type": "email",
            "required": true,
            "helper": "Work email for notifications and MFA",
            "placeholder": "Work email for notifications and MFA"
          },
          {
            "name": "primary_role",
            "label": "Primary role",
            "type": "select",
            "required": true,
            "helper": "Select from defined roles"
          },
          {
            "name": "additional_roles",
            "label": "Additional roles",
            "type": "text",
            "required": false,
            "helper": "Supplementary module-level permissions",
            "placeholder": "Supplementary module-level permissions"
          },
          {
            "name": "mfa_required",
            "label": "MFA required",
            "type": "checkbox",
            "required": true,
            "helper": "Tick to enforce MFA - mandatory for clinical roles"
          },
          {
            "name": "shift_start",
            "label": "Shift start",
            "type": "time",
            "required": false,
            "helper": "For time-based access control"
          },
          {
            "name": "shift_end",
            "label": "Shift end",
            "type": "time",
            "required": false,
            "helper": "System denies login outside shift hours"
          }
        ]
      },
      {
        "name": "Role Configuration Form",
        "description": "Capture role configuration details.",
        "fields": [
          {
            "name": "role_name",
            "label": "Role name",
            "type": "text",
            "required": true,
            "helper": "Role identifier e.g. PHARMACIST, BILLING_OFFICER",
            "placeholder": "Role identifier e.g. PHARMACIST, BILLING_OFFICER"
          },
          {
            "name": "display_name",
            "label": "Display name",
            "type": "text",
            "required": true,
            "helper": "Human-readable label",
            "placeholder": "Human-readable label"
          },
          {
            "name": "is_clinical",
            "label": "Is clinical",
            "type": "checkbox",
            "required": true,
            "helper": "Tick if role accesses clinical data"
          },
          {
            "name": "module_permissions",
            "label": "Module permissions",
            "type": "text",
            "required": true,
            "helper": "Per module: Read | Create | Update | Delete | Approve | Export",
            "placeholder": "Per module: Read | Create | Update | Delete | Approve | Export"
          }
        ]
      },
      {
        "name": "Break-Glass Access Form",
        "description": "Capture break-glass access details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Patient whose records need emergency access",
            "placeholder": "Patient whose records need emergency access"
          },
          {
            "name": "reason",
            "label": "Reason",
            "type": "select",
            "required": true,
            "helper": "Emergency treatment | Life-threatening situation | Legal requirement",
            "options": [
              "Emergency treatment",
              "Life-threatening situation",
              "Legal requirement"
            ]
          },
          {
            "name": "justification",
            "label": "Justification",
            "type": "textarea",
            "required": true,
            "helper": "Detailed clinical justification - mandatory"
          },
          {
            "name": "supervisor_notification",
            "label": "Supervisor notification",
            "type": "checkbox",
            "required": true,
            "helper": "Tick to automatically notify supervisor of break-glass access"
          }
        ]
      }
    ]
  },
  "telemedicine": {
    "forms": [
      {
        "name": "Telemedicine Session Booking Form",
        "description": "Capture telemedicine session booking details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Patient MRN or search by name",
            "placeholder": "Patient MRN or search by name"
          },
          {
            "name": "doctor",
            "label": "Doctor",
            "type": "select",
            "required": true,
            "helper": "Doctor for the telemedicine session"
          },
          {
            "name": "session_type",
            "label": "Session type",
            "type": "select",
            "required": true,
            "helper": "New consultation | Follow-up | Specialist referral",
            "options": [
              "New consultation",
              "Follow-up",
              "Specialist referral"
            ]
          },
          {
            "name": "date_and_time",
            "label": "Date and time",
            "type": "text",
            "required": true,
            "helper": "From available telemedicine slots",
            "placeholder": "From available telemedicine slots"
          },
          {
            "name": "chief_complaint",
            "label": "Chief complaint",
            "type": "text",
            "required": true,
            "helper": "Reason for virtual consultation",
            "placeholder": "Reason for virtual consultation"
          },
          {
            "name": "patient_device",
            "label": "Patient device",
            "type": "select",
            "required": false,
            "helper": "Web | iOS | Android - for technical support",
            "options": [
              "Web",
              "iOS",
              "Android — for technical support"
            ]
          },
          {
            "name": "consent_for_telemedicine",
            "label": "Consent for telemedicine",
            "type": "checkbox",
            "required": true,
            "helper": "Patient consents to virtual consultation and recording policy"
          }
        ]
      },
      {
        "name": "Telemedicine Consultation Form",
        "description": "Capture telemedicine consultation details.",
        "fields": [
          {
            "name": "technical_check",
            "label": "Technical check",
            "type": "text",
            "required": true,
            "helper": "Audio OK | Video OK | Patient identity confirmed",
            "placeholder": "Audio OK | Video OK | Patient identity confirmed"
          },
          {
            "name": "session_notes",
            "label": "Session notes",
            "type": "textarea",
            "required": true,
            "helper": "Consultation notes - same fields as OPD consultation"
          },
          {
            "name": "diagnosis",
            "label": "Diagnosis",
            "type": "text",
            "required": true,
            "helper": "ICD-10 coded diagnosis",
            "placeholder": "ICD-10 coded diagnosis"
          },
          {
            "name": "management_plan",
            "label": "Management plan",
            "type": "textarea",
            "required": true,
            "helper": "Treatment plan including virtual prescriptions"
          },
          {
            "name": "prescription_issued",
            "label": "Prescription issued",
            "type": "checkbox",
            "required": false,
            "helper": "Tick to open digital prescription form"
          },
          {
            "name": "investigations_ordered",
            "label": "Investigations ordered",
            "type": "text",
            "required": false,
            "helper": "Tests to be done at nearest facility",
            "placeholder": "Tests to be done at nearest facility"
          },
          {
            "name": "follow_up",
            "label": "Follow-up",
            "type": "select",
            "required": true,
            "helper": "Telemedicine | Physical visit | No follow-up needed",
            "options": [
              "Telemedicine",
              "Physical visit",
              "No follow-up needed"
            ]
          },
          {
            "name": "referral_to_physical",
            "label": "Referral to physical",
            "type": "checkbox",
            "required": false,
            "helper": "Tick if physical attendance is needed"
          }
        ]
      }
    ]
  },
  "patient-portal": {
    "forms": [
      {
        "name": "Portal Account Registration Form",
        "description": "Capture portal account registration details.",
        "fields": [
          {
            "name": "mrn",
            "label": "MRN",
            "type": "text",
            "required": true,
            "helper": "Medical record number from facility registration",
            "placeholder": "Medical record number from facility registration"
          },
          {
            "name": "date_of_birth",
            "label": "Date of birth",
            "type": "date",
            "required": true,
            "helper": "Verified against hospital records"
          },
          {
            "name": "phone_number",
            "label": "Phone number",
            "type": "tel",
            "required": true,
            "helper": "Registered phone for OTP verification",
            "placeholder": "Registered phone for OTP verification"
          },
          {
            "name": "email_address",
            "label": "Email address",
            "type": "email",
            "required": true,
            "helper": "Login email",
            "placeholder": "Login email"
          },
          {
            "name": "create_password",
            "label": "Create password",
            "type": "password",
            "required": true,
            "helper": "Minimum 8 characters with complexity requirements"
          },
          {
            "name": "confirm_password",
            "label": "Confirm password",
            "type": "password",
            "required": true,
            "helper": "Must match password field"
          },
          {
            "name": "notification_preferences",
            "label": "Notification preferences",
            "type": "text",
            "required": false,
            "helper": "SMS | Email | WhatsApp - what to receive",
            "placeholder": "SMS | Email | WhatsApp - what to receive"
          }
        ]
      },
      {
        "name": "Appointment Booking (Portal)",
        "description": "Capture appointment booking (portal) details.",
        "fields": [
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Clinic or specialty",
            "options": [
              "OPD",
              "Dental",
              "Laboratory",
              "Radiology",
              "Maternity",
              "Paediatrics",
              "Physiotherapy"
            ]
          },
          {
            "name": "appointment_type",
            "label": "Appointment type",
            "type": "select",
            "required": true,
            "helper": "New | Follow-up | Telemedicine",
            "options": [
              "New",
              "Follow-up",
              "Telemedicine"
            ]
          },
          {
            "name": "preferred_date",
            "label": "Preferred date",
            "type": "date",
            "required": true,
            "helper": "Select from available calendar"
          },
          {
            "name": "available_slot",
            "label": "Available slot",
            "type": "select",
            "required": true,
            "helper": "Choose from doctor's available times",
            "options": ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]
          },
          {
            "name": "chief_complaint",
            "label": "Chief complaint",
            "type": "text",
            "required": true,
            "helper": "Reason for appointment",
            "placeholder": "Reason for appointment"
          },
          {
            "name": "insurance_to_use",
            "label": "Insurance to use",
            "type": "select",
            "required": false,
            "helper": "Active insurance scheme for this visit",
            "options": ["Self Pay", "SHA", "Private Insurance", "Corporate Cover"]
          }
        ]
      },
      {
        "name": "Patient Feedback Form (Portal)",
        "description": "Capture patient feedback form (portal) details.",
        "fields": [
          {
            "name": "visit_date",
            "label": "Visit date",
            "type": "date",
            "required": true,
            "helper": "Date of the visit being rated"
          },
          {
            "name": "overall_satisfaction",
            "label": "Overall satisfaction",
            "type": "text",
            "required": true,
            "helper": "1–5 star rating",
            "placeholder": "1–5 star rating"
          },
          {
            "name": "staff_attitude",
            "label": "Staff attitude",
            "type": "text",
            "required": false,
            "helper": "1–5 rating",
            "placeholder": "1–5 rating"
          },
          {
            "name": "cleanliness",
            "label": "Cleanliness",
            "type": "text",
            "required": false,
            "helper": "1–5 rating",
            "placeholder": "1–5 rating"
          },
          {
            "name": "wait_time",
            "label": "Wait time",
            "type": "text",
            "required": false,
            "helper": "1–5 rating",
            "placeholder": "1–5 rating"
          },
          {
            "name": "would_recommend",
            "label": "Would recommend",
            "type": "text",
            "required": true,
            "helper": "Net Promoter Score 0–10",
            "placeholder": "Net Promoter Score 0–10"
          },
          {
            "name": "comments",
            "label": "Comments",
            "type": "textarea",
            "required": false,
            "helper": "Free-text feedback"
          }
        ]
      }
    ]
  },
  "cdss": {
    "forms": [
      {
        "name": "CDSS Rule Configuration Form",
        "description": "Capture cdss rule configuration details.",
        "fields": [
          {
            "name": "rule_name",
            "label": "Rule name",
            "type": "text",
            "required": true,
            "helper": "Descriptive name for the clinical rule",
            "placeholder": "Descriptive name for the clinical rule"
          },
          {
            "name": "trigger_event",
            "label": "Trigger event",
            "type": "select",
            "required": true,
            "helper": "Prescribe | Order lab | Admit | Vital sign | Discharge | Result",
            "options": [
              "Prescribe",
              "Order lab",
              "Admit",
              "Vital sign",
              "Discharge",
              "Result"
            ]
          },
          {
            "name": "condition_logic",
            "label": "Condition logic",
            "type": "text",
            "required": true,
            "helper": "SQL or JSON rule expression evaluated against patient data",
            "placeholder": "SQL or JSON rule expression evaluated against patient data"
          },
          {
            "name": "alert_severity",
            "label": "Alert severity",
            "type": "select",
            "required": true,
            "helper": "Info | Warning | Critical | Hard stop",
            "options": [
              "Info",
              "Warning",
              "Critical",
              "Hard stop"
            ]
          },
          {
            "name": "alert_message",
            "label": "Alert message",
            "type": "textarea",
            "required": true,
            "helper": "Message shown to clinician when rule fires"
          },
          {
            "name": "can_be_overridden",
            "label": "Can be overridden",
            "type": "checkbox",
            "required": true,
            "helper": "Untick for hard stops that cannot be bypassed"
          },
          {
            "name": "override_requires_reason",
            "label": "Override requires reason",
            "type": "checkbox",
            "required": true,
            "helper": "Tick to require documented justification"
          },
          {
            "name": "guideline_source",
            "label": "Guideline source",
            "type": "text",
            "required": false,
            "helper": "Evidence source e.g. WHO, Kenya National Formulary 2023",
            "placeholder": "Evidence source e.g. WHO, Kenya National Formulary 2023"
          }
        ]
      },
      {
        "name": "CDSS Alert Override Form",
        "description": "Capture cdss alert override details.",
        "fields": [
          {
            "name": "alert",
            "label": "Alert",
            "type": "text",
            "required": true,
            "helper": "Rule that fired - shown in context",
            "placeholder": "Rule that fired - shown in context"
          },
          {
            "name": "override_reason",
            "label": "Override reason",
            "type": "select",
            "required": true,
            "helper": "Benefit outweighs risk | Alternative not available | Patient specific factor | Allergist reviewed",
            "options": [
              "Benefit outweighs risk",
              "Alternative not available",
              "Patient specific factor",
              "Allergist reviewed"
            ]
          },
          {
            "name": "clinical_justification",
            "label": "Clinical justification",
            "type": "textarea",
            "required": true,
            "helper": "Detailed clinical reasoning for overriding the alert"
          }
        ]
      }
    ]
  },
  "ai-analytics": {
    "forms": [
      {
        "name": "AI Alert Review Form",
        "description": "Capture ai alert review details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Patient flagged by AI model",
            "placeholder": "Patient flagged by AI model"
          },
          {
            "name": "risk_type",
            "label": "Risk type",
            "type": "text",
            "required": true,
            "helper": "Readmission | Deterioration | Sepsis | Revenue anomaly",
            "placeholder": "Readmission | Deterioration | Sepsis | Revenue anomaly"
          },
          {
            "name": "risk_score",
            "label": "Risk score",
            "type": "text",
            "required": true,
            "helper": "AI confidence score 0–100%",
            "placeholder": "AI confidence score 0–100%"
          },
          {
            "name": "contributing_factors",
            "label": "Contributing factors",
            "type": "text",
            "required": true,
            "helper": "Factors the AI used to determine risk",
            "placeholder": "Factors the AI used to determine risk"
          },
          {
            "name": "clinician_assessment",
            "label": "Clinician assessment",
            "type": "select",
            "required": true,
            "helper": "Agree - will act | Disagree - not at risk | Uncertain",
            "options": [
              "Agree — will act",
              "Disagree — not at risk",
              "Uncertain"
            ]
          },
          {
            "name": "action_planned",
            "label": "Action planned",
            "type": "textarea",
            "required": false,
            "helper": "What action will be taken in response to this alert"
          },
          {
            "name": "review_notes",
            "label": "Review notes",
            "type": "text",
            "required": false,
            "helper": "Any clinical notes on the AI prediction",
            "placeholder": "Any clinical notes on the AI prediction"
          }
        ]
      }
    ]
  },
  "executive": {
    "forms": [
      {
        "name": "Dashboard Widget Configuration Form",
        "description": "Capture dashboard widget configuration details.",
        "fields": [
          {
            "name": "widget_type",
            "label": "Widget type",
            "type": "select",
            "required": true,
            "helper": "KPI card | Line chart | Bar chart | Donut | Table | Alert list",
            "options": [
              "KPI card",
              "Line chart",
              "Bar chart",
              "Donut",
              "Table",
              "Alert list"
            ]
          },
          {
            "name": "widget_title",
            "label": "Widget title",
            "type": "text",
            "required": true,
            "helper": "Label displayed above the widget",
            "placeholder": "Label displayed above the widget"
          },
          {
            "name": "kpi_metrics",
            "label": "KPI metrics",
            "type": "text",
            "required": true,
            "helper": "Select KPIs to display",
            "placeholder": "Select KPIs to display"
          },
          {
            "name": "date_range",
            "label": "Date range",
            "type": "select",
            "required": true,
            "helper": "Today | Week | Month | Quarter | Year | Custom",
            "options": [
              "Today",
              "Week",
              "Month",
              "Quarter",
              "Year",
              "Custom"
            ]
          },
          {
            "name": "department_filter",
            "label": "Department filter",
            "type": "select",
            "required": false,
            "helper": "All | Specific department",
            "options": [
              "All",
              "Specific department"
            ]
          },
          {
            "name": "refresh_interval_sec",
            "label": "Refresh interval (sec)",
            "type": "number",
            "required": true,
            "helper": "Auto-refresh frequency - 0 for no auto-refresh",
            "placeholder": "Auto-refresh frequency - 0 for no auto-refresh"
          },
          {
            "name": "grid_position",
            "label": "Grid position",
            "type": "text",
            "required": true,
            "helper": "Drag to position on dashboard grid",
            "placeholder": "Drag to position on dashboard grid"
          }
        ]
      }
    ]
  },
  "blockchain": {
    "forms": [
      {
        "name": "Audit Query Form",
        "description": "Capture audit query details.",
        "fields": [
          {
            "name": "date_range",
            "label": "Date range",
            "type": "text",
            "required": true,
            "helper": "Period to search audit trail",
            "placeholder": "Period to search audit trail"
          },
          {
            "name": "user",
            "label": "User",
            "type": "select",
            "required": false,
            "helper": "Filter by specific user"
          },
          {
            "name": "module",
            "label": "Module",
            "type": "select",
            "required": false,
            "helper": "Filter by module"
          },
          {
            "name": "action_type",
            "label": "Action type",
            "type": "select",
            "required": false,
            "helper": "Insert | Update | Delete | Login | Export",
            "options": [
              "Insert",
              "Update",
              "Delete",
              "Login",
              "Export"
            ]
          },
          {
            "name": "record_id",
            "label": "Record ID",
            "type": "text",
            "required": false,
            "helper": "Specific record to trace all changes",
            "placeholder": "Specific record to trace all changes"
          },
          {
            "name": "patient_mrn",
            "label": "Patient MRN",
            "type": "text",
            "required": false,
            "helper": "All actions on this patient's records",
            "placeholder": "All actions on this patient's records"
          }
        ]
      },
      {
        "name": "Chain Integrity Verification Form",
        "description": "Capture chain integrity verification details.",
        "fields": [
          {
            "name": "from_entry_id",
            "label": "From entry ID",
            "type": "number",
            "required": true,
            "helper": "Start of chain to verify",
            "placeholder": "Start of chain to verify"
          },
          {
            "name": "to_entry_id",
            "label": "To entry ID",
            "type": "number",
            "required": true,
            "helper": "End of chain to verify",
            "placeholder": "End of chain to verify"
          },
          {
            "name": "verification_result",
            "label": "Verification result",
            "type": "text",
            "required": true,
            "helper": "Pass - chain intact | Fail - tampering detected",
            "placeholder": "Pass - chain intact | Fail - tampering detected"
          }
        ]
      }
    ]
  },
  "ict": {
    "forms": [
      {
        "name": "Security Incident Report Form",
        "description": "Capture security incident report details.",
        "fields": [
          {
            "name": "incident_type",
            "label": "Incident type",
            "type": "select",
            "required": true,
            "helper": "Unauthorized access | Malware | Data breach | Phishing | Ransomware | Physical | DDoS",
            "options": [
              "Unauthorized access",
              "Malware",
              "Data breach",
              "Phishing",
              "Ransomware",
              "Physical",
              "DDoS"
            ]
          },
          {
            "name": "severity",
            "label": "Severity",
            "type": "select",
            "required": true,
            "helper": "Low | Medium | High | Critical",
            "options": [
              "Low",
              "Medium",
              "High",
              "Critical"
            ]
          },
          {
            "name": "date_time_detected",
            "label": "Date/time detected",
            "type": "datetime",
            "required": true,
            "helper": "When the incident was first detected"
          },
          {
            "name": "affected_systems",
            "label": "Affected systems",
            "type": "text",
            "required": true,
            "helper": "List of affected servers, modules, or users",
            "placeholder": "List of affected servers, modules, or users"
          },
          {
            "name": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "helper": "Detailed incident description"
          },
          {
            "name": "immediate_actions_taken",
            "label": "Immediate actions taken",
            "type": "textarea",
            "required": true,
            "helper": "Containment steps already taken"
          },
          {
            "name": "data_compromised",
            "label": "Data compromised",
            "type": "text",
            "required": true,
            "helper": "Yes | No | Unknown",
            "placeholder": "Yes | No | Unknown"
          },
          {
            "name": "patient_data_affected",
            "label": "Patient data affected",
            "type": "text",
            "required": false,
            "helper": "Yes | No - triggers DPA notification if Yes",
            "placeholder": "Yes | No - triggers DPA notification if Yes"
          },
          {
            "name": "odpc_notification_required",
            "label": "ODPC notification required",
            "type": "checkbox",
            "required": false,
            "helper": "Auto-checked if patient data was compromised"
          }
        ]
      },
      {
        "name": "System Configuration Change Form",
        "description": "Capture system configuration change details.",
        "fields": [
          {
            "name": "change_type",
            "label": "Change type",
            "type": "select",
            "required": true,
            "helper": "Server config | Network | Firewall | User access | Software update",
            "options": [
              "Server config",
              "Network",
              "Firewall",
              "User access",
              "Software update"
            ]
          },
          {
            "name": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "helper": "What change is being made"
          },
          {
            "name": "justification",
            "label": "Justification",
            "type": "textarea",
            "required": true,
            "helper": "Business or security reason"
          },
          {
            "name": "risk_assessment",
            "label": "Risk assessment",
            "type": "select",
            "required": true,
            "helper": "Low | Medium | High - risk of this change",
            "options": [
              "Low",
              "Medium",
              "High — risk of this change"
            ]
          },
          {
            "name": "rollback_plan",
            "label": "Rollback plan",
            "type": "textarea",
            "required": true,
            "helper": "How to undo if change causes problems"
          },
          {
            "name": "change_window",
            "label": "Change window",
            "type": "text",
            "required": true,
            "helper": "When the change will be implemented",
            "placeholder": "When the change will be implemented"
          },
          {
            "name": "approved_by",
            "label": "Approved by",
            "type": "select",
            "required": true,
            "helper": "IT manager or CTO"
          }
        ]
      }
    ]
  },
  "integrations": {
    "forms": [
      {
        "name": "Integration Configuration Form",
        "description": "Capture integration configuration details.",
        "fields": [
          {
            "name": "integration_name",
            "label": "Integration name",
            "type": "select",
            "required": true,
            "helper": "SHA | KHIS | MPESA | KEMSA | Lab analyser | PACS",
            "options": [
              "SHA",
              "KHIS",
              "MPESA",
              "KEMSA",
              "Lab analyser",
              "PACS"
            ]
          },
          {
            "name": "base_url",
            "label": "Base URL",
            "type": "url",
            "required": true,
            "helper": "API base endpoint",
            "placeholder": "API base endpoint"
          },
          {
            "name": "authentication_type",
            "label": "Authentication type",
            "type": "select",
            "required": true,
            "helper": "Basic | OAuth2 | API key | JWT | Certificate",
            "options": [
              "Basic",
              "OAuth2",
              "API key",
              "JWT",
              "Certificate"
            ]
          },
          {
            "name": "client_id_username",
            "label": "Client ID / Username",
            "type": "text",
            "required": false,
            "helper": "Authentication credential",
            "placeholder": "Authentication credential"
          },
          {
            "name": "client_secret_password",
            "label": "Client secret / Password",
            "type": "password",
            "required": false,
            "helper": "Stored encrypted - never shown after save"
          },
          {
            "name": "message_format",
            "label": "Message format",
            "type": "select",
            "required": true,
            "helper": "JSON | XML | HL7 v2 | FHIR R4 | EDI",
            "options": [
              "JSON",
              "XML",
              "HL7 v2",
              "FHIR R4",
              "EDI"
            ]
          },
          {
            "name": "timeout_seconds",
            "label": "Timeout (seconds)",
            "type": "number",
            "required": true,
            "helper": "Request timeout",
            "placeholder": "Request timeout"
          },
          {
            "name": "retry_attempts",
            "label": "Retry attempts",
            "type": "number",
            "required": true,
            "helper": "Retries on failure",
            "placeholder": "Retries on failure"
          }
        ]
      },
      {
        "name": "Integration Test Form",
        "description": "Capture integration test details.",
        "fields": [
          {
            "name": "integration",
            "label": "Integration",
            "type": "text",
            "required": true,
            "helper": "Integration being tested",
            "placeholder": "Integration being tested"
          },
          {
            "name": "test_type",
            "label": "Test type",
            "type": "select",
            "required": true,
            "helper": "Connectivity ping | Authentication test | Sample transaction",
            "options": [
              "Connectivity ping",
              "Authentication test",
              "Sample transaction"
            ]
          },
          {
            "name": "test_result",
            "label": "Test result",
            "type": "text",
            "required": true,
            "helper": "Success | Failed | Timeout - with response time",
            "placeholder": "Success | Failed | Timeout - with response time"
          }
        ]
      }
    ]
  },
  "orchestration": {
    "forms": [
      {
        "name": "Workflow Definition Form",
        "description": "Capture workflow definition details.",
        "fields": [
          {
            "name": "workflow_name",
            "label": "Workflow name",
            "type": "text",
            "required": true,
            "helper": "Descriptive name e.g. Auto-bill on lab result",
            "placeholder": "Descriptive name e.g. Auto-bill on lab result"
          },
          {
            "name": "trigger_module",
            "label": "Trigger module",
            "type": "select",
            "required": true,
            "helper": "Module that fires the trigger event"
          },
          {
            "name": "trigger_event",
            "label": "Trigger event",
            "type": "select",
            "required": true,
            "helper": "Select from available events in that module"
          },
          {
            "name": "trigger_conditions",
            "label": "Trigger conditions",
            "type": "text",
            "required": false,
            "helper": "Additional conditions - field, operator, value",
            "placeholder": "Additional conditions - field, operator, value"
          },
          {
            "name": "actions",
            "label": "Actions",
            "type": "text",
            "required": true,
            "helper": "Ordered list of actions to execute with target module and payload",
            "placeholder": "Ordered list of actions to execute with target module and payload"
          },
          {
            "name": "on_error_action",
            "label": "On error action",
            "type": "select",
            "required": true,
            "helper": "Retry | Skip | Alert | Halt",
            "options": [
              "Retry",
              "Skip",
              "Alert",
              "Halt"
            ]
          },
          {
            "name": "max_retries",
            "label": "Max retries",
            "type": "number",
            "required": true,
            "helper": "How many times to retry failed actions",
            "placeholder": "How many times to retry failed actions"
          }
        ]
      }
    ]
  },
  "helpdesk": {
    "forms": [
      {
        "name": "Support Ticket Form",
        "description": "Capture support ticket details.",
        "fields": [
          {
            "name": "category",
            "label": "Category",
            "type": "select",
            "required": true,
            "helper": "IT | Maintenance | Biomedical | Housekeeping | HR | Security",
            "options": [
              "IT",
              "Maintenance",
              "Biomedical",
              "Housekeeping",
              "HR",
              "Security"
            ]
          },
          {
            "name": "sub_category",
            "label": "Sub-category",
            "type": "select",
            "required": true,
            "helper": "Network | Hardware | Plumbing | Electrical | Equipment | Other",
            "options": [
              "Network",
              "Hardware",
              "Plumbing",
              "Electrical",
              "Equipment",
              "Other"
            ]
          },
          {
            "name": "priority",
            "label": "Priority",
            "type": "select",
            "required": true,
            "helper": "Low | Medium | High | Critical",
            "options": [
              "Low",
              "Medium",
              "High",
              "Critical"
            ]
          },
          {
            "name": "title",
            "label": "Title",
            "type": "text",
            "required": true,
            "helper": "Short issue description - max 100 characters",
            "placeholder": "Short issue description - max 100 characters"
          },
          {
            "name": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "helper": "Detailed description - what happened, when, impact"
          },
          {
            "name": "affected_asset",
            "label": "Affected asset",
            "type": "select",
            "required": false,
            "helper": "Asset from asset register if applicable"
          },
          {
            "name": "attach_screenshot",
            "label": "Attach screenshot",
            "type": "text",
            "required": false,
            "helper": "Screenshot or photo of the issue",
            "placeholder": "Screenshot or photo of the issue"
          }
        ]
      },
      {
        "name": "Ticket Resolution Form",
        "description": "Capture ticket resolution details.",
        "fields": [
          {
            "name": "resolution_notes",
            "label": "Resolution notes",
            "type": "textarea",
            "required": true,
            "helper": "What was done to resolve the issue"
          },
          {
            "name": "time_spent_hours",
            "label": "Time spent (hours)",
            "type": "number",
            "required": true,
            "helper": "Total time to resolve",
            "placeholder": "Total time to resolve"
          },
          {
            "name": "parts_used",
            "label": "Parts used",
            "type": "text",
            "required": false,
            "helper": "Any parts or consumables used",
            "placeholder": "Any parts or consumables used"
          },
          {
            "name": "requester_satisfaction",
            "label": "Requester satisfaction",
            "type": "text",
            "required": false,
            "helper": "1–5 star rating from requester",
            "placeholder": "1–5 star rating from requester"
          }
        ]
      }
    ]
  },
  "canteen": {
    "forms": [
      {
        "name": "Patient Diet Order Form",
        "description": "Capture patient diet order details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from admission",
            "placeholder": "Auto-filled from admission"
          },
          {
            "name": "diet_type",
            "label": "Diet type",
            "type": "select",
            "required": true,
            "helper": "Normal | Diabetic | Low-sodium | Renal | Soft | Liquid | NPO | High-protein | Vegetarian | Halal | Low-fat",
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
            ]
          },
          {
            "name": "texture",
            "label": "Texture",
            "type": "select",
            "required": false,
            "helper": "Regular | Soft | Minced | Pureed | Liquid - for dysphagia",
            "options": [
              "Regular",
              "Soft",
              "Minced",
              "Pureed",
              "Liquid — for dysphagia"
            ]
          },
          {
            "name": "caloric_target",
            "label": "Caloric target",
            "type": "number",
            "required": false,
            "helper": "Daily calorie target if prescribed by dietitian",
            "placeholder": "Daily calorie target if prescribed by dietitian"
          },
          {
            "name": "fluid_restriction_ml",
            "label": "Fluid restriction (mL)",
            "type": "number",
            "required": false,
            "helper": "Daily fluid limit if restricted",
            "placeholder": "Daily fluid limit if restricted"
          },
          {
            "name": "allergens_to_exclude",
            "label": "Allergens to exclude",
            "type": "text",
            "required": false,
            "helper": "Nuts | Gluten | Dairy | Eggs | Seafood | Soy",
            "placeholder": "Nuts | Gluten | Dairy | Eggs | Seafood | Soy"
          },
          {
            "name": "special_instructions",
            "label": "Special instructions",
            "type": "text",
            "required": false,
            "helper": "Additional preparation notes for kitchen",
            "placeholder": "Additional preparation notes for kitchen"
          },
          {
            "name": "start_date",
            "label": "Start date",
            "type": "date",
            "required": true,
            "helper": "When this diet order begins"
          },
          {
            "name": "ordered_by",
            "label": "Ordered by",
            "type": "text",
            "required": true,
            "helper": "Doctor or dietitian - auto-filled",
            "placeholder": "Doctor or dietitian - auto-filled"
          }
        ]
      },
      {
        "name": "Canteen POS Form",
        "description": "Capture canteen pos details.",
        "fields": [
          {
            "name": "customer_type",
            "label": "Customer type",
            "type": "select",
            "required": true,
            "helper": "Staff | Visitor | Patient | Other",
            "options": [
              "Staff",
              "Visitor",
              "Patient",
              "Other"
            ]
          },
          {
            "name": "staff_id",
            "label": "Staff ID",
            "type": "select",
            "required": false,
            "helper": "If selling to staff - enables salary deduction option"
          },
          {
            "name": "items",
            "label": "Items",
            "type": "text",
            "required": true,
            "helper": "Items selected from menu with quantities",
            "placeholder": "Items selected from menu with quantities"
          },
          {
            "name": "total",
            "label": "Total",
            "type": "text",
            "required": true,
            "helper": "Sum of selected items",
            "placeholder": "Sum of selected items"
          },
          {
            "name": "payment_method",
            "label": "Payment method",
            "type": "select",
            "required": true,
            "helper": "Cash | MPESA | Staff salary deduction | Credit",
            "options": [
              "Cash",
              "MPESA",
              "Staff salary deduction",
              "Credit"
            ]
          }
        ]
      }
    ]
  },
  "patient-feedback": {
    "forms": [
      {
        "name": "Patient Satisfaction Survey Form",
        "description": "Capture patient satisfaction survey details.",
        "fields": [
          {
            "name": "visit_type",
            "label": "Visit type",
            "type": "select",
            "required": true,
            "helper": "OPD | Inpatient | Emergency | Telemedicine",
            "options": [
              "OPD",
              "Inpatient",
              "Emergency",
              "Telemedicine"
            ]
          },
          {
            "name": "overall_satisfaction",
            "label": "Overall satisfaction",
            "type": "text",
            "required": true,
            "helper": "1 (Very poor) to 5 (Excellent)",
            "placeholder": "1 (Very poor) to 5 (Excellent)"
          },
          {
            "name": "staff_attitude",
            "label": "Staff attitude",
            "type": "text",
            "required": false,
            "helper": "How staff treated you",
            "placeholder": "How staff treated you"
          },
          {
            "name": "cleanliness",
            "label": "Cleanliness",
            "type": "text",
            "required": false,
            "helper": "Cleanliness of facility",
            "placeholder": "Cleanliness of facility"
          },
          {
            "name": "wait_time",
            "label": "Wait time",
            "type": "text",
            "required": false,
            "helper": "How long you waited",
            "placeholder": "How long you waited"
          },
          {
            "name": "explanation_of_condition",
            "label": "Explanation of condition",
            "type": "text",
            "required": false,
            "helper": "How well your condition was explained",
            "placeholder": "How well your condition was explained"
          },
          {
            "name": "would_recommend_facility",
            "label": "Would recommend facility",
            "type": "text",
            "required": true,
            "helper": "0–10 Net Promoter Score",
            "placeholder": "0–10 Net Promoter Score"
          },
          {
            "name": "best_aspect",
            "label": "Best aspect",
            "type": "text",
            "required": false,
            "helper": "What you liked most",
            "placeholder": "What you liked most"
          },
          {
            "name": "improvement_suggestion",
            "label": "Improvement suggestion",
            "type": "textarea",
            "required": false,
            "helper": "What could be better"
          }
        ]
      },
      {
        "name": "Complaint / Compliment Form",
        "description": "Capture complaint / compliment details.",
        "fields": [
          {
            "name": "type",
            "label": "Type",
            "type": "select",
            "required": true,
            "helper": "Complaint | Compliment | Suggestion",
            "options": [
              "Complaint",
              "Compliment",
              "Suggestion"
            ]
          },
          {
            "name": "department_involved",
            "label": "Department involved",
            "type": "select",
            "required": true,
            "helper": "Department the feedback is about"
          },
          {
            "name": "date_of_incident",
            "label": "Date of incident",
            "type": "date",
            "required": false,
            "helper": "When the incident occurred if complaint"
          },
          {
            "name": "staff_involved",
            "label": "Staff involved",
            "type": "text",
            "required": false,
            "helper": "Name of staff if known - anonymous to them",
            "placeholder": "Name of staff if known - anonymous to them"
          },
          {
            "name": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "helper": "Detailed description of the compliment or complaint"
          },
          {
            "name": "preferred_resolution",
            "label": "Preferred resolution",
            "type": "text",
            "required": false,
            "helper": "What outcome patient would like if complaint",
            "placeholder": "What outcome patient would like if complaint"
          },
          {
            "name": "contact_for_follow_up",
            "label": "Contact for follow-up",
            "type": "text",
            "required": false,
            "helper": "Yes - contact me | No - anonymous",
            "placeholder": "Yes - contact me | No - anonymous"
          }
        ]
      }
    ]
  },
  "physiotherapy": {
    "forms": [
      {
        "name": "Physiotherapy Initial Assessment Form",
        "description": "Capture physiotherapy initial assessment details.",
        "fields": [
          {
            "name": "referral_diagnosis",
            "label": "Referral diagnosis",
            "type": "text",
            "required": true,
            "helper": "From referring clinician's order",
            "placeholder": "From referring clinician's order"
          },
          {
            "name": "subjective",
            "label": "Subjective",
            "type": "textarea",
            "required": true,
            "helper": "Patient-reported symptoms, history, functional limitations"
          },
          {
            "name": "objective_measurements",
            "label": "Objective measurements",
            "type": "text",
            "required": true,
            "helper": "ROM per joint | Muscle strength grades | Balance tests | Functional scores",
            "placeholder": "ROM per joint | Muscle strength grades | Balance tests | Functional scores"
          },
          {
            "name": "pain_score_0_10",
            "label": "Pain score (0–10)",
            "type": "text",
            "required": true,
            "helper": "Current pain level",
            "placeholder": "Current pain level"
          },
          {
            "name": "functional_status",
            "label": "Functional status",
            "type": "textarea",
            "required": true,
            "helper": "Activities of daily living - what patient can and cannot do"
          },
          {
            "name": "barthel_index_score",
            "label": "Barthel Index score",
            "type": "text",
            "required": false,
            "helper": "Functional independence measure 0–100",
            "placeholder": "Functional independence measure 0–100"
          },
          {
            "name": "physiotherapy_diagnosis",
            "label": "Physiotherapy diagnosis",
            "type": "textarea",
            "required": true,
            "helper": "Physiotherapist's clinical impression"
          },
          {
            "name": "treatment_goals",
            "label": "Treatment goals",
            "type": "text",
            "required": true,
            "helper": "Short-term and long-term goals with measurable targets",
            "placeholder": "Short-term and long-term goals with measurable targets"
          },
          {
            "name": "treatment_plan",
            "label": "Treatment plan",
            "type": "textarea",
            "required": true,
            "helper": "Planned interventions, modalities, and exercise programme"
          },
          {
            "name": "sessions_prescribed",
            "label": "Sessions prescribed",
            "type": "number",
            "required": true,
            "helper": "Total sessions planned",
            "placeholder": "Total sessions planned"
          },
          {
            "name": "frequency_per_week",
            "label": "Frequency per week",
            "type": "number",
            "required": true,
            "helper": "Session frequency",
            "placeholder": "Session frequency"
          }
        ]
      },
      {
        "name": "Physiotherapy Session Record",
        "description": "Capture physiotherapy session record details.",
        "fields": [
          {
            "name": "session_number",
            "label": "Session number",
            "type": "text",
            "required": true,
            "helper": "Sequential within this treatment episode",
            "placeholder": "Sequential within this treatment episode"
          },
          {
            "name": "pain_score",
            "label": "Pain score",
            "type": "text",
            "required": true,
            "helper": "Pain at start of session 0–10",
            "placeholder": "Pain at start of session 0–10"
          },
          {
            "name": "treatment_given",
            "label": "Treatment given",
            "type": "text",
            "required": true,
            "helper": "Modalities: TENS | Ultrasound | Heat | Ice | Traction | Massage - with parameters",
            "placeholder": "Modalities: TENS | Ultrasound | Heat | Ice | Traction | Massage - with parameters"
          },
          {
            "name": "exercises",
            "label": "Exercises",
            "type": "text",
            "required": true,
            "helper": "Exercises with sets, reps, resistance, and notes",
            "placeholder": "Exercises with sets, reps, resistance, and notes"
          },
          {
            "name": "patient_response",
            "label": "Patient response",
            "type": "text",
            "required": true,
            "helper": "How patient tolerated treatment",
            "placeholder": "How patient tolerated treatment"
          },
          {
            "name": "progress_notes",
            "label": "Progress notes",
            "type": "textarea",
            "required": true,
            "helper": "Progress toward goals - objective measurements if done"
          },
          {
            "name": "home_exercise_programme",
            "label": "Home exercise programme",
            "type": "text",
            "required": false,
            "helper": "Exercises given for home between sessions",
            "placeholder": "Exercises given for home between sessions"
          }
        ]
      }
    ]
  },
  "nutrition": {
    "forms": [
      {
        "name": "Nutritional Screening Form",
        "description": "Capture nutritional screening details.",
        "fields": [
          {
            "name": "screening_tool",
            "label": "Screening tool",
            "type": "select",
            "required": true,
            "helper": "MUST | NRS-2002 | MNA | STAMP",
            "options": [
              "MUST",
              "NRS-2002",
              "MNA",
              "STAMP"
            ]
          },
          {
            "name": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": true,
            "helper": "Current measured weight",
            "placeholder": "Current measured weight"
          },
          {
            "name": "height_cm",
            "label": "Height (cm)",
            "type": "number",
            "required": true,
            "helper": "Measured height",
            "placeholder": "Measured height"
          },
          {
            "name": "bmi",
            "label": "BMI",
            "type": "text",
            "required": true,
            "helper": "Auto-calculated from weight and height",
            "placeholder": "Auto-calculated from weight and height"
          },
          {
            "name": "usual_body_weight_kg",
            "label": "Usual body weight (kg)",
            "type": "number",
            "required": false,
            "helper": "Pre-illness or usual weight",
            "placeholder": "Pre-illness or usual weight"
          },
          {
            "name": "unintentional_weight_loss",
            "label": "Unintentional weight loss",
            "type": "select",
            "required": true,
            "helper": "None | <5% in 3 months | 5–10% | >10%",
            "options": [
              "None",
              "<5% in 3 months",
              "5–10%",
              ">10%"
            ]
          },
          {
            "name": "appetite",
            "label": "Appetite",
            "type": "select",
            "required": true,
            "helper": "Good | Fair | Poor | Absent",
            "options": [
              "Good",
              "Fair",
              "Poor",
              "Absent"
            ]
          },
          {
            "name": "disease_severity",
            "label": "Disease severity",
            "type": "select",
            "required": true,
            "helper": "No stress | Mild | Moderate | Severe",
            "options": [
              "No stress",
              "Mild",
              "Moderate",
              "Severe"
            ]
          },
          {
            "name": "screening_score",
            "label": "Screening score",
            "type": "text",
            "required": true,
            "helper": "Calculated risk score",
            "placeholder": "Calculated risk score"
          },
          {
            "name": "risk_category",
            "label": "Risk category",
            "type": "text",
            "required": true,
            "helper": "Low | Medium | High",
            "placeholder": "Low | Medium | High"
          }
        ]
      },
      {
        "name": "Nutrition Assessment Form",
        "description": "Capture nutrition assessment details.",
        "fields": [
          {
            "name": "24_hour_dietary_recall",
            "label": "24-hour dietary recall",
            "type": "textarea",
            "required": true,
            "helper": "Everything eaten and drunk in the previous 24 hours"
          },
          {
            "name": "swallowing_status",
            "label": "Swallowing status",
            "type": "select",
            "required": true,
            "helper": "Normal | Mild dysphagia | Severe dysphagia | NPO",
            "options": [
              "Normal",
              "Mild dysphagia",
              "Severe dysphagia",
              "NPO"
            ]
          },
          {
            "name": "gut_function",
            "label": "Gut function",
            "type": "select",
            "required": true,
            "helper": "Normal | Diarrhoea | Constipation | Malabsorption",
            "options": [
              "Normal",
              "Diarrhoea",
              "Constipation",
              "Malabsorption"
            ]
          },
          {
            "name": "serum_albumin_g_dl",
            "label": "Serum albumin (g/dL)",
            "type": "number",
            "required": false,
            "helper": "Biochemical marker of nutritional status",
            "placeholder": "Biochemical marker of nutritional status"
          },
          {
            "name": "clinical_signs_of_malnutrition",
            "label": "Clinical signs of malnutrition",
            "type": "text",
            "required": false,
            "helper": "Oedema | Muscle wasting | Hair loss | Skin changes | Angular stomatitis",
            "placeholder": "Oedema | Muscle wasting | Hair loss | Skin changes | Angular stomatitis"
          },
          {
            "name": "energy_requirement_kcal_day",
            "label": "Energy requirement (kcal/day)",
            "type": "number",
            "required": true,
            "helper": "Calculated or estimated daily energy need",
            "placeholder": "Calculated or estimated daily energy need"
          },
          {
            "name": "protein_requirement_g_day",
            "label": "Protein requirement (g/day)",
            "type": "number",
            "required": true,
            "helper": "Daily protein requirement",
            "placeholder": "Daily protein requirement"
          },
          {
            "name": "nutrition_diagnosis",
            "label": "Nutrition diagnosis",
            "type": "textarea",
            "required": true,
            "helper": "PES statement: Problem | Etiology | Signs and symptoms"
          }
        ]
      },
      {
        "name": "Nutrition Care Plan Form",
        "description": "Capture nutrition care plan details.",
        "fields": [
          {
            "name": "nutrition_support_type",
            "label": "Nutrition support type",
            "type": "select",
            "required": true,
            "helper": "Oral diet | Oral supplement | Enteral NG | TPN | Combined",
            "options": [
              "Oral diet",
              "Oral supplement",
              "Enteral NG",
              "TPN",
              "Combined"
            ]
          },
          {
            "name": "diet_type",
            "label": "Diet type",
            "type": "select",
            "required": false,
            "helper": "Normal | Diabetic | Renal | Cardiac | Low-sodium | Liquid | Soft",
            "options": [
              "Normal",
              "Diabetic",
              "Renal",
              "Cardiac",
              "Low-sodium",
              "Liquid",
              "Soft"
            ]
          },
          {
            "name": "enteral_formula",
            "label": "Enteral formula",
            "type": "text",
            "required": false,
            "helper": "Brand/type of enteral feed",
            "placeholder": "Brand/type of enteral feed"
          },
          {
            "name": "feed_rate_ml_hour",
            "label": "Feed rate (mL/hour)",
            "type": "number",
            "required": false,
            "helper": "Enteral feed rate",
            "placeholder": "Enteral feed rate"
          },
          {
            "name": "total_daily_volume_ml",
            "label": "Total daily volume (mL)",
            "type": "number",
            "required": false,
            "helper": "Total enteral volume target",
            "placeholder": "Total enteral volume target"
          },
          {
            "name": "tpn_composition",
            "label": "TPN composition",
            "type": "text",
            "required": false,
            "helper": "Dextrose, amino acids, lipids, electrolytes composition",
            "placeholder": "Dextrose, amino acids, lipids, electrolytes composition"
          },
          {
            "name": "monitoring_plan",
            "label": "Monitoring plan",
            "type": "text",
            "required": true,
            "helper": "Parameters to monitor - weight, glucose, electrolytes",
            "placeholder": "Parameters to monitor - weight, glucose, electrolytes"
          },
          {
            "name": "review_date",
            "label": "Review date",
            "type": "date",
            "required": true,
            "helper": "Next scheduled nutrition review"
          }
        ]
      }
    ]
  },
  "dental": {
    "forms": [
      {
        "name": "Dental Examination Form",
        "description": "Capture dental examination details.",
        "fields": [
          {
            "name": "notation_system",
            "label": "Notation system",
            "type": "select",
            "required": true,
            "helper": "FDI | Universal | Palmer",
            "options": [
              "FDI",
              "Universal",
              "Palmer"
            ]
          },
          {
            "name": "tooth_chart",
            "label": "Tooth chart",
            "type": "text",
            "required": true,
            "helper": "Visual tooth chart - click per tooth to record status and treatment needed",
            "placeholder": "Visual tooth chart - click per tooth to record status and treatment needed"
          },
          {
            "name": "periodontal_probing_depths",
            "label": "Periodontal probing depths",
            "type": "text",
            "required": false,
            "helper": "Pocket depths per tooth per surface",
            "placeholder": "Pocket depths per tooth per surface"
          },
          {
            "name": "occlusion_class",
            "label": "Occlusion class",
            "type": "select",
            "required": false,
            "helper": "Angle Class I | II | III",
            "options": [
              "Angle Class I",
              "II",
              "III"
            ]
          },
          {
            "name": "oral_hygiene_status",
            "label": "Oral hygiene status",
            "type": "select",
            "required": true,
            "helper": "Good | Fair | Poor",
            "options": [
              "Good",
              "Fair",
              "Poor"
            ]
          },
          {
            "name": "plaque_index",
            "label": "Plaque index",
            "type": "number",
            "required": false,
            "helper": "0–3 plaque index score",
            "placeholder": "0–3 plaque index score"
          },
          {
            "name": "gingival_index",
            "label": "Gingival index",
            "type": "number",
            "required": false,
            "helper": "0–3 gingival index score",
            "placeholder": "0–3 gingival index score"
          },
          {
            "name": "chief_dental_complaint",
            "label": "Chief dental complaint",
            "type": "text",
            "required": true,
            "helper": "Main reason for visit",
            "placeholder": "Main reason for visit"
          },
          {
            "name": "dental_history",
            "label": "Dental history",
            "type": "textarea",
            "required": false,
            "helper": "Previous dental treatment, dental anxiety level"
          },
          {
            "name": "radiographs_required",
            "label": "Radiographs required",
            "type": "text",
            "required": false,
            "helper": "Periapical | Bitewing | OPG | CBCT",
            "placeholder": "Periapical | Bitewing | OPG | CBCT"
          }
        ]
      },
      {
        "name": "Dental Treatment Record",
        "description": "Capture dental treatment record details.",
        "fields": [
          {
            "name": "tooth_number",
            "label": "Tooth number",
            "type": "select",
            "required": true,
            "helper": "Specific tooth treated"
          },
          {
            "name": "tooth_surfaces",
            "label": "Tooth surfaces",
            "type": "text",
            "required": false,
            "helper": "Mesial | Distal | Buccal | Lingual | Occlusal | Incisal",
            "placeholder": "Mesial | Distal | Buccal | Lingual | Occlusal | Incisal"
          },
          {
            "name": "procedure",
            "label": "Procedure",
            "type": "select",
            "required": true,
            "helper": "Extraction | Amalgam | Composite | RCT | Crown | Scaling | Other",
            "options": [
              "Extraction",
              "Amalgam",
              "Composite",
              "RCT",
              "Crown",
              "Scaling",
              "Other"
            ]
          },
          {
            "name": "anaesthesia_type",
            "label": "Anaesthesia type",
            "type": "select",
            "required": true,
            "helper": "None | Local infiltration | Block | Sedation | General",
            "options": [
              "None",
              "Local infiltration",
              "Block",
              "Sedation",
              "General"
            ]
          },
          {
            "name": "anaesthetic_used",
            "label": "Anaesthetic used",
            "type": "text",
            "required": false,
            "helper": "Drug and volume e.g. Lignocaine 2% 1.8mL",
            "placeholder": "Drug and volume e.g. Lignocaine 2% 1.8mL"
          },
          {
            "name": "materials_used",
            "label": "Materials used",
            "type": "text",
            "required": false,
            "helper": "Restorative material and shade if applicable",
            "placeholder": "Restorative material and shade if applicable"
          },
          {
            "name": "complications",
            "label": "Complications",
            "type": "text",
            "required": false,
            "helper": "Any procedural complications",
            "placeholder": "Any procedural complications"
          },
          {
            "name": "post_op_instructions",
            "label": "Post-op instructions",
            "type": "textarea",
            "required": true,
            "helper": "Care instructions given to patient"
          }
        ]
      }
    ]
  },
  "infection-control": {
    "forms": [
      {
        "name": "HAI Surveillance Form",
        "description": "Capture hai surveillance details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from admission",
            "placeholder": "Auto-filled from admission"
          },
          {
            "name": "hai_type",
            "label": "HAI type",
            "type": "select",
            "required": true,
            "helper": "SSI | CAUTI | CLABSI | VAP | CDI | MRSA | Other",
            "options": [
              "SSI",
              "CAUTI",
              "CLABSI",
              "VAP",
              "CDI",
              "MRSA",
              "Other"
            ]
          },
          {
            "name": "diagnosis_date",
            "label": "Diagnosis date",
            "type": "date",
            "required": true,
            "helper": "Date HAI was identified"
          },
          {
            "name": "implicated_device",
            "label": "Implicated device",
            "type": "select",
            "required": false,
            "helper": "Urinary catheter | Central line | Ventilator | Surgical site | NA",
            "options": [
              "Urinary catheter",
              "Central line",
              "Ventilator",
              "Surgical site",
              "NA"
            ]
          },
          {
            "name": "device_insertion_date",
            "label": "Device insertion date",
            "type": "date",
            "required": false,
            "helper": "For device-day calculation"
          },
          {
            "name": "causative_organism",
            "label": "Causative organism",
            "type": "text",
            "required": false,
            "helper": "Organism identified on culture",
            "placeholder": "Organism identified on culture"
          },
          {
            "name": "is_multi_drug_resistant",
            "label": "Is multi-drug resistant",
            "type": "checkbox",
            "required": true,
            "helper": "MRSA | VRE | ESBL | CRE - tick if MDR"
          },
          {
            "name": "treatment_given",
            "label": "Treatment given",
            "type": "text",
            "required": false,
            "helper": "Antibiotic and other treatment",
            "placeholder": "Antibiotic and other treatment"
          },
          {
            "name": "outcome",
            "label": "Outcome",
            "type": "select",
            "required": true,
            "helper": "Resolved | Ongoing | Transferred | Deceased",
            "options": [
              "Resolved",
              "Ongoing",
              "Transferred",
              "Deceased"
            ]
          }
        ]
      },
      {
        "name": "CSSD Sterilisation Cycle Form",
        "description": "Capture cssd sterilisation cycle details.",
        "fields": [
          {
            "name": "autoclave_id",
            "label": "Autoclave ID",
            "type": "select",
            "required": true,
            "helper": "Specific autoclave machine"
          },
          {
            "name": "cycle_number",
            "label": "Cycle number",
            "type": "text",
            "required": true,
            "helper": "Sequential machine cycle number",
            "placeholder": "Sequential machine cycle number"
          },
          {
            "name": "cycle_type",
            "label": "Cycle type",
            "type": "select",
            "required": true,
            "helper": "Gravity | Pre-vacuum | Flash | ETO | Plasma",
            "options": [
              "Gravity",
              "Pre-vacuum",
              "Flash",
              "ETO",
              "Plasma"
            ]
          },
          {
            "name": "temperature_c",
            "label": "Temperature (°C)",
            "type": "text",
            "required": true,
            "helper": "Auto-read from machine - typically 134°C",
            "placeholder": "Auto-read from machine - typically 134°C"
          },
          {
            "name": "pressure_bar",
            "label": "Pressure (bar)",
            "type": "text",
            "required": true,
            "helper": "Auto-read from machine",
            "placeholder": "Auto-read from machine"
          },
          {
            "name": "hold_time_minutes",
            "label": "Hold time (minutes)",
            "type": "text",
            "required": true,
            "helper": "Time at sterilising temperature",
            "placeholder": "Time at sterilising temperature"
          },
          {
            "name": "chemical_indicator_result",
            "label": "Chemical indicator result",
            "type": "select",
            "required": true,
            "helper": "Pass | Fail",
            "options": [
              "Pass",
              "Fail"
            ]
          },
          {
            "name": "bowie_dick_result",
            "label": "Bowie-Dick result",
            "type": "select",
            "required": false,
            "helper": "Pass | Fail - for pre-vacuum cycles only",
            "options": [
              "Pass",
              "Fail — for pre-vacuum cycles only"
            ]
          },
          {
            "name": "biological_indicator_result",
            "label": "Biological indicator result",
            "type": "select",
            "required": false,
            "helper": "Pass | Fail | Pending - weekly spore test",
            "options": [
              "Pass",
              "Fail",
              "Pending — weekly spore test"
            ]
          },
          {
            "name": "loads_in_this_cycle",
            "label": "Loads in this cycle",
            "type": "text",
            "required": true,
            "helper": "Instrument trays with tray code and description",
            "placeholder": "Instrument trays with tray code and description"
          },
          {
            "name": "cycle_passed",
            "label": "Cycle passed",
            "type": "text",
            "required": true,
            "helper": "Auto-determined from all indicator results",
            "placeholder": "Auto-determined from all indicator results"
          }
        ]
      },
      {
        "name": "Hand Hygiene Audit Form",
        "description": "Capture hand hygiene audit details.",
        "fields": [
          {
            "name": "ward",
            "label": "Ward",
            "type": "select",
            "required": true,
            "helper": "Ward being audited"
          },
          {
            "name": "audit_date",
            "label": "Audit date",
            "type": "date",
            "required": true,
            "helper": "Date of observation"
          },
          {
            "name": "observation_duration_min",
            "label": "Observation duration (min)",
            "type": "number",
            "required": true,
            "helper": "How long observations were done",
            "placeholder": "How long observations were done"
          },
          {
            "name": "total_opportunities",
            "label": "Total opportunities",
            "type": "number",
            "required": true,
            "helper": "Total hand hygiene opportunities observed",
            "placeholder": "Total hand hygiene opportunities observed"
          },
          {
            "name": "opportunities_taken",
            "label": "Opportunities taken",
            "type": "number",
            "required": true,
            "helper": "Times hand hygiene was actually performed",
            "placeholder": "Times hand hygiene was actually performed"
          },
          {
            "name": "compliance_rate",
            "label": "Compliance rate",
            "type": "text",
            "required": true,
            "helper": "Calculated percentage",
            "placeholder": "Calculated percentage"
          },
          {
            "name": "by_moment",
            "label": "By moment",
            "type": "text",
            "required": true,
            "helper": "Compliance per WHO 5 moments",
            "placeholder": "Compliance per WHO 5 moments"
          },
          {
            "name": "by_cadre",
            "label": "By cadre",
            "type": "text",
            "required": false,
            "helper": "Nurses | Doctors | Allied | Support",
            "placeholder": "Nurses | Doctors | Allied | Support"
          },
          {
            "name": "handrub_available",
            "label": "Handrub available",
            "type": "checkbox",
            "required": true,
            "helper": "Alcohol handrub at all points of care"
          },
          {
            "name": "sinks_functional",
            "label": "Sinks functional",
            "type": "checkbox",
            "required": true,
            "helper": "Hand washing sinks in working order"
          }
        ]
      }
    ]
  },
  "community-health": {
    "forms": [
      {
        "name": "CHW Registration Form",
        "description": "Capture chw registration details.",
        "fields": [
          {
            "name": "full_name",
            "label": "Full name",
            "type": "text",
            "required": true,
            "helper": "CHW full name",
            "placeholder": "CHW full name"
          },
          {
            "name": "national_id",
            "label": "National ID",
            "type": "text",
            "required": true,
            "helper": "National ID number",
            "placeholder": "National ID number"
          },
          {
            "name": "phone",
            "label": "Phone",
            "type": "tel",
            "required": true,
            "helper": "Mobile number - primary contact",
            "placeholder": "Mobile number - primary contact"
          },
          {
            "name": "cadre",
            "label": "Cadre",
            "type": "select",
            "required": true,
            "helper": "CHV | CHP | Supervisor",
            "options": [
              "CHV",
              "CHP",
              "Supervisor"
            ]
          },
          {
            "name": "assigned_village",
            "label": "Assigned village",
            "type": "text",
            "required": true,
            "helper": "Village or estate assigned",
            "placeholder": "Village or estate assigned"
          },
          {
            "name": "sub_location",
            "label": "Sub-location",
            "type": "select",
            "required": true,
            "helper": "Administrative sub-location"
          },
          {
            "name": "supervisor",
            "label": "Supervisor",
            "type": "select",
            "required": false,
            "helper": "Supervising CHW or health officer"
          }
        ]
      },
      {
        "name": "Household Registration Form",
        "description": "Capture household registration details.",
        "fields": [
          {
            "name": "chw",
            "label": "CHW",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from login",
            "placeholder": "Auto-filled from login"
          },
          {
            "name": "head_of_household",
            "label": "Head of household",
            "type": "text",
            "required": true,
            "helper": "Name of household head",
            "placeholder": "Name of household head"
          },
          {
            "name": "phone",
            "label": "Phone",
            "type": "tel",
            "required": false,
            "helper": "Household contact number",
            "placeholder": "Household contact number"
          },
          {
            "name": "village",
            "label": "Village",
            "type": "text",
            "required": true,
            "helper": "Village name",
            "placeholder": "Village name"
          },
          {
            "name": "gps_location",
            "label": "GPS location",
            "type": "text",
            "required": false,
            "helper": "Auto-capture GPS coordinates",
            "placeholder": "Auto-capture GPS coordinates"
          },
          {
            "name": "water_source",
            "label": "Water source",
            "type": "select",
            "required": true,
            "helper": "Piped | Borehole | River | Rain | Vendor",
            "options": [
              "Piped",
              "Borehole",
              "River",
              "Rain",
              "Vendor"
            ]
          },
          {
            "name": "sanitation",
            "label": "Sanitation",
            "type": "select",
            "required": true,
            "helper": "Flush toilet | Pit latrine | Open defecation",
            "options": [
              "Flush toilet",
              "Pit latrine",
              "Open defecation"
            ]
          },
          {
            "name": "number_of_members",
            "label": "Number of members",
            "type": "number",
            "required": true,
            "helper": "Total household members",
            "placeholder": "Total household members"
          }
        ]
      },
      {
        "name": "CHW Home Visit Form",
        "description": "Capture chw home visit details.",
        "fields": [
          {
            "name": "household",
            "label": "Household",
            "type": "select",
            "required": true,
            "helper": "Household being visited"
          },
          {
            "name": "visit_type",
            "label": "Visit type",
            "type": "select",
            "required": true,
            "helper": "Routine | ANC follow-up | PNC | Immunisation | Chronic disease | Defaulter tracing",
            "options": [
              "Routine",
              "ANC follow-up",
              "PNC",
              "Immunisation",
              "Chronic disease",
              "Defaulter tracing"
            ]
          },
          {
            "name": "members_present",
            "label": "Members present",
            "type": "number",
            "required": true,
            "helper": "Household members seen during visit",
            "placeholder": "Household members seen during visit"
          },
          {
            "name": "services_provided",
            "label": "Services provided",
            "type": "text",
            "required": true,
            "helper": "Health education | Screening | Referral | Immunisation | FP counselling",
            "placeholder": "Health education | Screening | Referral | Immunisation | FP counselling"
          },
          {
            "name": "findings",
            "label": "Findings",
            "type": "textarea",
            "required": true,
            "helper": "Health findings during the visit"
          },
          {
            "name": "referrals_made",
            "label": "Referrals made",
            "type": "number",
            "required": false,
            "helper": "Number of patients referred to facility",
            "placeholder": "Number of patients referred to facility"
          },
          {
            "name": "gps_confirmation",
            "label": "GPS confirmation",
            "type": "text",
            "required": true,
            "helper": "Auto-capture to confirm location of visit",
            "placeholder": "Auto-capture to confirm location of visit"
          },
          {
            "name": "next_visit_date",
            "label": "Next visit date",
            "type": "date",
            "required": false,
            "helper": "Date of next scheduled visit"
          }
        ]
      }
    ]
  },
  "consent": {
    "forms": [
      {
        "name": "Informed Consent Form",
        "description": "Capture informed consent details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from encounter",
            "placeholder": "Auto-filled from encounter"
          },
          {
            "name": "consent_type",
            "label": "Consent type",
            "type": "select",
            "required": true,
            "helper": "Surgical | Anaesthesia | Blood transfusion | HIV testing | Research | Data processing | Photography",
            "options": [
              "Surgical",
              "Anaesthesia",
              "Blood transfusion",
              "HIV testing",
              "Research",
              "Data processing",
              "Photography"
            ]
          },
          {
            "name": "consent_form_version",
            "label": "Consent form version",
            "type": "text",
            "required": true,
            "helper": "Auto-selected current version",
            "placeholder": "Auto-selected current version"
          },
          {
            "name": "procedure_explained",
            "label": "Procedure explained",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm procedure was explained to patient"
          },
          {
            "name": "questions_answered",
            "label": "Questions answered",
            "type": "checkbox",
            "required": true,
            "helper": "Confirm patient's questions were answered"
          },
          {
            "name": "language_of_explanation",
            "label": "Language of explanation",
            "type": "select",
            "required": true,
            "helper": "English | Swahili | Kikuyu | Other",
            "options": [
              "English",
              "Swahili",
              "Kikuyu",
              "Other"
            ]
          },
          {
            "name": "patient_consents",
            "label": "Patient consents",
            "type": "text",
            "required": true,
            "helper": "Yes - I consent | No - I refuse",
            "placeholder": "Yes - I consent | No - I refuse"
          },
          {
            "name": "refusal_reason",
            "label": "Refusal reason",
            "type": "text",
            "required": false,
            "helper": "Required if patient refuses",
            "placeholder": "Required if patient refuses"
          },
          {
            "name": "consented_by",
            "label": "Consented by",
            "type": "text",
            "required": true,
            "helper": "Name of patient or guardian giving consent",
            "placeholder": "Name of patient or guardian giving consent"
          },
          {
            "name": "relationship_to_patient",
            "label": "Relationship to patient",
            "type": "select",
            "required": false,
            "helper": "Self | Parent | Guardian | Spouse | Next of kin - if not patient",
            "options": [
              "Self",
              "Parent",
              "Guardian",
              "Spouse",
              "Next of kin — if not patient"
            ]
          },
          {
            "name": "patient_guardian_signature",
            "label": "Patient/guardian signature",
            "type": "text",
            "required": true,
            "helper": "Digital signature or thumbprint capture",
            "placeholder": "Digital signature or thumbprint capture"
          },
          {
            "name": "witness_name",
            "label": "Witness name",
            "type": "text",
            "required": true,
            "helper": "Name of witness present during consent",
            "placeholder": "Name of witness present during consent"
          },
          {
            "name": "witness_signature",
            "label": "Witness signature",
            "type": "text",
            "required": true,
            "helper": "Witness digital signature",
            "placeholder": "Witness digital signature"
          },
          {
            "name": "obtained_by",
            "label": "Obtained by",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - clinician obtaining consent",
            "placeholder": "Auto-filled - clinician obtaining consent"
          }
        ]
      }
    ]
  },
  "referrals": {
    "forms": [
      {
        "name": "Outgoing Referral Form",
        "description": "Capture outgoing referral details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from encounter",
            "placeholder": "Auto-filled from encounter"
          },
          {
            "name": "receiving_facility",
            "label": "Receiving facility",
            "type": "select",
            "required": true,
            "helper": "Select from facility directory - searchable by name or MFL"
          },
          {
            "name": "receiving_specialist",
            "label": "Receiving specialist",
            "type": "text",
            "required": false,
            "helper": "Specific doctor or department at receiving facility",
            "placeholder": "Specific doctor or department at receiving facility"
          },
          {
            "name": "specialty_required",
            "label": "Specialty required",
            "type": "select",
            "required": true,
            "helper": "Specialty service being sought"
          },
          {
            "name": "urgency",
            "label": "Urgency",
            "type": "select",
            "required": true,
            "helper": "Routine | Urgent | Emergency",
            "options": [
              "Routine",
              "Urgent",
              "Emergency"
            ]
          },
          {
            "name": "reason_for_referral",
            "label": "Reason for referral",
            "type": "textarea",
            "required": true,
            "helper": "Clinical reason and specific questions for receiving team"
          },
          {
            "name": "clinical_summary",
            "label": "Clinical summary",
            "type": "textarea",
            "required": true,
            "helper": "History, findings, investigations done, treatment given"
          },
          {
            "name": "investigations_attached",
            "label": "Investigations attached",
            "type": "text",
            "required": false,
            "helper": "Lab results | Imaging | ECG | Other reports",
            "placeholder": "Lab results | Imaging | ECG | Other reports"
          },
          {
            "name": "transport_mode",
            "label": "Transport mode",
            "type": "select",
            "required": true,
            "helper": "Self | Ambulance | Police | Air evacuation",
            "options": [
              "Self",
              "Ambulance",
              "Police",
              "Air evacuation"
            ]
          },
          {
            "name": "accompanying_person",
            "label": "Accompanying person",
            "type": "text",
            "required": false,
            "helper": "Name of person accompanying patient",
            "placeholder": "Name of person accompanying patient"
          }
        ]
      },
      {
        "name": "Referral Feedback Form",
        "description": "Capture referral feedback details.",
        "fields": [
          {
            "name": "referral",
            "label": "Referral",
            "type": "text",
            "required": true,
            "helper": "Referral being responded to",
            "placeholder": "Referral being responded to"
          },
          {
            "name": "patient_arrived",
            "label": "Patient arrived",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "arrival_date",
            "label": "Arrival date",
            "type": "date",
            "required": false,
            "helper": "Date patient presented at receiving facility"
          },
          {
            "name": "assessment_findings",
            "label": "Assessment findings",
            "type": "textarea",
            "required": true,
            "helper": "Specialist assessment at receiving facility"
          },
          {
            "name": "diagnosis_confirmed",
            "label": "Diagnosis confirmed",
            "type": "text",
            "required": true,
            "helper": "Confirmed or revised diagnosis",
            "placeholder": "Confirmed or revised diagnosis"
          },
          {
            "name": "treatment_given",
            "label": "Treatment given",
            "type": "textarea",
            "required": true,
            "helper": "Interventions performed at receiving facility"
          },
          {
            "name": "outcome",
            "label": "Outcome",
            "type": "select",
            "required": true,
            "helper": "Admitted | Treated and returned | Ongoing follow-up | Deceased",
            "options": [
              "Admitted",
              "Treated and returned",
              "Ongoing follow-up",
              "Deceased"
            ]
          },
          {
            "name": "patient_returned_to_referring_facility",
            "label": "Patient returned to referring facility",
            "type": "text",
            "required": false,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          }
        ]
      }
    ]
  },
  "documents": {
    "forms": [
      {
        "name": "Document Upload Form",
        "description": "Capture document upload details.",
        "fields": [
          {
            "name": "document_type",
            "label": "Document type",
            "type": "select",
            "required": true,
            "helper": "Clinical | Financial | Legal | HR | Administrative | Consent | Referral | Insurance",
            "options": [
              "Clinical",
              "Financial",
              "Legal",
              "HR",
              "Administrative",
              "Consent",
              "Referral",
              "Insurance"
            ]
          },
          {
            "name": "document_title",
            "label": "Document title",
            "type": "text",
            "required": true,
            "helper": "Descriptive title",
            "placeholder": "Descriptive title"
          },
          {
            "name": "file_upload",
            "label": "File upload",
            "type": "text",
            "required": true,
            "helper": "PDF, image, or Office document - max 50 MB",
            "placeholder": "PDF, image, or Office document - max 50 MB"
          },
          {
            "name": "linked_patient",
            "label": "Linked patient",
            "type": "text",
            "required": false,
            "helper": "Patient MRN if patient-related document",
            "placeholder": "Patient MRN if patient-related document"
          },
          {
            "name": "linked_encounter",
            "label": "Linked encounter",
            "type": "select",
            "required": false,
            "helper": "Specific encounter if applicable"
          },
          {
            "name": "linked_staff",
            "label": "Linked staff",
            "type": "select",
            "required": false,
            "helper": "Staff record if HR document"
          },
          {
            "name": "tags",
            "label": "Tags",
            "type": "text",
            "required": false,
            "helper": "Keywords for searchability",
            "placeholder": "Keywords for searchability"
          },
          {
            "name": "access_level",
            "label": "Access level",
            "type": "select",
            "required": true,
            "helper": "Public | Clinical only | Restricted | Confidential",
            "options": [
              "Public",
              "Clinical only",
              "Restricted",
              "Confidential"
            ]
          },
          {
            "name": "expiry_date",
            "label": "Expiry date",
            "type": "date",
            "required": false,
            "helper": "For time-limited documents like insurance pre-auth letters"
          }
        ]
      }
    ]
  },
  "messaging": {
    "forms": [
      {
        "name": "Notification Template Form",
        "description": "Capture notification template details.",
        "fields": [
          {
            "name": "template_code",
            "label": "Template code",
            "type": "text",
            "required": true,
            "helper": "Unique identifier e.g. APPOINTMENT_REMINDER",
            "placeholder": "Unique identifier e.g. APPOINTMENT_REMINDER"
          },
          {
            "name": "channel",
            "label": "Channel",
            "type": "select",
            "required": true,
            "helper": "SMS | WhatsApp | Email | All",
            "options": [
              "SMS",
              "WhatsApp",
              "Email",
              "All"
            ]
          },
          {
            "name": "language",
            "label": "Language",
            "type": "select",
            "required": true,
            "helper": "English | Swahili",
            "options": [
              "English",
              "Swahili"
            ]
          },
          {
            "name": "subject_line",
            "label": "Subject line",
            "type": "text",
            "required": false,
            "helper": "Email subject - not needed for SMS",
            "placeholder": "Email subject - not needed for SMS"
          },
          {
            "name": "message_body",
            "label": "Message body",
            "type": "textarea",
            "required": true,
            "helper": "Message with placeholders e.g. Dear {{patient_name}}, your appointment is on {{date}}"
          },
          {
            "name": "whatsapp_template_name",
            "label": "WhatsApp template name",
            "type": "text",
            "required": false,
            "helper": "Approved WhatsApp Business API template name",
            "placeholder": "Approved WhatsApp Business API template name"
          }
        ]
      },
      {
        "name": "Manual Notification Form",
        "description": "Capture manual notification details.",
        "fields": [
          {
            "name": "recipient",
            "label": "Recipient",
            "type": "text",
            "required": true,
            "helper": "Patient or staff member to notify",
            "placeholder": "Patient or staff member to notify"
          },
          {
            "name": "channel",
            "label": "Channel",
            "type": "select",
            "required": true,
            "helper": "SMS | WhatsApp | Email",
            "options": [
              "SMS",
              "WhatsApp",
              "Email"
            ]
          },
          {
            "name": "message",
            "label": "Message",
            "type": "textarea",
            "required": true,
            "helper": "Custom message - or select from templates"
          },
          {
            "name": "template",
            "label": "Template",
            "type": "select",
            "required": false,
            "helper": "Select a pre-approved template"
          },
          {
            "name": "send_now_or_schedule",
            "label": "Send now or schedule",
            "type": "text",
            "required": true,
            "helper": "Send immediately | Schedule for later",
            "placeholder": "Send immediately | Schedule for later"
          },
          {
            "name": "scheduled_time",
            "label": "Scheduled time",
            "type": "datetime",
            "required": false,
            "helper": "If scheduling - when to send"
          }
        ]
      }
    ]
  },
  "biomedical": {
    "forms": [
      {
        "name": "Medical Device Registration Form",
        "description": "Capture medical device registration details.",
        "fields": [
          {
            "name": "asset",
            "label": "Asset",
            "type": "select",
            "required": true,
            "helper": "Link to existing asset in facility_assets"
          },
          {
            "name": "device_class",
            "label": "Device class",
            "type": "select",
            "required": true,
            "helper": "Class A | B | C | D - Kenya MDA classification",
            "options": [
              "Class A",
              "B",
              "C",
              "D — Kenya MDA classification"
            ]
          },
          {
            "name": "intended_use",
            "label": "Intended use",
            "type": "textarea",
            "required": true,
            "helper": "Manufacturer's intended medical purpose"
          },
          {
            "name": "udi",
            "label": "UDI",
            "type": "text",
            "required": true,
            "helper": "Unique Device Identifier - from device label",
            "placeholder": "Unique Device Identifier - from device label"
          },
          {
            "name": "gmdn_code",
            "label": "GMDN code",
            "type": "text",
            "required": false,
            "helper": "Global Medical Device Nomenclature code",
            "placeholder": "Global Medical Device Nomenclature code"
          },
          {
            "name": "risk_classification",
            "label": "Risk classification",
            "type": "select",
            "required": true,
            "helper": "Low | Medium | High | Critical",
            "options": [
              "Low",
              "Medium",
              "High",
              "Critical"
            ]
          },
          {
            "name": "ppb_registration_number",
            "label": "PPB registration number",
            "type": "text",
            "required": false,
            "helper": "Kenya Pharmacy and Poisons Board approval",
            "placeholder": "Kenya Pharmacy and Poisons Board approval"
          },
          {
            "name": "is_single_use",
            "label": "Is single use",
            "type": "text",
            "required": true,
            "helper": "Yes - cannot be reprocessed | No - reusable",
            "placeholder": "Yes - cannot be reprocessed | No - reusable"
          },
          {
            "name": "max_reprocessing_cycles",
            "label": "Max reprocessing cycles",
            "type": "number",
            "required": false,
            "helper": "If reusable - manufacturer limit on reprocessing",
            "placeholder": "If reusable - manufacturer limit on reprocessing"
          },
          {
            "name": "software_version",
            "label": "Software version",
            "type": "text",
            "required": false,
            "helper": "Current firmware or software version",
            "placeholder": "Current firmware or software version"
          },
          {
            "name": "is_implantable",
            "label": "Is implantable",
            "type": "checkbox",
            "required": false,
            "helper": "Tick if device is implanted in patient body"
          }
        ]
      },
      {
        "name": "Calibration Record Form",
        "description": "Capture calibration record details.",
        "fields": [
          {
            "name": "asset",
            "label": "Asset",
            "type": "text",
            "required": true,
            "helper": "Device being calibrated",
            "placeholder": "Device being calibrated"
          },
          {
            "name": "calibration_type",
            "label": "Calibration type",
            "type": "select",
            "required": true,
            "helper": "Internal | External | Manufacturer | NIST-traceable",
            "options": [
              "Internal",
              "External",
              "Manufacturer",
              "NIST-traceable"
            ]
          },
          {
            "name": "calibration_date",
            "label": "Calibration date",
            "type": "date",
            "required": true,
            "helper": "Date performed"
          },
          {
            "name": "calibrating_technician",
            "label": "Calibrating technician",
            "type": "text",
            "required": true,
            "helper": "Name of calibrating person or company",
            "placeholder": "Name of calibrating person or company"
          },
          {
            "name": "reference_standard_used",
            "label": "Reference standard used",
            "type": "text",
            "required": true,
            "helper": "Traceable reference standard e.g. KEBS-certified thermometer",
            "placeholder": "Traceable reference standard e.g. KEBS-certified thermometer"
          },
          {
            "name": "pre_calibration_reading",
            "label": "Pre-calibration reading",
            "type": "text",
            "required": true,
            "helper": "Device reading before adjustment",
            "placeholder": "Device reading before adjustment"
          },
          {
            "name": "post_calibration_reading",
            "label": "Post-calibration reading",
            "type": "text",
            "required": true,
            "helper": "Device reading after calibration",
            "placeholder": "Device reading after calibration"
          },
          {
            "name": "within_tolerance",
            "label": "Within tolerance",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "adjustment_made",
            "label": "Adjustment made",
            "type": "text",
            "required": true,
            "helper": "Yes | No",
            "placeholder": "Yes | No"
          },
          {
            "name": "certificate_number",
            "label": "Certificate number",
            "type": "text",
            "required": false,
            "helper": "Calibration certificate reference",
            "placeholder": "Calibration certificate reference"
          },
          {
            "name": "next_calibration_due",
            "label": "Next calibration due",
            "type": "date",
            "required": true,
            "helper": "Next calibration date"
          }
        ]
      }
    ]
  },
  "migration": {
    "forms": [
      {
        "name": "Migration Job Setup Form",
        "description": "Capture migration job setup details.",
        "fields": [
          {
            "name": "source_system_name",
            "label": "Source system name",
            "type": "text",
            "required": true,
            "helper": "Name of the old HMIS being migrated from",
            "placeholder": "Name of the old HMIS being migrated from"
          },
          {
            "name": "source_type",
            "label": "Source type",
            "type": "select",
            "required": true,
            "helper": "Database | CSV | Excel | JSON | FHIR | API",
            "options": [
              "Database",
              "CSV",
              "Excel",
              "JSON",
              "FHIR",
              "API"
            ]
          },
          {
            "name": "connection_method",
            "label": "Connection method",
            "type": "select",
            "required": true,
            "helper": "Direct DB connection | File upload | API endpoint",
            "options": [
              "Direct DB connection",
              "File upload",
              "API endpoint"
            ]
          },
          {
            "name": "host_url",
            "label": "Host / URL",
            "type": "text",
            "required": false,
            "helper": "Database host or API URL if direct connection",
            "placeholder": "Database host or API URL if direct connection"
          },
          {
            "name": "database_name",
            "label": "Database name",
            "type": "text",
            "required": false,
            "helper": "Database name if direct DB connection",
            "placeholder": "Database name if direct DB connection"
          },
          {
            "name": "username",
            "label": "Username",
            "type": "text",
            "required": false,
            "helper": "Read-only database username",
            "placeholder": "Read-only database username"
          },
          {
            "name": "password",
            "label": "Password",
            "type": "password",
            "required": false,
            "helper": "Database password - encrypted immediately"
          },
          {
            "name": "port",
            "label": "Port",
            "type": "number",
            "required": false,
            "helper": "Database port if non-default",
            "placeholder": "Database port if non-default"
          },
          {
            "name": "upload_files",
            "label": "Upload files",
            "type": "text",
            "required": false,
            "helper": "For CSV/Excel/JSON/FHIR file-based migration",
            "placeholder": "For CSV/Excel/JSON/FHIR file-based migration"
          },
          {
            "name": "test_connection",
            "label": "Test connection",
            "type": "text",
            "required": true,
            "helper": "Verify source system is accessible before proceeding",
            "placeholder": "Verify source system is accessible before proceeding"
          }
        ]
      },
      {
        "name": "Field Mapping Form",
        "description": "Capture field mapping details.",
        "fields": [
          {
            "name": "source_table",
            "label": "Source table",
            "type": "text",
            "required": true,
            "helper": "Auto-populated from schema discovery",
            "placeholder": "Auto-populated from schema discovery"
          },
          {
            "name": "source_field",
            "label": "Source field",
            "type": "text",
            "required": true,
            "helper": "Source field name and detected type",
            "placeholder": "Source field name and detected type"
          },
          {
            "name": "target_table",
            "label": "Target table",
            "type": "select",
            "required": true,
            "helper": "Medilink target table"
          },
          {
            "name": "target_field",
            "label": "Target field",
            "type": "select",
            "required": true,
            "helper": "Medilink target field"
          },
          {
            "name": "conflict_type",
            "label": "Conflict type",
            "type": "text",
            "required": true,
            "helper": "Direct match | Type mismatch | Source only | Target only | Semantic",
            "placeholder": "Direct match | Type mismatch | Source only | Target only | Semantic"
          },
          {
            "name": "resolution",
            "label": "Resolution",
            "type": "select",
            "required": true,
            "helper": "Auto | Manual | AI assisted | Custom function | Discard | Extend",
            "options": [
              "Auto",
              "Manual",
              "AI assisted",
              "Custom function",
              "Discard",
              "Extend"
            ]
          },
          {
            "name": "transform_function",
            "label": "Transform function",
            "type": "text",
            "required": false,
            "helper": "Python or SQL transformation for Type 2 conflicts",
            "placeholder": "Python or SQL transformation for Type 2 conflicts"
          },
          {
            "name": "lookup_table",
            "label": "Lookup table",
            "type": "text",
            "required": false,
            "helper": "Value translation table for semantic conflicts e.g. 1→Male, 2→Female",
            "placeholder": "Value translation table for semantic conflicts e.g. 1→Male, 2→Female"
          }
        ]
      },
      {
        "name": "Validation Report Review Form",
        "description": "Capture validation report review details.",
        "fields": [
          {
            "name": "migration_job",
            "label": "Migration job",
            "type": "text",
            "required": true,
            "helper": "Job being reviewed",
            "placeholder": "Job being reviewed"
          },
          {
            "name": "error_record",
            "label": "Error record",
            "type": "text",
            "required": true,
            "helper": "Source record with error",
            "placeholder": "Source record with error"
          },
          {
            "name": "error_type",
            "label": "Error type",
            "type": "text",
            "required": true,
            "helper": "Validation | Transformation | Reference | Duplicate | Encoding",
            "placeholder": "Validation | Transformation | Reference | Duplicate | Encoding"
          },
          {
            "name": "error_message",
            "label": "Error message",
            "type": "text",
            "required": true,
            "helper": "Detailed error description",
            "placeholder": "Detailed error description"
          },
          {
            "name": "resolution_action",
            "label": "Resolution action",
            "type": "select",
            "required": true,
            "helper": "Fix source data | Skip record | Manual entry | Map differently",
            "options": [
              "Fix source data",
              "Skip record",
              "Manual entry",
              "Map differently"
            ]
          },
          {
            "name": "resolution_notes",
            "label": "Resolution notes",
            "type": "text",
            "required": false,
            "helper": "How this error was resolved",
            "placeholder": "How this error was resolved"
          }
        ]
      },
      {
        "name": "Migration Approval Form",
        "description": "Capture migration approval details.",
        "fields": [
          {
            "name": "migration_job",
            "label": "Migration job",
            "type": "text",
            "required": true,
            "helper": "Job being approved for live migration",
            "placeholder": "Job being approved for live migration"
          },
          {
            "name": "dry_run_summary",
            "label": "Dry run summary",
            "type": "text",
            "required": true,
            "helper": "Records passed | Failed | Skipped",
            "placeholder": "Records passed | Failed | Skipped"
          },
          {
            "name": "snapshot_id",
            "label": "Snapshot ID",
            "type": "text",
            "required": true,
            "helper": "Pre-migration database snapshot reference - for rollback",
            "placeholder": "Pre-migration database snapshot reference - for rollback"
          },
          {
            "name": "schedule_migration",
            "label": "Schedule migration",
            "type": "datetime",
            "required": true,
            "helper": "When to run the live migration - typically overnight"
          },
          {
            "name": "migration_admin_approval",
            "label": "Migration admin approval",
            "type": "text",
            "required": true,
            "helper": "Tenant migration administrator sign-off",
            "placeholder": "Tenant migration administrator sign-off"
          },
          {
            "name": "medilink_engineer_approval",
            "label": "Medilink engineer approval",
            "type": "text",
            "required": true,
            "helper": "Medilink co-approval - dual authorisation required",
            "placeholder": "Medilink co-approval - dual authorisation required"
          }
        ]
      }
    ]
  },
  "quality-assurance": {
    "forms": [
      {
        "name": "Incident Report Form",
        "description": "Capture incident report details.",
        "fields": [
          {
            "name": "incident_date",
            "label": "Incident date",
            "type": "date",
            "required": true,
            "helper": "Date incident occurred"
          },
          {
            "name": "incident_time",
            "label": "Incident time",
            "type": "time",
            "required": false,
            "helper": "Approximate time if known"
          },
          {
            "name": "patient_involved",
            "label": "Patient involved",
            "type": "text",
            "required": false,
            "helper": "Patient MRN - blank for staff-only incidents",
            "placeholder": "Patient MRN - blank for staff-only incidents"
          },
          {
            "name": "location",
            "label": "Location",
            "type": "select",
            "required": true,
            "helper": "Department or area where incident occurred"
          },
          {
            "name": "incident_type",
            "label": "Incident type",
            "type": "select",
            "required": true,
            "helper": "Medication error | Fall | Pressure injury | Wrong site | HAI | Equipment failure | Near miss | Complaint",
            "options": [
              "Medication error",
              "Fall",
              "Pressure injury",
              "Wrong site",
              "HAI",
              "Equipment failure",
              "Near miss",
              "Complaint"
            ]
          },
          {
            "name": "severity",
            "label": "Severity",
            "type": "select",
            "required": true,
            "helper": "Near miss | Minor | Moderate | Major | Sentinel event",
            "options": [
              "Near miss",
              "Minor",
              "Moderate",
              "Major",
              "Sentinel event"
            ]
          },
          {
            "name": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "helper": "Detailed, factual account of what happened"
          },
          {
            "name": "immediate_actions_taken",
            "label": "Immediate actions taken",
            "type": "textarea",
            "required": true,
            "helper": "What was done immediately after the incident"
          },
          {
            "name": "patient_outcome",
            "label": "Patient outcome",
            "type": "text",
            "required": false,
            "helper": "Effect on patient if applicable",
            "placeholder": "Effect on patient if applicable"
          }
        ]
      },
      {
        "name": "Root Cause Analysis (RCA) Form",
        "description": "Capture root cause analysis (rca) details.",
        "fields": [
          {
            "name": "incident",
            "label": "Incident",
            "type": "text",
            "required": true,
            "helper": "Linked incident being investigated",
            "placeholder": "Linked incident being investigated"
          },
          {
            "name": "rca_team_members",
            "label": "RCA team members",
            "type": "text",
            "required": true,
            "helper": "All members of the investigation team",
            "placeholder": "All members of the investigation team"
          },
          {
            "name": "rca_methodology",
            "label": "RCA methodology",
            "type": "select",
            "required": true,
            "helper": "Fishbone | 5 Whys | FMEA | Fault tree | London Protocol",
            "options": [
              "Fishbone",
              "5 Whys",
              "FMEA",
              "Fault tree",
              "London Protocol"
            ]
          },
          {
            "name": "event_timeline",
            "label": "Event timeline",
            "type": "text",
            "required": true,
            "helper": "Chronological sequence of events - time, event, person",
            "placeholder": "Chronological sequence of events - time, event, person"
          },
          {
            "name": "contributing_factors",
            "label": "Contributing factors",
            "type": "text",
            "required": true,
            "helper": "Per category: Patient | Staff | Environment | Equipment | Communication",
            "placeholder": "Per category: Patient | Staff | Environment | Equipment | Communication"
          },
          {
            "name": "root_causes",
            "label": "Root causes",
            "type": "textarea",
            "required": true,
            "helper": "Identified fundamental causes"
          },
          {
            "name": "recommendations",
            "label": "Recommendations",
            "type": "text",
            "required": true,
            "helper": "Action, responsible person, due date, priority per recommendation",
            "placeholder": "Action, responsible person, due date, priority per recommendation"
          },
          {
            "name": "lessons_learned",
            "label": "Lessons learned",
            "type": "textarea",
            "required": true,
            "helper": "Key learnings for system-wide sharing"
          }
        ]
      },
      {
        "name": "Clinical Audit Form",
        "description": "Capture clinical audit details.",
        "fields": [
          {
            "name": "audit_title",
            "label": "Audit title",
            "type": "text",
            "required": true,
            "helper": "Name of the audit e.g. Hand Hygiene Compliance Audit",
            "placeholder": "Name of the audit e.g. Hand Hygiene Compliance Audit"
          },
          {
            "name": "audit_topic",
            "label": "Audit topic",
            "type": "text",
            "required": true,
            "helper": "Clinical area or process being audited",
            "placeholder": "Clinical area or process being audited"
          },
          {
            "name": "standard_or_criteria",
            "label": "Standard or criteria",
            "type": "textarea",
            "required": true,
            "helper": "What standard is being measured against"
          },
          {
            "name": "sample_size",
            "label": "Sample size",
            "type": "number",
            "required": true,
            "helper": "Number of records or observations in the audit",
            "placeholder": "Number of records or observations in the audit"
          },
          {
            "name": "audit_period",
            "label": "Audit period",
            "type": "text",
            "required": true,
            "helper": "Data collection period",
            "placeholder": "Data collection period"
          },
          {
            "name": "audit_findings",
            "label": "Audit findings",
            "type": "text",
            "required": true,
            "helper": "Per criterion: compliance %, numerator, denominator, notes",
            "placeholder": "Per criterion: compliance %, numerator, denominator, notes"
          },
          {
            "name": "recommendations",
            "label": "Recommendations",
            "type": "textarea",
            "required": true,
            "helper": "What needs to change based on findings"
          },
          {
            "name": "action_plan",
            "label": "Action plan",
            "type": "text",
            "required": true,
            "helper": "Specific actions with owner and due date",
            "placeholder": "Specific actions with owner and due date"
          },
          {
            "name": "re_audit_date",
            "label": "Re-audit date",
            "type": "date",
            "required": true,
            "helper": "When to re-audit to measure improvement"
          }
        ]
      },
      {
        "name": "Accreditation Checklist Form",
        "description": "Capture accreditation checklist details.",
        "fields": [
          {
            "name": "accreditation_body",
            "label": "Accreditation body",
            "type": "select",
            "required": true,
            "helper": "KQMH | JCI | ISO 9001 | SafeCare | WHO SARA",
            "options": [
              "KQMH",
              "JCI",
              "ISO 9001",
              "SafeCare",
              "WHO SARA"
            ]
          },
          {
            "name": "standard_code",
            "label": "Standard code",
            "type": "text",
            "required": true,
            "helper": "Standard item code",
            "placeholder": "Standard item code"
          },
          {
            "name": "requirement",
            "label": "Requirement",
            "type": "text",
            "required": true,
            "helper": "Full standard requirement text",
            "placeholder": "Full standard requirement text"
          },
          {
            "name": "compliance_status",
            "label": "Compliance status",
            "type": "select",
            "required": true,
            "helper": "Compliant | Partially compliant | Non-compliant | Not applicable",
            "options": [
              "Compliant",
              "Partially compliant",
              "Non-compliant",
              "Not applicable"
            ]
          },
          {
            "name": "evidence_description",
            "label": "Evidence description",
            "type": "textarea",
            "required": true,
            "helper": "What evidence demonstrates compliance"
          },
          {
            "name": "evidence_documents",
            "label": "Evidence documents",
            "type": "text",
            "required": false,
            "helper": "Upload supporting documents",
            "placeholder": "Upload supporting documents"
          },
          {
            "name": "gap_description",
            "label": "Gap description",
            "type": "textarea",
            "required": false,
            "helper": "What is missing for full compliance - required if not compliant"
          },
          {
            "name": "target_compliance_date",
            "label": "Target compliance date",
            "type": "date",
            "required": false,
            "helper": "When full compliance will be achieved"
          }
        ]
      }
    ]
  },
  "workforce-planning": {
    "forms": [
      {
        "name": "Staffing Forecast Form",
        "description": "Capture staffing forecast details.",
        "fields": [
          {
            "name": "department",
            "label": "Department",
            "type": "select",
            "required": true,
            "helper": "Department being forecasted"
          },
          {
            "name": "forecast_period",
            "label": "Forecast period",
            "type": "text",
            "required": true,
            "helper": "Month being forecasted",
            "placeholder": "Month being forecasted"
          },
          {
            "name": "forecast_horizon_months",
            "label": "Forecast horizon (months)",
            "type": "number",
            "required": true,
            "helper": "How many months ahead e.g. 3 | 6 | 12",
            "placeholder": "How many months ahead e.g. 3 | 6 | 12"
          },
          {
            "name": "expected_patient_volume",
            "label": "Expected patient volume",
            "type": "number",
            "required": true,
            "helper": "Predicted patient encounters or bed-days",
            "placeholder": "Predicted patient encounters or bed-days"
          },
          {
            "name": "required_staffing_by_cadre",
            "label": "Required staffing by cadre",
            "type": "text",
            "required": true,
            "helper": "Doctors | Nurses | Technicians | Admin - required count",
            "placeholder": "Doctors | Nurses | Technicians | Admin - required count"
          },
          {
            "name": "current_staffing_by_cadre",
            "label": "Current staffing by cadre",
            "type": "text",
            "required": true,
            "helper": "Auto-pulled from HR active headcount",
            "placeholder": "Auto-pulled from HR active headcount"
          },
          {
            "name": "forecast_model",
            "label": "Forecast model",
            "type": "select",
            "required": true,
            "helper": "Historical trend | Acuity-based | AI forecast",
            "options": [
              "Historical trend",
              "Acuity-based",
              "AI forecast"
            ]
          },
          {
            "name": "recommendations",
            "label": "Recommendations",
            "type": "textarea",
            "required": true,
            "helper": "Recruitment, redeployment, or training recommendations"
          }
        ]
      }
    ]
  },
  "paediatrics": {
    "forms": [
      {
        "name": "Growth Monitoring Form",
        "description": "Capture growth monitoring details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - child patient",
            "placeholder": "Auto-filled - child patient"
          },
          {
            "name": "age_months",
            "label": "Age (months)",
            "type": "text",
            "required": true,
            "helper": "Auto-calculated from date of birth",
            "placeholder": "Auto-calculated from date of birth"
          },
          {
            "name": "weight_kg",
            "label": "Weight (kg)",
            "type": "number",
            "required": true,
            "helper": "Weight to 3 decimal places for infants",
            "placeholder": "Weight to 3 decimal places for infants"
          },
          {
            "name": "height_length_cm",
            "label": "Height / Length (cm)",
            "type": "number",
            "required": true,
            "helper": "Recumbent length for under 2 years, standing height for ≥2",
            "placeholder": "Recumbent length for under 2 years, standing height for ≥2"
          },
          {
            "name": "head_circumference_cm",
            "label": "Head circumference (cm)",
            "type": "number",
            "required": false,
            "helper": "For children under 5 years",
            "placeholder": "For children under 5 years"
          },
          {
            "name": "muac_cm",
            "label": "MUAC (cm)",
            "type": "number",
            "required": false,
            "helper": "Mid-upper arm circumference - SAM screening",
            "placeholder": "Mid-upper arm circumference - SAM screening"
          },
          {
            "name": "oedema_present",
            "label": "Oedema present",
            "type": "checkbox",
            "required": true,
            "helper": "Bilateral pitting oedema - sign of kwashiorkor"
          },
          {
            "name": "weight_for_age_z_score",
            "label": "Weight-for-age z-score",
            "type": "text",
            "required": true,
            "helper": "Auto-calculated from WHO Child Growth Standards",
            "placeholder": "Auto-calculated from WHO Child Growth Standards"
          },
          {
            "name": "height_for_age_z_score",
            "label": "Height-for-age z-score",
            "type": "text",
            "required": true,
            "helper": "Stunting indicator",
            "placeholder": "Stunting indicator"
          },
          {
            "name": "weight_for_height_z_score",
            "label": "Weight-for-height z-score",
            "type": "text",
            "required": true,
            "helper": "Wasting indicator",
            "placeholder": "Wasting indicator"
          },
          {
            "name": "nutritional_status",
            "label": "Nutritional status",
            "type": "text",
            "required": true,
            "helper": "Normal | Mild | Moderate | Severe malnutrition | Overweight",
            "placeholder": "Normal | Mild | Moderate | Severe malnutrition | Overweight"
          }
        ]
      },
      {
        "name": "Immunisation Record Form",
        "description": "Capture immunisation record details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Child patient - auto-filled",
            "placeholder": "Child patient - auto-filled"
          },
          {
            "name": "vaccine",
            "label": "Vaccine",
            "type": "select",
            "required": true,
            "helper": "BCG | OPV0 | HepB birth | Penta | PCV | Rota | MR | Yellow Fever | Others",
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
            ]
          },
          {
            "name": "dose_number",
            "label": "Dose number",
            "type": "select",
            "required": true,
            "helper": "Dose 1 | 2 | 3 | Booster per Kenya EPI schedule",
            "options": [
              "Dose 1",
              "2",
              "3",
              "Booster per Kenya EPI schedule"
            ]
          },
          {
            "name": "date_administered",
            "label": "Date administered",
            "type": "date",
            "required": true,
            "helper": "Date vaccine was given"
          },
          {
            "name": "batch_number",
            "label": "Batch number",
            "type": "text",
            "required": true,
            "helper": "Vaccine batch for traceability",
            "placeholder": "Vaccine batch for traceability"
          },
          {
            "name": "expiry_date",
            "label": "Expiry date",
            "type": "date",
            "required": true,
            "helper": "Vaccine vial expiry date"
          },
          {
            "name": "administration_site",
            "label": "Administration site",
            "type": "select",
            "required": true,
            "helper": "Left deltoid | Right anterolateral thigh | Oral",
            "options": [
              "Left deltoid",
              "Right anterolateral thigh",
              "Oral"
            ]
          },
          {
            "name": "route",
            "label": "Route",
            "type": "select",
            "required": true,
            "helper": "IM | SC | ID | Oral | Intranasal",
            "options": [
              "IM",
              "SC",
              "ID",
              "Oral",
              "Intranasal"
            ]
          },
          {
            "name": "administered_by",
            "label": "Administered by",
            "type": "text",
            "required": true,
            "helper": "Auto-filled - vaccinating nurse",
            "placeholder": "Auto-filled - vaccinating nurse"
          },
          {
            "name": "adverse_reaction_noted",
            "label": "Adverse reaction noted",
            "type": "text",
            "required": false,
            "helper": "Any immediate adverse events observed",
            "placeholder": "Any immediate adverse events observed"
          }
        ]
      },
      {
        "name": "IMCI Assessment Form",
        "description": "Capture imci assessment details.",
        "fields": [
          {
            "name": "age_of_child",
            "label": "Age of child",
            "type": "text",
            "required": true,
            "helper": "Auto-calculated - IMCI applies to 2 months to 5 years",
            "placeholder": "Auto-calculated - IMCI applies to 2 months to 5 years"
          },
          {
            "name": "danger_signs",
            "label": "Danger signs",
            "type": "text",
            "required": true,
            "helper": "Cannot feed | Vomits everything | Convulsions | Lethargic/unconscious",
            "placeholder": "Cannot feed | Vomits everything | Convulsions | Lethargic/unconscious"
          },
          {
            "name": "main_symptoms",
            "label": "Main symptoms",
            "type": "text",
            "required": true,
            "helper": "Cough | Diarrhoea | Fever | Ear problem | Malnutrition/anaemia",
            "placeholder": "Cough | Diarrhoea | Fever | Ear problem | Malnutrition/anaemia"
          },
          {
            "name": "cough_duration_days",
            "label": "Cough duration (days)",
            "type": "number",
            "required": false,
            "helper": "If cough present",
            "placeholder": "If cough present"
          },
          {
            "name": "diarrhoea_duration_days",
            "label": "Diarrhoea duration (days)",
            "type": "number",
            "required": false,
            "helper": "If diarrhoea present",
            "placeholder": "If diarrhoea present"
          },
          {
            "name": "fever_duration_days",
            "label": "Fever duration (days)",
            "type": "number",
            "required": false,
            "helper": "If fever present",
            "placeholder": "If fever present"
          },
          {
            "name": "malaria_rdt_result",
            "label": "Malaria RDT result",
            "type": "select",
            "required": false,
            "helper": "Positive | Negative | Not done",
            "options": [
              "Positive",
              "Negative",
              "Not done"
            ]
          },
          {
            "name": "imci_classification",
            "label": "IMCI classification",
            "type": "text",
            "required": true,
            "helper": "IMCI disease classification based on findings",
            "placeholder": "IMCI disease classification based on findings"
          },
          {
            "name": "treatment",
            "label": "Treatment",
            "type": "text",
            "required": true,
            "helper": "IMCI standard treatment per classification",
            "placeholder": "IMCI standard treatment per classification"
          }
        ]
      }
    ]
  },
  "home-care": {
    "forms": [
      {
        "name": "Home Care Plan Form",
        "description": "Capture home care plan details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Discharged patient - auto-filled",
            "placeholder": "Discharged patient - auto-filled"
          },
          {
            "name": "linked_discharge_summary",
            "label": "Linked discharge summary",
            "type": "text",
            "required": false,
            "helper": "Auto-linked from discharge",
            "placeholder": "Auto-linked from discharge"
          },
          {
            "name": "assigned_nurse",
            "label": "Assigned nurse",
            "type": "select",
            "required": true,
            "helper": "Primary home care nurse"
          },
          {
            "name": "start_date",
            "label": "Start date",
            "type": "date",
            "required": true,
            "helper": "Home care commencement date"
          },
          {
            "name": "services_required",
            "label": "Services required",
            "type": "text",
            "required": true,
            "helper": "Wound care | Medication | Physiotherapy | Palliative | Monitoring | Dialysis",
            "placeholder": "Wound care | Medication | Physiotherapy | Palliative | Monitoring | Dialysis"
          },
          {
            "name": "visit_frequency",
            "label": "Visit frequency",
            "type": "select",
            "required": true,
            "helper": "Daily | Alternate days | Twice weekly | Weekly",
            "options": [
              "Daily",
              "Alternate days",
              "Twice weekly",
              "Weekly"
            ]
          },
          {
            "name": "equipment_to_provide",
            "label": "Equipment to provide",
            "type": "text",
            "required": false,
            "helper": "Equipment name, delivery date, return date",
            "placeholder": "Equipment name, delivery date, return date"
          },
          {
            "name": "goals",
            "label": "Goals",
            "type": "textarea",
            "required": true,
            "helper": "Recovery targets and measurable outcomes"
          },
          {
            "name": "emergency_escalation_plan",
            "label": "Emergency escalation plan",
            "type": "textarea",
            "required": true,
            "helper": "Criteria for calling for help and contact numbers"
          }
        ]
      },
      {
        "name": "Home Visit Record Form",
        "description": "Capture home visit record details.",
        "fields": [
          {
            "name": "care_plan",
            "label": "Care plan",
            "type": "text",
            "required": true,
            "helper": "Auto-linked plan",
            "placeholder": "Auto-linked plan"
          },
          {
            "name": "visit_date",
            "label": "Visit date",
            "type": "date",
            "required": true,
            "helper": "Date of visit"
          },
          {
            "name": "gps_location",
            "label": "GPS location",
            "type": "text",
            "required": true,
            "helper": "Auto-capture GPS at visit - confirms home location",
            "placeholder": "Auto-capture GPS at visit - confirms home location"
          },
          {
            "name": "visit_start_time",
            "label": "Visit start time",
            "type": "time",
            "required": true,
            "helper": "Arrival time"
          },
          {
            "name": "visit_end_time",
            "label": "Visit end time",
            "type": "time",
            "required": true,
            "helper": "Departure time"
          },
          {
            "name": "vital_signs",
            "label": "Vital signs",
            "type": "text",
            "required": true,
            "helper": "BP | HR | Temp | SpO2 | Weight",
            "placeholder": "BP | HR | Temp | SpO2 | Weight"
          },
          {
            "name": "clinical_findings",
            "label": "Clinical findings",
            "type": "textarea",
            "required": true,
            "helper": "Assessment findings"
          },
          {
            "name": "interventions_performed",
            "label": "Interventions performed",
            "type": "textarea",
            "required": true,
            "helper": "Care activities done - wound care, injections, monitoring"
          },
          {
            "name": "medications_given",
            "label": "Medications given",
            "type": "text",
            "required": false,
            "helper": "Drugs administered during visit",
            "placeholder": "Drugs administered during visit"
          },
          {
            "name": "patient_concerns",
            "label": "Patient concerns",
            "type": "text",
            "required": false,
            "helper": "Issues raised by patient or caregiver",
            "placeholder": "Issues raised by patient or caregiver"
          },
          {
            "name": "escalation_required",
            "label": "Escalation required",
            "type": "text",
            "required": true,
            "helper": "Yes - needs hospital | No - continue at home",
            "placeholder": "Yes - needs hospital | No - continue at home"
          },
          {
            "name": "escalation_reason",
            "label": "Escalation reason",
            "type": "text",
            "required": false,
            "helper": "Clinical reason if escalation needed",
            "placeholder": "Clinical reason if escalation needed"
          }
        ]
      }
    ]
  },
  "clinical-research": {
    "forms": [
      {
        "name": "Research Protocol Registration Form",
        "description": "Capture research protocol registration details.",
        "fields": [
          {
            "name": "protocol_number",
            "label": "Protocol number",
            "type": "text",
            "required": true,
            "helper": "Unique protocol identifier",
            "placeholder": "Unique protocol identifier"
          },
          {
            "name": "full_title",
            "label": "Full title",
            "type": "textarea",
            "required": true,
            "helper": "Complete protocol title"
          },
          {
            "name": "short_title",
            "label": "Short title",
            "type": "text",
            "required": true,
            "helper": "Abbreviated title for display",
            "placeholder": "Abbreviated title for display"
          },
          {
            "name": "study_type",
            "label": "Study type",
            "type": "select",
            "required": true,
            "helper": "Interventional | Observational | Diagnostic | Registry | Survey",
            "options": [
              "Interventional",
              "Observational",
              "Diagnostic",
              "Registry",
              "Survey"
            ]
          },
          {
            "name": "phase",
            "label": "Phase",
            "type": "select",
            "required": false,
            "helper": "I | II | III | IV | Not applicable - for clinical trials",
            "options": [
              "I",
              "II",
              "III",
              "IV",
              "Not applicable — for clinical trials"
            ]
          },
          {
            "name": "sponsor",
            "label": "Sponsor",
            "type": "text",
            "required": true,
            "helper": "Funding organisation or sponsor",
            "placeholder": "Funding organisation or sponsor"
          },
          {
            "name": "principal_investigator",
            "label": "Principal investigator",
            "type": "select",
            "required": true,
            "helper": "Select from qualified staff"
          },
          {
            "name": "irb_approval_number",
            "label": "IRB approval number",
            "type": "text",
            "required": true,
            "helper": "Ethics committee approval reference",
            "placeholder": "Ethics committee approval reference"
          },
          {
            "name": "irb_approval_date",
            "label": "IRB approval date",
            "type": "date",
            "required": true,
            "helper": "Date ethics approval was granted"
          },
          {
            "name": "irb_expiry_date",
            "label": "IRB expiry date",
            "type": "date",
            "required": true,
            "helper": "Ethics approval expiry - system sends renewal alerts"
          },
          {
            "name": "target_enrolment",
            "label": "Target enrolment",
            "type": "number",
            "required": true,
            "helper": "Number of participants to recruit",
            "placeholder": "Number of participants to recruit"
          },
          {
            "name": "inclusion_criteria",
            "label": "Inclusion criteria",
            "type": "textarea",
            "required": true,
            "helper": "Who may participate"
          },
          {
            "name": "exclusion_criteria",
            "label": "Exclusion criteria",
            "type": "textarea",
            "required": true,
            "helper": "Who may not participate"
          }
        ]
      },
      {
        "name": "Patient Enrolment Form",
        "description": "Capture patient enrolment details.",
        "fields": [
          {
            "name": "patient",
            "label": "Patient",
            "type": "text",
            "required": true,
            "helper": "Patient MRN - check inclusion/exclusion criteria",
            "placeholder": "Patient MRN - check inclusion/exclusion criteria"
          },
          {
            "name": "protocol",
            "label": "Protocol",
            "type": "text",
            "required": true,
            "helper": "Study being enrolled into",
            "placeholder": "Study being enrolled into"
          },
          {
            "name": "screen_date",
            "label": "Screen date",
            "type": "date",
            "required": true,
            "helper": "Date screening was performed"
          },
          {
            "name": "screening_passed",
            "label": "Screening passed",
            "type": "text",
            "required": true,
            "helper": "Yes - enrol | No - screen failure",
            "placeholder": "Yes - enrol | No - screen failure"
          },
          {
            "name": "screen_failure_reason",
            "label": "Screen failure reason",
            "type": "text",
            "required": false,
            "helper": "If failed - which criterion was not met",
            "placeholder": "If failed - which criterion was not met"
          },
          {
            "name": "consent_record",
            "label": "Consent record",
            "type": "text",
            "required": true,
            "helper": "Research consent must be recorded first",
            "placeholder": "Research consent must be recorded first"
          },
          {
            "name": "study_arm",
            "label": "Study arm",
            "type": "select",
            "required": false,
            "helper": "Treatment | Placebo | Control - for randomised trials",
            "options": [
              "Treatment",
              "Placebo",
              "Control — for randomised trials"
            ]
          },
          {
            "name": "enrolment_date",
            "label": "Enrolment date",
            "type": "date",
            "required": true,
            "helper": "Date patient officially enrolled"
          }
        ]
      },
      {
        "name": "Adverse Event Report Form",
        "description": "Capture adverse event report details.",
        "fields": [
          {
            "name": "participant",
            "label": "Participant",
            "type": "text",
            "required": true,
            "helper": "Study participant",
            "placeholder": "Study participant"
          },
          {
            "name": "ae_description",
            "label": "AE description",
            "type": "textarea",
            "required": true,
            "helper": "Detailed description of adverse event"
          },
          {
            "name": "onset_date",
            "label": "Onset date",
            "type": "date",
            "required": true,
            "helper": "When the AE began"
          },
          {
            "name": "ctcae_grade",
            "label": "CTCAE grade",
            "type": "select",
            "required": true,
            "helper": "Grade 1 (mild) | 2 | 3 | 4 | 5 (death)",
            "options": [
              "Grade 1 (mild)",
              "2",
              "3",
              "4",
              "5 (death)"
            ]
          },
          {
            "name": "is_serious",
            "label": "Is serious",
            "type": "text",
            "required": true,
            "helper": "Yes (SAE) | No (AE) - serious = hospitalisation, life-threatening, death, disability",
            "placeholder": "Yes (SAE) | No (AE) - serious = hospitalisation, life-threatening, death, disability"
          },
          {
            "name": "sae_criteria_met",
            "label": "SAE criteria met",
            "type": "text",
            "required": false,
            "helper": "Death | Life-threatening | Hospitalisation | Disability | Congenital",
            "placeholder": "Death | Life-threatening | Hospitalisation | Disability | Congenital"
          },
          {
            "name": "relatedness_to_study",
            "label": "Relatedness to study",
            "type": "select",
            "required": true,
            "helper": "Unrelated | Unlikely | Possible | Probable | Definite",
            "options": [
              "Unrelated",
              "Unlikely",
              "Possible",
              "Probable",
              "Definite"
            ]
          },
          {
            "name": "action_taken",
            "label": "Action taken",
            "type": "select",
            "required": true,
            "helper": "None | Dose reduced | Drug stopped | Treated symptomatically",
            "options": [
              "None",
              "Dose reduced",
              "Drug stopped",
              "Treated symptomatically"
            ]
          },
          {
            "name": "outcome",
            "label": "Outcome",
            "type": "select",
            "required": true,
            "helper": "Resolved | Resolving | Not resolved | Fatal | Unknown",
            "options": [
              "Resolved",
              "Resolving",
              "Not resolved",
              "Fatal",
              "Unknown"
            ]
          },
          {
            "name": "reported_to_sponsor",
            "label": "Reported to sponsor",
            "type": "datetime",
            "required": false,
            "helper": "When SAE was reported to study sponsor - required within 24h for SAEs"
          }
        ]
      }
    ]
  },
  "reports": {
    "forms": [
      {
        "name": "Custom Report Builder Form",
        "description": "Capture custom report builder details.",
        "fields": [
          {
            "name": "report_name",
            "label": "Report name",
            "type": "text",
            "required": true,
            "helper": "Name for this report template",
            "placeholder": "Name for this report template"
          },
          {
            "name": "report_category",
            "label": "Report category",
            "type": "select",
            "required": true,
            "helper": "Clinical | Financial | HR | Quality | MOH Statutory | Management",
            "options": [
              "Clinical",
              "Financial",
              "HR",
              "Quality",
              "MOH Statutory",
              "Management"
            ]
          },
          {
            "name": "data_source_modules",
            "label": "Data source modules",
            "type": "text",
            "required": true,
            "helper": "Select modules to pull data from",
            "placeholder": "Select modules to pull data from"
          },
          {
            "name": "fields_to_include",
            "label": "Fields to include",
            "type": "text",
            "required": true,
            "helper": "Select specific fields from chosen modules",
            "placeholder": "Select specific fields from chosen modules"
          },
          {
            "name": "filter_criteria",
            "label": "Filter criteria",
            "type": "text",
            "required": false,
            "helper": "Date range, department, doctor, diagnosis code etc.",
            "placeholder": "Date range, department, doctor, diagnosis code etc."
          },
          {
            "name": "grouping",
            "label": "Grouping",
            "type": "select",
            "required": false,
            "helper": "Group results by: Department | Doctor | Date | Diagnosis",
            "options": [
              "Group results by: Department",
              "Doctor",
              "Date",
              "Diagnosis"
            ]
          },
          {
            "name": "aggregations",
            "label": "Aggregations",
            "type": "text",
            "required": false,
            "helper": "Count | Sum | Average | Min | Max",
            "placeholder": "Count | Sum | Average | Min | Max"
          },
          {
            "name": "output_format",
            "label": "Output format",
            "type": "select",
            "required": true,
            "helper": "PDF | Excel | CSV | Chart",
            "options": [
              "PDF",
              "Excel",
              "CSV",
              "Chart"
            ]
          },
          {
            "name": "schedule",
            "label": "Schedule",
            "type": "select",
            "required": false,
            "helper": "One-time | Daily | Weekly | Monthly",
            "options": [
              "One-time",
              "Daily",
              "Weekly",
              "Monthly"
            ]
          }
        ]
      },
      {
        "name": "Report Run Parameters Form",
        "description": "Capture report run parameters details.",
        "fields": [
          {
            "name": "report_template",
            "label": "Report template",
            "type": "text",
            "required": true,
            "helper": "Selected report",
            "placeholder": "Selected report"
          },
          {
            "name": "date_from",
            "label": "Date from",
            "type": "date",
            "required": true,
            "helper": "Start date for report data"
          },
          {
            "name": "date_to",
            "label": "Date to",
            "type": "date",
            "required": true,
            "helper": "End date for report data"
          },
          {
            "name": "department_filter",
            "label": "Department filter",
            "type": "select",
            "required": false,
            "helper": "Filter to specific department - blank for all"
          },
          {
            "name": "doctor_filter",
            "label": "Doctor filter",
            "type": "select",
            "required": false,
            "helper": "Filter to specific doctor - blank for all"
          },
          {
            "name": "output_format",
            "label": "Output format",
            "type": "select",
            "required": true,
            "helper": "PDF | Excel | CSV",
            "options": [
              "PDF",
              "Excel",
              "CSV"
            ]
          }
        ]
      }
    ]
  },
  "feedback": {
    "forms": [
      {
        "name": "Patient Satisfaction Survey Form",
        "description": "Capture patient satisfaction survey details.",
        "fields": [
          {
            "name": "visit_type",
            "label": "Visit type",
            "type": "select",
            "required": true,
            "helper": "OPD | Inpatient | Emergency | Telemedicine",
            "options": [
              "OPD",
              "Inpatient",
              "Emergency",
              "Telemedicine"
            ]
          },
          {
            "name": "overall_satisfaction",
            "label": "Overall satisfaction",
            "type": "text",
            "required": true,
            "helper": "1 (Very poor) to 5 (Excellent)",
            "placeholder": "1 (Very poor) to 5 (Excellent)"
          },
          {
            "name": "staff_attitude",
            "label": "Staff attitude",
            "type": "text",
            "required": false,
            "helper": "How staff treated you",
            "placeholder": "How staff treated you"
          },
          {
            "name": "cleanliness",
            "label": "Cleanliness",
            "type": "text",
            "required": false,
            "helper": "Cleanliness of facility",
            "placeholder": "Cleanliness of facility"
          },
          {
            "name": "wait_time",
            "label": "Wait time",
            "type": "text",
            "required": false,
            "helper": "How long you waited",
            "placeholder": "How long you waited"
          },
          {
            "name": "explanation_of_condition",
            "label": "Explanation of condition",
            "type": "text",
            "required": false,
            "helper": "How well your condition was explained",
            "placeholder": "How well your condition was explained"
          },
          {
            "name": "would_recommend_facility",
            "label": "Would recommend facility",
            "type": "text",
            "required": true,
            "helper": "0–10 Net Promoter Score",
            "placeholder": "0–10 Net Promoter Score"
          },
          {
            "name": "best_aspect",
            "label": "Best aspect",
            "type": "text",
            "required": false,
            "helper": "What you liked most",
            "placeholder": "What you liked most"
          },
          {
            "name": "improvement_suggestion",
            "label": "Improvement suggestion",
            "type": "textarea",
            "required": false,
            "helper": "What could be better"
          }
        ]
      },
      {
        "name": "Complaint / Compliment Form",
        "description": "Capture complaint / compliment details.",
        "fields": [
          {
            "name": "type",
            "label": "Type",
            "type": "select",
            "required": true,
            "helper": "Complaint | Compliment | Suggestion",
            "options": [
              "Complaint",
              "Compliment",
              "Suggestion"
            ]
          },
          {
            "name": "department_involved",
            "label": "Department involved",
            "type": "select",
            "required": true,
            "helper": "Department the feedback is about"
          },
          {
            "name": "date_of_incident",
            "label": "Date of incident",
            "type": "date",
            "required": false,
            "helper": "When the incident occurred if complaint"
          },
          {
            "name": "staff_involved",
            "label": "Staff involved",
            "type": "text",
            "required": false,
            "helper": "Name of staff if known - anonymous to them",
            "placeholder": "Name of staff if known - anonymous to them"
          },
          {
            "name": "description",
            "label": "Description",
            "type": "textarea",
            "required": true,
            "helper": "Detailed description of the compliment or complaint"
          },
          {
            "name": "preferred_resolution",
            "label": "Preferred resolution",
            "type": "text",
            "required": false,
            "helper": "What outcome patient would like if complaint",
            "placeholder": "What outcome patient would like if complaint"
          },
          {
            "name": "contact_for_follow_up",
            "label": "Contact for follow-up",
            "type": "text",
            "required": false,
            "helper": "Yes - contact me | No - anonymous",
            "placeholder": "Yes - contact me | No - anonymous"
          }
        ]
      }
    ]
  },
  "pos": {
    "forms": [
      {
        "name": "Retail Sale Form",
        "description": "Capture retail sale details.",
        "fields": [
          {
            "name": "customer_type",
            "label": "Customer type",
            "type": "select",
            "required": true,
            "helper": "Patient | Visitor | Staff | Walk-in",
            "options": [
              "Patient",
              "Visitor",
              "Staff",
              "Walk-in"
            ]
          },
          {
            "name": "patient_mrn",
            "label": "Patient MRN",
            "type": "text",
            "required": false,
            "helper": "If selling to registered patient",
            "placeholder": "If selling to registered patient"
          },
          {
            "name": "drug_item",
            "label": "Drug / item",
            "type": "text",
            "required": true,
            "helper": "Search from formulary or OTC list",
            "placeholder": "Search from formulary or OTC list"
          },
          {
            "name": "quantity",
            "label": "Quantity",
            "type": "number",
            "required": true,
            "helper": "Number of units to sell",
            "placeholder": "Number of units to sell"
          },
          {
            "name": "unit_price",
            "label": "Unit price",
            "type": "text",
            "required": true,
            "helper": "Auto-filled from formulary selling price",
            "placeholder": "Auto-filled from formulary selling price"
          },
          {
            "name": "payment_method",
            "label": "Payment method",
            "type": "select",
            "required": true,
            "helper": "Cash | MPESA | Card | Staff deduction",
            "options": [
              "Cash",
              "MPESA",
              "Card",
              "Staff deduction"
            ]
          },
          {
            "name": "mpesa_reference",
            "label": "MPESA reference",
            "type": "text",
            "required": false,
            "helper": "M-Pesa transaction code if MPESA payment",
            "placeholder": "M-Pesa transaction code if MPESA payment"
          },
          {
            "name": "print_receipt",
            "label": "Print receipt",
            "type": "checkbox",
            "required": true,
            "helper": "Auto-selected - generates receipt on confirm"
          }
        ]
      }
    ]
  }
};
