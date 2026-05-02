export type OutreachStatus = "sent" | "replied" | "follow_up" | "draft";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface OutreachEmail {
  id: string;
  professor: string;
  institution: string;
  subject: string;
  status: OutreachStatus;
  sent: string;
  confidence: ConfidenceLevel;
  matchScore: number;
}

export type OutreachDraft = {
  id: string;
  professor: {
    name: string;
    title: string;
    university: string;
    department: string;
    research: string[];
    email: string;
    color: string;
  };
  subject: string;
  body: string;
  matchScore: number;
};

export type View = "Overview" | "Outreach" | "Professors" | "Compose" | "Profile";
