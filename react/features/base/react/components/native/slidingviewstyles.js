// @flow

import { StyleSheet } from 'react-native';

import { OVERLAY_Z_INDEX } from '../../constants';

export default {
    /**
     * The topmost container of the side bar.
     */
    sliderViewContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: OVERLAY_Z_INDEX
    },

    /**
     * The container of the actual content of the side menu.
     */
    sliderViewContent: {
        position: 'absolute'
    },

    /**
     * The opaque area that covers the rest of the screen, when the side bar is
     * open.
     */
    sliderViewShadow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }
};
