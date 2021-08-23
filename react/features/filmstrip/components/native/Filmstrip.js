// @flow

import React, { Component } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

import { Platform } from '../../../base/react';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { isFilmstripVisible, shouldRemoteVideosBeVisible } from '../../functions';

import LocalThumbnail from './LocalThumbnail';
import Thumbnail from './Thumbnail';
import styles from './styles';

// Immutable reference to avoid re-renders.
const NO_REMOTE_VIDEOS = [];

/**
 * Filmstrip component's property types.
 */
type Props = {

    /**
     * Application's aspect ratio.
     */
    _aspectRatio: Symbol,

    /**
     * The participants in the conference.
     */
    _participants: Array<any>,

    /**
     * The indicator which determines whether the filmstrip is visible.
     */
    _visible: boolean
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * mobile/React Native.
 *
 * @extends Component
 */
class Filmstrip extends Component<Props> {
    /**
     * Whether the local participant should be rendered separately from the
     * remote participants i.e. outside of their {@link ScrollView}.
     */
    _separateLocalThumbnail: boolean;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // XXX Our current design is to have the local participant separate from
        // the remote participants. Unfortunately, Android's Video
        // implementation cannot accommodate that because remote participants'
        // videos appear on top of the local participant's video at times.
        // That's because Android's Video utilizes EGL and EGL gives us only two
        // practical layers in which we can place our participants' videos:
        // layer #0 sits behind the window, creates a hole in the window, and
        // there we render the LargeVideo; layer #1 is known as media overlay in
        // EGL terms, renders on top of layer #0, and, consequently, is for the
        // Filmstrip. With the separate LocalThumnail, we should have left the
        // remote participants' Thumbnails in layer #1 and utilized layer #2 for
        // LocalThumbnail. Unfortunately, layer #2 is not practical (that's why
        // I said we had two practical layers only) because it renders on top of
        // everything which in our case means on top of participant-related
        // indicators such as moderator, audio and video muted, etc. For now we
        // do not have much of a choice but to continue rendering LocalThumbnail
        // as any other remote Thumbnail on Android.
        this._separateLocalThumbnail = Platform.OS !== 'android';
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _aspectRatio, _participants, _visible } = this.props;

        if (!_visible) {
            return null;
        }

        const isNarrowAspectRatio = _aspectRatio === ASPECT_RATIO_NARROW;
        const filmstripStyle = isNarrowAspectRatio ? styles.filmstripNarrow : styles.filmstripWide;

        return (
            <SafeAreaView style = { filmstripStyle }>
                {
                    this._separateLocalThumbnail
                        && !isNarrowAspectRatio
                        && <LocalThumbnail />
                }
                <ScrollView
                    horizontal = { isNarrowAspectRatio }
                    showsHorizontalScrollIndicator = { false }
                    showsVerticalScrollIndicator = { false }
                    style = { styles.scrollView } >
                    {
                        !this._separateLocalThumbnail && !isNarrowAspectRatio
                            && <LocalThumbnail />
                    }
                    {

                        this._sort(_participants, isNarrowAspectRatio)
                            .map(id => (
                                <Thumbnail
                                    key = { id }
                                    participantID = { id } />))

                    }
                    {
                        !this._separateLocalThumbnail && isNarrowAspectRatio
                            && <LocalThumbnail />
                    }
                </ScrollView>
                {
                    this._separateLocalThumbnail && isNarrowAspectRatio
                        && <LocalThumbnail />
                }
            </SafeAreaView>
        );
    }

    /**
     * Sorts a specific array of {@code Participant}s in display order.
     *
     * @param {Participant[]} participants - The array of {@code Participant}s
     * to sort in display order.
     * @param {boolean} isNarrowAspectRatio - Indicates if the aspect ratio is
     * wide or narrow.
     * @private
     * @returns {Participant[]} A new array containing the elements of the
     * specified {@code participants} array sorted in display order.
     */
    _sort(participants, isNarrowAspectRatio) {
        // XXX Array.prototype.sort() is not appropriate because (1) it operates
        // in place and (2) it is not necessarily stable.

        const sortedParticipants = [
            ...participants
        ];

        if (isNarrowAspectRatio) {
            // When the narrow aspect ratio is used, we want to have the remote
            // participants from right to left with the newest added/joined to
            // the leftmost side. The local participant is the leftmost item.
            sortedParticipants.reverse();
        }

        return sortedParticipants;
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { enabled, remoteParticipants } = state['features/filmstrip'];
    const showRemoteVideos = shouldRemoteVideosBeVisible(state);

    return {
        _aspectRatio: state['features/base/responsive-ui'].aspectRatio,
        _participants: showRemoteVideos ? remoteParticipants : NO_REMOTE_VIDEOS,
        _visible: enabled && isFilmstripVisible(state)
    };
}

export default connect(_mapStateToProps)(Filmstrip);
