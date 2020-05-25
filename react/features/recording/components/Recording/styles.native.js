// @flow

import { ColorSchemeRegistry, schemeColor } from '../../../base/color-scheme';
import { BoxModel, ColorPalette } from '../../../base/styles';

export const DROPBOX_LOGO = require('../../../../../images/dropboxLogo_square.png');
export const ICON_SHARE = require('../../../../../images/icon-users.png');
export const JITSI_LOGO = require('../../../../../images/jitsiLogo_square.png');

// XXX The "standard" {@code BoxModel.padding} has been deemed insufficient in
// the special case(s) of the recording feature bellow.
const _PADDING = BoxModel.padding * 1.5;

/**
 * Color schemed styles for the @{code StartRecordingDialogContent} component.
 */
ColorSchemeRegistry.register('StartRecordingDialogContent', {

    container: {
        flex: 0,
        flexDirection: 'column'
    },

    controlDisabled: {
        opacity: 0.5
    },

    header: {
        alignItems: 'center',
        flex: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: _PADDING,
        paddingTop: _PADDING
    },

    loggedIn: {
        paddingBottom: _PADDING
    },

    recordingIcon: {
        width: 24,
        height: 24
    },

    signButton: {
        backgroundColor: ColorPalette.blue,
        color: ColorPalette.white,
        fontSize: 16,
        borderRadius: 5,
        padding: BoxModel.padding * 0.5
    },

    switch: {
        color: ColorPalette.white
    },

    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'left',
        paddingLeft: BoxModel.padding
    },

    text: {
        color: schemeColor('text')
    }
});
