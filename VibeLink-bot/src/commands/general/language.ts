import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Zmienia język bota na serwerze / Changes the bot language')
        .addStringOption(opt => opt
            .setName('lang')
            .setDescription('Wybierz język / Choose language')
            .setRequired(true)
            .addChoices(
                { name: 'Polski 🇵🇱', value: 'pl' },
                { name: 'English 🇬🇧', value: 'en' }
            )
        )
        // Tylko admin może tym mieszać
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const newLang = interaction.options.getString('lang')!;
        const guildId = interaction.guildId!;

        // Aktualizujemy bazę
        await prisma.guild.upsert({
            where: { id: guildId },
            update: { language: newLang },
            create: { id: guildId, language: newLang }
        });

        // Generujemy chamski komunikat w wybranym języku
        const msg = newLang === 'pl' 
            ? 'Zrozumiano. Od teraz wypluwam wszystkie teksty po polsku.' 
            : 'Understood. Switching to English, you wanker.';

        const embed = new VibeEmbed()
            .setTitle('🌍 Language Update')
            .setDescription(msg);

        await interaction.reply({ embeds: [embed] });
    }
};