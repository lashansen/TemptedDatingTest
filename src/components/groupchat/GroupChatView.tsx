import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, Send, User, Users, MapPin, Calendar, Loader2, Crown, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';
import { GroupMessage, GroupRoomMember, DatingProfile } from '../../lib/types';
import { CouplePhoto } from '../profile/CouplePhoto';

interface GroupChatViewProps {
  roomId: string;
  roomName: string;
}

export function GroupChatView({ roomId, roomName }: GroupChatViewProps) {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupRoomMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [showMembersPanel, setShowMembersPanel] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    const { data } = await supabase
      .from('group_messages')
      .select('*, sender:dating_profiles(id, display_name, username, avatar_url, avatar_url_2, profile_type, age, living_area, membership_tier)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
    setLoadingMessages(false);
  }, [roomId]);

  const loadMembers = useCallback(async () => {
    if (!roomId) return;
    const { data } = await supabase
      .from('group_room_members')
      .select('*, profile:dating_profiles(id, display_name, username, avatar_url, avatar_url_2, profile_type, age, living_area, membership_tier)')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });
    setMembers(data ?? []);
  }, [roomId]);

  useEffect(() => {
    loadMessages();
    loadMembers();
  }, [loadMessages, loadMembers]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`group-room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const newMsg = payload.new as GroupMessage;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          supabase
            .from('group_messages')
            .select('*, sender:dating_profiles(id, display_name, username, avatar_url, avatar_url_2, profile_type, age, living_area, membership_tier)')
            .eq('id', newMsg.id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                setMessages(current => current.map(m => m.id === data.id ? data : m));
              }
            });
          return [...prev, newMsg];
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_room_members',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        loadMembers();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, loadMembers]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('message-images').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('message-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || sending) return;
    if (!newMessage.trim() && !imageFile) return;
    setSending(true);
    try {
      let uploadedUrl: string | null = null;
      if (imageFile) {
        uploadedUrl = await uploadImage(imageFile);
      }
      await supabase.from('group_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content: newMessage.trim(),
        image_url: uploadedUrl,
      });
      await supabase
        .from('group_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);
      setNewMessage('');
      clearImage();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <button
            onClick={() => navigate('group-rooms')}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-base truncate">{roomName}</h2>
            <p className="text-gray-500 text-xs">{members.length} deltagere</p>
          </div>
          <button
            onClick={() => setShowMembersPanel(v => !v)}
            className={`p-2 rounded-xl transition-colors ${showMembersPanel ? 'bg-rose-600/20 text-rose-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0 pr-1">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-gray-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-3">
                <Send size={24} className="text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">Ingen beskeder endnu</p>
              <p className="text-gray-600 text-xs mt-1">Vaer den forste til at sige hej!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender_id === user?.id;
              const sender = msg.sender as DatingProfile | undefined;
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showSenderInfo = !isMe && (prevMsg?.sender_id !== msg.sender_id);

              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <div className="flex-shrink-0 self-end">
                      <button
                        onClick={() => navigate('view-profile', { profileId: msg.sender_id })}
                        className="block"
                      >
                        <AvatarSmall profile={sender} />
                      </button>
                    </div>
                  )}
                  <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showSenderInfo && (
                      <button
                        onClick={() => navigate('view-profile', { profileId: msg.sender_id })}
                        className="text-xs text-gray-500 hover:text-gray-300 mb-1 transition-colors"
                      >
                        {sender?.display_name || sender?.username || 'Ukendt'}
                      </button>
                    )}
                    <div className={`rounded-2xl text-sm overflow-hidden ${
                      isMe
                        ? 'bg-gradient-to-br from-rose-600 to-pink-700 text-white rounded-br-sm'
                        : 'bg-gray-800 text-gray-200 border border-gray-700/60 rounded-bl-sm'
                    }`}>
                      {msg.image_url && (
                        <button onClick={() => setLightboxUrl(msg.image_url!)} className="block w-full">
                          <img
                            src={msg.image_url}
                            alt="Attached image"
                            className="w-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                            style={{ maxHeight: '220px', maxWidth: '280px' }}
                          />
                        </button>
                      )}
                      {msg.content && (
                        <p className="px-4 py-2.5 leading-relaxed break-words">{msg.content}</p>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1 px-1">{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {imagePreview && (
          <div className="relative inline-block mb-2 mt-1">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-700" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex gap-2 pt-3 border-t border-gray-800 flex-shrink-0 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-rose-400 p-3 rounded-2xl hover:bg-white/5 transition-colors flex-shrink-0"
            title="Attach image"
          >
            <ImageIcon size={18} />
          </button>
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv en besked... (Enter for at sende)"
            rows={1}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors text-sm resize-none"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !imageFile) || sending}
            className="bg-gradient-to-br from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 text-white p-3 rounded-2xl transition-all flex-shrink-0 self-end"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {showMembersPanel && (
        <aside className="w-56 flex-shrink-0 flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Users size={15} className="text-rose-400" />
              Deltagere
              <span className="ml-auto text-gray-500 text-xs font-normal">{members.length}</span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {members.map(member => {
              const p = member.profile as DatingProfile | undefined;
              return (
                <button
                  key={member.id}
                  onClick={() => navigate('view-profile', { profileId: member.profile_id })}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/5 transition-colors border-b border-gray-800/50 last:border-0 text-left"
                >
                  <div className="flex-shrink-0">
                    <AvatarSmall profile={p} size={36} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-white text-xs font-medium truncate">
                        {p?.display_name || p?.username || 'Ukendt'}
                      </p>
                      {p?.membership_tier === 'premium' && (
                        <Crown size={10} className="text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {p?.age && (
                        <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                          <Calendar size={9} />
                          {p.age} ar
                        </span>
                      )}
                      {p?.living_area && (
                        <span className="flex items-center gap-1 text-gray-500 text-[10px] truncate">
                          <MapPin size={9} className="flex-shrink-0" />
                          <span className="truncate">{p.living_area}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function AvatarSmall({ profile, size = 32 }: { profile?: DatingProfile; size?: number }) {
  if (!profile) {
    return (
      <div
        className="rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <User size={size * 0.45} className="text-gray-400" />
      </div>
    );
  }
  if (profile.profile_type === 'couple' && profile.avatar_url_2) {
    return <CouplePhoto url1={profile.avatar_url} url2={profile.avatar_url_2} size={size} />;
  }
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-rose-700 to-pink-800 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <User size={size * 0.45} className="text-white" />
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'I gar';
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
}
