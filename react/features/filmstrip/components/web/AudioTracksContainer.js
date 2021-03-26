/* @flow */
import React from 'react';

import { AudioTrack, MEDIA_TYPE } from '../../../base/media';
import { connect } from '../../../base/redux';

/**
 * The type of the React {@code Component} props of {@link AudioTracksContainer}.
 */
type Props = {

    /**
     * All media tracks stored in redux.
     */
    _tracks: Array<Object>
};

/**
 * A container for the remote tracks audio elements.
 *
 * @param {Props} props - The props of the component.
 * @returns {Array<ReactElement>}
 */
function AudioTracksContainer(props: Props) {
    const { _tracks } = props;
    const remoteAudioTracks = _tracks.filter(t => !t.local && t.mediaType === MEDIA_TYPE.AUDIO);

    return (
        <div>
            {
                remoteAudioTracks.map(t => {
                    const { jitsiTrack, participantId } = t;
                    const audioTrackId = jitsiTrack && jitsiTrack.getId();
                    const id = `remoteAudio_${audioTrackId || ''}`;

                    return (
                        <AudioTrack
                            audioTrack = { t }
                            id = { id }
                            key = { id }
                            participantId = { participantId } />);
                })
            }
        </div>);
}

/**
 * Maps (parts of) the Redux state to the associated {@code AudioTracksContainer}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    // NOTE: The disadvantage of this approach is that the component will re-render on any track change.
    // One way to solve the problem would be to pass only the participant ID to the AudioTrack component and
    // find the corresponding track inside the AudioTrack's mapStateToProps. But currently this will be very
    // inefficient because features/base/tracks is an array and in order to find a track by participant ID
    // we need to go trough the array. Introducing a map participantID -> track could be beneficial in this case.
    return {
        _tracks: state['features/base/tracks']
    };
}

export default connect(_mapStateToProps)(AudioTracksContainer);
