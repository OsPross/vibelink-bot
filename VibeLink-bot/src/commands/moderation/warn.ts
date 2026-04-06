import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient, ActionType } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issue a warning to a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const target = interaction.options.getUser('user')!;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const lng = (await prisma.guild.upsert({ where: { id: interaction.guildId! }, update: {}, create: { id: interaction.guildId! } })).language || 'en';

        await prisma.modAction.create({
            data: { guildId: interaction.guildId!, userId: target.id, moderatorId: interaction.user.id, reason, type: ActionType.WARN }
        });

        const embed = new VibeEmbed().setTitle('⚠️ Warn').setDescription(i18next.t('moderation.action_success', { lng, type: 'WARN', user: target.toString() }) + `\n**${i18next.t('moderation.reason', { lng, reason })}**`);
        await interaction.reply({ embeds: [embed] });
    }
};