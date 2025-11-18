export interface IChatMessage {
  role: string;
  content: string;
}

export interface IChatPayload {
  message: string;
  chatHistory?: IChatMessage[];
}

export class ChatMessageDto implements IChatPayload {
  message: string;
  chatHistory?: IChatMessage[];
}

export class ChatExampleShots {
  question: string;
  answer: string;
}
