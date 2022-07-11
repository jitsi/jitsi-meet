// @flow

import { createStyleSheet } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';


export const dialogStyles = createStyleSheet({
    questionText: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text01,
        marginBottom: BaseTheme.spacing[2],
        marginLeft: BaseTheme.spacing[2]
    },

    questionOwnerText: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text03,
        marginBottom: BaseTheme.spacing[2],
        marginLeft: BaseTheme.spacing[2]
    },

    questionField: {
        borderWidth: 1,
        borderColor: BaseTheme.palette.border05,
        borderRadius: BaseTheme.shape.borderRadius,
        color: BaseTheme.palette.text01,
        fontSize: 14,
        marginHorizontal: BaseTheme.spacing[3],
        marginBottom: BaseTheme.spacing[3],
        paddingBottom: BaseTheme.spacing[2],
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[3],
        paddingTop: BaseTheme.spacing[2]
    },

    optionContainer: {
        flexDirection: 'column',
        marginTop: BaseTheme.spacing[3],
        marginHorizontal: BaseTheme.spacing[3]
    },

    optionFieldLabel: {
        color: BaseTheme.palette.text03,
        marginBottom: BaseTheme.spacing[2]
    },

    optionRemoveButtonText: {
        color: BaseTheme.palette.actionDangerActive
    },

    field: {
        borderWidth: 1,
        borderColor: BaseTheme.palette.border05,
        borderRadius: BaseTheme.shape.borderRadius,
        color: BaseTheme.palette.text01,
        fontSize: 14,
        paddingBottom: BaseTheme.spacing[2],
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[3],
        paddingTop: BaseTheme.spacing[2]
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
        backgroundColor: BaseTheme.palette.action01,
        borderRadius: BaseTheme.shape.borderRadius,
        height: 6
    },

    voters: {
        backgroundColor: BaseTheme.palette.ui04,
        borderColor: BaseTheme.palette.border03,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 1,
        padding: BaseTheme.spacing[2],
        marginTop: BaseTheme.spacing[2]
    },

    voter: {
        color: BaseTheme.palette.text01
    },

    answerContainer: {
        marginHorizontal: BaseTheme.spacing[2],
        marginVertical: BaseTheme.spacing[3],
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
    questionFieldLabel: {
        color: BaseTheme.palette.text03,
        marginBottom: BaseTheme.spacing[2],
        marginLeft: BaseTheme.spacing[3]
    },

    noPollContent: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: '4%'
    },

    noPollText: {
        flex: 1,
        color: BaseTheme.palette.text03,
        textAlign: 'center',
        maxWidth: '70%'
    },

    pollItemContainer: {
        backgroundColor: BaseTheme.palette.ui02,
        borderColor: BaseTheme.palette.border05,
        borderRadius: BaseTheme.shape.borderRadius,
        boxShadow: BaseTheme.shape.boxShadow,
        borderWidth: 1,
        padding: BaseTheme.spacing[2],
        margin: BaseTheme.spacing[3]
    },

    pollCreateContainer: {
        flex: 1
    },

    pollCreateSubContainer: {
        flex: 1,
        marginTop: BaseTheme.spacing[3]
    },

    pollCreateButtonsContainer: {
        marginHorizontal: BaseTheme.spacing[3],
        marginVertical: '8%'
    },

    pollCreateButton: {
        flex: 1,
        marginHorizontal: BaseTheme.spacing[2]
    },

    pollSendLabel: {
        color: BaseTheme.palette.text01,
        textTransform: 'capitalize'
    },

    pollSendDisabledLabel: {
        color: BaseTheme.palette.text03,
        textTransform: 'capitalize'
    },

    buttonRow: {
        flexDirection: 'row'
    },

    buttonRowAndroid: {
        flexDirection: 'row',
        marginBottom: BaseTheme.spacing[3]
    },

    buttonRowIos: {
        flexDirection: 'row'
    },

    answerContent: {
        paddingBottom: 8
    },

    switchRow: {
        alignItems: 'center',
        flexDirection: 'row',
        padding: BaseTheme.spacing[2]
    },

    switchLabel: {
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[2]
    },

    pollCreateAddButton: {
        margin: BaseTheme.spacing[2]
    },

    toggleText: {
        color: BaseTheme.palette.action01,
        paddingTop: BaseTheme.spacing[3]
    },

    createPollButton: {
        marginHorizontal: BaseTheme.spacing[4],
        marginVertical: '8%'
    },

    pollPane: {
        flex: 1,
        padding: 8
    },

    pollPaneContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    bottomLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: BaseTheme.spacing[2]
    }
});
