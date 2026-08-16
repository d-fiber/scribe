-- Copyright (C) 2026 Fiber
--
-- This file is part of scribe and is made available under the PolyForm Shield
-- License 1.0.0. The full terms are in the LICENSE file at the root of this
-- repository, and at https://polyformproject.org/licenses/shield/1.0.0
--
-- What you may do:
-- - Use this software for any purpose, including commercially, and build and
--   sell your own products on top of it.
-- - Change it, and create new works based on it.
-- - Distribute copies of it, with or without your changes.
--
-- The one thing you may not do:
-- - Use it to provide any product that competes with scribe, or with any
--   product Fiber or its affiliates provide using scribe. Products compete
--   even when they are offered free of charge, through a different kind of
--   interface, or for a different technical platform.
--
-- If you pass this software on:
-- - Anyone who receives any part of it from you must also receive these terms,
--   or the URL above, together with the "Required Notice" line carried by the
--   LICENSE file.
--
-- Disclaimer:
-- AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
-- CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
-- OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
-- LEGAL CLAIM.
--
-- This header is a summary written for convenience. Where it differs from the
-- LICENSE file, the LICENSE file governs.

-- Deux buckets, une seule différence : qui peut lire.
--
--   app_bucket   public  → servi sur APP_URL en /object/public/..., sans jeton
--                          côté storage. Pour tout ce qui est destiné à l'app.
--   admin_bucket privé   → servi sur ADMIN_URL en /object/<bucket>/..., donc
--                          derrière le VPN (Caddy) + un JWT (Kong) + la RLS
--                          ci-dessous, qui exige le rôle admin.
--
-- Aucun des deux ne contraint types ni tailles : ces règles vivent dans les
-- entités TS (scribe/host/dependencies/database/storage/), qui déclarent
-- extensions et taille max par ressource. Les dupliquer ici créerait deux
-- sources de vérité, et le refus du bucket est muet côté client.
--
-- Aucun dossier n'est créé : storage.objects.name est une clé plate, les "/"
-- ne sont qu'une convention de nommage (storage.foldername() les parse à la
-- lecture). Un upload sur "brands/<id>/logo" crée l'objet directement.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('app_bucket',   'app_bucket',   true,  NULL, NULL),
  ('admin_bucket', 'admin_bucket', false, NULL, NULL)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = NULL,
      allowed_mime_types = NULL;

DO $$
BEGIN
  -- Bucket public : lecture ouverte à tout compte authentifié. Le bucket étant
  -- `public = true`, cette policy ne couvre que le chemin authentifié
  -- (/object/<bucket>/...), le chemin /object/public/... ne la consulte pas.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_select_app_bucket'
  ) THEN
    CREATE POLICY "storage_select_app_bucket" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'app_bucket');
  END IF;

  -- Bucket privé : réservé aux admins. C'est la seule barrière qui ne dépend
  -- ni du réseau (VPN) ni de la passerelle (Kong) — une URL qui fuite reste
  -- inutilisable sans un JWT portant app_metadata.role = 'admin'.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_select_admin_bucket'
  ) THEN
    CREATE POLICY "storage_select_admin_bucket" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'admin_bucket'
        AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );
  END IF;
END;
$$;

-- Aucune policy d'écriture pour `authenticated` : les uploads et suppressions
-- passent tous par les edge functions, avec la clé service qui contourne la
-- RLS. Les anciennes policies storage_insert/update/delete laissaient un compte
-- authentifié écrire dans le bucket ; seule la passerelle Kong l'en empêchait.
DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_users" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
