import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient, ActionType } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Wypierdala użytkownika z serwera.')
        .addUserOption(opt => opt.setName('user').setDescription('Ofiara').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Za co?').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const target = interaction.options.getMember('user') as GuildMember;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const lng = (await prisma.guild.findUnique({ where: { id: interaction.guildId! } }))?.language || 'en';

        if (!target || !target.kickable) {
            await interaction.reply({ content: 'Nie mogę wywalić tego typa. Może ma wyższą rolę?', ephemeral: true });
            return;
        }

        await target.kick(reason);
        await prisma.modAction.create({
            data: { guildId: interaction.guildId!, userId: target.id, moderatorId: interaction.user.id, reason, type: ActionType.KICK }
        });

        const embed = new VibeEmbed().setTitle('👞 Kick!').setDescription(i18next.t('moderation.action_success', { lng, type: 'KICK', user: target.toString() }));
        await interaction.reply({ embeds: [embed] });
    }
};