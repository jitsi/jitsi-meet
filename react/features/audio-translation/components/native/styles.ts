import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The styles of the native audio-translation components.
 */
export default {
    container: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    iconWrapper: {
        width: 32
    },

    itemsContainer: {
        marginHorizontal: BaseTheme.spacing[4],
        marginVertical: BaseTheme.spacing[4]
    },

    languageItemText: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[2],
        marginVertical: BaseTheme.spacing[2]
    },

    languageItemWrapper: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row'
    },

    selectedLanguageItemText: {
        ...BaseTheme.typography.bodyShortBoldLarge
    }
};
