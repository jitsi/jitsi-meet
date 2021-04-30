// @flow

import { ColorPalette, createStyleSheet } from '../../../base/styles';

/**
 * The styles of the React {@code Component}s of the feature subtitles.
 */
export default createStyleSheet({

    title: {
        fontSize: 24,
        fontWeight: 'bold'
    },

    question: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingBottom: 8
    },

    optionContainer: {
        flexDirection: 'row'
    },

    field: {
        borderBottomWidth: 1,
        borderColor: ColorPalette.blue,
        fontSize: 14,
        flexGrow: 1,
        paddingBottom: 0
    },

    buttonContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center'
    },

    icon: {
        color: ColorPalette.white,
        backgroundColor: ColorPalette.blue,
        borderRadius: 5,
        margin: 0
    },

    plusButton: {
        marginTop: 8
    },
    
    barContainer: {
        backgroundColor: '#ccc',
        borderRadius: 3,
        width: 200,
        height: 6
    },

    bar: {
        backgroundColor: ColorPalette.blue,
        borderRadius: 3,
        height: 6
    },
    
    voters: {
        borderRadius: 3,
        borderWidth: 1,
        borderColor: 'gray',
        padding: 2,
        marginHorizontal: 8,
        marginVertical: 4
    },
    
    answerContainer: {
        marginVertical: 2
    },
    
    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    
    answerVoteCount: {
        paddingLeft: 10
    },
    
    chatQuestion: {
        fontWeight: 'bold'
    }
});
