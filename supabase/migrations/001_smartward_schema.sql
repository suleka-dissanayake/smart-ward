-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text        not null,
  email       text        not null unique,
  role        text        not null check (role in ('doctor','nurse','admin')),
  department  text        not null default '',
  status      text        not null default 'Active' check (status in ('Active','Inactive')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Wards
create table if not exists public.wards (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null unique,
  description text,
  total_beds  int         not null check (total_beds > 0),
  created_at  timestamptz not null default now()
);

-- Beds (child of wards)
create table if not exists public.beds (
  id          uuid primary key default gen_random_uuid(),
  ward_id     uuid        not null references public.wards(id) on delete cascade,
  bed_number  text        not null,
  is_occupied boolean     not null default false,
  patient_id  uuid,                              -- FK added after patients table
  unique (ward_id, bed_number)
);

-- Patients
create table if not exists public.patients (
  id               uuid primary key default gen_random_uuid(),
  name             text        not null,
  age              int         not null check (age >= 0),
  gender           text        not null check (gender in ('Male','Female')),
  ward_id          uuid        not null references public.wards(id),
  bed              text        not null,
  admission_date   date        not null,
  status           text        not null default 'Stable'
                               check (status in ('Stable','Attention','Critical','Discharged')),
  diagnosis        text        not null default '',
  allergies        text[]      not null default '{}',
  assigned_doctor  uuid        references public.profiles(id),
  assigned_nurse   uuid        references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Now add the FK from beds to patients
alter table public.beds
  add constraint beds_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete set null;

-- Vitals (one row per recording; ordered desc)
create table if not exists public.vitals (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  temperature      text,
  blood_pressure   text,
  pulse            text,
  respiratory_rate text,
  spo2             text,
  pain_score       int         check (pain_score between 0 and 10),
  recorded_by      uuid        references public.profiles(id),
  recorded_at      timestamptz not null default now()
);

-- Medications
create table if not exists public.medications (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid        not null references public.patients(id) on delete cascade,
  name          text        not null,
  dose          text        not null,
  route         text        not null,
  frequency     text        not null,
  start_date    date,
  end_date      date,
  prescribed_by uuid        references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- Scheduled doses (child of medications)
create table if not exists public.scheduled_doses (
  id                uuid primary key default gen_random_uuid(),
  medication_id     uuid        not null references public.medications(id) on delete cascade,
  time              text        not null,
  status            text        not null default 'Pending' check (status in ('Pending','Administered')),
  administered_at   timestamptz,
  administered_by   uuid        references public.profiles(id)
);

-- Ward rounds
create table if not exists public.ward_rounds (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid        not null references public.patients(id) on delete cascade,
  doctor_id       uuid        references public.profiles(id),
  assessment      text        not null default '',
  clinical_notes  text        not null default '',
  treatment_plan  text        not null default '',
  next_review     date,
  date            timestamptz not null default now()
);

-- Nursing notes
create table if not exists public.nursing_notes (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid        not null references public.patients(id) on delete cascade,
  nurse_id    uuid        references public.profiles(id),
  note        text        not null,
  date        timestamptz not null default now()
);

-- Notifications
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  title           text        not null,
  message         text        not null,
  type            text        not null default 'info'
                              check (type in ('alert','info','task','critical')),
  recipient_role  text        not null default 'all'
                              check (recipient_role in ('doctor','nurse','admin','all')),
  recipient_id    uuid        references public.profiles(id),
  patient_id      uuid        references public.patients(id) on delete set null,
  is_read         boolean     not null default false,
  created_by      uuid        references public.profiles(id),
  created_at      timestamptz not null default now()
);

-- ── Indexes
create index if not exists idx_patients_ward      on public.patients(ward_id);
create index if not exists idx_patients_doctor    on public.patients(assigned_doctor);
create index if not exists idx_patients_nurse     on public.patients(assigned_nurse);
create index if not exists idx_vitals_patient     on public.vitals(patient_id, recorded_at desc);
create index if not exists idx_medications_patient on public.medications(patient_id);
create index if not exists idx_ward_rounds_patient on public.ward_rounds(patient_id, date desc);
create index if not exists idx_nursing_notes_patient on public.nursing_notes(patient_id, date desc);
create index if not exists idx_notifications_role on public.notifications(recipient_role, is_read);

-- ── Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_patients_updated_at before update on public.patients
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── RLS: disable for service role (edge function uses service key) 
alter table public.profiles       enable row level security;
alter table public.wards          enable row level security;
alter table public.beds           enable row level security;
alter table public.patients       enable row level security;
alter table public.vitals         enable row level security;
alter table public.medications    enable row level security;
alter table public.scheduled_doses enable row level security;
alter table public.ward_rounds    enable row level security;
alter table public.nursing_notes  enable row level security;
alter table public.notifications  enable row level security;

-- Allow authenticated users to read profiles (needed for Supabase auth client)
create policy "Profiles readable by authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');