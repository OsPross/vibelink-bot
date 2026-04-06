import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Won stąd' }, { status: 401 });

    const { id } = await params;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
        return NextResponse.json({ error: 'Brak tokenu bota w .env' }, { status: 500 });
    }

    try {
        // Uderzamy do Discorda po kanały i role na raz
        const [channelsRes, rolesRes] = await Promise.all([
            fetch(`https://discord.com/api/v10/guilds/${id}/channels`, {
                headers: { Authorization: `Bot ${botToken}` }
            }),
            fetch(`https://discord.com/api/v10/guilds/${id}/roles`, {
                headers: { Authorization: `Bot ${botToken}` }
            })
        ]);

        if (!channelsRes.ok || !rolesRes.ok) {
            return NextResponse.json({ error: 'Błąd API Discorda. Bot jest na serwerze?' }, { status: 400 });
        }

        const rawChannels = await channelsRes.json();
        const rawRoles = await rolesRes.json();

        // Filtrujemy ten syf, żeby na froncie było czysto
        const channels = rawChannels.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type // 0 = Text, 2 = Voice, 4 = Category
        }));

        const roles = rawRoles.map((r: any) => ({
            id: r.id,
            name: r.name,
            color: r.color
        }));

        return NextResponse.json({ channels, roles });

    } catch (err) {
        return NextResponse.json({ error: 'Serwer zajebał fikołka' }, { status: 500 });
    }
}