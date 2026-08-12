import { startLogin } from "@/const";
import { PageFrame } from "@/components/PageFrame";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { Link } from "wouter";

export default function Saved() { return <PageFrame><div className="container grid min-h-[58vh] place-items-center py-16 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#1f51c8]"><Bookmark className="size-6" /></span><h1 className="mt-5 text-2xl font-semibold tracking-[-.04em]">Save local favourites in one place.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Your saved businesses are private to your Just Finds account.</p><div className="mt-6 flex justify-center gap-3"><Link href="/search"><Button variant="outline" className="rounded-xl bg-white">Explore now</Button></Link><Button onClick={() => startLogin()} className="rounded-xl bg-[#173d9c]">Sign in to save</Button></div></div></div></PageFrame>; }
