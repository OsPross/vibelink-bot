import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Sprawdza latencję bota i udowadnia, że ten skurwiel żyje.'),
        
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        // Wstępny embed, żeby Discord nie zesrał się o timeout (masz 3 sekundy na odpowiedź)
        const initialEmbed = new VibeEmbed()
            .setTitle('🏓 Pingowanie...')
            .setDescription('Czekaj, mierzę opóźnienie serwerów...');

        // Wysyłamy i od razu pobieramy tę wysłaną wiadomość do zmiennej
        const sent = await interaction.reply({ embeds: [initialEmbed], fetchReply: true });
        
        // Matematyka z podstawówki: czas utworzenia wiadomości - czas wysłania komendy
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency = client.ws.ping; 

        // Aktualizujemy wysłaną już wiadomość gotowymi wynikami
        const resultEmbed = new VibeEmbed()
            .setTitle('🏓 Pong!')
            .setDescription(`**Opóźnienie API:** ${roundtripLatency}ms\n**Opóźnienie WebSocket:** ${wsLatency === -1 ? 'Jeszcze liczy...' : wsLatency + 'ms'}\n\nOdbiór i bez odbioru.`);

        await interaction.editReply({ embeds: [resultEmbed] });
    }
};