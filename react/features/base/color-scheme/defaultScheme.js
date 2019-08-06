// @flow

import { ColorPalette, getRGBAFormat } from '../styles';

/**
 * The default color scheme of the application.
 */
export default {
    'BottomSheet': {
        background: 'rgb(255, 255, 255)',
        icon: '#1c2025',
        label: '#1c2025'
    },
    'Dialog': {
        background: 'rgb(255, 255, 255)',
        border: 'rgba(0, 3, 6, 0.6)',
        buttonBackground: ColorPalette.blue,
        buttonLabel: ColorPalette.white,
        icon: '#1c2025',
        text: '#1c2025'
    },
    'Header': {
        background: ColorPalette.blue,
        icon: ColorPalette.white,
        statusBar: ColorPalette.blueHighlight,
        statusBarContent: ColorPalette.white,
        text: ColorPalette.white
    },
    'LargeVideo': {
        background: 'rgb(42, 58, 75)'
    },
    'LoadConfigOverlay': {
        background: 'rgb(249, 249, 249)',
        text: 'rgb(28, 32, 37)'
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
