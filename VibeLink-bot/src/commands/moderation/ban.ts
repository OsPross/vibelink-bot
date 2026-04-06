import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient, ActionType } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const target = interaction.options.getUser('user')!;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const lng = (await prisma.guild.findUnique({ where: { id: interaction.guildId! } }))?.language || 'en';

        try {
            await interaction.guild?.members.ban(target, { reason });
            await prisma.modAction.create({ data: { guildId: interaction.guildId!, userId: target.id, moderatorId: interaction.user.id, reason, type: ActionType.BAN } });

            const embed = new VibeEmbed().setTitle('🔨 Ban').setDescription(i18next.t('moderation.action_success', { lng, type: 'BAN', user: target.toString() }));
            await interaction.reply({ embeds: [embed] });
        } catch (e) {
            await interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });
        }
    }
};