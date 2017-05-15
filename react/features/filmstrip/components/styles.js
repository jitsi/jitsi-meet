import { Platform } from '../../base/react';
import { BoxModel, ColorPalette } from '../../base/styles';

/**
 * Filmstrip related styles common to both Web and native.
 */
export const styles = {
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
     * The style of the Container which represents the very filmstrip.
     */
    filmstrip: {
        alignItems: 'flex-end',
        alignSelf: 'stretch',
        bottom: BoxModel.margin,
        flex: 1,
        flexDirection: 'column',
        left: 0,
        position: 'absolute',
        right: 0
    },

    /**
     * The style of the content container of the ScrollView which is placed
     * inside filmstrip and which contains the participants' thumbnails in order
     * to allow scrolling through them if they do not fit within the display.
     */
    filmstripScrollViewContentContainer: {
        paddingHorizontal: BoxModel.padding
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
        marginLeft: 2,
        marginRight: 2,
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
