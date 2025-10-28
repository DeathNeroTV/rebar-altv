import {useRebar} from "@Server/index.js";
import {DiscordConfig} from "./config.js";
import {getClient} from "./bot.js";
import {registerCommand} from "./client.js";

const Rebar = useRebar();

export function useDiscord() {
    function client() {
        return getClient();
    }

    function getConfig() {
        return DiscordConfig;
    }

    return {
        client,
        getConfig,
        registerCommand
    }
}


declare global {
    export interface ServerPlugin {
        ['discord-api']: ReturnType<typeof useDiscord>;
    }
}

Rebar.useApi().register('discord-api', useDiscord());