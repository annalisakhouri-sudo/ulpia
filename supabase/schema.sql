-- ULPIA - Schema de base de données
-- A coller dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- 1. COMPANIES (le client payeur : l'entreprise, ex un bailleur social)
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. PROFILES (un utilisateur = un employé d'une company, lié à auth.users de Supabase)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

-- 3. DOCUMENTS (les fichiers déposés par la company)
create table documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  category text not null default 'autre', -- ex: bilan, kbis, attestation, autre
  storage_path text not null, -- chemin du fichier dans Supabase Storage
  uploaded_by uuid references profiles(id),
  expires_at timestamptz, -- optionnel : date de renouvellement, au choix de l'entreprise
  created_at timestamptz not null default now()
);

-- 4. INTERLOCUTORS (les externes qui reçoivent l'accès : n'importe quel type, libre)
create table interlocutors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text,
  organization_type text not null default 'Autre', -- libre : Banque, Notaire, Client, Fournisseur, etc.
  request_token uuid not null default gen_random_uuid(), -- lien personnel pour formuler une demande documentaire
  created_at timestamptz not null default now()
);

-- 5. PERMISSIONS (qui a accès à quel document, via un lien à token)
create table permissions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  interlocutor_id uuid not null references interlocutors(id) on delete cascade,
  access_token uuid not null default gen_random_uuid(), -- utilisé dans le lien sécurisé envoyé à l'interlocuteur
  expires_at timestamptz, -- null = pas d'expiration
  created_at timestamptz not null default now(),
  unique (document_id, interlocutor_id)
);

-- 6. DOSSIERS (un regroupement de documents, ex: "Dossier financement Résidence Les Tilleuls")
create table dossiers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  required_categories text[] not null default '{}', -- types de documents attendus pour ce dossier
  created_at timestamptz not null default now()
);

