/**
 * pdf-builder.tsx - Premium PDF generation using @react-pdf/renderer.
 * Produces a cover page, table of contents, and per-section field tables.
 * Inter font bundled locally in /public/fonts/ as woff2 (@react-pdf/renderer v4+ supports woff2).
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import { PROSPECT_SECTIONS } from "./prospect-fields";
import type { FormShape } from "./onboarding-schema";

/* ── Font registration ─────────────────────────────────────────────────────── */

const FONT_BASE =
  typeof window !== "undefined"
    ? `${window.location.origin}/fonts`
    : "/fonts";

Font.register({
  family: "Inter",
  fonts: [
    { src: `${FONT_BASE}/Inter-Regular.woff2`, fontWeight: 400 },
    { src: `${FONT_BASE}/Inter-Medium.woff2`, fontWeight: 500 },
    { src: `${FONT_BASE}/Inter-SemiBold.woff2`, fontWeight: 600 },
    { src: `${FONT_BASE}/Inter-Bold.woff2`, fontWeight: 700 },
  ],
});

// Prevent automatic word hyphenation
Font.registerHyphenationCallback((word) => [word]);

/* ── Brand colors ──────────────────────────────────────────────────────────── */

const C = {
  primary: "#6366F1",
  dark: "#0F172A",
  text: "#1E1E2E",
  muted: "#64748B",
  subtle: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  white: "#FFFFFF",
  accent: "#F8FAFC",
};

/* ── Styles ────────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    color: C.text,
    backgroundColor: C.white,
  },

  // ── Cover page ──
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: C.primary,
  },
  cover: {
    padding: 50,
    paddingTop: 60,
    flex: 1,
    flexDirection: "column",
  },
  coverHeader: {
    marginBottom: 0,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: 700,
    color: C.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  wordmarkLine: {
    width: 40,
    height: 2,
    backgroundColor: C.primary,
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  coverHero: {
    flex: 1,
    justifyContent: "center",
  },
  companyName: {
    fontSize: 38,
    fontWeight: 700,
    color: C.dark,
    lineHeight: 1.1,
    marginBottom: 14,
  },
  submittedText: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 0,
  },
  coverMeta: {
    fontSize: 10,
    color: C.subtle,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
  },
  contactBlock: {
    padding: 20,
    backgroundColor: C.accent,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
    borderLeftStyle: "solid",
    marginBottom: 50,
  },
  contactLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  contactName: {
    fontSize: 13,
    fontWeight: 600,
    color: C.dark,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 11,
    color: C.muted,
  },

  // ── Shared content page layout ──
  contentPage: {
    padding: 50,
    paddingTop: 48,
    paddingBottom: 80,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: C.dark,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 40,
    height: 2,
    backgroundColor: C.primary,
    marginBottom: 32,
  },

  // ── TOC ──
  tocRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    borderBottomStyle: "solid",
  },
  tocNumBox: {
    width: 24,
    height: 24,
    backgroundColor: C.primary,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tocNumText: {
    fontSize: 9,
    fontWeight: 700,
    color: C.white,
  },
  tocLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 500,
    color: C.dark,
  },
  tocPageNum: {
    fontSize: 10,
    color: C.subtle,
    fontWeight: 500,
  },

  // ── Section pages ──
  sectionPage: {
    padding: 50,
    paddingTop: 48,
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  sectionBadge: {
    width: 36,
    height: 36,
    backgroundColor: C.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: 700,
    color: C.white,
  },
  sectionTitleBlock: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: C.dark,
    lineHeight: 1.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: C.border,
    marginTop: 20,
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    borderBottomStyle: "solid",
  },
  fieldLabel: {
    width: "40%",
    fontSize: 9,
    fontWeight: 600,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    paddingRight: 12,
  },
  fieldValue: {
    width: "60%",
    fontSize: 11,
    color: C.dark,
    lineHeight: 1.45,
    fontWeight: 400,
  },

  // ── Footer (absolute, pinned to bottom of every page) ──
  footer: {
    position: "absolute",
    bottom: 26,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
  },
  footerLeft: {
    fontSize: 8,
    color: C.subtle,
    letterSpacing: 0.5,
  },
  footerRight: {
    fontSize: 8,
    color: C.subtle,
    fontWeight: 600,
  },
});

/* ── Shared footer component ───────────────────────────────────────────────── */

