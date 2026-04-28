import { supabase } from './supabase';

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('admin_users')
    .select('profile_id')
    .eq('profile_id', userId)
    .maybeSingle();
  return !!data;
}

export async function getSubscriptionPlans() {
  const { data } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return data ?? [];
}

export async function getActiveSubscription(profileId: string) {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .maybeSingle();
  return data;
}
