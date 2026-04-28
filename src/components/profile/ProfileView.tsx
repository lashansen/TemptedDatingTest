import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Eye, Ruler, Weight, Cigarette, Activity, CreditCard as Edit, MessageCircle, ChevronLeft, Users, User, Heart, Tag as TagIcon, StickyNote, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';
import { DatingProfile, DatingPhoto, ProfileTag, ProfileNote } from '../../lib/types';
import { CouplePhoto, CouplePhotoBanner } from './CouplePhoto';
import { PhotoGallery } from '../photos/PhotoGallery';

interface ProfileViewProps {
  profileId?: string;
}

export function ProfileView({ profileId }: ProfileViewProps) {
  const { user, profile: myProfile } = useAuth();
  const { navigate } = useNavigation();
  const [profile, setProfile] = useState<DatingProfile | null>(null);
  const [photos, setPhotos] = useState<DatingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBlocked, setFilterBlocked] = useState(false);

  // Like state
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // Tags state
  const [tags, setTags] = useState<ProfileTag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Notes state
  const [note, setNote] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetId = profileId || user?.id;
  const isOwnProfile = targetId === user?.id;

  useEffect(() => {
    if (!targetId) return;
    const load = async () => {
      setLoading(true);
      const { data: prof } = await supabase.from('dating_profiles').select('*').eq('id', targetId).maybeSingle();
      setProfile(prof);

      if (!isOwnProfile && user && prof) {
        await supabase.from('dating_profile_visits').insert({
          visited_id: targetId,
          visitor_id: user.id,
        });
      }
      setLoading(false);
    };
    load();
  }, [targetId, isOwnProfile, user]);

  // Load likes, tags, notes for other profiles
  useEffect(() => {
    if (!targetId || isOwnProfile || !user) return;

    const loadSocial = async () => {
      const [{ count }, { data: myLike }, { data: myTags }, { data: myNote }] = await Promise.all([
        supabase.from('profile_likes').select('*', { count: 'exact', head: true }).eq('liked_id', targetId),
        supabase.from('profile_likes').select('id').eq('liker_id', user.id).eq('liked_id', targetId).maybeSingle(),
        supabase.from('profile_tags').select('*').eq('tagger_id', user.id).eq('tagged_id', targetId).order('created_at'),
        supabase.from('profile_notes').select('*').eq('author_id', user.id).eq('subject_id', targetId).maybeSingle(),
      ]);

      setLikeCount(count ?? 0);
      setHasLiked(!!myLike);
      setTags((myTags as ProfileTag[]) ?? []);
      if (myNote) {
        setNote((myNote as ProfileNote).content);
        setNoteId((myNote as ProfileNote).id);
      }
    };

    loadSocial();
  }, [targetId, isOwnProfile, user]);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  const checkMessageFilter = (recipient: DatingProfile, sender: DatingProfile): boolean => {
    if (!recipient.msg_filter_enabled) return false;
    if (recipient.msg_filter_min_age != null && (sender.age == null || sender.age < recipient.msg_filter_min_age)) return true;
    if (recipient.msg_filter_max_age != null && (sender.age == null || sender.age > recipient.msg_filter_max_age)) return true;
    if (recipient.msg_filter_genders?.length > 0 && sender.gender && !recipient.msg_filter_genders.includes(sender.gender)) return true;
    if (recipient.msg_filter_profile_types?.length > 0 && !recipient.msg_filter_profile_types.includes(sender.profile_type)) return true;
    if (recipient.msg_filter_living_areas?.length > 0 && sender.living_area) {
      const match = recipient.msg_filter_living_areas.some(area =>
        sender.living_area.toLowerCase().includes(area.toLowerCase()) || area.toLowerCase().includes(sender.living_area.toLowerCase())
      );
      if (!match) return true;
    }
    return false;
  };

  const startConversation = async () => {
    if (!user || !profile || !myProfile) return;
    if (checkMessageFilter(profile, myProfile)) {
      setFilterBlocked(true);
      return;
    }
    const p1 = user.id < profile.id ? user.id : profile.id;
    const p2 = user.id < profile.id ? profile.id : user.id;
    const { data: existing } = await supabase
      .from('dating_conversations')
      .select('id')
      .eq('participant_1', p1)
      .eq('participant_2', p2)
      .maybeSingle();
    if (existing) {
      navigate('conversation', { conversationId: existing.id, otherProfileId: profile.id });
    } else {
      const { data: newConv } = await supabase
        .from('dating_conversations')
        .insert({ participant_1: p1, participant_2: p2 })
        .select('id')
        .single();
      if (newConv) navigate('conversation', { conversationId: newConv.id, otherProfileId: profile.id });
    }
  };

  const toggleLike = async () => {
    if (!user || !profile || liking) return;
    setLiking(true);
    if (hasLiked) {
      await supabase.from('profile_likes').delete().eq('liker_id', user.id).eq('liked_id', profile.id);
      setHasLiked(false);
      setLikeCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from('profile_likes').insert({ liker_id: user.id, liked_id: profile.id });
      setHasLiked(true);
      setLikeCount(c => c + 1);
    }
    setLiking(false);
  };

  const addTag = async () => {
    const trimmed = newTag.trim();
    if (!trimmed || !user || !profile || addingTag) return;
    if (tags.some(t => t.tag.toLowerCase() === trimmed.toLowerCase())) {
      setNewTag('');
      setShowTagInput(false);
      return;
    }
    setAddingTag(true);
    const { data } = await supabase
      .from('profile_tags')
      .insert({ tagger_id: user.id, tagged_id: profile.id, tag: trimmed })
      .select('*')
      .single();
    if (data) setTags(prev => [...prev, data as ProfileTag]);
    setNewTag('');
    setShowTagInput(false);
    setAddingTag(false);
  };

  const removeTag = async (tagId: string) => {
    await supabase.from('profile_tags').delete().eq('id', tagId);
    setTags(prev => prev.filter(t => t.id !== tagId));
  };

  const handleNoteChange = (value: string) => {
    setNote(value);
    setNoteSaved(false);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => saveNote(value), 1200);
  };

  const saveNote = async (content: string) => {
    if (!user || !profile) return;
    setSavingNote(true);
    if (noteId) {
      await supabase.from('profile_notes').update({ content, updated_at: new Date().toISOString() }).eq('id', noteId);
    } else {
      const { data } = await supabase
        .from('profile_notes')
        .insert({ author_id: user.id, subject_id: profile.id, content })
        .select('id')
        .single();
      if (data) setNoteId(data.id);
    }
    setSavingNote(false);
    setNoteSaved(true);
  };

  if (loading) return <LoadingSkeleton />;
  if (!profile) return <div className="text-center py-20 text-gray-500">Profile not found</div>;

  const hasAvatar = profile.avatar_url;
  const isCoupleWithBothPhotos = profile.profile_type === 'couple' && profile.avatar_url && profile.avatar_url_2;

  return (
    <div className="max-w-2xl mx-auto">
      {!isOwnProfile && (
        <button onClick={() => navigate('search')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 px-4 transition-colors">
          <ChevronLeft size={18} />
          Back
        </button>
      )}

      <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
        <div className="h-56 relative bg-gray-800">
          {isCoupleWithBothPhotos ? (
            <CouplePhotoBanner url1={profile.avatar_url} url2={profile.avatar_url_2} className="w-full h-full" />
          ) : hasAvatar ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <User size={64} className="text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-6 flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-rose-500/60 shadow-xl flex-shrink-0">
              {isCoupleWithBothPhotos ? (
                <CouplePhoto url1={profile.avatar_url} url2={profile.avatar_url_2} size={80} />
              ) : hasAvatar ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{profile.display_name || profile.username}</h1>
                {profile.profile_type === 'couple' && (
                  <span className="flex items-center gap-1 bg-rose-600/80 text-white text-xs px-2 py-0.5 rounded-full">
                    <Users size={10} /> Couple
                  </span>
                )}
              </div>
              {profile.age && (
                <p className="text-gray-300 text-sm">{profile.age} years old</p>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => navigate('edit-profile')}
              className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-800 text-white p-2 rounded-xl transition-colors backdrop-blur-sm"
            >
              <Edit size={16} />
            </button>
          )}
        </div>

        <div className="p-6">
          {!isOwnProfile && (
            <div className="mb-5 flex items-center gap-3 flex-wrap">
              <button
                onClick={startConversation}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-rose-900/30"
              >
                <MessageCircle size={16} />
                Send Message
              </button>

              {/* Like button */}
              <button
                onClick={toggleLike}
                disabled={liking}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                  hasLiked
                    ? 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600/30'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-600/10'
                }`}
              >
                <Heart size={16} className={hasLiked ? 'fill-rose-400' : ''} />
                <span>{likeCount > 0 ? likeCount : ''} {hasLiked ? 'Liked' : 'Like'}</span>
              </button>

              {filterBlocked && (
                <p className="w-full text-amber-400 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  This profile only accepts messages from certain users. Your profile doesn't match their criteria.
                </p>
              )}
            </div>
          )}

          {profile.profile_type === 'couple' && profile.couple_member_2_name && (
            <p className="text-gray-400 text-sm mb-4">with <span className="text-rose-400 font-medium">{profile.couple_member_2_name}</span></p>
          )}

          {profile.profile_type === 'couple' ? (
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Person 1</p>
                <div className="flex flex-wrap gap-2">
                  {profile.living_area && <Tag icon={<MapPin size={12} />} label={profile.living_area} />}
                  {profile.age && <Tag icon={null} label={`${profile.age} yrs`} />}
                  {profile.height_cm && <Tag icon={<Ruler size={12} />} label={`${profile.height_cm} cm`} />}
                  {profile.weight_kg && <Tag icon={<Weight size={12} />} label={`${profile.weight_kg} kg`} />}
                  {profile.eye_color && <Tag icon={<Eye size={12} />} label={formatLabel(profile.eye_color)} />}
                  {profile.gender && <Tag icon={null} label={formatLabel(profile.gender)} />}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  {profile.couple_member_2_name || 'Person 2'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.couple_member_2_age && <Tag icon={null} label={`${profile.couple_member_2_age} yrs`} />}
                  {profile.couple_member_2_height_cm && <Tag icon={<Ruler size={12} />} label={`${profile.couple_member_2_height_cm} cm`} />}
                  {profile.couple_member_2_weight_kg && <Tag icon={<Weight size={12} />} label={`${profile.couple_member_2_weight_kg} kg`} />}
                  {profile.couple_member_2_eye_color && <Tag icon={<Eye size={12} />} label={formatLabel(profile.couple_member_2_eye_color)} />}
                  {profile.couple_member_2_gender && <Tag icon={null} label={formatLabel(profile.couple_member_2_gender)} />}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-5">
              {profile.living_area && <Tag icon={<MapPin size={12} />} label={profile.living_area} />}
              {profile.eye_color && <Tag icon={<Eye size={12} />} label={formatLabel(profile.eye_color) + ' eyes'} />}
              {profile.height_cm && <Tag icon={<Ruler size={12} />} label={`${profile.height_cm} cm`} />}
              {profile.weight_kg && <Tag icon={<Weight size={12} />} label={`${profile.weight_kg} kg`} />}
              {profile.has_tattoos && <Tag icon={<Activity size={12} />} label="Tattoos" />}
              {profile.is_smoker && <Tag icon={<Cigarette size={12} />} label="Smoker" />}
              {profile.gender && <Tag icon={null} label={formatLabel(profile.gender)} />}
              {profile.sexuality && <Tag icon={null} label={formatLabel(profile.sexuality)} />}
              {profile.marital_status && <Tag icon={null} label={formatLabel(profile.marital_status)} />}
            </div>
          )}

          {profile.profile_type === 'couple' && (profile.has_tattoos || profile.is_smoker || profile.sexuality || profile.marital_status) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {profile.has_tattoos && <Tag icon={<Activity size={12} />} label="Tattoos" />}
              {profile.is_smoker && <Tag icon={<Cigarette size={12} />} label="Smoker" />}
              {profile.sexuality && <Tag icon={null} label={formatLabel(profile.sexuality)} />}
              {profile.marital_status && <Tag icon={null} label={formatLabel(profile.marital_status)} />}
            </div>
          )}

          {profile.bio && (
            <div className="mb-5">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">About</h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {profile.looking_for && (
            <div className="mb-5">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Looking For</h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.looking_for}</p>
            </div>
          )}

          {profile.has_disability && (
            <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl px-4 py-3 mb-5">
              <p className="text-blue-300 text-sm">
                <span className="font-medium">Disability/Diagnose</span>
                {profile.disability_description && `: ${profile.disability_description}`}
              </p>
            </div>
          )}

          {/* Private tags & notes — only shown when viewing someone else's profile */}
          {!isOwnProfile && user && (
            <div className="border-t border-gray-800 pt-5 mt-2 space-y-4">
              {/* Tags */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <TagIcon size={14} className="text-gray-500" />
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider">Mine etiketter</h3>
                  <span className="text-xs text-gray-600 ml-auto">Kun synlig for dig</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <span
                      key={t.id}
                      className="group flex items-center gap-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-full transition-colors hover:border-gray-600"
                    >
                      {t.tag}
                      <button
                        onClick={() => removeTag(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 transition-all -mr-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}

                  {showTagInput ? (
                    <form
                      onSubmit={e => { e.preventDefault(); addTag(); }}
                      className="flex items-center gap-1"
                    >
                      <input
                        ref={tagInputRef}
                        value={newTag}
                        onChange={e => setNewTag(e.target.value.slice(0, 30))}
                        onBlur={() => { if (!newTag.trim()) setShowTagInput(false); }}
                        onKeyDown={e => { if (e.key === 'Escape') { setShowTagInput(false); setNewTag(''); } }}
                        placeholder="Ny etiket..."
                        maxLength={30}
                        className="bg-gray-800 border border-gray-600 focus:border-rose-500 text-white text-xs px-3 py-1.5 rounded-full w-28 outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!newTag.trim() || addingTag}
                        className="flex items-center justify-center w-6 h-6 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-full transition-colors"
                      >
                        {addingTag ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                      </button>
                    </form>
                  ) : (
                    tags.length < 20 && (
                      <button
                        onClick={() => setShowTagInput(true)}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-400 text-xs px-2 py-1.5 rounded-full border border-dashed border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <Plus size={10} />
                        Tilføj
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Note */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <StickyNote size={14} className="text-gray-500" />
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider">Mit notat</h3>
                  <span className="ml-auto text-[10px] text-gray-600 flex items-center gap-1">
                    {savingNote && <><Loader2 size={10} className="animate-spin" /> Gemmer...</>}
                    {!savingNote && noteSaved && <span className="text-emerald-600">Gemt</span>}
                    {!savingNote && !noteSaved && <span>Kun synlig for dig</span>}
                  </span>
                </div>
                <textarea
                  value={note}
                  onChange={e => handleNoteChange(e.target.value)}
                  placeholder="Skriv et privat notat om denne profil..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-gray-600 text-gray-300 text-sm px-4 py-3 rounded-xl resize-none outline-none transition-colors placeholder:text-gray-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <PhotoGallery profileId={profile.id} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  );
}

function Tag({ icon, label }: { icon: React.ReactNode | null; label: string }) {
  return (
    <span className="flex items-center gap-1.5 bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-full border border-gray-700">
      {icon}
      {label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 animate-pulse">
        <div className="h-56 bg-gray-800" />
        <div className="p-6 space-y-4">
          <div className="h-4 bg-gray-800 rounded w-1/3" />
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

function formatLabel(str: string) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
