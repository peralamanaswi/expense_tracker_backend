import vision from "@google-cloud/vision";
import path from "path";
import { createWorker } from "tesseract.js";

export const extractTextFromImage = async (filePath) => {
  const absolutePath = path.resolve(filePath);
  try {
    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.textDetection(absolutePath);
    const detections = result.textAnnotations || [];
    return detections[0]?.description?.trim() || "";
  } catch (error) {
    console.error("Google Vision API Error:", error);
    // Fallback to Tesseract OCR (runs locally, no billing required)
    try {
      const worker = await createWorker({ logger: m => console.log(m) });
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(absolutePath);
      await worker.terminate();
      return text.trim();
    } catch (tesseractError) {
      console.error("Tesseract OCR failed:", tesseractError);
      throw new Error(`OCR failed: ${tesseractError.message}`);
    }
  }
};
