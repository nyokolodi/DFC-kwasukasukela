insert into public.languages(code,name) values ('zu','isiZulu'),('xh','isiXhosa'),('st','Sesotho'),('nso','Sepedi'),('en','English'),('tn','Setswana') on conflict do nothing;
insert into public.cultures(name,description) values ('Zulu','Stories and knowledge connected to amaZulu communities'),('Xhosa','Stories and knowledge connected to amaXhosa communities'),('Sotho','Stories and knowledge connected to Basotho communities'),('Tswana','Stories and knowledge connected to Batswana communities') on conflict do nothing;

insert into public.stories(slug,title,summary,language_id,culture_id,age_min,age_max,themes,moral_lesson,rights_holder,status,published_at,access_level)
select 'the-clever-hare','The Clever Hare','A small hare survives through careful listening and quick thinking.',l.id,c.id,5,11,array['wisdom','courage'],'Wisdom is not measured by size.','Digital Fire Circle pilot','published',now(),'public'
from public.languages l,public.cultures c where l.code='en' and c.name='Sotho' on conflict(slug) do nothing;

insert into public.fire_circles(title,description,starts_at,ends_at,status,livekit_room_name)
values('Sunday Story Fire','A gentle family circle with an elder-led story and a moderated reflection.',now()+interval '7 days',now()+interval '7 days 45 minutes','scheduled','dfc-sunday-pilot') on conflict(livekit_room_name) do nothing;
