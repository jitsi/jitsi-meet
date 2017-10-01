import { ImageCache } from './';

/**
 * Notifies about the successful download of an {@code Image} source. The name
 * is inspired by {@code Image}. The downloaded {@code Image} source is not
 * available because (1) I do not know how to get it from {@link ImageCache} and
 * (2) we do not need it bellow. The function was explicitly introduced to cut
 * down on unnecessary {@code ImageCache} {@code observer} instances.
 *
 * @private
 * @returns {void}
 */
function _onLoad() {
    // ImageCache requires an observer; otherwise, we do not need it because we
    // merely want to initiate the download and do not care what happens with it
    // afterwards.
}

/**
 * Initiates the retrieval of a specific {@code Image} source (if it has not
 * been initiated already). Due to limitations of {@link ImageCache}, the source
 * may have at most one {@code uri}. The name is inspired by {@code Image}.
 *
 * @param {Object} source - The {@code Image} source with preferably exactly
 * one {@code uri}.
 * @public
 * @returns {void}
 */
export function prefetch(source) {
    ImageCache && ImageCache.get().on(source, _onLoad, /* immutable */ true);
}
