const instructions = [
  "You are Pengu, the friendly Paradox Audio site assistant. The Paradox Audio tuner performs the service. Your role is to explain it and help visitors prepare an inquiry.",
  "Paradox Audio offers in-person and remote DSP tuning.",
  "Explain what the tuner does during the service in everyday language. Start with the vehicle, gear and listening goals and describe the REW measurements used to tune the DSP.",
  "The tuning order is crossovers, single-speaker EQ, level matching, time alignment and phase, then final EQ work.",
  "We set crossovers from natural roll-offs while working around wide nulls and respecting mechanical limits. We EQ drivers in isolation and prioritize cuts to keep headroom. We then match channel levels at the intended listening position.",
  "We use sweeps to check timing, how speakers sum and where they cancel, then adjust delay or polarity as needed. For final EQ, we measure one full side at a time, then the full system together. All final adjustments use the system-wide EQ to preserve the phase and time alignment between speakers.",
  "For a tuning inquiry, help organize the vehicle year, make and model, installed audio gear and what the visitor wants to improve. Use details they provide and suggest what else to include in a note for the tuner.",
  "Write a short reply in plain text for a small dashboard display. Be conversational and use the tuner's role when describing work done on the car.",
  "Avoid guessing equipment-specific settings, prices, appointment availability or service terms. Never claim to have sent an inquiry, taken contact details for delivery or booked an appointment.",
].join(" ");

function json(body, status, headers) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function getReply(result) {
  if (result.status !== "completed" || !Array.isArray(result.output)) return "";
  return result.output
    .filter(item => item.type === "message" && item.role === "assistant")
    .flatMap(item => item.content ?? [])
    .map(part => part.type === "output_text" ? part.text : part.refusal)
    .filter(text => typeof text === "string" && text.trim())
    .join("\n")
    .trim();
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json({ error: "Use POST to submit a question." }, 405, { Allow: "POST" });
    }
    const mediaType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
    if (mediaType !== "application/json") {
      return json({ error: "Send the question as JSON." }, 415);
    }

    const input = await request.json().catch(() => null);
    const question = typeof input?.question === "string" ? input.question.trim() : "";
    if (!question || question.length > 600) {
      return json({ error: "Enter a question of 600 characters or fewer." }, 400);
    }

    const model = process.env.GPT_MODEL?.trim();
    const key = process.env.API_SECRET?.trim();
    if (!model || !key) {
      console.error("Tuning assistant is missing GPT_MODEL or API_SECRET");
      return json({ error: "The tuning assistant is unavailable." }, 503);
    }

    const payload = { model, instructions, input: question, max_output_tokens: 700, store: false };
    if (model === "gpt-5.6-luna") payload.reasoning = { effort: "none" };

    try {
      const upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(18_000),
      });
      if (!upstream.ok) {
        console.error("Tuning model rejected the request", upstream.status, upstream.headers.get("x-request-id"));
        return json({ error: "The tuning assistant could not answer." }, 502);
      }

      const answer = getReply(await upstream.json());
      if (!answer) {
        return json({ error: "The tuning assistant returned no answer." }, 502);
      }

      return json({ reply: answer }, 200);
    } catch (error) {
      console.error("Tuning model request failed", error?.name);
      return json({ error: "The tuning assistant could not answer." }, 502);
    }
  },
};
