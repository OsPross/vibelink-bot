import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const guild = await prisma.guild.upsert({
        where: { id: id },
        update: {},
        create: { id: id }
    });
    return NextResponse.json(guild);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Won stąd, nie jesteś zalogowany' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.guild.update({
        where: { id: id },
        data: {
            language: body.language,
            welcomeEnabled: body.welcomeEnabled,
            welcomeChannel: body.welcomeChannel,
            welcomeMessage: body.welcomeMessage,
            welcomeImage: body.welcomeImage,
            welcomeColor: body.welcomeColor,
            voiceSetupEnabled: body.voiceSetupEnabled,
            voiceSetupChannelId: body.voiceSetupChannelId,
            voiceSetupCategoryId: body.voiceSetupCategoryId,
            // Nowe śmieci od Auto-Moda
            antiLinkEnabled: body.antiLinkEnabled,
            antiSpamEnabled: body.antiSpamEnabled,
            bannedWords: body.bannedWords,
            autoModLogChannel: body.autoModLogChannel,
            ticketEnabled: body.ticketEnabled,
            ticketChannelId: body.ticketChannelId,
            ticketCategoryId: body.ticketCategoryId,
            ticketSupportRoleId: body.ticketSupportRoleId,
            ticketTitle: body.ticketTitle,
            ticketMessage: body.ticketMessage,
            logMessageEnabled: body.logMessageEnabled,
            logMessageChannelId: body.logMessageChannelId,
            logVoiceEnabled: body.logVoiceEnabled,
            logVoiceChannelId: body.logVoiceChannelId,
            logMemberEnabled: body.logMemberEnabled,
            logMemberChannelId: body.logMemberChannelId
        }
    });

    return NextResponse.json(updated);
}