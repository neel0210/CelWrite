import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, Question } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  private static getAI() {
    // Vite bakes VITE_ prefixed variables into the code at build time
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("API Key is missing. Ensure VITE_GEMINI_API_KEY is set in GitHub Secrets.");
    }

    return new GoogleGenAI(apiKey);
  }

  static async evaluateResponse(question: Question, userResponse: string): Promise<EvaluationResult> {
    try {
      const genAI = this.getAI();
      // Using gemini-1.5-flash for better reliability with JSON schemas
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
      });

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

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
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

      const responseText = result.response.text();
      if (!responseText) throw new Error("Empty response from AI");
      
      return JSON.parse(responseText) as EvaluationResult;
    } catch (error) {
      console.error("Evaluation failed:", error);
      throw new Error("Assessment failed. Please check your API key and connection.");
    }
  }
}
