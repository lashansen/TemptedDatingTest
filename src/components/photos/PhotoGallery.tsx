import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Plus, X, Send, Trash2, Upload, Link } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DatingPhoto, DatingPhotoComment, DatingProfile } from '../../lib/types';

interface PhotoGalleryProps {
  profileId: string;
  isOwnProfile: boolean;
}

export function PhotoGallery({ profileId, isOwnProfile }: PhotoGalleryProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<DatingPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<DatingPhoto | null>(null);
  const [comments, setComments] = useState<(DatingPhotoComment & { commenter: DatingProfile })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    let query = supabase
      .from('dating_photos')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (!isOwnProfile) {
      query = query.eq('approval_status', 'approved');
    }

    const { data } = await query;
    if (!data) return;

    const photosWithLikes = await Promise.all(data.map(async (photo) => {
      const { count } = await supabase
        .from('dating_photo_likes')
        .select('*', { count: 'exact', head: true })
        .eq('photo_id', photo.id);
      let userLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from('dating_photo_likes')
          .select('id')
          .eq('photo_id', photo.id)
          .eq('liker_id', user.id)
          .maybeSingle();
        userLiked = !!likeData;
      }
      return { ...photo, like_count: count ?? 0, user_liked: userLiked };
    }));
    setPhotos(photosWithLikes);
  }, [profileId, user]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const loadComments = async (photoId: string) => {
    setLoadingComments(true);
    const { data } = await supabase
      .from('dating_photo_comments')
      .select('*, commenter:commenter_id(id, username, display_name, avatar_url)')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });
    setComments((data as any) || []);
    setLoadingComments(false);
  };

  const openPhoto = (photo: DatingPhoto) => {
    setSelectedPhoto(photo);
    loadComments(photo.id);
  };

  const toggleLike = async (photo: DatingPhoto) => {
    if (!user) return;
    if (photo.user_liked) {
      await supabase.from('dating_photo_likes').delete().eq('photo_id', photo.id).eq('liker_id', user.id);
    } else {
      await supabase.from('dating_photo_likes').insert({ photo_id: photo.id, liker_id: user.id });
    }
    await loadPhotos();
    if (selectedPhoto?.id === photo.id) {
      setSelectedPhoto(p => p ? { ...p, user_liked: !p.user_liked, like_count: (p.like_count ?? 0) + (p.user_liked ? -1 : 1) } : null);
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPhoto || !newComment.trim()) return;
    await supabase.from('dating_photo_comments').insert({
      photo_id: selectedPhoto.id,
      commenter_id: user.id,
      content: newComment.trim(),
    });
    setNewComment('');
    loadComments(selectedPhoto.id);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('dating_photo_comments').delete().eq('id', commentId);
    if (selectedPhoto) loadComments(selectedPhoto.id);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/photo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setNewPhotoUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const addPhoto = async () => {
    if (!user || !newPhotoUrl.trim()) return;
    await supabase.from('dating_photos').insert({
      profile_id: profileId,
      photo_url: newPhotoUrl.trim(),
      caption: newCaption.trim(),
    });
    setNewPhotoUrl('');
    setNewCaption('');
    setShowAddPhoto(false);
    setPhotoMode('upload');
    loadPhotos();
  };

  const deletePhoto = async (photoId: string) => {
    await supabase.from('dating_photos').delete().eq('id', photoId);
    setSelectedPhoto(null);
    loadPhotos();
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Photos</h2>
        {isOwnProfile && (
          <button
            onClick={() => setShowAddPhoto(!showAddPhoto)}
            className="flex items-center gap-1.5 text-sm text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Plus size={16} />
            Add Photo
          </button>
        )}
      </div>

      {showAddPhoto && isOwnProfile && (
        <div className="mb-4 bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex gap-1 bg-gray-900 rounded-lg p-0.5 self-start w-fit">
            <button
              type="button"
              onClick={() => { setPhotoMode('upload'); setNewPhotoUrl(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${photoMode === 'upload' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Upload size={11} />
              Upload from device
            </button>
            <button
              type="button"
              onClick={() => { setPhotoMode('url'); setNewPhotoUrl(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${photoMode === 'url' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Link size={11} />
              URL
            </button>
          </div>

          {photoMode === 'upload' ? (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
              />
              {newPhotoUrl ? (
                <div className="relative">
                  <img src={newPhotoUrl} alt="" className="w-full h-40 object-cover rounded-xl border border-gray-700" />
                  <button
                    type="button"
                    onClick={() => { setNewPhotoUrl(''); if (fileRef.current) fileRef.current.value = ''; }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-rose-500/50 rounded-xl py-8 text-gray-400 hover:text-gray-200 transition-all disabled:opacity-50"
                >
                  <Upload size={22} />
                  <span className="text-sm">{uploading ? 'Uploading...' : 'Choose photo from device'}</span>
                  <span className="text-xs text-gray-600">JPG, PNG, WEBP up to 10MB</span>
                </button>
              )}
            </div>
          ) : (
            <input
              value={newPhotoUrl}
              onChange={e => setNewPhotoUrl(e.target.value)}
              placeholder="Photo URL (https://...)"
              className="w-full input-dark text-sm"
            />
          )}

          <input
            value={newCaption}
            onChange={e => setNewCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full input-dark text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={addPhoto}
              disabled={!newPhotoUrl.trim() || uploading}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Add Photo
            </button>
            <button
              onClick={() => { setShowAddPhoto(false); setNewPhotoUrl(''); setNewCaption(''); setPhotoMode('upload'); }}
              className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">No photos yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => openPhoto(photo)}
              className="aspect-square rounded-xl overflow-hidden bg-gray-800 relative group"
            >
              <img src={photo.photo_url} alt={photo.caption} className={`w-full h-full object-cover ${photo.approval_status === 'pending' ? 'opacity-60' : photo.approval_status === 'rejected' ? 'opacity-40 grayscale' : ''}`} />
              {isOwnProfile && photo.approval_status === 'pending' && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="px-1.5 py-0.5 bg-amber-500/90 text-white text-[9px] font-bold rounded-full uppercase tracking-wide">Afventer</span>
                </div>
              )}
              {isOwnProfile && photo.approval_status === 'rejected' && (
                <div className="absolute top-1.5 left-1.5 right-1.5">
                  <span className="px-1.5 py-0.5 bg-rose-600/90 text-white text-[9px] font-bold rounded-full uppercase tracking-wide">Afvist</span>
                  {photo.rejection_reason && (
                    <div className="mt-1 px-1.5 py-1 bg-black/80 text-white text-[8px] rounded leading-tight break-words">
                      {photo.rejection_reason}
                    </div>
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-start p-2 opacity-0 group-hover:opacity-100">
                <span className="flex items-center gap-1 text-white text-xs">
                  <Heart size={12} className="fill-white" />
                  {photo.like_count}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-gray-900 rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
            <div className="md:w-1/2 flex-shrink-0 bg-black flex items-center justify-center">
              <img src={selectedPhoto.photo_url} alt={selectedPhoto.caption} className="max-h-[50vh] md:max-h-[90vh] w-full object-contain" />
            </div>
            <div className="md:w-1/2 flex flex-col min-h-0">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLike(selectedPhoto)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${selectedPhoto.user_liked ? 'text-rose-400' : 'text-gray-400 hover:text-rose-400'}`}
                  >
                    <Heart size={18} className={selectedPhoto.user_liked ? 'fill-current' : ''} />
                    {selectedPhoto.like_count}
                  </button>
                  <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <MessageCircle size={18} />
                    {comments.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isOwnProfile && (
                    <button onClick={() => deletePhoto(selectedPhoto.id)} className="text-gray-500 hover:text-rose-400 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button onClick={() => setSelectedPhoto(null)} className="text-gray-400 hover:text-white p-1 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {selectedPhoto.caption && (
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-gray-300 text-sm">{selectedPhoto.caption}</p>
                </div>
              )}

              {isOwnProfile && selectedPhoto.approval_status === 'rejected' && (
                <div className="px-4 py-3 border-b border-rose-900/40 bg-rose-950/30">
                  <p className="text-rose-400 text-xs font-semibold uppercase tracking-wide mb-1">Billede afvist</p>
                  {selectedPhoto.rejection_reason ? (
                    <p className="text-rose-300 text-sm">{selectedPhoto.rejection_reason}</p>
                  ) : (
                    <p className="text-rose-400/60 text-sm italic">Ingen årsag angivet</p>
                  )}
                </div>
              )}

              {isOwnProfile && selectedPhoto.approval_status === 'pending' && (
                <div className="px-4 py-3 border-b border-amber-900/40 bg-amber-950/30">
                  <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Afventer godkendelse</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {loadingComments ? (
                  <p className="text-gray-600 text-sm text-center">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center">No comments yet</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 group">
                      <div className="w-7 h-7 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                        {comment.commenter?.avatar_url ? (
                          <img src={comment.commenter.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            {(comment.commenter?.display_name || comment.commenter?.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-400 text-xs mb-0.5">{comment.commenter?.display_name || comment.commenter?.username}</p>
                        <p className="text-gray-200 text-sm leading-snug">{comment.content}</p>
                      </div>
                      {(user?.id === comment.commenter_id || isOwnProfile) && (
                        <button onClick={() => deleteComment(comment.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-rose-400 p-1 transition-all flex-shrink-0">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {user && (
                <form onSubmit={addComment} className="p-4 border-t border-gray-800 flex gap-2">
                  <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-rose-500"
                  />
                  <button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-xl transition-colors">
                    <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
