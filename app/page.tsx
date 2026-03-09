import Image from "next/image";
import Link from "next/link";
import logo from "./logo.webp";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <Image
            src={logo}
            alt="Gold Moment Tattoo Bali"
            className="h-28 w-auto object-contain rounded-2xl"
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Gold Moment Tattoo Bali
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          Book your tattoo session today and let&apos;s create something
          beautiful together.
        </p>
        <Link
          href="/book"
          className="inline-block bg-amber-400 hover:bg-amber-500 text-zinc-900 font-bold rounded-xl px-10 py-4 text-lg transition-colors shadow-lg shadow-amber-400/20"
        >
          Book Now!
        </Link>
      </div>
    </div>
  );
}
