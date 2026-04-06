'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function TicketSettings() {
  const { t } = useTranslation();
  const params = useParams();
  const serverId = params.id as string;

  const [panels, setPanels] = useState<any[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<any | null>(null);
  
  const [channels, setChannels] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/guilds/${serverId}/tickets`).then(res => res.json()),
      fetch(`/api/guilds/${serverId}/discord`).then(res => res.json())
    ]).then(([panelsData, discordData]) => {
      setPanels(panelsData);
      if (discordData.channels) setChannels(discordData.channels);
      if (discordData.roles) setRoles(discordData.roles);
      if (panelsData.length > 0) setSelectedPanel(panelsData[0]);
      setLoading(false);
    });
  }, [serverId]);

  const handleCreatePanel = async () => {
    const res = await fetch(`/api/guilds/${serverId}/tickets`, { method: 'POST' });
    const newPanel = await res.json();
    setPanels([...panels, newPanel]);
    setSelectedPanel(newPanel);
  };

  const handleDeletePanel = async (panelId: string) => {
    if (!confirm(t('tickets.confirm_delete'))) return;
    await fetch(`/api/guilds/${serverId}/tickets/${panelId}`, { method: 'DELETE' });
    const updated = panels.filter(p => p.id !== panelId);
    setPanels(updated);
    if (selectedPanel?.id === panelId) setSelectedPanel(updated.length > 0 ? updated[0] : null);
  };

  const handleSave = async () => {
    if (!selectedPanel) return;
    setSaving(true);
    await fetch(`/api/guilds/${serverId}/tickets/${selectedPanel.id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(selectedPanel) 
    });
    
    setPanels(panels.map(p => p.id === selectedPanel.id ? selectedPanel : p));
    setSaving(false);
    alert(t('success_msg'));
  };

  const handleRoleToggle = (roleId: string) => {
    let currentRoles = selectedPanel.supportRoleIds ? selectedPanel.supportRoleIds.split(',') : [];
    if (currentRoles.includes(roleId)) {
      currentRoles = currentRoles.filter((id: string) => id !== roleId);
    } else {
      currentRoles.push(roleId);
    }
    setSelectedPanel({ ...selectedPanel, supportRoleIds: currentRoles.join(',') });
  };

  if (loading) return <div className="animate-pulse font-bold text-xl">{t('loading')}</div>;

  return (
    <div className="max-w-6xl flex flex-col lg:flex-row gap-8 pb-10">
      
      {/* LEWA STRONA - LISTA PANELI */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">{t('tickets.your_panels')}</h2>
        
        {panels.map(panel => (
          <div 
            key={panel.id} 
            onClick={() => setSelectedPanel(panel)}
            className={`p-4 rounded-xl cursor-pointer transition-all border-2 flex justify-between items-center ${selectedPanel?.id === panel.id ? 'border-teal-500 bg-gray-800' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}
          >
            <div>
              <p className="font-bold">{panel.name}</p>
              <p className="text-xs text-gray-400">{panel.enabled ? t('tickets.enabled') : t('tickets.disabled')}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDeletePanel(panel.id); }} className="text-red-500 hover:text-red-400 font-bold p-2">X</button>
          </div>
        ))}

        <button onClick={handleCreatePanel} className="mt-2 py-3 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-500 transition-colors">
          {t('tickets.add_panel')}
        </button>
      </div>

      {/* PRAWA STRONA - EDYCJA */}
      <div className="w-full lg:w-2/3">
        {!selectedPanel ? (
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 text-center text-gray-400">
            {t('tickets.no_panel_selected')}
          </div>
        ) : (
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl flex flex-col gap-6">
            
            {/* GÓRNY PASEK Z NAZWĄ I WŁĄCZNIKIEM */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <input 
                type="text" 
                value={selectedPanel.name} 
                onChange={(e) => setSelectedPanel({...selectedPanel, name: e.target.value})} 
                className="bg-transparent text-2xl font-bold outline-none text-white border-b border-transparent focus:border-teal-500 transition-colors"
              />
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={selectedPanel.enabled} onChange={(e) => setSelectedPanel({...selectedPanel, enabled: e.target.checked})} className="sr-only peer"/>
                <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-teal-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
              </label>
            </div>

            <div className={`flex flex-col gap-6 transition-opacity ${selectedPanel.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              
              {/* KANAŁY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.channel_label')}</label>
                  <select 
                    value={selectedPanel.panelChannelId} 
                    onChange={(e) => setSelectedPanel({...selectedPanel, panelChannelId: e.target.value})}
                    className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-teal-500"
                  >
                    <option value="">-- Wybierz --</option>
                    {channels.filter(c => c.type === 0).map(c => (
                      <option key={c.id} value={c.id}>#{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.category_label')}</label>
                  <select 
                    value={selectedPanel.categoryId} 
                    onChange={(e) => setSelectedPanel({...selectedPanel, categoryId: e.target.value})}
                    className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-teal-500"
                  >
                    <option value="">-- Wybierz --</option>
                    {channels.filter(c => c.type === 4).map(c => (
                      <option key={c.id} value={c.id}>📁 {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROLE WSPARCIA */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.role_label')}</label>
                <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                  {roles.filter(r => r.name !== '@everyone').map(role => {
                    const isChecked = selectedPanel.supportRoleIds?.includes(role.id);
                    return (
                      <label key={role.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleRoleToggle(role.id)}
                          className="w-4 h-4 accent-teal-500 cursor-pointer"
                        />
                        <span className="text-sm font-bold truncate" style={{ color: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#fff' }}>
                          @{role.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* WYGLĄD EMBEDA I PRZYCISKU */}
              <div className="flex flex-col gap-4 mt-2 border-t border-gray-700 pt-6">
                <h3 className="font-bold text-lg">{t('tickets.embed_and_button')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.embed_title_label')}</label>
                    <input type="text" value={selectedPanel.title} onChange={(e) => setSelectedPanel({...selectedPanel, title: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-teal-500"/>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.embed_color_label')}</label>
                    <div className="flex gap-2">
                      <input type="color" value={selectedPanel.embedColor} onChange={(e) => setSelectedPanel({...selectedPanel, embedColor: e.target.value})} className="h-12 w-16 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer"/>
                      <input type="text" value={selectedPanel.embedColor} onChange={(e) => setSelectedPanel({...selectedPanel, embedColor: e.target.value})} className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none font-mono uppercase"/>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.embed_desc_label')}</label>
                  <textarea value={selectedPanel.message} onChange={(e) => setSelectedPanel({...selectedPanel, message: e.target.value})} className="bg-gray-900 border border-gray-700 p-4 rounded-xl h-24 outline-none focus:border-teal-500"/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.button_text_label')}</label>
                    <input type="text" value={selectedPanel.buttonText} onChange={(e) => setSelectedPanel({...selectedPanel, buttonText: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-teal-500"/>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.button_emoji_label')}</label>
                    <input type="text" value={selectedPanel.buttonEmoji} onChange={(e) => setSelectedPanel({...selectedPanel, buttonEmoji: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-teal-500"/>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">{t('tickets.button_color_label')}</label>
                    <select value={selectedPanel.buttonColor} onChange={(e) => setSelectedPanel({...selectedPanel, buttonColor: e.target.value})} className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-teal-500">
                      <option value="Primary">{t('tickets.btn_primary')}</option>
                      <option value="Secondary">{t('tickets.btn_secondary')}</option>
                      <option value="Success">{t('tickets.btn_success')}</option>
                      <option value="Danger">{t('tickets.btn_danger')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TRANSKRYPCJE */}
              <div className="flex flex-col gap-4 mt-2 border-t border-gray-700 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{t('tickets.transcript_title')}</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={selectedPanel.transcriptEnabled} onChange={(e) => setSelectedPanel({...selectedPanel, transcriptEnabled: e.target.checked})} className="sr-only peer"/>
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-teal-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                {selectedPanel.transcriptEnabled && (
                  <div className="grid grid-cols-1 gap-4">
                    <select 
                      value={selectedPanel.transcriptChannelId} 
                      onChange={(e) => setSelectedPanel({...selectedPanel, transcriptChannelId: e.target.value})}
                      className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-teal-500"
                    >
                      <option value="">{t('tickets.transcript_channel')}</option>
                      {channels.filter(c => c.type === 0).map(c => (
                        <option key={c.id} value={c.id}>#{c.name}</option>
                      ))}
                    </select>
                    
                    <label className="flex items-center gap-3 cursor-pointer mt-2">
                      <input 
                        type="checkbox" 
                        checked={selectedPanel.transcriptDmEnabled} 
                        onChange={(e) => setSelectedPanel({...selectedPanel, transcriptDmEnabled: e.target.checked})}
                        className="w-5 h-5 accent-teal-500 cursor-pointer"
                      />
                      <span className="font-bold text-sm text-gray-300">{t('tickets.transcript_dm')}</span>
                    </label>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
        
        <button 
          onClick={handleSave} 
          disabled={saving || !selectedPanel} 
          className={`w-full mt-6 py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${!selectedPanel ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-teal-500 hover:scale-[1.02] active:scale-95'}`}
        >
          {saving ? t('saving') : t('save_btn')}
        </button>
      </div>

    </div>
  );
}