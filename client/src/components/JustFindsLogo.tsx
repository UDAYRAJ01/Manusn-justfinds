import { Compass } from "lucide-react";
import { Link } from "wouter";

export function JustFindsLogo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 font-semibold tracking-[-0.045em] ${dark ? "text-white" : "text-slate-950"}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-[linear-gradient(135deg,#2457d6,#153b9e)] shadow-[0_8px_22px_rgba(36,87,214,.28)] transition-transform duration-200 group-hover:-rotate-6">
        <Compass className="size-[18px] text-white" strokeWidth={2.6} />
      </span>
      <span className="text-[19px]">Just Finds</span>
    </Link>
  );
}
