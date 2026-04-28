import React, { useEffect, useState } from 'react';
import { Eye, User, MapPin, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';
import { DatingProfileVisit, DatingProfile } from '../../lib/types';
import { CouplePhoto } from '../profile/CouplePhoto';

export function VisitorsPage() {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [visits, setVisits] = useState<(DatingProfileVisit & { visitor: DatingProfile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('dating_profile_visits')
        .select('*, visitor:visitor_id(id, username, display_name, avatar_url, avatar_url_2, profile_type, age, living_area)')
        .eq('visited_id', user.id)
        .order('visited_at', { ascending: false })
        .limit(500);
      const seen = new Set<string>();
      const unique = ((data as any) || []).filter((v: any) => {
        if (seen.has(v.visitor_id)) return false;
        seen.add(v.visitor_id);
        return true;
      });
      setVisits(unique);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('home')} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">Profile Visitors</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}
        </div>
      ) : visits.length === 0 ? (
        <div className="text-center py-16">
          <Eye size={48} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No visitors yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visits.map(visit => {
            const p = visit.visitor;
            const isCoupleWithBoth = p?.profile_type === 'couple' && p.avatar_url && p.avatar_url_2;
            return (
              <button
                key={visit.id}
                onClick={() => navigate('view-profile', { profileId: p.id })}
                className="w-full flex items-center gap-4 bg-gray-900 hover:bg-gray-800 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  {isCoupleWithBoth ? (
                    <CouplePhoto url1={p.avatar_url} url2={p.avatar_url_2} size={48} />
                  ) : p?.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <User size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{p?.display_name || p?.username}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p?.age && <span className="text-gray-500 text-xs">{p.age}</span>}
                    {p?.living_area && (
                      <span className="flex items-center gap-0.5 text-gray-500 text-xs">
                        <MapPin size={10} />{p.living_area}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-gray-600 text-xs flex-shrink-0">{formatTime(visit.visited_at)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
