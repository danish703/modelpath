export type EvidenceStatus = 'confirmed' | 'planned' | 'requires-confirmation';

export interface PrivacyChecklistItem {
  category: string;
  item: string;
  status: EvidenceStatus;
  findingDetails: string;
}

export interface AppPrivacyEvidenceProfile {
  appName: string;
  slug: string;
  currentPolicyStatus: 'draft' | 'pending-review' | 'verified';
  summary: string;
  checklist: PrivacyChecklistItem[];
}

export const appPrivacyChecklists: Record<string, AppPrivacyEvidenceProfile> = {
  signmint: {
    appName: "SignMint",
    slug: "signmint",
    currentPolicyStatus: "pending-review",
    summary: "SignMint is a coming-soon document utility with no local repository evidence accessible in the workspace. All integration details, advertising networks, and telemetry status require explicit developer confirmation.",
    checklist: [
      {
        category: "Third-Party Advertising",
        item: "Google AdMob / Advertising SDKs",
        status: "requires-confirmation",
        findingDetails: "No codebase accessible in local environment. Ad network presence requires developer audit."
      },
      {
        category: "Cloud & Analytics",
        item: "Firebase / Telemetry / Crash Reporting",
        status: "requires-confirmation",
        findingDetails: "Analytics and telemetry state unverified pending repository access."
      },
      {
        category: "Local Document Storage",
        item: "Device Document & Signature Storage",
        status: "planned",
        findingDetails: "Architecture planned for local on-device PDF processing; formal storage auditing pending."
      },
      {
        category: "Device Permissions",
        item: "Storage & Pen Input Permissions",
        status: "planned",
        findingDetails: "Document file access permissions planned for PDF loading; exact Android manifest unverified."
      }
    ]
  },
  ehub: {
    appName: "Ehub",
    slug: "ehub",
    currentPolicyStatus: "pending-review",
    summary: "Audited against D:\\AppPro. Confirmed local-first architecture with Drift SQLite and file picker. Zero third-party ad SDKs or analytics trackers detected in pubspec dependencies.",
    checklist: [
      {
        category: "Third-Party Advertising",
        item: "Google AdMob / Ad Networks",
        status: "confirmed",
        findingDetails: "Zero advertising dependencies found in pubspec.yaml. App currently contains no ad networks."
      },
      {
        category: "Cloud & Analytics",
        item: "Firebase / Remote Telemetry",
        status: "confirmed",
        findingDetails: "Zero analytics or Firebase packages in pubspec.yaml. No remote tracking code detected."
      },
      {
        category: "Local Data Storage",
        item: "Drift SQLite Database & File Storage",
        status: "confirmed",
        findingDetails: "Local SQLite database via drift/drift_flutter stores library records and reader settings strictly on-device."
      },
      {
        category: "Device Authentication",
        item: "Biometric Screen Lock (local_auth)",
        status: "confirmed",
        findingDetails: "Uses local_auth for optional library PIN/biometric unlock. Prompts handled by OS; no biometric data collected."
      },
      {
        category: "Device Permissions",
        item: "File Picker / Storage Access",
        status: "confirmed",
        findingDetails: "Uses file_picker to import user-selected EPUB and PDF documents from device storage."
      },
      {
        category: "Network Services",
        item: "Public Catalog Download Service",
        status: "planned",
        findingDetails: "Public-domain catalog access documented in roadmap; not yet integrated into active build."
      }
    ]
  },
  pylab: {
    appName: "PyLab",
    slug: "pylab",
    currentPolicyStatus: "pending-review",
    summary: "Audited against D:\\PythonPro\\LearnPython\\pylab_spike. Confirmed integration of Google Mobile Ads (AdMob) with UMP consent in main.dart, local notifications, and on-device Pyodide webview runner.",
    checklist: [
      {
        category: "Third-Party Advertising",
        item: "Google Mobile Ads (AdMob) SDK",
        status: "confirmed",
        findingDetails: "Confirmed dependency (google_mobile_ads: ^9.1.0) and initialization via AdService.instance.init() in main.dart."
      },
      {
        category: "User Privacy Consent",
        item: "Google UMP (User Messaging Platform)",
        status: "confirmed",
        findingDetails: "AdService initializes UMP consent flow prior to ad requests for GDPR/CCPA compliance."
      },
      {
        category: "Local Notifications",
        item: "Daily Challenge Reminders",
        status: "confirmed",
        findingDetails: "Uses flutter_local_notifications for device-scheduled study reminders. No data transmitted externally."
      },
      {
        category: "Code Execution Environment",
        item: "WebView Pyodide Python Runner",
        status: "confirmed",
        findingDetails: "Bundled Python runtime in assets/pyodide/ runs within an isolated webview on-device."
      },
      {
        category: "Cloud & Analytics",
        item: "Firebase / Telemetry SDKs",
        status: "confirmed",
        findingDetails: "Zero Firebase or external analytics dependencies present in pubspec.yaml."
      },
      {
        category: "Crash Reporting",
        item: "Crashlytics / Sentry Reporting",
        status: "requires-confirmation",
        findingDetails: "No external crash reporting dependency in active spike; production monitoring unconfirmed."
      }
    ]
  },
  'modelpath-ml': {
    appName: "ModelPath ML",
    slug: "modelpath-ml",
    currentPolicyStatus: "pending-review",
    summary: "Internal research exploration. Publication status is unconfirmed; no production architecture, telemetry, or data handling pipelines exist for public distribution.",
    checklist: [
      {
        category: "Third-Party Advertising",
        item: "Advertising SDKs",
        status: "requires-confirmation",
        findingDetails: "Unconfirmed. Research exploration stage; no monetization SDKs integrated."
      },
      {
        category: "Cloud & Analytics",
        item: "Model Inference & Telemetry Services",
        status: "requires-confirmation",
        findingDetails: "Inference pipelines and data governance unverified pending formal studio roadmap definition."
      },
      {
        category: "Data Storage",
        item: "Local vs Cloud Model Weights",
        status: "planned",
        findingDetails: "Architecture under research; planned storage patterns require studio confirmation."
      }
    ]
  }
};
