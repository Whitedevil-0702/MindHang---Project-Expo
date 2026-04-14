import { CONFIG } from './config';

export const PDF_EXTRACTOR = {
  async extractFromFile(file) {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js library not loaded in HTML.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
    
    let fullText = "";
    const pageCount = Math.min(pdf.numPages, 10); // Limit to 10 pages to avoid huge tokens

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + " ";
    }

    return this.analyzeTextWithAI(fullText);
  },

  async analyzeTextWithAI(text) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY_PDF;
    if (!apiKey) {
      // Fallback to basic extraction if no PDF AI key is provided
      return this.fallbackProcess(text);
    }

    // truncate to roughly 15000 chars to stay within Groq context bounds
    const promptText = text.substring(0, 15000);

    const systemPrompt = `You are a study material analyzer for an educational game. Your job is to extract important vocabulary words from the provided text.
CRITICAL RULES:
1. Return EXACTLY 10-20 words.
2. Words must be single words (no spaces) containing only letters A-Z (length 4 to 15).
3. Provide a clever 'hint' for each word.
4. Provide a full 'definition' for each word based on context.
5. Respond ONLY with a valid JSON array of objects. No additional markdown or text.
Format:
[
  {"word": "example", "hint": "A representative form", "definition": "A thing characteristic of its kind or illustrating a general rule."}
]`;

    try {
      const response = await fetch(CONFIG.groqEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: CONFIG.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptText },
          ],
          max_tokens: 2000,
          temperature: 0.5,
        }),
      });

      if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
      
      const data = await response.json();
      const raw = data.choices[0].message.content.trim();
      const cleaned = raw.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AI returned invalid format');
      }

      return parsed.map(item => ({
        word: item.word.toLowerCase().replace(/[^a-z]/g, ''),
        hint: item.hint || "Extracted from PDF",
        definition: item.definition || "Contextual definition not available."
      })).filter(i => i.word.length >= 4 && i.word.length <= 15);

    } catch (err) {
      console.warn("AI extraction failed, using fallback:", err);
      return this.fallbackProcess(text);
    }
  },

  fallbackProcess(text) {
    const rawWords = text
      .toLowerCase()
      .replace(/[^a-z]/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 5 && w.length <= 12);
      
    const freqs = {};
    for (const w of rawWords) freqs[w] = (freqs[w] || 0) + 1;
    
    const unique = Object.keys(freqs).sort((a,b) => freqs[b] - freqs[a]).slice(0, 30);
    
    return unique.map(word => ({
      word,
      hint: `Extracted from PDF (frequency: ${freqs[word]})`,
      definition: "Fallback extraction - AI analysis unavailable."
    }));
  }
};
