// @flow

import { ColorPalette } from '../../../base/styles';

export default {
    displayNameBackdrop: {
        alignSelf: 'center',
        marginTop: 2,
        position: 'absolute',

        top: 0,
        backgroundColor: 'rgba(28, 32, 37, 0.6)',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2
    },

    displayNameBackdropLargeVideo: {
        position: 'relative',
        marginTop: 0,
        marginBottom: 16
    },

    displayNameText: {
        color: ColorPalette.white,
        fontSize: 12,
        fontWeight: 'bold'
    }
};
