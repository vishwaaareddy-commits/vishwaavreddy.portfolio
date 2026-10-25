export type ProjectStatus =
  | "Shipped"
  | "Delivered"
  | "Built"
  | "In development"
  | "Partially implemented"
  | "Design / prototype";

export interface EvidenceLink {
  label: string;
  href: string;
}

export interface CaseStudy {
  id: string;
  index: string;
  title: string;
  org: string;
  kicker: string;
  status: ProjectStatus;
  statusNote: string;
  problem: string;
  contribution: string[];
  stack: string[];
  outcome: string;
  /** Present only when a public, verified artefact exists. */
  evidence?: EvidenceLink;
  evidenceNote: string;
}

export interface Build {
  id: string;
  title: string;
  org: string;
  status: ProjectStatus;
  summary: string;
  highlight: string;
  stack: string[];
  ownership?: string;
}

export interface ArchiveProject {
  title: string;
  context: string;
  summary: string;
  stack: string[];
  link?: EvidenceLink;
}

export interface CapabilityGroup {
  id: string;
  title: string;
  items: string[];
  /** Project ids (case studies or builds) that demonstrate this group. */
  provenBy: string[];
}

export interface TimelineEntry {
  role: string;
  org: string;
  period: string;
  kind: "Role" | "Internship" | "Virtual simulation" | "Education";
  summary: string;
  badge?: string;
  certificate?: EvidenceLink;
  current?: boolean;
}

export type NetworkNodeKind = "input" | "hub" | "sdk" | "vision" | "automation" | "data" | "output";

export interface NetworkNode {
  id: string;
  label: string;
  /** Short technical role shown under the title in the detail panel. */
  role: string;
  detail: string;
  /** What the scene demonstrates when this node is selected. */
  shows: string;
  link: EvidenceLink;
  position: [number, number, number];
  kind: NetworkNodeKind;
}
