begin;

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
set full_name = registered_names.full_name
from registered_names
where profiles.id = registered_names.id
  and profiles.role = 'dietitian'
  and nullif(btrim(profiles.full_name), '') is null
  and registered_names.full_name is not null;

commit;
