import { StyleSheet } from 'react-native';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default StyleSheet.create({
    backDrop: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1
    },

    loadingWrapper: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        justifyContent: 'center'
    },

    webView: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1
    }
});
