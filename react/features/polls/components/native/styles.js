// @flow

import { ColorPalette, createStyleSheet } from '../../../base/styles';

export const answerStyles = createStyleSheet({
    question: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 6
    },
    answer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3
    }
});

export const dialogStyles = createStyleSheet({
    question: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 4
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
    }
});

export const resultsStyles = createStyleSheet({
    title: {
        fontSize: 24,
        fontWeight: 'bold'
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

export const chatStyles = createStyleSheet({
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        marginTop: 6
    },

    showDetails: {
        fontWeight: 'bold'
    }
});
