begin;

-- Idempotent backfill: sync profiles.full_name from auth.users.raw_user_meta_data
-- for dietitian profiles where full_name is empty.
with registered_names as (
    select
        users.id,
        nullif(
            btrim(
                coalesce(
                    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
                    nullif(
                        btrim(
                            concat_ws(
                                ' ',
                                nullif(btrim(users.raw_user_meta_data ->> 'first_name'), ''),
                                nullif(btrim(users.raw_user_meta_data ->> 'last_name'), '')
                            )
                        ),
                        ''
                    )
                )
            ),
            ''
        ) as full_name
    from auth.users
)
update public.profiles as profiles
set full_name = registered_names.full_name,
    updated_at = now()
from registered_names
where profiles.id = registered_names.id
  and profiles.role = 'dietitian'
  and nullif(btrim(profiles.full_name), '') is null
  and registered_names.full_name is not null;

-- Idempotent function: returns the dietitian display name from profiles.full_name.
-- If empty, attempts to read from auth.users.raw_user_meta_data as a controlled fallback.
-- This function runs with SECURITY DEFINER so the client can read the name
-- even when it is only present in auth metadata.
create or replace function public.get_dietitian_display_name(p_dietitian_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_profile_name text;
    v_meta_name text;
begin
    -- Clients may resolve names only for their own active/pending connection.
    if not exists (
        select 1
        from public.dietitian_clients
        where client_id = auth.uid()
          and dietitian_id = p_dietitian_id
          and status in ('active', 'pending')
    ) then
        return null;
    end if;

    -- 1. Try profiles.full_name first (canonical public source)
    select nullif(btrim(profiles.full_name), '')
    into v_profile_name
    from public.profiles
    where profiles.id = p_dietitian_id
      and profiles.role = 'dietitian';

    if v_profile_name is not null then
        return v_profile_name;
    end if;

    -- 2. Fallback: read from auth.users.raw_user_meta_data
    -- (only accessible via SECURITY DEFINER function)
    select nullif(
        btrim(
            coalesce(
                nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
                nullif(
                    btrim(
                        concat_ws(
                            ' ',
                            nullif(btrim(raw_user_meta_data ->> 'first_name'), ''),
                            nullif(btrim(raw_user_meta_data ->> 'last_name'), '')
                        )
                    ),
                    ''
                )
            )
        ),
        ''
    )
    into v_meta_name
    from auth.users
    where auth.users.id = p_dietitian_id;

    if v_meta_name is not null then
        return v_meta_name;
    end if;

    return null;
end;
$$;

comment on function public.get_dietitian_display_name(uuid) is
    'Returns the dietitian display name from profiles.full_name, falling back to auth metadata. SECURITY DEFINER so clients can read auth-side name data.';

-- Grant execute to authenticated users (clients)
grant execute on function public.get_dietitian_display_name(uuid) to authenticated;
revoke execute on function public.get_dietitian_display_name(uuid) from public;

commit;
