export function cleanDescriptionInput(value, maxLength = 1200) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function redactContactInfo(value) {
  return String(value || "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, (match) =>
      (match.match(/\d/g) || []).length >= 10 ? "[phone removed]" : match,
    );
}

export function descriptionPrompt({ title, category, description }) {
  return [
    "Write a clear, concise public marketplace description from the seller's notes.",
    "Use only facts supplied below. Do not invent qualifications, guarantees, availability, prices, locations, or claims.",
    "Keep the seller's meaning, use natural plain language, and return only the suggested description (about 40-100 words).",
    `Category: ${category}`,
    `Title: ${title || "Not provided"}`,
    `Seller notes: ${description}`,
  ].join("\n");
}

