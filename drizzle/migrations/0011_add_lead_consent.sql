ALTER TABLE `business_leads`
  ADD COLUMN `consentGiven` boolean NOT NULL DEFAULT false,
  ADD COLUMN `consentAt` timestamp NULL;
