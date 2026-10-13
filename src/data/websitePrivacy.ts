export interface PrivacySection {
  id: string;
  title: string;
  content: string[];
}

export interface WebsitePrivacyData {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  operator: string;
  websiteUrl: string;
  privacyEmail: string;
  sections: PrivacySection[];
}

export const websitePrivacyData: WebsitePrivacyData = {
  title: "Website Privacy Policy",
  effectiveDate: "October 13, 2026",
  lastUpdated: "October 13, 2026",
  operator: "ModelPath Studio",
  websiteUrl: "https://modelpath.app",
  privacyEmail: "privacy@modelpath.app",
  sections: [
    {
      id: "scope",
      title: "1. Scope and Application",
      content: [
        "This Privacy Policy applies solely to the public studio website located at https://modelpath.app, operated by ModelPath Studio.",
        "This policy does not govern the individual data handling practices of our standalone mobile applications. Each application maintained by ModelPath Studio operates under its own distinct, application-specific privacy disclosures linked directly from its respective product page."
      ]
    },
    {
      id: "no-tracking",
      title: "2. Information We Do Not Collect",
      content: [
        "The ModelPath Studio website is a static digital showcase built strictly for informational purposes.",
        "We do not require user account registration, profile creation, or authentication credentials.",
        "We do not use tracking cookies, cross-site advertising beacons, behavioral analytics scripts, or persistent fingerprinting mechanisms on this website.",
        "We do not sell, rent, monetize, or trade visitor information to any data brokers or commercial marketing platforms."
      ]
    },
    {
      id: "infrastructure",
      title: "3. Hosting Infrastructure and Edge Processing",
      content: [
        "The ModelPath Studio website is distributed globally through Cloudflare static hosting infrastructure.",
        "When you request a page from modelpath.app, standard network metadata (such as IP address, request timestamp, browser user-agent header, and referring URL) is processed ephemerally at network edge nodes.",
        "This technical routing data is utilized strictly for essential operational reliability, DDoS defense, SSL/TLS handshake termination, and malicious traffic mitigation. It is governed by Cloudflare's standard enterprise security and infrastructure practices."
      ]
    },
    {
      id: "communications",
      title: "4. Direct Inquiries and Communications",
      content: [
        "If you choose to contact ModelPath Studio directly via email, your email address, name, and message contents are received solely to evaluate and respond to your inquiry.",
        "Communication records are retained only as long as necessary to resolve your question, provide requested product support, or satisfy applicable compliance obligations.",
        "Communication records are not shared with third-party marketing services."
      ]
    },
    {
      id: "retention-rights",
      title: "5. Data Retention and User Rights",
      content: [
        "Because this website does not maintain persistent user accounts, profiles, or tracking databases, we do not store customer records on our web servers.",
        "If you have communicated with us via email and wish to request the deletion or review of past correspondence, you may submit a request to privacy@modelpath.app.",
        "We will evaluate and process all verified deletion and access requests in accordance with applicable data protection laws."
      ]
    },
    {
      id: "updates",
      title: "6. Changes to this Policy",
      content: [
        "We may revise this Website Privacy Policy from time to time to reflect changes in our hosting infrastructure, regulatory requirements, or studio practices.",
        "Any revisions will be posted directly to this page with an updated effective date at the top of the policy."
      ]
    },
    {
      id: "contact",
      title: "7. Contact Information",
      content: [
        "For any privacy-related inquiries, clarifications, or requests concerning the ModelPath Studio website, please contact our team via email at privacy@modelpath.app."
      ]
    }
  ]
};
