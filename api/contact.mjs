const inbox = "ParadoxDSPtuning@gmail.com";

function json(body, status, headers) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

async function sendInquiry(message, password) {
  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: inbox, pass: password },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 8_000,
  });
  const result = await transport.sendMail(message);
  if (!result.accepted?.length) throw new Error("Gmail did not accept the inquiry");
}

export async function handleContact(request, send = sendInquiry) {
  if (request.method !== "POST") {
    return json({ error: "Use POST to submit an inquiry." }, 405, { Allow: "POST" });
  }
  const mediaType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return json({ error: "Send the inquiry as JSON." }, 415);
  }

  const input = await request.json().catch(() => null);
  const read = key => typeof input?.[key] === "string" ? input[key].trim() : "";
  if (read("website")) return json({ sent: true }, 200);

  const name = read("name");
  const email = read("email");
  const vehicle = read("vehicle");
  const equipment = read("equipment");
  const goals = read("goals");
  const validEmail = /^[\w.!#$%&'*+/=?^{}|~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email);
  if (!name || name.length > 100 || !validEmail || email.length > 254 ||
      vehicle.length > 120 || !equipment || equipment.length > 1200 || !goals || goals.length > 1200) {
    return json({ error: "Check your name, email, equipment and tuning goals, then try again." }, 400);
  }

  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!password) return json({ error: "Email delivery is unavailable right now." }, 503);

  const message = {
    from: { name: "Paradox Audio Website", address: inbox },
    to: inbox,
    replyTo: { address: email },
    subject: "New Paradox Audio tuning inquiry",
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Vehicle: ${vehicle || "Not provided"}`,
      "",
      "Audio equipment",
      equipment,
      "",
      "What they want done",
      goals,
    ].join("\n"),
  };

  try {
    await send(message, password);
    return json({ sent: true }, 200);
  } catch (error) {
    console.error("Contact email delivery failed", error?.code ?? error?.name);
    return json({ error: "Email delivery is unavailable right now." }, 502);
  }
}

export default { fetch: request => handleContact(request) };
