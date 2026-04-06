import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, panelId: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });

    const { panelId } = await params;
    const body = await req.json();
    
    const updated = await prisma.ticketPanel.update({
        where: { id: panelId },
        data: body
    });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, panelId: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });

    const { panelId } = await params;
    await prisma.ticketPanel.delete({ where: { id: panelId } });
    return NextResponse.json({ success: true });
}