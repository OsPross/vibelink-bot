import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });

    const { id } = await params;
    const panels = await prisma.ticketPanel.findMany({ where: { guildId: id } });
    return NextResponse.json(panels);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });

    const { id } = await params;
    const newPanel = await prisma.ticketPanel.create({
        data: { guildId: id, name: "Nowy Panel Ticketów" }
    });
    return NextResponse.json(newPanel);
}