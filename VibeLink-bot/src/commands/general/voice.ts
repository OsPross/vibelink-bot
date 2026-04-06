import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, VoiceChannel, Client } from 'discord.js';
import { Command } from '../../types/Command';
import { VibeEmbed } from '../../utils/VibeEmbed';
import { PrismaClient } from '@prisma/client';
import i18next from 'i18next';

const prisma = new PrismaClient();

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Zarządzaj swoim kanałem głosowym')
        .addSubcommand(sub => sub.setName('lock').setDescription('Zamyka kanał dla zjebów z zewnątrz'))
        .addSubcommand(sub => sub.setName('unlock').setDescription('Otwiera kanał dla każdego'))
        .addSubcommand(sub => 
            sub.setName('kick')
               .setDescription('Wykopuje kogoś z Twojego kanału')
               .addUserOption(opt => opt.setName('user').setDescription('Kogo wywalić?').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('limit')
               .setDescription('Ustawia limit osób (0 = brak limitu)')
               .addIntegerOption(opt => opt.setName('amount').setDescription('Ilość osób (0-99)').setRequired(true).setMinValue(0).setMaxValue(99))
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel as VoiceChannel;
        const guildId = interaction.guildId!;

        // Pobieramy język serwera z bazy
        const guildData = await prisma.guild.upsert({
            where: { id: guildId },
            update: {},
            create: { id: guildId }
        });
        const lng = guildData.language || 'en';

        if (!voiceChannel) {
            await interaction.reply({ content: i18next.t('voice.not_in_vc', { lng }), ephemeral: true });
            return;
        }

        const perms = voiceChannel.permissionsFor(interaction.user);
        if (!perms || !perms.has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ content: i18next.t('voice.not_your_channel', { lng }), ephemeral: true });
            return;
        }

        const action = interaction.options.getSubcommand();
        const embed = new VibeEmbed();

        try {
            if (action === 'lock') {
                await voiceChannel.permissionOverwrites.edit(interaction.guild?.roles.everyone!, { Connect: false });
                embed.setTitle(i18next.t('voice.lock_title', { lng })).setDescription(i18next.t('voice.lock_desc', { lng }));
            } 
            
            else if (action === 'unlock') {
                await voiceChannel.permissionOverwrites.edit(interaction.guild?.roles.everyone!, { Connect: true });
                embed.setTitle(i18next.t('voice.unlock_title', { lng })).setDescription(i18next.t('voice.unlock_desc', { lng }));
            }

            else if (action === 'kick') {
                const target = interaction.options.getMember('user') as GuildMember;

                if (!target || !target.voice.channel || target.voice.channel.id !== voiceChannel.id) {
                    await interaction.reply({ content: i18next.t('voice.kick_not_here', { lng }), ephemeral: true });
                    return;
                }

                if (target.id === interaction.user.id) {
                    await interaction.reply({ content: i18next.t('voice.kick_self', { lng }), ephemeral: true });
                    return;
                }

                await target.voice.disconnect(i18next.t('voice.kick_reason', { lng }));
                embed.setTitle(i18next.t('voice.kick_title', { lng })).setDescription(i18next.t('voice.kick_desc', { lng, user: target.toString() }));
            }

            else if (action === 'limit') {
                const amount = interaction.options.getInteger('amount')!;
                await voiceChannel.setUserLimit(amount);
                
                if (amount === 0) {
                    embed.setTitle(i18next.t('voice.limit_none_title', { lng })).setDescription(i18next.t('voice.limit_none_desc', { lng }));
                } else {
                    embed.setTitle(i18next.t('voice.limit_set_title', { lng })).setDescription(i18next.t('voice.limit_set_desc', { lng, amount }));
                }
            }

            await interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: i18next.t('voice.error', { lng }), ephemeral: true });
        }
    }
};