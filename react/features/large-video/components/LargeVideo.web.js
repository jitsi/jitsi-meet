/* @flow */

import React, { Component } from 'react';

import { Watermarks } from '../../base/react';
import { VideoStatusLabel } from '../../video-status-label';

/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * the conference participant who is on the local stage) on Web/React.
 *
 * @extends Component
 */
export default class LargeVideo extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'videocontainer'
                id = 'largeVideoContainer'>
                <div id = 'sharedVideo'>
                    <div id = 'sharedVideoIFrame' />
                </div>
                <div id = 'etherpad' />

                <Watermarks />

                <div id = 'dominantSpeaker'>
                    <div className = 'dynamic-shadow' />
                    <img
                        id = 'dominantSpeakerAvatar'
                        src = '' />
                </div>
                <span id = 'remoteConnectionMessage' />
                <div id = 'largeVideoWrapper'>
                    <video
                        autoPlay = { true }
                        id = 'largeVideo'
                        muted = { true } />
                </div>
                <span id = 'localConnectionMessage' />

                <VideoStatusLabel />

                <span
                    className = 'video-state-indicator centeredVideoLabel'
                    id = 'recordingLabel'>
                    <span id = 'recordingLabelText' />
                    <img
                        className = 'recordingSpinner'
                        id = 'recordingSpinner'
                        src = 'images/spin.svg' />
                </span>
            </div>
        );
    }
}