-- 7. DOCUMENT_DOSSIERS (un document peut appartenir à plusieurs dossiers)
create table document_dossiers (
  document_id uuid not null references documents(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  primary key (document_id, dossier_id)
);

-- 8. DOSSIER_PERMISSIONS (donner accès à TOUS les documents d'un dossier en un coup, via un lien à token)
create table dossier_permissions (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers(id) on delete cascade,
  interlocutor_id uuid not null references interlocutors(id) on delete cascade,
  access_token uuid not null default gen_random_uuid(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (dossier_id, interlocutor_id)
);

-- 9. ACCESS_LOGS (journal d'accès : trace de tout ce qui se passe sur documents/dossiers)
create table access_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  event_type text not null, -- ex: document_deposited, permission_granted, permission_revoked, document_viewed, dossier_created
  actor text not null, -- ex: "Vous" (action interne) ou le nom de l'interlocuteur (action externe)
  document_name text,
  dossier_name text,
  interlocutor_name text,
  created_at timestamptz not null default now()
);

-- 10. DEMANDES (une institution demande un type de document ; le titulaire autorise ou refuse)
create table demandes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  interlocutor_id uuid not null references interlocutors(id) on delete cascade,
  category text not null,
  message text,
  status text not null default 'en_attente' check (status in ('en_attente', 'acceptee', 'refusee')),
  document_id uuid references documents(id) on delete set null, -- rempli une fois acceptée
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- 11. INTERLOCUTOR_ACCOUNTS (compte de connexion pour un interlocuteur : banque, notaire, client, etc.)
-- Un même interlocuteur (même email) peut être lié à plusieurs entreprises différentes.
create table interlocutor_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table interlocutor_accounts enable row level security;

create policy "voir son propre compte interlocuteur"
  on interlocutor_accounts for select
  using (id = auth.uid());

create policy "modifier son propre compte interlocuteur"
  on interlocutor_accounts for update
  using (id = auth.uid());

-- Un interlocuteur connecté peut voir les lignes "interlocutors" qui correspondent à son email,
-- quelle que soit l'entreprise (nécessaire pour qu'il retrouve ses accès chez chacune).
create policy "interlocuteur voit ses propres lignes"
  on interlocutors for select
  using (email = auth.email());

-- FONCTION HELPER : récupère la company de l'utilisateur connecté SANS déclencher les règles
-- RLS de la table profiles elle-même (évite une boucle infinie qui ferait planter silencieusement
-- toutes les requêtes protégées).
create or replace function public.get_my_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from profiles where id = auth.uid()
$$;

-- ROW LEVEL SECURITY : chaque company ne voit que ses propres données
alter table companies enable row level security;
alter table profiles enable row level security;
alter table documents enable row level security;
alter table interlocutors enable row level security;
alter table permissions enable row level security;
alter table dossiers enable row level security;
alter table document_dossiers enable row level security;
alter table dossier_permissions enable row level security;
alter table access_logs enable row level security;
alter table demandes enable row level security;

create policy "voir sa propre company"
  on companies for select
  using (id = public.get_my_company_id());

create policy "voir son profil et ses collegues"
  on profiles for select
  using (company_id = public.get_my_company_id());

create policy "modifier son propre profil"
  on profiles for update
  using (id = auth.uid());

create policy "voir les documents de sa company"
  on documents for select
  using (company_id = public.get_my_company_id());

create policy "ajouter des documents pour sa company"
  on documents for insert
  with check (company_id = public.get_my_company_id());

create policy "supprimer les documents de sa company"
  on documents for delete
  using (company_id = public.get_my_company_id());

create policy "voir les interlocuteurs de sa company"
  on interlocutors for select
  using (company_id = public.get_my_company_id());

create policy "ajouter des interlocuteurs pour sa company"
  on interlocutors for insert
  with check (company_id = public.get_my_company_id());

create policy "voir les permissions de sa company"
  on permissions for select
  using (
    document_id in (select id from documents where company_id = public.get_my_company_id())
  );

create policy "creer des permissions pour sa company"
  on permissions for insert
  with check (
    document_id in (select id from documents where company_id = public.get_my_company_id())
  );

create policy "supprimer des permissions de sa company"
  on permissions for delete
  using (
    document_id in (select id from documents where company_id = public.get_my_company_id())
  );

create policy "voir les dossiers de sa company"
  on dossiers for select
  using (company_id = public.get_my_company_id());

create policy "creer des dossiers pour sa company"
  on dossiers for insert
  with check (company_id = public.get_my_company_id());

create policy "supprimer les dossiers de sa company"
  on dossiers for delete
  using (company_id = public.get_my_company_id());

create policy "voir les liens document-dossier de sa company"
  on document_dossiers for select
  using (
    dossier_id in (select id from dossiers where company_id = public.get_my_company_id())
  );

create policy "creer des liens document-dossier pour sa company"
  on document_dossiers for insert
  with check (
    dossier_id in (select id from dossiers where company_id = public.get_my_company_id())
  );

create policy "supprimer des liens document-dossier de sa company"
  on document_dossiers for delete
  using (
    dossier_id in (select id from dossiers where company_id = public.get_my_company_id())
  );

create policy "voir les permissions de dossier de sa company"
  on dossier_permissions for select
  using (
    dossier_id in (select id from dossiers where company_id = public.get_my_company_id())
  );

create policy "creer des permissions de dossier pour sa company"
  on dossier_permissions for insert
  with check (
    dossier_id in (select id from dossiers where company_id = public.get_my_company_id())
  );

create policy "supprimer des permissions de dossier de sa company"
  on dossier_permissions for delete
  using (
    dossier_id in (select id from dossiers where company_id = public.get_my_company_id())
  );

create policy "voir le journal de sa company"
  on access_logs for select
  using (company_id = public.get_my_company_id());

create policy "ajouter des entrees de journal pour sa company"
  on access_logs for insert
  with check (company_id = public.get_my_company_id());

create policy "voir les demandes de sa company"
  on demandes for select
  using (company_id = public.get_my_company_id());

create policy "repondre aux demandes de sa company"
  on demandes for update
  using (company_id = public.get_my_company_id())
  with check (company_id = public.get_my_company_id());

-- Quand un nouvel utilisateur s'inscrit : soit il crée une entreprise (compte classique),
-- soit il crée un compte interlocuteur (partenaire), selon ce qui a été précisé à l'inscription.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_company_id uuid;
  account_type text;
begin
  account_type := coalesce(new.raw_user_meta_data->>'account_type', 'company');

  if account_type = 'interlocutor' then
    insert into public.interlocutor_accounts (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  else
    insert into public.companies (name) values (coalesce(new.raw_user_meta_data->>'company_name', 'Mon entreprise'))
    returning id into new_company_id;

    insert into public.profiles (id, company_id, full_name, role)
    values (new.id, new_company_id, new.raw_user_meta_data->>'full_name', 'admin');
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket pour les documents (à créer aussi manuellement dans Storage si besoin)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "acces storage pour sa company"
  on storage.objects for all
  using (bucket_id = 'documents' and (storage.foldername(name))[1] in (
    select company_id::text from profiles where profiles.id = auth.uid()
  ));
