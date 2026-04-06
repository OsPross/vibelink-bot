import { Message, PartialMessage, VoiceState, GuildMember, PartialGuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

// 1. Logi Wiadomości - Usunięcie
export async function handleMessageDelete(message: Message | PartialMessage) {
    if (message.author?.bot || !message.guild) return;

    const guildData = await prisma.guild.findUnique({ where: { id: message.guild.id } });
    if (!guildData?.logMessageEnabled || !guildData?.logMessageChannelId) return;

    const channel = message.guild.channels.cache.get(guildData.logMessageChannelId) as TextChannel;
    if (!channel) return;

    const t = i18next.getFixedT(guildData.language || 'pl');
    const authorText = message.author ? `<@${message.author.id}> (${message.author.tag})` : t('logger_unknown');

    const embed = new EmbedBuilder()
        .setTitle(t('logger_msg_del_title'))
        .setColor('#ED4245')
        .addFields(
            { name: t('logger_msg_author'), value: authorText, inline: true },
            { name: t('logger_msg_channel'), value: `<#${message.channel.id}>`, inline: true },
            { name: t('logger_msg_content'), value: message.content || t('logger_msg_no_content') }
        )
        .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
}

// 2. Logi Wiadomości - Edycja
export async function handleMessageUpdate(oldMsg: Message | PartialMessage, newMsg: Message | PartialMessage) {
    if (newMsg.author?.bot || !newMsg.guild) return;
    if (oldMsg.content === newMsg.content) return; // Discord łapie to też jak wczytuje miniaturkę z linku

    const guildData = await prisma.guild.findUnique({ where: { id: newMsg.guild.id } });
    if (!guildData?.logMessageEnabled || !guildData?.logMessageChannelId) return;

    const channel = newMsg.guild.channels.cache.get(guildData.logMessageChannelId) as TextChannel;
    if (!channel) return;

    const t = i18next.getFixedT(guildData.language || 'pl');
    const authorText = newMsg.author ? `<@${newMsg.author.id}>` : t('logger_unknown');

    const embed = new EmbedBuilder()
        .setTitle(t('logger_msg_edit_title'))
        .setColor('#FEE75C')
        .addFields(
            { name: t('logger_msg_author'), value: authorText, inline: true },
            { name: t('logger_msg_channel'), value: `<#${newMsg.channel.id}>`, inline: true },
            { name: t('logger_msg_before'), value: oldMsg.content || '*Brak*' },
            { name: t('logger_msg_after'), value: newMsg.content || '*Brak*' },
            { name: t('logger_msg_link'), value: `[${t('logger_msg_jump')}](${newMsg.url})` }
        )
        .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
}

// 3. Logi Głosowe - Wejścia, Wyjścia, Przenosiny
export async function handleVoiceLogs(oldState: VoiceState, newState: VoiceState) {
    if (oldState.member?.user.bot) return;

    const guildData = await prisma.guild.findUnique({ where: { id: newState.guild.id } });
    if (!guildData?.logVoiceEnabled || !guildData?.logVoiceChannelId) return;

    const channel = newState.guild.channels.cache.get(guildData.logVoiceChannelId) as TextChannel;
    if (!channel) return;

    const t = i18next.getFixedT(guildData.language || 'pl');
    const embed = new EmbedBuilder().setTimestamp();
    const userTag = newState.member?.user.tag || oldState.member?.user.tag || t('logger_unknown');

    if (!oldState.channelId && newState.channelId) {
        embed.setTitle(t('logger_vc_join'))
             .setColor('#57F287')
             .setDescription(t('logger_vc_join_desc', { user: userTag, channel: newState.channelId }));
    } else if (oldState.channelId && !newState.channelId) {
        embed.setTitle(t('logger_vc_leave'))
             .setColor('#ED4245')
             .setDescription(t('logger_vc_leave_desc', { user: userTag, channel: oldState.channelId }));
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        embed.setTitle(t('logger_vc_move'))
             .setColor('#5865F2')
             .setDescription(t('logger_vc_move_desc', { user: userTag, old: oldState.channelId, new: newState.channelId }));
    } else {
        return; // Tylko mutowanie/odmutowanie - olewamy
    }

    await channel.send({ embeds: [embed] }).catch(() => {});
}

// 4. Logi Użytkowników - Rólki i Nicki
export async function handleMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    if (newMember.user.bot) return;

    const guildData = await prisma.guild.findUnique({ where: { id: newMember.guild.id } });
    if (!guildData?.logMemberEnabled || !guildData?.logMemberChannelId) return;

    const channel = newMember.guild.channels.cache.get(guildData.logMemberChannelId) as TextChannel;
    if (!channel) return;

    const t = i18next.getFixedT(guildData.language || 'pl');

    // Różnica w rolach
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

        if (addedRoles.size > 0) {
            const embed = new EmbedBuilder()
                .setTitle(t('logger_role_add'))
                .setColor('#57F287')
                .setDescription(t('logger_role_add_desc', { user: newMember.user.tag, roles: addedRoles.map(r => `<@&${r.id}>`).join(', ') }))
                .setTimestamp();
            await channel.send({ embeds: [embed] }).catch(() => {});
        }

        if (removedRoles.size > 0) {
            const embed = new EmbedBuilder()
                .setTitle(t('logger_role_rem'))
                .setColor('#ED4245')
                .setDescription(t('logger_role_rem_desc', { user: newMember.user.tag, roles: removedRoles.map(r => `<@&${r.id}>`).join(', ') }))
                .setTimestamp();
            await channel.send({ embeds: [embed] }).catch(() => {});
        }
    }

    // Różnica w nicku
    if (oldMember.nickname !== newMember.nickname) {
        const embed = new EmbedBuilder()
            .setTitle(t('logger_nick_title'))
            .setColor('#FEE75C')
            .addFields(
                { name: t('logger_nick_user'), value: `<@${newMember.id}>` },
                { name: t('logger_nick_old'), value: oldMember.nickname || t('logger_nick_default') },
                { name: t('logger_nick_new'), value: newMember.nickname || t('logger_nick_default') }
            )
            .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(() => {});
    }
}