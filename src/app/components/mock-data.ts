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

export const recentOutreach: OutreachEmail[] = [
  {
    id: "em_a1b2c3d4e5f6",
    professor: "Dr. Sarah Chen",
    institution: "UC Berkeley",
    subject: "Distributed systems research — your 2024 Raft consensus paper",
    status: "replied",
    sent: "Apr 21, 03:15 PM",
    confidence: "high",
    matchScore: 0.94,
  },
  {
    id: "em_b2c3d4e5f6g7",
    professor: "Dr. James Liu",
    institution: "UCLA",
    subject: "Program synthesis + your compiler optimization work",
    status: "sent",
    sent: "Apr 19, 11:22 AM",
    confidence: "high",
    matchScore: 0.88,
  },
  {
    id: "em_c3d4e5f6g7h8",
    professor: "Dr. Priya Nair",
    institution: "Cal Poly SLO",
    subject: "ML interpretability research — referencing your ICML 2023 paper",
    status: "follow_up",
    sent: "Apr 17, 02:44 PM",
    confidence: "medium",
    matchScore: 0.76,
  },
  {
    id: "em_d4e5f6g7h8i9",
    professor: "Dr. Marcus Webb",
    institution: "UCLA",
    subject: "Systems programming internship interest — your OS scheduler research",
    status: "sent",
    sent: "Apr 17, 12:59 PM",
    confidence: "high",
    matchScore: 0.91,
  },
  {
    id: "em_e5f6g7h8i9j0",
    professor: "Dr. Yuki Tanaka",
    institution: "UC Berkeley",
    subject: "Formal verification + your 2024 property-based testing work",
    status: "replied",
    sent: "Apr 17, 12:57 PM",
    confidence: "high",
    matchScore: 0.89,
  },
  {
    id: "em_f6g7h8i9j0k1",
    professor: "Dr. Elena Vasquez",
    institution: "Cal Poly SLO",
    subject: "Networking research — your SDN paper from IEEE INFOCOM",
    status: "follow_up",
    sent: "Apr 16, 10:31 AM",
    confidence: "medium",
    matchScore: 0.72,
  },
  {
    id: "em_g7h8i9j0k1l2",
    professor: "Dr. Robert Kim",
    institution: "UCLA",
    subject: "Database systems + your query optimization research",
    status: "draft",
    sent: "—",
    confidence: "medium",
    matchScore: 0.81,
  },
];

export const analyticsData = [
  { date: "Apr 18", sent: 0, replies: 0 },
  { date: "Apr 19", sent: 1, replies: 0 },
  { date: "Apr 20", sent: 0, replies: 0 },
  { date: "Apr 21", sent: 0, replies: 1 },
  { date: "Apr 22", sent: 0, replies: 0 },
  { date: "Apr 23", sent: 0, replies: 0 },
  { date: "Apr 24", sent: 0, replies: 0 },
  { date: "Apr 25", sent: 0, replies: 0 },
  { date: "Apr 26", sent: 0, replies: 0 },
  { date: "Apr 27", sent: 0, replies: 0 },
  { date: "Apr 28", sent: 0, replies: 0 },
  { date: "Apr 29", sent: 2, replies: 0 },
  { date: "Apr 30", sent: 0, replies: 1 },
  { date: "May 01", sent: 3, replies: 0 },
  { date: "May 02", sent: 0, replies: 0 },
];

export const statusBreakdown = [
  { label: "Replied", value: 2, color: "#3b82f6" },
  { label: "Sent", value: 2, color: "#171717" },
  { label: "Follow-up", value: 2, color: "#f59e0b" },
  { label: "Draft", value: 1, color: "#d1d5db" },
];

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

