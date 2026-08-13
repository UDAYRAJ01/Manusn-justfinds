-- Phase 6 additive migration: distinguish profile share conversions from generic clicks.
-- Applied to the managed database through the project SQL migration interface.
ALTER TABLE search_interactions
  MODIFY COLUMN action ENUM('search','impression','click','call','whatsapp','directions','website','save','inquiry','share') NOT NULL;
