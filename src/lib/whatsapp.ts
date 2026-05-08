/**
 * BYLYF WhatsApp Notification Service (Udo API Integration)
 * 
 * This service handles all automated communications for:
 * 1. Customer: Order & Lucky Draw confirmation
 * 2. Agent: Commission credit alerts
 * 3. Global: Live Draw announcements
 */

export async function sendWhatsAppNotification(payload: {
  phone: string;
  templateName: string;
  variables: string[];
}) {
  const UDO_API_KEY = process.env.UDO_API_KEY;
  const UDO_ENDPOINT = "https://api.udo.ai/v1/messages"; // Placeholder for Udo API endpoint

  if (!UDO_API_KEY) {
    console.warn("⚠️ WhatsApp Notification Skipped: No UDO_API_KEY found in .env");
    return { success: false, error: "API Key missing" };
  }

  try {
    // In a real integration, this structure would match Udo's exact API requirements
    const response = await fetch(UDO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${UDO_API_KEY}`,
      },
      body: JSON.stringify({
        to: payload.phone.startsWith("+") ? payload.phone : `+91${payload.phone}`,
        template: payload.templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: payload.variables.map(val => ({ type: "text", text: val }))
          }
        ]
      }),
    });

    const result = await response.json();
    return { success: response.ok, result };
  } catch (error) {
    console.error("❌ WhatsApp API Error:", error);
    return { success: false, error };
  }
}
