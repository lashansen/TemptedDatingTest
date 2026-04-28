import React, { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Eye, Search, Home, User, LogOut, Heart, Shield, Crown, Gift, Settings, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';
import { CouplePhoto } from '../profile/CouplePhoto';

export function Sidebar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { navigate, page } = useNavigation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newVisitors, setNewVisitors] = useState(0);

  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const { data: convData } = await supabase
        .from('dating_conversations')
        .select('id')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      const convIds = convData?.map(c => c.id) ?? [];
      if (convIds.length === 0) { setUnreadMessages(0); return; }
      const { count } = await supabase
        .from('dating_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .in('conversation_id', convIds);
      setUnreadMessages(count ?? 0);
    } catch {
      setUnreadMessages(0);
    }
  }, [user]);

  const fetchNewVisitors = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const { data } = await supabase
        .from('dating_profile_visits')
        .select('visitor_id')
        .eq('visited_id', user.id)
        .gt('visited_at', profile.last_visitor_check);
      const unique = new Set((data || []).map((r: any) => r.visitor_id));
      setNewVisitors(unique.size);
    } catch {
      setNewVisitors(0);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user) {
      fetchUnreadMessages();
      fetchNewVisitors();
      const interval = setInterval(() => {
        fetchUnreadMessages();
        fetchNewVisitors();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadMessages, fetchNewVisitors]);

  const handleVisitorsClick = async () => {
    if (!user) return;
    await supabase
      .from('dating_profiles')
      .update({ last_visitor_check: new Date().toISOString() })
      .eq('id', user.id);
    setNewVisitors(0);
    navigate('visitors');
  };

  if (!user) return null;

  const displayName = profile?.display_name || profile?.username || '';
  const username = profile?.username || '';

  return (
    <aside className="fixed top-0 right-0 h-full w-64 bg-gray-950/95 backdrop-blur-md border-l border-rose-900/20 flex flex-col z-40 shadow-2xl">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800/60">
        <button onClick={() => navigate('home')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart size={15} className="text-white fill-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">Tempted</span>
        </button>
      </div>

      <div className="px-4 py-4 border-b border-gray-800/60">
        <button
          onClick={() => navigate('profile')}
          className="flex items-center gap-3 w-full group"
        >
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-rose-500/40 group-hover:ring-rose-500/80 transition-all flex-shrink-0">
            {profile?.profile_type === 'couple' && profile.avatar_url_2 ? (
              <CouplePhoto url1={profile.avatar_url} url2={profile.avatar_url_2} size={44} />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-700 to-pink-800 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-semibold text-sm truncate">{displayName}</p>
              {profile?.membership_tier === 'premium' && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
              {profile?.membership_tier === 'basic' && <Crown size={12} className="text-sky-400 flex-shrink-0" />}
            </div>
            <p className="text-gray-500 text-xs truncate">@{username}</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <SideNavItem
          icon={<Home size={18} />}
          label="Forside"
          active={page === 'home'}
          onClick={() => navigate('home')}
        />
        <SideNavItem
          icon={<Search size={18} />}
          label="Søg"
          active={page === 'search'}
          onClick={() => navigate('search')}
        />
        <SideNavItem
          icon={<MessageCircle size={18} />}
          label="Beskeder"
          active={page === 'messages' || page === 'conversation'}
          onClick={() => navigate('messages')}
          badge={unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : String(unreadMessages)) : undefined}
          badgeColor="bg-rose-500"
        />
        <SideNavItem
          icon={<Eye size={18} />}
          label="Besøgende"
          active={page === 'visitors'}
          onClick={handleVisitorsClick}
          badge={newVisitors > 0 ? (newVisitors > 99 ? '99+' : String(newVisitors)) : undefined}
          badgeColor="bg-amber-500"
        />
        <SideNavItem
          icon={<MessagesSquare size={18} />}
          label="Grupperum"
          active={page === 'group-rooms' || page === 'group-chat'}
          onClick={() => navigate('group-rooms')}
        />

        <div className="pt-3 pb-1">
          <p className="text-gray-600 text-xs font-medium uppercase tracking-wider px-3">Konto</p>
        </div>

        <SideNavItem
          icon={<User size={18} />}
          label="Min profil"
          active={page === 'profile'}
          onClick={() => navigate('profile')}
        />
        <SideNavItem
          icon={<Settings size={18} />}
          label="Rediger profil"
          active={page === 'edit-profile'}
          onClick={() => navigate('edit-profile')}
        />
        <SideNavItem
          icon={<Crown size={18} />}
          label="Membership"
          active={page === 'subscription'}
          onClick={() => navigate('subscription')}
          highlight="amber"
        />
        <SideNavItem
          icon={<Gift size={18} />}
          label="Gavemembership"
          active={page === 'gift-membership'}
          onClick={() => navigate('gift-membership')}
          highlight="pink"
        />

        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-gray-600 text-xs font-medium uppercase tracking-wider px-3">Admin</p>
            </div>
            <SideNavItem
              icon={<Shield size={18} />}
              label="Adminpanel"
              active={page === 'admin'}
              onClick={() => navigate('admin')}
              highlight="rose"
            />
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800/60">
        <button
          onClick={async () => { await signOut(); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm"
        >
          <LogOut size={18} />
          Log ud
        </button>
      </div>
    </aside>
  );
}

interface SideNavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
  badgeColor?: string;
  highlight?: 'amber' | 'pink' | 'rose';
}

function SideNavItem({ icon, label, active, onClick, badge, badgeColor = 'bg-rose-500', highlight }: SideNavItemProps) {
  const highlightColors = {
    amber: active ? 'bg-amber-600/20 text-amber-300' : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/30',
    pink: active ? 'bg-pink-600/20 text-pink-300' : 'text-pink-400/80 hover:text-pink-300 hover:bg-pink-950/30',
    rose: active ? 'bg-rose-600/20 text-rose-300' : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/30',
  };

  const colorClass = highlight
    ? highlightColors[highlight]
    : active
      ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
      : 'text-gray-400 hover:text-white hover:bg-white/5';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative ${colorClass}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className={`${badgeColor} text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5`}>
          {badge}
        </span>
      )}
    </button>
  );
}
