import { Platform } from '../../base/react';
import { BoxModel, ColorPalette } from '../../base/styles';

/**
 * The base filmstrip style shared between narrow and wide versions.
 */
const filmstripBaseStyle = {
    flexGrow: 0,
    flexDirection: 'column'
};

/**
 * The styles of the feature filmstrip common to both Web and native.
 */
export default {
    /**
     * Avatar style.
     */
    avatar: {
        alignSelf: 'center',

        // XXX Workaround for Android: for images < 80 the border radius doesn't
        // work properly, but applying a radius twice as big does the trick.
        borderRadius: Platform.OS === 'android' ? 100 : 25,
        flex: 0,
        height: 50,
        width: 50
    },

    /**
     * Dominant speaker indicator style.
     */
    dominantSpeakerIndicator: {
        color: ColorPalette.white,
        fontSize: 15
    },

    /**
     * Dominant speaker indicator background style.
     */
    dominantSpeakerIndicatorBackground: {
        backgroundColor: ColorPalette.blue,
        borderRadius: 15,
        left: 4,
        padding: 5,
        position: 'absolute',
        top: 4
    },

    /**
     * The style of the narrow filmstrip version which displays thumbnails
     * in a row at the bottom of the screen.
     */
    filmstripNarrow: {
        ...filmstripBaseStyle,
        alignItems: 'flex-end',
        height: 90,
        marginBottom: BoxModel.margin,
        marginLeft: BoxModel.margin,
        marginRight: BoxModel.margin
    },

    /**
     * The style of the wide version of the filmstrip which appears as a column
     * on the short side of the screen.
     */
    filmstripWide: {
        ...filmstripBaseStyle,
        bottom: BoxModel.margin,
        left: BoxModel.margin,
        position: 'absolute',
        top: BoxModel.margin
    },

    /**
     * Moderator indicator style.
     */
    moderatorIndicator: {
        backgroundColor: 'transparent',
        bottom: 4,
        color: ColorPalette.white,
        position: 'absolute',
        right: 4
    },

    /**
     * The style of a participant's Thumbnail which renders either the video or
     * the avatar of the associated participant.
     */
    thumbnail: {
        alignItems: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        borderColor: '#424242',
        borderRadius: 3,
        borderStyle: 'solid',
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        margin: 2,
        overflow: 'hidden',
        position: 'relative'
    },

    /**
     * The thumbnail audio and video muted indicator style.
     */
    thumbnailIndicator: {
        backgroundColor: 'transparent',
        color: ColorPalette.white,
        paddingLeft: 1,
        paddingRight: 1,
        position: 'relative'
    },

    /**
     * The thumbnails indicator container.
     */
    thumbnailIndicatorContainer: {
        alignSelf: 'stretch',
        bottom: 4,
        flex: 1,
        flexDirection: 'row',
        left: 4,
        position: 'absolute'
    },

    /**
     * Pinned video thumbnail style.
     */
    thumbnailPinned: {
        borderColor: ColorPalette.blue,
        shadowColor: ColorPalette.black,
        shadowOffset: {
            height: 5,
            width: 5
        },
        shadowRadius: 5
    }
};
