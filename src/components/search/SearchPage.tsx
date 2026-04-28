import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, MapPin, User, Users, SlidersHorizontal, X, ChevronDown, Bookmark, BookmarkCheck, Trash2, Plus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DatingProfile, SavedSearch } from '../../lib/types';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-Binary' },
  { value: 'other', label: 'Other' },
];
const SEXUALITIES = [
  { value: 'heterosexual', label: 'Heterosexual' },
  { value: 'homosexual', label: 'Homosexual' },
  { value: 'bisexual', label: 'Bisexual' },
  { value: 'pansexual', label: 'Pansexual' },
  { value: 'asexual', label: 'Asexual' },
  { value: 'other', label: 'Other' },
];
const EYE_COLORS = [
  { value: 'blue', label: 'Blue' },
  { value: 'brown', label: 'Brown' },
  { value: 'green', label: 'Green' },
  { value: 'gray', label: 'Gray' },
  { value: 'hazel', label: 'Hazel' },
  { value: 'other', label: 'Other' },
];
const MARITAL_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];
const PROFILE_TYPES = [
  { value: 'single', label: 'Single' },
  { value: 'couple', label: 'Couple' },
];

interface Filters {
  query: string;
  gender: string;
  sexuality: string;
  area: string;
  maritalStatus: string;
  eyeColor: string;
  profileType: string;
  ageMin: string;
  ageMax: string;
  heightMin: string;
  heightMax: string;
  weightMin: string;
  weightMax: string;
  hasTattoos: string;
  isSmoker: string;
  hasDisability: string;
}

const defaultFilters: Filters = {
  query: '',
  gender: '',
  sexuality: '',
  area: '',
  maritalStatus: '',
  eyeColor: '',
  profileType: '',
  ageMin: '',
  ageMax: '',
  heightMin: '',
  heightMax: '',
  weightMin: '',
  weightMax: '',
  hasTattoos: '',
  isSmoker: '',
  hasDisability: '',
};

function countActiveFilters(f: Filters): number {
  return Object.entries(f).filter(([k, v]) => k !== 'query' && v !== '').length;
}

