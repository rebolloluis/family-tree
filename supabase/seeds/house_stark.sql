-- House Stark seed — run this in the Supabase SQL editor (bypasses RLS).
-- Prerequisites:
--   1. Apply migration 20260219000003_add_spouse_of.sql
--   2. Apply migration 20260220000004_add_parent2.sql
--   3. Have at least one user account registered in the app

DO $$
DECLARE
  owner_id   uuid;
  fam_id     uuid;

  -- Generation 0
  rickard_id uuid;
  lady_id    uuid;

  -- Generation 1
  brandon_id uuid;
  eddard_id  uuid;
  benjen_id  uuid;
  lyanna_id  uuid;
  catelyn_id uuid;
  rhaegar_id uuid;

  -- Generation 2
  robb_id    uuid;
  sansa_id   uuid;
  arya_id    uuid;
  bran_id    uuid;
  rickon_id  uuid;
  jon_id     uuid;
BEGIN
  -- Use the first registered user as tree owner
  SELECT id INTO owner_id FROM auth.users ORDER BY created_at LIMIT 1;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Register an account first.';
  END IF;

  -- Ensure a profile row exists for that user
  INSERT INTO public.profiles (id) VALUES (owner_id) ON CONFLICT DO NOTHING;

  -- Create the family
  fam_id := gen_random_uuid();
  INSERT INTO public.families (id, name, description, owner_id)
  VALUES (fam_id, 'House Stark', 'Winter is Coming', owner_id);

  -- Pre-generate member IDs
  rickard_id := gen_random_uuid();
  lady_id    := gen_random_uuid();
  brandon_id := gen_random_uuid();
  eddard_id  := gen_random_uuid();
  benjen_id  := gen_random_uuid();
  lyanna_id  := gen_random_uuid();
  catelyn_id := gen_random_uuid();
  rhaegar_id := gen_random_uuid();
  robb_id    := gen_random_uuid();
  sansa_id   := gen_random_uuid();
  arya_id    := gen_random_uuid();
  bran_id    := gen_random_uuid();
  rickon_id  := gen_random_uuid();
  jon_id     := gen_random_uuid();

  -- ── Generation 0: Rickard + his wife ──────────────────────────────────────
  INSERT INTO public.members (id, family_id, name, note, parent_id, parent2_id, spouse_of, created_by)
  VALUES
    (rickard_id, fam_id, 'Rickard Stark',  'Lord of Winterfell',        null, null, null,       owner_id),
    (lady_id,    fam_id, 'Lady Stark',     null,                         null, null, rickard_id, owner_id);

  -- ── Generation 1: Rickard's children + their spouses ─────────────────────
  INSERT INTO public.members (id, family_id, name, note, parent_id, parent2_id, spouse_of, created_by)
  VALUES
    (brandon_id, fam_id, 'Brandon Stark',       null,                                    rickard_id, lady_id, null,       owner_id),
    (eddard_id,  fam_id, 'Eddard Stark',         'Lord of Winterfell, Hand of the King', rickard_id, lady_id, null,       owner_id),
    (benjen_id,  fam_id, 'Benjen Stark',         'First Ranger, Night''s Watch',          rickard_id, lady_id, null,       owner_id),
    (lyanna_id,  fam_id, 'Lyanna Stark',         null,                                    rickard_id, lady_id, null,       owner_id),
    -- Spouses (not Starks by birth — no parent_id)
    (catelyn_id, fam_id, 'Catelyn Tully',        null,                                    null,       null,    eddard_id,  owner_id),
    (rhaegar_id, fam_id, 'Rhaegar Targaryen',    'Crown Prince of the Seven Kingdoms',   null,       null,    lyanna_id,  owner_id);

  -- ── Generation 2: Children with both parents linked ───────────────────────
  INSERT INTO public.members (id, family_id, name, note, parent_id, parent2_id, spouse_of, created_by)
  VALUES
    -- Eddard + Catelyn's children
    (robb_id,   fam_id, 'Robb Stark',   'King in the North',  eddard_id, catelyn_id, null, owner_id),
    (sansa_id,  fam_id, 'Sansa Stark',  null,                  eddard_id, catelyn_id, null, owner_id),
    (arya_id,   fam_id, 'Arya Stark',   null,                  eddard_id, catelyn_id, null, owner_id),
    (bran_id,   fam_id, 'Bran Stark',   'Three-Eyed Raven',   eddard_id, catelyn_id, null, owner_id),
    (rickon_id, fam_id, 'Rickon Stark', null,                  eddard_id, catelyn_id, null, owner_id),
    -- Lyanna + Rhaegar's child (Jon Snow's true parentage)
    (jon_id,    fam_id, 'Jon Snow',     'King in the North',  lyanna_id, rhaegar_id, null, owner_id);

  RAISE NOTICE 'House Stark tree created. Family ID: %', fam_id;
END $$;
