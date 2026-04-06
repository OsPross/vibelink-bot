'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ReactionRolesSettings() {
  const { t } = useTranslation();
  const params = useParams();
  const serverId = params?.id as string;

  const [panels, setPanels] = useState<any[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<any | null>(null);
  
  const [channels, setChannels] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!serverId) return;
    
    Promise.all([
      fetch(`/api/guilds/${serverId}/roles`).then(res => res.json()),
      fetch(`/api/guilds/${serverId}/discord`).then(res => res.json())
    ]).then(([panelsData, discordData]) => {
      // Zabezpieczenie przed błędami z API
      if (Array.isArray(panelsData)) {
        setPanels(panelsData.filter(p => p !== null));
        if (panelsData.length > 0 && panelsData[0]) setSelectedPanel(panelsData[0]);
      }
      
      if (discordData?.channels && Array.isArray(discordData.channels)) {
        setChannels(discordData.channels.filter((c: any) => c !== null));
      }
      
      if (discordData?.roles && Array.isArray(discordData.roles)) {
        setRoles(discordData.roles.filter((r: any) => r !== null));
      }
      
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [serverId]);

  const handleCreate = async () => {
    const res = await fetch(`/api/guilds/${serverId}/roles`, { method: 'POST' });
    const newPanel = await res.json();
    if (newPanel && newPanel.id) {
      setPanels([...panels, newPanel]);
      setSelectedPanel(newPanel);
    }
  };

  const handleDelete = async (panelId: string) => {
    if (!confirm(t('roles.confirm_delete'))) return;
    await fetch(`/api/guilds/${serverId}/roles/${panelId}`, { method: 'DELETE' });
    const updated = panels.filter(p => p?.id !== panelId);
    setPanels(updated);
    if (selectedPanel?.id === panelId) setSelectedPanel(updated.length > 0 ? updated[0] : null);
  };

  const handleSave = async () => {
    if (!selectedPanel?.id) return;
    setSaving(true);
    const res = await fetch(`/api/guilds/${serverId}/roles/${selectedPanel.id}`, { 
      method: 'PATCH', body: JSON.stringify(selectedPanel) 
    });
    const updatedPanel = await res.json();
    
    if (updatedPanel && updatedPanel.id) {
      setPanels(panels.map(p => p?.id === updatedPanel.id ? updatedPanel : p));
      setSelectedPanel(updatedPanel);
      alert(t('success_msg'));
    }
    setSaving(false);
  };

  const addOption = () => {
    const newOption = { roleId: '', label: 'Nowa Rola', emoji: '', style: 'Primary' };
    setSelectedPanel({ ...selectedPanel, options: [...(selectedPanel?.options || []), newOption] });
  };

  const updateOption = (index: number, key: string, value: string) => {
    if (!selectedPanel?.options) return;
    const newOptions = [...selectedPanel.options];
    newOptions[index][key] = value;
    setSelectedPanel({ ...selectedPanel, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (!selectedPanel?.options) return;
    const newOptions = [...selectedPanel.options];
    newOptions.splice(index, 1);
    setSelectedPanel({ ...selectedPanel, options: newOptions });
  };

  if (loading) return <div className="animate-pulse font-bold text-xl">{t('loading')}</div>;

  return (
    <div className="max-w-6xl flex flex-col lg:flex-row gap-8 pb-10">
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{t('roles.your_panels')}</h2>
        {panels?.map((panel: any) => (
          <div key={panel?.id} onClick={() => setSelectedPanel(panel)} className={`p-4 rounded-xl cursor-pointer border-2 flex justify-between items-center ${selectedPanel?.id === panel?.id ? 'border-pink-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
            <p className="font-bold">{panel?.name || 'Brak nazwy'}</p>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(panel?.id); }} className="text-red-500 hover:text-red-400 font-bold p-2">X</button>
          </div>
        ))}
        <button onClick={handleCreate} className="mt-2 py-3 rounded-xl font-bold bg-gray-800 border border-dashed border-gray-500 hover:bg-gray-700">{t('roles.add_panel')}</button>
      </div>

      <div className="w-full lg:w-2/3">
        {!selectedPanel ? (
          <div className="bg-gray-800 p-8 rounded-3xl text-center text-gray-400">{t('roles.no_panel')}</div>
        ) : (
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 flex flex-col gap-6">
            <input type="text" value={selectedPanel?.name || ''} onChange={(e) => setSelectedPanel({...selectedPanel, name: e.target.value})} className="bg-transparent text-2xl font-bold outline-none text-white border-b border-transparent focus:border-pink-500"/>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase">{t('roles.channel')}</label>
              <select value={selectedPanel?.channelId || ''} onChange={(e) => setSelectedPanel({...selectedPanel, channelId: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-pink-500">
                <option value="">-- Wybierz Kanał --</option>
                {channels?.filter((c: any) => c && c.type === 0).map((c: any) => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">{t('roles.embed_title')}</label>
                <input type="text" value={selectedPanel?.title || ''} onChange={(e) => setSelectedPanel({...selectedPanel, title: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-pink-500"/>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">{t('roles.color')}</label>
                <div className="flex gap-2">
                  <input type="color" value={selectedPanel?.color || '#5865F2'} onChange={(e) => setSelectedPanel({...selectedPanel, color: e.target.value})} className="h-12 w-16 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer"/>
                  <input type="text" value={selectedPanel?.color || '#5865F2'} onChange={(e) => setSelectedPanel({...selectedPanel, color: e.target.value})} className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none font-mono uppercase"/>
                </div>
              </div>
            </div>
            
            <textarea value={selectedPanel?.description || ''} onChange={(e) => setSelectedPanel({...selectedPanel, description: e.target.value})} className="bg-gray-900 border border-gray-700 p-4 rounded-xl h-24 outline-none focus:border-pink-500" placeholder={t('roles.desc_placeholder')}></textarea>

            <div className="border-t border-gray-700 pt-6">
              <h3 className="font-bold text-lg mb-4">{t('roles.buttons_title')}</h3>
              <div className="flex flex-col gap-4">
                {selectedPanel?.options?.map((opt: any, idx: number) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 bg-gray-900 p-3 rounded-xl border border-gray-700">
                    <select value={opt?.roleId || ''} onChange={(e) => updateOption(idx, 'roleId', e.target.value)} className="bg-gray-800 p-2 rounded flex-1 min-w-[150px] outline-none">
                      <option value="">{t('roles.btn_role')}</option>
                      {roles?.filter((r: any) => r && r.name !== '@everyone').map((r: any) => <option key={r.id} value={r.id}>@{r.name}</option>)}
                    </select>
                    <input type="text" value={opt?.label || ''} onChange={(e) => updateOption(idx, 'label', e.target.value)} placeholder={t('roles.btn_label')} className="bg-gray-800 p-2 rounded w-32 outline-none"/>
                    <input type="text" value={opt?.emoji || ''} onChange={(e) => updateOption(idx, 'emoji', e.target.value)} placeholder={t('roles.btn_emoji')} className="bg-gray-800 p-2 rounded w-24 outline-none"/>
                    <select value={opt?.style || 'Primary'} onChange={(e) => updateOption(idx, 'style', e.target.value)} className="bg-gray-800 p-2 rounded outline-none">
                      <option value="Primary">Primary (Blue)</option>
                      <option value="Secondary">Secondary (Grey)</option>
                      <option value="Success">Success (Green)</option>
                      <option value="Danger">Danger (Red)</option>
                    </select>
                    <button onClick={() => removeOption(idx)} className="text-red-500 font-bold p-2 hover:bg-gray-800 rounded">X</button>
                  </div>
                ))}
              </div>
              <button onClick={addOption} className="mt-4 bg-gray-700 p-2 rounded text-sm hover:bg-gray-600 font-bold w-max">{t('roles.add_btn')}</button>
            </div>
          </div>
        )}
        <button onClick={handleSave} disabled={saving || !selectedPanel} className={`w-full mt-6 py-4 rounded-2xl font-black transition-all shadow-lg ${!selectedPanel ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02] active:scale-95'}`}>{saving ? t('roles.saving') : t('roles.save')}</button>
      </div>
    </div>
  );
}