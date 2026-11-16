import React, { useEffect, useMemo, useRef, useState } from "react";
import "./PatientRegistrationForm.css";
import { Calendar, AlertTriangle, Check, CheckCircle2, Copy, Search, X } from "lucide-react";
import type { Patient } from "../../store/appStore";
import {
  createTenantPatient,
  updateTenantPatient,
  fetchTenantPatients,
  fetchTenantPatientDuplicateCheck,
  type BackendPatientInput,
} from "../../lib/apiClient";
import { useAppStore } from "../../store/appStore";

export interface PatientRegistrationFormProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onError?: (message: string) => void;
  onSaved?: (patient: Patient | null) => void;
  onSubmit?: (data: any) => Promise<any>;
  initialForm?: any;
  initialData?: any;
  editingPatient?: Patient | null;
}

const STEPS = [
  ["Identity", "Who the patient is", "Patient identity & demographics", "Capture identifying, demographic and contact details."],
  ["Safety", "Allergies & alerts", "Safety, allergies & clinical alerts", "Record allergies, chronic conditions, and care precautions."],
  ["Next of kin", "People to contact", "Relationships & next of kin", "Add emergency contacts and primary next of kin."],
  ["Coverage", "Payment & portal", "Coverage, insurance & portal", "Record payer, insurance policy, and communication preferences."],
  ["Review", "Check and register", "Review before registration", "Confirm information accuracy before saving to the HMIS database."],
] as const;

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Guardian",
  "Relative",
  "Friend",
  "Other",
];

const ALLERGY_STATUSES = [
  "Known allergies",
  "No known allergies",
  "Unknown",
  "Not assessed",
] as const;

type AllergyStatus = (typeof ALLERGY_STATUSES)[number];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

const KENYAN_COUNTIES = [
  "Nairobi", "Kiambu", "Mombasa", "Kisumu", "Nakuru", "Machakos", "Uasin Gishu",
  "Kilifi", "Kajiado", "Meru", "Nyeri", "Murang'a", "Kakamega", "Bungoma",
  "Trans Nzoia", "Kisii", "Homa Bay", "Garissa", "Embu", "Kericho", "Kitui",
  "Makueni", "Laikipia", "Nandi", "Baringo", "Narok", "Migori", "Siaya",
];

const COMMON_ALLERGENS = [
  "Penicillin",
  "Sulfa Drugs",
  "NSAIDs / Aspirin",
  "Cephalosporins",
  "Latex",
  "Peanuts",
  "Contrast Media",
  "Opioids / Morphine",
  "Local Anesthetics",
];

const COMMON_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Type 1 Diabetes",
  "Asthma",
  "Sickle Cell Disease",
  "Chronic Kidney Disease",
  "Epilepsy",
  "Cardiac Disease",
  "HIV / ART",
  "Tuberculosis (History)",
];

const VULNERABILITY_OPTIONS = [
  "Elderly 70+",
  "Pregnant",
  "Disability",
  "Requires wheelchair",
  "Requires interpreter",
  "Visual impairment",
  "Hearing impairment",
  "Fall Risk",
  "Isolation / Infection Risk",
];

const TOP_INSURERS = [
  "Social Health Authority (SHA / NHIF)",
  "Jubilee Insurance",
  "AAR Insurance",
  "APA Insurance",
  "CIC Insurance",
  "Britam",
  "Madison Insurance",
  "UAP Old Mutual",
  "First Assurance",
  "Resolution Insurance",
  "Heritage Insurance",
  "GA Insurance",
  "Sanlam",
  "Allianz",
  "Cigna Global",
  "Other",
];

interface AdditionalContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  role: string;
}

/**
 * Hybrid Date Field: Allows direct text typing (YYYY-MM-DD or DD/MM/YYYY)
 * OR clicking the calendar icon to pick a date from the native date picker.
 */
