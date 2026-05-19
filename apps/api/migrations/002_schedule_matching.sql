-- Add schedule/timetable overlap to the database compatibility fallback.
-- The frontend does not collect these fields yet, but user_data already has:
--   availability day_type[]
--   time_availability "time_type " []

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

    -- Get users
    select * into u1
    from user_data
    where user_id = user1_id;

    select * into u2
    from user_data
    where user_id = user2_id;

    -- Safety check
    if u1.user_id is null or u2.user_id is null then
        return 0;
    end if;


    ------------------------------------------------
    -- HARD FAIL CONDITIONS
    ------------------------------------------------

    -- Gender preference incompatibility
    if (
        u1.seeking_gender <> 'everyone'
        and lower(u1.seeking_gender) <> lower(u2.gender::text)
    ) then
        return 0;
    end if;


    ------------------------------------------------
    -- INTERESTS (30 points)
    ------------------------------------------------

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


    ------------------------------------------------
    -- LANGUAGES (10 points)
    ------------------------------------------------

    if u1.languages && u2.languages then
        score := score + 10;
    end if;


    ------------------------------------------------
    -- MBTI (10 points)
    ------------------------------------------------

    if u1.mbti = u2.mbti then
        score := score + 10;
    end if;


    ------------------------------------------------
    -- RELATIONSHIP GOALS (15 points)
    ------------------------------------------------

    if u1.relationship = u2.relationship then
        score := score + 15;
    end if;


    ------------------------------------------------
    -- SEEKING GENDER (15 points)
    ------------------------------------------------

    if (
        u1.seeking_gender = 'everyone'
        or lower(u1.seeking_gender) = lower(u2.gender::text)
    ) then
        score := score + 15;
    end if;


    ------------------------------------------------
    -- LIFESTYLE (10 points)
    ------------------------------------------------

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


    ------------------------------------------------
    -- ZODIAC (5 points)
    ------------------------------------------------

    if u1.zodiac = u2.zodiac then
        score := score + 5;
    end if;


    ------------------------------------------------
    -- EDUCATION (5 points)
    ------------------------------------------------

    if u1.education = u2.education then
        score := score + 5;
    end if;


    ------------------------------------------------
    -- SCHEDULE/TIMETABLE BONUS (up to 10 points)
    ------------------------------------------------

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


    ------------------------------------------------
    -- FINAL PERCENT
    ------------------------------------------------

    return least(round((score / possible) * 100, 2), 100);

end;
$function$;
