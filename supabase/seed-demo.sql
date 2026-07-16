-- Script de démo ULPIA : remplit ton compte avec des données réalistes.
-- Remplace 'TON_EMAIL_ICI' par l'email avec lequel tu t'es connectée (ex: azef@ef.com)
-- avant de lancer ce script dans le SQL Editor de Supabase.

-- ATTENTION : ce sont des documents de DÉMONSTRATION (pas de vrais fichiers derrière).
-- Ils apparaîtront dans les listes pour que ça ait l'air rempli, mais cliquer sur
-- "Télécharger" ne fonctionnera pas tant qu'un vrai fichier n'est pas déposé au même chemin.

do $$
declare
  v_company_id uuid;
  v_uploader_id uuid;
  v_doc_bilan uuid;
  v_doc_kbis uuid;
  v_doc_attestation uuid;
  v_doc_plan uuid;
  v_dossier_id uuid;
  v_interlocutor_banque uuid;
  v_interlocutor_notaire uuid;
begin
  select p.company_id, p.id into v_company_id, v_uploader_id
  from profiles p
  join auth.users u on u.id = p.id
  where u.email = 'TON_EMAIL_ICI'
  limit 1;

  if v_company_id is null then
    raise exception 'Aucun compte trouvé avec cet email. Vérifie que tu as bien remplacé TON_EMAIL_ICI.';
  end if;

  -- Documents de démo
  insert into documents (company_id, name, category, storage_path, uploaded_by)
  values (v_company_id, 'Bilan comptable 2025', 'bilan', 'demo/bilan-2025.pdf', v_uploader_id)
  returning id into v_doc_bilan;

  insert into documents (company_id, name, category, storage_path, uploaded_by)
  values (v_company_id, 'K-bis Office HLM', 'kbis', 'demo/kbis.pdf', v_uploader_id)
  returning id into v_doc_kbis;

  insert into documents (company_id, name, category, storage_path, uploaded_by)
  values (v_company_id, 'Attestation assurance décennale', 'attestation', 'demo/attestation.pdf', v_uploader_id)
  returning id into v_doc_attestation;

  insert into documents (company_id, name, category, storage_path, uploaded_by)
  values (v_company_id, 'Plan de financement Résidence Les Tilleuls', 'autre', 'demo/plan-financement.pdf', v_uploader_id)
  returning id into v_doc_plan;

  -- Interlocuteurs de démo
  insert into interlocutors (company_id, name, email, organization_type)
  values (v_company_id, 'Crédit Agricole PACA - M. Fournier', 'p.fournier@ca-paca.fr', 'banque')
  returning id into v_interlocutor_banque;

  insert into interlocutors (company_id, name, email, organization_type)
  values (v_company_id, 'Étude Notariale Marceau & Associés', 'contact@notaires-marceau.fr', 'notaire')
  returning id into v_interlocutor_notaire;

  insert into interlocutors (company_id, name, email, organization_type)
  values (v_company_id, 'Maître Sylvie Rambert', 's.rambert@avocats-rambert.fr', 'avocat');

  insert into interlocutors (company_id, name, email, organization_type)
  values (v_company_id, 'SMABTP Assurances', 'contact@smabtp.fr', 'assureur');

  -- Dossier de démo regroupant plusieurs documents
  insert into dossiers (company_id, name)
  values (v_company_id, 'Financement Résidence Les Tilleuls')
  returning id into v_dossier_id;

  insert into document_dossiers (document_id, dossier_id) values (v_doc_bilan, v_dossier_id);
  insert into document_dossiers (document_id, dossier_id) values (v_doc_kbis, v_dossier_id);
  insert into document_dossiers (document_id, dossier_id) values (v_doc_plan, v_dossier_id);

  -- Quelques accès déjà accordés, pour que ça ait l'air d'un compte déjà utilisé
  insert into permissions (document_id, interlocutor_id) values (v_doc_kbis, v_interlocutor_notaire);
  insert into dossier_permissions (dossier_id, interlocutor_id) values (v_dossier_id, v_interlocutor_banque);

  -- Historique de démo dans le journal d'accès
  insert into access_logs (company_id, event_type, actor, document_name, created_at)
  values (v_company_id, 'document_deposited', 'Vous', 'Bilan comptable 2025', now() - interval '4 days');

  insert into access_logs (company_id, event_type, actor, document_name, created_at)
  values (v_company_id, 'document_deposited', 'Vous', 'K-bis Office HLM', now() - interval '4 days');

  insert into access_logs (company_id, event_type, actor, dossier_name, created_at)
  values (v_company_id, 'dossier_created', 'Vous', 'Financement Résidence Les Tilleuls', now() - interval '3 days');

  insert into access_logs (company_id, event_type, actor, dossier_name, interlocutor_name, created_at)
  values (v_company_id, 'dossier_permission_granted', 'Vous', 'Financement Résidence Les Tilleuls', 'Crédit Agricole PACA - M. Fournier', now() - interval '2 days');

  insert into access_logs (company_id, event_type, actor, dossier_name, interlocutor_name, created_at)
  values (v_company_id, 'dossier_viewed', 'Crédit Agricole PACA - M. Fournier', 'Financement Résidence Les Tilleuls', 'Crédit Agricole PACA - M. Fournier', now() - interval '1 day');

  insert into access_logs (company_id, event_type, actor, document_name, interlocutor_name, created_at)
  values (v_company_id, 'permission_granted', 'Vous', 'K-bis Office HLM', 'Étude Notariale Marceau & Associés', now() - interval '1 day');

end $$;
