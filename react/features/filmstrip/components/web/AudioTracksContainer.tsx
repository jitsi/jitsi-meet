import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import AudioTrack from '../../../base/media/components/web/AudioTrack';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { ITrack } from '../../../base/tracks/types';

/**
 * The type of the React {@code Component} props of {@link AudioTracksContainer}.
 */
interface IProps {

    /**
     * All media tracks stored in redux.
     */
    _tracks: ITrack[];
}

/**
 * A container for the remote tracks audio elements.
 *
 * @param {IProps} props - The props of the component.
 * @returns {Array<ReactElement>}
 */
function AudioTracksContainer(props: IProps) {
    const { _tracks } = props;
    const remoteAudioTracks = _tracks.filter(t => !t.local && t.mediaType === MEDIA_TYPE.AUDIO);

    return (
        <div>
            {
                remoteAudioTracks.map(t => {
                    const { jitsiTrack, participantId } = t;
                    const audioTrackId = jitsiTrack?.getId();
                    const id = `remoteAudio_${audioTrackId || ''}`;

                    return (
                        <AudioTrack
                            audioTrack = { t }
                            id = { id }
                            key = { id }
                            participantId = { participantId } />
                    );
                })
            }
        </div>
    );
}

/**
 * Maps (parts of) the Redux state to the associated {@code AudioTracksContainer}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    // NOTE: The disadvantage of this approach is that the component will re-render on any track change.
    // One way to solve the problem would be to pass only the participant ID to the AudioTrack component and
    // find the corresponding track inside the AudioTrack's mapStateToProps. But currently this will be very
    // inefficient because features/base/tracks is an array and in order to find a track by participant ID
    // we need to go through the array. Introducing a map participantID -> track could be beneficial in this case.
    return {
        _tracks: state['features/base/tracks']
    };
}

export default connect(_mapStateToProps)(AudioTracksContainer);
