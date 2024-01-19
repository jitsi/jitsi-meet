import { ColorPalette } from '../../base/styles/components/styles/ColorPalette';
import { createStyleSheet } from '../../base/styles/functions.native';

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
    },

    entryNameContainer: {
        alignItems: 'center',
        borderBottomColor: ColorPalette.lightGrey,
        borderBottomWidth: 1,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        height: 48
    },

    entryNameLabel: {
        color: ColorPalette.lightGrey,
        flexShrink: 1,
        fontSize: 16,
        opacity: 0.90
    }
});
