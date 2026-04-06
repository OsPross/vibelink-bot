import { ChatInputCommandInteraction, Client } from 'discord.js';

export interface Command {
    data: any;
    execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
}