import { BoxModel, ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * The styles of the React {@code Component}s of the feature recent-list i.e.
 * {@code CalendarList}.
 */
export default createStyleSheet({

    /**
     * Style of the recent list clear button.
     */
    clearButton: {
        alignItems: 'center',
        backgroundColor: ColorPalette.blue,
        borderColor: ColorPalette.blue,
        borderRadius: 4,
        borderWidth: 1,
        justifyContent: 'center',
        margin: BoxModel.margin,
        paddingVertical: BoxModel.padding
    },

    clearButtonText: {
        color: ColorPalette.white
    },

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

    /**
     * style of the menu item in the popup menu.
     */
    menuItem: {
        padding: BoxModel.padding
    },

    /**
     * Style of the text in the menu item.
     */
    menuItemText: {
        fontSize: 19
    }
});
