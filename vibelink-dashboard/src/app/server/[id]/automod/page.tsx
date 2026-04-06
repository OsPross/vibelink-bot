'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AutoModSettings() {
  const { t } = useTranslation();
  const params = useParams();
  const serverId = params.id as string;

  const [settings, setSettings] = useState({
    antiLinkEnabled: false,
    antiSpamEnabled: false,
    bannedWords: '',
    autoModLogChannel: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/guilds/${serverId}`).then(res => res.json()).then(data => {
      setSettings({
        antiLinkEnabled: data.antiLinkEnabled || false,
        antiSpamEnabled: data.antiSpamEnabled || false,
        bannedWords: data.bannedWords || '',
        autoModLogChannel: data.autoModLogChannel || ''
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
    <div className="max-w-3xl flex flex-col gap-8 pb-10">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
        {t('automod.title')}
      </h1>

      <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col gap-8">
        
        {/* Kanał Logów */}
        <div className="flex flex-col gap-2 border-b border-gray-700 pb-6">
          <label className="text-sm font-bold text-gray-400 uppercase">ID Kanału Logów Auto-Moda</label>
          <input 
            type="text" 
            value={settings.autoModLogChannel} 
            onChange={(e) => setSettings({...settings, autoModLogChannel: e.target.value})} 
            placeholder="Gdzie bot ma rzucać warny z Auto-Moda..."
            className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none font-mono focus:border-red-500"
          />
        </div>

        {/* Anty-Link */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-6">
          <div>
            <h2 className="text-xl font-bold">{t('automod.antilink')}</h2>
            <p className="text-sm text-gray-400">{t('automod.antilink_desc')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.antiLinkEnabled} onChange={(e) => setSettings({...settings, antiLinkEnabled: e.target.checked})} className="sr-only peer"/>
            <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
          </label>
        </div>

        {/* Anty-Spam */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-6">
          <div>
            <h2 className="text-xl font-bold">{t('automod.antispam')}</h2>
            <p className="text-sm text-gray-400">{t('automod.antispam_desc')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.antiSpamEnabled} onChange={(e) => setSettings({...settings, antiSpamEnabled: e.target.checked})} className="sr-only peer"/>
            <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
          </label>
        </div>

        {/* Blacklista Słów */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-400 uppercase">{t('automod.banned_words')}</label>
          <textarea 
            value={settings.bannedWords}
            onChange={(e) => setSettings({...settings, bannedWords: e.target.value})}
            placeholder={t('automod.banned_words_placeholder')}
            className="bg-gray-900 border border-gray-700 p-4 rounded-xl h-32 outline-none focus:border-red-500 font-mono transition-colors"
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-red-600 to-yellow-600 transition-all hover:scale-[1.02] shadow-lg">
        {saving ? t('saving') : t('save_btn')}
      </button>
    </div>
  );
}