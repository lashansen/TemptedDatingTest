import React, { useEffect, useState } from 'react';
import { Crown, Check, Zap, Star, ArrowRight, Calendar, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { getActiveSubscription } from '../../lib/adminUtils';

interface Plan {
  id: string;
  name: string;
  price_dkk: number;
  duration_days: number;
  features: string[];
  sort_order: number;
}

interface ActiveSub {
  id: string;
  plan_id: string;
  expires_at: string;
  plan: Plan;
  gifted_by: string | null;
}

export function SubscriptionPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useNavigation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [plansData, sub] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
        user ? getActiveSubscription(user.id) : null,
      ]);
      setPlans(plansData.data ?? []);
      setActiveSub(sub as ActiveSub | null);
      setLoading(false);
    };
    load();
  }, [user]);

  const handlePurchase = async (planId: string) => {
    if (!user) return;
    setPurchasing(planId);
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    const tier = planId.includes('premium') ? 'premium' : 'basic';

    const { error: subError } = await supabase.from('user_subscriptions').insert({
      profile_id: user.id,
      plan_id: planId,
      expires_at: expiresAt.toISOString(),
      payment_ref: `demo_${Date.now()}`,
    });

    if (!subError) {
      await supabase.from('dating_profiles').update({
        membership_tier: tier,
        membership_expires_at: expiresAt.toISOString(),
      }).eq('id', user.id);

      await refreshProfile();
      const sub = await getActiveSubscription(user.id);
      setActiveSub(sub as ActiveSub | null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }

    setPurchasing(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  const currentTier = profile?.membership_tier ?? 'free';
  const expiresAt = profile?.membership_expires_at ? new Date(profile.membership_expires_at) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : true;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Crown size={28} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">Tempted Membership</h1>
        <p className="text-gray-400 max-w-md mx-auto">Opgrader dit membership og få adgang til alle premium-funktioner</p>
      </div>

      {success && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <Check size={20} className="text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 font-medium">Dit membership er aktiveret! Nyd alle fordelene.</p>
        </div>
      )}

      {/* Current status */}
      {currentTier !== 'free' && !isExpired && activeSub && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Crown size={20} className="text-amber-400" />
            <div>
              <p className="text-white font-semibold">Aktivt membership: {activeSub.plan?.name}</p>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-0.5">
                <Calendar size={12} />
                Udløber {new Date(activeSub.expires_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => navigate('gift-membership')}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-sm font-medium transition-colors border border-amber-500/20"
            >
              <Gift size={14} />
              Giv som gave
            </button>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, idx) => {
          const isPopular = plan.id === 'premium_monthly';
          const isYearly = plan.id === 'premium_yearly';
          const isCurrentPlan = activeSub?.plan_id === plan.id && !isExpired;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                isPopular
                  ? 'bg-gradient-to-b from-rose-950/60 to-gray-900 border-rose-500/40 shadow-xl shadow-rose-500/10'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Mest populær
                  </span>
                </div>
              )}
              {isYearly && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Bedst værdi
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {isPopular ? <Star size={16} className="text-rose-400 fill-rose-400" /> : isYearly ? <Crown size={16} className="text-amber-400" /> : <Zap size={16} className="text-sky-400" />}
                  <h3 className="text-white font-bold">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">{plan.price_dkk}</span>
                  <span className="text-gray-400 text-sm">kr.</span>
                  <span className="text-gray-500 text-sm">/ {plan.duration_days >= 365 ? 'år' : 'måned'}</span>
                </div>
                {isYearly && (
                  <p className="text-amber-400/80 text-xs mt-1">Svarer til 66 kr./md.</p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((feature, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-sm">
                    <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="py-2.5 text-center text-sm font-medium text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  Aktivt membership
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={purchasing === plan.id}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                    isPopular
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/20'
                      : isYearly
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                  }`}
                >
                  {purchasing === plan.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      Vælg plan
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-gray-600 text-xs">
        Dette er en demo. Ingen rigtige betalinger behandles.
      </p>
    </div>
  );
}
