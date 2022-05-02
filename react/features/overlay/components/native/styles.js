// @flow

import { StyleSheet } from 'react-native';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';


/**
 * The React {@code Component} styles of the overlay feature.
 */
export default {
    /**
     * Style for a backdrop overlay covering the screen the the overlay is
     * rendered.
     */
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: BaseTheme.palette.ui00
    },

    safeContainer: {
        flex: 1
    }
};
