import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient, ActionType } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Remove a warning from history by ID')
        .addIntegerOption(opt => opt.setName('id').setDescription('Action ID from /history').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const actionId = interaction.options.getInteger('id')!;
        const lng = (await prisma.guild.findUnique({ where: { id: interaction.guildId! } }))?.language || 'en';

        const action = await prisma.modAction.findFirst({ where: { id: actionId, guildId: interaction.guildId!, type: ActionType.WARN } });
        
        if (!action) { 
            await interaction.reply({ content: i18next.t('moderation.not_found', { lng }), ephemeral: true }); 
            return; 
        }

        await prisma.modAction.delete({ where: { id: actionId } });
        await prisma.modAction.create({ data: { guildId: interaction.guildId!, userId: action.userId, moderatorId: interaction.user.id, reason: `Unwarn #${actionId}`, type: ActionType.UNWARN } });

        const embed = new VibeEmbed()
            .setTitle('🧼 Unwarn')
            .setDescription(i18next.t('moderation.unwarn_success', { lng, id: actionId, user: `<@${action.userId}>` }));

        await interaction.reply({ embeds: [embed] });
    }
};