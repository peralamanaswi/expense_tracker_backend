const amountPatterns = [
  /(?:grand\s*total|total\s*amount|amount\s*payable|net\s*amount|total)\D{0,12}([0-9]+(?:[,][0-9]{2,3})*(?:\.[0-9]{1,2})?)/i,
  /(?:rs\.?|inr|₹)\s*([0-9]+(?:[,][0-9]{2,3})*(?:\.[0-9]{1,2})?)/i
];

const datePatterns = [
  /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
  /\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/
];

export const fallbackParseExpense = (ocrText = "") => {
  const lines = ocrText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const shopName = lines.find((line) => /[a-zA-Z]{2,}/.test(line)) || "Unknown Shop";
  const amountMatch = amountPatterns.map((pattern) => ocrText.match(pattern)).find(Boolean);
  const dateMatch = datePatterns.map((pattern) => ocrText.match(pattern)).find(Boolean);

  return {
    shopName,
    amount: amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 0,
    date: normalizeDate(dateMatch?.[1]),
    category: "Others",
    notes: "Parsed with fallback rules. Please review before saving.",
    aiSummary: "AI extraction was unavailable, so basic OCR parsing was used."
  };
};

export const normalizeDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);

  const normalized = value.replace(/-/g, "/");
  const parts = normalized.split("/");

  if (parts[0]?.length === 4) {
    return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`).toISOString().slice(0, 10);
  }

  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? `20${year}` : year;
  const date = new Date(`${fullYear}-${month}-${day}`);

  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};
