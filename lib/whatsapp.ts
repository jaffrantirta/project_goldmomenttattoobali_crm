export async function sendWhatsAppNotification(
  message: string,
): Promise<boolean> {
  const token = process.env.WA_API_TOKEN;
  const groupId = process.env.WA_GROUP_ID;
  const apiUrl = process.env.WA_API_URL || "https://api.fonnte.com/send";

  if (!token || !groupId) {
    console.warn(
      "WhatsApp not configured: WA_API_TOKEN or WA_GROUP_ID missing",
    );
    return false;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: groupId,
        message,
        countryCode: "62",
      }),
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
