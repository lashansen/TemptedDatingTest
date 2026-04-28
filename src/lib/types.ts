export type ProfileType = 'single' | 'couple';

export interface DatingProfile {
  id: string;
  username: string;
  profile_type: ProfileType;
  display_name: string;
  bio: string;
  looking_for: string;
  age: number | null;
  eye_color: string;
  height_cm: number | null;
  weight_kg: number | null;
  has_tattoos: boolean;
  is_smoker: boolean;
  has_disability: boolean;
  disability_description: string;
  gender: string;
  living_area: string;
  sexuality: string;
  marital_status: string;
  avatar_url: string;
  avatar_url_2: string;
  couple_member_2_name: string;
  couple_member_2_age: number | null;
  couple_member_2_height_cm: number | null;
  couple_member_2_weight_kg: number | null;
  couple_member_2_gender: string;
  couple_member_2_eye_color: string;
  msg_filter_enabled: boolean;
  msg_filter_min_age: number | null;
  msg_filter_max_age: number | null;
  msg_filter_genders: string[];
  msg_filter_profile_types: string[];
  msg_filter_living_areas: string[];
  last_visitor_check: string;
  is_locked: boolean;
  lock_reason: string;
  membership_tier: string;
  membership_expires_at: string | null;
  can_see_test_profiles: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatingPhoto {
  id: string;
  profile_id: string;
  photo_url: string;
  caption: string;
  is_primary: boolean;
  approval_status: string;
  rejection_reason: string;
  created_at: string;
  likes?: DatingPhotoLike[];
  comments?: DatingPhotoComment[];
  like_count?: number;
  user_liked?: boolean;
}

export interface DatingPhotoLike {
  id: string;
  photo_id: string;
  liker_id: string;
  created_at: string;
}

export interface DatingPhotoComment {
  id: string;
  photo_id: string;
  commenter_id: string;
  content: string;
  created_at: string;
  commenter?: DatingProfile;
}

export interface DatingConversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  other_profile?: DatingProfile;
  last_message?: DatingMessage;
  unread_count?: number;
}

export interface DatingMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: DatingProfile;
}

export interface DatingProfileVisit {
  id: string;
  visited_id: string;
  visitor_id: string;
  visited_at: string;
  visitor?: DatingProfile;
}

export interface GroupRoom {
  id: string;
  name: string;
  description: string;
  created_by: string | null;
  created_at: string;
  last_message_at: string;
  is_active: boolean;
  member_count?: number;
  is_member?: boolean;
  last_message?: GroupMessage | null;
}

export interface GroupRoomMember {
  id: string;
  room_id: string;
  profile_id: string;
  joined_at: string;
  profile?: DatingProfile;
}

export interface GroupMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  sender?: DatingProfile;
}

export interface SavedSearch {
  id: string;
  profile_id: string;
  name: string;
  filters: Record<string, string>;
  created_at: string;
}

export interface ProfileLike {
  id: string;
  liker_id: string;
  liked_id: string;
  created_at: string;
}

export interface ProfileTag {
  id: string;
  tagger_id: string;
  tagged_id: string;
  tag: string;
  created_at: string;
}

export interface ProfileNote {
  id: string;
  author_id: string;
  subject_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NewsPost {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  author_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export type Page =
  | 'home'
  | 'profile'
  | 'edit-profile'
  | 'messages'
  | 'conversation'
  | 'search'
  | 'view-profile'
  | 'visitors'
  | 'subscription'
  | 'gift-membership'
  | 'group-rooms'
  | 'group-chat'
  | 'admin'
  | 'terms';
