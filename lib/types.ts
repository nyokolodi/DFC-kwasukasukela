export type Role='family_owner'|'family_member'|'elder_applicant'|'storyteller'|'teacher'|'school_admin'|'moderator'|'content_manager'|'finance_manager'|'platform_admin';
export type AccessLevel='public'|'subscriber'|'school'|'restricted';
export type StoryStatus='draft'|'submitted'|'review'|'approved'|'rejected'|'published'|'archived';
export interface Profile{ id:string; display_name:string|null; phone:string|null; role:Role }
export interface Story{ id:string; slug:string; title:string; original_title:string|null; summary:string; language_name:string; culture_name:string|null; age_min:number; age_max:number; themes:string[]; moral_lesson:string|null; access_level:AccessLevel; status:StoryStatus; published_at:string|null; storyteller_name?:string|null; duration_seconds?:number|null; audio_path?:string|null }
