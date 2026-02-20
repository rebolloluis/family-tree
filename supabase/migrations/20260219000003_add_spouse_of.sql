-- Add spouse_of to support spouse relationships
-- A spouse is a member with spouse_of pointing to their partner.
-- Multiple spouses are supported: multiple rows can share the same spouse_of value.
ALTER TABLE public.members
  ADD COLUMN spouse_of uuid REFERENCES public.members(id) ON DELETE SET NULL;
