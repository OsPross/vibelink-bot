import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, panelId: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Won' }, { status: 401 });

    const { panelId } = await params;
    const body = await req.json();
    
    // Filtrujemy opcje, żeby nie wjebać do bazy pustych śmieci
    const optionsToSave = body.options.map((opt: any) => ({
        roleId: opt.roleId,
        label: opt.label,
        emoji: opt.emoji || null,
        style: opt.style
    })).filter((opt: any) => opt.roleId); // Zapisujemy tylko te, co mają wybraną rolę

    const updated = await prisma.rolePanel.update({
        where: { id: panelId },
        data: {
            name: body.name,
            channelId: body.channelId,
            title: body.title,
            description: body.description,
            color: body.color,
            options: {
                deleteMany: {}, // Najpierw wywalamy stare
                create: optionsToSave // Potem wjeżdżają nowe
            }
        },
        include: { options: true }
    });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, panelId: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Won' }, { status: 401 });

    const { panelId } = await params;
    await prisma.rolePanel.delete({ where: { id: panelId } });
    return NextResponse.json({ success: true });
}