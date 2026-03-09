import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendWhatsAppGroupNotification,
  buildInquiryGroupNotification,
} from "@/lib/whatsapp";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = createServiceClient();
    const { data: admin } = await service
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!admin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: inquiries, error } = await service
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ inquiries });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, whatsapp, referral_source } = body;

    if (!name || !whatsapp || !referral_source) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const validSources = ["google", "instagram", "driver", "facebook"];
    if (!validSources.includes(referral_source)) {
      return NextResponse.json(
        { error: "Invalid referral source" },
        { status: 400 },
      );
    }

    const service = createServiceClient();

    const { data: inquiry, error } = await service
      .from("inquiries")
      .insert({ name, whatsapp, referral_source })
      .select()
      .single();

    if (error) throw error;

    // Log to audit table (system action — no admin_id)
    await service.from("audit_logs").insert({
      admin_id: null,
      admin_email: "public_form",
      action: "CREATE_INQUIRY",
      table_name: "inquiries",
      record_id: inquiry.id,
      new_data: { name, whatsapp, referral_source },
    });

    const groupMessage = buildInquiryGroupNotification({
      name,
      whatsapp,
      referral_source,
    });
    sendWhatsAppGroupNotification(groupMessage).catch(console.error);

    // Build WhatsApp deep-link so client can open a chat to the contact person
    const contactNumber = (process.env.WA_CONTACT_PERSON ?? "").replace(
      /\D/g,
      "",
    );
    const referralLabels: Record<string, string> = {
      google: "Google",
      instagram: "Instagram",
      friend: "Friend",
      tour_guide: "Tour Guide",
    };
    const waText = encodeURIComponent(
      `Hello Gold Moment Tattoo Bali! \n\nMy name is *${name}*.\nI found you through: ${referralLabels[referral_source] ?? referral_source}\n\nI'd love to inquire about getting a tattoo. `,
    );
    const wa_url = contactNumber
      ? `https://wa.me/${contactNumber}?text=${waText}`
      : null;

    return NextResponse.json({ inquiry, wa_url }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
