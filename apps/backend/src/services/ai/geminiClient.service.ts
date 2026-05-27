import axios from "axios";
import type { GeminiResponse } from "./ai.types.js";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

class GeminiClientService {
  private getApiKey() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      const error = new Error("Missing GEMINI_API_KEY in backend environment");
      (error as Error & { status?: number }).status = 500;
      throw error;
    }

    return apiKey;
  }

  async generateText(prompt: string) {
    const apiKey = this.getApiKey();
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

    try {
      const response = await axios.post<GeminiResponse>(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1200,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          timeout: 30000,
        }
      );

      const text = response.data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
      if (!text) {
        const error = new Error("AI did not return any content");
        (error as Error & { status?: number }).status = 502;
        throw error;
      }

      return { text, model };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 502;
        const message =
          status === 429
            ? "AI rate limit exceeded. Please try again later."
            : error.response?.data?.error?.message || error.message || "Failed to call Gemini API";
        const apiError = new Error(message);
        (apiError as Error & { status?: number }).status = status;
        throw apiError;
      }

      throw error;
    }
  }
}

export default new GeminiClientService();
