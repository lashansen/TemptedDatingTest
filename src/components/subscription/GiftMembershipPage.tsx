import React, { useEffect, useState } from 'react';
import { Gift, Search, Send, Crown, Check, Clock, ChevronRight, Inbox } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';

interface Plan {
  id: string;
  name: string;
  price_dkk: number;
  duration_days: number;
  features: string[];
}

interface DatingProfileResult {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

interface GiftRow {
  id: string;
  plan_id: string;
  message: string;
  status: string;
  gift_code: string;
  expires_at: string;
  claimed_at: string | null;
  created_at: string;
  sender?: { display_name: string; username: string; avatar_url: string };
  recipient?: { display_name: string; username: string; avatar_url: string };
  plan?: { name: string; duration_days: number };
}

type GiftTab = 'send' | 'received' | 'sent';

export function GiftMembershipPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useNavigation();
  const [tab, setTab] = useState<GiftTab>('send');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DatingProfileResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<DatingProfileResult | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentGift, setSentGift] = useState<GiftRow | null>(null);
  const [receivedGifts, setReceivedGifts] = useState<GiftRow[]>([]);
  const [sentGifts, setSentGifts] = useState<GiftRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order');
      const filtered = (data ?? []).filter(p => p.id !== 'premium_yearly');
      setPlans(filtered);
      if (filtered.length > 0) setSelectedPlan(filtered[0].id);
    };
    load();
    loadGifts();
  }, []);

  const loadGifts = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('gift_memberships')
      .select('*, sender:sender_id(display_name, username, avatar_url), recipient:recipient_id(display_name, username, avatar_url), plan:plan_id(name, duration_days)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const allGifts = (data ?? []) as GiftRow[];
    setReceivedGifts(allGifts.filter(g => g.recipient && (g as any).recipient_id_raw !== user.id));
    setSentGifts(allGifts.filter(g => (g as any).sender_id_raw !== user.id));

    const { data: received } = await supabase
      .from('gift_memberships')
      .select('*, sender:sender_id(display_name, username, avatar_url), plan:plan_id(name, duration_days)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    const { data: sent } = await supabase
      .from('gift_memberships')
      .select('*, recipient:recipient_id(display_name, username, avatar_url), plan:plan_id(name, duration_days)')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    setReceivedGifts((received ?? []) as GiftRow[]);
    setSentGifts((sent ?? []) as GiftRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('dating_profiles')
        .select('id, display_name, username, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user?.id)
        .limit(6);
      setSearchResults((data ?? []) as DatingProfileResult[]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, user]);

  const sendGift = async () => {
    if (!user || !selectedRecipient || !selectedPlan) return;
    setSending(true);
    const plan = plans.find(p => p.id === selectedPlan)!;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const { data, error } = await supabase
      .from('gift_memberships')
      .insert({
        sender_id: user.id,
        recipient_id: selectedRecipient.id,
        plan_id: selectedPlan,
        message: giftMessage,
        expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      setSentGift(data as GiftRow);
      await loadGifts();
    }
    setSending(false);
  };

  const claimGift = async (gift: GiftRow) => {
    if (!user) return;
    setClaiming(gift.id);
    const plan = plans.find(p => p.id === gift.plan_id) || gift.plan;
    const durationDays = (plan as any)?.duration_days ?? 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const tier = gift.plan_id.includes('premium') ? 'premium' : 'basic';

    await supabase.from('gift_memberships')
      .update({ status: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', gift.id);

    await supabase.from('user_subscriptions').insert({
      profile_id: user.id,
      plan_id: gift.plan_id,
      expires_at: expiresAt.toISOString(),
      gifted_by: gift.sender ? (gift as any).sender_id : null,
      payment_ref: `gift_${gift.gift_code}`,
    });

    await supabase.from('dating_profiles').update({
      membership_tier: tier,
      membership_expires_at: expiresAt.toISOString(),
    }).eq('id', user.id);

    await refreshProfile();
    await loadGifts();
    setClaimSuccess(true);
    setClaiming(null);
    setTimeout(() => setClaimSuccess(false), 4000);
  };

  const statusBadge = (status: string) => {
    if (status === 'claimed') return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">Aktiveret</span>;
    if (status === 'expired') return <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full border border-gray-600">Udløbet</span>;
    return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">Afventer</span>;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Gift size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Gavemembership</h1>
          <p className="text-gray-400 text-sm">Giv en kær ven et membership som gave</p>
        </div>
      </div>

      {claimSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <Check size={20} className="text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 font-medium">Gave aktiveret! Nyd dit membership.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1">
        <TabBtn active={tab === 'send'} onClick={() => setTab('send')} label="Send gave" />
        <TabBtn
          active={tab === 'received'}
          onClick={() => { setTab('received'); loadGifts(); }}
          label="Modtagne gaver"
          badge={receivedGifts.filter(g => g.status === 'pending').length}
        />
        <TabBtn active={tab === 'sent'} onClick={() => { setTab('sent'); loadGifts(); }} label="Sendte gaver" />
      </div>

      {/* Send tab */}
      {tab === 'send' && (
        <div className="space-y-5">
          {sentGift ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <Gift size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Gave sendt!</h3>
              <p className="text-gray-400 text-sm">Din gave er nu klar til modtageren</p>
              {sentGift.gift_code && (
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">Gavekode</p>
                  <p className="text-white font-mono font-bold tracking-wider">{sentGift.gift_code.toUpperCase()}</p>
                </div>
              )}
              <button
                onClick={() => { setSentGift(null); setSelectedRecipient(null); setGiftMessage(''); setSearchQuery(''); }}
                className="text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors"
              >
                Send en ny gave
              </button>
            </div>
          ) : (
            <>
              {/* Plan select */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Vælg membership</label>
                <div className="grid grid-cols-2 gap-3">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selectedPlan === plan.id
                          ? 'border-rose-500 bg-rose-950/30'
                          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Crown size={14} className={selectedPlan === plan.id ? 'text-rose-400' : 'text-gray-500'} />
                        <span className="text-white text-sm font-medium">{plan.name}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{plan.price_dkk} kr. · {plan.duration_days} dage</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient search */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Modtager</label>
                {selectedRecipient ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-900 border border-rose-500/40 rounded-xl">
                    {selectedRecipient.avatar_url ? (
                      <img src={selectedRecipient.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Search size={14} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{selectedRecipient.display_name}</p>
                      <p className="text-gray-400 text-xs">@{selectedRecipient.username}</p>
                    </div>
                    <button onClick={() => setSelectedRecipient(null)} className="text-gray-500 hover:text-white text-xs transition-colors">Skift</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Søg efter brugernavn..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl z-10">
                        {searchResults.map(result => (
                          <button
                            key={result.id}
                            onClick={() => { setSelectedRecipient(result); setSearchQuery(''); setSearchResults([]); }}
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/5 transition-colors"
                          >
                            {result.avatar_url ? (
                              <img src={result.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                            )}
                            <div className="text-left min-w-0">
                              <p className="text-white text-sm font-medium truncate">{result.display_name}</p>
                              <p className="text-gray-400 text-xs">@{result.username}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-600 flex-shrink-0 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Personlig besked (valgfrit)</label>
                <textarea
                  value={giftMessage}
                  onChange={e => setGiftMessage(e.target.value)}
                  placeholder="Skriv en personlig hilsen til modtageren..."
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={sendGift}
                disabled={!selectedRecipient || !selectedPlan || sending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/20"
              >
                {sending ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Gift size={18} />
                    Send gavemembership
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Received tab */}
      {tab === 'received' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
            </div>
          ) : receivedGifts.length === 0 ? (
            <div className="text-center py-14">
              <Inbox size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-white font-medium">Ingen modtagne gaver</p>
              <p className="text-gray-500 text-sm mt-1">Når nogen sender dig et gavemembership, vises det her</p>
            </div>
          ) : (
            receivedGifts.map(gift => (
              <div key={gift.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  {(gift.sender as any)?.avatar_url ? (
                    <img src={(gift.sender as any).avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium">{(gift.sender as any)?.display_name ?? 'Ukendt'}</span>
                      {statusBadge(gift.status)}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {(gift.plan as any)?.name} · {(gift.plan as any)?.duration_days} dage
                    </p>
                    {gift.message && (
                      <p className="text-gray-400 text-xs mt-2 italic">"{gift.message}"</p>
                    )}
                    <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      Modtaget {new Date(gift.created_at).toLocaleDateString('da-DK')}
                    </p>
                  </div>
                  {gift.status === 'pending' && (
                    <button
                      onClick={() => claimGift(gift)}
                      disabled={claiming === gift.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-colors flex-shrink-0"
                    >
                      {claiming === gift.id ? (
                        <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>
                          <Gift size={12} />
                          Aktiver
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent tab */}
      {tab === 'sent' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
            </div>
          ) : sentGifts.length === 0 ? (
            <div className="text-center py-14">
              <Send size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-white font-medium">Ingen sendte gaver</p>
              <p className="text-gray-500 text-sm mt-1">Gaver du sender vises her</p>
            </div>
          ) : (
            sentGifts.map(gift => (
              <div key={gift.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  {(gift.recipient as any)?.avatar_url ? (
                    <img src={(gift.recipient as any).avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium">Til: {(gift.recipient as any)?.display_name ?? 'Ukendt'}</span>
                      {statusBadge(gift.status)}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {(gift.plan as any)?.name} · {(gift.plan as any)?.duration_days} dage
                    </p>
                    {gift.message && (
                      <p className="text-gray-400 text-xs mt-2 italic">"{gift.message}"</p>
                    )}
                    <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      Sendt {new Date(gift.created_at).toLocaleDateString('da-DK')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] h-[18px] bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </button>
  );
}
