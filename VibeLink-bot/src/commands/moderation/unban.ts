import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient, ActionType } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user by their ID')
        .addStringOption(opt => opt.setName('id').setDescription('User ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const userId = interaction.options.getString('id')!;
        const lng = (await prisma.guild.findUnique({ where: { id: interaction.guildId! } }))?.language || 'en';

        try {
            await interaction.guild?.members.unban(userId);
            await prisma.modAction.create({ data: { guildId: interaction.guildId!, userId, moderatorId: interaction.user.id, reason: 'Manual Unban', type: ActionType.UNBAN } });
            
            const embed = new VibeEmbed()
                .setTitle('🕊️ Unban')
                .setDescription(i18next.t('moderation.unban_success', { lng, id: userId }));
                
            await interaction.reply({ embeds: [embed] });
        } catch (e) {
            await interaction.reply({ content: i18next.t('moderation.not_found', { lng }), ephemeral: true });
        }
    }
};