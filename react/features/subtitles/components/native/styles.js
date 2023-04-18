import { BoxModel } from '../../../base/styles/components/styles/BoxModel';
import {
    ColorPalette
} from '../../../base/styles/components/styles/ColorPalette';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The styles of the React {@code Component}s of the feature subtitles.
 */
export default {
    languageItemWrapper: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row'
    },

    iconWrapper: {
        width: 32
    },

    activeLanguageItemText: {
        ...BaseTheme.typography.bodyShortBoldLarge
    },

    languageItemText: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[2],
        marginVertical: BaseTheme.spacing[2]
    },

    subtitlesContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    /**
     * Style for subtitle paragraph.
     */
    captionsSubtitles: {
        backgroundColor: ColorPalette.black,
        borderRadius: BoxModel.margin / 4,
        color: ColorPalette.white,
        marginBottom: BoxModel.margin,
        padding: BoxModel.padding / 2
    },

    /**
     * Style for the subtitles container.
     */
    captionsSubtitlesContainer: {
        alignItems: 'center',
        flexDirection: 'column',
        flexGrow: 0,
        justifyContent: 'flex-end',
        margin: BoxModel.margin
    },

    itemsContainer: {
        marginHorizontal: BaseTheme.spacing[4],
        marginVertical: BaseTheme.spacing[4]
    }
};
