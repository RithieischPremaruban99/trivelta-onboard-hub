/**
 * pdf-builder.ts — Client-side PDF generation for Trivelta submission summaries.
 * Produces a cover page, table of contents, and per-section field tables.
 * Used by both the prospect pre-onboarding flow and the client onboarding flow.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PROSPECT_SECTIONS } from "./prospect-fields";
import type { FormShape } from "./onboarding-schema";

/* ── Color palette ────────────────────────────────────────────────────────── */

type RGB = [number, number, number];
const PRIMARY: RGB = [59, 130, 246];
const MUTED: RGB = [100, 116, 139];
const DARK: RGB = [20, 20, 30];
const TEXT: RGB = [40, 40, 55];
const WHITE: RGB = [255, 255, 255];
const MARGIN = 20;

/* ── Low-level helpers ────────────────────────────────────────────────────── */

function fill(doc: jsPDF, rgb: RGB) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function stroke(doc: jsPDF, rgb: RGB) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function color(doc: jsPDF, rgb: RGB) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}
function lastTableY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

/* ── Shared page elements ─────────────────────────────────────────────────── */

function addPageFooter(doc: jsPDF, pageNum: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  stroke(doc, MUTED);
  doc.setLineWidth(0.1);
  doc.line(MARGIN, h - 20, w - MARGIN, h - 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  color(doc, MUTED);
  doc.text("TRIVELTA · Confidential Client Document", MARGIN, h - 12);
  doc.text(`Page ${pageNum}`, w - MARGIN, h - 12, { align: "right" });
}

function addCoverPage(
  doc: jsPDF,
  params: {
    type: "Pre-Onboarding" | "Onboarding";
    companyName: string;
    submittedAt: Date;
    contactName?: string | null;
    contactEmail: string;
  },
) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Top accent bar
  fill(doc, PRIMARY);
  doc.rect(0, 0, w, 4, "F");

  // TRIVELTA wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  color(doc, PRIMARY);
  doc.text("TRIVELTA", MARGIN, 40);

  // Separator line
  stroke(doc, MUTED);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 48, w - MARGIN, 48);

  // Document type label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  color(doc, MUTED);
  doc.text(`${params.type.toUpperCase()} — SUBMISSION SUMMARY`, MARGIN, 56);

  // Company name (hero)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  color(doc, DARK);
  doc.text(params.companyName, w / 2, h / 2 - 30, { align: "center" });

  // Submitted date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  color(doc, MUTED);
  const dateStr = params.submittedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = params.submittedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Submitted on ${dateStr} at ${timeStr}`, w / 2, h / 2 - 14, { align: "center" });

  // Contact block
  doc.setFontSize(9);
  color(doc, MUTED);
  doc.text("PRIMARY CONTACT", w / 2, h - 80, { align: "center" });

  if (params.contactName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    color(doc, TEXT);
    doc.text(params.contactName, w / 2, h - 68, { align: "center" });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  color(doc, MUTED);
  doc.text(params.contactEmail, w / 2, h - 58, { align: "center" });

  // Bottom accent bar
  fill(doc, PRIMARY);
  doc.rect(0, h - 4, w, 4, "F");

  addPageFooter(doc, 1);
}

function addTableOfContents(
  doc: jsPDF,
  sections: Array<{ num: string; title: string; page: number }>,
) {
  doc.addPage();
  const w = doc.internal.pageSize.getWidth();

  // Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  color(doc, DARK);
  doc.text("Contents", MARGIN, 35);

  stroke(doc, PRIMARY);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 41, MARGIN + 40, 41);

  let y = 56;
  sections.forEach(({ num, title, page }) => {
    // Section badge
    fill(doc, PRIMARY);
    doc.roundedRect(MARGIN, y - 4.5, 9, 9, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    color(doc, WHITE);
    doc.text(num, MARGIN + 4.5, y + 1, { align: "center" });

    // Title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    color(doc, TEXT);
    doc.text(title, MARGIN + 14, y + 1);

    // Page number
    color(doc, MUTED);
    doc.setFontSize(10);
    doc.text(String(page), w - MARGIN, y + 1, { align: "right" });

    // Dotted leader line
    stroke(doc, MUTED);
    doc.setLineWidth(0.1);
    doc.setLineDashPattern([0.5, 2], 0);
    const lineStart = MARGIN + 14 + doc.getTextWidth(title) + 4;
    const lineEnd = w - MARGIN - doc.getTextWidth(String(page)) - 4;
    if (lineEnd > lineStart) {
      doc.line(lineStart, y, lineEnd, y);
    }
    doc.setLineDashPattern([], 0);

    y += 12;
  });

  addPageFooter(doc, 2);
}

function addSectionHeading(
  doc: jsPDF,
  y: number,
  num: string,
  title: string,
  subtitle?: string,
): number {
  const w = doc.internal.pageSize.getWidth();

  fill(doc, PRIMARY);
  doc.roundedRect(MARGIN, y - 5, 10, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  color(doc, WHITE);
  doc.text(num, MARGIN + 5, y + 1, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  color(doc, DARK);
  doc.text(title, MARGIN + 15, y + 1);

  let nextY = y + 10;
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    color(doc, MUTED);
    doc.text(subtitle, MARGIN + 15, nextY);
    nextY += 6;
  }

  stroke(doc, PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, nextY + 2, w - MARGIN, nextY + 2);

  return nextY + 10;
}

function addFieldsTable(
  doc: jsPDF,
  startY: number,
  rows: Array<{ label: string; value: string }>,
): number {
  if (rows.length === 0) return startY;

  autoTable(doc, {
    startY,
    head: [],
    body: rows.map((r) => [r.label, r.value]),
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      lineColor: [220, 224, 232],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 65,
        textColor: [80, 80, 95],
      },
      1: {
        textColor: TEXT as [number, number, number],
      },
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252],
    },
    didDrawCell: (data) => {
      if (data.column.index === 0 && data.cell.section === "body") {
        fill(doc, PRIMARY);
        doc.rect(data.cell.x, data.cell.y, 2, data.cell.height, "F");
      }
    },
  });

  return lastTableY(doc) + 10;
}

/* ── Field value formatter ────────────────────────────────────────────────── */

function fmtValue(value: unknown, fieldType?: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") {
    if (fieldType === "boolean_tri") {
      if (value === "yes") return "Yes";
      if (value === "no") return "No";
      if (value === "maybe") return "Not sure yet";
    }
    return value.trim();
  }
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/* ── Prospect PDF ─────────────────────────────────────────────────────────── */

export interface ProspectPDFInput {
  legal_company_name: string;
  primary_contact_name?: string | null;
  primary_contact_email: string;
  submitted_at: string;
  company_details?: Record<string, unknown>;
  payment_providers?: Record<string, unknown>;
  kyc_compliance?: Record<string, unknown>;
  marketing_stack?: Record<string, unknown>;
  technical_requirements?: Record<string, unknown>;
  optional_features?: Record<string, unknown>;
}

export function buildProspectPDF(prospect: ProspectPDFInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Cover
  addCoverPage(doc, {
    type: "Pre-Onboarding",
    companyName: prospect.legal_company_name,
    submittedAt: new Date(prospect.submitted_at),
    contactName: prospect.primary_contact_name,
    contactEmail: prospect.primary_contact_email,
  });

  // Collect renderable sections (non-empty)
  const prospectAsRecord = prospect as unknown as Record<string, unknown>;
  const renderableSections = PROSPECT_SECTIONS.map((section, idx) => {
    const data = (prospectAsRecord[section.storageKey] as Record<string, unknown>) ?? {};
    const fields = section.fields
      .map((f) => ({
        label: f.label,
        value: fmtValue(data[f.key], f.type),
      }))
      .filter((f) => f.value.length > 0);

    return {
      num: String(idx + 1).padStart(2, "0"),
      title: section.title,
      subtitle: section.subtitle,
      fields,
    };
  }).filter((s) => s.fields.length > 0);

  // TOC (page 2), sections start at page 3
  const tocEntries = renderableSections.map((s, i) => ({
    num: s.num,
    title: s.title,
    page: 3 + i,
  }));
  addTableOfContents(doc, tocEntries);

  // Section pages
  renderableSections.forEach((section, idx) => {
    doc.addPage();
    let y = 35;
    y = addSectionHeading(doc, y, section.num, section.title, section.subtitle);
    addFieldsTable(doc, y, section.fields);
    addPageFooter(doc, 3 + idx);
  });

  return doc;
}

/* ── Client onboarding field extraction ──────────────────────────────────── */

interface ClientSection {
  num: string;
  title: string;
  subtitle: string;
  fields: Array<{ label: string; value: string }>;
}

function extractClientSections(form: FormShape): ClientSection[] {
  const sections: ClientSection[] = [];

  // ── Section 1: Team Contacts ──
  const contactFields: Array<{ label: string; value: string }> = [];
  const contacts = [
    { label: "Sportsbook", key: "contact_sportsbook" },
    { label: "Operational", key: "contact_operational" },
    { label: "Compliance", key: "contact_compliance" },
  ] as const;
  contacts.forEach(({ label, key }) => {
    const c = form[key];
    if (c.name) contactFields.push({ label: `${label} — Name`, value: c.name });
    if (c.email) contactFields.push({ label: `${label} — Email`, value: c.email });
    if (c.phone) contactFields.push({ label: `${label} — Phone`, value: c.phone });
  });
  if (form.slack_team_emails)
    contactFields.push({ label: "Slack Team Emails", value: form.slack_team_emails });
  if (contactFields.length > 0)
    sections.push({ num: "01", title: "Team Contacts", subtitle: "Sportsbook, operational & compliance leads", fields: contactFields });

  // ── Section 2: Media & Branding ──
  const uploadLabels: Record<string, string> = {
    asset_company_logo: "Company Logo",
    asset_app_name_logo: "App Name Logo",
    asset_currency_icon: "Currency Icon",
    asset_top_left_icon: "Top Left Icon",
    asset_favicon: "Favicon",
    asset_ios_icon: "iOS Icon",
    asset_android_icon: "Android Icon",
    asset_loading_anim: "Loading Animation",
    asset_splash_anim: "Splash Animation",
    asset_live_icon_anim: "Live Icon Animation",
  };
  const uploadedYes: string[] = [];
  const uploadedNo: string[] = [];
  for (const [key, label] of Object.entries(uploadLabels)) {
    if ((form as unknown as Record<string, unknown>)[key]) {
      uploadedYes.push(label);
    } else {
      uploadedNo.push(label);
    }
  }
  const mediaFields: Array<{ label: string; value: string }> = [];
  if (uploadedYes.length > 0)
    mediaFields.push({ label: "Confirmed Uploads", value: uploadedYes.join(", ") });
  if (uploadedNo.length > 0)
    mediaFields.push({ label: "Pending Uploads", value: uploadedNo.join(", ") });
  if (mediaFields.length > 0)
    sections.push({ num: "02", title: "Media & Branding", subtitle: "Brand asset upload confirmations", fields: mediaFields });

  // ── Section 3: Platform Setup ──
  const platformFields: Array<{ label: string; value: string }> = [];
  const platformStrings: Array<[string, string]> = [
    ["Platform URL", form.platform_url],
    ["Country", form.country],
    ["DNS Provider", form.dns_provider],
    ["DNS Access Granted", form.dns_access === "yes" ? "Yes" : form.dns_access === "no" ? "No" : ""],
    ["Background Color", form.color_background],
    ["Primary Color", form.color_primary],
    ["Secondary Color", form.color_secondary],
    ["Light Text Color", form.color_light_text],
    ["Placeholder Color", form.color_placeholder],
    ["Button Gradient A", form.btn_gradient_a],
    ["Button Gradient B", form.btn_gradient_b],
    ["Box Gradient A", form.box_gradient_a],
    ["Box Gradient B", form.box_gradient_b],
    ["Header Gradient A", form.header_gradient_a],
    ["Header Gradient B", form.header_gradient_b],
    ["Won Gradient A", form.won_gradient_a],
    ["Won Gradient B", form.won_gradient_b],
  ];
  platformStrings.forEach(([label, value]) => {
    if (value) platformFields.push({ label, value });
  });
  if (platformFields.length > 0)
    sections.push({ num: "03", title: "Platform Setup", subtitle: "URL, country, DNS and color system", fields: platformFields });

  // ── Section 4: Legal & Policies ──
  const legalFields: Array<{ label: string; value: string }> = [];
  const legalItems: Array<[string, string]> = [
    ["Footer Required", form.footer_required === "yes" ? "Yes" : form.footer_required === "no" ? "No" : ""],
    ["Landing Page", form.landing_page === "yes" ? "Yes" : form.landing_page === "no" ? "No" : ""],
    ["Terms & Conditions URL", form.terms_url],
    ["Privacy Policy URL", form.privacy_url],
    ["Responsible Gambling URL", form.rg_url],
    ["Landing Page URL", form.landing_page_url],
  ];
  legalItems.forEach(([label, value]) => {
    if (value) legalFields.push({ label, value });
  });
  if (legalFields.length > 0)
    sections.push({ num: "04", title: "Legal & Policies", subtitle: "Regulatory and compliance URLs", fields: legalFields });

  // ── Section 5: 3rd Party ──
  const thirdFields: Array<{ label: string; value: string }> = [];
  const psps: string[] = [];
  if (form.psp_opay) psps.push("Opay");
  if (form.psp_palmpay) psps.push("PalmPay");
  if (form.psp_paystack) psps.push("Paystack");
  if (psps.length > 0) thirdFields.push({ label: "Payment Providers", value: psps.join(", ") });
  if (form.psp_priority) thirdFields.push({ label: "PSP Priority", value: form.psp_priority });
  if (form.kyc_surt) thirdFields.push({ label: "KYC SURT", value: form.kyc_surt === "yes" ? "Yes" : "No" });
  if (form.kyc_notes) thirdFields.push({ label: "KYC Notes", value: form.kyc_notes });

  const smsValue = form.sms_provider === "infobip" ? "Infobip"
    : form.sms_provider === "other" ? `Other: ${form.sms_provider_other || "—"}`
    : "";
  if (smsValue) thirdFields.push({ label: "SMS Provider", value: smsValue });

  const dunsValue = form.duns_status === "have" ? `Have it${form.duns_number ? `: ${form.duns_number}` : ""}`
    : form.duns_status === "in_progress" ? "In progress"
    : form.duns_status === "none" ? "None"
    : "";
  if (dunsValue) thirdFields.push({ label: "DUNS Status", value: dunsValue });
  if (form.zendesk) thirdFields.push({ label: "Zendesk", value: form.zendesk === "yes" ? "Yes" : "No" });
  if (form.zendesk === "yes" && form.zendesk_script)
    thirdFields.push({ label: "Zendesk Script", value: form.zendesk_script });

  const analytics: string[] = [];
  if (form.analytics_meta) analytics.push("Meta Pixel");
  if (form.analytics_ga) analytics.push("Google Analytics");
  if (form.analytics_gtm) analytics.push("Google Tag Manager");
  if (form.analytics_snapchat) analytics.push("Snapchat");
  if (form.analytics_reddit) analytics.push("Reddit");
  if (analytics.length > 0) thirdFields.push({ label: "Analytics Tags", value: analytics.join(", ") });

  if (thirdFields.length > 0)
    sections.push({ num: "05", title: "3rd Party Integrations", subtitle: "PSPs, KYC, SMS, analytics", fields: thirdFields });

  return sections;
}

/* ── Client onboarding PDF ────────────────────────────────────────────────── */

export interface ClientPDFInput {
  name: string;
  primary_contact_email: string;
  submitted_at: string;
}

export function buildClientPDF(client: ClientPDFInput, form: FormShape): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  addCoverPage(doc, {
    type: "Onboarding",
    companyName: client.name,
    submittedAt: new Date(client.submitted_at),
    contactEmail: client.primary_contact_email,
  });

  const sections = extractClientSections(form).filter((s) => s.fields.length > 0);

  const tocEntries = sections.map((s, i) => ({
    num: s.num,
    title: s.title,
    page: 3 + i,
  }));
  addTableOfContents(doc, tocEntries);

  sections.forEach((section, idx) => {
    doc.addPage();
    let y = 35;
    y = addSectionHeading(doc, y, section.num, section.title, section.subtitle);
    addFieldsTable(doc, y, section.fields);
    addPageFooter(doc, 3 + idx);
  });

  return doc;
}
