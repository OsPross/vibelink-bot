import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Won stąd' }, { status: 401 });

    const { id } = await params;
    
    // Pobieramy parametry z adresu URL (np. ?page=2&limit=10&search=123)
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const search = searchParams.get('search') || '';
    const target = searchParams.get('target') || 'both';

    // Budujemy warunki wyszukiwania dla bazy danych
    const whereClause: any = { guildId: id };

    if (search) {
        const orConditions = [];
        if (target === 'both' || target === 'user') orConditions.push({ userId: { contains: search } });
        if (target === 'both' || target === 'mod') orConditions.push({ moderatorId: { contains: search } });
        orConditions.push({ reason: { contains: search, mode: 'insensitive' } }); // Szukanie w powodzie
        
        whereClause.OR = orConditions;
    }

    // Odpytujemy bazę o całkowitą liczbę i konkretną paczkę danych (skip/take)
    const [totalRecords, actions] = await prisma.$transaction([
        prisma.modAction.count({ where: whereClause }),
        prisma.modAction.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        })
    ]);

    // Teraz pobieramy nicki z Discorda TYLKO dla tych kilku rekordów
    const uniqueIds = Array.from(new Set(actions.flatMap(a => [a.userId, a.moderatorId])));
    const userCache: Record<string, string> = {};
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (botToken) {
        await Promise.all(uniqueIds.map(async (userId) => {
            try {
                const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
                    headers: { Authorization: `Bot ${botToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    userCache[userId] = data.username;
                } else {
                    userCache[userId] = 'Nieznany typ';
                }
            } catch (e) {
                userCache[userId] = 'Błąd API';
            }
        }));
    }

    const enrichedActions = actions.map(action => ({
        ...action,
        userName: userCache[action.userId] || action.userId,
        modName: userCache[action.moderatorId] || action.moderatorId
    }));

    // Zwracamy paczkę danych ORAZ info o całkowitej liczbie stron
    return NextResponse.json({
        data: enrichedActions,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1
    });
}