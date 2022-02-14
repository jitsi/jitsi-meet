// @flow

import { ColorSchemeRegistry, schemeColor } from '../../../base/color-scheme';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { SMALL_THUMBNAIL_SIZE } from '../../constants';

/**
 * Size for the Avatar.
 */
export const AVATAR_SIZE = 50;

const indicatorContainer = {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    margin: 2,
    padding: 2
};

/**
 * The styles of the feature filmstrip.
 */
export default {

    /**
     * The FlatList content container styles.
     */
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 0
    },

    /**
     * The display name container.
     */
    displayNameContainer: {
        padding: 2
    },

    /**
     * The style of the narrow {@link Filmstrip} version which displays
     * thumbnails in a row at the bottom of the screen.
     */
    filmstripNarrow: {
        flexDirection: 'row',
        flexGrow: 0,
        justifyContent: 'flex-end',
        marginBottom: 5
    },

    /**
     * The style of the wide {@link Filmstrip} version which displays thumbnails
     * in a column on the short size of the screen.
     *
     * NOTE: width is calculated based on the children, but it should also align
     * to {@code FILMSTRIP_SIZE}.
     */
    filmstripWide: {
        bottom: 0,
        flexDirection: 'column',
        flexGrow: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    /**
     * The styles for the FlatList container.
     */
    flatListContainer: {
        flexGrow: 1,
        flexShrink: 1,
        flex: 0
    },

    /**
     * The styles for the FlatList component in stage view.
     */
    flatListStageView: {
        flexGrow: 0
    },

    /**
     * The styles for the FlatList component in tile view.
     */
    flatListTileView: {
        flex: 0
    },

    /**
     * Container of the {@link LocalThumbnail}.
     */
    localThumbnail: {
        alignContent: 'stretch',
        alignSelf: 'stretch',
        aspectRatio: 1,
        flexShrink: 0,
        flexDirection: 'row'
    },

    /**
     * The style of a participant's Thumbnail which renders either the video or
     * the avatar of the associated participant.
     */
    thumbnail: {
        alignItems: 'stretch',
        backgroundColor: BaseTheme.palette.ui02,
        borderColor: '#424242',
        borderRadius: 4,
        borderStyle: 'solid',
        borderWidth: 1,
        flex: 1,
        height: SMALL_THUMBNAIL_SIZE,
        justifyContent: 'center',
        margin: 2,
        maxHeight: SMALL_THUMBNAIL_SIZE,
        maxWidth: SMALL_THUMBNAIL_SIZE,
        overflow: 'hidden',
        position: 'relative',
        width: SMALL_THUMBNAIL_SIZE
    },

    indicatorContainer,

    /**
     * The thumbnails indicator container.
     */
    thumbnailIndicatorContainer: {
        alignSelf: 'center',
        bottom: 4,
        flex: 1,
        flexDirection: 'row',
        left: 4,
        position: 'absolute',
        maxWidth: '95%',
        overflow: 'hidden',
        ...indicatorContainer
    },

    thumbnailTopIndicatorContainer: {
        padding: 4,
        position: 'absolute',
        top: 0,
        flexDirection: 'row'
    },

    thumbnailTopLeftIndicatorContainer: {
        left: 0
    },

    raisedHandIndicator: {
        ...indicatorContainer,
        backgroundColor: BaseTheme.palette.warning02
    },

    raisedHandIcon: {
        color: BaseTheme.palette.uiBackground
    },

    thumbnailRaisedHand: {
        borderWidth: 2,
        borderColor: BaseTheme.palette.warning02
    },

    thumbnailDominantSpeaker: {
        borderWidth: 4,
        borderColor: BaseTheme.palette.action01Hover
    }
};

/**
 * Color schemed styles for the @{code Thumbnail} component.
 */
ColorSchemeRegistry.register('Thumbnail', {

    /**
     * Tinting style of the on-stage participant thumbnail.
     */
    activeThumbnailTint: {
        backgroundColor: schemeColor('activeParticipantTint')
    },

    /**
     * Pinned video thumbnail style.
     */
    thumbnailPinned: {
        borderColor: schemeColor('activeParticipantHighlight'),
        shadowColor: schemeColor('activeParticipantHighlight'),
        shadowOffset: {
            height: 5,
            width: 5
        },
        shadowRadius: 5
    }
});
