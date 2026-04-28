import React, { useEffect, useState, useCallback } from 'react';
import { Shield, Image, Users, CheckCircle, XCircle, Lock, Unlock, AlertTriangle, ChevronDown, ChevronUp, Search, RefreshCw, FlaskConical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PendingPhoto {
  id: string;
  photo_url: string;
  caption: string;
  profile_id: string;
  created_at: string;
  profile: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

interface ProfileRow {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  is_locked: boolean;
  lock_reason: string;
  membership_tier: string;
  can_see_test_profiles: boolean;
  created_at: string;
  gender: string;
}

type AdminTab = 'photos' | 'profiles';

export function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('photos');
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [lockModalProfileId, setLockModalProfileId] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [profileSearch, setProfileSearch] = useState('');
  const [expandedRejection, setExpandedRejection] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, locked: 0, total: 0 });

  const fetchPendingPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    const { data } = await supabase
      .from('dating_photos')
      .select('*, profile:dating_profiles(display_name, username, avatar_url)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true });
    setPendingPhotos((data as PendingPhoto[]) ?? []);
    setLoadingPhotos(false);
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    const { data } = await supabase
      .from('dating_profiles')
      .select('id, display_name, username, avatar_url, is_locked, lock_reason, membership_tier, can_see_test_profiles, created_at, gender')
      .order('created_at', { ascending: false });
    setProfiles((data as ProfileRow[]) ?? []);
    setLoadingProfiles(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const [{ count: pending }, { count: locked }, { count: total }] = await Promise.all([
      supabase.from('dating_photos').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      supabase.from('dating_profiles').select('*', { count: 'exact', head: true }).eq('is_locked', true),
      supabase.from('dating_profiles').select('*', { count: 'exact', head: true }),
    ]);
    setStats({ pending: pending ?? 0, locked: locked ?? 0, total: total ?? 0 });
  }, []);

  useEffect(() => {
    fetchPendingPhotos();
    fetchProfiles();
    fetchStats();
  }, [fetchPendingPhotos, fetchProfiles, fetchStats]);

  const approvePhoto = async (photoId: string) => {
    setProcessingId(photoId);
    await supabase
      .from('dating_photos')
      .update({ approval_status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq('id', photoId);
    setPendingPhotos(p => p.filter(x => x.id !== photoId));
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }));
    setProcessingId(null);
  };

  const rejectPhoto = async (photoId: string) => {
    const reason = rejectionReasons[photoId] ?? '';
    setProcessingId(photoId);
    await supabase
      .from('dating_photos')
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', photoId);
    setPendingPhotos(p => p.filter(x => x.id !== photoId));
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }));
    setProcessingId(null);
    setExpandedRejection(null);
  };

  const toggleLock = async (profile: ProfileRow) => {
    if (profile.is_locked) {
      setProcessingId(profile.id);
      await supabase
        .from('dating_profiles')
        .update({ is_locked: false, lock_reason: '', locked_by: null, locked_at: null })
        .eq('id', profile.id);
      setProfiles(p => p.map(x => x.id === profile.id ? { ...x, is_locked: false, lock_reason: '' } : x));
      setStats(s => ({ ...s, locked: Math.max(0, s.locked - 1) }));
      setProcessingId(null);
    } else {
      setLockModalProfileId(profile.id);
      setLockReason('');
    }
  };

  const confirmLock = async () => {
    if (!lockModalProfileId) return;
    setProcessingId(lockModalProfileId);
    await supabase
      .from('dating_profiles')
      .update({
        is_locked: true,
        lock_reason: lockReason,
        locked_by: user!.id,
        locked_at: new Date().toISOString(),
      })
      .eq('id', lockModalProfileId);
    setProfiles(p => p.map(x => x.id === lockModalProfileId ? { ...x, is_locked: true, lock_reason: lockReason } : x));
    setStats(s => ({ ...s, locked: s.locked + 1 }));
    setLockModalProfileId(null);
    setLockReason('');
    setProcessingId(null);
  };

  const toggleTestProfileAccess = async (profile: ProfileRow) => {
    const newValue = !profile.can_see_test_profiles;
    setProcessingId(profile.id);
    await supabase
      .from('dating_profiles')
      .update({ can_see_test_profiles: newValue })
      .eq('id', profile.id);
    setProfiles(p => p.map(x => x.id === profile.id ? { ...x, can_see_test_profiles: newValue } : x));
    setProcessingId(null);
  };

  const filteredProfiles = profiles.filter(p =>
    p.display_name.toLowerCase().includes(profileSearch.toLowerCase()) ||
    p.username.toLowerCase().includes(profileSearch.toLowerCase())
  );

  const tierBadge = (tier: string) => {
    if (tier === 'premium') return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">Premium</span>;
    if (tier === 'basic') return <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded-full border border-sky-500/30">Basic</span>;
    return <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full border border-gray-600">Gratis</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-pink-700 flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Adminpanel</h1>
          <p className="text-gray-400 text-sm">Administrer indhold og brugere</p>
        </div>
        <button
          onClick={() => { fetchPendingPhotos(); fetchProfiles(); fetchStats(); }}
          className="ml-auto flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Opdater
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Afventende billeder" value={stats.pending} color="amber" />
        <StatCard label="Låste profiler" value={stats.locked} color="rose" />
        <StatCard label="Profiler i alt" value={stats.total} color="emerald" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 w-fit">
        <TabBtn active={tab === 'photos'} onClick={() => setTab('photos')} icon={<Image size={16} />} label="Billedgodkendelse" badge={stats.pending} />
        <TabBtn active={tab === 'profiles'} onClick={() => setTab('profiles')} icon={<Users size={16} />} label="Profiler" />
      </div>

      {/* Photos tab */}
      {tab === 'photos' && (
        <div>
          {loadingPhotos ? (
            <LoadingState />
          ) : pendingPhotos.length === 0 ? (
            <EmptyState icon={<CheckCircle size={40} className="text-emerald-500" />} title="Ingen afventende billeder" subtitle="Alle indsendte billeder er godkendt" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPhotos.map(photo => (
                <div key={photo.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="relative aspect-square">
                    <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2">
                        {photo.profile.avatar_url ? (
                          <img src={photo.profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-white/30" />
                        ) : null}
                        <div>
                          <p className="text-white text-xs font-medium leading-tight">{photo.profile.display_name}</p>
                          <p className="text-gray-400 text-[10px]">@{photo.profile.username}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {photo.caption && (
                    <div className="px-4 py-2 text-gray-400 text-xs italic border-b border-gray-800">"{photo.caption}"</div>
                  )}
                  <div className="p-3 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => approvePhoto(photo.id)}
                        disabled={processingId === photo.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <CheckCircle size={14} />
                        Godkend
                      </button>
                      <button
                        onClick={() => setExpandedRejection(expandedRejection === photo.id ? null : photo.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <XCircle size={14} />
                        Afvis
                        {expandedRejection === photo.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                    {expandedRejection === photo.id && (
                      <div className="space-y-2">
                        <textarea
                          value={rejectionReasons[photo.id] ?? ''}
                          onChange={e => setRejectionReasons(r => ({ ...r, [photo.id]: e.target.value }))}
                          placeholder="Årsag til afvisning (valgfrit)..."
                          rows={2}
                          className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-rose-500"
                        />
                        <button
                          onClick={() => rejectPhoto(photo.id)}
                          disabled={processingId === photo.id}
                          className="w-full py-1.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Bekræft afvisning
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profiles tab */}
      {tab === 'profiles' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Søg profiler..."
              value={profileSearch}
              onChange={e => setProfileSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-rose-500"
            />
          </div>
          {loadingProfiles ? (
            <LoadingState />
          ) : (
            <div className="space-y-2">
              {filteredProfiles.map(profile => (
                <div
                  key={profile.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    profile.is_locked
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Users size={16} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium truncate">{profile.display_name}</span>
                      {tierBadge(profile.membership_tier)}
                      {profile.can_see_test_profiles && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded-full border border-sky-500/30">
                          <FlaskConical size={10} />
                          Testadgang
                        </span>
                      )}
                      {profile.is_locked && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded-full border border-rose-500/30">
                          <Lock size={10} />
                          Låst
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs truncate">@{profile.username}</p>
                    {profile.is_locked && profile.lock_reason && (
                      <p className="text-rose-400/70 text-xs mt-0.5 truncate">Årsag: {profile.lock_reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleTestProfileAccess(profile)}
                    disabled={processingId === profile.id}
                    title={profile.can_see_test_profiles ? 'Fjern adgang til testprofiler' : 'Giv adgang til testprofiler'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      profile.can_see_test_profiles
                        ? 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-600/30'
                        : 'bg-gray-700/40 hover:bg-gray-700/60 text-gray-500 hover:text-gray-300 border border-gray-700'
                    }`}
                  >
                    <FlaskConical size={12} />
                    {profile.can_see_test_profiles ? 'Test: Til' : 'Test: Fra'}
                  </button>
                  <button
                    onClick={() => toggleLock(profile)}
                    disabled={processingId === profile.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      profile.is_locked
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30'
                        : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/30'
                    }`}
                  >
                    {profile.is_locked ? <Unlock size={12} /> : <Lock size={12} />}
                    {profile.is_locked ? 'Lås op' : 'Lås'}
                  </button>
                </div>
              ))}
              {filteredProfiles.length === 0 && (
                <EmptyState icon={<Search size={32} className="text-gray-600" />} title="Ingen profiler fundet" subtitle="Prøv en anden søgning" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Lock confirmation modal */}
      {lockModalProfileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Lås profil</h3>
                <p className="text-gray-400 text-sm">Brugeren vil ikke kunne logge ind</p>
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Årsag til låsning</label>
              <textarea
                value={lockReason}
                onChange={e => setLockReason(e.target.value)}
                placeholder="Beskriv årsagen til at profilen låses..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setLockModalProfileId(null); setLockReason(''); }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={confirmLock}
                disabled={processingId === lockModalProfileId}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Lås profil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'amber' | 'rose' | 'emerald' }) {
  const colors = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };
  return (
    <div className={`${colors[color]} border rounded-xl p-4`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80 mt-0.5">{label}</p>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] h-[18px] bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon}
      <p className="text-white font-medium">{title}</p>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
  );
}
