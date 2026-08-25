# EconomyDropNotify (Vencord userplugin)

Powiadomienie, gdy bot ekonomii wrzuci drop (domyślnie bot `1455021218133573743`, keyword `odbierz`).

**Tylko alert** — plugin nie wysyła wiadomości i nie wpisuje `,odbierz`.

## Ścieżka na tym komputerze

```
/home/ubuntu/Desktop/EconomyDropNotify
```

Plik pluginu: `/home/ubuntu/Desktop/EconomyDropNotify/index.ts`

## Instalacja w Vencordzie (build ze źródła)

1. Zainstaluj Vencord **from source** (wymagane dla userplugins):  
   https://docs.vencord.dev/installing/
2. W katalogu źródłowym Vencorda utwórz folder `src/userplugins` (jeśli nie istnieje).
3. Skopiuj cały folder `EconomyDropNotify` do:

```
<path-do-vencorda>/src/userplugins/economyDropNotify
```

Przykład:

```bash
cp -r /home/ubuntu/Desktop/EconomyDropNotify \
  ~/Vencord/src/userplugins/economyDropNotify
```

4. Przebuduj Vencord (`pnpm build` / zgodnie z docs) i zrestartuj Discorda.
5. Włącz plugin w **Vencord → Plugins → EconomyDropNotify**.

## Ustawienia

| Opcja | Opis |
| --- | --- |
| `botId` | ID bota (domyślnie `1455021218133573743`) |
| `keyword` | Fragment treści / embeda (domyślnie `odbierz`) |
| `guildId` | Opcjonalnie ogranicz do serwera |
| `channelId` | Opcjonalnie ogranicz do kanału |
| `showToast` | Toast w kliencie |
| `showDesktopNotification` | Powiadomienie Vencord / systemowe |

Docs: https://docs.vencord.dev/installing/custom-plugins/
