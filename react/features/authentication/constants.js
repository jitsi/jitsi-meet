/* global config, JitsiMeetJS, Promise */


export const isTokenAuthEnabled
    = typeof config.tokenAuthUrl === 'string' && config.tokenAuthUrl.length;

export const getTokenAuthUrl
    = JitsiMeetJS.util.AuthUtil.getTokenAuthUrl.bind(null,
    config.tokenAuthUrl);
