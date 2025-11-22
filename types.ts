export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  mimeType: string;
  data: string; // base64
  name: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
  isThinking?: boolean;
  isSearch?: boolean;
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  spaceId?: string; // Links chat to a specific space
}

export interface Space {
  id: string;
  name: string;
  icon: string; // Emoji or Lucide icon name
  systemPrompt: string;
  model: string;
  files: Attachment[];
}

export interface GenerateConfig {
  useThinking: boolean;
  useSearch: boolean;
  attachments: Attachment[];
  systemInstruction?: string;
  spaceFiles?: Attachment[]; // Files inherited from the space
  overrideModel?: string; // Model defined by the space
}