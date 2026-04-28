import React, { useState } from 'react';
import { Heart, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'login' | 'register' | 'forgot';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else if (mode === 'register') {
      if (!username.trim()) { setError('Username is required'); setLoading(false); return; }
      if (username.length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return; }
      const { error } = await signUp(email, password, username.trim().toLowerCase());
      if (error) setError(error.message);
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setResetSent(true);
      }
    }
    setLoading(false);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setResetSent(false);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Dating"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/80 via-rose-950/40 to-gray-950/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl">
              <Heart size={28} className="text-white fill-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-wide">Tempted</h1>
          </div>
          <p className="text-gray-300 text-xl text-center max-w-sm leading-relaxed">
            Find your perfect connection. Authentic profiles, real conversations.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Heart size={20} className="text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Tempted</h1>
          </div>

          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
            {mode === 'forgot' ? (
              <>
                <button
                  onClick={() => switchMode('login')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </button>

                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-800 flex items-center justify-center mx-auto mb-4">
                      <Mail size={28} className="text-rose-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      We've sent a password reset link to <span className="text-rose-400 font-medium">{email}</span>. Check your inbox and follow the instructions.
                    </p>
                    <button
                      onClick={() => switchMode('login')}
                      className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-rose-900/30"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-white mb-1">Forgot your password?</h2>
                    <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
                          required
                        />
                      </div>

                      {error && (
                        <div className="bg-rose-950/50 border border-rose-800 rounded-xl px-4 py-3 text-rose-300 text-sm">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-rose-900/30 mt-2"
                      >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex rounded-xl bg-gray-800 p-1 mb-6">
                  <button
                    onClick={() => switchMode('login')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-rose-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => switchMode('register')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-rose-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-300">Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors pr-12"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-rose-950/50 border border-rose-800 rounded-xl px-4 py-3 text-rose-300 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-rose-900/30 mt-2"
                  >
                    {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                {mode === 'register' && (
                  <p className="text-gray-500 text-xs text-center mt-4">
                    By creating an account you agree to our terms of service and privacy policy.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
