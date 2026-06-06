ALTER TABLE IF EXISTS public.user_data
  ADD COLUMN IF NOT EXISTS preferred_min_height DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS preferred_max_height DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS preferred_kids TEXT DEFAULT 'any';

ALTER TABLE IF EXISTS public."UserData"
  ADD COLUMN IF NOT EXISTS preferred_min_height DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS preferred_max_height DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS preferred_kids TEXT DEFAULT 'any';

CREATE OR REPLACE FUNCTION public.compatibility_score(user1_id text, user2_id text)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
declare
    u1 user_data%rowtype;
    u2 user_data%rowtype;

    score numeric := 0;
    possible numeric := 100;

    shared_interests int;
    total_interests int;

    lifestyle_matches int := 0;

begin

    select * into u1
    from user_data
    where user_id = user1_id;

    select * into u2
    from user_data
    where user_id = user2_id;

    if u1.user_id is null or u2.user_id is null then
        return 0;
    end if;

    if (
        u1.seeking_gender <> 'everyone'
        and lower(u1.seeking_gender) <> lower(u2.gender::text)
    ) then
        return 0;
    end if;

    if (
        u2.seeking_gender <> 'everyone'
        and lower(u2.seeking_gender) <> lower(u1.gender::text)
    ) then
        return 0;
    end if;

    if (
        u1.preferred_min_height is not null
        and u2.height is not null
        and u2.height < u1.preferred_min_height
    ) then
        return 0;
    end if;

    if (
        u1.preferred_max_height is not null
        and u2.height is not null
        and u2.height > u1.preferred_max_height
    ) then
        return 0;
    end if;

    if (
        u2.preferred_min_height is not null
        and u1.height is not null
        and u1.height < u2.preferred_min_height
    ) then
        return 0;
    end if;

    if (
        u2.preferred_max_height is not null
        and u1.height is not null
        and u1.height > u2.preferred_max_height
    ) then
        return 0;
    end if;

    if (
        u1.preferred_kids in ('yes', 'no')
        and u2.kids is not null
        and u2.kids <> (u1.preferred_kids = 'yes')
    ) then
        return 0;
    end if;

    if (
        u2.preferred_kids in ('yes', 'no')
        and u1.kids is not null
        and u1.kids <> (u2.preferred_kids = 'yes')
    ) then
        return 0;
    end if;

    select count(*)
    into shared_interests
    from unnest(u1.interests) a
    join unnest(u2.interests) b
      on a = b;

    select count(*)
    into total_interests
    from (
        select unnest(u1.interests)
        union
        select unnest(u2.interests)
    ) x;

    if total_interests > 0 then
        score :=
            score +
            ((shared_interests::numeric / total_interests::numeric) * 30);
    end if;

    if u1.languages && u2.languages then
        score := score + 10;
    end if;

    if u1.mbti = u2.mbti then
        score := score + 10;
    end if;

    if u1.relationship = u2.relationship then
        score := score + 15;
    end if;

    if (
        u1.seeking_gender = 'everyone'
        or lower(u1.seeking_gender) = lower(u2.gender::text)
    ) then
        score := score + 15;
    end if;

    if u1.pets = u2.pets then
        lifestyle_matches := lifestyle_matches + 1;
    end if;

    if u1.kids = u2.kids then
        lifestyle_matches := lifestyle_matches + 1;
    end if;

    if u1.drives = u2.drives then
        lifestyle_matches := lifestyle_matches + 1;
    end if;

    score :=
      score +
      ((lifestyle_matches::numeric / 3) * 10);

    if u1.zodiac = u2.zodiac then
        score := score + 5;
    end if;

    if u1.education = u2.education then
        score := score + 5;
    end if;

    if (
        coalesce(array_length(u1.availability, 1), 0) > 0
        and coalesce(array_length(u2.availability, 1), 0) > 0
        and u1.availability && u2.availability
    ) then
        score := score + 5;
    end if;

    if (
        coalesce(array_length(u1.time_availability, 1), 0) > 0
        and coalesce(array_length(u2.time_availability, 1), 0) > 0
        and u1.time_availability && u2.time_availability
    ) then
        score := score + 5;
    end if;

    return least(round((score / possible) * 100, 2), 100);

end;
$function$;
