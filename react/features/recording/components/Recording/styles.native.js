// @flow

import { BoxModel, createStyleSheet, ColorPalette } from '../../../base/styles';

// XXX The "standard" {@code BoxModel.padding} has been deemed insufficient in
// the special case(s) of the recording feature bellow.
const _PADDING = BoxModel.padding * 1.5;

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

    startRecordingText: {
        paddingBottom: _PADDING
    },

    switch: {
        color: ColorPalette.white,
        paddingRight: BoxModel.padding
    },

    title: {
        fontSize: 16,
        fontWeight: 'bold'
    },

    text: {
        color: ColorPalette.white
    }
});
