// Ported from Medilink-Frontend/src/app/setup/page.tsx for desktop parity.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "../lib/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Hospital,
  MapPin,
  Upload,
  UserRoundPlus,
} from "lucide-react";
import { api } from "../lib/api";

type LandingTheme = "enterprise" | "clinical" | "luxury";
type FieldType = "text" | "email" | "tel" | "number" | "password" | "select" | "textarea" | "file" | "checkboxes";

type Field = {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

type Step = {
  title: string;
  subtitle: string;
  icon: typeof Building2;
  fields: Field[];
};

const THEME_STORAGE_KEY = "medilink-landing-theme";

const isLandingTheme = (value: string | null): value is LandingTheme =>
  value === "enterprise" || value === "clinical" || value === "luxury";

const counties = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay",
  "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
  "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta",
  "Tana River", "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga",
  "Wajir", "West Pokot",
];

const setupSteps: Step[] = [
  {
    title: "Facility Identity",
    subtitle: "Tell Medilink who the hospital is.",
    icon: Building2,
    fields: [
      { name: "legalName", label: "Facility full legal name", placeholder: "Nakuru Level Five County Referral Hospital", required: true },
      { name: "shortName", label: "Facility short / trading name", placeholder: "Nakuru L5 Hospital", required: true },
      { name: "logo", label: "Facility logo", type: "file" },
      { name: "stamp", label: "Facility seal / stamp", type: "file" },
      { name: "tagline", label: "Tagline", placeholder: "Care Beyond Excellence" },
      { name: "mohLicense", label: "MOH facility licence number", placeholder: "MOH-..." },
      { name: "mflCode", label: "Master Facility List code", placeholder: "12345", required: true },
    ],
  },
  {
    title: "Facility Profile",
    subtitle: "Simple classification details for reports and routing.",
    icon: Hospital,
    fields: [
      { name: "ownershipType", label: "Ownership type", type: "select", options: ["Public", "Private for Profit", "Private Not-for-Profit", "NGO", "Parastatal"], required: true },
      { name: "facilityLevel", label: "MOH facility level", type: "select", options: ["Level 2", "Level 3", "Level 4", "Level 5", "Level 6"], required: true },
      { name: "facilityType", label: "Facility type", type: "select", options: ["General Hospital", "Specialist Hospital", "Maternity Home", "Nursing Home", "Eye Centre", "Dental Clinic", "Diagnostic Centre", "Pharmacy Only", "Other"], required: true },
      { name: "bedCapacity", label: "Licensed bed capacity", type: "number", placeholder: "80" },
      { name: "accreditation", label: "Accreditation status", type: "select", options: ["None", "Awaiting Assessment", "KQMH Level 1", "KQMH Level 2", "KQMH Level 3", "KQMH Level 4", "KQMH Level 5", "ISO 9001", "SafeCare", "JCI"] },
    ],
  },
  {
    title: "Location and Contacts",
    subtitle: "Where patients and referral partners find you.",
    icon: MapPin,
    fields: [
      { name: "physicalAddress", label: "Physical address", type: "textarea", placeholder: "Building, street, estate or area", required: true },
      { name: "county", label: "County", type: "select", options: counties, required: true },
      { name: "subCounty", label: "Sub-county", placeholder: "Nakuru East" },
      { name: "ward", label: "Ward", placeholder: "Biashara" },
      { name: "mainPhone", label: "Main switchboard number", type: "tel", placeholder: "+2547..." },
      { name: "emergencyPhone", label: "Emergency / casualty line", type: "tel", placeholder: "+2547..." },
      { name: "appointmentsPhone", label: "Appointments desk number", type: "tel", placeholder: "+2547..." },
      { name: "generalEmail", label: "General email address", type: "email", placeholder: "info@hospital.co.ke" },
      { name: "website", label: "Website URL", placeholder: "https://hospital.co.ke" },
    ],
  },
  {
    title: "Working Hours",
    subtitle: "Use quick choices instead of long configuration forms.",
    icon: CheckCircle2,
    fields: [
      { name: "openDays", label: "Open days", type: "checkboxes", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
      { name: "weekdayOpen", label: "Weekday opening time", type: "select", options: ["06:00", "07:00", "08:00", "09:00", "24 hours"] },
      { name: "weekdayClose", label: "Weekday closing time", type: "select", options: ["17:00", "18:00", "19:00", "20:00", "24 hours"] },
      { name: "publicHolidays", label: "Public holidays", type: "select", options: ["Closed", "Open normal hours", "Emergency only", "24 hours"] },
      { name: "afterHours", label: "After-hours billing", type: "select", options: ["No surcharge", "Starts 5pm", "Starts 6pm", "Starts 7pm", "24-hour hospital"] },
    ],
  },
  {
    title: "Departments",
    subtitle: "Create the first patient routing areas. More can be added later.",
    icon: Hospital,
    fields: [
      { name: "departments", label: "Initial departments", type: "checkboxes", options: ["Reception", "Outpatient", "Emergency", "Billing", "Pharmacy", "Laboratory", "Radiology", "Maternity", "Inpatient", "Theatre"] },
      { name: "primaryDepartment", label: "Main patient entry department", type: "select", options: ["Reception", "Outpatient", "Emergency"] },
    ],
  },
  {
    title: "Hospital Admin",
    subtitle: "Create the first admin account that will manage the system.",
    icon: UserRoundPlus,
    fields: [
      { name: "adminName", label: "Hospital admin full name", placeholder: "Jane Wanjiku", required: true },
      { name: "adminEmail", label: "Admin login email", type: "email", placeholder: "admin@hospital.co.ke", required: true },
      { name: "adminPhone", label: "Admin phone number", type: "tel", placeholder: "+2547...", required: true },
      { name: "adminPassword", label: "Admin password", type: "password", placeholder: "Minimum 6 characters", required: true },
      { name: "adminConfirmPassword", label: "Confirm admin password", type: "password", placeholder: "Re-enter password", required: true },
      { name: "adminPin", label: "Six-digit admin PIN", type: "password", placeholder: "123456" },
    ],
  },
];

export default function SetupView() {
  const router = useRouter();
  const [landingTheme, setLandingTheme] = useState<LandingTheme>("clinical");
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, string>>({});
  const [fileObjects, setFileObjects] = useState<Record<string, File>>({});
  const [checked, setChecked] = useState<Record<string, string[]>>({
    openDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    departments: ["Reception", "Outpatient", "Billing"],
  });
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isLandingTheme(stored)) setLandingTheme(stored);
  }, []);

  const step = setupSteps[activeStep];
  const completion = useMemo(
    () => Math.round(((completed ? setupSteps.length + 1 : activeStep + 1) / (setupSteps.length + 1)) * 100),
    [activeStep, completed],
  );

  const setValue = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const toggleChecked = (name: string, option: string) => {
    setChecked((current) => {
      const list = current[name] || [];
      return {
        ...current,
        [name]: list.includes(option) ? list.filter((item) => item !== option) : [...list, option],
      };
    });
  };

  const onFileChange = (name: string, file?: File | null) => {
    if (!file) return;
    setFiles((current) => ({ ...current, [name]: file.name }));
    setFileObjects((current) => ({ ...current, [name]: file }));
  };

  const renderField = (field: Field) => {
    if (field.type === "file") {
      return (
        <label className="module-form-field setup-file-picker" key={field.name}>
          <span className="form-label">{field.label}</span>
          <input className="module-form-input" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => onFileChange(field.name, event.target.files?.[0])} />
          <b><Upload size={16} /> {files[field.name] || "Choose image"}</b>
          <small>PNG, JPG, or SVG</small>
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <div className="module-form-field" key={field.name}>
          <label className="form-label">{field.label}</label>
          <select className="module-form-input" required={field.required} value={values[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)}>
            <option value="">Select...</option>
            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      );
    }

    if (field.type === "checkboxes") {
      return (
        <fieldset className="module-form-field setup-choice-field" key={field.name}>
          <legend className="form-label">{field.label}</legend>
          <div>
            {field.options?.map((option) => (
              <label key={option} className="module-form-field">
                <input
                  className="module-form-input"
                  type="checkbox"
                  checked={(checked[field.name] || []).includes(option)}
                  onChange={() => toggleChecked(field.name, option)}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    if (field.type === "textarea") {
      return (
        <div className="module-form-field" key={field.name}>
          <label className="form-label">{field.label}</label>
          <textarea className="module-form-input" required={field.required} placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)} />
        </div>
      );
    }

    const isPassword = field.type === "password";
    return (
      <div className="module-form-field" key={field.name}>
        <label className="form-label">{field.label}</label>
        <span className={isPassword ? "setup-password-wrap" : undefined}>
          <input
            className="module-form-input"
            type={isPassword && showPassword ? "text" : field.type || "text"}
            required={field.required}
            placeholder={field.placeholder}
            value={values[field.name] || ""}
            onChange={(event) => setValue(field.name, event.target.value)}
          />
          {isPassword ? (
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          ) : null}
        </span>
      </div>
    );
  };

  const goNext = async () => {
    setError("");
    if (activeStep < setupSteps.length - 1) {
      setActiveStep((value) => value + 1);
      return;
    }
    if (values.adminPassword !== values.adminConfirmPassword) {
      setError("Admin password and confirm password must match.");
      return;
    }
    if ((values.adminPassword || "").length < 6 || /\s/.test(values.adminPassword || "")) {
      setError("Admin password must be at least 6 characters and contain no spaces.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, value));
      Object.entries(checked).forEach(([key, value]) => formData.append(key, JSON.stringify(value)));
      if (fileObjects.logo) formData.append("logo", fileObjects.logo);
      if (fileObjects.stamp) formData.append("stamp", fileObjects.stamp);

      const response = await api.post("/facilities/setup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem(
        "hmis_first_setup",
        JSON.stringify({
          values,
          files,
          checked,
          savedFacility: response.data?.facility || null,
          branding: response.data?.branding || null,
          completedAt: new Date().toISOString(),
        }),
      );
      localStorage.setItem("hmis_setup_wizard_seen", new Date().toISOString());
      setCompleted(true);
    } catch (setupError: any) {
      setError(
        setupError?.response?.data?.message ||
          setupError?.message ||
          "Setup could not be saved. Check that the HMIS backend is running.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className={`splash-root landing-theme-${landingTheme}`}>
        <div className="splash-glow splash-glow-1" />
        <div className="splash-glow splash-glow-2" />
        <section className="setup-landing-shell setup-congrats">
          <img src="/Loginlogo.png" alt="MediLink HMIS" className="auth-title-logo" />
          <CheckCircle2 className="setup-congrats-icon" />
          <p className="setup-eyebrow">Setup Complete</p>
          <h1>Congratulations, your hospital is ready.</h1>
          <p className="setup-copy">
            Thank you for setting up Medilink HMIS. Use the Hospital Admin credentials you created to login and continue configuring users, modules, billing, wards, integrations, and go-live readiness.
          </p>
          <button type="button" className="splash-btn-primary" onClick={() => router.push("/login")}>
            Continue to Admin Login
            <ChevronRight size={17} />
          </button>
        </section>
      </div>
    );
  }

  const StepIcon = step.icon;

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <main className="setup-landing-shell">
        <header className="setup-landing-header">
          <div className="setup-brand-lockup">
            <img src="/Loginlogo.png" alt="MediLink HMIS" className="auth-title-logo" />
            <span>Hospital information, beautifully connected.</span>
          </div>
          <div className="setup-heading-copy">
            <p className="setup-eyebrow">First-time hospital registration</p>
            <h1>Build your facility workspace</h1>
            <p className="setup-copy">A guided setup for the Hospital Admin. You can refine advanced clinical, financial, and operational settings after signing in.</p>
          </div>
          <div className="setup-verified-badge"><CheckCircle2 size={17} /><span>License verified</span></div>
        </header>

        <div className="setup-workspace">
          <aside className="setup-step-rail" aria-label="Setup steps">
            <div className="setup-rail-intro"><span>SETUP JOURNEY</span><strong>{activeStep + 1} <i>/ {setupSteps.length}</i></strong></div>
            <nav>
              {setupSteps.map((item, index) => {
                const Icon = item.icon;
                const isComplete = index < activeStep;
                return (
                  <button key={item.title} type="button" className={`setup-rail-step ${index === activeStep ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`} onClick={() => setActiveStep(index)}>
                    <span className="setup-step-number">{isComplete ? <CheckCircle2 size={15} /> : index + 1}</span>
                    <span className="setup-rail-label"><b>{item.title}</b><small>{item.subtitle}</small></span>
                    <Icon className="setup-rail-icon" size={17} />
                  </button>
                );
              })}
            </nav>
            <div className="setup-rail-footer"><span>Configuration progress</span><strong>{completion}%</strong><div className="setup-progress"><i style={{ width: `${completion}%` }} /></div></div>
          </aside>

          <form className="setup-form-card" onSubmit={(event) => { event.preventDefault(); goNext(); }}>
            <div className="setup-form-topline"><span>STEP {String(activeStep + 1).padStart(2, "0")}</span><span>{activeStep === setupSteps.length - 1 ? "Final review" : "In progress"}</span></div>
            <div className="setup-panel-heading">
              <div className="setup-panel-icon"><StepIcon className="setup-panel-svg" /></div>
              <div><h2>{step.title}</h2><span>{step.subtitle}</span></div>
            </div>

            <div className="setup-field-grid">{step.fields.map(renderField)}</div>
            {error ? <div className="auth-error" role="alert">{error}</div> : null}

            <div className="setup-actions"><button type="button" className="splash-btn-secondary" onClick={() => setActiveStep((value) => Math.max(0, value - 1))} disabled={activeStep === 0 || submitting}><ChevronLeft size={17} />Back</button><button type="submit" className="splash-btn-primary" disabled={submitting}>{submitting ? "Saving Setup..." : activeStep === setupSteps.length - 1 ? "Finish Setup" : "Continue"}<ChevronRight size={17} /></button></div>
          </form>
        </div>
      </main>
    </div>
  );
}
