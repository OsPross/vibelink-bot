'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function VoiceSettings() {
  const { t } = useTranslation();
  const params = useParams();
  const serverId = params.id as string;

  const [settings, setSettings] = useState({
    voiceSetupEnabled: false,
    voiceSetupChannelId: '',
    voiceSetupCategoryId: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/guilds/${serverId}`).then(res => res.json()).then(data => {
      setSettings({
        voiceSetupEnabled: data.voiceSetupEnabled || false,
        voiceSetupChannelId: data.voiceSetupChannelId || '',
        voiceSetupCategoryId: data.voiceSetupCategoryId || ''
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
    <div className="max-w-2xl flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          {t('voice.title')}
        </h1>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={settings.voiceSetupEnabled} onChange={(e) => setSettings({...settings, voiceSetupEnabled: e.target.checked})} className="sr-only peer"/>
          <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
        </label>
      </div>

      <div className={`bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col gap-6 transition-opacity ${settings.voiceSetupEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase">{t('voice.channel_label')}</label>
          <input 
            type="text" 
            value={settings.voiceSetupChannelId} 
            onChange={(e) => setSettings({...settings, voiceSetupChannelId: e.target.value})} 
            placeholder={t('voice.placeholder_channel')}
            className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none font-mono"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase">{t('voice.category_label')}</label>
          <input 
            type="text" 
            value={settings.voiceSetupCategoryId} 
            onChange={(e) => setSettings({...settings, voiceSetupCategoryId: e.target.value})} 
            placeholder={t('voice.placeholder_category')}
            className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none font-mono"
          />
        </div>
      </div>

      {/* Wyciągnięty przycisk zapisu! */}
      <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-blue-600 to-purple-600 transition-all hover:scale-[1.02] shadow-lg">
        {saving ? t('saving') : t('save_btn')}
      </button>

    </div>
  );
}