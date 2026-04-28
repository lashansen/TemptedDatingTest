import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Send, ChevronLeft, User, MessageCircle, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';
import { DatingConversation, DatingMessage, DatingProfile } from '../../lib/types';
import { CouplePhoto } from '../profile/CouplePhoto';

export function MessagesPage() {
  const { user } = useAuth();
  const { pageParams, navigate } = useNavigation();
  const [conversations, setConversations] = useState<DatingConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(pageParams.conversationId ?? null);
  const [activeOtherProfileId, setActiveOtherProfileId] = useState<string | null>(pageParams.otherProfileId ?? null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('dating_conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false });
    if (!data) { setLoading(false); return; }

    const convWithProfiles = await Promise.all(data.map(async (conv) => {
      const otherId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
      const { data: otherProf } = await supabase.from('dating_profiles').select('*').eq('id', otherId).maybeSingle();
      const { data: lastMsg } = await supabase.from('dating_messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      const { count: unreadCount } = await supabase
        .from('dating_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .neq('sender_id', user.id);
      return { ...conv, other_profile: otherProf, last_message: lastMsg, unread_count: unreadCount ?? 0 };
    }));
    setConversations(convWithProfiles);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (pageParams.conversationId) {
      setActiveConvId(pageParams.conversationId);
      setActiveOtherProfileId(pageParams.otherProfileId ?? null);
    }
  }, [pageParams.conversationId, pageParams.otherProfileId]);

  const openConversation = (conv: DatingConversation) => {
    setActiveConvId(conv.id);
    setActiveOtherProfileId(conv.other_profile?.id ?? null);
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
    );
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  return (
    <div className="flex gap-0 h-[calc(100vh-5rem)] max-w-6xl mx-auto">
      <aside className={`flex-shrink-0 flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden transition-all ${activeConvId ? 'w-72' : 'w-full max-w-2xl mx-auto'}`}>
        <div className="px-4 py-3.5 border-b border-gray-800 flex items-center gap-2 flex-shrink-0">
          <MessageCircle size={16} className="text-rose-400" />
          <h2 className="text-white font-semibold text-sm">Messages</h2>
          {totalUnread > 0 && (
            <span className="ml-auto min-w-[20px] h-5 bg-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <MessageCircle size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-600 text-xs mt-1">Visit a profile and send a message to start chatting</p>
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConvId}
                compact={!!activeConvId}
                onClick={() => openConversation(conv)}
              />
            ))
          )}
        </div>
      </aside>

      {activeConvId && activeOtherProfileId && (
        <div className="flex-1 min-w-0 ml-3">
          <ConversationView
            key={activeConvId}
            conversationId={activeConvId}
            otherProfileId={activeOtherProfileId}
            onBack={() => {
              setActiveConvId(null);
              setActiveOtherProfileId(null);
              navigate('messages');
            }}
            onRefresh={loadConversations}
            onNavigateProfile={(id) => navigate('view-profile', { profileId: id })}
          />
        </div>
      )}

      {!activeConvId && conversations.length > 0 && (
        <div className="hidden md:flex flex-1 items-center justify-center text-center ml-3">
          <div>
            <MessageCircle size={48} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationItem({ conversation, isActive, compact, onClick }: {
  conversation: DatingConversation;
  isActive: boolean;
  compact: boolean;
  onClick: () => void;
}) {
  const p = conversation.other_profile;
  const hasUnread = (conversation.unread_count ?? 0) > 0;
  const lastMsg = conversation.last_message;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 border-b border-gray-800/60 last:border-0 transition-all text-left ${isActive ? 'bg-rose-600/10 border-l-2 border-l-rose-500' : 'hover:bg-white/5'}`}
      >
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {p?.profile_type === 'couple' && p.avatar_url_2 ? (
              <CouplePhoto url1={p.avatar_url} url2={p.avatar_url_2} size={40} />
            ) : p?.avatar_url ? (
              <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <User size={16} className="text-gray-400" />
              </div>
            )}
          </div>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
              {conversation.unread_count}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${isActive ? 'text-rose-300' : hasUnread ? 'text-white' : 'text-gray-300'}`}>
            {p?.display_name || p?.username || 'Unknown'}
          </p>
          <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? 'text-gray-400' : 'text-gray-600'}`}>
            {lastMsg?.content || (lastMsg?.image_url ? 'Photo' : '')}
          </p>
        </div>
        {lastMsg && (
          <span className="text-[10px] text-gray-600 flex-shrink-0 self-start mt-0.5">
            {formatTime(lastMsg.created_at)}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 border-b border-gray-800/60 last:border-0 hover:bg-white/5 transition-all text-left"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
        {p?.profile_type === 'couple' && p.avatar_url_2 ? (
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
        <div className="flex items-center justify-between mb-0.5">
          <span className={`font-medium text-sm ${hasUnread ? 'text-white' : 'text-gray-300'}`}>
            {p?.display_name || p?.username || 'Unknown'}
          </span>
          {lastMsg && (
            <span className="text-gray-600 text-xs flex-shrink-0">{formatTime(lastMsg.created_at)}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-xs truncate flex items-center gap-1 ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
            {lastMsg?.image_url && !lastMsg?.content && <ImageIcon size={11} className="flex-shrink-0" />}
            {lastMsg?.content || (lastMsg?.image_url ? 'Photo' : 'No messages yet')}
          </p>
          {hasUnread && (
            <span className="ml-2 min-w-[20px] h-5 bg-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ConversationView({ conversationId, otherProfileId, onBack, onRefresh, onNavigateProfile }: {
  conversationId: string;
  otherProfileId: string;
  onBack: () => void;
  onRefresh: () => void;
  onNavigateProfile: (id: string) => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DatingMessage[]>([]);
  const [otherProfile, setOtherProfile] = useState<DatingProfile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !user) return;
    const { data } = await supabase
      .from('dating_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages(data || []);

    await supabase
      .from('dating_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id);
    onRefresh();
  }, [conversationId, user, onRefresh]);

  useEffect(() => {
    if (otherProfileId) {
      supabase.from('dating_profiles').select('*').eq('id', otherProfileId).maybeSingle().then(({ data }) => setOtherProfile(data));
    }
  }, [otherProfileId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dating_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as DatingMessage;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_id !== user?.id) {
          supabase
            .from('dating_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user?.id ?? '');
          onRefresh();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user, onRefresh]);

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

    let uploadedUrl: string | null = null;
    if (imageFile) uploadedUrl = await uploadImage(imageFile);

    await supabase.from('dating_messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(),
      image_url: uploadedUrl,
    });
    await supabase.from('dating_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
    setNewMessage('');
    clearImage();
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800 flex-shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors md:hidden">
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => otherProfile && onNavigateProfile(otherProfile.id)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            {otherProfile?.profile_type === 'couple' && otherProfile.avatar_url_2 ? (
              <CouplePhoto url1={otherProfile.avatar_url} url2={otherProfile.avatar_url_2} size={36} />
            ) : otherProfile?.avatar_url ? (
              <img src={otherProfile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <User size={16} className="text-gray-400" />
              </div>
            )}
          </div>
          <div className="text-left">
            <h2 className="text-white font-semibold text-sm leading-tight">{otherProfile?.display_name || otherProfile?.username}</h2>
            {otherProfile?.living_area && <p className="text-gray-500 text-xs">{otherProfile.living_area}</p>}
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0">
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl text-sm overflow-hidden ${isMe ? 'bg-gradient-to-br from-rose-600 to-pink-700 text-white rounded-br-sm' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'}`}>
                {msg.image_url && (
                  <button onClick={() => setLightboxUrl(msg.image_url!)} className="block w-full">
                    <img
                      src={msg.image_url}
                      alt="Attached image"
                      className="w-full max-w-xs object-cover rounded-t-2xl hover:opacity-90 transition-opacity cursor-zoom-in"
                      style={{ maxHeight: '240px' }}
                    />
                  </button>
                )}
                {msg.content && (
                  <div className="px-4 py-2.5">
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                )}
                <div className={`px-4 pb-2 ${!msg.content ? 'pt-1' : ''}`}>
                  <p className={`text-[10px] ${isMe ? 'text-rose-200/70' : 'text-gray-500'}`}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {imagePreview && (
        <div className="relative inline-block mx-4 mb-2">
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

      <form onSubmit={sendMessage} className="flex gap-2 px-4 py-3 border-t border-gray-800 items-end flex-shrink-0">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-rose-400 p-3 rounded-2xl hover:bg-white/5 transition-colors flex-shrink-0"
          title="Attach image"
        >
          <ImageIcon size={18} />
        </button>
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-950 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={(!newMessage.trim() && !imageFile) || sending}
          className="bg-gradient-to-br from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 text-white p-3 rounded-2xl transition-all flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </form>

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

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
