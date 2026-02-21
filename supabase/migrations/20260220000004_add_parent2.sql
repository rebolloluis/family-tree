-- Add parent2_id to support a second parent per member.
-- A member can have at most two parents: parent_id (primary) and parent2_id (secondary).
-- Both use ON DELETE SET NULL so removing a parent simply clears the link.
ALTER TABLE public.members
  ADD COLUMN parent2_id uuid REFERENCES public.members(id) ON DELETE SET NULL;
