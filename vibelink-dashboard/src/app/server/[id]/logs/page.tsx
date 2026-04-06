'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function LogsSettings() {
  const { t } = useTranslation();
  const params = useParams();
  const serverId = params?.id as string;

  const [settings, setSettings] = useState({
    logMessageEnabled: false,
    logMessageChannelId: '',
    logVoiceEnabled: false,
    logVoiceChannelId: '',
    logMemberEnabled: false,
    logMemberChannelId: '',
  });
  
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!serverId) return;
    
    Promise.all([
      fetch(`/api/guilds/${serverId}`).then(res => res.json()),
      fetch(`/api/guilds/${serverId}/discord`).then(res => res.json())
    ]).then(([guildData, discordData]) => {
      setSettings({
        logMessageEnabled: guildData.logMessageEnabled || false,
        logMessageChannelId: guildData.logMessageChannelId || '',
        logVoiceEnabled: guildData.logVoiceEnabled || false,
        logVoiceChannelId: guildData.logVoiceChannelId || '',
        logMemberEnabled: guildData.logMemberEnabled || false,
        logMemberChannelId: guildData.logMemberChannelId || '',
      });
      
      if (discordData?.channels && Array.isArray(discordData.channels)) {
        setChannels(discordData.channels.filter((c: any) => c && c.type === 0));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [serverId]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/guilds/${serverId}`, { 
      method: 'PATCH', 
      body: JSON.stringify(settings) 
    });
    setSaving(false);
    alert(t('success_msg'));
  };

  if (loading) return <div className="animate-pulse font-bold text-xl">{t('loading')}</div>;

  return (
    <div className="max-w-4xl flex flex-col gap-8 pb-10">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-purple-600">
        {t('logs.title')}
      </h1>

      <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col gap-8">
        
        {/* LOGI WIADOMOŚCI */}
        <div className="flex flex-col gap-4 border-b border-gray-700 pb-6">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">{t('logs.msg_logs')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.logMessageEnabled} onChange={(e) => setSettings({...settings, logMessageEnabled: e.target.checked})} className="sr-only peer"/>
              <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
          </div>
          {settings.logMessageEnabled && (
            <select value={settings.logMessageChannelId} onChange={(e) => setSettings({...settings, logMessageChannelId: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-red-500">
              <option value="">{t('logs.select_channel')}</option>
              {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          )}
        </div>

        {/* LOGI GŁOSOWE */}
        <div className="flex flex-col gap-4 border-b border-gray-700 pb-6">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">{t('logs.voice_logs')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.logVoiceEnabled} onChange={(e) => setSettings({...settings, logVoiceEnabled: e.target.checked})} className="sr-only peer"/>
              <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
          </div>
          {settings.logVoiceEnabled && (
            <select value={settings.logVoiceChannelId} onChange={(e) => setSettings({...settings, logVoiceChannelId: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-red-500">
              <option value="">{t('logs.select_channel')}</option>
              {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          )}
        </div>

        {/* LOGI UŻYTKOWNIKÓW */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">{t('logs.member_logs')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.logMemberEnabled} onChange={(e) => setSettings({...settings, logMemberEnabled: e.target.checked})} className="sr-only peer"/>
              <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
          </div>
          {settings.logMemberEnabled && (
            <select value={settings.logMemberChannelId} onChange={(e) => setSettings({...settings, logMemberChannelId: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-red-500">
              <option value="">{t('logs.select_channel')}</option>
              {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          )}
        </div>

      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-red-600 to-purple-600 transition-all hover:scale-[1.02] shadow-lg">
        {saving ? t('saving') : t('save_btn')}
      </button>
    </div>
  );
}