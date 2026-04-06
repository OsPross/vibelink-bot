'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function GeneralSettings() {
  const params = useParams();
  const { t } = useTranslation();
  const serverId = params.id as string;

  const [settings, setSettings] = useState({ language: 'pl' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/guilds/${serverId}`).then(res => res.json()).then(data => {
      setSettings({ language: data.language || 'pl' });
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
    <div className="max-w-2xl flex flex-col gap-8">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        {t('general.title')}
      </h1>
      <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('general.language_label')}</label>
          <select value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors">
            <option value="pl">Polski 🇵🇱</option>
            <option value="en">English 🇬🇧</option>
          </select>
        </div>
        <button onClick={handleSave} disabled={saving} className="mt-4 py-4 rounded-2xl font-black text-xl transition-all shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] active:scale-95">
          {saving ? t('saving') : t('save_btn')}
        </button>
      </div>
    </div>
  );
}