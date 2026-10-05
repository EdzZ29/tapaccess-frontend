import { Clock, MapPin, Nfc, Phone, UserPlus } from "lucide-react";
import { BrandMark } from "@/components/profile/icons";

/**
 * The hero illustration, drawn in HTML/CSS: a TapAccess card being tapped
 * against a phone that shows a sample business profile. No images, so it is
 * crisp at any size and costs nothing to load.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[580px] w-full max-w-[440px] sm:h-[650px]" aria-hidden>
      {/* Phone */}
      <div className="absolute top-0 right-0 h-[520px] w-[262px] rounded-[2.6rem] border border-line-strong bg-[#0d0d10] p-2.5 shadow-[0_40px_80px_-30px_rgb(15_23_42/0.45)] sm:h-[580px] sm:w-[290px]">
        <div className="relative h-full overflow-hidden rounded-[2.1rem] bg-[#f6f3ee] text-[#16130f]">
          <div className="absolute top-2 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0d0d10]" />
          <SampleProfile />
        </div>
      </div>

      {/* NFC card */}
      <div className="absolute bottom-2 left-0 w-[230px] animate-[float_6s_ease-in-out_infinite] sm:bottom-0 sm:w-[250px]">
        <div className="relative aspect-[1.586] -rotate-[9deg] rounded-2xl bg-[#121214] p-5 text-white shadow-[0_30px_60px_-20px_rgb(15_23_42/0.6)] ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
              <Nfc className="h-4 w-4" />
            </span>
            TapAccess
          </div>
          <p className="absolute bottom-5 left-5 font-display text-lg leading-tight font-semibold">Luna Hair Studio</p>
          <p className="absolute right-5 bottom-5 text-[0.65rem] tracking-[0.2em] text-white/50 uppercase">Tap me</p>
          {/* Tap pulse */}
          <span className="absolute -top-3 -right-3 flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 animate-[tap-ripple_2.4s_ease-out_infinite] rounded-full border-2 border-brand" />
            <span className="absolute inset-0 animate-[tap-ripple_2.4s_ease-out_1.2s_infinite] rounded-full border-2 border-brand" />
            <span className="h-3 w-3 rounded-full bg-brand" />
          </span>
        </div>
      </div>
    </div>
  );
}

function SampleProfile() {
  return (
    <div className="flex h-full flex-col px-5 pt-12 pb-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16130f] text-xs font-bold text-white">LH</span>
        <span className="text-[0.62rem] font-bold tracking-[0.2em] uppercase">Luna Hair</span>
      </div>

      <p className="mt-9 text-[0.6rem] font-semibold tracking-[0.22em] text-[#16130f]/55 uppercase">Hair &amp; beauty salon</p>
      <p className="mt-2 font-display text-[2rem] leading-[0.95] font-bold tracking-tight">Luna Hair Studio</p>
      <p className="mt-3 text-[0.78rem] leading-relaxed text-[#16130f]/65">Cuts, colour and styling by appointment. Walk-ins welcome on weekdays.</p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <span className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#c2410c] text-[0.72rem] font-semibold text-white shadow-[0_10px_24px_-12px_#c2410c]">
          <Phone className="h-3.5 w-3.5" /> Call to Book
        </span>
        <span className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#16130f]/15 bg-white text-[0.72rem] font-semibold">
          <UserPlus className="h-3.5 w-3.5" /> Save contact
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[#16130f]/10 pt-4 text-[0.68rem]">
        <div>
          <p className="text-[#16130f]/50">Today</p>
          <p className="mt-0.5 flex items-center gap-1 font-semibold">
            <Clock className="h-3 w-3" /> Open · 9–6
          </p>
        </div>
        <div>
          <p className="text-[#16130f]/50">Location</p>
          <p className="mt-0.5 flex items-center gap-1 font-semibold">
            <MapPin className="h-3 w-3" /> Main Street
          </p>
        </div>
      </div>

      <p className="mt-auto text-[0.6rem] font-semibold tracking-[0.18em] text-[#16130f]/45 uppercase">Social media</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(
          [
            ["facebook", "#1877F2"],
            ["instagram", "#E1306C"],
            ["tiktok", "#111111"],
          ] as const
        ).map(([name, color]) => (
          <span key={name} className="flex h-9 items-center justify-center rounded-xl text-white" style={{ background: color }}>
            <BrandMark name={name} className="h-4 w-4" />
          </span>
        ))}
      </div>
    </div>
  );
}
