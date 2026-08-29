import { createClient } from '@/lib/supabase/server';
import type { Profile, Role } from './types';

export async function getSessionProfile(){
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)return null;
  const {data:profile}=await db.from('profiles').select('id,display_name,phone,role').eq('id',user.id).maybeSingle();
  return profile?{user,profile:profile as Profile}:null;
}
export async function requireRole(roles:Role[]){
  const s=await getSessionProfile();
  if(!s||!roles.includes(s.profile.role))return null;
  return s;
}
export async function requireStaff(){
  return requireRole(['platform_admin','moderator','content_manager','finance_manager','school_admin']);
}
export async function requireUser(){
  const s=await getSessionProfile();
  if(!s) return null;
  const db=await createClient();
  return {supabase:db,user:s.user,profile:s.profile};
}