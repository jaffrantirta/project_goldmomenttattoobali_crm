async function sendMessage(phone: string, message: string): Promise<boolean> {
  const apiUrl = process.env.WA_API_URL;
  const username = process.env.WA_USERNAME;
  const password = process.env.WA_PASSWORD;

  if (!apiUrl || !username || !password) {
    console.warn(
      "WhatsApp not configured: WA_API_URL, WA_USERNAME, or WA_PASSWORD missing",
    );
    return false;
  }

  try {
    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64",
    );

    const response = await fetch(`${apiUrl}/send/message`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, message }),
    });

    if (!response.ok) {
      console.error(
        "WhatsApp API error:",
        response.status,
        await response.text(),
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("WhatsApp send failed:", error);
    return false;
  }
}

export async function sendWhatsAppNotification(
  message: string,
): Promise<boolean> {
  const phone = process.env.WA_NUMBER;
  if (!phone) {
    console.warn("WhatsApp not configured: WA_NUMBER missing");
    return false;
  }
  return sendMessage(phone, message);
}

export async function sendWhatsAppGroupNotification(
  message: string,
): Promise<boolean> {
  const groupId = process.env.WA_GROUP_ID;
  if (!groupId) {
    console.warn("WhatsApp group not configured: WA_GROUP_ID missing");
    return false;
  }
  return sendMessage(groupId, message);
}

export function buildInquiryGroupNotification(data: {
  name: string;
  whatsapp: string;
  referral_source: string;
}): string {
  const referralLabels: Record<string, string> = {
    google: "Google",
    instagram: "Instagram",
    friend: "Friend",
    tour_guide: "Tour Guide",
  };

  const source = referralLabels[data.referral_source] || data.referral_source;

  return `Ada tamu yang bertanya 🙏

Nama: *${data.name}*
Phone: ${data.whatsapp}
Sumber: ${source}`;
}

export function buildInquiryNotification(data: {
  name: string;
  whatsapp: string;
  referral_source: string;
}): string {
  const referralLabels: Record<string, string> = {
    google: "Google",
    instagram: "Instagram",
    friend: "Friend",
    tour_guide: "Tour Guide",
  };

  const date = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Makassar",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `*INQUIRY BARU - Gold Moment Tattoo Bali*

Nama: ${data.name}
WhatsApp: ${data.whatsapp}
Sumber: ${referralLabels[data.referral_source] || data.referral_source}
Waktu: ${date}

_Segera follow up!_`;
}

export function buildBookingNotification(data: {
  client_name: string;
  whatsapp: string;
  booking_date?: string | null;
  tattoo_description?: string | null;
  deposit_amount?: number | null;
}): string {
  const lines = [
    `*BOOKING CONFIRMED - Gold Moment Tattoo Bali*`,
    ``,
    `Klien: ${data.client_name}`,
    `WhatsApp: ${data.whatsapp}`,
  ];

  if (data.booking_date) {
    lines.push(`Tanggal Booking: ${data.booking_date}`);
  }
  if (data.tattoo_description) {
    lines.push(`Deskripsi Tato: ${data.tattoo_description}`);
  }
  if (data.deposit_amount != null) {
    lines.push(`Deposit: Rp ${data.deposit_amount.toLocaleString("id-ID")}`);
  }

  return lines.join("\n");
}
