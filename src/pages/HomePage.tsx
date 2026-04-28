import React, { useEffect, useState } from 'react';
import { MapPin, User, Users, Heart, Sparkles, Newspaper, Calendar, ChevronRight, Clock, Pin, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DatingProfile, NewsPost, CalendarEvent } from '../lib/types';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { CouplePhoto } from '../components/profile/CouplePhoto';

export function HomePage() {
  const { user, profile } = useAuth();
  const { navigate } = useNavigation();

  const [newProfiles, setNewProfiles] = useState<DatingProfile[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [profilesRes, newsRes, eventsRes] = await Promise.all([
        (() => {
          let q = supabase.from('dating_profiles').select('*').order('created_at', { ascending: false }).limit(8);
          if (user) q = q.neq('id', user.id);
          return q;
        })(),
        supabase.from('news_posts').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('events').select('*').eq('is_published', true).gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(4),
      ]);
      setNewProfiles((profilesRes.data || []).filter(p => !p.bio?.toLowerCase().startsWith('test profile!')));
      setNews((newsRes.data as NewsPost[]) ?? []);
      setEvents((eventsRes.data as CalendarEvent[]) ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Profile completion prompt */}
      {profile && !profile.bio && (
        <div className="mb-8 bg-gradient-to-r from-rose-950/60 to-pink-950/40 border border-rose-800/40 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-medium">Færdiggør din profil</p>
            <p className="text-gray-400 text-sm mt-0.5">Tilføj billeder, en bio og mere for at tiltrække bedre matches</p>
          </div>
          <button
            onClick={() => navigate('edit-profile')}
            className="flex-shrink-0 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Rediger profil
          </button>
        </div>
      )}

      {/* ── NEWS SECTION ── */}
      <section className="mb-10">
        <SectionHeader icon={<Newspaper size={18} className="text-rose-400" />} title="Nyheder" />

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-900 rounded-2xl animate-pulse border border-gray-800" />)}
          </div>
        ) : news.length === 0 ? (
          <EmptyCard text="Ingen nyheder endnu" />
        ) : (
          <div className="space-y-3">
            {/* Featured first post */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {news[0].image_url && (
                <img src={news[0].image_url} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1.5">
                  <Pin size={11} className="text-rose-500" />
                  {formatDate(news[0].created_at)}
                </p>
                <h2 className="text-white font-bold text-lg leading-snug mb-2">{news[0].title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{news[0].body}</p>
              </div>
            </div>

            {/* Remaining posts as compact rows */}
            {news.slice(1).map(post => (
              <div key={post.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 transition-colors flex gap-4">
                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-gray-600 text-xs mb-0.5">{formatDate(post.created_at)}</p>
                  <h3 className="text-white font-semibold text-sm leading-snug mb-1">{post.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{post.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── NEW PROFILES SECTION ── */}
      <section className="mb-10">
        <SectionHeader
          icon={<Sparkles size={18} className="text-rose-400" />}
          title="Nye profiler"
          action={<button onClick={() => navigate('search')} className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs font-medium transition-colors">Se alle <ChevronRight size={13} /></button>}
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-900 rounded-xl animate-pulse border border-gray-800" />
            ))}
          </div>
        ) : newProfiles.length === 0 ? (
          <EmptyCard text="Ingen nye profiler endnu" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {newProfiles.map(p => (
              <ProfileCard key={p.id} profile={p} onClick={() => navigate('view-profile', { profileId: p.id })} />
            ))}
          </div>
        )}
      </section>

      {/* ── EVENTS SECTION ── */}
      <section className="mb-10">
        <SectionHeader icon={<Calendar size={18} className="text-rose-400" />} title="Kommende events" />

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2].map(i => <div key={i} className="h-32 bg-gray-900 rounded-2xl animate-pulse border border-gray-800" />)}
          </div>
        ) : events.length === 0 ? (
          <EmptyCard text="Ingen kommende events" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {events.map(ev => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER BAR ── */}
      <footer className="fixed bottom-0 left-0 right-64 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/60 z-30">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-center gap-6">
          <button
            onClick={() => navigate('terms')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            <FileText size={12} />
            Vilkår og betingelser
          </button>
          <span className="text-gray-800 text-xs">·</span>
          <span className="text-gray-700 text-xs">© {new Date().getFullYear()} Tempted</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-white font-bold text-lg">{title}</h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl py-10 text-center">
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const date = new Date(event.event_date);
  const day = date.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' });
  const time = date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl overflow-hidden transition-colors flex gap-0">
      {/* Date badge column */}
      <div className="w-16 flex-shrink-0 bg-rose-600/10 border-r border-rose-900/30 flex flex-col items-center justify-center p-3 gap-0.5">
        <span className="text-rose-400 font-bold text-xl leading-none">{date.getDate()}</span>
        <span className="text-rose-400/70 text-[10px] uppercase tracking-wide">
          {date.toLocaleDateString('da-DK', { month: 'short' })}
        </span>
      </div>
      <div className="p-4 min-w-0">
        <h3 className="text-white font-semibold text-sm leading-snug mb-1.5">{event.title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-2">{event.description}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-gray-600 text-[11px]">
            <Clock size={10} />
            {day} kl. {time}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 text-gray-600 text-[11px]">
              <MapPin size={10} />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ profile, onClick }: { profile: DatingProfile; onClick: () => void }) {
  const isCoupleWithBoth = profile.profile_type === 'couple' && profile.avatar_url && profile.avatar_url_2;

  return (
    <button
      onClick={onClick}
      className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-rose-800/60 transition-all group text-left hover:shadow-xl hover:shadow-rose-950/20 hover:-translate-y-0.5"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-gray-800">
        {isCoupleWithBoth ? (
          <div className="w-full h-full flex">
            <div className="w-1/2 h-full overflow-hidden">
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" style={{ objectPosition: 'center center' }} />
            </div>
            <div className="w-1/2 h-full overflow-hidden">
              <img src={profile.avatar_url_2} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" style={{ objectPosition: 'center center' }} />
            </div>
          </div>
        ) : profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={48} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />

        {profile.profile_type === 'couple' && (
          <div className="absolute top-2.5 right-2.5 bg-rose-600/90 backdrop-blur-sm rounded-full p-1.5">
            <Users size={12} className="text-white" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-semibold text-sm leading-tight truncate">
            {profile.display_name || profile.username}
            {profile.age && <span className="text-gray-300 font-normal">, {profile.age}</span>}
          </p>
          {profile.living_area && (
            <p className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
              <MapPin size={10} />
              <span className="truncate">{profile.living_area}</span>
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
}
