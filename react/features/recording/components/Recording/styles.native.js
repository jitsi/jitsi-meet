// @flow

import { BoxModel, createStyleSheet, ColorPalette } from '../../../base/styles';

// XXX The "standard" {@code BoxModel.padding} has been deemed insufficient in
// the special case(s) of the recording feature bellow.
const _PADDING = BoxModel.padding * 1.5;

export const DROPBOX_LOGO
    = require('../../../../../images/dropboxLogo_square.png');

export const JITSI_LOGO
    = require('../../../../../images/jitsiLogo_square.png');

/**
 * The styles of the React {@code Components} of the feature recording.
 */
export default createStyleSheet({
    container: {
        flex: 0,
        flexDirection: 'column'
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
        color: ColorPalette.white
    }
});
