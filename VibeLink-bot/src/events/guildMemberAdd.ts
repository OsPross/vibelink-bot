import { Events, GuildMember, TextChannel } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { VibeEmbed } from '../utils/VibeEmbed';

const prisma = new PrismaClient();

export const handleMemberAdd = async (member: GuildMember) => {
    // Szukamy ustawień serwera w bazie
    const guildData = await prisma.guild.findUnique({
        where: { id: member.guild.id }
    });

    // Jak wyłączone na stronie albo brak kanału, to nara
    if (!guildData?.welcomeEnabled || !guildData.welcomeChannel) return;

    const channel = member.guild.channels.cache.get(guildData.welcomeChannel) as TextChannel;
    if (!channel) return;

    // Personalizacja: zamieniamy {user} i {server}
    const finalMessage = guildData.welcomeMessage
        .replace('{user}', `<@${member.user.id}>`)
        .replace('{server}', member.guild.name);

    // Składamy customowy embed
    const welcomeEmbed = new VibeEmbed()
        .setTitle('👋 New Member!')
        .setDescription(finalMessage)
        .setColor((guildData.welcomeColor as any) || '#5865F2') // Kolor z panelu
        .setThumbnail(member.user.displayAvatarURL());

    // Jak wpisałeś URL obrazka w panelu, to go ładujemy jako tło
    if (guildData.welcomeImage) {
        welcomeEmbed.setImage(guildData.welcomeImage);
    }

    await channel.send({ embeds: [welcomeEmbed] });
};