export function SearchPage() {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [results, setResults] = useState<DatingProfile[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [canSeeTestProfiles, setCanSeeTestProfiles] = useState(false);

  // Saved searches
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('dating_profiles')
      .select('can_see_test_profiles')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setCanSeeTestProfiles(data?.can_see_test_profiles ?? false);
      });

    supabase
      .from('saved_searches')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSavedSearches((data as SavedSearch[]) ?? []);
      });
  }, [user]);

  useEffect(() => {
    if (showSaveModal && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [showSaveModal]);

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = useCallback(async (f: Filters = filters) => {
    setLoading(true);
    let q = supabase.from('dating_profiles').select('*');
    if (f.query.trim()) q = q.ilike('username', `%${f.query.trim()}%`);
    if (f.gender) q = q.eq('gender', f.gender);
    if (f.sexuality) q = q.eq('sexuality', f.sexuality);
    if (f.area.trim()) q = q.ilike('living_area', `%${f.area.trim()}%`);
    if (f.maritalStatus) q = q.eq('marital_status', f.maritalStatus);
    if (f.eyeColor) q = q.eq('eye_color', f.eyeColor);
    if (f.profileType) q = q.eq('profile_type', f.profileType);
    if (f.ageMin) q = q.gte('age', parseInt(f.ageMin));
    if (f.ageMax) q = q.lte('age', parseInt(f.ageMax));
    if (f.heightMin) q = q.gte('height_cm', parseInt(f.heightMin));
    if (f.heightMax) q = q.lte('height_cm', parseInt(f.heightMax));
    if (f.weightMin) q = q.gte('weight_kg', parseInt(f.weightMin));
    if (f.weightMax) q = q.lte('weight_kg', parseInt(f.weightMax));
    if (f.hasTattoos !== '') q = q.eq('has_tattoos', f.hasTattoos === 'true');
    if (f.isSmoker !== '') q = q.eq('is_smoker', f.isSmoker === 'true');
    if (f.hasDisability !== '') q = q.eq('has_disability', f.hasDisability === 'true');
    if (user) q = q.neq('id', user.id);
    q = q.order('created_at', { ascending: false }).limit(50);
    const { data } = await q;
    const profiles = data || [];
    const filtered = canSeeTestProfiles
      ? profiles
      : profiles.filter(p => !p.bio?.toLowerCase().startsWith('test profile!'));
    setResults(filtered);
    setSearched(true);
    setLoading(false);
  }, [filters, user, canSeeTestProfiles]);

  useEffect(() => {
    handleSearch(defaultFilters);
  }, [canSeeTestProfiles]);

  const handleReset = () => {
    setFilters(defaultFilters);
    handleSearch(defaultFilters);
  };

  const loadSavedSearch = (s: SavedSearch) => {
    const loaded = { ...defaultFilters, ...s.filters } as Filters;
    setFilters(loaded);
    handleSearch(loaded);
    if (countActiveFilters(loaded) > 0) setShowAdvanced(true);
  };

  const saveSearch = async () => {
    const name = saveName.trim();
    if (!name || !user || saving) return;
    setSaving(true);
    const { data } = await supabase
      .from('saved_searches')
      .insert({ profile_id: user.id, name, filters })
      .select('*')
      .single();
    if (data) setSavedSearches(prev => [data as SavedSearch, ...prev]);
    setSaving(false);
    setShowSaveModal(false);
    setSaveName('');
  };

  const deleteSavedSearch = async (id: string) => {
    setDeletingId(id);
    await supabase.from('saved_searches').delete().eq('id', id);
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    setDeletingId(null);
  };

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0 || filters.query.trim() !== '';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Search Profiles</h1>

      {/* Saved searches strip */}
      {savedSearches.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Saved searches</p>
          <div className="flex gap-2 flex-wrap">
            {savedSearches.map(s => (
              <div key={s.id} className="group flex items-center gap-1 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-full pl-3 pr-1.5 py-1.5 transition-colors">
                <button
                  onClick={() => loadSavedSearch(s)}
                  className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <BookmarkCheck size={12} className="text-rose-400 flex-shrink-0" />
                  {s.name}
                </button>
                <button
                  onClick={() => deleteSavedSearch(s.id)}
                  disabled={deletingId === s.id}
                  className="ml-1 p-0.5 text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={filters.query}
              onChange={e => setFilter('query', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by username..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors text-sm"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white px-5 py-3 rounded-xl font-medium transition-all text-sm disabled:opacity-50"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SelectFilter label="Gender" value={filters.gender} onChange={v => setFilter('gender', v)} options={GENDERS} />
          <SelectFilter label="Sexuality" value={filters.sexuality} onChange={v => setFilter('sexuality', v)} options={SEXUALITIES} />
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Living Area</label>
            <div className="relative">
              <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                value={filters.area}
                onChange={e => setFilter('area', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="City or country..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <SlidersHorizontal size={14} />
            Advanced filters
            {activeFilterCount > 0 && (
              <span className="bg-rose-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium leading-none">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="ml-auto flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
            >
              <Bookmark size={13} />
              Save search
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="space-y-4 pt-1 border-t border-gray-800">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SelectFilter label="Profile Type" value={filters.profileType} onChange={v => setFilter('profileType', v)} options={PROFILE_TYPES} />
              <SelectFilter label="Marital Status" value={filters.maritalStatus} onChange={v => setFilter('maritalStatus', v)} options={MARITAL_STATUSES} />
              <SelectFilter label="Eye Color" value={filters.eyeColor} onChange={v => setFilter('eyeColor', v)} options={EYE_COLORS} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RangeFilter label="Age" unitLabel="years" minValue={filters.ageMin} maxValue={filters.ageMax} minPlaceholder="18" maxPlaceholder="99" onChangeMin={v => setFilter('ageMin', v)} onChangeMax={v => setFilter('ageMax', v)} />
              <RangeFilter label="Height" unitLabel="cm" minValue={filters.heightMin} maxValue={filters.heightMax} minPlaceholder="150" maxPlaceholder="220" onChangeMin={v => setFilter('heightMin', v)} onChangeMax={v => setFilter('heightMax', v)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RangeFilter label="Weight" unitLabel="kg" minValue={filters.weightMin} maxValue={filters.weightMax} minPlaceholder="40" maxPlaceholder="150" onChangeMin={v => setFilter('weightMin', v)} onChangeMax={v => setFilter('weightMax', v)} />
              <div />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <TriStateFilter label="Has Tattoos" value={filters.hasTattoos} onChange={v => setFilter('hasTattoos', v)} />
              <TriStateFilter label="Smoker" value={filters.isSmoker} onChange={v => setFilter('isSmoker', v)} />
              <TriStateFilter label="Has Disability" value={filters.hasDisability} onChange={v => setFilter('hasDisability', v)} />
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-400 transition-colors"
              >
                <X size={12} />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4] bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Search size={48} className="text-gray-700 mx-auto mb-3" />
          <p>No profiles found</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {results.map(p => (
            <ProfileCard key={p.id} profile={p} onClick={() => navigate('view-profile', { profileId: p.id })} />
          ))}
        </div>
      )}

      {!searched && !loading && (
        <div className="text-center py-16">
          <Search size={48} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Use the filters above to find profiles</p>
        </div>
      )}

      {/* Save search modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600/20 flex items-center justify-center flex-shrink-0">
                <Bookmark size={17} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Save this search</h3>
                <p className="text-gray-500 text-xs">Give it a name so you can reload it quickly</p>
              </div>
            </div>

            <form onSubmit={e => { e.preventDefault(); saveSearch(); }}>
              <input
                ref={saveInputRef}
                value={saveName}
                onChange={e => setSaveName(e.target.value.slice(0, 50))}
                placeholder="e.g. Women in Copenhagen, 25-35"
                className="w-full bg-gray-800 border border-gray-700 focus:border-rose-500 text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-gray-600"
              />
            </form>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowSaveModal(false); setSaveName(''); }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSearch}
                disabled={!saveName.trim() || saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Check size={14} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectFilter({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors text-sm pr-8"
        >
          <option value="">Any</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

function RangeFilter({ label, unitLabel, minValue, maxValue, minPlaceholder, maxPlaceholder, onChangeMin, onChangeMax }: {
  label: string;
  unitLabel: string;
  minValue: string;
  maxValue: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  onChangeMin: (v: string) => void;
  onChangeMax: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label} <span className="text-gray-600">({unitLabel})</span></label>
      <div className="flex gap-1.5 items-center">
        <input
          type="number"
          value={minValue}
          onChange={e => onChangeMin(e.target.value)}
          placeholder={minPlaceholder}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 transition-colors text-sm"
        />
        <span className="text-gray-600 text-xs flex-shrink-0">–</span>
        <input
          type="number"
          value={maxValue}
          onChange={e => onChangeMax(e.target.value)}
          placeholder={maxPlaceholder}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 transition-colors text-sm"
        />
      </div>
    </div>
  );
}

function TriStateFilter({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors text-sm pr-8"
        >
          <option value="">Any</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

function ProfileCard({ profile, onClick }: { profile: DatingProfile; onClick: () => void }) {
  const isCoupleWithBoth = profile.profile_type === 'couple' && profile.avatar_url && profile.avatar_url_2;

  return (
    <button onClick={onClick} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-rose-800/50 transition-all group text-left hover:shadow-lg hover:shadow-rose-950/30">
      <div className="aspect-[4/3] bg-gray-800 relative overflow-hidden">
        {isCoupleWithBoth ? (
          <div className="w-full h-full flex">
            <div className="w-1/2 overflow-hidden">
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ objectPosition: 'center center' }} />
            </div>
            <div className="w-1/2 overflow-hidden">
              <img src={profile.avatar_url_2} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ objectPosition: 'center center' }} />
            </div>
          </div>
        ) : profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={40} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
        {profile.profile_type === 'couple' && (
          <div className="absolute top-2 right-2 bg-rose-600/80 backdrop-blur-sm rounded-full p-1">
            <Users size={10} className="text-white" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-white font-medium text-sm truncate">{profile.display_name || profile.username}</p>
          {profile.bio?.toLowerCase().startsWith('test profile!') && (
            <span className="flex-shrink-0 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
              test profil
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {profile.age && <span className="text-gray-500 text-xs">{profile.age}</span>}
          {profile.living_area && (
            <span className="flex items-center gap-0.5 text-gray-500 text-xs">
              {profile.age && <span>·</span>}
              <MapPin size={10} />
              {profile.living_area}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
