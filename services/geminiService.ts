import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Attachment, GenerateConfig } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function* streamResponse(
  prompt: string,
  config: GenerateConfig,
  history: { role: string; parts: { text?: string }[] }[]
): AsyncGenerator<{ text: string; groundingChunks?: any[] }, void, unknown> {

  // Default model is now Gemini 3 Pro Preview as requested
  let modelName = config.overrideModel || 'gemini-3-pro-preview';
  let requestConfig: any = {};

  // --- Logic for Model Selection & Tools ---
  
  // 1. If Thinking is requested, we MUST use a model that supports it (usually Pro)
  // Even if Search is also requested, Pro handles tools + thinking.
  if (config.useThinking) {
    modelName = 'gemini-3-pro-preview';
    requestConfig.thinkingConfig = { thinkingBudget: 32768 }; // Max for Pro
  } 
  
  // 2. Search Config (Can coexist with Thinking now)
  if (config.useSearch) {
    // If we aren't thinking, we prefer Flash for speed, unless overridden
    // BUT: user asked for "Make AI Gemini 3 Pro", so we keep Pro unless explicit override says Flash.
    // If user wants speed they can switch model in Spaces, but global default is Pro.
    if (!config.useThinking && config.overrideModel === 'gemini-2.5-flash') {
        modelName = 'gemini-2.5-flash';
    }
    // Add the tool
    requestConfig.tools = [{ googleSearch: {} }];
  }

  // 3. Image Analysis (Multimodal) - Pro is better.
  // If specific model wasn't forced by Thinking, and we have images, default to Pro for quality if not already set.
  if ((config.attachments.length > 0 || (config.spaceFiles && config.spaceFiles.length > 0)) && !config.useThinking && !config.overrideModel) {
    modelName = 'gemini-3-pro-preview'; 
  }

  // 4. System Instruction
  if (config.systemInstruction) {
    requestConfig.systemInstruction = config.systemInstruction;
  }

  // Build contents
  const contents = history.map(msg => ({
    role: msg.role,
    parts: msg.parts
  }));

  const currentParts: any[] = [{ text: prompt }];
  
  // Add User Attachments (Current Message)
  if (config.attachments && config.attachments.length > 0) {
    config.attachments.forEach(att => {
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }

  // Add Space Context Files (Prepend to the prompt or add as parts)
  // We add them as parts of the current user message for context
  if (config.spaceFiles && config.spaceFiles.length > 0) {
      config.spaceFiles.forEach(att => {
          currentParts.unshift({
            inlineData: {
                mimeType: att.mimeType,
                data: att.data
            }
          });
      });
      currentParts.unshift({ text: "Reference the following attached context files for this query:\n" });
  }

  contents.push({
    role: 'user',
    parts: currentParts
  });

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: requestConfig
    });

    for await (const chunk of result) {
        const responseChunk = chunk as GenerateContentResponse;
        const text = responseChunk.text || '';
        
        // Extract grounding metadata
        const groundingChunks = responseChunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        yield { text, groundingChunks };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield { text: `\n\n**Error:** Failed to generate response. ${(error as Error).message}` };
  }
}

export const fileToAttachment = async (file: File): Promise<Attachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data,
        name: file.name
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};