function PageFooter() {
  return (
    <View style={s.footer}>
      <Text style={s.footerLeft}>TRIVELTA - Confidential Client Document</Text>
      <Text
        style={s.footerRight}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

/* ── Cover page ────────────────────────────────────────────────────────────── */

function CoverPage({
  type,
  companyName,
  submittedAt,
  contactName,
  contactEmail,
  sectionCount,
  fieldCount,
}: {
  type: "Pre-Onboarding" | "Onboarding";
  companyName: string;
  submittedAt: Date;
  contactName?: string | null;
  contactEmail: string;
  sectionCount: number;
  fieldCount: number;
}) {
  const dateStr = submittedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = submittedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Page size="A4" style={s.page}>
      <View style={s.accentBar} />
      <View style={s.cover}>
        {/* Header */}
        <View style={s.coverHeader}>
          <Text style={s.wordmark}>TRIVELTA</Text>
          <View style={s.wordmarkLine} />
          <Text style={s.typeLabel}>{type.toUpperCase()} - SUBMISSION SUMMARY</Text>
        </View>

        {/* Hero - vertically centred in remaining space */}
        <View style={s.coverHero}>
          <Text style={s.companyName}>{companyName}</Text>
          <Text style={s.submittedText}>{`Submitted on ${dateStr} at ${timeStr}`}</Text>
          <Text style={s.coverMeta}>
            {`${sectionCount} section${sectionCount !== 1 ? "s" : ""} - ${fieldCount} fields completed`}
          </Text>
        </View>

        {/* Contact card */}
        <View style={s.contactBlock}>
          <Text style={s.contactLabel}>Primary Contact</Text>
          {contactName ? <Text style={s.contactName}>{contactName}</Text> : null}
          <Text style={s.contactEmail}>{contactEmail}</Text>
        </View>
      </View>
      <PageFooter />
    </Page>
  );
}

/* ── Table of contents page ────────────────────────────────────────────────── */

function TocPage({
  sections,
}: {
  sections: Array<{ num: string; title: string; page: number }>;
}) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.contentPage}>
        <Text style={s.pageTitle}>Contents</Text>
        <View style={s.titleUnderline} />
        {sections.map((item, idx) => (
          <View key={idx} style={s.tocRow}>
            <View style={s.tocNumBox}>
              <Text style={s.tocNumText}>{item.num}</Text>
            </View>
            <Text style={s.tocLabel}>{item.title}</Text>
            <Text style={s.tocPageNum}>{item.page}</Text>
          </View>
        ))}
      </View>
      <PageFooter />
    </Page>
  );
}

/* ── Section data page ─────────────────────────────────────────────────────── */

function SectionPage({
  number,
  title,
  subtitle,
  fields,
}: {
  number: string;
  title: string;
  subtitle?: string;
  fields: Array<{ label: string; value: string }>;
}) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.sectionPage}>
        {/* Badge + title inline */}
        <View style={s.sectionHeader}>
          <View style={s.sectionBadge}>
            <Text style={s.sectionBadgeText}>{number}</Text>
          </View>
          <View style={s.sectionTitleBlock}>
            <Text style={s.sectionTitle}>{title}</Text>
            {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={s.sectionDivider} />

        {fields.map((f, idx) => (
          <View key={idx} style={s.fieldRow}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <Text style={s.fieldValue}>{f.value}</Text>
          </View>
        ))}
      </View>
      <PageFooter />
    </Page>
  );
}

/* ── Field value formatter ─────────────────────────────────────────────────── */

