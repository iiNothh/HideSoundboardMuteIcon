/*
 * HideSoundboardMuteIcon
 * Copyright (c) 2026 Nothh
 * SPDX-License-Identifier: MIT
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { FavoriteButton, GithubButton, WebsiteButton } from "@components/settings/tabs/plugins/PluginModalButtons";
import definePlugin, { OptionType } from "@utils/types";
import { React, ReactDOM } from "@webpack/common";

const settings = definePluginSettings({
    hideInVoiceList: {
        type: OptionType.BOOLEAN,
        displayName: "Hide in voice channel list",
        description: "Hide soundboard mute icons next to users in the voice channel list.",
        default: true
    },
    hideInCalls: {
        type: OptionType.BOOLEAN,
        displayName: "Hide in call view",
        description: "Hide soundboard mute icons beside names and on avatars inside calls.",
        default: true
    }
}).withPrivateSettings<{ isFavorite?: boolean; }>();

function SettingsLinks() {
    const marker = React.useRef<HTMLSpanElement>(null);
    const [header, setHeader] = React.useState<Element | null>(null);
    const { isFavorite } = settings.use();

    React.useLayoutEffect(() => {
        setHeader(marker.current?.closest('[role="dialog"]')?.querySelector(".vc-plugin-modal-header") ?? null);
    }, []);

    const links = React.createElement("div", { className: "vc-settings-modal-links" },
        React.createElement(FavoriteButton, {
            isFavorite: isFavorite ?? false,
            onClick: () => settings.store.isFavorite = !settings.store.isFavorite
        }),
        React.createElement(WebsiteButton, {
            text: "View more info",
            href: "https://github.com/iiNothh/HideSoundboardMuteIcon"
        }),
        React.createElement(GithubButton, {
            text: "View source code",
            href: "https://github.com/iiNothh/HideSoundboardMuteIcon"
        })
    );

    return React.createElement(React.Fragment, null,
        React.createElement("span", { ref: marker, hidden: true, className: "vc-hsmi-settings-anchor" }),
        header && ReactDOM.createPortal(links, header)
    );
}

export default definePlugin({
    name: "HideSoundboardMuteIcon",
    description: "Hides the 'Soundboard muted by you' indicator in voice channels, call avatars and call tiles.",
    authors: [{ name: "Nothh", id: 379149343300517891n }],
    tags: ["Appearance", "Voice"],
    settings,

    settingsAboutComponent: ErrorBoundary.wrap(SettingsLinks, { noop: true }),

    patches: [
        {
            find: "ConnectedVoiceUser",
            replacement: {
                match: /\(0,\i\.\i\)\(\[\i\.\i\],\(\)=>(?:null!=\i&&)?\i\.\i\.isLocalSoundboardMuted\(\i\)\)/,
                replace: '$self.useMutedIndicator($&,"hideInVoiceList")'
            }
        },
        {
            find: /^(?=.*AVATAR_CALL_ICON_STATUS_80)(?=.*isLocalSoundboardMuted)/,
            replacement: {
                match: /\(0,\i\.\i\)\(\[\i\.\i\],\(\)=>(?:null!=\i&&)?\i\.\i\.isLocalSoundboardMuted\(\i\)\)/,
                replace: '$self.useMutedIndicator($&,"hideInCalls")'
            }
        },
        {
            find: /^(?=.*\.SoundboardDenyIcon)(?=.*\.displayName="CallTile")/,
            group: true,
            replacement: [
                {
                    match: /(\{[^{}]*soundboardMuted:\i[^{}]*\}=\i),/,
                    replace: '$1,_vcShowSoundboardIcon=$self.useMutedIndicator(!0,"hideInCalls"),'
                },
                {
                    match: /(\i)\?(\i\.SoundboardDenyIcon):null/,
                    replace: "$1&&_vcShowSoundboardIcon?$2:null"
                }
            ]
        }
    ],

    useMutedIndicator(muted: boolean, option: "hideInVoiceList" | "hideInCalls") {
        try {
            const s = settings.use([option]);
            return muted && !s[option];
        } catch {
            return muted;
        }
    }
});
