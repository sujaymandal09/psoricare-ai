export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  access_token: string;
  created_at: string;
  expires_at: string;
}

export interface SkinAnalysis {
  id: string;
  userId: string;
  imageUrl: string; // Base64 encoded data url or path
  status: 'pending' | 'completed' | 'failed';
  result: {
    diagnosis: string;       // e.g. "Psoriasis", "Plaque Psoriasis", "Eczema", etc.
    confidence: number;      // percentage, e.g. 85
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    erythema: number;        // 0-4 redness score
    induration: number;      // 0-4 thickness score
    desquamation: number;    // 0-4 scaling score
    description: string;     // Detailed clinical explanation
    recommendations: string[]; // Care suggestions
    disclaimer: string;      // Medical disclaimer
  } | null;
  createdAt: string;
}

export interface PasiRegionData {
  area: number;         // 0-6 area score representing percentage of involvement
  erythema: number;     // 0-4 redness
  induration: number;   // 0-4 thickness
  desquamation: number; // 0-4 scaling
}

export interface PasiScore {
  id: string;
  userId: string;
  score: number; // Final PASI index between 0.0 and 72.0
  calcData: {
    head: PasiRegionData;
    arms: PasiRegionData;
    trunk: PasiRegionData;
    legs: PasiRegionData;
  };
  createdAt: string;
}

export interface SymptomLog {
  id: string;
  userId: string;
  date: string;
  itchiness: number;      // 0-10
  pain: number;           // 0-10
  scaling: number;        // 0-10
  redness: number;        // 0-10
  sleepQuality: number;   // 0-10
  triggers: string[];     // ['stress', 'dry weather', 'infection', 'medication', 'diet']
  notes: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  event_type: string;
  description: string;
  created_at: string;
}
