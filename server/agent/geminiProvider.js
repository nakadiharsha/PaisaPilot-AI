/**
 * Modular Gemini AI Provider
 * Integrates with Google Gen AI SDK for reasoning, intent extraction, and MCP tool orchestration.
 */

let GoogleGenAI = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI;
} catch {
  // If package format differs, handled gracefully
}

class GeminiProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.client = null;

    if (this.apiKey && GoogleGenAI) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.warn('Could not initialize GoogleGenAI client:', err.message);
      }
    }
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  /**
   * Plan execution or generate response using Gemini
   */
  async planWithGemini(userMessage, availableTools) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const prompt = `
You are PaisaPilot AI, a personal finance copilot for users in India.
Current Reference Date: 2026-11-24 (November 2026).
The user asked: "${userMessage}"

You have access to the following 16 MCP tools across 4 servers:
${availableTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Based on the user's question, determine if one or more tools are needed.
Return a clean JSON object with this exact structure:
{
  "reasoning": "string explaining your plan",
  "steps": [
    {
      "tool": "tool_name",
      "args": { ...arguments... }
    }
  ]
}

Only return JSON.
`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text();
      const parsed = JSON.parse(text);
      return parsed;
    } catch (err) {
      console.warn('Gemini planning failed, falling back to deterministic IntentEngine:', err.message);
      return null;
    }
  }

  /**
   * Synthesize a final conversational response with Gemini using tool execution results
   */
  async synthesizeResponse(userMessage, toolExecutionResults) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const summaryContext = toolExecutionResults.map(t => ({
        tool: t.toolName,
        server: t.serverName,
        args: t.args,
        result: t.result
      }));

      const prompt = `
You are PaisaPilot AI, an intelligent personal finance copilot in India.
User query: "${userMessage}"
Tools executed and returned data:
${JSON.stringify(summaryContext, null, 2)}

Provide a helpful, precise, friendly financial answer explaining the results.
Use Indian Rupees (₹) and Indian number formatting (e.g. ₹5,000, ₹1,20,000).
Highlight key figures in markdown bold.
If external payment links were generated, mention that explicit human approval is required before sharing.
Keep it concise and clear.
`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      return response.text();
    } catch (err) {
      console.warn('Gemini response synthesis failed:', err.message);
      return null;
    }
  }
}

module.exports = new GeminiProvider();
