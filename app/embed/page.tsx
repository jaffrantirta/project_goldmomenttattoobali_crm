"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import logo from "../logo.webp";

type ReferralSource = "google" | "instagram" | "friend" | "tour_guide";

interface FormData {
  name: string;
  whatsapp: string;
  referral_source: ReferralSource | "";
}

function postHeight() {
  const height = document.documentElement.scrollHeight;
  window.parent.postMessage({ type: "gmtb-resize", height }, "*");
}

export default function EmbedForm() {
  const [form, setForm] = useState<FormData>({
    name: "",
    whatsapp: "",
    referral_source: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    postHeight();
    const observer = new ResizeObserver(postHeight);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.referral_source) {
      setError("Please select how you heard about us.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div ref={containerRef} className="bg-zinc-950 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-amber-400/10 border-2 border-amber-400 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Thank You!</h2>
          <p className="text-zinc-400 leading-relaxed">
            We have received your inquiry and will contact you via WhatsApp shortly.
            <br /><br />
            <span className="text-amber-400">Gold Moment Tattoo Bali</span> — We look forward to creating something beautiful with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src={logo} alt="Gold Moment Tattoo Bali" className="h-20 w-auto object-contain rounded-2xl" />
          </div>
          <p className="text-zinc-400 mt-2 text-sm">
            Fill in the form below and we will reach out to you on WhatsApp.
          </p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                WhatsApp Number <span className="text-amber-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+62 812 3456 7890"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-colors"
              />
              <div className="mt-2 flex items-start gap-2 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2.5">
                <span className="text-amber-400 text-base leading-none mt-0.5">⚠️</span>
                <p className="text-amber-300 text-xs leading-relaxed">
                  Please include your <span className="font-semibold">country code</span> — e.g.{" "}
                  <span className="font-semibold text-amber-400">+62</span> for Indonesia,{" "}
                  <span className="font-semibold text-amber-400">+1</span> for US/Canada,{" "}
                  <span className="font-semibold text-amber-400">+61</span> for Australia.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                How did you hear about us? <span className="text-amber-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { value: "google", label: "Google", icon: "🔍" },
                    { value: "instagram", label: "Instagram", icon: "📸" },
                    { value: "friend", label: "Friend", icon: "👥" },
                    { value: "tour_guide", label: "Tour Guide", icon: "🗺️" },
                  ] as const
                ).map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, referral_source: value })}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                      form.referral_source === value
                        ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    <span className="text-xs text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-amber-400/50 text-zinc-900 font-semibold rounded-lg py-3.5 text-sm transition-colors mt-2 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Inquiry"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-5">
          We will contact you via WhatsApp as soon as possible.
        </p>
      </div>
    </div>
  );
}
