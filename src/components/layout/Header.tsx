import React, { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Eye, Search, Home, User, LogOut, Heart, Shield, Crown, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';
import { CouplePhoto } from '../profile/CouplePhoto';

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { navigate, page } = useNavigation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newVisitors, setNewVisitors] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleMessagesClick = () => {
    navigate('messages');
  };

  const handleVisitorsClick = async () => {
    if (!user) return;
    await supabase
      .from('dating_profiles')
      .update({ last_visitor_check: new Date().toISOString() })
      .eq('id', user.id);
    setNewVisitors(0);
    navigate('visitors');
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-rose-900/30 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart size={16} className="text-white fill-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide hidden sm:block">
            Tempted
          </span>
        </button>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavBtn
            icon={<Home size={20} />}
            label="Home"
            active={page === 'home'}
            onClick={() => navigate('home')}
          />
          <NavBtn
            icon={<Search size={20} />}
            label="Search"
            active={page === 'search'}
            onClick={() => navigate('search')}
          />

          <button
            onClick={handleMessagesClick}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
              page === 'messages'
                ? 'bg-rose-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Messages"
          >
            <MessageCircle size={20} />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </button>

          <button
            onClick={handleVisitorsClick}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
              page === 'visitors'
                ? 'bg-rose-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Profile Visitors"
          >
            <Eye size={20} />
            {newVisitors > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                {newVisitors > 99 ? '99+' : newVisitors}
              </span>
            )}
          </button>

          <div className="relative ml-1">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-rose-500/50 hover:ring-rose-500 transition-all">
                {profile?.profile_type === 'couple' && profile.avatar_url_2 ? (
                  <CouplePhoto url1={profile.avatar_url} url2={profile.avatar_url_2} size={36} />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-700 to-pink-800 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-52 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm truncate">{profile?.display_name || profile?.username}</p>
                    {profile?.membership_tier === 'premium' && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
                    {profile?.membership_tier === 'basic' && <Crown size={12} className="text-sky-400 flex-shrink-0" />}
                  </div>
                  <p className="text-gray-500 text-xs truncate">{profile?.username}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); navigate('profile'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm"
                >
                  <User size={16} />
                  Min profil
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('edit-profile'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm"
                >
                  <User size={16} />
                  Rediger profil
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('subscription'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-amber-400 hover:text-amber-300 hover:bg-amber-950/20 transition-colors text-sm"
                >
                  <Crown size={16} />
                  Membership
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('gift-membership'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-pink-400 hover:text-pink-300 hover:bg-pink-950/20 transition-colors text-sm"
                >
                  <Gift size={16} />
                  Gavemembership
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { setMenuOpen(false); navigate('admin'); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors text-sm border-t border-gray-800"
                  >
                    <Shield size={16} />
                    Adminpanel
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm border-t border-gray-800"
                >
                  <LogOut size={16} />
                  Log ud
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
        active ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );
}
