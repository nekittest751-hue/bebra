import React, { useRef, useState } from 'react';
import { X, Camera, Save, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import useStore from '../store';
import { getBackendUrl } from '../lib/socket';
import { languages, t } from '../i18n';

export function UserProfile({ onClose }: { onClose: () => void }) {
  const { 
    user, 
    token, 
    updateUserProfile, 
    language, 
    setLanguage, 
    serverType, 
    setServerSettings, 
    customServerUrl, 
    useProxy, 
    proxySettings, 
    setProxySettings 
  } = useStore();
  
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'network' | 'appearance'>('profile');
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseUrl = getBackendUrl();
  const isNorm = user?.subscription === 'NORM';
  const isProxyDisabled = serverType === 'local' || (serverType === 'custom' && !isNorm);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // We can do client-side resizing via canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            (img.width - size) / 2, (img.height - size) / 2, size, size, // src
            0, 0, 400, 400 // dest
          );
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name, { type: 'image/webp' });
              setAvatarFile(newFile);
              setAvatarPreview(URL.createObjectURL(blob));
              setRemoveAvatar(false);
            }
          }, 'image/webp', 0.8);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (nickname !== user?.nickname) formData.append('nickname', nickname);
      if (removeAvatar) formData.append('removeAvatar', 'true');
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch(`${baseUrl}/api/user/profile`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateUserProfile(updatedUser.id, updatedUser.nickname, updatedUser.avatar);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            <span>{t(language, 'settings')}</span>
          </h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 p-2 bg-black/20 border-b border-white/5">
          {[
            { id: 'profile', label: t(language, 'profile') },
            { id: 'network', label: t(language, 'network') },
            { id: 'appearance', label: t(language, 'appearance') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/60 hover:bg-white/5'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : user?.avatar && !removeAvatar ? (
                      <img src={`${baseUrl}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-white/50">{user?.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
                </div>
                
                <div className="flex space-x-3">
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors">
                    {t(language, 'upload_avatar')}
                  </button>
                  <button onClick={handleRemoveAvatar} className="text-xs bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-1">
                    <Trash2 className="w-3 h-3" />
                    <span>{t(language, 'remove_avatar')}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-1">{t(language, 'nickname')}</label>
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={user?.username}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                <h4 className="text-indigo-300 font-semibold mb-1 text-sm">{t(language, 'norm_status')}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Текущий план: <strong className={isNorm ? 'text-indigo-400' : 'text-gray-400'}>{isNorm ? t(language, 'norm') : t(language, 'free')}</strong></span>
                  {!isNorm && <button className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg transition-colors">{t(language, 'buy_norm')}</button>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-1">{t(language, 'server')}</label>
                <select 
                  value={serverType}
                  onChange={(e) => setServerSettings({ serverType: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="main" className="bg-gray-900">{t(language, 'main_server')}</option>
                  <option value="local" className="bg-gray-900">{t(language, 'local_server')}</option>
                  <option value="custom" className="bg-gray-900">{t(language, 'custom_server')}</option>
                </select>
              </div>

              {serverType === 'custom' && (
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-1">{t(language, 'custom_url')}</label>
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => setServerSettings({ customServerUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
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

                {serverType === 'local' && <p className="text-red-400/80 text-xs">Недоступно</p>}
                {serverType === 'custom' && !isNorm && <p className="text-yellow-500/80 text-xs">Недоступно, купите подписку NORM для расширения возможностей</p>}

                {useProxy && !isProxyDisabled && (
                  <div className="space-y-3 mt-3">
                    <div className="flex space-x-3">
                      <input type="text" placeholder={t(language, 'proxy_host')} value={proxySettings.host} onChange={e => setProxySettings({ host: e.target.value })} className="flex-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                      <input type="text" placeholder={t(language, 'proxy_port')} value={proxySettings.port} onChange={e => setProxySettings({ port: e.target.value })} className="flex-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div className="flex space-x-3">
                      <input type="text" placeholder={t(language, 'proxy_user')} value={proxySettings.user} onChange={e => setProxySettings({ user: e.target.value })} className="flex-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                      <input type="password" placeholder={t(language, 'proxy_pass')} value={proxySettings.pass} onChange={e => setProxySettings({ pass: e.target.value })} className="flex-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-1">{t(language, 'language')}</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.values(languages).map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-gray-900">{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 transition-colors">
            {t(language, 'close')}
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-indigo-500/20"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            <span>{t(language, 'save')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
