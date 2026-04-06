import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('Sprawdza kartotekę gracza / Checks user criminal record')
        .addUserOption(option => 
            option.setName('user')
            .setDescription('Kogo prześwietlamy? / Who are we checking?')
            .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('page')
            .setDescription('Numer strony / Page number (default: 1)')
            .setRequired(false)
            .setMinValue(1)
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const targetUser = interaction.options.getUser('user', true);
        const page = interaction.options.getInteger('page') || 1;
        const limit = 10;

        // Pobieramy dane serwera, żeby wiedzieć w jakim języku do nich gadać
        const guildData = await prisma.guild.findUnique({
            where: { id: interaction.guildId! }
        });
        const t = i18next.getFixedT(guildData?.language || 'pl');

        const allActions = await prisma.modAction.findMany({
            where: {
                guildId: interaction.guildId!,
                userId: targetUser.id
            },
            orderBy: { createdAt: 'desc' }
        });

        if (allActions.length === 0) {
            await interaction.reply({ 
                content: t('cmd_history_clean', { user: targetUser.username }), 
                ephemeral: true 
            });
            return;
        }

        const warns = allActions.filter(a => a.type === 'WARN').length;
        const mutes = allActions.filter(a => a.type === 'MUTE').length;
        const bans = allActions.filter(a => a.type === 'BAN').length;
        const kicks = allActions.filter(a => a.type === 'KICK').length;

        const totalPages = Math.ceil(allActions.length / limit);
        const actualPage = page > totalPages ? totalPages : page;
        const paginatedActions = allActions.slice((actualPage - 1) * limit, actualPage * limit);

        const historyText = paginatedActions.map(action => {
            return `**[${action.type}]** ID: ${action.id} | Mod: <@${action.moderatorId}> | ${t('cmd_history_reason')}: ${action.reason}`;
        }).join('\n');

        const statsText = t('cmd_history_stats', { warns, mutes, kicks, bans });

        const embed = new VibeEmbed()
            .setTitle(t('cmd_history_title', { user: targetUser.username }))
            .setThumbnail(targetUser.displayAvatarURL())
            .setDescription(`${statsText}\n\n${historyText}`)
            .setFooter({ text: t('cmd_history_footer', { page: actualPage, totalPages, total: allActions.length }) });

        await interaction.reply({ embeds: [embed] });
    }
};