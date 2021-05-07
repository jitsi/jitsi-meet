// @flow

import { ColorPalette, createStyleSheet } from '../../../base/styles';

/**
 * The styles of the React {@code Component}s of the feature subtitles.
 */
export default createStyleSheet({

    mainContainer: {
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold'
    },

    question: {
        fontSize: 16,
        fontStyle: 'italic',
        paddingBottom: 16
    },

    optionContainer: {
        flexDirection: 'row'
    },

    field: {
        borderBottomWidth: 1,
        fontSize: 14,
        flexGrow: 1
    },

    buttonContainer: {
        // borderWidth: 2,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },

    icon: {
        color: ColorPalette.white,
        backgroundColor: ColorPalette.blue,
        borderRadius: 5,
        margin: 0,
        flexGrow: 0
    },

    plusButton: {
        marginTop: 16
    }
});
