import { useEffect } from "react";
import { useLocation } from "wouter";

type Meta = { title: string; description: string };

export function getMeta(path: string): Meta {
  if (path === "/") return { title: "Just Finds — Local discovery, refined", description: "Just Finds helps people discover useful local businesses, services, and jobs with clear, relevant information." };
  if (path === "/categories") return { title: "Browse local categories | Just Finds", description: "Explore local business categories with information structures tailored to what matters in each category." };
  if (path.startsWith("/jobs")) return { title: "Local jobs | Just Finds", description: "Find local job opportunities and connect with nearby employers through Just Finds." };
  if (path.startsWith("/search")) return { title: "Search local businesses | Just Finds", description: "Search useful local business information, services, and places with Just Finds." };
  if (["/login", "/signup", "/forgot-password"].includes(path)) return { title: "Secure sign in | Just Finds", description: "Access your Just Finds account and manage saved listings, applications, and business tools." };
  if (path.startsWith("/admin")) return { title: "Administration | Just Finds", description: "Manage approved Just Finds taxonomy, submissions, and marketplace governance." };
  if (path.startsWith("/owner") || path.startsWith("/business") || path === "/dashboard") return { title: "Business workspace | Just Finds", description: "Manage your Just Finds business profile, submitted content, and local presence." };
  return { title: "Local business details | Just Finds", description: "Explore verified local business information with Just Finds." };
}

export function resolveCanonical(origin: string, path: string) {
  return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function setMeta(doc: Document, selector: string, attribute: "name" | "property", key: string, value: string) {
  let node = doc.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = doc.createElement("meta");
    node.setAttribute(attribute, key);
    doc.head.appendChild(node);
  }
  node.content = value;
}

export function applyPageMeta(doc: Document, origin: string, location: string, business?: { name: string; category?: string; address: string; phone?: string | null; website?: string | null; latitude?: string | number; longitude?: string | number }) {
  const meta = getMeta(location);
  const canonical = resolveCanonical(origin, location);
  const isPrivateOrAdmin = location.startsWith("/admin") || location.startsWith("/owner") || location.startsWith("/dashboard") || location.startsWith("/business/onboarding");
  
  doc.title = meta.title;
  setMeta(doc, 'meta[name="description"]', "name", "description", meta.description);
  setMeta(doc, 'meta[name="robots"]', "name", "robots", isPrivateOrAdmin ? "noindex, nofollow" : "index, follow");
  setMeta(doc, 'meta[property="og:title"]', "property", "og:title", meta.title);
  setMeta(doc, 'meta[property="og:description"]', "property", "og:description", meta.description);
  setMeta(doc, 'meta[property="og:url"]', "property", "og:url", canonical);
  setMeta(doc, 'meta[property="og:type"]', "property", "og:type", business ? "business.business" : "website");
  setMeta(doc, 'meta[name="twitter:title"]', "name", "twitter:title", meta.title);
  setMeta(doc, 'meta[name="twitter:description"]', "name", "twitter:description", meta.description);

  let link = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) { link = doc.createElement("link"); link.rel = "canonical"; doc.head.appendChild(link); }
  link.href = canonical;

  let ldScript = doc.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
  if (business) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "description": meta.description,
      "address": business.address,
      "telephone": business.phone ?? undefined,
      "url": canonical,
      "sameAs": business.website ?? undefined,
      "geo": business.latitude && business.longitude ? {
        "@type": "GeoCoordinates",
        "latitude": Number(business.latitude),
        "longitude": Number(business.longitude),
      } : undefined
    };
    if (!ldScript) {
      ldScript = doc.createElement("script");
      ldScript.type = "application/ld+json";
      doc.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(jsonLd);
  } else if (ldScript) {
    ldScript.remove();
  }
}

export function PageMeta({ business }: { business?: { name: string; category?: string; address: string; phone?: string | null; website?: string | null; latitude?: string | number; longitude?: string | number } }) {
  const [location] = useLocation();
  useEffect(() => {
    applyPageMeta(document, window.location.origin, location, business);
  }, [location, business]);
  return null;
}
