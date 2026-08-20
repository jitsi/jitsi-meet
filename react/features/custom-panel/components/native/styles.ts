import { StyleSheet } from 'react-native';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default StyleSheet.create({
    backDrop: {
        flex: 1
    },

    // Advisor background while loading, dark OS scheme.
    darkBackground: {
        backgroundColor: BaseTheme.palette.uiBackground
    },

    // Advisor background while loading, light OS scheme.
    lightBackground: {
        backgroundColor: BaseTheme.palette.text01
    },

    loadingWrapper: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
    },

    webView: {
        flex: 1
    }
});
