'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function WelcomeSettings() {
  const { t } = useTranslation();
  const params = useParams();
  const serverId = params.id as string;

  const [settings, setSettings] = useState({
    welcomeEnabled: false,
    welcomeChannel: '',
    welcomeMessage: 'Siema {user} na serwerze!',
    welcomeImage: '',
    welcomeColor: '#5865F2'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/guilds/${serverId}`).then(res => res.json()).then(data => {
      setSettings({
        welcomeEnabled: data.welcomeEnabled || false,
        welcomeChannel: data.welcomeChannel || '',
        welcomeMessage: data.welcomeMessage || 'Siema {user} na serwerze!',
        welcomeImage: data.welcomeImage || '',
        welcomeColor: data.welcomeColor || '#5865F2'
      });
      setLoading(false);
    });
  }, [serverId]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/guilds/${serverId}`, { method: 'PATCH', body: JSON.stringify(settings) });
    setSaving(false);
    alert(t('success_msg'));
  };

  if (loading) return <div className="animate-pulse font-bold text-xl">{t('loading')}</div>;

  return (
    <div className="max-w-6xl flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          {t('welcome.title')}
        </h1>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={settings.welcomeEnabled} onChange={(e) => setSettings({...settings, welcomeEnabled: e.target.checked})} className="sr-only peer"/>
          <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
          <span className="ml-3 text-sm font-bold uppercase">{settings.welcomeEnabled ? t('welcome.enabled') : t('welcome.disabled')}</span>
        </label>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 transition-opacity ${settings.welcomeEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        
        {/* Formularz */}
        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">{t('welcome.channel_label')}</label>
            <input type="text" value={settings.welcomeChannel} onChange={(e) => setSettings({...settings, welcomeChannel: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none font-mono"/>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">{t('welcome.color_label')}</label>
            <div className="flex gap-3">
              <input type="color" value={settings.welcomeColor} onChange={(e) => setSettings({...settings, welcomeColor: e.target.value})} className="h-12 w-20 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer"/>
              <input type="text" value={settings.welcomeColor} onChange={(e) => setSettings({...settings, welcomeColor: e.target.value})} className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-xl font-mono uppercase"/>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">{t('welcome.image_label')}</label>
            <input type="text" value={settings.welcomeImage} onChange={(e) => setSettings({...settings, welcomeImage: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none"/>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">{t('welcome.message_label')}</label>
            <p className="text-[10px] text-gray-500">{t('welcome.tags_info', { user: '{user}', server: '{server}' })}</p>
            <textarea value={settings.welcomeMessage} onChange={(e) => setSettings({...settings, welcomeMessage: e.target.value})} className="bg-gray-900 border border-gray-700 p-4 rounded-xl h-32 outline-none focus:border-blue-500"/>
          </div>
        </div>

        {/* Podgląd LIVE */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-gray-400 uppercase text-center">{t('welcome.preview')}</label>
          <div className="bg-[#313338] p-4 rounded-lg shadow-inner border border-black/20">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#5865F2] rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold italic">Vibe</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">VibeLink</span>
                  <span className="bg-[#5865F2] text-[10px] px-1 rounded-sm font-bold">BOT</span>
                  <span className="text-gray-400 text-[10px]">Dzisiaj o 21:37</span>
                </div>
                
                <div className="bg-[#2b2d31] border-l-4 rounded-r-md overflow-hidden max-w-[432px]" style={{ borderLeftColor: settings.welcomeColor }}>
                  <div className="p-3">
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">
                      {settings.welcomeMessage.replace('{user}', '@Oskar').replace('{server}', 'VibeServer')}
                    </p>
                  </div>
                  {settings.welcomeImage && (
                    <img 
                      src={settings.welcomeImage} 
                      alt="preview" 
                      className="w-full h-48 object-cover mt-1"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wyciągnięty przycisk zapisu! Zawsze klikalny! */}
      <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-green-600 to-blue-600 transition-transform active:scale-95 shadow-lg">
        {saving ? t('saving') : t('save_btn')}
      </button>

    </div>
  );
}