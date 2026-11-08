import { useEffect } from "react";

const DESCRIPTION_RULES: Array<[RegExp, string]> = [
  [/patient|client|person/i, "Select the patient this record applies to."],
  [/name/i, "Enter the person's official name."],
  [/date|dob|birth|expiry|due/i, "Choose the applicable date."],
  [/time|duration|length/i, "Enter the relevant time or duration."],
  [/status|state|outcome/i, "Choose the current status or outcome."],
  [/type|category|class|source/i, "Choose the option that best describes this record."],
  [/department|ward|unit|location/i, "Select the responsible department or location."],
  [/doctor|clinician|provider|prescriber|staff|nurse/i, "Select the responsible staff member."],
  [/phone|mobile|contact/i, "Enter a reachable contact number."],
  [/email/i, "Enter a valid email address."],
  [/address|county|village|residence/i, "Enter the relevant location details."],
  [/amount|cost|price|salary|revenue|budget|limit|value/i, "Enter the amount in the configured currency."],
  [/quantity|qty|dose|volume|count|number/i, "Enter the applicable quantity."],
  [/priority|severity|risk/i, "Choose the appropriate priority or risk level."],
  [/reason|indication|diagnosis|symptom/i, "Explain the reason or clinical indication."],
  [/note|comment|instruction|detail|description|history|finding|assessment/i, "Add the relevant notes and supporting details."],
  [/password|pin/i, "Enter the secure credential for this account."],
  [/username|user|login/i, "Enter the account identifier."],
  [/code|number|mrn|id|reference|token/i, "Enter the corresponding identifier."],
  [/file|upload|attachment|image|photo|document/i, "Attach supporting evidence if available."],
  [/consent|approval|authori[sz]/i, "Record the required approval or consent."],
];

function descriptionFor(label: string) {
  const normalized = label.replace(/\*/g, "").replace(/\s+/g, " ").trim();
  return (
    DESCRIPTION_RULES.find(([pattern]) => pattern.test(normalized))?.[1] ??
    "Provide the information required for this field."
  );
}

function isExcludedLabel(label: HTMLLabelElement) {
  if (label.dataset.descriptionAdded === "true") return true;
  if (
    label.querySelector(
      "small, .form-helper, .doctor-field-hint, .field-description, [data-field-description]",
    )
  )
    return true;
  if (/search|filter|sort|select all|remember|agree|confirm|active/i.test(label.textContent || ""))
    return true;
  const control = label.querySelector(
    "input, select, textarea",
  ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  if (!control) return true;
  if (control instanceof HTMLInputElement && ["checkbox", "radio"].includes(control.type))
    return true;
  return false;
}

function addDescriptions(root: ParentNode) {
  const labels = root.querySelectorAll<HTMLLabelElement>("label");
  labels.forEach((label) => {
    if (isExcludedLabel(label)) return;
    const control = label.querySelector("input, select, textarea");
    if (!control || !label.isConnected || !label.contains(control)) return;
    const heading =
      label.querySelector(":scope > span, :scope > strong, :scope > b") || label.firstChild;
    const description = document.createElement("small");
    description.className = "global-form-field-description";
    description.setAttribute("data-field-description", "true");
    description.textContent = descriptionFor(label.textContent || "");
    try {
      if (
        heading &&
        heading.nodeType === Node.ELEMENT_NODE &&
        (heading as Element).parentNode === label
      ) {
        (heading as Element).parentNode?.insertBefore(description, heading.nextSibling);
      } else {
        const parent = control.parentNode;
        if (!parent || !parent.contains(control)) return;
        parent.insertBefore(description, control);
      }
      label.dataset.descriptionAdded = "true";
    } catch {
      // Retried on observer commit if replaced
    }
  });
}

export function FieldDescriptionLayer() {
  useEffect(() => {
    addDescriptions(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) addDescriptions(node as Element);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}

