import { ImageCache } from 'react-native-img-cache';

/**
 * Notifies about the successful download of an <tt>Image</tt> source. The name
 * is inspired by <tt>Image</tt>. The downloaded <tt>Image</tt> source is not
 * available because (1) I do not know how to get it from {@link ImageCache} and
 * (2) we do not need it bellow. The function was explicitly introduced to cut
 * down on unnecessary <tt>ImageCache</tt> <tt>observer</tt> instances.
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
 * Initiates the retrieval of a specific <tt>Image</tt> source (if it has not
 * been initiated already). Due to limitations of {@link ImageCache}, the source
 * may have at most one <tt>uri</tt>. The name is inspired by <tt>Image</tt>.
 *
 * @param {Object} source - The <tt>Image</tt> source with preferably exactly
 * one <tt>uri</tt>.
 * @public
 * @returns {void}
 */
export function prefetch(source) {
    ImageCache.get().on(source, /* observer */ _onLoad, /* immutable */ true);
}
