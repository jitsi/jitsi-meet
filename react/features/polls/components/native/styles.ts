import { createStyleSheet } from '../../../base/styles/functions.native';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';


export const dialogStyles = createStyleSheet({

    customContainer: {
        marginBottom: BaseTheme.spacing[3],
        marginHorizontal: BaseTheme.spacing[3],
        marginTop: BaseTheme.spacing[2]
    },

    questionText: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[1]
    },

    questionOwnerText: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text03,
        marginBottom: BaseTheme.spacing[2],
        marginLeft: BaseTheme.spacing[1]
    },

    optionContainer: {
        flexDirection: 'column',
        marginTop: BaseTheme.spacing[3],
        marginHorizontal: BaseTheme.spacing[3]
    },

    optionRemoveButton: {
        marginTop: BaseTheme.spacing[2],
        width: 128
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
        marginHorizontal: BaseTheme.spacing[1],
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

    noPollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: '25%'
    },

    noPollText: {
        flex: 1,
        color: BaseTheme.palette.text03,
        textAlign: 'center',
        maxWidth: '70%'
    },

    pollItemContainer: {
        backgroundColor: BaseTheme.palette.uiBackground,
        borderColor: BaseTheme.palette.ui06,
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

    pollCreateButtonsContainerAndroid: {
        marginBottom: BaseTheme.spacing[8],
        marginHorizontal: BaseTheme.spacing[3]
    },

    pollCreateButtonsContainerIos: {
        marginBottom: BaseTheme.spacing[5],
        marginHorizontal: BaseTheme.spacing[3]
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
        marginHorizontal: BaseTheme.spacing[1],
        marginVertical: BaseTheme.spacing[2]
    },

    pollCreateButton: {
        marginHorizontal: BaseTheme.spacing[1],
        width: 160
    },

    toggleText: {
        color: BaseTheme.palette.action01
    },

    createPollButtonIos: {
        marginHorizontal: 20,
        marginVertical: BaseTheme.spacing[5]
    },

    createPollButtonAndroid: {
        marginHorizontal: 20
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
        marginHorizontal: BaseTheme.spacing[1]
    },

    unreadPollsCounterContainer: {
        display: 'flex',
        flexDirection: 'row'
    },

    unreadPollsCounterDescription: {
        color: BaseTheme.palette.text01
    },

    unreadPollsCounterCircle: {
        backgroundColor: BaseTheme.palette.warning01,
        borderRadius: BaseTheme.spacing[3] / 2,
        height: BaseTheme.spacing[3],
        justifyContent: 'center',
        marginLeft: BaseTheme.spacing[2],
        width: BaseTheme.spacing[3]
    },

    unreadPollsCounter: {
        alignSelf: 'center',
        color: BaseTheme.palette.text04
    }
});
