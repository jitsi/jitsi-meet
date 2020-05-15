// @flow

import { ColorPalette, getRGBAFormat } from '../styles';

/**
 * The default color scheme of the application.
 */
export default {
    '_defaultTheme': {
        // Generic app theme colors that are used accross the entire app.
        // All scheme definitions below inherit these values.
        background: ColorPalette.white,
        errorText: ColorPalette.red,
        icon: ColorPalette.AdfcTextColor,
        text: ColorPalette.AdfcTextColor
    },
    'Chat': {
        displayName: ColorPalette.AdfcBlue,
        localMsgBackground: 'rgb(215, 230, 249)',
        privateMsgBackground: 'rgb(250, 219, 219)',
        privateMsgNotice: 'rgb(186, 39, 58)',
        remoteMsgBackground: 'rgb(241, 242, 246)',
        replyBorder: ColorPalette.AdfcOrange,
        replyIcon: ColorPalette.AdfcOrange
    },
    'Conference': {
        inviteButtonBackground: 'rgb(0, 119, 225)',
        onVideoText: ColorPalette.white
    },
    'Dialog': {
        border: ColorPalette.AdfcBackgroundColor,
        buttonBackground: ColorPalette.AdfcOrange,
        buttonLabel: ColorPalette.white
    },
    'Header': {
        background: ColorPalette.AdfcBackgroundColor,
        icon: ColorPalette.white,
        statusBar: ColorPalette.blueHighlight,
        statusBarContent: ColorPalette.white,
        text: ColorPalette.white
    },
    'Modal': {},
    'LargeVideo': {
        background: 'rgb(42, 58, 75)'
    },
    'LoadConfigOverlay': {
        background: 'rgb(249, 249, 249)'
    },
    'Thumbnail': {
        activeParticipantHighlight: 'rgb(81, 214, 170)',
        activeParticipantTint: 'rgba(49, 183, 106, 0.3)',
        background: 'rgb(94, 109, 122)'
    },
    'Toolbox': {
        button: 'rgb(255, 255, 255)',
        buttonToggled: 'rgb(38, 58, 76)',
        buttonToggledBorder: getRGBAFormat('#a4b8d1', 0.6),
        hangup: 'rgb(225, 45, 45)'
    }
};
