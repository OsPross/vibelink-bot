'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export default function HistoryPage() {
  const { t } = useTranslation();
  const params = useParams();
  const serverId = params.id as string;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  // Stany
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<'both' | 'user' | 'mod'>('both');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Funkcja pobierająca dane z nowymi parametrami URL
  const fetchLogs = useCallback(() => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: searchQuery,
      target: searchTarget
    });

    fetch(`/api/guilds/${serverId}/history?${queryParams.toString()}`)
      .then(res => res.json())
      .then(resData => {
        setLogs(resData.data || []);
        setTotalPages(resData.totalPages || 1);
        setLoading(false);
      });
  }, [serverId, page, limit, searchQuery, searchTarget]);

  // Odpalaj pobieranie za każdym razem, gdy zmienisz stronę, limit, lub tekst
  useEffect(() => {
    // Opóźnienie na wpisywanie w wyszukiwarkę (żeby nie srało zapytaniami z każdą literką)
    const timeoutId = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchLogs]);

  const handleCopy = (id: string, cellKey: string) => {
    navigator.clipboard.writeText(id);
    setCopiedCell(cellKey);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1); // Powrót na pierwszą stronę przy nowym szukaniu
  };

  return (
    <div className="max-w-6xl flex flex-col gap-6">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
        {t('history.title')}
      </h1>

      <p className="text-gray-400 text-sm font-bold bg-gray-800/50 w-fit px-4 py-2 rounded-lg border border-gray-700">
        {t('history.click_to_copy')}
      </p>

      {/* PASEK NARZĘDZI */}
      <div className="flex flex-col md:flex-row gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg items-center">
        <input 
          type="text" 
          placeholder="Szukaj po ID lub powodzie..." // <- Info dla użytkownika
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-lg outline-none focus:border-orange-500 transition-colors"
        />
        
        <select 
          value={searchTarget}
          onChange={(e) => { setSearchTarget(e.target.value as any); setPage(1); }}
          className="bg-gray-900 border border-gray-700 p-3 rounded-lg outline-none focus:border-orange-500 transition-colors"
        >
          <option value="both">{t('history.target_both')}</option>
          <option value="user">{t('history.target_user')}</option>
          <option value="mod">{t('history.target_mod')}</option>
        </select>

        <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
          <span className="text-sm font-bold text-gray-400">{t('history.rows_per_page')}</span>
          <select 
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="bg-gray-900 border border-gray-700 p-2 rounded-lg outline-none focus:border-orange-500 transition-colors"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col relative min-h-[300px]">
        {/* Spinner ładowania */}
        {loading && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}

        {logs.length === 0 && !loading ? (
          <div className="p-10 text-center text-gray-400 font-bold text-lg">
            {searchQuery ? t('history.no_results') : t('history.no_records')}
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700 text-gray-400 text-xs uppercase tracking-widest">
                  <th className="p-4">{t('history.col_type')}</th>
                  <th className="p-4">{t('history.col_user')}</th>
                  <th className="p-4">{t('history.col_mod')}</th>
                  <th className="p-4">{t('history.col_reason')}</th>
                  <th className="p-4">{t('history.col_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-bold">
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.type === 'BAN' ? 'bg-red-500/20 text-red-400' :
                        log.type === 'KICK' ? 'bg-orange-500/20 text-orange-400' :
                        log.type === 'MUTE' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    
                    <td className="p-4 text-sm text-gray-300">
                      <span 
                        onClick={() => handleCopy(log.userId, `${log.id}-user`)}
                        title={`ID: ${log.userId}`} 
                        className="cursor-pointer border-b border-dashed border-gray-500 hover:text-white hover:bg-gray-700 px-1 py-0.5 rounded transition-colors"
                      >
                        @{log.userName}
                      </span>
                      {copiedCell === `${log.id}-user` && (
                        <span className="ml-2 text-xs font-bold text-green-400 animate-pulse">{t('history.copied')}</span>
                      )}
                    </td>
                    
                    <td className="p-4 text-sm text-gray-300">
                      <span 
                        onClick={() => handleCopy(log.moderatorId, `${log.id}-mod`)}
                        title={`ID: ${log.moderatorId}`} 
                        className="cursor-pointer border-b border-dashed border-gray-500 hover:text-white hover:bg-gray-700 px-1 py-0.5 rounded transition-colors"
                      >
                        @{log.modName}
                      </span>
                      {copiedCell === `${log.id}-mod` && (
                        <span className="ml-2 text-xs font-bold text-green-400 animate-pulse">{t('history.copied')}</span>
                      )}
                    </td>

                    <td className="p-4 text-sm text-gray-200 truncate max-w-xs">{log.reason}</td>
                    <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(undefined, { 
                        year: 'numeric', month: '2-digit', day: '2-digit', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOLNY PASEK PAGINACJI */}
        <div className="bg-gray-900 border-t border-gray-700 p-4 flex justify-between items-center text-sm mt-auto">
          <span className="text-gray-400 font-bold">
            {t('history.page')} <span className="text-white">{page}</span> {t('history.of')} <span className="text-white">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
            >
              ◀
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}