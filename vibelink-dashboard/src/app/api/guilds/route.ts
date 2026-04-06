import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
    // Wyciągamy token z sesji
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.accessToken) {
        return NextResponse.json({ error: 'Nie jesteś zalogowany' }, { status: 401 });
    }

    // Uderzamy do Discorda po twoje serwery
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
            Authorization: `Bearer ${token.accessToken}`,
        },
    });

    if (!response.ok) {
        return NextResponse.json({ error: 'Discord odrzucił zapytanie' }, { status: response.status });
    }

    const guilds = await response.json();

    // Magia bitowa. Odcedzamy gówno od złota. 
    // Zostawiamy tylko serwery, gdzie masz uprawnienie Administrator (0x8) lub Manage Server (0x20)
    const adminGuilds = guilds.filter((guild: any) => 
        (guild.permissions & 0x8) === 0x8 || (guild.permissions & 0x20) === 0x20
    );

    return NextResponse.json(adminGuilds);
}