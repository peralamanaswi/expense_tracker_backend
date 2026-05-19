import { GoogleGenAI } from "@google/genai";
import { fallbackParseExpense } from "../utils/parseExpense.js";

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const extractJson = (text = "") => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Gemini response did not contain JSON");
  }

  return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
};

export const analyzeInvoiceText = async (ocrText) => {
  const ai = getGeminiClient();
  if (!ai || !ocrText) return fallbackParseExpense(ocrText);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract expense details from this OCR bill text. Return only valid JSON with keys: shopName, amount, date, category, notes, aiSummary. Use category only from Food, Travel, Shopping, Utilities, Healthcare, Entertainment, Education, Office, Others. Use date as YYYY-MM-DD. OCR text:\n\n${ocrText}`
    });

    const data = extractJson(response.text);
    return {
      shopName: data.shopName || "Unknown Shop",
      amount: Number(data.amount) || 0,
      date: data.date || new Date().toISOString().slice(0, 10),
      category: data.category || "Others",
      notes: data.notes || "",
      aiSummary: data.aiSummary || "Expense extracted from invoice image."
    };
  } catch (error) {
    return fallbackParseExpense(ocrText);
  }
};

export const generateExpenseInsights = async (expenses) => {
  const ai = getGeminiClient();
  if (!ai || expenses.length === 0) {
    return ["Add more expenses to unlock AI spending insights."];
  }

  try {
    const compactExpenses = expenses.map((expense) => ({
      shopName: expense.shopName,
      amount: expense.amount,
      date: expense.date,
      category: expense.category
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze these expenses and return 3 short, practical spending insights as a JSON array of strings only:\n${JSON.stringify(compactExpenses)}`
    });

    const text = response.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : ["Spending insights are currently unavailable."];
  } catch (error) {
    return ["AI insights are temporarily unavailable. Your dashboard totals still reflect saved expenses."];
  }
};
