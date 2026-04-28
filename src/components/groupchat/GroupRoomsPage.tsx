import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Users, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';
import { GroupRoom } from '../../lib/types';

export function GroupRoomsPage() {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [rooms, setRooms] = useState<GroupRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: roomsData } = await supabase
        .from('group_rooms')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (!roomsData) { setLoading(false); return; }

      const enriched = await Promise.all(roomsData.map(async (room) => {
        const { count: memberCount } = await supabase
          .from('group_room_members')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id);

        const { data: memberCheck } = await supabase
          .from('group_room_members')
          .select('id')
          .eq('room_id', room.id)
          .eq('profile_id', user.id)
          .maybeSingle();

        const { data: lastMsg } = await supabase
          .from('group_messages')
          .select('*, sender:dating_profiles(display_name, username)')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...room,
          member_count: memberCount ?? 0,
          is_member: !!memberCheck,
          last_message: lastMsg ?? null,
        };
      }));

      setRooms(enriched);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const handleJoin = async (room: GroupRoom) => {
    if (!user) return;
    setJoiningId(room.id);
    try {
      if (!room.is_member) {
        await supabase.from('group_room_members').insert({
          room_id: room.id,
          profile_id: user.id,
        });
      }
      navigate('group-chat', { roomId: room.id, roomName: room.name });
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Grupperum</h1>
        <p className="text-gray-500 text-sm">Deltag i en live samtale med flere profiler pa en gang</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-gray-900 rounded-2xl animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={handleJoin}
              isJoining={joiningId === room.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoomCard({ room, onJoin, isJoining }: { room: GroupRoom; onJoin: (r: GroupRoom) => void; isJoining: boolean }) {
  const lastSenderName = (room.last_message?.sender as any)?.display_name
    || (room.last_message?.sender as any)?.username
    || 'Ukendt';

  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600/30 to-pink-800/30 border border-rose-800/30 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={22} className="text-rose-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-white font-semibold text-base">{room.name}</h3>
            {room.is_member && (
              <span className="text-[10px] font-semibold bg-rose-600/20 text-rose-400 border border-rose-600/30 rounded-full px-2 py-0.5 flex-shrink-0">
                Deltager
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-3 leading-snug">{room.description}</p>

          {room.last_message && (
            <p className="text-gray-600 text-xs truncate mb-3">
              <span className="text-gray-500">{lastSenderName}:</span> {room.last_message.content}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {room.member_count} {room.member_count === 1 ? 'deltager' : 'deltagere'}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatTime(room.last_message_at)}
              </span>
            </div>

            <button
              onClick={() => onJoin(room)}
              disabled={isJoining}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              {isJoining ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  {room.is_member ? 'Ga ind' : 'Deltag'}
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Lige nu';
  if (diffMin < 60) return `${diffMin} min siden`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} t siden`;
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
}
