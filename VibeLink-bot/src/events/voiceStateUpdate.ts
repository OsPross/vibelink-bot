import { VoiceState, ChannelType, PermissionFlagsBits } from 'discord.js';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(() => {});
const prisma = new PrismaClient();

export const handleVoiceStateUpdate = async (oldState: VoiceState, newState: VoiceState) => {
    const user = newState.member?.user;
    const guild = newState.guild;

    // Pobieramy config serwera
    const guildData = await prisma.guild.findUnique({
        where: { id: guild.id }
    });

    // Jak wyłączone w panelu to bot ma na to wyjebane
    if (!guildData?.voiceSetupEnabled || !guildData.voiceSetupChannelId) return;

    // Tworzenie kanału - sprawdzamy ID "matki" z bazy
    if (newState.channelId === guildData.voiceSetupChannelId) {
        try {
            const newChannel = await guild.channels.create({
                name: `🔊 ${user?.username}'s Room`,
                type: ChannelType.GuildVoice,
                parent: guildData.voiceSetupCategoryId || null, // Wrzucamy do kategorii z panelu
                permissionOverwrites: [
                    // Zabezpieczenie 1: Właściciel
                    {
                        id: user?.id!,
                        allow: [
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.MoveMembers,
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Speak
                        ],
                    },
                    // Zabezpieczenie 2: Bot
                    {
                        id: guild.client.user.id,
                        allow: [
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.MoveMembers,
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.EmbedLinks
                        ],
                    }
                ],
            });

            await newState.setChannel(newChannel);
            await redis.set(`temp_vc:${newChannel.id}`, 'true');
        } catch (err) {
            console.error('❌ Błąd tworzenia kanału:', err);
        }
    }

    // Usuwanie kanału (logika z Redisem zostaje nieruszona, bo jest zajebista)
    if (oldState.channel) {
        try {
            const isTemp = await redis.get(`temp_vc:${oldState.channel.id}`);
            if (isTemp && oldState.channel.members.size === 0) {
                await oldState.channel.delete();
                await redis.del(`temp_vc:${oldState.channel.id}`);
            }
        } catch (err) {
            // Ktoś usunął ręcznie, zlewamy
        }
    }
};