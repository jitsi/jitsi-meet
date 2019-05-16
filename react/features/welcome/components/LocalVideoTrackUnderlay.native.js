// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { VideoTrack } from '../../base/media';
import { TintedView } from '../../base/react';
import { connect } from '../../base/redux';
import { getLocalVideoTrack } from '../../base/tracks';

import styles from './styles';

/**
 * The type of the React {@code Component} props of
 * {@link LocalVideoTrackUnderlay}.
 */
type Props = {

    /**
     * The redux representation of the local participant's video track.
     */
    _localVideoTrack: Object,

    /**
     * React Elements to display within the component.
     */
    children: React$Node,

    /**
     * The style, if any, to apply to {@link LocalVideoTrackUnderlay} in
     * addition to its default style.
     */
    style: Object
};

/**
 * Implements a React {@code Component} which underlays the local video track,
 * if any, underneath its children.
 */
class LocalVideoTrackUnderlay extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @override
     * @returns {ReactElement}
     */
    render() {
        return (
            <View
                style = { [
                    styles.localVideoTrackUnderlay,
                    this.props.style
                ] }>
                <VideoTrack videoTrack = { this.props._localVideoTrack } />
                <TintedView>
                    { this.props.children }
                </TintedView>
            </View>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code LocalVideoTrackUnderlay}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _localVideoTrack: (Track|undefined)
 * }}
 */
function _mapStateToProps(state) {
    return {
        _localVideoTrack: getLocalVideoTrack(state['features/base/tracks'])
    };
}

export default connect(_mapStateToProps)(LocalVideoTrackUnderlay);
