import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The styles of the feature visitors.
 */
export default {

    hangupButton: {
        marginTop: BaseTheme.spacing[3],
        width: 240
    },

    raiseHandButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },

    visitorsQueue: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    },

    visitorsQueueTitle: {
        ...BaseTheme.typography.heading5,
        color: BaseTheme.palette.text01,
        marginBottom: BaseTheme.spacing[3],
        textAlign: 'center'
    },
};
