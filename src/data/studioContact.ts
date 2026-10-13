export interface ContactChannel {
  label: string;
  email: string;
  description: string;
  purpose: string;
}

export interface StudioContactConfig {
  studioName: string;
  tagline: string;
  intro: string;
  channels: ContactChannel[];
  responseTimeNote: string;
  postalAddressNote: string;
}

export const studioContactConfig: StudioContactConfig = {
  studioName: "ModelPath Studio",
  tagline: "Independent Software Studio",
  intro: "ModelPath Studio is an independent digital product studio focused on creating purposeful, beautifully crafted software. We welcome direct communications regarding our applications, partnership discussions, technical inquiries, and user feedback.",
  channels: [
    {
      label: "General Inquiries & Partnerships",
      email: "hello@modelpath.app",
      description: "For studio partnerships, media inquiries, and general questions about ModelPath Studio.",
      purpose: "General"
    },
    {
      label: "Application Support",
      email: "support@modelpath.app",
      description: "For technical questions, issue reports, and feedback concerning our applications.",
      purpose: "Support"
    },
    {
      label: "Privacy & Data Governance",
      email: "privacy@modelpath.app",
      description: "For data protection inquiries, deletion requests, and privacy policy clarifications.",
      purpose: "Privacy"
    }
  ],
  responseTimeNote: "As an independent studio, our team reviews incoming communications directly. We aim to respond to inquiries within 2 to 3 business days.",
  postalAddressNote: "ModelPath Studio operates as a distributed digital studio. A physical business correspondence address has not yet been established and remains a pending operational requirement for future corporate registration."
};
