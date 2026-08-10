import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { name?: string; email?: string };
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [email, setEmail] = useState('teacher@sufal.com'); // Pre-filled for MVP testing
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const storeAuthData = (data: LoginResponse) => {
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('userName', data.user.name || '');
    localStorage.setItem('userEmail', data.user.email || '');
    navigate('/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Assuming your Vite proxy routes /api to the Express server
      const response = await axios.post('/api/v1/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      // Store the token for subsequent protected API calls.
      // The centralized apiClient interceptor reads these keys
      // to attach the Authorization header automatically.
      storeAuthData({ accessToken, refreshToken, user });

      // Route to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      setError('Google sign-in did not return a credential. Please try again.');
      return;
    }
    setError('');
    setIsGoogleLoading(true);
    try {
      const response = await axios.post('/api/v1/auth/google', { credential });
      const { accessToken, refreshToken, user } = response.data;
      storeAuthData({ accessToken, refreshToken, user });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Google sign-in failed. Please try again.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900/40 backdrop-blur-xl p-8 rounded-xl shadow-lg glow-border">

        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-100">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your SufalPhysicsForum dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 rounded-md placeholder-slate-500 text-slate-100 bg-slate-900/60 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 rounded-md placeholder-slate-500 text-slate-100 bg-slate-900/60 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-slate-950 bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {googleClientId && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-400">or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              {isGoogleLoading ? (
                <div className="w-full flex justify-center py-2.5">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() =>
                    setError('Google sign-in failed. Please try again.')
                  }
                  theme="outline"
                  shape="rectangular"
                  text="continue_with"
                  width="100%"
                />
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-4">
          <Link to="/" className="text-sm font-medium text-yellow-400 hover:text-yellow-300">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
