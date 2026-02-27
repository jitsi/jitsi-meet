import { createStyleSheet } from '../../../base/styles/functions.native';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';


export const dialogStyles = createStyleSheet({

    headerContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    customContainer: {
        marginBottom: BaseTheme.spacing[4],
        marginHorizontal: BaseTheme.spacing[4],
        marginTop: BaseTheme.spacing[2]
    },

    questionText: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[2]
    },

    questionOwnerText: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text03,
        marginBottom: BaseTheme.spacing[4],
        marginLeft: BaseTheme.spacing[2]
    },

    optionContainer: {
        flexDirection: 'column',
        marginTop: BaseTheme.spacing[4],
        marginHorizontal: BaseTheme.spacing[4]
    },

    optionRemoveButton: {
        width: 136
    },

    optionRemoveButtonText: {
        color: BaseTheme.palette.link01
    },

    field: {
        borderWidth: 1,
        borderColor: BaseTheme.palette.ui06,
        borderRadius: BaseTheme.shape.borderRadius,
        color: BaseTheme.palette.text01,
        fontSize: 14,
        paddingBottom: BaseTheme.spacing[2],
        paddingLeft: BaseTheme.spacing[4],
        paddingRight: BaseTheme.spacing[4],
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
        borderColor: BaseTheme.palette.ui03,
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
        marginVertical: BaseTheme.spacing[4],
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

export const pollsStyles = createStyleSheet({

    emptyListStyle: {
        flex: 1
    },

    emptyListContentContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
    },

    noPollContent: {
        alignItems: 'center',
        justifyContent: 'center'
    },

    noPollText: {
        ...BaseTheme.typography.bodyLongBold,
        color: BaseTheme.palette.text02,
        textAlign: 'center',
        maxWidth: '80%'
    },

    pollItemContainer: {
        backgroundColor: BaseTheme.palette.uiBackground,
        borderColor: BaseTheme.palette.ui06,
        borderRadius: BaseTheme.shape.borderRadius,
        boxShadow: BaseTheme.shape.boxShadow,
        borderWidth: 1,
        padding: BaseTheme.spacing[2],
        margin: BaseTheme.spacing[2]
    },

    pollCreateContainer: {
        flex: 1
    },

    pollCreateSubContainer: {
        flex: 1
    },

    pollCreateButtonsContainer: {
        marginHorizontal: BaseTheme.spacing[2]
    },

    pollSendLabel: {
        color: BaseTheme.palette.text01
    },

    pollSendDisabledLabel: {
        color: BaseTheme.palette.text03
    },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    answerContent: {
        marginBottom: BaseTheme.spacing[2]
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
        marginHorizontal: BaseTheme.spacing[2],
        marginVertical: BaseTheme.spacing[2]
    },

    pollCreateButton: {
        marginHorizontal: BaseTheme.spacing[2],
        flex: 1
    },

    toggleText: {
        color: BaseTheme.palette.action01
    },

    createPollButton: {
        marginHorizontal: BaseTheme.spacing[4],
    },

    pollPane: {
        flex: 1,
        padding: BaseTheme.spacing[2]
    },

    pollPaneContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    bottomLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: BaseTheme.spacing[2]
    },

    fieldSeparator: {
        borderBottomWidth: 1,
        borderColor: BaseTheme.palette.ui05,
        marginTop: BaseTheme.spacing[2]
    }
});
