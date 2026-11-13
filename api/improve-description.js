import { authenticated, fail } from "./_lib/server.js";
import { cleanDescriptionInput, descriptionPrompt, redactContactInfo } from "./_lib/description.js";

const recentRequests = new Map();
const MAX_PER_MINUTE = 5;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    if (!process.env.GEMINI_API_KEY)
      throw Object.assign(Error("The description helper is not configured yet."), { status: 503 });

    const { user } = await authenticated(req);
    const now = Date.now();
    const previous = recentRequests.get(user.id) || [];
    const active = previous.filter((timestamp) => now - timestamp < 60_000);
    if (active.length >= MAX_PER_MINUTE)
      throw Object.assign(Error("Please wait a minute before asking for more suggestions."), { status: 429 });
    active.push(now);
    recentRequests.set(user.id, active);

    const title = cleanDescriptionInput(req.body?.title, 160);
    const category = cleanDescriptionInput(req.body?.category, 100);
    const description = cleanDescriptionInput(req.body?.description, 1200);
    if (description.length < 3)
      throw Object.assign(Error("Write a few words first, then ask AI to improve them."), { status: 400 });

    const prompt = descriptionPrompt({
      title: redactContactInfo(title),
      category: redactContactInfo(category),
      description: redactContactInfo(description),
    });
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 220 },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) {
      if (response.status === 429)
        throw Object.assign(Error("The free AI limit has been reached for now. You can still write the description yourself."), { status: 429 });
      throw Object.assign(Error("The AI helper could not respond. Please try again."), { status: 502 });
    }
    const data = await response.json();
    const suggestion = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join(" ")
      .trim();
    const safeSuggestion = redactContactInfo(suggestion).slice(0, 1400);
    if (!safeSuggestion)
      throw Object.assign(Error("The AI did not return a description. Please try again."), { status: 502 });
    return res.status(200).json({ description: safeSuggestion });
  } catch (error) {
    return fail(res, error);
  }
}

