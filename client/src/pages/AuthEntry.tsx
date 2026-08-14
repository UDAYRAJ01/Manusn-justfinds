import { startLogin } from "@/const";
import { PageFrame } from "@/components/PageFrame";
import { Button } from "@/components/ui/button";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

const copy = {
  "/login": {
    eyebrow: "Secure account access",
    title: "Sign in to Just Finds",
    description: "Access saved listings, applications, and the workspace connected to your Just Finds account.",
    action: "Continue to secure sign-in",
  },
  "/signup": {
    eyebrow: "Create your workspace",
    title: "Join Just Finds",
    description: "Create your account to save local businesses, manage listings, and apply for nearby opportunities.",
    action: "Create an account",
  },
  "/forgot-password": {
    eyebrow: "Account recovery",
    title: "Access your account securely",
    description: "This managed Just Finds environment uses secure account sign-in rather than a separate password reset form.",
    action: "Continue to secure sign-in",
  },
} as const;

export default function AuthEntry() {
  const [location] = useLocation();
  const content = copy[location as keyof typeof copy] ?? copy["/login"];

  return <PageFrame className="bg-[#f7f7f5]">
    <main className="container grid min-h-[calc(100vh-160px)] place-items-center py-12 sm:py-20">
      <section className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_20px_45px_rgba(15,23,42,.07)] sm:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#1f51c8]"><LockKeyhole className="size-5" /></span>
        <p className="mt-7 eyebrow text-[#315fcb]">{content.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] text-slate-950 sm:text-4xl">{content.title}</h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">{content.description}</p>
        <Button onClick={() => startLogin()} className="mt-8 h-12 w-full rounded-xl bg-[#173d9c] text-sm">{content.action}<ArrowRight className="ml-2 size-4" /></Button>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600"><span className="flex items-center gap-1.5 font-semibold text-slate-800"><ShieldCheck className="size-4 text-emerald-600" />Managed sign-in</span><p className="mt-1">Sign in with your own Just Finds account. Regular users can create and manage only their own listings; administrator tools are available only to accounts separately assigned an administrator role.</p></div>
        <p className="mt-6 text-center text-xs text-slate-500">Looking for local businesses? <Link href="/search" className="font-semibold text-[#1f51c8]">Explore Just Finds</Link></p>
      </section>
    </main>
  </PageFrame>;
}
