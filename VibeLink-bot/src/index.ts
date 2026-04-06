import { 
    Client, GatewayIntentBits, Partials, Events, Collection, REST, Routes,
    ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel 
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as discordTranscripts from 'discord-html-transcripts';
import { Command } from './types/Command';
import { handleMemberAdd } from './events/guildMemberAdd';
import { handleVoiceStateUpdate } from './events/voiceStateUpdate';
import { handleMessageCreate } from './events/messageCreate';

// Importy nowego modułu logów
import { handleMessageDelete, handleMessageUpdate, handleVoiceLogs, handleMemberUpdate } from './events/logger';

dotenv.config();

const prisma = new PrismaClient();
const redis = createClient({ url: process.env.REDIS_URL });

redis.on('error', (err) => console.log('❌ Błąd Redis:', err));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

const commands = new Collection<string, Command>();
const commandsData: any[] = [];

async function initI18n() {
    await i18next.use(Backend).init({
        initImmediate: false,
        fallbackLng: 'en',
        preload: ['en', 'pl'],
        backend: { loadPath: path.join(__dirname, 'locales', '{{lng}}.json') },
        interpolation: { escapeValue: false }
    });
    console.log('✅ i18next załadowane pomyślnie.');
}

function loadCommands() {
    const foldersPath = path.join(__dirname, 'commands');
    if (!fs.existsSync(foldersPath)) return;
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            delete require.cache[require.resolve(filePath)];
            const { command } = require(filePath);
            if (command) {
                commands.set(command.data.name, command);
                commandsData.push(command.data.toJSON());
            }
        }
    }
}

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Zalogowano jako: ${readyClient.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
    try {
        if (process.env.TEST_GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(readyClient.user.id, process.env.TEST_GUILD_ID), { body: commandsData });
            console.log('✅ Komendy (/) zaktualizowane NATYCHMIAST.');
        } else {
            await rest.put(Routes.applicationCommands(readyClient.user.id), { body: commandsData });
        }
    } catch (e) { console.error(e); }
});

// Stare eventy
client.on(Events.GuildMemberAdd, handleMemberAdd);
client.on(Events.MessageCreate, handleMessageCreate);

// Podpięte eventy Wielkiego Brata (Logi)
client.on(Events.MessageDelete, handleMessageDelete);
client.on(Events.MessageUpdate, handleMessageUpdate);
client.on(Events.GuildMemberUpdate, handleMemberUpdate);

// Odpalamy stary Auto-Voice i nowe Logi w jednym
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    await handleVoiceStateUpdate(oldState, newState);
    await handleVoiceLogs(oldState, newState);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (command) await command.execute(interaction, client);
        return;
    }

    if (interaction.isButton()) {
        const { customId } = interaction;
        const guildData = await prisma.guild.findUnique({ where: { id: interaction.guildId! } });
        const t = i18next.getFixedT(guildData?.language || 'pl');

        // --- NADAWANIE / ZABIERANIE ROLI ---
        if (customId.startsWith('role_add_')) {
            const roleId = customId.replace('role_add_', '');
            const member = interaction.member as any;
            const role = interaction.guild?.roles.cache.get(roleId);

            if (!role) {
                await interaction.reply({ content: t('role_not_found'), ephemeral: true });
                return;
            }

            if (member.roles.cache.has(roleId)) {
                try {
                    await member.roles.remove(roleId);
                    await interaction.reply({ content: t('role_removed', { role: role.name }), ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: t('role_remove_err'), ephemeral: true });
                }
            } else {
                try {
                    await member.roles.add(roleId);
                    await interaction.reply({ content: t('role_added', { role: role.name }), ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: t('role_add_err'), ephemeral: true });
                }
            }
            return;
        }

        // --- TWORZENIE TICKETA ---
        if (customId.startsWith('ticket_create_')) {
            const panelId = customId.replace('ticket_create_', '');
            
            const panel = await prisma.ticketPanel.findUnique({ where: { id: panelId } });
            if (!panel) {
                await interaction.reply({ content: t('ticket_panel_not_found'), ephemeral: true });
                return;
            }

            const guild = interaction.guild!;
            const channelName = `ticket-${interaction.user.username}`;

            const permissionOverwrites: any[] = [
                {
                    id: guild.id, 
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
                {
                    id: guild.client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
                }
            ];

            if (panel.supportRoleIds) {
                const roles = panel.supportRoleIds.split(',');
                for (const roleId of roles) {
                    if (roleId) {
                        permissionOverwrites.push({
                            id: roleId,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        });
                    }
                }
            }

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: panel.categoryId || null,
                topic: `${interaction.user.id}|${panel.id}`,
                permissionOverwrites
            });

            const welcomeEmbed = {
                title: '🎫 ' + panel.title,
                description: t('ticket_welcome_desc', { user: `<@${interaction.user.id}>` }),
                color: parseInt((panel.embedColor as string).replace('#', ''), 16)
            };

            const closeBtn = new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel(t('ticket_close_btn'))
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeBtn);

            const pingSupport = panel.supportRoleIds ? panel.supportRoleIds.split(',').filter(r => r).map((r: string) => `<@&${r}>`).join(' ') : '';
            
            await ticketChannel.send({
                content: pingSupport,
                embeds: [welcomeEmbed],
                components: [row]
            });

            await interaction.reply({ content: t('ticket_created_success', { channel: ticketChannel.toString() }), ephemeral: true });
        }

        // --- ZAMYKANIE TICKETA I TRANSKRYPCJA ---
        if (customId === 'ticket_close') {
            const channel = interaction.channel as TextChannel;
            const topic = channel.topic;
            
            if (!topic || !topic.includes('|')) {
                await interaction.reply({ content: t('ticket_wrong_channel'), ephemeral: true });
                return;
            }

            await interaction.reply({ content: t('ticket_closing') });

            const [userId, panelId] = topic.split('|');
            const panel = await prisma.ticketPanel.findUnique({ where: { id: panelId } });

            if (panel && panel.transcriptEnabled) {
                const attachment = await discordTranscripts.createTranscript(channel, {
                    limit: -1,
                    returnType: discordTranscripts.ExportReturnType.Attachment,
                    filename: `${channel.name}.html`,
                    saveImages: true,
                    poweredBy: false
                });

                const transcriptEmbed = {
                    title: t('ticket_transcript_title'),
                    color: 0x2f3136,
                    fields: [
                        { name: t('ticket_transcript_name'), value: channel.name, inline: true },
                        { name: t('ticket_transcript_creator'), value: `<@${userId}>`, inline: true },
                        { name: t('ticket_transcript_closer'), value: `<@${interaction.user.id}>`, inline: true }
                    ]
                };

                if (panel.transcriptChannelId) {
                    const logChannel = interaction.guild?.channels.cache.get(panel.transcriptChannelId) as TextChannel;
                    if (logChannel) {
                        await logChannel.send({ embeds: [transcriptEmbed], files: [attachment] }).catch(() => {});
                    }
                }

                if (panel.transcriptDmEnabled) {
                    try {
                        const targetUser = await interaction.client.users.fetch(userId);
                        if (targetUser) await targetUser.send({ embeds: [transcriptEmbed], files: [attachment] });
                    } catch (e) {
                        // Zablokowane DM - ignorujemy
                    }
                }
            }

            setTimeout(() => channel.delete().catch(() => {}), 3000);
        }
    }
});

async function bootstrap() {
    try {
        await redis.connect();
        await initI18n();
        loadCommands();
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) { console.error(error); }
}

bootstrap();