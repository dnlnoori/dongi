-- Dangi MVP schema. Run this file in Supabase SQL Editor before starting the app.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  business_name text not null default 'کسب‌وکار من',
  phone text,
  card_number text,
  default_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'صورتحساب گروهی',
  total_amount bigint not null check (total_amount > 0),
  status text not null default 'open' check (status in ('open', 'partial', 'paid')),
  note text,
  card_number text,
  customer_phone text,
  public_token text not null unique default encode(gen_random_bytes(20), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  amount bigint not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  share_token text not null unique default encode(gen_random_bytes(20), 'hex'),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null check (amount > 0),
  provider text not null default 'test',
  status text not null default 'succeeded' check (status in ('pending', 'succeeded', 'failed')),
  transaction_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create unique index if not exists payments_one_success_per_participant
  on public.payments(participant_id) where status = 'succeeded';

create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  participant_id uuid references public.participants(id) on delete set null,
  to_phone text not null,
  body text not null,
  provider text not null default 'mock',
  status text not null default 'logged',
  created_at timestamptz not null default now()
);

create index if not exists invoices_seller_created_idx on public.invoices(seller_id, created_at desc);
create index if not exists participants_invoice_idx on public.participants(invoice_id);
create index if not exists payments_invoice_idx on public.payments(invoice_id, paid_at desc);
create index if not exists sms_logs_invoice_idx on public.sms_logs(invoice_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, business_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'business_name', 'کسب‌وکار من'))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.participants enable row level security;
alter table public.payments enable row level security;
alter table public.sms_logs enable row level security;

drop policy if exists "profile owner can read" on public.profiles;
create policy "profile owner can read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profile owner can update" on public.profiles;
create policy "profile owner can update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

 drop policy if exists "seller manages invoices" on public.invoices;
create policy "seller manages invoices" on public.invoices for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
drop policy if exists "seller manages participants" on public.participants;
create policy "seller manages participants" on public.participants for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
drop policy if exists "seller reads payments" on public.payments;
create policy "seller reads payments" on public.payments for select using (auth.uid() = seller_id);
drop policy if exists "seller reads sms logs" on public.sms_logs;
create policy "seller reads sms logs" on public.sms_logs for select using (auth.uid() = seller_id);

-- Creates all participant shares atomically; the invoice public token is the capability.
create or replace function public.create_invoice_splits(p_invoice_token text, p_participants jsonb)
returns table(id uuid, name text, phone text, amount bigint, share_token text)
language plpgsql security definer set search_path = public as $$
declare
  v_invoice public.invoices%rowtype;
  v_count integer;
  v_sum numeric;
begin
  select * into v_invoice from public.invoices where public_token = p_invoice_token for update;
  if not found then raise exception 'صورتحساب پیدا نشد'; end if;
  if exists (select 1 from public.participants where invoice_id = v_invoice.id) then
    raise exception 'تقسیم این صورتحساب قبلاً ثبت شده است';
  end if;
  if jsonb_typeof(p_participants) <> 'array' then raise exception 'ساختار افراد معتبر نیست'; end if;
  select count(*), coalesce(sum((value->>'amount')::numeric), 0)
    into v_count, v_sum from jsonb_array_elements(p_participants);
  if v_count < 1 or v_count > 50 then raise exception 'تعداد افراد باید بین ۱ تا ۵۰ نفر باشد'; end if;
  if v_sum <> v_invoice.total_amount then raise exception 'مجموع سهم‌ها باید دقیقاً برابر مبلغ صورتحساب باشد'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_participants) as item(value)
    where coalesce(trim(value->>'name'), '') = ''
       or coalesce(trim(value->>'phone'), '') !~ '^09[0-9]{9}$'
       or coalesce((value->>'amount')::numeric, 0) <= 0
  ) then raise exception 'نام، شماره موبایل یا مبلغ یکی از افراد معتبر نیست'; end if;

  insert into public.participants (invoice_id, seller_id, name, phone, amount)
  select v_invoice.id, v_invoice.seller_id, trim(value->>'name'), value->>'phone', (value->>'amount')::bigint
  from jsonb_array_elements(p_participants) as item(value);

  update public.invoices set status = 'open', updated_at = now() where id = v_invoice.id;
  return query select p.id, p.name, p.phone, p.amount, p.share_token
    from public.participants p where p.invoice_id = v_invoice.id order by p.created_at;
end;
$$;

-- Test-only checkout completion. Replace this RPC with a verified gateway webhook flow for production payments.
create or replace function public.complete_test_payment(p_share_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_participant public.participants%rowtype;
  v_ref text;
  v_paid_count integer;
  v_total_count integer;
  v_status text;
begin
  select * into v_participant from public.participants where share_token = p_share_token for update;
  if not found then raise exception 'لینک پرداخت معتبر نیست'; end if;
  if v_participant.status = 'paid' then
    return jsonb_build_object('status', 'paid', 'paid_at', v_participant.paid_at, 'already_paid', true);
  end if;
  v_ref := 'TEST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.payments (invoice_id, participant_id, seller_id, amount, provider, status, transaction_ref, paid_at)
  values (v_participant.invoice_id, v_participant.id, v_participant.seller_id, v_participant.amount, 'test', 'succeeded', v_ref, now());
  update public.participants set status = 'paid', paid_at = now() where id = v_participant.id;
  select count(*) filter (where status = 'paid'), count(*) into v_paid_count, v_total_count
    from public.participants where invoice_id = v_participant.invoice_id;
  v_status := case when v_paid_count = v_total_count then 'paid' else 'partial' end;
  update public.invoices set status = v_status, updated_at = now() where id = v_participant.invoice_id;
  return jsonb_build_object('status', 'paid', 'paid_at', now(), 'transaction_ref', v_ref, 'invoice_status', v_status);
end;
$$;

grant execute on function public.create_invoice_splits(text, jsonb) to anon, authenticated;
grant execute on function public.complete_test_payment(text) to anon, authenticated;
