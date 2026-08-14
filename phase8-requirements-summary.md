# Just Finds — Phase 8 Consolidated Requirements Summary

## Overview
Phase 8 establishes the complete custom domain connection, domain ownership verification, DNS configuration guidance, custom domain routing architecture, business-specific domain isolation, published business website presentation, primary/custom domain management, domain status monitoring, SSL-ready architecture, advanced business analytics, conversion tracking, website performance analytics, and admin domain management [1].

## Consolidated Implementation Specifications
1. **Custom Domain Dashboard & Guided Flow:**
   - Add owner settings at `/business/settings/domain` [1].
   - Implement the 7-step guided workflow: Enter Domain, Validate Domain, DNS Configuration, Verify Ownership, Configure Routing, SSL / HTTPS, and Publish [1].
2. **Domain Input, Normalization & Safety:**
   - Normalize owner input by removing protocols (`http://`, `https://`), trailing slashes, and whitespace, storing normalized domains separately [1].
   - Enforce robust validation covering TLDs, format, length, invalid characters, reserved domains, and duplicate prevention [1].
   - Return privacy-safe duplicate rejection messages ("This domain is already connected to another Just Finds business") without revealing other business details [1].
3. **Ownership Verification & DNS Records:**
   - Establish `domain_verification_records` and `custom_domains` tables supporting TXT or CNAME verification [1].
   - Provide exact DNS instructions with copy controls and honest status states (`PENDING`, `VERIFIED`, `FAILED`, `EXPIRED`) [1].
   - Prevent fake verification reporting; require real checks against DNS resolvers [1].
4. **Custom Domain Routing & Tenant Isolation:**
   - Enforce strict domain-to-business resolution (`domain -> business_id -> published page`) [1].
   - Guarantee absolute data isolation so visitors on a custom domain only render that specific business's data, never leaking global search, other businesses, or cross-tenant chat/reviews/leads [1].
   - Maintain original Just Finds URLs (`justfinds.in/business/...`) alongside custom domains [1].
5. **Primary Domains & Redirection:**
   - Support multiple custom domains per business with exactly one designated **Primary Domain** [1].
   - Configure canonical redirects between apex and `www` domains to prevent duplicate SEO URLs and redirect loops [1].
6. **Analytics, Performance & Admin Management:**
   - Track advanced business analytics, conversion metrics, and website performance [1].
   - Provide admin dashboard controls to oversee and moderate custom domain mappings across all tenants [1].

## References
[1] Just Finds Phase 8 Specification (Attached Requirements Files).
