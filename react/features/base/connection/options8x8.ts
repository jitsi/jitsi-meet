import { ConfigService } from "../meet/services/config.service";
import { doGetJSON } from "../util/httpUtils";
import { IOptions } from "./actions.any";

export async function get8x8UserJWT(room: string) {
    //A Jitsi JWT, can be manually generated here: https://jaas.8x8.vc/#/apikeys
    //more documentation: https://developer.8x8.com/jaas/docs/api-keys-jwt
    const res = await doGetJSON(
        `${ConfigService.instance.get("DRIVE_NEW_API_URL")}/users/meet-token/anon?room=${room}`,
        false,
        {
            method: "get",
        }
    );
    return res;
}

export async function get8x8BetaJWT(inxtNewToken: string, room?: string) {
    //A Jitsi JWT, can be manually generated here: https://jaas.8x8.vc/#/apikeys
    //more documentation: https://developer.8x8.com/jaas/docs/api-keys-jwt
    const roomString = room ? `?room=${room}` : "";
    const res = await doGetJSON(
        `${ConfigService.instance.get("DRIVE_NEW_API_URL")}/users/meet-token/beta${roomString}`,
        false,
        {
            method: "get",
            headers: new Headers({
                Authorization: "Bearer " + inxtNewToken,
            }),
        }
    );
    return res;
}

export async function get8x8JWT(room?: string) {
    let jwt: string | undefined;
    let inxtUserToken = localStorage.getItem("xNewToken");
    if (inxtUserToken) {
        try {
            jwt = (await get8x8BetaJWT(inxtUserToken, room)).token;
        } catch {}
    }
    if (!jwt) {
        try {
            jwt = (await get8x8UserJWT(room || "")).token;
        } catch {}
    }
    return jwt;
}

export function get8x8AppId() {
    //AppID is an unique user ID, can be aquired from https://jaas.8x8.vc/#/apikeys
    const appId = ConfigService.instance.get("JITSI_APP_ID");
    return appId;
}

export function get8x8Options(options: IOptions, appId: string, room: string) {
    const newOptions = Object.assign(options, {
        hosts: {
            domain: "8x8.vc",
            muc: `conference.${appId}.8x8.vc`,
            focus: "focus.8x8.vc",
        },
        serviceUrl: `wss://8x8.vc/${appId}/xmpp-websocket?room=${room}`,
        websocketKeepAliveUrl: `https://8x8.vc/${appId}/_unlock?room=${room}`,
    });
    return newOptions;
}
