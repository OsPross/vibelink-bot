import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, MessageFlags } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Zarządzanie panelami ról / Role panels management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('sync')
            .setDescription('Wysyła panele ról na ustawione kanały / Sends role panels to channels')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        // Pobieramy język serwera
        const guildData = await prisma.guild.findUnique({ where: { id: interaction.guildId! } });
        const t = i18next.getFixedT(guildData?.language || 'pl');

        const panels = await prisma.rolePanel.findMany({
            where: { guildId: interaction.guildId! },
            include: { options: true }
        });

        if (panels.length === 0) {
            await interaction.reply({ content: t('role_sync_empty'), flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.reply({ content: t('role_sync_loading'), flags: MessageFlags.Ephemeral });

        for (const panel of panels) {
            if (!panel.channelId || panel.options.length === 0) continue;
            const channel = interaction.guild?.channels.cache.get(panel.channelId) as TextChannel;
            if (!channel) continue;

            const embed = new VibeEmbed()
                .setTitle(panel.title)
                .setDescription(panel.description)
                .setColor((panel.color as any) || '#5865F2');

            const components: ActionRowBuilder<ButtonBuilder>[] = [];
            let currentRow = new ActionRowBuilder<ButtonBuilder>();

            panel.options.forEach((opt, index) => {
                if (index > 0 && index % 5 === 0) {
                    components.push(currentRow);
                    currentRow = new ActionRowBuilder<ButtonBuilder>();
                }

                let btnStyle = ButtonStyle.Primary;
                if (opt.style === 'Secondary') btnStyle = ButtonStyle.Secondary;
                if (opt.style === 'Success') btnStyle = ButtonStyle.Success;
                if (opt.style === 'Danger') btnStyle = ButtonStyle.Danger;

                const button = new ButtonBuilder()
                    .setCustomId(`role_add_${opt.roleId}`)
                    .setLabel(opt.label || 'Rola')
                    .setStyle(btnStyle);

                if (opt.emoji && opt.emoji.trim() !== '') {
                    try {
                        button.setEmoji(opt.emoji.trim());
                    } catch (e) {
                        console.log(`[UWAGA] Zjebana emotka w panelu: ${opt.emoji}`);
                    }
                }
                
                currentRow.addComponents(button);
            });
            
            components.push(currentRow);

            try {
                await channel.send({ embeds: [embed], components });
            } catch (err: any) {
                console.error(`Błąd przy wysyłaniu panelu: ${err.message}`);
                await interaction.followUp({ content: t('role_sync_error', { panel: panel.name }), flags: MessageFlags.Ephemeral });
            }
        }

        await interaction.editReply({ content: t('role_sync_success') });
    }
};