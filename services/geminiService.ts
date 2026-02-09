
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, Question } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  static async evaluateResponse(question: Question, userResponse: string): Promise<EvaluationResult> {
    try {
      const ai = this.getAI();
      const prompt = `
        TASK: ${question.type}
        TITLE: ${question.title}
        PROMPT: ${question.prompt}
        ${question.options ? `OPTIONS: ${question.options.join(', ')}` : ''}

        STUDENT RESPONSE:
        ---
        ${userResponse}
        ---

        Provide a robust and honest CELPIP evaluation in JSON format.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          temperature: 0.7,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bandScore: { type: Type.NUMBER },
              sections: {
                type: Type.OBJECT,
                properties: {
                  taskAchievement: { type: Type.STRING },
                  coherenceAndCohesion: { type: Type.STRING },
                  vocabularyRange: { type: Type.STRING },
                  grammarAccuracy: { type: Type.STRING },
                  toneAndFormality: { type: Type.STRING }
                }
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              vocabularyReplacements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    replacement: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["original", "replacement", "reason"]
                }
              },
              sampleModelResponse: { type: Type.STRING },
              annotatedResponse: { type: Type.STRING }
            },
            required: ["bandScore", "sections", "suggestions", "vocabularyReplacements", "sampleModelResponse"]
          }
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      
      const result = JSON.parse(text);
      return result as EvaluationResult;
    } catch (error) {
      console.error("Evaluation failed:", error);
      throw new Error("Assessment failed. Please check your API key and connection.");
    }
  }
}
