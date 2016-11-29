import { BoxModel, ColorPalette } from '../../base/styles';

/**
 * Film strip related styles common to both Web and native.
 */
export const styles = {
    /**
     * Audio muted indicator style.
     */
    audioMutedIndicator: {
        backgroundColor: 'transparent',
        color: ColorPalette.white,
        left: 20,
        position: 'absolute',
        top: 1
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
        bottom: 2,
        left: 1,
        padding: 5,
        position: 'absolute'
    },

    /**
     * The style of the Container which represents the very film strip.
     */
    filmStrip: {
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
     * inside filmStrip and which contains the participants' thumbnails in order
     * to allow scrolling through them if they do not fit within the display.
     */
    filmStripScrollViewContentContainer: {
        paddingHorizontal: BoxModel.padding
    },

    /**
     * Moderator indicator style.
     */
    moderatorIndicator: {
        backgroundColor: 'transparent',
        color: ColorPalette.white,
        left: 1,
        position: 'absolute',
        top: 1
    },

    /**
     * Video thumbnail style.
     */
    thumbnail: {
        alignItems: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        borderColor: '#424242',
        borderStyle: 'solid',
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
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
    },

    /**
     * Video muted indicator style.
     */
    videoMutedIndicator: {
        backgroundColor: 'transparent',
        color: ColorPalette.white,
        left: 35,
        position: 'absolute',
        top: 1
    }
};
