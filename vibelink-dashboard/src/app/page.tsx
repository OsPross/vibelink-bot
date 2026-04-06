'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  
  // Narzędzia do tłumaczeń
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');
  };

  useEffect(() => {
    if (session) {
      setLoadingGuilds(true);
      fetch('/api/guilds')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setGuilds(data);
          setLoadingGuilds(false);
        })
        .catch(() => setLoadingGuilds(false));
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center font-bold text-xl">{t('loading')}</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center py-20 px-4 relative">
      
      {/* Przycisk do zmiany języka */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-4 right-6 text-3xl hover:scale-110 transition-transform"
        title="Zmień język"
      >
        {i18n.language === 'pl' ? '🇬🇧' : '🇵🇱'}
      </button>

      <div className="max-w-5xl w-full flex flex-col items-center gap-8">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
          ⚡ VibeLink Dashboard
        </h1>

        {!session ? (
          <button
            onClick={() => signIn('discord')}
            className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] transition-colors rounded-xl font-bold text-xl mt-10 shadow-lg"
          >
            {t('login_btn')}
          </button>
        ) : (
          <div className="w-full flex flex-col items-center gap-10 mt-6">
            <div className="flex items-center gap-6 p-6 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 w-full max-w-3xl">
              <img 
                src={session.user?.image || ''} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full border-4 border-[#5865F2]"
              />
              <div className="flex-1">
                <h2 className="text-3xl font-bold">{t('welcome', { name: session.user?.name })}</h2>
                <p className="text-gray-400 text-sm">{t('logged_in_sub')}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 transition-colors rounded-lg font-bold shadow-md"
              >
                {t('logout_btn')}
              </button>
            </div>

            <div className="w-full max-w-5xl">
              <h3 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">{t('servers_title')}</h3>
              
              {loadingGuilds ? (
                <p className="text-gray-400 animate-pulse text-lg">{t('loading_servers')}</p>
              ) : guilds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {guilds.map((guild) => (
                    <div key={guild.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-[#5865F2] transition-colors flex flex-col items-center text-center gap-4 shadow-lg">
                      {guild.icon ? (
                        <img 
                          src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} 
                          className="w-20 h-20 rounded-full shadow-md" 
                          alt={guild.name} 
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold shadow-md">
                          {guild.name.charAt(0)}
                        </div>
                      )}
                      <h4 className="font-bold text-lg truncate w-full">{guild.name}</h4>
                      <button 
                        onClick={() => router.push(`/server/${guild.id}`)}
                        className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg font-bold transition-colors shadow-md">
                        {t('manage_btn')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-lg">{t('no_servers')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}