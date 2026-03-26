import React, { useState } from 'react';
import useStore from '../store';
import { connectSocket, getBackendUrl } from '../lib/socket';
import { languages, t } from '../i18n';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { 
    setUser, 
    serverType, 
    customServerUrl, 
    useProxy, 
    setServerSettings, 
    language, 
    setLanguage,
    proxySettings,
    setProxySettings
  } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const baseUrl = getBackendUrl();
    
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      setUser(data.user, data.token);
      connectSocket(data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isProxyDisabled = serverType === 'local' || serverType === 'custom';

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 relative overflow-y-auto">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-700"></div>

      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl my-8">
        
        {/* Language Switcher */}
        <div className="absolute top-4 right-4">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Object.values(languages).map(lang => (
              <option key={lang.code} value={lang.code} className="bg-gray-900 text-white">
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-center mb-8 mt-4">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Бебра
          </h1>
          <p className="text-white/60 text-sm tracking-wide uppercase font-semibold">
            Next-Gen Messenger
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">{t(language, 'username')}</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">{t(language, 'password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
            <label className="block text-white/70 text-sm font-medium">{t(language, 'server')}</label>
            <select 
              value={serverType}
              onChange={(e) => setServerSettings({ serverType: e.target.value as any })}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            >
              <option value="main" className="bg-gray-900">{t(language, 'main_server')}</option>
              <option value="local" className="bg-gray-900">{t(language, 'local_server')}</option>
              <option value="custom" className="bg-gray-900">{t(language, 'custom_server')}</option>
            </select>
            
            {serverType === 'custom' && (
              <input
                type="text"
                value={customServerUrl}
                onChange={(e) => setServerSettings({ customServerUrl: e.target.value })}
                placeholder={t(language, 'custom_url')}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
            
            <div className="pt-2 border-t border-white/10">
              <label className="flex items-center space-x-2 text-white/70 text-sm cursor-pointer mb-2">
                <input 
                  type="checkbox"
                  checked={useProxy}
                  disabled={isProxyDisabled}
                  onChange={(e) => setServerSettings({ useProxy: e.target.checked })}
                  className="rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className={isProxyDisabled ? 'opacity-50' : ''}>{t(language, 'proxy')}</span>
              </label>

              {useProxy && !isProxyDisabled && (
                <div className="space-y-2 mt-2">
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder={t(language, 'proxy_host')}
                      value={proxySettings.host}
                      onChange={e => setProxySettings({ host: e.target.value })}
                      className="w-2/3 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                    />
                    <input 
                      type="text" 
                      placeholder={t(language, 'proxy_port')}
                      value={proxySettings.port}
                      onChange={e => setProxySettings({ port: e.target.value })}
                      className="w-1/3 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder={t(language, 'proxy_user')}
                      value={proxySettings.user}
                      onChange={e => setProxySettings({ user: e.target.value })}
                      className="w-1/2 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                    />
                    <input 
                      type="password" 
                      placeholder={t(language, 'proxy_pass')}
                      value={proxySettings.pass}
                      onChange={e => setProxySettings({ pass: e.target.value })}
                      className="w-1/2 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {serverType === 'local' && <p className="text-red-400/80 text-xs mt-1">Недоступно</p>}
              {serverType === 'custom' && <p className="text-yellow-500/80 text-xs mt-1">Недоступно, купите подписку NORM для расширения возможностей</p>}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}

          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-500/25">
            {isLogin ? t(language, 'login') : t(language, 'register')}
          </button>
        </form>

        <p className="mt-6 text-center text-white/50 text-sm">
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            {isLogin ? t(language, 'register') : t(language, 'login')}
          </button>
        </p>
      </div>
    </div>
  );
}