function HybridDateField({
  id,
  value,
  onChange,
  max,
  min,
  placeholder = "YYYY-MM-DD or DD/MM/YYYY",
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  max?: string;
  min?: string;
  placeholder?: string;
}) {
  const [typedText, setTypedText] = useState(value || "");
  const hiddenDateRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTypedText(value || "");
  }, [value]);

  const parseAndNotify = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      return;
    }
    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      onChange(trimmed);
      return;
    }
    // Check DD/MM/YYYY or DD-MM-YYYY
    const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, "0");
      const month = dmy[2].padStart(2, "0");
      const year = dmy[3];
      const iso = `${year}-${month}-${day}`;
      onChange(iso);
      return;
    }
    onChange(trimmed);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setTypedText(text);
    parseAndNotify(text);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.value;
    setTypedText(picked);
    onChange(picked);
  };

  const openPicker = () => {
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === "function") {
        try {
          hiddenDateRef.current.showPicker();
          return;
        } catch {
          // fallback
        }
      }
      hiddenDateRef.current.click();
    }
  };

  return (
    <div className="prf-date-hybrid">
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={typedText}
        onChange={handleTextChange}
      />
      <button
        type="button"
        className="prf-date-picker-btn"
        onClick={openPicker}
        title="Open calendar picker"
        tabIndex={-1}
      >
        <Calendar size={16} />
      </button>
      <input
        ref={hiddenDateRef}
        type="date"
        className="prf-date-native-hidden"
        value={/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""}
        max={max}
        min={min}
        onChange={handlePickerChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

const createInitialState = (initial?: any) => {
  const patient = initial?.patient ?? initial;
  const fullName = String(patient?.name || "").trim();
  const nameParts = fullName ? fullName.split(/\s+/).filter(Boolean) : [];

  const rawAllergies = patient?.allergies || "";
  let initialAllergyStatus: AllergyStatus = "Not assessed";
  if (patient?.allergyStatus) {
    initialAllergyStatus = patient.allergyStatus as AllergyStatus;
  } else if (rawAllergies && /no known|nka|nil/i.test(rawAllergies)) {
    initialAllergyStatus = "No known allergies";
  } else if (rawAllergies && rawAllergies.trim().length > 0 && !/unknown|not assessed/i.test(rawAllergies)) {
    initialAllergyStatus = "Known allergies";
  }

  const hasInsurance = Boolean(
    patient?.hasInsurance ||
      patient?.insuranceProvider ||
      patient?.insuranceNumber ||
      patient?.policyNumber ||
      patient?.payer === "Insurance",
  );

  return {
    // Step 0 - Identity
    regType: patient?.registrationType || "Standard registration",
    arrival: patient?.arrivalSource || "Walk-in",
    category: patient?.category || "",
    estimatedAge: patient?.estimatedAge || "",
    firstName: patient?.firstName || nameParts[0] || "",
    middleName: patient?.middleName || (nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""),
    lastName: patient?.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""),
    dob: patient?.dateOfBirth ? String(patient.dateOfBirth).slice(0, 10) : patient?.dob ? String(patient.dob).slice(0, 10) : "",
    sex: patient?.gender ? (patient.gender === "FEMALE" ? "Female" : patient.gender === "MALE" ? "Male" : patient.gender) : patient?.sex || "Female",
    marital: patient?.maritalStatus || patient?.marital || "",
    nationality: patient?.nationality || "Kenyan",
    countryOfBirth: patient?.countryOfBirth || "Kenya",
    preferredLanguage: patient?.preferredLanguage || "English",
    bloodGroup: patient?.bloodGroup || "",
    idType: patient?.idType || "National ID",
    idNumber: patient?.idNumber || patient?.nationalId || "",
    shaNumber: patient?.shaNumber || "",
    patientNo: patient?.patientNumber || patient?.mrn || patient?.regNo || "",
    religion: patient?.religion || "",
    occupation: patient?.occupation || "",
    educationLevel: patient?.educationLevel || "",
    photoUrl: patient?.photoUrl || patient?.photo_url || "",
    phone: patient?.phone || patient?.phonePrimary || "",
    altPhone: patient?.phoneSecondary || patient?.altPhone || "",
    email: patient?.email || "",
    county: patient?.county || "Nairobi",
    subCounty: patient?.subCounty || "",
    town: patient?.town || patient?.villageEstate || "",
    address: patient?.address || patient?.addressLine1 || "",

    // Step 1 - Safety
    allergyStatus: initialAllergyStatus,
    allergyType: patient?.allergyType || "Medication / drug",
    allergen: patient?.allergen || (rawAllergies && !/no known|nka|unknown/i.test(rawAllergies) ? rawAllergies : ""),
    reaction: patient?.reaction || "",
    severity: patient?.severity || patient?.allergySeverity || "Moderate",
    allergyNotes: patient?.allergyNotes || "",
    conditions: patient?.chronicConditions || patient?.conditions || "",
    vulnerabilityFlags: Array.isArray(patient?.vulnerabilityFlags) ? patient.vulnerabilityFlags : ([] as string[]),
    precautions: patient?.precautions || patient?.pastMedicalHistory || "",
    safetyNotes: patient?.safetyNotes || patient?.medicalHistory || "",

    // Step 2 - Next of Kin & Guardians
    kinName: patient?.nextOfKinName || patient?.kinName || "",
    kinRelationship: patient?.nextOfKinRelationship || patient?.kinRelationship || "Spouse",
    kinPhone: patient?.nextOfKinPhone || patient?.kinPhone || "",
    kinAltPhone: patient?.kinAltPhone || "",
    kinEmail: patient?.nextOfKinEmail || patient?.kinEmail || "",
    kinAddress: patient?.nextOfKinAddress || patient?.kinAddress || "",
    guardianName: patient?.guardianName || "",
    guardianRelationship: patient?.guardianRelationship || "",
    guardianAuthority: patient?.guardianAuthority || "",
    guardianPhone: patient?.guardianPhone || "",
    additionalContacts: [] as AdditionalContact[],

    // Step 3 - Coverage & Portal
    paymentType: patient?.paymentType || (hasInsurance ? "Insurance" : "Self-pay"),
    payer: patient?.payer || "",
    insurer: patient?.insuranceProvider || patient?.insuranceScheme || patient?.insurer || "Social Health Authority (SHA / NHIF)",
    memberNo: patient?.insuranceNumber || patient?.policyNumber || patient?.memberNo || "",
    memberName: patient?.insuranceMemberName || patient?.memberName || "",
    principal: patient?.principalIdNumber || patient?.principal || "",
    memberRelation: patient?.memberRelation || (patient?.isPrincipal === false ? "Dependent" : "Self"),
    policy: patient?.policyNumber || patient?.policy || "",
    policyStartDate: patient?.policyStartDate ? String(patient.policyStartDate).slice(0, 10) : "",
    expiry: patient?.policyExpiryDate ? String(patient.policyExpiryDate).slice(0, 10) : patient?.expiry || "",
    annualBenefitLimit: patient?.annualBenefitLimit || "",
    preAuthCode: patient?.preAuthCode || "",
    portal: patient?.portal || (patient?.portalAccessEnabled === false ? "Do not activate now" : "Invite patient to activate"),
    portalPhone: patient?.portalPhone || patient?.phone || "",
    preferredContact: patient?.preferredContact || "Phone / SMS",
    smsConsent: patient?.smsConsent !== false,
    emailConsent: Boolean(patient?.emailConsent),
    callConsent: patient?.callConsent !== false,
    whatsappConsent: Boolean(patient?.whatsappConsent),
    duplicateOverrideReason: patient?.duplicateOverrideReason || "",

    // Step 4 - Review
    confirmReview: false,
  };
};

export function PatientRegistrationForm({
  open,
  isOpen,
  onClose,
  onCancel,
  onError,
  onSaved,
  onSubmit,
  initialForm,
  initialData,
  editingPatient,
}: PatientRegistrationFormProps) {
  const isVisible = open ?? isOpen ?? true;
  const initial = editingPatient || initialData || initialForm;
  const { patients, setPatients, facility } = useAppStore();

  const [form, setForm] = useState(() => createInitialState(initial));
  const [cur, setCur] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrim, setShowScrim] = useState(false);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Duplicate patient state
  const [duplicatePatient, setDuplicatePatient] = useState<any>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string>("");
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);

  // Photo & webcam state
  const [photoStatus, setPhotoStatus] = useState<string>("");
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepTitleRef = useRef<HTMLHeadingElement>(null);

  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setWebcamActive(false);
  };

  const startWebcam = async () => {
    try {
      setPhotoStatus("Initializing camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setWebcamActive(true);
      setPhotoStatus("Camera active. Position patient and take snapshot.");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setPhotoStatus("Webcam access denied or unavailable.");
      stopWebcam();
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setDirty(true);
        setForm((prev) => ({ ...prev, photoUrl: dataUrl }));
        setPhotoStatus("Webcam photo captured successfully.");
      }
    } catch {
      setPhotoStatus("Failed to capture snapshot from camera.");
    } finally {
      stopWebcam();
    }
  };

  const handlePhotoUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDirty(true);
      setForm((prev) => ({ ...prev, photoUrl: String(reader.result || "") }));
      setPhotoStatus("Uploaded photo attached to patient record.");
    };
    reader.onerror = () => setPhotoStatus("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setDirty(true);
    setForm((prev) => ({ ...prev, photoUrl: "" }));
    setPhotoStatus("Photo removed.");
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      setForm(createInitialState(initial));
      setCur(0);
      setDirty(false);
      setErrors({});
      setShowScrim(false);
      setFinished(false);
      setDuplicatePatient(null);
      setDuplicateWarning("");
      setDuplicateDismissed(false);
    }
  }, [isVisible, initial]);

  // Real-time duplicate detection: Immediate local store check + debounced backend API check
  useEffect(() => {
    if (editingPatient || duplicateDismissed) return;

    const fn = form.firstName.trim().toLowerCase();
    const ln = form.lastName.trim().toLowerCase();
    const idNum = form.idNumber.trim().toLowerCase();
    const ph = form.phone.trim();
    const dob = form.dob.trim();

    const hasEnoughData = idNum.length >= 4 || ph.length >= 6 || (fn.length >= 2 && ln.length >= 2) || (fn.length >= 2 && dob.length >= 8);
    if (!hasEnoughData) {
      setDuplicatePatient(null);
      setDuplicateWarning("");
      return;
    }

    // 1. Immediate local in-memory check (0ms response)
    const localMatch = patients.find((p: Patient) => {
      if (idNum && p.nationalId && p.nationalId.trim().toLowerCase() === idNum) return true;
      if (ph && (p.phone === ph || (p as any).phonePrimary === ph)) return true;
      if (fn && ln && p.firstName && p.lastName) {
        if (p.firstName.trim().toLowerCase() === fn && p.lastName.trim().toLowerCase() === ln) return true;
      }
      return false;
    });

    if (localMatch) {
      setDuplicatePatient(localMatch);
      const matchName = localMatch.name || `${localMatch.firstName || ""} ${localMatch.lastName || ""}`.trim();
      const matchPhone = localMatch.phone || (localMatch as any).phonePrimary || "Phone N/A";
      const matchMRN = localMatch.regNo || (localMatch as any).patientCode || "MRN N/A";
      setDuplicateWarning(`Matching patient in local database: ${matchName} (${matchMRN}), Phone: ${matchPhone}.`);
      return;
    }

    // 2. Debounced server check (catches cross-workstation duplicates)
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetchTenantPatientDuplicateCheck({
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dob,
          nationalId: form.idNumber,
          phone: form.phone,
          email: form.email,
        });

        const matches = Array.isArray((res as any)?.matches)
          ? (res as any).matches
          : Array.isArray((res as any)?.sameFacilityMatches)
            ? (res as any).sameFacilityMatches
            : Array.isArray(res)
              ? res
              : [];
        const best = matches[0]?.patient || matches[0];
        if (best?.id) {
          setDuplicatePatient(best);
          const pName = [best.firstName, best.middleName, best.lastName].filter(Boolean).join(" ").trim();
          const pPhone = best.phonePrimary || best.phone || "N/A";
          const pDob = String(best.dateOfBirth || "").slice(0, 10);
          setDuplicateWarning(`Possible duplicate: ${pName || "Registered patient"}, DOB ${pDob || "N/A"}, Phone ${pPhone}.`);
        } else {
          setDuplicatePatient(null);
          setDuplicateWarning("");
        }
      } catch {
        // silent fail on network/backend check
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [form.firstName, form.lastName, form.idNumber, form.phone, form.dob, editingPatient, duplicateDismissed, patients]);

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const updateField = (field: string, value: any) => {
    setDirty(true);
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-compute estimatedAge from dob
      if (field === "dob" && value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const b = new Date(value);
        const n = new Date();
        let a = n.getFullYear() - b.getFullYear();
        if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
        if (a >= 0 && a <= 130) next.estimatedAge = String(a);
      }
      // Auto-compute dob if estimatedAge entered and no dob
      if (field === "estimatedAge" && value && !prev.dob) {
        const ageNum = parseInt(value, 10);
        if (!isNaN(ageNum) && ageNum > 0 && ageNum <= 130) {
          const d = new Date();
          d.setFullYear(d.getFullYear() - ageNum);
          next.dob = d.toISOString().slice(0, 10);
        }
      }
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const autofillFromDuplicate = (dup: any) => {
    if (!dup) return;
    setDirty(true);
    setForm((prev) => ({
      ...prev,
      firstName: dup.firstName || prev.firstName,
      middleName: dup.middleName || prev.middleName,
      lastName: dup.lastName || prev.lastName,
      dob: dup.dateOfBirth ? String(dup.dateOfBirth).slice(0, 10) : prev.dob,
      sex: dup.gender ? (dup.gender === "FEMALE" ? "Female" : dup.gender === "MALE" ? "Male" : dup.gender) : prev.sex,
      idNumber: dup.nationalId || dup.idNumber || prev.idNumber,
      phone: dup.phone || dup.phonePrimary || prev.phone,
      altPhone: dup.phoneSecondary || dup.altPhone || prev.altPhone,
      email: dup.email || prev.email,
      county: dup.county || prev.county,
      subCounty: dup.subCounty || prev.subCounty,
      town: dup.villageEstate || dup.town || prev.town,
      address: dup.address || dup.addressLine1 || prev.address,
      bloodGroup: dup.bloodGroup || prev.bloodGroup,
      patientNo: dup.regNo || dup.patientCode || prev.patientNo,
      photoUrl: dup.photoUrl || dup.photo_url || prev.photoUrl,
      countryOfBirth: dup.countryOfBirth || prev.countryOfBirth,
      preferredLanguage: dup.preferredLanguage || prev.preferredLanguage,
    }));
    setDuplicateDismissed(true);
    showToast("Details populated from existing record.");
  };

  const toggleVulnerabilityFlag = (flag: string) => {
    setDirty(true);
    setForm((prev) => {
      const exists = prev.vulnerabilityFlags.includes(flag);
      return {
        ...prev,
        vulnerabilityFlags: exists
          ? prev.vulnerabilityFlags.filter((f) => f !== flag)
          : [...prev.vulnerabilityFlags, flag],
      };
    });
  };

  const toggleConditionPill = (condition: string) => {
    setDirty(true);
    setForm((prev) => {
      const currentList = prev.conditions ? prev.conditions.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const exists = currentList.includes(condition);
      const updated = exists ? currentList.filter((c) => c !== condition) : [...currentList, condition];
      return { ...prev, conditions: updated.join(", ") };
    });
  };

  const selectAllergenPill = (allergen: string) => {
    setDirty(true);
    setForm((prev) => ({
      ...prev,
      allergen: prev.allergen ? `${prev.allergen}, ${allergen}` : allergen,
      allergyStatus: "Known allergies",
    }));
  };

  const calcAge = () => {
    if (form.dob && /^\d{4}-\d{2}-\d{2}$/.test(form.dob)) {
      const b = new Date(form.dob);
      const n = new Date();
      let a = n.getFullYear() - b.getFullYear();
      if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
      return a >= 0 ? `${a} yrs` : "";
    }
    return form.estimatedAge ? `~${form.estimatedAge} yrs` : "";
  };

  const bannerData = useMemo(() => {
    const fullName = [form.firstName, form.middleName, form.lastName]
      .filter(Boolean)
      .join(" ");
    const name = fullName || "New patient";
    const demo =
      [form.sex, calcAge(), form.bloodGroup].filter(Boolean).join(" · ") ||
      "Demographics not yet recorded";
    const phone = form.phone || "";

    const chipMap: Record<AllergyStatus, { cls: string; text: string }> = {
      "Known allergies": { cls: "bad", text: "Allergies: known" },
      "No known allergies": { cls: "ok", text: "No known allergies" },
      Unknown: { cls: "mid", text: "Allergies: unknown" },
      "Not assessed": { cls: "warn", text: "Allergies: not assessed" },
    };
    const chip = chipMap[form.allergyStatus] || chipMap["Not assessed"];

    return { name, demo, phone, chip };
  }, [form.firstName, form.middleName, form.lastName, form.sex, form.dob, form.estimatedAge, form.bloodGroup, form.phone, form.allergyStatus]);

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!form.firstName.trim()) newErrors.firstName = "Enter first name.";
      if (!form.lastName.trim()) newErrors.lastName = "Enter last name.";
      if (!form.sex) newErrors.sex = "Select sex.";
      if (!form.phone.trim()) newErrors.phone = "Enter primary phone.";
    }

    if (stepIndex === 1) {
      if (form.allergyStatus === "Known allergies" && !form.allergen.trim()) {
        newErrors.allergen = "Name the allergen, or select another allergy status.";
      }
    }

    if (stepIndex === 3) {
      if (form.paymentType === "Insurance" && !form.insurer) {
        newErrors.insurer = "Select insurance provider.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast("Complete the required fields to continue.");
      return false;
    }
    return true;
  };

  const goToStep = (targetStep: number) => {
    if (targetStep > cur) {
      for (let s = cur; s < targetStep; s++) {
        if (!validateStep(s)) {
          setCur(s);
          return;
        }
      }
    }
    setCur(targetStep);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    setTimeout(() => stepTitleRef.current?.focus(), 50);
  };

  const handleNext = () => {
    if (cur < STEPS.length - 1) {
      goToStep(cur + 1);
    }
  };

  const handleBack = () => {
    if (cur > 0) {
      goToStep(cur - 1);
    }
  };

  const handleAddContact = () => {
    const newContact: AdditionalContact = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      relationship: "Relative",
      phone: "",
      role: "Emergency contact",
    };
    setDirty(true);
    setForm((prev) => ({
      ...prev,
      additionalContacts: [...prev.additionalContacts, newContact],
    }));
  };

  const handleRemoveContact = (id: string) => {
    setDirty(true);
    setForm((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((c) => c.id !== id),
    }));
  };

  const handleUpdateContact = (id: string, field: keyof AdditionalContact, val: string) => {
    setDirty(true);
    setForm((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.map((c) =>
        c.id === id ? { ...c, [field]: val } : c
      ),
    }));
  };

  const handleRequestClose = () => {
    if (dirty && !finished) {
      setShowScrim(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowScrim(false);
    onCancel?.();
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.confirmReview) {
      setErrors((prev) => ({
        ...prev,
        confirmReview: "Confirm that you have reviewed the details.",
      }));
      showToast("Please check the confirmation box.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: BackendPatientInput = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        gender: form.sex === "Female" ? "FEMALE" : form.sex === "Male" ? "MALE" : "OTHER",
        dateOfBirth: form.dob || (form.estimatedAge ? new Date(new Date().getFullYear() - Number(form.estimatedAge), 0, 1).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
        bloodGroup: form.bloodGroup || undefined,
        photoUrl: form.photoUrl || undefined,
        countryOfBirth: form.countryOfBirth.trim() || undefined,
        preferredLanguage: form.preferredLanguage.trim() || undefined,
        maritalStatus: form.marital || undefined,
        occupation: form.occupation.trim() || undefined,
        county: form.county || undefined,
        nationalId: form.idNumber.trim() || undefined,
        idType: form.idType || undefined,
        idNumber: form.idNumber.trim() || undefined,
        shaNumber: form.shaNumber.trim() || undefined,
        nationality: form.nationality.trim() || "Kenyan",
        religion: form.religion.trim() || undefined,
        educationLevel: form.educationLevel || undefined,
        phone: form.phone.trim(),
        phonePrimary: form.phone.trim(),
        phoneSecondary: form.altPhone.trim() || undefined,
        email: form.email.trim() || undefined,
        subCounty: form.subCounty.trim() || form.county.trim() || undefined,
        villageEstate: form.town.trim() || undefined,
        address: form.address.trim() || undefined,
        addressLine1: form.address.trim() || undefined,
        allergies:
          form.allergyStatus === "Known allergies"
            ? [form.allergen, form.allergyType, form.reaction, form.severity, form.allergyNotes].filter(Boolean).join(" | ")
            : form.allergyStatus,
        chronicConditions: form.conditions.trim() || undefined,
        vulnerabilityFlags: form.vulnerabilityFlags.length > 0 ? form.vulnerabilityFlags : undefined,
        pastMedicalHistory: form.precautions.trim() || undefined,
        medicalHistory: form.safetyNotes.trim() || undefined,
        nextOfKinName: form.kinName.trim() || undefined,
        nextOfKinRelationship: form.kinRelationship || undefined,
        nextOfKinPhone: form.kinPhone.trim() || undefined,
        nextOfKinEmail: form.kinEmail.trim() || undefined,
        nextOfKinAddress: form.kinAddress.trim() || undefined,
        insuranceProvider: form.paymentType === "Insurance" ? form.insurer : form.payer.trim() || undefined,
        insuranceScheme: form.paymentType === "Insurance" ? form.insurer : undefined,
        insuranceNumber: form.memberNo.trim() || undefined,
        policyNumber: form.policy.trim() || form.memberNo.trim() || undefined,
        policyStartDate: form.policyStartDate || undefined,
        policyExpiryDate: form.expiry || undefined,
        principalIdNumber: form.principal.trim() || undefined,
        isPrincipal: form.memberRelation === "Self",
        portalAccessEnabled: form.portal !== "Do not activate now",
        portalPhone: form.portalPhone.trim() || form.phone.trim() || undefined,
        consentDataSharing: form.smsConsent || form.emailConsent || form.callConsent || form.whatsappConsent,
        duplicateOverrideReason: form.duplicateOverrideReason.trim() || undefined,
        registrationType: form.regType.includes("Emergency")
          ? "EMERGENCY"
          : form.regType.includes("Corporate")
            ? "CORPORATE"
            : form.regType.includes("Referral")
              ? "REFERRAL"
              : "NEW",
      };

      let result: any = null;
      if (onSubmit) {
        result = await onSubmit(payload);
      } else if (editingPatient?.id) {
        result = await updateTenantPatient(editingPatient.id, payload);
      } else {
        result = await createTenantPatient(payload);
      }

      const latest = await fetchTenantPatients(undefined, facility?.id).catch(() => []);
      if (Array.isArray(latest) && latest.length > 0) {
        setPatients(latest as any);
      }

      setFinished(true);
      setDirty(false);
      onSaved?.(result || payload);
    } catch (err: any) {
      const msg = err?.message || "Failed to register patient. Please verify details.";
      onError?.(msg);
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(createInitialState());
    setCur(0);
    setDirty(false);
    setErrors({});
    setShowScrim(false);
    setFinished(false);
    setDuplicatePatient(null);
    setDuplicateWarning("");
    setDuplicateDismissed(false);
    stopWebcam();
    setPhotoStatus("");
    setTimeout(() => stepTitleRef.current?.focus(), 50);
  };

  if (!isVisible) return null;

  return (
    <div className="prf-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="prfStepTitle">
      <div className={`prf-sheet ${finished ? "finished" : ""}`}>
        {/* Left Rail - Styled to match Medilink Desktop App Sidebar */}
        <aside className="prf-rail">
          <div className="prf-mark">
            <svg viewBox="0 0 34 34" fill="none">
              <rect x="1" y="1" width="32" height="32" rx="8" stroke="#10b981" strokeWidth="1.5" />
              <path d="M14 8h6v6h6v6h-6v6h-6v-6H8v-6h6z" fill="#fff" />
            </svg>
            <div>
              <b>Medilink HMIS</b>
              <small>Patient Registration</small>
            </div>
          </div>

          <div className="prf-rule" />

          <ol className="prf-steps">
            {STEPS.map(([title, subtitle], idx) => {
              const isDone = idx < cur;
              const isCurrent = idx === cur;
              return (
                <li key={title} className={isDone ? "done" : ""}>
                  <button
                    className="prf-step"
                    type="button"
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => goToStep(idx)}
                  >
                    <span className="prf-num">{isDone ? "✓" : idx + 1}</span>
                    <span>
                      <b>{title}</b>
                      <small>{subtitle}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="prf-banner">
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt="Patient"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--brass)",
                    flexShrink: 0,
                  }}
                />
              ) : null}
              <div style={{ minWidth: 0, flex: 1 }}>
                <small>Live summary</small>
                <div className="prf-b-name">{bannerData.name}</div>
              </div>
            </div>
            <div className="prf-b-line">{bannerData.demo}</div>
            <div className="prf-b-line">{bannerData.phone}</div>
            <span className={`prf-chip ${bannerData.chip.cls}`}>{bannerData.chip.text}</span>
          </div>
        </aside>

        {/* Right Main Column */}
        <div className="prf-main">
          {!finished ? (
            <>
              {/* Header */}
              <header className="prf-head">
                <div>
                  <small id="prfStepCount">Step {cur + 1} of {STEPS.length}</small>
                  <h2 id="prfStepTitle" ref={stepTitleRef} tabIndex={-1}>
                    {STEPS[cur][2]}
                  </h2>
                  <p>{STEPS[cur][3]}</p>
                </div>
                <button
                  className="prf-x"
                  type="button"
                  onClick={handleRequestClose}
                  aria-label="Close registration"
                >
                  <X size={14} />
                </button>
              </header>

              {/* Scrollable Body */}
              <div className="prf-body" ref={bodyRef}>
                {/* Instant Duplicate Patient Warning Banner */}
                {duplicatePatient && !duplicateDismissed && (
                  <div className="prf-dup-banner">
                    <div className="prf-dup-icon">⚠️</div>
                    <div className="prf-dup-content">
                      <strong>Possible duplicate record detected</strong>
                      <p>{duplicateWarning}</p>
                      <div className="prf-dup-actions">
                        <button
                          type="button"
                          className="prf-dup-btn"
                          onClick={() => autofillFromDuplicate(duplicatePatient)}
                        >
                          Autofill from existing record
                        </button>
                        <button
                          type="button"
                          className="prf-dup-btn ghost"
                          onClick={() => setDuplicateDismissed(true)}
                        >
                          Dismiss & continue as new
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 0: Identity & Demographics */}
                {cur === 0 && (
                  <div className="prf-panel">
                    <section className="prf-group" style={{ paddingTop: "8px" }}>
                      <h3>Registration & entry mode</h3>
                      <p>How the patient is entering the hospital.</p>
                      <div className="prf-fields">
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="regType">
                            Registration type<span className="prf-req">*</span>
                          </label>
                          <select
                            id="regType"
                            value={form.regType}
                            onChange={(e) => updateField("regType", e.target.value)}
                          >
                            <option>Standard registration</option>
                            <option>Emergency registration</option>
                            <option>Newborn registration</option>
                            <option>Outpatient registration</option>
                            <option>Inpatient admission</option>
                          </select>
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="arrival">
                            Arrival source<span className="prf-req">*</span>
                          </label>
                          <select
                            id="arrival"
                            value={form.arrival}
                            onChange={(e) => updateField("arrival", e.target.value)}
                          >
                            <option>Walk-in</option>
                            <option>Referral</option>
                            <option>Ambulance</option>
                            <option>Transfer from another facility</option>
                            <option>Scheduled appointment</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className="prf-group">
                      <h3>Legal identity & demographics</h3>
                      <p>Full names and biological demographics. Fields with * are mandatory.</p>
                      <div className="prf-fields">
                        <div className={`prf-field prf-s2 ${errors.firstName ? "invalid" : ""}`}>
                          <label className="prf-label" htmlFor="firstName">
                            First name<span className="prf-req">*</span>
                          </label>
                          <input
                            id="firstName"
                            type="text"
                            placeholder="e.g. Jane"
                            value={form.firstName}
                            onChange={(e) => updateField("firstName", e.target.value)}
                          />
                          <div className="prf-err">{errors.firstName}</div>
                        </div>
                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="middleName">
                            Middle name
                          </label>
                          <input
                            id="middleName"
                            type="text"
                            placeholder="e.g. Muthoni"
                            value={form.middleName}
                            onChange={(e) => updateField("middleName", e.target.value)}
                          />
                        </div>
                        <div className={`prf-field prf-s2 ${errors.lastName ? "invalid" : ""}`}>
                          <label className="prf-label" htmlFor="lastName">
                            Last name<span className="prf-req">*</span>
                          </label>
                          <input
                            id="lastName"
                            type="text"
                            placeholder="e.g. Wanjiku"
                            value={form.lastName}
                            onChange={(e) => updateField("lastName", e.target.value)}
                          />
                          <div className="prf-err">{errors.lastName}</div>
                        </div>

                        {/* Hybrid DOB Field: Type directly OR pick from calendar */}
                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="dob">
                            Date of birth (type or pick)
                          </label>
                          <HybridDateField
                            id="dob"
                            value={form.dob}
                            onChange={(val) => updateField("dob", val)}
                            max={new Date().toISOString().slice(0, 10)}
                            placeholder="YYYY-MM-DD or DD/MM/YYYY"
                          />
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="estimatedAge">
                            Estimated age (yrs)
                          </label>
                          <input
                            id="estimatedAge"
                            type="number"
                            min="0"
                            max="130"
                            placeholder="If DOB unknown"
                            value={form.estimatedAge}
                            onChange={(e) => updateField("estimatedAge", e.target.value)}
                          />
                        </div>

                        <div className={`prf-field prf-s2 ${errors.sex ? "invalid" : ""}`}>
                          <label className="prf-label" htmlFor="sex">
                            Sex / Gender<span className="prf-req">*</span>
                          </label>
                          <select
                            id="sex"
                            value={form.sex}
                            onChange={(e) => updateField("sex", e.target.value)}
                          >
                            <option value="">Select sex</option>
                            <option>Female</option>
                            <option>Male</option>
                            <option>Intersex</option>
                            <option>Unknown / not recorded</option>
                          </select>
                          <div className="prf-err">{errors.sex}</div>
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="bloodGroup">
                            Blood group
                          </label>
                          <select
                            id="bloodGroup"
                            value={form.bloodGroup}
                            onChange={(e) => updateField("bloodGroup", e.target.value)}
                          >
                            <option value="">Select blood group</option>
                            {BLOOD_GROUPS.map((bg) => (
                              <option key={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="marital">
                            Marital status
                          </label>
                          <select
                            id="marital"
                            value={form.marital}
                            onChange={(e) => updateField("marital", e.target.value)}
                          >
                            <option value="">Select status</option>
                            <option>Single</option>
                            <option>Married</option>
                            <option>Separated</option>
                            <option>Divorced</option>
                            <option>Widowed</option>
                            <option>Not stated</option>
                          </select>
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="nationality">
                            Nationality
                          </label>
                          <input
                            id="nationality"
                            type="text"
                            placeholder="e.g. Kenyan"
                            value={form.nationality}
                            onChange={(e) => updateField("nationality", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="countryOfBirth">
                            Country of birth
                          </label>
                          <input
                            id="countryOfBirth"
                            type="text"
                            placeholder="e.g. Kenya"
                            value={form.countryOfBirth}
                            onChange={(e) => updateField("countryOfBirth", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="preferredLanguage">
                            Preferred language
                          </label>
                          <input
                            id="preferredLanguage"
                            type="text"
                            placeholder="e.g. English / Kiswahili"
                            value={form.preferredLanguage}
                            onChange={(e) => updateField("preferredLanguage", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="idType">
                            Identification type
                          </label>
                          <select
                            id="idType"
                            value={form.idType}
                            onChange={(e) => updateField("idType", e.target.value)}
                          >
                            <option value="">Select type</option>
                            <option>National ID</option>
                            <option>Passport</option>
                            <option>Birth certificate</option>
                            <option>Alien ID</option>
                            <option>Other</option>
                          </select>
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="idNumber">
                            ID / Passport number
                          </label>
                          <input
                            id="idNumber"
                            type="text"
                            placeholder="e.g. 12345678"
                            value={form.idNumber}
                            onChange={(e) => updateField("idNumber", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s2">
                          <label className="prf-label" htmlFor="shaNumber">
                            SHA number (NHIF)
                          </label>
                          <input
                            id="shaNumber"
                            type="text"
                            placeholder="e.g. SHA-98765432"
                            value={form.shaNumber}
                            onChange={(e) => updateField("shaNumber", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="patientNo">
                            Existing patient number (MRN)
                          </label>
                          <input
                            id="patientNo"
                            type="text"
                            placeholder="Pre-allocated number (if any)"
                            value={form.patientNo}
                            onChange={(e) => updateField("patientNo", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="occupation">
                            Occupation
                          </label>
                          <input
                            id="occupation"
                            type="text"
                            placeholder="e.g. Accountant, Teacher, Student"
                            value={form.occupation}
                            onChange={(e) => updateField("occupation", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="religion">
                            Religion / Faith
                          </label>
                          <input
                            id="religion"
                            type="text"
                            placeholder="e.g. Christian, Muslim, etc."
                            value={form.religion}
                            onChange={(e) => updateField("religion", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="educationLevel">
                            Education level
                          </label>
                          <select
                            id="educationLevel"
                            value={form.educationLevel}
                            onChange={(e) => updateField("educationLevel", e.target.value)}
                          >
                            <option value="">Select education level</option>
                            <option>None</option>
                            <option>Primary</option>
                            <option>Secondary</option>
                            <option>Tertiary / College</option>
                            <option>University / Postgraduate</option>
                          </select>
                        </div>

                        {/* Optional Camera / Photo Section */}
                        <div className="prf-field prf-s6">
                          <label className="prf-label">Patient photo & identity capture (optional)</label>
                          <div className="prf-photo-section">
                            <div className="prf-photo-row">
                              {form.photoUrl ? (
                                <img
                                  src={form.photoUrl}
                                  alt="Patient identity preview"
                                  className="prf-photo-preview"
                                />
                              ) : (
                                <div
                                  className="prf-photo-preview"
                                  style={{
                                    display: "grid",
                                    placeItems: "center",
                                    color: "var(--muted)",
                                    fontSize: "11px",
                                    background: "#eef2f6",
                                  }}
                                >
                                  No photo
                                </div>
                              )}
                              <div className="prf-photo-btns">
                                <input
                                  ref={photoInputRef}
                                  type="file"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                                />
                                <button
                                  type="button"
                                  className="prf-btn prf-btn-sm"
                                  onClick={() => photoInputRef.current?.click()}
                                >
                                  Upload Photo
                                </button>
                                {!webcamActive ? (
                                  <button
                                    type="button"
                                    className="prf-btn prf-btn-sm"
                                    onClick={startWebcam}
                                  >
                                    Capture from Webcam
                                  </button>
                                ) : null}
                                {form.photoUrl ? (
                                  <button
                                    type="button"
                                    className="prf-btn prf-btn-sm prf-btn danger"
                                    onClick={handleRemovePhoto}
                                  >
                                    Remove Photo
                                  </button>
                                ) : null}
                              </div>
                              {photoStatus ? <span className="prf-photo-status">{photoStatus}</span> : null}
                            </div>

                            {webcamActive && (
                              <div className="prf-webcam-modal">
                                <video ref={videoRef} autoPlay playsInline muted />
                                <div className="prf-webcam-bar">
                                  <button
                                    type="button"
                                    className="prf-btn prf-btn-sm prf-btn pri"
                                    onClick={takeSnapshot}
                                  >
                                    Take Snapshot
                                  </button>
                                  <button
                                    type="button"
                                    className="prf-btn prf-btn-sm"
                                    onClick={stopWebcam}
                                  >
                                    Cancel Camera
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="prf-group">
                      <h3>Contact & location</h3>
                      <p>How the hospital reaches the patient. Fields with * are mandatory.</p>
                      <div className="prf-fields">
                        <div className={`prf-field prf-s3 ${errors.phone ? "invalid" : ""}`}>
                          <label className="prf-label" htmlFor="phone">
                            Primary phone<span className="prf-req">*</span>
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            placeholder="+254 7XX XXX XXX"
                            value={form.phone}
                            onChange={(e) => updateField("phone", e.target.value)}
                          />
                          <div className="prf-err">{errors.phone}</div>
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="altPhone">
                            Alternative phone
                          </label>
                          <input
                            id="altPhone"
                            type="tel"
                            placeholder="+254 7XX XXX XXX"
                            value={form.altPhone}
                            onChange={(e) => updateField("altPhone", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="email">
                            Email address
                          </label>
                          <input
                            id="email"
                            type="email"
                            placeholder="patient@example.com"
                            value={form.email}
                            onChange={(e) => updateField("email", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="county">
                            County
                          </label>
                          <select
                            id="county"
                            value={form.county}
                            onChange={(e) => updateField("county", e.target.value)}
                          >
                            <option value="">Select County</option>
                            {KENYAN_COUNTIES.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="subCounty">
                            Sub-county
                          </label>
                          <input
                            id="subCounty"
                            type="text"
                            placeholder="e.g. Westlands, Dagoretti"
                            value={form.subCounty}
                            onChange={(e) => updateField("subCounty", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="town">
                            Town / Estate / Village
                          </label>
                          <input
                            id="town"
                            type="text"
                            placeholder="e.g. Kilimani, Ruaka"
                            value={form.town}
                            onChange={(e) => updateField("town", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s6">
                          <label className="prf-label" htmlFor="address">
                            Residential address
                          </label>
                          <input
                            id="address"
                            type="text"
                            placeholder="Street name, house / apartment number"
                            value={form.address}
                            onChange={(e) => updateField("address", e.target.value)}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* STEP 1: Safety & Alerts */}
                {cur === 1 && (
                  <div className="prf-panel">
                    <div className="prf-note warn">
                      <b>Clinical safety evaluation</b>
                      Record known allergies, chronic conditions, and patient vulnerability alerts to safeguard treatment.
                    </div>

                    <section className="prf-group">
                      <h3>Allergy status</h3>
                      <p>Select the current clinical allergy status.</p>
                      <div className="prf-cards" role="radiogroup" aria-label="Allergy status">
                        {ALLERGY_STATUSES.map((status) => (
                          <label
                            key={status}
                            className={`prf-opt ${form.allergyStatus === status ? "selected" : ""}`}
                            onClick={() => updateField("allergyStatus", status)}
                          >
                            <input
                              type="radio"
                              name="allergyStatus"
                              value={status}
                              checked={form.allergyStatus === status}
                              readOnly
                            />
                            <i />
                            {status}
                          </label>
                        ))}
                      </div>
                    </section>

                    {form.allergyStatus === "Known allergies" && (
                      <section className="prf-group">
                        <h3>Allergy details</h3>
                        <p>Quick select common allergens or type specific substances.</p>
                        
                        <div className="prf-tags">
                          {COMMON_ALLERGENS.map((allergen) => (
                            <button
                              key={allergen}
                              type="button"
                              className={`prf-tag ${form.allergen.includes(allergen) ? "active" : ""}`}
                              onClick={() => selectAllergenPill(allergen)}
                            >
                              + {allergen}
                            </button>
                          ))}
                        </div>

                        <div className="prf-fields">
                          <div className={`prf-field prf-s3 ${errors.allergen ? "invalid" : ""}`}>
                            <label className="prf-label" htmlFor="allergen">
                              Allergen / Substance<span className="prf-req">*</span>
                            </label>
                            <input
                              id="allergen"
                              type="text"
                              placeholder="e.g. Penicillin, Peanuts"
                              value={form.allergen}
                              onChange={(e) => updateField("allergen", e.target.value)}
                            />
                            <div className="prf-err">{errors.allergen}</div>
                          </div>
                          <div className="prf-field prf-s3">
                            <label className="prf-label" htmlFor="allergyType">
                              Allergy category
                            </label>
                            <select
                              id="allergyType"
                              value={form.allergyType}
                              onChange={(e) => updateField("allergyType", e.target.value)}
                            >
                              <option>Medication / drug</option>
                              <option>Food</option>
                              <option>Environmental</option>
                              <option>Latex</option>
                              <option>Other</option>
                            </select>
                          </div>

                          <div className="prf-field prf-s3">
                            <label className="prf-label" htmlFor="reaction">
                              Reaction observed
                            </label>
                            <input
                              id="reaction"
                              type="text"
                              placeholder="e.g. Anaphylaxis, rash, swelling"
                              value={form.reaction}
                              onChange={(e) => updateField("reaction", e.target.value)}
                            />
                          </div>
                          <div className="prf-field prf-s3">
                            <label className="prf-label" htmlFor="severity">
                              Severity
                            </label>
                            <select
                              id="severity"
                              value={form.severity}
                              onChange={(e) => updateField("severity", e.target.value)}
                            >
                              <option>Mild</option>
                              <option>Moderate</option>
                              <option>Severe</option>
                              <option>Unknown</option>
                            </select>
                          </div>

                          <div className="prf-field prf-s6">
                            <label className="prf-label" htmlFor="allergyNotes">
                              Allergy notes
                            </label>
                            <textarea
                              id="allergyNotes"
                              placeholder="Source of allergy information or actions taken"
                              value={form.allergyNotes}
                              onChange={(e) => updateField("allergyNotes", e.target.value)}
                            />
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="prf-group">
                      <h3>Chronic conditions</h3>
                      <p>Tap common conditions to toggle or describe in the text area below.</p>
                      <div className="prf-tags">
                        {COMMON_CONDITIONS.map((cond) => {
                          const isActive = form.conditions.includes(cond);
                          return (
                            <button
                              key={cond}
                              type="button"
                              className={`prf-tag ${isActive ? "active" : ""}`}
                              onClick={() => toggleConditionPill(cond)}
                            >
                              {isActive ? "✓" : "+"} {cond}
                            </button>
                          );
                        })}
                      </div>
                      <div className="prf-fields">
                        <div className="prf-field prf-s6">
                          <textarea
                            id="conditions"
                            placeholder="Known chronic medical conditions..."
                            value={form.conditions}
                            onChange={(e) => updateField("conditions", e.target.value)}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="prf-group">
                      <h3>Vulnerability & care flags</h3>
                      <p>Select any special clinical support or mobility flags.</p>
                      <div className="prf-tags">
                        {VULNERABILITY_OPTIONS.map((flag) => {
                          const isSelected = form.vulnerabilityFlags.includes(flag);
                          return (
                            <button
                              key={flag}
                              type="button"
                              className={`prf-tag ${isSelected ? "active" : ""}`}
                              onClick={() => toggleVulnerabilityFlag(flag)}
                            >
                              {isSelected ? "✓" : "+"} {flag}
                            </button>
                          );
                        })}
                      </div>

                      <div className="prf-fields" style={{ marginTop: "10px" }}>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="precautions">
                            Special precautions
                          </label>
                          <textarea
                            id="precautions"
                            placeholder="Infection control, wheelchair, fall precautions"
                            value={form.precautions}
                            onChange={(e) => updateField("precautions", e.target.value)}
                          />
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="safetyNotes">
                            Past medical / surgical history
                          </label>
                          <textarea
                            id="safetyNotes"
                            placeholder="Relevant surgeries, hospitalizations, or clinical alerts"
                            value={form.safetyNotes}
                            onChange={(e) => updateField("safetyNotes", e.target.value)}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* STEP 2: Next of Kin & Relationships */}
                {cur === 2 && (
                  <div className="prf-panel">
                    <section className="prf-group" style={{ paddingTop: "8px" }}>
                      <h3>Primary next of kin</h3>
                      <p>The primary point of contact for clinical emergencies and notifications.</p>
                      <div className="prf-fields">
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="kinName">
                            Full name
                          </label>
                          <input
                            id="kinName"
                            type="text"
                            placeholder="e.g. John Kamau"
                            value={form.kinName}
                            onChange={(e) => updateField("kinName", e.target.value)}
                          />
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="kinRelationship">
                            Relationship to patient
                          </label>
                          <select
                            id="kinRelationship"
                            value={form.kinRelationship}
                            onChange={(e) => updateField("kinRelationship", e.target.value)}
                          >
                            {RELATIONSHIPS.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="kinPhone">
                            Primary phone
                          </label>
                          <input
                            id="kinPhone"
                            type="tel"
                            placeholder="+254 7XX XXX XXX"
                            value={form.kinPhone}
                            onChange={(e) => updateField("kinPhone", e.target.value)}
                          />
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="kinAltPhone">
                            Alternative phone
                          </label>
                          <input
                            id="kinAltPhone"
                            type="tel"
                            placeholder="+254 7XX XXX XXX"
                            value={form.kinAltPhone}
                            onChange={(e) => updateField("kinAltPhone", e.target.value)}
                          />
                        </div>

                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="kinEmail">
                            Email address
                          </label>
                          <input
                            id="kinEmail"
                            type="email"
                            placeholder="kin@example.com"
                            value={form.kinEmail}
                            onChange={(e) => updateField("kinEmail", e.target.value)}
                          />
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="kinAddress">
                            Residential address
                          </label>
                          <input
                            id="kinAddress"
                            type="text"
                            placeholder="Town, estate or street"
                            value={form.kinAddress}
                            onChange={(e) => updateField("kinAddress", e.target.value)}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="prf-group">
                      <h3>Guardian details</h3>
                      <p>Required if patient is a minor or under legal guardianship.</p>
                      <div className="prf-fields">
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="guardianName">
                            Guardian name
                          </label>
                          <input
                            id="guardianName"
                            type="text"
                            placeholder="Guardian full name"
                            value={form.guardianName}
                            onChange={(e) => updateField("guardianName", e.target.value)}
                          />
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="guardianRelationship">
                            Guardian relationship
                          </label>
                          <input
                            id="guardianRelationship"
                            type="text"
                            placeholder="e.g. Legal Guardian, Parent"
                            value={form.guardianRelationship}
                            onChange={(e) => updateField("guardianRelationship", e.target.value)}
                          />
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="guardianPhone">
                            Guardian phone
                          </label>
                          <input
                            id="guardianPhone"
                            type="tel"
                            placeholder="+254 7XX XXX XXX"
                            value={form.guardianPhone}
                            onChange={(e) => updateField("guardianPhone", e.target.value)}
                          />
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="guardianAuthority">
                            Legal authority
                          </label>
                          <input
                            id="guardianAuthority"
                            type="text"
                            placeholder="e.g. Court Order, Parental Custody"
                            value={form.guardianAuthority}
                            onChange={(e) => updateField("guardianAuthority", e.target.value)}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="prf-group">
                      <div className="prf-sec">
                        <div>
                          <h3>Additional contacts</h3>
                          <p>Secondary emergency contacts or authorized representatives.</p>
                        </div>
                        <button
                          className="prf-link"
                          type="button"
                          onClick={handleAddContact}
                        >
                          + Add contact
                        </button>
                      </div>

                      {form.additionalContacts.length > 0 ? (
                        <div>
                          {form.additionalContacts.map((contact, idx) => (
                            <div key={contact.id} className="prf-contact">
                              <div className="prf-contact-h">
                                <span>Contact #{idx + 1}</span>
                                <button
                                  className="prf-link bad"
                                  type="button"
                                  onClick={() => handleRemoveContact(contact.id)}
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="prf-fields">
                                <div className="prf-field prf-s3">
                                  <label className="prf-label">Full name</label>
                                  <input
                                    type="text"
                                    value={contact.name}
                                    placeholder="Full name"
                                    onChange={(e) => handleUpdateContact(contact.id, "name", e.target.value)}
                                  />
                                </div>
                                <div className="prf-field prf-s3">
                                  <label className="prf-label">Relationship</label>
                                  <select
                                    value={contact.relationship}
                                    onChange={(e) => handleUpdateContact(contact.id, "relationship", e.target.value)}
                                  >
                                    {RELATIONSHIPS.map((r) => (
                                      <option key={r}>{r}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="prf-field prf-s3">
                                  <label className="prf-label">Phone</label>
                                  <input
                                    type="tel"
                                    placeholder="+254 7XX XXX XXX"
                                    value={contact.phone}
                                    onChange={(e) => handleUpdateContact(contact.id, "phone", e.target.value)}
                                  />
                                </div>
                                <div className="prf-field prf-s3">
                                  <label className="prf-label">Role</label>
                                  <select
                                    value={contact.role}
                                    onChange={(e) => handleUpdateContact(contact.id, "role", e.target.value)}
                                  >
                                    <option>Emergency contact</option>
                                    <option>Guardian</option>
                                    <option>Authorised representative</option>
                                    <option>Other</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="prf-empty">No additional contacts added yet.</p>
                      )}
                    </section>
                  </div>
                )}

                {/* STEP 3: Coverage, Insurance & Portal */}
                {cur === 3 && (
                  <div className="prf-panel">
                    <section className="prf-group" style={{ paddingTop: "8px" }}>
                      <h3>Payment & insurance arrangement</h3>
                      <p>Select how healthcare services will be billed for this patient.</p>
                      <div className="prf-fields">
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="paymentType">
                            Payment type<span className="prf-req">*</span>
                          </label>
                          <select
                            id="paymentType"
                            value={form.paymentType}
                            onChange={(e) => updateField("paymentType", e.target.value)}
                          >
                            <option>Self-pay</option>
                            <option>Insurance</option>
                            <option>Corporate</option>
                            <option>Sponsored</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="payer">
                            Payer or sponsor name
                          </label>
                          <input
                            id="payer"
                            type="text"
                            placeholder="e.g. Self, Employer, Sponsor"
                            value={form.payer}
                            onChange={(e) => updateField("payer", e.target.value)}
                          />
                        </div>

                        {form.paymentType === "Insurance" && (
                          <>
                            <div className={`prf-field prf-s3 ${errors.insurer ? "invalid" : ""}`}>
                              <label className="prf-label" htmlFor="insurer">
                                Insurance scheme / provider<span className="prf-req">*</span>
                              </label>
                              <select
                                id="insurer"
                                value={form.insurer}
                                onChange={(e) => updateField("insurer", e.target.value)}
                              >
                                <option value="">Select provider</option>
                                {TOP_INSURERS.map((ins) => (
                                  <option key={ins}>{ins}</option>
                                ))}
                              </select>
                              <div className="prf-err">{errors.insurer}</div>
                            </div>
                            <div className="prf-field prf-s3">
                              <label className="prf-label" htmlFor="memberNo">
                                Member / Policy ID
                              </label>
                              <input
                                id="memberNo"
                                type="text"
                                placeholder="e.g. JUB-994827"
                                value={form.memberNo}
                                onChange={(e) => updateField("memberNo", e.target.value)}
                              />
                            </div>

                            <div className="prf-field prf-s3">
                              <label className="prf-label" htmlFor="memberName">
                                Member name on card
                              </label>
                              <input
                                id="memberName"
                                type="text"
                                placeholder="Name as printed on insurance card"
                                value={form.memberName}
                                onChange={(e) => updateField("memberName", e.target.value)}
                              />
                            </div>

                            <div className="prf-field prf-s3">
                              <label className="prf-label" htmlFor="principal">
                                Principal member name / ID
                              </label>
                              <input
                                id="principal"
                                type="text"
                                placeholder="If dependent"
                                value={form.principal}
                                onChange={(e) => updateField("principal", e.target.value)}
                              />
                            </div>
                            <div className="prf-field prf-s2">
                              <label className="prf-label" htmlFor="memberRelation">
                                Relationship to principal
                              </label>
                              <select
                                id="memberRelation"
                                value={form.memberRelation}
                                onChange={(e) => updateField("memberRelation", e.target.value)}
                              >
                                <option>Self</option>
                                <option>Spouse</option>
                                <option>Child</option>
                                <option>Dependent</option>
                              </select>
                            </div>
                            <div className="prf-field prf-s2">
                              <label className="prf-label" htmlFor="policy">
                                Policy group number
                              </label>
                              <input
                                id="policy"
                                type="text"
                                placeholder="Group policy number"
                                value={form.policy}
                                onChange={(e) => updateField("policy", e.target.value)}
                              />
                            </div>

                            <div className="prf-field prf-s2">
                              <label className="prf-label" htmlFor="preAuthCode">
                                Pre-authorization code
                              </label>
                              <input
                                id="preAuthCode"
                                type="text"
                                placeholder="Pre-auth approval code"
                                value={form.preAuthCode}
                                onChange={(e) => updateField("preAuthCode", e.target.value)}
                              />
                            </div>

                            {/* Hybrid Date Fields for Policy Start and Expiry */}
                            <div className="prf-field prf-s3">
                              <label className="prf-label" htmlFor="policyStartDate">
                                Policy valid from
                              </label>
                              <HybridDateField
                                id="policyStartDate"
                                value={form.policyStartDate}
                                onChange={(val) => updateField("policyStartDate", val)}
                                placeholder="YYYY-MM-DD or DD/MM/YYYY"
                              />
                            </div>
                            <div className="prf-field prf-s3">
                              <label className="prf-label" htmlFor="expiry">
                                Coverage expiry date
                              </label>
                              <HybridDateField
                                id="expiry"
                                value={form.expiry}
                                onChange={(val) => updateField("expiry", val)}
                                placeholder="YYYY-MM-DD or DD/MM/YYYY"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </section>

                    <section className="prf-group">
                      <h3>Patient portal & communication preferences</h3>
                      <p>Configure electronic health records access and communication consent.</p>
                      <div className="prf-fields">
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="portal">
                            Patient portal access
                          </label>
                          <select
                            id="portal"
                            value={form.portal}
                            onChange={(e) => updateField("portal", e.target.value)}
                          >
                            <option>Invite patient to activate</option>
                            <option>Existing portal account</option>
                            <option>Do not activate now</option>
                          </select>
                        </div>
                        <div className="prf-field prf-s3">
                          <label className="prf-label" htmlFor="preferredContact">
                            Preferred contact method
                          </label>
                          <select
                            id="preferredContact"
                            value={form.preferredContact}
                            onChange={(e) => updateField("preferredContact", e.target.value)}
                          >
                            <option>Phone / SMS</option>
                            <option>Email</option>
                            <option>Patient portal</option>
                            <option>WhatsApp</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: "14px" }}>
                        <span className="prf-lab">Communication consent channels</span>
                        <div className="prf-checks">
                          <label className="prf-check">
                            <input
                              type="checkbox"
                              checked={form.smsConsent}
                              onChange={(e) => updateField("smsConsent", e.target.checked)}
                            />
                            SMS reminders
                          </label>
                          <label className="prf-check">
                            <input
                              type="checkbox"
                              checked={form.emailConsent}
                              onChange={(e) => updateField("emailConsent", e.target.checked)}
                            />
                            Email records
                          </label>
                          <label className="prf-check">
                            <input
                              type="checkbox"
                              checked={form.callConsent}
                              onChange={(e) => updateField("callConsent", e.target.checked)}
                            />
                            Voice calls
                          </label>
                          <label className="prf-check">
                            <input
                              type="checkbox"
                              checked={form.whatsappConsent}
                              onChange={(e) => updateField("whatsappConsent", e.target.checked)}
                            />
                            WhatsApp
                          </label>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* STEP 4: Review & Finalize */}
                {cur === 4 && (
                  <div className="prf-panel">
                    {form.allergyStatus === "Not assessed" && (
                      <div className="prf-note warn">
                        <b>Allergy status not assessed</b>
                        You may still register the patient. Record allergy details as soon as evaluated by clinical staff.
                      </div>
                    )}

                    {/* Registration Review */}
                    <section className="prf-group" style={{ paddingTop: "8px" }}>
                      <div className="prf-sec">
                        <h3>Registration & demographics</h3>
                        <button className="prf-link" type="button" onClick={() => goToStep(0)}>
                          Edit
                        </button>
                      </div>
                      <dl className="prf-rv">
                        <dt>Full name</dt>
                        <dd style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {form.photoUrl ? (
                            <img
                              src={form.photoUrl}
                              alt="Patient preview"
                              style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : null}
                          <strong>{[form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ") || "-"}</strong>
                        </dd>
                        <dt>Registration</dt><dd>{form.regType} · {form.arrival}</dd>
                        <dt>Date of birth</dt>
                        <dd>{form.dob ? `${form.dob} (${calcAge()})` : calcAge() || "Not recorded"}</dd>
                        <dt>Sex / Gender</dt><dd>{form.sex || "-"}</dd>
                        {form.bloodGroup && <><dt>Blood group</dt><dd>{form.bloodGroup}</dd></>}
                        {form.marital && <><dt>Marital status</dt><dd>{form.marital}</dd></>}
                        {form.nationality && <><dt>Nationality</dt><dd>{form.nationality}</dd></>}
                        {form.countryOfBirth && <><dt>Country of birth</dt><dd>{form.countryOfBirth}</dd></>}
                        {form.preferredLanguage && <><dt>Preferred language</dt><dd>{form.preferredLanguage}</dd></>}
                        {form.idNumber && <><dt>Identification</dt><dd>{form.idType}: {form.idNumber}</dd></>}
                        {form.shaNumber && <><dt>SHA number</dt><dd>{form.shaNumber}</dd></>}
                        {form.patientNo && <><dt>MRN / Reg No</dt><dd>{form.patientNo}</dd></>}
                        {form.occupation && <><dt>Occupation</dt><dd>{form.occupation}</dd></>}
                        {form.religion && <><dt>Religion</dt><dd>{form.religion}</dd></>}
                        {form.educationLevel && <><dt>Education</dt><dd>{form.educationLevel}</dd></>}
                      </dl>
                    </section>

                    {/* Contact Review */}
                    <section className="prf-group">
                      <div className="prf-sec">
                        <h3>Contact & address</h3>
                        <button className="prf-link" type="button" onClick={() => goToStep(0)}>
                          Edit
                        </button>
                      </div>
                      <dl className="prf-rv">
                        <dt>Primary phone</dt><dd>{form.phone || "-"}</dd>
                        {form.altPhone && <><dt>Alt phone</dt><dd>{form.altPhone}</dd></>}
                        {form.email && <><dt>Email</dt><dd>{form.email}</dd></>}
                        <dt>Location</dt><dd>{[form.town, form.subCounty, form.county].filter(Boolean).join(", ") || "-"}</dd>
                        {form.address && <><dt>Address</dt><dd>{form.address}</dd></>}
                      </dl>
                    </section>

                    {/* Safety Review */}
                    <section className="prf-group">
                      <div className="prf-sec">
                        <h3>Safety & alerts</h3>
                        <button className="prf-link" type="button" onClick={() => goToStep(1)}>
                          Edit
                        </button>
                      </div>
                      <dl className="prf-rv">
                        <dt>Allergy status</dt><dd>{form.allergyStatus}</dd>
                        {form.allergyStatus === "Known allergies" && (
                          <>
                            <dt>Allergen</dt><dd>{form.allergen || "-"}</dd>
                            {form.reaction && <><dt>Reaction</dt><dd>{form.reaction} ({form.severity})</dd></>}
                          </>
                        )}
                        {form.conditions && <><dt>Conditions</dt><dd>{form.conditions}</dd></>}
                        {form.vulnerabilityFlags.length > 0 && (
                          <><dt>Care flags</dt><dd>{form.vulnerabilityFlags.join(", ")}</dd></>
                        )}
                        {form.precautions && <><dt>Precautions</dt><dd>{form.precautions}</dd></>}
                        {form.safetyNotes && <><dt>Medical history</dt><dd>{form.safetyNotes}</dd></>}
                      </dl>
                    </section>

                    {/* Next of Kin Review */}
                    <section className="prf-group">
                      <div className="prf-sec">
                        <h3>Contacts & Next of kin</h3>
                        <button className="prf-link" type="button" onClick={() => goToStep(2)}>
                          Edit
                        </button>
                      </div>
                      <dl className="prf-rv">
                        <dt>Primary contact</dt>
                        <dd>
                          {[form.kinName, form.kinRelationship && `(${form.kinRelationship})`, form.kinPhone]
                            .filter(Boolean)
                            .join(" ") || "None recorded"}
                        </dd>
                        {form.guardianName && (
                          <><dt>Guardian</dt><dd>{form.guardianName} ({form.guardianRelationship}) · {form.guardianPhone}</dd></>
                        )}
                        {form.additionalContacts.map((c, i) => (
                          <React.Fragment key={c.id}>
                            <dt>Additional #{i + 1}</dt>
                            <dd>{c.name} · {c.relationship} · {c.phone} [{c.role}]</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    </section>

                    {/* Coverage Review */}
                    <section className="prf-group">
                      <div className="prf-sec">
                        <h3>Coverage & payment</h3>
                        <button className="prf-link" type="button" onClick={() => goToStep(3)}>
                          Edit
                        </button>
                      </div>
                      <dl className="prf-rv">
                        <dt>Payment method</dt><dd>{form.paymentType}</dd>
                        {form.paymentType === "Insurance" ? (
                          <>
                            <dt>Insurer</dt><dd>{form.insurer}</dd>
                            {form.memberNo && <><dt>Member ID</dt><dd>{form.memberNo}</dd></>}
                            {form.principal && <><dt>Principal</dt><dd>{form.principal} ({form.memberRelation})</dd></>}
                            {form.policyStartDate && <><dt>Start date</dt><dd>{form.policyStartDate}</dd></>}
                            {form.expiry && <><dt>Expires</dt><dd>{form.expiry}</dd></>}
                            {form.preAuthCode && <><dt>Pre-auth</dt><dd>{form.preAuthCode}</dd></>}
                          </>
                        ) : form.payer ? (
                          <><dt>Payer</dt><dd>{form.payer}</dd></>
                        ) : null}
                        <dt>Portal</dt><dd>{form.portal}</dd>
                        <dt>Consent</dt>
                        <dd>
                          {[
                            form.smsConsent ? "SMS" : null,
                            form.emailConsent ? "Email" : null,
                            form.callConsent ? "Calls" : null,
                            form.whatsappConsent ? "WhatsApp" : null,
                          ]
                            .filter(Boolean)
                            .join(", ") || "None"}
                        </dd>
                      </dl>
                    </section>

                    {/* Duplicate override reason if duplicate was flagged */}
                    {duplicatePatient && (
                      <div className="prf-field prf-s6" style={{ marginTop: "14px" }}>
                        <label className="prf-label" htmlFor="duplicateOverrideReason">
                          Duplicate record override reason
                        </label>
                        <input
                          id="duplicateOverrideReason"
                          type="text"
                          placeholder="e.g. Verified separate individual with identical name"
                          value={form.duplicateOverrideReason}
                          onChange={(e) => updateField("duplicateOverrideReason", e.target.value)}
                        />
                      </div>
                    )}

                    {/* Confirmation Checkbox */}
                    <label className={`prf-check prf-confirm-line ${errors.confirmReview ? "invalid" : ""}`}>
                      <input
                        type="checkbox"
                        checked={form.confirmReview}
                        onChange={(e) => updateField("confirmReview", e.target.checked)}
                      />
                      <span>
                        I confirm that the above registration information has been reviewed and verified for clinical and administrative accuracy.
                      </span>
                    </label>
                    {errors.confirmReview && (
                      <div className="prf-err" style={{ display: "block", marginLeft: "24px" }}>
                        {errors.confirmReview}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <footer className="prf-foot">
                <button className="prf-btn prf-ghost" type="button" onClick={handleRequestClose}>
                  Cancel
                </button>
                <div className="prf-acts">
                  <button
                    className="prf-btn"
                    type="button"
                    disabled={cur === 0}
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  {cur < STEPS.length - 1 ? (
                    <button className="prf-btn prf-pri" type="button" onClick={handleNext}>
                      Continue
                    </button>
                  ) : (
                    <button
                      className="prf-btn prf-pri"
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                    >
                      {submitting ? "Registering..." : "Complete registration"}
                    </button>
                  )}
                </div>
              </footer>
            </>
          ) : (
            /* Finished View */
            <div className="prf-donev">
              <div className="prf-tick" aria-hidden="true">✓</div>
              <h2>Registration complete</h2>
              <p>
                Patient record for{" "}
                <strong>
                  {[form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ")}
                </strong>{" "}
                has been recorded successfully in the Medilink HMIS database.
              </p>
              <div className="prf-acts">
                <button className="prf-btn" type="button" onClick={handleReset}>
                  Register another patient
                </button>
                <button className="prf-btn prf-pri" type="button" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Discard Scrim Dialog */}
        {showScrim && (
          <div className="prf-scrim">
            <div className="prf-confirm" role="alertdialog" aria-labelledby="prfConfirmTitle">
              <h3 id="prfConfirmTitle">Discard this registration?</h3>
              <p>Everything entered in this form so far will be lost.</p>
              <div>
                <button
                  className="prf-btn"
                  type="button"
                  onClick={() => setShowScrim(false)}
                >
                  Keep editing
                </button>
                <button
                  className="prf-btn prf-danger"
                  type="button"
                  onClick={handleConfirmDiscard}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        <div className={`prf-toast ${toastMessage ? "show" : ""}`} role="status">
          {toastMessage}
        </div>
      </div>
    </div>
  );
}

export default PatientRegistrationForm;