export const MOCK_DRAFTS: OutreachDraft[] = [
  {
    id: "draft_1",
    professor: {
      name: "Dr. Alicia Zhang",
      title: "Associate Professor",
      university: "MIT",
      department: "CSAIL",
      research: ["LLMs", "RLHF", "Alignment"],
      email: "a.zhang@mit.edu",
      color: "#f0f4ff",
    },
    subject: "Research inquiry — scalable oversight and reward modeling",
    body: `Dear Prof. Zhang,

I came across your recent work on scalable oversight and was genuinely struck by how you framed the reward hacking problem — the idea that human feedback bottlenecks alignment at scale feels underexplored and your approach addresses it cleanly.

I'm a sophomore at [University] studying CS, currently working on a small project around RLHF data quality. I'd love to hear your thoughts on whether weak supervision signals can substitute for dense human labels at the pre-training stage.

Would you be open to a 20-minute chat sometime in the next few weeks? I'm happy to share what I've been building beforehand if that's useful.

Thank you for your time,
Rahul Thennarasu`,
    matchScore: 0.96,
  },
  {
    id: "draft_2",
    professor: {
      name: "Dr. Marcus Chen",
      title: "Assistant Professor",
      university: "Stanford",
      department: "Computer Science",
      research: ["Foundation Models", "Scaling Laws", "Emergent Abilities"],
      email: "m.chen@cs.stanford.edu",
      color: "#fff7ed",
    },
    subject: "Your scaling laws paper — a question on emergent behavior thresholds",
    body: `Dear Prof. Chen,

Your 2024 paper on emergent abilities in large language models changed how I think about capability jumps — particularly the section distinguishing metric-induced emergence from genuine phase transitions. I've reread it a few times now.

I'm a sophomore at [University] interested in how scaling interacts with instruction tuning. I've been running small experiments on whether LoRA fine-tunes preserve emergent properties from the base model, and I keep running into questions your lab seems well-positioned to answer.

If you have any bandwidth for a brief conversation, I'd really appreciate it. No pressure at all if the timing isn't right.

Best,
Rahul Thennarasu`,
    matchScore: 0.91,
  },
  {
    id: "draft_3",
    professor: {
      name: "Dr. Priya Sharma",
      title: "Associate Professor",
      university: "CMU",
      department: "Language Technologies Institute",
      research: ["RAG", "Question Answering", "Knowledge Grounding"],
      email: "psharma@lti.cs.cmu.edu",
      color: "#f0fdf4",
    },
    subject: "Question about retrieval-augmented generation and faithfulness",
    body: `Dear Prof. Sharma,

I read your ACL paper on faithfulness in retrieval-augmented generation and wanted to reach out. The way you operationalized "grounded hallucination" as distinct from confabulation gave me a much cleaner framework for thinking about the problem.

I've been building a small RAG pipeline for academic paper Q&A and keep running into cases where the model confidently cites retrieved passages it clearly misread. I'd love to understand how your group approaches eval for this — the metrics section of your paper was helpful but left me with questions about real-world deployment gaps.

Would you have 15-20 minutes sometime? I'm happy to share my setup in advance.

Thanks so much,
Rahul Thennarasu`,
    matchScore: 0.88,
  },
  {
    id: "draft_4",
    professor: {
      name: "Dr. James Okonkwo",
      title: "Assistant Professor",
      university: "UC Berkeley",
      department: "EECS",
      research: ["RL for LLMs", "Decision-Making", "Tool Use"],
      email: "j.okonkwo@berkeley.edu",
      color: "#fdf4ff",
    },
    subject: "LLM tool use + your work on agentic decision-making",
    body: `Dear Prof. Okonkwo,

Your recent work on LLM agents and tool use has been on my mind a lot — specifically the way you model planning as a latent variable rather than explicitly decoding a chain of thought. It reframed something I'd been confused about for months.

I'm an undergrad working on a small agentic system that schedules API calls based on natural language descriptions of workflows. I've hit a ceiling on making it reliable under ambiguous instructions and suspect the issue is in how I'm prompting for sub-goal decomposition.

If you're ever open to a casual conversation about agent reliability, I'd genuinely value your perspective. No prep needed on your end — I can bring the questions.

Best,
Rahul`,
    matchScore: 0.85,
  },
  {
    id: "draft_5",
    professor: {
      name: "Dr. Nadia Petrov",
      title: "Associate Professor",
      university: "Cornell",
      department: "Computer Science",
      research: ["Vision-Language Models", "Multimodal Learning", "Grounding"],
      email: "n.petrov@cs.cornell.edu",
      color: "#fff1f2",
    },
    subject: "Vision-language grounding — a question from your NeurIPS work",
    body: `Dear Prof. Petrov,

I've been following your work on vision-language grounding for a while, and your NeurIPS paper on compositional concept binding was one of the clearest treatments I've read of why VLMs fail on spatial reasoning. The controlled experiment design was especially clean.

I'm a sophomore interested in the intersection of language grounding and embodied reasoning. I've been thinking about whether the binding failures you documented are fundamentally a training distribution issue or an architectural one — and I'm curious whether your group has explored interventions at the attention level.

Would love to hear your take if you have a few minutes to chat. I'm also happy to share some exploratory notes I've been writing if that's helpful context.

Warmly,
Rahul Thennarasu`,
    matchScore: 0.82,
  },
];