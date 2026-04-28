import React from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import { HomePage } from './pages/HomePage';
import { ProfileView } from './components/profile/ProfileView';
import { ProfileEdit } from './components/profile/ProfileEdit';
import { MessagesPage } from './components/messages/MessagesPage';
import { SearchPage } from './components/search/SearchPage';
import { VisitorsPage } from './components/visitors/VisitorsPage';
import { AdminPage } from './components/admin/AdminPage';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { GiftMembershipPage } from './components/subscription/GiftMembershipPage';
import { GroupRoomsPage } from './components/groupchat/GroupRoomsPage';
import { GroupChatView } from './components/groupchat/GroupChatView';
import { TermsPage } from './pages/TermsPage';

function AppContent() {
  const { user, loading, isAdmin, profile } = useAuth();
  const { page, pageParams, navigate } = useNavigation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (profile?.is_locked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-rose-900/40 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-white text-xl font-bold">Konto låst</h2>
          <p className="text-gray-400 text-sm">Din konto er midlertidigt låst af en administrator.</p>
          {profile.lock_reason && (
            <div className="bg-rose-950/30 border border-rose-900/30 rounded-xl p-3">
              <p className="text-rose-300 text-sm">{profile.lock_reason}</p>
            </div>
          )}
          <p className="text-gray-500 text-xs">Kontakt support for mere information.</p>
          <button onClick={() => { supabase.auth.signOut(); }} className="text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors">Log ud</button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage />;
      case 'profile':
        return <ProfileView />;
      case 'view-profile':
        return <ProfileView profileId={pageParams.profileId} />;
      case 'edit-profile':
        return <ProfileEdit />;
      case 'messages':
        return <MessagesPage />;
      case 'conversation':
        return <MessagesPage />;
      case 'search':
        return <SearchPage />;
      case 'visitors':
        return <VisitorsPage />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'gift-membership':
        return <GiftMembershipPage />;
      case 'group-rooms':
        return <GroupRoomsPage />;
      case 'group-chat':
        return <GroupChatView roomId={pageParams.roomId} roomName={pageParams.roomName} />;
      case 'admin':
        return isAdmin ? <AdminPage /> : <HomePage />;
      case 'terms':
        return <TermsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <main className="flex-1 mr-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}
