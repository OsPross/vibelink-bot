import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Zarządzanie systemem ticketów')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('sync')
            .setDescription('Wysyła panele ticketów na ustawione kanały')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        // Pobieramy tylko włączone panele z bazy
        const panels = await prisma.ticketPanel.findMany({
            where: { guildId: interaction.guildId!, enabled: true }
        });

        if (panels.length === 0) {
            await interaction.reply({ content: 'Nie masz żadnych włączonych paneli. Skonfiguruj je najpierw na stronie.', ephemeral: true });
            return;
        }

        await interaction.reply({ content: '⏳ Wysyłam panele na kanały...', ephemeral: true });

        for (const panel of panels) {
            // Jak zapomniałeś ustawić kanału w panelu, to bot to olewa
            if (!panel.panelChannelId) continue;
            const channel = interaction.guild?.channels.cache.get(panel.panelChannelId) as TextChannel;
            if (!channel) continue;

            const embed = new VibeEmbed()
                .setTitle(panel.title)
                .setDescription(panel.message)
                .setColor((panel.embedColor as any) || '#5865F2');

            // Dobieranie koloru przycisku
            let btnStyle = ButtonStyle.Primary;
            if (panel.buttonColor === 'Secondary') btnStyle = ButtonStyle.Secondary;
            if (panel.buttonColor === 'Success') btnStyle = ButtonStyle.Success;
            if (panel.buttonColor === 'Danger') btnStyle = ButtonStyle.Danger;

            const button = new ButtonBuilder()
                // Do customId wciskamy ID panelu z bazy, żeby bot wiedział co klika gracz
                .setCustomId(`ticket_create_${panel.id}`)
                .setLabel(panel.buttonText)
                .setStyle(btnStyle);

            if (panel.buttonEmoji) {
                button.setEmoji(panel.buttonEmoji);
            }

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            await channel.send({ embeds: [embed], components: [row] });
        }

        await interaction.editReply({ content: '✅ Wszystkie panele zostały pomyślnie rozsłane!' });
    }
};