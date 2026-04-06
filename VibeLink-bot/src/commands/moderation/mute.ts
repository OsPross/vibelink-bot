import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient, ActionType } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user (Timeout)')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutes').setDescription('Duration in minutes').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const target = interaction.options.getMember('user') as GuildMember;
        const minutes = interaction.options.getInteger('minutes')!;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const lng = (await prisma.guild.findUnique({ where: { id: interaction.guildId! } }))?.language || 'en';

        if (!target) { await interaction.reply({ content: i18next.t('moderation.not_found', { lng }), ephemeral: true }); return; }

        await target.timeout(minutes * 60 * 1000, reason);
        await prisma.modAction.create({ data: { guildId: interaction.guildId!, userId: target.id, moderatorId: interaction.user.id, reason, type: ActionType.MUTE } });

        const embed = new VibeEmbed().setTitle('🔇 Mute').setDescription(i18next.t('moderation.action_success', { lng, type: 'MUTE', user: target.toString() }));
        await interaction.reply({ embeds: [embed] });
    }
};