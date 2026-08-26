import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.AI_API_KEY;

if (!apiKey) {
  throw new Error("AI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
  apiKey
});

const testGemini = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents:
        "In one sentence, explain what a failed payment means for a merchant."
    });

    console.log("\n===== GEMINI TEST =====\n");
    console.log(response.text);
    console.log("\n=======================\n");
  } catch (error) {
    console.error("\nGemini test failed:");
    console.error(error.message);
  }
};

testGemini();