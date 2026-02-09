// api/evaluate.ts
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { question, userResponse } = await req.json();
    
    // This uses the Secret you will set in the Vercel Dashboard
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      TASK: ${question.type}
      TITLE: ${question.title}
      PROMPT: ${question.prompt}
      STUDENT RESPONSE: ${userResponse}
      Provide a robust CELPIP evaluation in JSON format.
    `;

    const result = await model.generateContent(prompt);
    return new Response(result.response.text(), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "AI Evaluation Failed" }), { status: 500 });
  }
}