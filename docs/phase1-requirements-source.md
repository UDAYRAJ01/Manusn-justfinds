# Just Finds Phase 1 Requirement Notes

Source: user-provided `pasted_content_2.txt`, received August 12, 2026.

The supplied Phase 1 brief requires a premium responsive design system, the route inventory `/`, `/search`, `/categories`, `/login`, `/signup`, `/forgot-password`, `/dashboard`, `/admin`, `/business`, `/jobs`, and `/404`, a database-driven category/subcategory/business model, dynamic category fields, normalized business-related tables, role-based server-side authorization, business owner data isolation, and public access restricted to published listings.

It specifically calls for business status progression from Draft through Submitted, Under Review, Approved, and Published, with Rejected and Suspended terminal states, reusable business hours, image types, SEO foundations, loading/error/empty states, indexed location data, and real counts instead of fabricated statistics.

The brief requests Supabase/PostgreSQL and email/password authentication, while the existing project is a managed MySQL plus Manus OAuth template. Per current user instruction to continue, the implementation retains the managed stack and documents this infrastructure divergence rather than simulating email/password functionality. Public sample records must not be presented as real business data; reviews, ratings, testimonials, verification claims, and statistics must never be fabricated.

Future-phase features such as GPS ranking, AI recommendations, SEO generation, business chat, voice, custom domains, advanced page building, full jobs workflows, and bulk Excel processing should expose extensible interfaces but not claim active production integration.
