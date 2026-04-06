import { Events, Message, PermissionFlagsBits, TextChannel } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { VibeEmbed } from '../utils/VibeEmbed';
import i18next from 'i18next';

const prisma = new PrismaClient();
const spamMap = new Map<string, { count: number, timer: NodeJS.Timeout }>();

export const handleMessageCreate = async (message: Message) => {
    if (message.author.bot || !message.guild) return;
    if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;

    const guildData = await prisma.guild.findUnique({
        where: { id: message.guild.id }
    });

    if (!guildData) return;
    const t = i18next.getFixedT(guildData.language || 'pl');

    let shouldDelete = false;
    let punishReason = '';

    if (guildData.antiLinkEnabled) {
        const linkRegex = /(https?:\/\/[^\s]+)/g;
        if (linkRegex.test(message.content)) {
            shouldDelete = true;
            punishReason = t('automod_link');
        }
    }

    if (!shouldDelete && guildData.bannedWords && guildData.bannedWords.trim().length > 0) {
        const words = guildData.bannedWords.split(',').map(w => w.trim().toLowerCase());
        const messageContent = message.content.toLowerCase();
        const containsBannedWord = words.some(word => word.length > 0 && messageContent.includes(word));

        if (containsBannedWord) {
            shouldDelete = true;
            punishReason = t('automod_word');
        }
    }

    if (!shouldDelete && guildData.antiSpamEnabled) {
        const userKey = `${message.guild.id}-${message.author.id}`;
        const userData = spamMap.get(userKey);

        if (userData) {
            userData.count += 1;
            if (userData.count > 5) {
                shouldDelete = true;
                punishReason = t('automod_spam');
                userData.count = 0; 
            }
        } else {
            const timer = setTimeout(() => {
                spamMap.delete(userKey);
            }, 5000);
            spamMap.set(userKey, { count: 1, timer });
        }
    }

    if (shouldDelete) {
        await message.delete().catch(() => {});

        await prisma.modAction.create({
            data: {
                guildId: message.guild.id,
                userId: message.author.id,
                moderatorId: message.client.user.id, 
                type: 'WARN',
                reason: `Auto-Mod: ${punishReason}`
            }
        }).catch(() => {});

        // Wysyłanie loga na specjalny kanał
        if (guildData.autoModLogChannel) {
            const logChannel = message.guild.channels.cache.get(guildData.autoModLogChannel) as TextChannel;
            if (logChannel) {
                const logEmbed = new VibeEmbed()
                    .setTitle(t('automod_log_title'))
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'User', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
                        { name: 'Channel', value: `${message.channel}`, inline: true },
                        { name: 'Reason', value: punishReason, inline: false },
                        { name: 'Message', value: `\`\`\`${message.content.substring(0, 1000)}\`\`\``, inline: false }
                    );
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        } else {
            // Jak nie ma kanału logów, piszemy na czacie i kasujemy po 5s
            const channel = message.channel as TextChannel;
            const warning = await channel.send(`🚨 ${message.author}, ${t('automod_warn')} **(${punishReason})**`);
            setTimeout(() => warning.delete().catch(() => {}), 5000);
        }
    }
};