// @flow

import { ColorPalette, createStyleSheet } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

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
    },
    option: {
        flexShrink: 1
    }
});

export const dialogStyles = createStyleSheet({
    question: {
        color: BaseTheme.palette.text01,
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 4
    },

    optionContainer: {
        flexDirection: 'row'
    },

    field: {
        color: BaseTheme.palette.text01,
        borderBottomWidth: 1,
        borderColor: ColorPalette.blue,
        fontSize: 14,
        flexGrow: 1,
        paddingBottom: 0,
        flexShrink: 1
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
        width: '100%',
        height: 6,
        marginTop: 2
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

    voter: {
        color: BaseTheme.palette.text01
    },

    answerContainer: {
        marginVertical: 2,
        maxWidth: '100%'
    },

    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    answer: {
        color: BaseTheme.palette.text01,
        flexShrink: 1
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
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        marginTop: 6
    },

    showDetails: {
        fontWeight: 'bold'
    },

    noPollText: {
        flex: 1,
        color: BaseTheme.palette.text03,
        textAlign: 'center',
        paddingTop: '8%'
    },

    pollItemContainer: {
        borderRadius: 4,
        borderColor: '#2183ad',
        borderWidth: 2,
        padding: 16,
        marginBottom: 8
    },

    pollCreateContainer: {
        flex: 1,
        justifyContent: 'space-between'
    },

    pollCreateSubContainer: {
        flex: 1
    },

    pollCreateButtonsContainer: {
        paddingVertical: BaseTheme.spacing[2]
    },

    pollCreateButton: {
        flex: 1,
        marginHorizontal: 8
    },

    pollSendLabel: {
        color: BaseTheme.palette.text01
    },

    pollSendDisabledLabel: {
        color: BaseTheme.palette.text03
    },

    buttonRow: {
        flexDirection: 'row'
    },

    answerContent: {
        paddingBottom: 8
    },

    switchRow: {
        alignItems: 'center',
        flexDirection: 'row',
        padding: 6
    },

    switchLabel: {
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[2]
    },

    pollCreateAddButton: {
        margin: BaseTheme.spacing[2]
    },

    toggleText: {
        color: ColorPalette.blue,
        paddingTop: BaseTheme.spacing[3]
    },

    createPollButton: {
        padding: 8,
        margin: BaseTheme.spacing[2]
    },

    PollPane: {
        flex: 1,
        padding: 8
    },

    PollPaneContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    PollPaneContent: {
        justifyContent: 'space-between',
        padding: BaseTheme.spacing[3],
        flex: 1
    },

    bottomLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
});
