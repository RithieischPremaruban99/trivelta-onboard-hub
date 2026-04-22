/**
 * pdf-builder.tsx — Premium PDF generation using @react-pdf/renderer.
 * Produces a cover page, table of contents, and per-section field tables.
 * Inter font is loaded from /fonts/ (public/fonts/) for crisp, on-brand output.
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

Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/Inter-Regular.woff2", fontWeight: 400 },
    { src: "/fonts/Inter-Medium.woff2", fontWeight: 500 },
    { src: "/fonts/Inter-SemiBold.woff2", fontWeight: 600 },
    { src: "/fonts/Inter-Bold.woff2", fontWeight: 700 },
  ],
});

// Prevent automatic word hyphenation
Font.registerHyphenationCallback((word) => [word]);

/* ── Brand colors ──────────────────────────────────────────────────────────── */

const C = {
  primary: "#6366F1",
  text: "#1E1E2E",
  muted: "#64748B",
  border: "#E2E8F0",
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
    paddingTop: 56,
    flex: 1,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: 700,
    color: C.primary,
    letterSpacing: 3,
    marginBottom: 6,
  },
  wordmarkLine: {
    width: 40,
    height: 2,
    backgroundColor: C.primary,
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: C.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 80,
  },
  companyName: {
    fontSize: 30,
    fontWeight: 700,
    color: C.text,
    lineHeight: 1.1,
    marginBottom: 14,
  },
  submittedText: {
    fontSize: 11,
    color: C.muted,
  },
  contactBlock: {
    marginTop: "auto",
    padding: 20,
    backgroundColor: C.accent,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    borderLeftStyle: "solid",
  },
  contactLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: C.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  contactName: {
    fontSize: 13,
    fontWeight: 600,
    color: C.text,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 11,
    color: C.muted,
  },

  // ── Shared content page layout ──
  contentPage: {
    padding: 50,
    paddingBottom: 80,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: C.text,
    marginBottom: 4,
  },
  titleUnderline: {
    width: 40,
    height: 2,
    backgroundColor: C.primary,
    marginBottom: 28,
  },

  // ── TOC ──
  tocRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  tocNumBox: {
    width: 22,
    height: 22,
    backgroundColor: C.primary,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tocNumText: {
    fontSize: 9,
    fontWeight: 700,
    color: C.white,
  },
  tocLabel: {
    flex: 1,
    fontSize: 11,
    color: C.text,
  },
  tocPageNum: {
    fontSize: 10,
    color: C.muted,
  },

  // ── Section pages ──
  sectionBadge: {
    width: 34,
    height: 34,
    backgroundColor: C.primary,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: 700,
    color: C.white,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: C.text,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 18,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: C.primary,
    marginBottom: 18,
  },
  fieldRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  fieldLabel: {
    width: "40%",
    fontSize: 9,
    fontWeight: 600,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingRight: 8,
  },
  fieldValue: {
    width: "60%",
    fontSize: 10,
    color: C.text,
    lineHeight: 1.4,
  },

  // ── Footer (absolute, rendered on every page) ──
  footer: {
    position: "absolute",
    bottom: 28,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    borderTopStyle: "solid",
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 0.8,
  },
});

/* ── Shared components ─────────────────────────────────────────────────────── */

function PageFooter({ pageNum }: { pageNum: number }) {
  return (
    <View style={s.footer}>
      <Text style={s.footerText}>TRIVELTA - CONFIDENTIAL CLIENT DOCUMENT</Text>
      <Text style={s.footerText}>PAGE {pageNum}</Text>
    </View>
  );
}

function CoverPage({
  type,
  companyName,
  submittedAt,
  contactName,
  contactEmail,
}: {
  type: "Pre-Onboarding" | "Onboarding";
  companyName: string;
  submittedAt: Date;
  contactName?: string | null;
  contactEmail: string;
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
        <Text style={s.wordmark}>TRIVELTA</Text>
        <View style={s.wordmarkLine} />
        <Text style={s.typeLabel}>{type} - Submission Summary</Text>

        <Text style={s.companyName}>{companyName}</Text>
        <Text style={s.submittedText}>
          {`Submitted on ${dateStr} at ${timeStr}`}
        </Text>

        <View style={s.contactBlock}>
          <Text style={s.contactLabel}>Primary Contact</Text>
          {contactName ? (
            <Text style={s.contactName}>{contactName}</Text>
          ) : null}
          <Text style={s.contactEmail}>{contactEmail}</Text>
        </View>
      </View>
      <PageFooter pageNum={1} />
    </Page>
  );
}

function TocPage({
  sections,
  pageNum,
}: {
  sections: Array<{ num: string; title: string; page: number }>;
  pageNum: number;
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
      <PageFooter pageNum={pageNum} />
    </Page>
  );
}

function SectionPage({
  number,
  title,
  subtitle,
  fields,
  pageNum,
}: {
  number: string;
  title: string;
  subtitle?: string;
  fields: Array<{ label: string; value: string }>;
  pageNum: number;
}) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.contentPage}>
        <View style={s.sectionBadge}>
          <Text style={s.sectionBadgeText}>{number}</Text>
        </View>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={s.sectionSubtitle}>{subtitle}</Text>
        ) : null}
        <View style={s.sectionDivider} />
        {fields.map((f, idx) => (
          <View key={idx} style={s.fieldRow}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <Text style={s.fieldValue}>{f.value}</Text>
          </View>
        ))}
      </View>
      <PageFooter pageNum={pageNum} />
    </Page>
  );
}

/* ── Field value formatter ─────────────────────────────────────────────────── */

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
  if (Array.isArray(value)) return (value as string[]).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
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
      />
      <TocPage sections={tocEntries} pageNum={2} />
      {renderableSections.map((section, i) => (
        <SectionPage
          key={section.num}
          number={section.num}
          title={section.title}
          subtitle={section.subtitle}
          fields={section.fields}
          pageNum={3 + i}
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
  a.click();
  URL.revokeObjectURL(url);
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
      />
      <TocPage sections={tocEntries} pageNum={2} />
      {sections.map((section, i) => (
        <SectionPage
          key={section.num}
          number={section.num}
          title={section.title}
          subtitle={section.subtitle}
          fields={section.fields}
          pageNum={3 + i}
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
  a.click();
  URL.revokeObjectURL(url);
}
