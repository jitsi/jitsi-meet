import { createStyleSheet } from '../../base/styles';

/**
 * The styles of the React {@code Component}s of the feature recent-list i.e.
 * {@code CalendarList}.
 */
export default createStyleSheet({

    /**
     * Text style of the empty recent list message.
     */
    emptyListText: {
        backgroundColor: 'transparent',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center'
    },

    /**
     * The style of the empty recent list container.
     */
    emptyListContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    }
});
