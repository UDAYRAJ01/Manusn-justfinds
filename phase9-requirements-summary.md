# Just Finds — Phase 9 Job Portal Requirements Summary

## Overview
Phase 9 specifies the complete **Job Portal** for Just Finds, integrating job seekers, employers (business owners), job search, application pipelines, resume management, saved jobs, job alerts, and employer job publishing with moderation workflows [1].

## Core Implementation Specifications
1. **Job Portal Navigation & Search:**
   - Add a `Jobs` entry to the main Just Finds navigation pointing to `/jobs` [1].
   - Provide advanced search by title, skill, company, location, and filters (category, experience, salary, job type, work mode, education, date posted) [1].
2. **Job Seeker Experience:**
   - Dedicated job seeker profile at `/jobs/profile` using existing Google Login [1].
   - Resume upload support (PDF, DOC, DOCX) with private storage security [1].
   - Candidate application tracking at `/jobs/applications` across statuses: `Applied`, `Under Review`, `Shortlisted`, `Interview`, `Selected`, `Rejected`, and `Withdrawn` [1].
   - Saved jobs (`/jobs/saved`) and job alert preference configuration [1].
3. **Employer & Moderation Workflow:**
   - Connect employer accounts directly to existing Just Finds business owner profiles [1].
   - Job creation workflow (`/employer/jobs/new`) with AI generation support grounded strictly in employer facts [1].
   - Moderation approval pipeline: `DRAFT` -> `SUBMITTED` -> `UNDER REVIEW` -> `APPROVED` / `PUBLISHED` (or `REJECTED`) [1].

## References
[1] Just Finds Phase 9 Specification (Attached Requirements Files).