function fmtValue(value: unknown, fieldType?: string): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") {
    if (fieldType === "boolean_tri") {
      if (value === "yes") return "Yes";
      if (value === "no") return "No";
      if (value === "maybe" || value === "not_sure") return "Not sure yet";
    }
    return value.trim();
  }
  if (Array.isArray(value)) {
    const filtered = (value as unknown[]).filter((v) => v !== null && v !== undefined && v !== "");
    if (filtered.length === 0) return "";
    return filtered.map((v) => (typeof v === "string" ? v.trim() : String(v))).join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/* ── Prospect PDF ──────────────────────────────────────────────────────────── */

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

function ProspectDocument({ prospect }: { prospect: ProspectPDFInput }) {
  const prospectRecord = prospect as unknown as Record<string, unknown>;
  const renderableSections = PROSPECT_SECTIONS.map((section, idx) => {
    const data =
      (prospectRecord[section.storageKey] as Record<string, unknown>) ?? {};
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

  const totalFields = renderableSections.reduce((sum, s) => sum + s.fields.length, 0);

  const tocEntries = renderableSections.map((s, i) => ({
    num: s.num,
    title: s.title,
    page: 3 + i,
  }));

  return (
    <Document>
      <CoverPage
        type="Pre-Onboarding"
        companyName={prospect.legal_company_name}
        submittedAt={new Date(prospect.submitted_at)}
        contactName={prospect.primary_contact_name}
        contactEmail={prospect.primary_contact_email}
        sectionCount={renderableSections.length}
        fieldCount={totalFields}
      />
      <TocPage sections={tocEntries} />
      {renderableSections.map((section) => (
        <SectionPage
          key={section.num}
          number={section.num}
          title={section.title}
          subtitle={section.subtitle}
          fields={section.fields}
        />
      ))}
    </Document>
  );
}

export async function downloadProspectPDF(prospect: ProspectPDFInput) {
  const blob = await pdf(<ProspectDocument prospect={prospect} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = prospect.legal_company_name.replace(/\s+/g, "-").toLowerCase();
  a.download = `${safeName}-pre-onboarding-${new Date().toISOString().split("T")[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/* ── Client onboarding field extraction ───────────────────────────────────── */

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
    if (c.name) contactFields.push({ label: `${label} - Name`, value: c.name });
    if (c.email) contactFields.push({ label: `${label} - Email`, value: c.email });
    if (c.phone) contactFields.push({ label: `${label} - Phone`, value: c.phone });
  });
  if (form.slack_team_emails)
    contactFields.push({ label: "Slack Team Emails", value: form.slack_team_emails });
  if (contactFields.length > 0)
    sections.push({
      num: "01",
      title: "Team Contacts",
      subtitle: "Sportsbook, operational & compliance leads",
      fields: contactFields,
    });

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
    sections.push({
      num: "02",
      title: "Media & Branding",
      subtitle: "Brand asset upload confirmations",
      fields: mediaFields,
    });

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
    sections.push({
      num: "03",
      title: "Platform Setup",
      subtitle: "URL, country, DNS and color system",
      fields: platformFields,
    });

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
    sections.push({
      num: "04",
      title: "Legal & Policies",
      subtitle: "Regulatory and compliance URLs",
      fields: legalFields,
    });

  // ── Section 5: 3rd Party Integrations ──
  const thirdFields: Array<{ label: string; value: string }> = [];
  const psps: string[] = [];
  if (form.psp_opay) psps.push("Opay");
  if (form.psp_palmpay) psps.push("PalmPay");
  if (form.psp_paystack) psps.push("Paystack");
  if (form.psp_aeropay) psps.push("Aeropay");
  if (form.psp_finix) psps.push("Finix");
  if (form.psp_nmi) psps.push("NMI");
  if (form.psp_worldpay) psps.push("Worldpay");
  if (form.psp_bitolo) psps.push("Bitolo");
  if (form.psp_evervault) psps.push("Evervault");
  if (form.psp_other) psps.push("Other");
  if (psps.length > 0) thirdFields.push({ label: "Payment Providers", value: psps.join(", ") });
  if (form.psp_priority) thirdFields.push({ label: "PSP Priority", value: form.psp_priority });
  if (form.kyc_surt) thirdFields.push({ label: "KYC SURT", value: form.kyc_surt === "yes" ? "Yes" : "No" });
  if (form.kyc_notes) thirdFields.push({ label: "KYC Notes", value: form.kyc_notes });

  const smsValue =
    form.sms_provider === "infobip"
      ? "Infobip"
      : form.sms_provider === "other"
        ? `Other: ${form.sms_provider_other || "-"}`
        : "";
  if (smsValue) thirdFields.push({ label: "SMS Provider", value: smsValue });

  const dunsValue =
    form.duns_status === "have"
      ? `Have it${form.duns_number ? `: ${form.duns_number}` : ""}`
      : form.duns_status === "in_progress"
        ? "In progress"
        : form.duns_status === "none"
          ? "None"
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
  if (form.analytics_onefeed) analytics.push("OneFeed");
  if (analytics.length > 0) thirdFields.push({ label: "Analytics Tags", value: analytics.join(", ") });

  if (thirdFields.length > 0)
    sections.push({
      num: "05",
      title: "3rd Party Integrations",
      subtitle: "PSPs, KYC, SMS, analytics",
      fields: thirdFields,
    });

  return sections;
}

/* ── Client onboarding PDF ─────────────────────────────────────────────────── */

export interface ClientPDFInput {
  name: string;
  primary_contact_email: string;
  submitted_at: string;
}

function ClientDocument({
  client,
  form,
}: {
  client: ClientPDFInput;
  form: FormShape;
}) {
  const sections = extractClientSections(form).filter((s) => s.fields.length > 0);
  const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0);
  const tocEntries = sections.map((s, i) => ({
    num: s.num,
    title: s.title,
    page: 3 + i,
  }));

  return (
    <Document>
      <CoverPage
        type="Onboarding"
        companyName={client.name}
        submittedAt={new Date(client.submitted_at)}
        contactEmail={client.primary_contact_email}
        sectionCount={sections.length}
        fieldCount={totalFields}
      />
      <TocPage sections={tocEntries} />
      {sections.map((section) => (
        <SectionPage
          key={section.num}
          number={section.num}
          title={section.title}
          subtitle={section.subtitle}
          fields={section.fields}
        />
      ))}
    </Document>
  );
}

export async function downloadClientPDF(client: ClientPDFInput, form: FormShape) {
  const blob = await pdf(<ClientDocument client={client} form={form} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = client.name.replace(/\s+/g, "-").toLowerCase();
  a.download = `${safeName}-onboarding-${new Date().toISOString().split("T")[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
