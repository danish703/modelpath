export interface ContactChannel {
  label: string;
  email: string;
  description: string;
  purpose: string;
  status: 'active-verified';
  deliveryType: 'incoming-routed';
}

export interface StudioContactConfig {
  studioName: string;
  tagline: string;
  intro: string;
  emails: {
    hello: string;
    support: string;
    privacy: string;
  };
  routingProvider: string;
  routingNotice: string;
  channels: ContactChannel[];
  postalAddressNote: string;
}

export const studioContactConfig: StudioContactConfig = {
  studioName: "ModelPath Studio",
  tagline: "Independent Software Studio",
  intro: "ModelPath Studio is an independent digital product studio focused on creating purposeful, beautifully crafted software. We welcome direct communications regarding our applications, partnership discussions, technical inquiries, and user feedback.",
  emails: {
    hello: "hello@modelpath.app",
    support: "support@modelpath.app",
    privacy: "privacy@modelpath.app",
  },
  routingProvider: "Cloudflare Email Routing",
  routingNotice: "Official incoming communication channels are active and routed directly to our engineering team.",
  channels: [
    {
      label: "General Inquiries & Partnerships",
      email: "hello@modelpath.app",
      description: "For studio partnerships, media inquiries, and general questions about ModelPath Studio.",
      purpose: "General",
      status: "active-verified",
      deliveryType: "incoming-routed"
    },
    {
      label: "Application Support",
      email: "support@modelpath.app",
      description: "For technical questions, issue reports, and feedback concerning our applications.",
      purpose: "Support",
      status: "active-verified",
      deliveryType: "incoming-routed"
    },
    {
      label: "Privacy & Data Governance",
      email: "privacy@modelpath.app",
      description: "For data protection inquiries, deletion requests, and privacy policy clarifications.",
      purpose: "Privacy",
      status: "active-verified",
      deliveryType: "incoming-routed"
    }
  ],
  postalAddressNote: "ModelPath Studio operates as a distributed digital studio. A physical business correspondence address has not yet been established and remains a pending operational requirement for future corporate registration."
};
