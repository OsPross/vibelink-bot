import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient, ActionType } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove timeout from a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const target = interaction.options.getMember('user') as GuildMember;
        const lng = (await prisma.guild.findUnique({ where: { id: interaction.guildId! } }))?.language || 'en';

        if (!target) { 
            await interaction.reply({ content: i18next.t('moderation.not_found', { lng }), ephemeral: true }); 
            return; 
        }

        // SPRAWDZENIE: Czy typ w ogóle ma karę?
        const isMuted = target.communicationDisabledUntilTimestamp && target.communicationDisabledUntilTimestamp > Date.now();
        
        if (!isMuted) {
            await interaction.reply({ 
                content: i18next.t('moderation.not_muted', { lng }), 
                ephemeral: true 
            });
            return;
        }

        // Zdejmujemy knebel
        await target.timeout(null);

        // Dopiero teraz wpisujemy do bazy
        await prisma.modAction.create({ 
            data: { 
                guildId: interaction.guildId!, 
                userId: target.id, 
                moderatorId: interaction.user.id, 
                reason: 'Manual Unmute', 
                type: ActionType.UNMUTE 
            } 
        });

        const embed = new VibeEmbed()
            .setTitle('🔊 Unmute')
            .setDescription(i18next.t('moderation.unmute_success', { lng, user: target.toString() }));

        await interaction.reply({ embeds: [embed] });
    }
};