'use client';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const serverId = params.id as string;
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');
  };

  const navItems = [
    { name: t('sidebar.general'), path: `/server/${serverId}` },
    { name: t('sidebar.welcome'), path: `/server/${serverId}/welcome` },
    { name: t('sidebar.voice'), path: `/server/${serverId}/voice` },
    { name: t('sidebar.automod'), path: `/server/${serverId}/automod` },
    { name: t('sidebar.tickets'), path: `/server/${serverId}/tickets` },
    { name: t('sidebar.roles'), path: `/server/${serverId}/roles` },
    { name: t('sidebar.logs'), path: `/server/${serverId}/logs` }, // <--- TO DODAJ
    { name: t('sidebar.history'), path: `/server/${serverId}/history` },
  ];

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className="w-72 bg-gray-950 border-r border-gray-800 p-6 flex flex-col gap-6 relative">
        <button onClick={toggleLanguage} className="absolute top-6 right-6 text-2xl hover:scale-110 transition-transform">
          {i18n.language === 'pl' ? '🇬🇧' : '🇵🇱'}
        </button>
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">VibeLink</h2>
          <p className="text-gray-500 text-xs font-mono mt-1">ID: {serverId}</p>
        </div>
        <nav className="flex flex-col gap-2 flex-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button key={item.path} onClick={() => router.push(item.path)} className={`flex items-center text-left px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-[#5865F2] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                {item.name}
              </button>
            );
          })}
        </nav>
        <button onClick={() => router.push('/')} className="mt-auto px-4 py-3 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl font-bold transition-colors">
          {t('sidebar.back')}
        </button>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">{children}</main>
    </div>
  );
}