// Ported from Medilink-Frontend/src/app/communication/page.tsx for desktop parity.
import { useState } from "react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function CommunicationView() {
  const [activeTab, setActiveTab] = useState<"SMS" | "EMAIL">("SMS");

  const [smsForm, setSmsForm] = useState({ to: "", message: "" });
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", html: "" });
  
  const [sendingSms, setSendingSms] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingSms(true);
    try {
      const payload = {
        to: smsForm.to.split(",").map(s => s.trim()),
        message: smsForm.message
      };
      await api.post("/sms/send", payload);
      alert("SMS Sent successfully!");
      setSmsForm({ to: "", message: "" });
    } catch (err: any) {
      alert(`SMS Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSendingSms(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      const payload = {
        to: emailForm.to.split(",").map(s => s.trim()),
        subject: emailForm.subject,
        html: emailForm.html
      };
      await api.post("/email/send", payload);
      alert("Email Sent successfully!");
      setEmailForm({ to: "", subject: "", html: "" });
    } catch (err: any) {
      alert(`Email Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <>
      <SimpleModulePlaceholder
        title="Telemedicine & Communication"
        subtitle="Manage outbound SMS alerts and Email notifications for patients and staff"
        icon={<ModuleIcon name="campaign" />}
        stats={[]}
        columns={[]}
        rows={[]}
        actions={null}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("SMS")}
              className={`flex-1 py-4 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "SMS"
                  ? "bg-slate-50 text-emerald-600 border-b-2 border-emerald-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <ModuleIcon name="sms" /> Direct SMS Alerts
            </button>
            <button
              onClick={() => setActiveTab("EMAIL")}
              className={`flex-1 py-4 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "EMAIL"
                  ? "bg-slate-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <ModuleIcon name="email" /> Direct Email Notifications
            </button>
          </div>

          <div className="p-8">
            {activeTab === "SMS" && (
              <form onSubmit={handleSendSms} className="module-form-body">
                <div className="module-form-note">
                  <h3 className="text-lg font-bold text-emerald-700 mb-1">Send SMS Alert</h3>
                  <p className="text-sm text-slate-500 mb-4">Send a direct text message to one or more phone numbers.</p>
                </div>

                <div className="module-form-grid">
                  <div className="module-form-field is-wide">
                    <label className="form-label">To (Phone Numbers)</label>
                    <input required type="text" className="module-form-input"
                      value={smsForm.to} onChange={(e) => setSmsForm({...smsForm, to: e.target.value})}
                      placeholder="e.g. +254700000000, +254711111111 (comma separated)" />
                  </div>

                  <div className="module-form-field is-wide">
                    <label className="form-label">Message Body</label>
                    <textarea required maxLength={1000} className="module-form-input"
                      value={smsForm.message} onChange={(e) => setSmsForm({...smsForm, message: e.target.value})}
                      placeholder="Your appointment is scheduled for tomorrow at 10 AM..." rows={4} />
                    <div className="text-xs text-slate-400 mt-1 text-right">{smsForm.message.length}/1000 characters</div>
                  </div>
                </div>

                <div className="module-form-footer">
                  <button
                    type="submit"
                    disabled={sendingSms || !smsForm.to || !smsForm.message}
                    className="form-btn form-btn-primary module-form-submit"
                  >
                    {sendingSms ? "Sending..." : "Send SMS"} <ModuleIcon name="send" />
                  </button>
                </div>

                <div className="pt-2">
                  <h4 className="font-bold text-slate-800 mb-2">Run SMS Campaign</h4>
                  <p className="text-sm text-slate-500 mb-4">Send a mass text message to all users of a specific role.</p>
                  <div className="flex gap-4">
                     <select className="px-4 py-3 bg-background border border-border rounded-xl text-sm flex-1" id="smsRole">
                        <option value="PATIENT">All Patients</option>
                        <option value="DOCTOR">All Doctors</option>
                        <option value="NURSE">All Nurses</option>
                     </select>
                     <button type="button" onClick={async () => {
                        const role = (document.getElementById('smsRole') as HTMLSelectElement).value;
                        if (!smsForm.message) return alert('Enter a message body first');
                        try {
                          await api.post('/sms/campaign', { role, message: smsForm.message });
                          alert(`Campaign queued for ${role}s!`);
                        } catch(err:any) { alert(err.message); }
                     }} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition shadow-sm">
                        Queue Campaign
                     </button>
                  </div>
                </div>
              </form>
            )}

            {activeTab === "EMAIL" && (
              <form onSubmit={handleSendEmail} className="module-form-body">
                <div className="module-form-note">
                  <h3 className="text-lg font-bold text-indigo-700 mb-1">Send Email Notification</h3>
                  <p className="text-sm text-slate-500 mb-4">Send a rich HTML email to one or more email addresses.</p>
                </div>

                <div className="module-form-grid">
                  <div className="module-form-field is-wide">
                    <label className="form-label">To (Email Addresses)</label>
                    <input required type="text" className="module-form-input"
                      value={emailForm.to} onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
                      placeholder="e.g. patient@example.com, doctor@hospital.com (comma separated)" />
                  </div>

                  <div className="module-form-field is-wide">
                    <label className="form-label">Subject</label>
                    <input required type="text" className="module-form-input"
                      value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                      placeholder="Your Lab Results are Ready" />
                  </div>

                  <div className="module-form-field is-wide">
                    <label className="form-label">Email Body (HTML Supported)</label>
                    <textarea required className="module-form-input font-mono"
                      value={emailForm.html} onChange={(e) => setEmailForm({...emailForm, html: e.target.value})}
                      placeholder="<h1>Hello!</h1><p>Your test results are available on the portal.</p>" rows={6} />
                  </div>
                </div>

                <div className="module-form-footer">
                  <button
                    type="submit"
                    disabled={sendingEmail || !emailForm.to || !emailForm.subject || !emailForm.html}
                    className="form-btn form-btn-primary module-form-submit"
                  >
                    {sendingEmail ? "Sending..." : "Send Email"} <ModuleIcon name="send" />
                  </button>
                </div>

                <div className="pt-2">
                  <h4 className="font-bold text-slate-800 mb-2">Run Email Campaign</h4>
                  <p className="text-sm text-slate-500 mb-4">Send a mass HTML email to all users of a specific role.</p>
                  <div className="flex gap-4">
                     <select className="px-4 py-3 bg-background border border-border rounded-xl text-sm flex-1" id="emailRole">
                        <option value="PATIENT">All Patients</option>
                        <option value="DOCTOR">All Doctors</option>
                        <option value="STAFF">All Staff</option>
                     </select>
                     <button type="button" onClick={async () => {
                        const role = (document.getElementById('emailRole') as HTMLSelectElement).value;
                        if (!emailForm.subject || !emailForm.html) return alert('Enter a subject and HTML body first');
                        try {
                          await api.post('/email/campaign', { role, subject: emailForm.subject, html: emailForm.html });
                          alert(`Campaign queued for ${role}s!`);
                        } catch(err:any) { alert(err.message); }
                     }} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition shadow-sm">
                        Queue Campaign
                     </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
