'use client';

import { SessionProvider } from 'next-auth/react';
import '../lib/i18n'; // Wgrywamy tłumaczenia na starcie

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return <SessionProvider>{children}</SessionProvider>;
};