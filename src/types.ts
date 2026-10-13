export interface SignalEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'alpha' | 'beta' | 'omega' | 'custom' | string;
  iconType: 'calendar' | 'video' | 'phone' | 'group' | 'alert' | string;
  active: boolean;
  syncedToGoogleCalendar: boolean;
  googleEventId?: string;
  sessionUrl?: string;
  date?: string; // YYYY-MM-DD for calendar day association
}

export type AccentColor = 'cyan' | 'magenta' | 'lime' | 'amber' | 'tokyo' | 'matte-white' | 'custom';

export interface TerminalLine {
  type: 'prompt' | 'info' | 'ok' | 'warn' | 'err';
  text: string;
  command?: string;
  timestamp?: string;
}

export interface MetricStats {
  systemActive: boolean;
  netProtocol: string;
  dbConnected: boolean;
  speedMbps: number;
  nodeStatus: 'OPTIMAL' | 'DEGRADED' | 'WARNING';
}

// === Personal_Os Linear-style Project Management ===
export interface Project {
  id: string;
  name: string;
  goal: string;
  scope: string; // List of scopes separated by newline
  outOfScope: string; // List of out-of-scopes separated by newline
  status: 'planning' | 'active' | 'completed';
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeEstimate: string; // e.g., "5h", "2d"
  dateEstimate: string; // target date e.g., "2026-06-15"
  status: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done';
  acceptanceCriteria: string[]; // clear checklist
}

// === Industrial Operations / Products / Inventory ===
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  variants: {
    sku: string;
    name: string;
    price: number;
    cost: number;
    stock: { [warehouseId: string]: number };
    expiringDate?: string; // Optional shelf-life date
  }[];
}

export interface ProviderProposal {
  providerName: string;
  cost: number;
  deliveryDays: number;
  reliabilityScore: number; // Percentage e.g. 95%
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  providerName: string;
  createdAt: string;
  status: 'generada' | 'enviada' | 'recibida';
  items: {
    sku: string;
    qty: number;
    cost: number;
  }[];
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
}

export interface WarehouseTransfer {
  id: string;
  sku: string;
  qty: number;
  fromWarehouseId: string;
  toWarehouseId: string;
  timestamp: string;
  status: 'completed' | 'in_transit';
}

// === Customizable System Space ===
export type ThemeMode = 'dark' | 'light_neocraft' | 'craft' | 'cyber' | 'editorial';

export interface PresentationConfig {
  backgroundImage: string;
  backdropBlur: number;
  overlayOpacity: number;
  bgPositionX: number;   // 0–100 (default 50 = center)
  bgPositionY: number;   // 0–100 (default 50 = center)
  accentPreference: AccentColor;
  audioLoop: string;
  volume: number;
  isPlayingSound: boolean;
  customH?: number;
  customS?: number;
  customL?: number;
  panelsSwapped?: boolean;
  sidebarWidth?: number;
  themeMode?: ThemeMode;
}

// === Audit Log ===
export interface AuditLog {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  user: string;
  detail: string;
}

// === Email Module (Superhuman-like) ===
export interface EmailMessage {
  id: string;
  from: string;
  fromName: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;         // HTML body
  bodyText: string;     // Plain text body
  snippet: string;      // Preview snippet
  date: string;         // ISO date string
  read: boolean;
  starred: boolean;
  folder: EmailFolder;
  labels: string[];
  attachments: EmailAttachment[];
  threadId?: string;
  replyTo?: string;
  provider: 'gmail' | 'imap';
  // AI enrichment
  aiSummary?: string;
  aiPriority?: 'urgent' | 'normal' | 'low';
  aiActionItems?: string[];
}

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash' | 'starred' | string;

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
}

// === Task Backlog (Sumsuma-like) ===
export interface BacklogTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;     // How long you think it will take
  actualMinutes?: number;       // How long it actually took
  scheduledDate?: string;       // YYYY-MM-DD
  scheduledTime?: string;       // HH:MM
  scheduledEnd?: string;        // HH:MM (auto-calculated from estimate)
  source: 'manual' | 'email' | 'calendar';
  sourceEmailId?: string;       // If created from email selection
  sourceText?: string;          // The selected text from email
  status: 'backlog' | 'scheduled' | 'in_progress' | 'done' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: string;
  completedAt?: string;
  userNotes?: string;           // User's personal notes on the task
  // AI recommendations
  aiEstimatedMinutes?: number;  // What the OS recommends based on history
  aiNotes?: string;             // AI insights about this task
}

// === Time Tracking ===
export interface TimeLog {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;            // ISO timestamp
  endTime?: string;             // ISO timestamp
  durationMinutes?: number;     // Calculated
  category: string;             // For grouping/stats
  notes?: string;
}

export interface TimeStats {
  totalMinutesToday: number;
  totalMinutesWeek: number;
  tasksCompletedToday: number;
  tasksCompletedWeek: number;
  averageTaskDuration: number;
  accuracyRate: number;         // estimated vs actual ratio
  topCategories: { category: string; minutes: number }[];
  dailyHistory: { date: string; minutes: number; tasks: number }[];
}

// === AI Provider Configuration ===
export interface AIProvider {
  id: string;
  name: string;
  type: 'opencode' | 'claude' | 'minimax' | 'custom';
  apiKey?: string;
  endpoint?: string;
  model?: string;
  enabled: boolean;
  description: string;
}

export interface AIConfig {
  providers: AIProvider[];
  defaultProvider: string;
  features: {
    emailSummary: boolean;
    emailPriority: boolean;
    emailActionItems: boolean;
    taskEstimation: boolean;
    timeRecommendations: boolean;
  };
}

// === Focus Mode (Writer Aide style) ===
export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  startTime: string;
  endTime?: string;
  pomodoroMinutes: number;      // Default 25
  breakMinutes: number;         // Default 5
  currentCycle: number;         // Which pomodoro in the session
  totalCycles: number;          // How many planned
  notes: string;                // Writing canvas content
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

// === Consequences Tabs (URL Organization) ===
export interface TabItem {
  id: string;            // nanoid
  url: string;
  title?: string;
  favicon?: string;      // derived from url (google favicon service)
  note?: string;
  reminder?: string;     // ISO date
  tags: string[];
  order: number;
  locked?: boolean;       // no se borra en limpieza
  starred?: boolean;
}

export interface TabSession {
  id: string;
  name: string;
  emoji?: string;
  createdAt: number;
  items: TabItem[];
  isWorkspace?: boolean;  // dashboard vs lista simple
  starred?: boolean;
  locked?: boolean;
}

export interface TabsState {
  sessions: TabSession[];
  bin: TabSession[];      // papelera
  activeView: 'list' | 'dashboard';
}

