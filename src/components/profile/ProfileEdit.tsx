import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Users, User, Upload, Link, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabase';

const EYE_COLORS = ['Blue', 'Brown', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'];
const GENDERS = ['man', 'woman', 'non-binary', 'other', 'prefer-not-to-say'];
const SEXUALITIES = ['straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'other', 'prefer-not-to-say'];
const MARITAL_STATUSES = ['single', 'open-relationship', 'married', 'separated', 'prefer-not-to-say'];
const PROFILE_TYPES = ['single', 'couple'];

export function ProfileEdit() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useNavigation();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    display_name: '',
    profile_type: 'single' as 'single' | 'couple',
    bio: '',
    looking_for: '',
    age: '',
    eye_color: '',
    height_cm: '',
    weight_kg: '',
    has_tattoos: false,
    is_smoker: false,
    has_disability: false,
    disability_description: '',
    gender: '',
    living_area: '',
    sexuality: '',
    marital_status: '',
    avatar_url: '',
    avatar_url_2: '',
    couple_member_2_name: '',
    couple_member_2_age: '',
    couple_member_2_height_cm: '',
    couple_member_2_weight_kg: '',
    couple_member_2_gender: '',
    couple_member_2_eye_color: '',
    msg_filter_enabled: false,
    msg_filter_min_age: '',
    msg_filter_max_age: '',
    msg_filter_genders: [] as string[],
    msg_filter_profile_types: [] as string[],
    msg_filter_living_areas: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        profile_type: profile.profile_type,
        bio: profile.bio || '',
        looking_for: profile.looking_for || '',
        age: profile.age?.toString() || '',
        eye_color: profile.eye_color || '',
        height_cm: profile.height_cm?.toString() || '',
        weight_kg: profile.weight_kg?.toString() || '',
        has_tattoos: profile.has_tattoos || false,
        is_smoker: profile.is_smoker || false,
        has_disability: profile.has_disability || false,
        disability_description: profile.disability_description || '',
        gender: profile.gender || '',
        living_area: profile.living_area || '',
        sexuality: profile.sexuality || '',
        marital_status: profile.marital_status || '',
        avatar_url: profile.avatar_url || '',
        avatar_url_2: profile.avatar_url_2 || '',
        couple_member_2_name: profile.couple_member_2_name || '',
        couple_member_2_age: profile.couple_member_2_age?.toString() || '',
        couple_member_2_height_cm: profile.couple_member_2_height_cm?.toString() || '',
        couple_member_2_weight_kg: profile.couple_member_2_weight_kg?.toString() || '',
        couple_member_2_gender: profile.couple_member_2_gender || '',
        couple_member_2_eye_color: profile.couple_member_2_eye_color || '',
        msg_filter_enabled: profile.msg_filter_enabled || false,
        msg_filter_min_age: profile.msg_filter_min_age?.toString() || '',
        msg_filter_max_age: profile.msg_filter_max_age?.toString() || '',
        msg_filter_genders: profile.msg_filter_genders || [],
        msg_filter_profile_types: profile.msg_filter_profile_types || [],
        msg_filter_living_areas: (profile.msg_filter_living_areas || []).join(', '),
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    const livingAreasArray = form.msg_filter_living_areas
      ? form.msg_filter_living_areas.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const { error } = await supabase
      .from('dating_profiles')
      .update({
        display_name: form.display_name,
        profile_type: form.profile_type,
        bio: form.bio,
        looking_for: form.looking_for,
        age: form.age ? parseInt(form.age) : null,
        eye_color: form.eye_color,
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseInt(form.weight_kg) : null,
        has_tattoos: form.has_tattoos,
        is_smoker: form.is_smoker,
        has_disability: form.has_disability,
        disability_description: form.disability_description,
        gender: form.gender,
        living_area: form.living_area,
        sexuality: form.sexuality,
        marital_status: form.marital_status,
        avatar_url: form.avatar_url,
        avatar_url_2: form.avatar_url_2,
        couple_member_2_name: form.couple_member_2_name,
        couple_member_2_age: form.couple_member_2_age ? parseInt(form.couple_member_2_age) : null,
        couple_member_2_height_cm: form.couple_member_2_height_cm ? parseInt(form.couple_member_2_height_cm) : null,
        couple_member_2_weight_kg: form.couple_member_2_weight_kg ? parseInt(form.couple_member_2_weight_kg) : null,
        couple_member_2_gender: form.couple_member_2_gender,
        couple_member_2_eye_color: form.couple_member_2_eye_color,
        msg_filter_enabled: form.msg_filter_enabled,
        msg_filter_min_age: form.msg_filter_min_age ? parseInt(form.msg_filter_min_age) : null,
        msg_filter_max_age: form.msg_filter_max_age ? parseInt(form.msg_filter_max_age) : null,
        msg_filter_genders: form.msg_filter_genders,
        msg_filter_profile_types: form.msg_filter_profile_types,
        msg_filter_living_areas: livingAreasArray,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile!.id);
    if (error) {
      setError(error.message);
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setLoading(false);
  };

  const set = (field: string, value: string | boolean | string[]) => setForm(f => ({ ...f, [field]: value }));

  const toggleArrayItem = (field: string, value: string) => {
    setForm(f => {
      const arr = f[field as keyof typeof f] as string[];
      return { ...f, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const uploadAvatar = async (file: File, slot: 1 | 2) => {
    if (!user) return;
    const setUploading = slot === 1 ? setUploading1 : setUploading2;
    const field = slot === 1 ? 'avatar_url' : 'avatar_url_2';
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar${slot}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      set(field, data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        <button onClick={() => navigate('profile')} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        <Section title="Profile Type">
          <div className="flex gap-3">
            <TypeBtn
              icon={<User size={18} />}
              label="Single"
              active={form.profile_type === 'single'}
              onClick={() => set('profile_type', 'single')}
            />
            <TypeBtn
              icon={<Users size={18} />}
              label="Couple"
              active={form.profile_type === 'couple'}
              onClick={() => set('profile_type', 'couple')}
            />
          </div>
        </Section>

        <Section title="Profile Photo">
          <div className="space-y-4">
            <AvatarUploader
              label={form.profile_type === 'couple' ? 'Person 1 Photo' : 'Profile Photo'}
              url={form.avatar_url}
              uploading={uploading1}
              fileRef={fileRef1}
              onFile={f => uploadAvatar(f, 1)}
              onUrl={v => set('avatar_url', v)}
            />
            {form.profile_type === 'couple' && (
              <>
                <AvatarUploader
                  label="Person 2 Photo"
                  url={form.avatar_url_2}
                  uploading={uploading2}
                  fileRef={fileRef2}
                  onFile={f => uploadAvatar(f, 2)}
                  onUrl={v => set('avatar_url_2', v)}
                />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Partner's Name</label>
                  <input
                    value={form.couple_member_2_name}
                    onChange={e => set('couple_member_2_name', e.target.value)}
                    placeholder="Partner's name"
                    className="w-full input-dark"
                  />
                </div>
              </>
            )}
          </div>
        </Section>

        <Section title="About Me">
          <div className="space-y-3">
            <Field label="Display Name">
              <input value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="Your name" className="w-full input-dark" />
            </Field>
            <Field label="About Me">
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={4} placeholder="Tell others about yourself..." className="w-full input-dark resize-none" />
            </Field>
            <Field label="Looking For">
              <textarea value={form.looking_for} onChange={e => set('looking_for', e.target.value)} rows={3} placeholder="Describe who you're looking for..." className="w-full input-dark resize-none" />
            </Field>
          </div>
        </Section>

        <Section title={form.profile_type === 'couple' ? 'Person 1 Details' : 'Personal Details'}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <input type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="25" min="18" max="120" className="w-full input-dark" />
            </Field>
            <Field label="Living Area">
              <input value={form.living_area} onChange={e => set('living_area', e.target.value)} placeholder="City, Country" className="w-full input-dark" />
            </Field>
            <Field label="Height (cm)">
              <input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder="175" className="w-full input-dark" />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="70" className="w-full input-dark" />
            </Field>
            <Field label="Eye Color">
              <select value={form.eye_color} onChange={e => set('eye_color', e.target.value)} className="w-full input-dark">
                <option value="">Select...</option>
                {EYE_COLORS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
              </select>
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={e => set('gender', e.target.value)} className="w-full input-dark">
                <option value="">Select...</option>
                {GENDERS.map(g => <option key={g} value={g}>{formatLabel(g)}</option>)}
              </select>
            </Field>
            <Field label="Sexuality">
              <select value={form.sexuality} onChange={e => set('sexuality', e.target.value)} className="w-full input-dark">
                <option value="">Select...</option>
                {SEXUALITIES.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
              </select>
            </Field>
            <Field label="Marital Status">
              <select value={form.marital_status} onChange={e => set('marital_status', e.target.value)} className="w-full input-dark">
                <option value="">Select...</option>
                {MARITAL_STATUSES.map(m => <option key={m} value={m}>{formatLabel(m)}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {form.profile_type === 'couple' && (
          <Section title="Person 2 Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age">
                <input type="number" value={form.couple_member_2_age} onChange={e => set('couple_member_2_age', e.target.value)} placeholder="25" min="18" max="120" className="w-full input-dark" />
              </Field>
              <Field label="Height (cm)">
                <input type="number" value={form.couple_member_2_height_cm} onChange={e => set('couple_member_2_height_cm', e.target.value)} placeholder="170" className="w-full input-dark" />
              </Field>
              <Field label="Weight (kg)">
                <input type="number" value={form.couple_member_2_weight_kg} onChange={e => set('couple_member_2_weight_kg', e.target.value)} placeholder="65" className="w-full input-dark" />
              </Field>
              <Field label="Eye Color">
                <select value={form.couple_member_2_eye_color} onChange={e => set('couple_member_2_eye_color', e.target.value)} className="w-full input-dark">
                  <option value="">Select...</option>
                  {EYE_COLORS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </Field>
              <Field label="Gender">
                <select value={form.couple_member_2_gender} onChange={e => set('couple_member_2_gender', e.target.value)} className="w-full input-dark">
                  <option value="">Select...</option>
                  {GENDERS.map(g => <option key={g} value={g}>{formatLabel(g)}</option>)}
                </select>
              </Field>
            </div>
          </Section>
        )}

        <Section title="Lifestyle">
          <div className="space-y-3">
            <Toggle label="Has Tattoos" checked={form.has_tattoos} onChange={v => set('has_tattoos', v)} />
            <Toggle label="Smoker" checked={form.is_smoker} onChange={v => set('is_smoker', v)} />
            <Toggle label="Has a Disability or Diagnose" checked={form.has_disability} onChange={v => set('has_disability', v)} />
            {form.has_disability && (
              <Field label="Description (optional)">
                <input value={form.disability_description} onChange={e => set('disability_description', e.target.value)} placeholder="Briefly describe if you'd like" className="w-full input-dark" />
              </Field>
            )}
          </div>
        </Section>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-rose-400" />
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider text-gray-400">Message Filters</h2>
            </div>
            <Toggle label="" checked={form.msg_filter_enabled} onChange={v => set('msg_filter_enabled', v)} />
          </div>

          {form.msg_filter_enabled && (
            <div className="space-y-5 pt-1 border-t border-gray-800">
              <p className="text-gray-500 text-xs leading-relaxed">
                Only allow messages from profiles that match your criteria. Profiles outside these filters will not be able to send you messages.
              </p>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Age Range</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={form.msg_filter_min_age}
                    onChange={e => set('msg_filter_min_age', e.target.value)}
                    placeholder="Min"
                    min="18"
                    max="120"
                    className="w-full input-dark"
                  />
                  <span className="text-gray-600 text-sm flex-shrink-0">to</span>
                  <input
                    type="number"
                    value={form.msg_filter_max_age}
                    onChange={e => set('msg_filter_max_age', e.target.value)}
                    placeholder="Max"
                    min="18"
                    max="120"
                    className="w-full input-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Allowed Genders <span className="text-gray-600">(leave empty for all)</span></label>
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleArrayItem('msg_filter_genders', g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.msg_filter_genders.includes(g)
                          ? 'bg-rose-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {formatLabel(g)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Allowed Profile Types <span className="text-gray-600">(leave empty for all)</span></label>
                <div className="flex gap-2">
                  {PROFILE_TYPES.map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => toggleArrayItem('msg_filter_profile_types', pt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.msg_filter_profile_types.includes(pt)
                          ? 'bg-rose-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {formatLabel(pt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Allowed Living Areas <span className="text-gray-600">(comma-separated, leave empty for all)</span></label>
                <input
                  value={form.msg_filter_living_areas}
                  onChange={e => set('msg_filter_living_areas', e.target.value)}
                  placeholder="e.g. Copenhagen, Aarhus, Odense"
                  className="w-full input-dark"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 rounded-xl px-4 py-3 text-rose-300 text-sm">{error}</div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg"
        >
          <Save size={18} />
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function TypeBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-gray-300 text-sm">{label}</span>}
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-rose-600' : 'bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function formatLabel(str: string) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function AvatarUploader({
  label, url, uploading, fileRef, onFile, onUrl,
}: {
  label: string;
  url: string;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onFile: (f: File) => void;
  onUrl: (v: string) => void;
}) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-gray-500">{label}</label>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mode === 'upload' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Upload size={11} />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mode === 'url' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Link size={11} />
            URL
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-start">
        {url ? (
          <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-700 flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
            <Upload size={18} className="text-gray-600" />
          </div>
        )}

        <div className="flex-1">
          {mode === 'upload' ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-rose-500/50 rounded-xl py-3 text-sm text-gray-400 hover:text-gray-200 transition-all disabled:opacity-50"
              >
                <Upload size={15} />
                {uploading ? 'Uploading...' : 'Choose photo from device'}
              </button>
              <p className="text-xs text-gray-600 mt-1.5 text-center">JPG, PNG, WEBP up to 10MB</p>
            </>
          ) : (
            <input
              value={url}
              onChange={e => onUrl(e.target.value)}
              placeholder="https://..."
              className="w-full input-dark"
            />
          )}
        </div>
      </div>
    </div>
  );
}
