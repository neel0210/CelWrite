// services/geminiService.ts
import { EvaluationResult, Question } from "../types";

export class GeminiService {
  static async evaluateResponse(question: Question, userResponse: string): Promise<EvaluationResult> {
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, userResponse }),
      });

      if (!response.ok) throw new Error("Connection failed");
      return await response.json();
    } catch (error) {
      console.error("Evaluation failed:", error);
      throw new Error("We could not connect to the evaluation service.");
    }
  }
}