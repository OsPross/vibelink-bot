/**
 * Vencord userplugin — EconomyDropNotify
 * Notify-only: never sends messages or auto-claims.
 */

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { Toasts } from "@webpack/common";

const DEFAULT_BOT_ID = "1455021218133573743";
const DEFAULT_KEYWORD = "odbierz";

const settings = definePluginSettings({
    botId: {
        type: OptionType.STRING,
        description: "ID bota ekonomii, którego wiadomości śledzić",
        default: DEFAULT_BOT_ID,
    },
    keyword: {
        type: OptionType.STRING,
        description: "Fragment treści / embeda (bez rozróżniania wielkości liter)",
        default: DEFAULT_KEYWORD,
    },
    guildId: {
        type: OptionType.STRING,
        description: "Opcjonalnie: tylko ten serwer (puste = wszystkie)",
        default: "",
    },
    channelId: {
        type: OptionType.STRING,
        description: "Opcjonalnie: tylko ten kanał (puste = wszystkie)",
        default: "",
    },
    showToast: {
        type: OptionType.BOOLEAN,
        description: "Pokaż toast w Discordzie",
        default: true,
    },
    showDesktopNotification: {
        type: OptionType.BOOLEAN,
        description: "Pokaż powiadomienie Vencord / systemowe",
        default: true,
    },
});

function messageText(message: {
    content?: string;
    embeds?: Array<{ title?: string; description?: string; footer?: { text?: string } }>;
}): string {
    const parts: string[] = [];
    if (message.content) parts.push(message.content);
    for (const embed of message.embeds ?? []) {
        if (embed.title) parts.push(embed.title);
        if (embed.description) parts.push(embed.description);
        if (embed.footer?.text) parts.push(embed.footer.text);
    }
    return parts.join("\n");
}

function matchesDrop(message: {
    author?: { id?: string };
    content?: string;
    embeds?: Array<{ title?: string; description?: string; footer?: { text?: string } }>;
    guild_id?: string | null;
    channel_id?: string;
}): boolean {
    const botId = settings.store.botId.trim();
    const keyword = settings.store.keyword.trim().toLowerCase();
    if (!botId || !keyword) return false;
    if (message.author?.id !== botId) return false;

    const guildFilter = settings.store.guildId.trim();
    if (guildFilter && message.guild_id !== guildFilter) return false;

    const channelFilter = settings.store.channelId.trim();
    if (channelFilter && message.channel_id !== channelFilter) return false;

    return messageText(message).toLowerCase().includes(keyword);
}

function notifyDrop(message: { content?: string; channel_id?: string }) {
    const title = "Drop ekonomii!";
    const body = "Bot wrzucił drop — wpisz komendę ręcznie, jeśli chcesz odebrać.";
    const preview = (message.content || "").slice(0, 120);

    if (settings.store.showToast) {
        Toasts.show({
            message: preview ? `${title}: ${preview}` : title,
            id: Toasts.genId(),
            type: Toasts.Type.MESSAGE,
            options: {
                position: Toasts.Position.BOTTOM,
            },
        });
    }

    if (settings.store.showDesktopNotification) {
        void showNotification({
            title,
            body: preview ? `${body}\n${preview}` : body,
            color: "#3ba55d",
        });
    }
}

export default definePlugin({
    name: "EconomyDropNotify",
    description:
        "Pokazuje powiadomienie, gdy bot ekonomii ogłasza drop. Nie wysyła wiadomości i nie auto-claimuje.",
    authors: [{ name: "local", id: 0n }],
    settings,

    flux: {
        MESSAGE_CREATE({
            message,
            optimistic,
        }: {
            message: {
                author?: { id?: string };
                content?: string;
                embeds?: Array<{ title?: string; description?: string; footer?: { text?: string } }>;
                guild_id?: string | null;
                channel_id?: string;
            };
            optimistic?: boolean;
        }) {
            if (optimistic) return;
            if (!matchesDrop(message)) return;
            notifyDrop(message);
        },
    },
});
