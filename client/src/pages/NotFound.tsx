import React from "react";
import { PageFrame } from "@/components/PageFrame";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { notFoundRecoveryLinks } from "@/lib/utilityPageContent";
import { Compass, Search } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return <PageFrame><PageMeta /><main className="container flex min-h-[calc(100vh-15rem)] items-center py-10 sm:py-16"><section className="mx-auto w-full max-w-xl rounded-3xl border border-[var(--jf-border)] bg-white p-6 text-center shadow-sm sm:p-10"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-[var(--jf-primary)]"><Compass className="size-6" /></span><p className="mt-6 text-xs font-semibold uppercase tracking-[.16em] text-[var(--jf-muted)]">404</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--jf-text)] sm:text-3xl">This page is not available</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--jf-muted)]">The address may be incorrect, or the page may no longer be available. You can return to discovery without losing your place.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link href={notFoundRecoveryLinks[0].href}><Search className="mr-2 size-4" />{notFoundRecoveryLinks[0].label}</Link></Button><Button asChild variant="outline"><Link href={notFoundRecoveryLinks[1].href}>{notFoundRecoveryLinks[1].label}</Link></Button><Button asChild variant="outline"><Link href={notFoundRecoveryLinks[2].href}>{notFoundRecoveryLinks[2].label}</Link></Button></div></section></main></PageFrame>;
}
