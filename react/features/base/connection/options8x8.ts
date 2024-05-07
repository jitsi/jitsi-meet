import { ConfigService } from "../../authentication/internxt/config.service";
import { doGetJSON } from "../util/httpUtils";
import { IOptions } from "./actions.any";

export async function get8x8JWT(inxtNewToken: string) {
    //A Jitsi JWT, can be manually generated here: https://jaas.8x8.vc/#/apikeys
    //more documentation: https://developer.8x8.com/jaas/docs/api-keys-jwt
    const res = await doGetJSON('https://api.internxt.com/drive/users/meet-token', false, {
        method: 'get',
        headers: new Headers({
            'Authorization': 'Bearer ' + inxtNewToken,
        }),
    });
    return res.token || '';
}

export function get8x8AppId() {
    //AppID is an unique user ID, can be aquired from https://jaas.8x8.vc/#/apikeys
    const appId = ConfigService.instance.get('JITSI_APP_ID');
    return appId;
}

export function get8x8Options(options: IOptions, appId: string, room: string) {
    const newOptions = Object.assign(options, {
        hosts: {
            domain: '8x8.vc',
            muc: `conference.${appId}.8x8.vc`,
            focus: 'focus.8x8.vc'
        },
        serviceUrl: `wss://8x8.vc/${appId}/xmpp-websocket?room=${room}`,
        websocketKeepAliveUrl: `https://8x8.vc/${appId}/_unlock?room=${room}`,
    });
    return newOptions;
}