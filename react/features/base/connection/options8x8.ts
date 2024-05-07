import { IOptions } from "./actions.any";

export function get8x8JWT() {
    //A Jitsi JWT, can be manually generated here: https://jaas.8x8.vc/#/apikeys
    //more documentation: https://developer.8x8.com/jaas/docs/api-keys-jwt
    const jwt = '';
    return jwt;
}

export function get8x8AppId() {
    //AppID is an unique user ID, can be aquired from https://jaas.8x8.vc/#/apikeys
    const appId = '';
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