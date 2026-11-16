// Ported from Medilink-Frontend/src/app/signup/page.tsx for desktop parity.
import Link from "../lib/navigation";
import { useRouter } from "../lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type LandingTheme = "enterprise" | "clinical" | "luxury";

const THEME_STORAGE_KEY = "medilink-landing-theme";
const LICENSE_STORAGE_KEY = "hmis_license_facility_code";
const readableApiError = (error: any, fallback: string) => {
  const payload = error?.response?.data;
  const message = payload?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (message && typeof message === "object") {
    if (typeof message.message === "string" && message.message.trim()) return message.message;
    if (typeof message.status === "string" && message.status.trim()) return message.status;
  }
  return String(error?.message || fallback);
};
const DEVICE_ID_STORAGE_KEY = "hmis_device_id";

const isLandingTheme = (value: string | null): value is LandingTheme =>
  value === "enterprise" || value === "clinical" || value === "luxury";

export default function SignupView() {
  const router = useRouter();
  const [landingTheme, setLandingTheme] = useState<LandingTheme>("clinical");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isLandingTheme(stored)) {
      setLandingTheme(stored);
    }
  }, []);

  const pricingUrl = useMemo(() => {
    const first = String(((import.meta as any).env?.VITE_MARKETING_URL) || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)[0];
    if (!first) return "/landing";
    const withProtocol = /^https?:\/\//i.test(first) ? first : `http://${first}`;
    try {
      return `${new URL(withProtocol).toString().replace(/\/+$/, "")}/pricing`;
    } catch {
      return "/landing";
    }
  }, []);

  const normalizeLicenseKey = (value: string) =>
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  const getDeviceId = () => {
    const cached = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (cached) return cached;
    const generated =
      (crypto?.randomUUID?.() as string | undefined) ||
      `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  };

  const getDeviceLabel = () =>
    [navigator.platform, navigator.userAgent].filter(Boolean).join(" ").slice(0, 160);

  const handleActivate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedKey = normalizeLicenseKey(licenseKey);
    if (!normalizedKey) {
      setError("Enter the HMIS license key issued from the MediLink HMIS Org.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // The backend can identify an already activated facility even when this
      // browser has no local facility code. Avoid sending the key again and
      // opening the first-time setup wizard for an existing installation.
      try {
        const statusResponse = await api.get("/license/status", {
          params: { deviceId: getDeviceId() },
        });
        if (statusResponse.data?.active) {
          const existingFacilityCode = String(statusResponse.data?.facilityCode || "").trim().toUpperCase();
          if (existingFacilityCode) localStorage.setItem(LICENSE_STORAGE_KEY, existingFacilityCode);
          setError("This license has already been used to activate HMIS. Redirecting you to login...");
          window.setTimeout(() => router.replace("/login"), 1200);
          return;
        }
      } catch {
        // A status check is advisory; activation below remains the source of truth.
      }
      const response = await api.post("/license/activate", {
        licenseKey: normalizedKey,
        deviceId: getDeviceId(),
        deviceLabel: getDeviceLabel(),
        deviceMeta: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        },
      });
      const facilityCode = String(response.data?.facilityCode || "").trim().toUpperCase();
      if (!response.data?.active || !facilityCode) {
        throw new Error("License activation failed. Confirm the key and try again.");
      }
      localStorage.setItem(LICENSE_STORAGE_KEY, facilityCode);
      if (response.data?.alreadyActivated) {
        setError("This license has already been used to activate HMIS. Redirecting you to login...");
        window.setTimeout(() => router.replace("/login"), 1200);
        return;
      }
      router.push("/setup");
    } catch (err: any) {
      setError(readableApiError(err, "License activation failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <form className="auth-card auth-login" onSubmit={handleActivate}>
        <img
          src="/Loginlogo.png"
          alt="MediLink HMIS"
          className="auth-title-logo"
        />
        <p>Enter the HMIS license key issued from the MediLink HMIS Org.</p>
        <div className="license-info">
          <div>
            <strong>Source:</strong> Only keys issued from the MediLink HMIS Org are accepted.
          </div>
          <div>
            <strong>Format:</strong> 8 blocks of 4 characters.
          </div>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <div className="module-form-field">
          <label className="form-label">License Key</label>
          <input
            className="auth-input module-form-input"
            value={licenseKey}
            onChange={(event) => setLicenseKey(event.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
            required
          />
        </div>
        <div className="auth-actions">
          <Link href="/landing" className="splash-btn-secondary">
            Back
          </Link>
          <button type="submit" className="splash-btn-primary" disabled={loading}>
            {loading ? "Verifying..." : "Verify License"}
          </button>
        </div>
        <div className="auth-link-row">
          Don't have a license key?{" "}
          <a href={pricingUrl} target="_blank" rel="noreferrer">
            Obtain One
          </a>
        </div>
      </form>
    </div>
  );
}
