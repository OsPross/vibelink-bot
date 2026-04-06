import { EmbedBuilder } from 'discord.js';

export class VibeEmbed extends EmbedBuilder {
    constructor() {
        super();
        // Domyślny, elegancki kolor bota (możesz zmienić na jakiegoś HEXa)
        this.setColor('#2b2d31'); 
        
        // Twój dojebany znak wodny wklejony na sztywno
        this.setFooter({ text: '⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗩𝗶𝗯𝗲𝗟𝗶𝗻𝗸' });
        
        // Zawsze dodaje aktualną datę do stopki
        this.setTimestamp();
    }
}