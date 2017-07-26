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
                <div id = 'remotePresenceMessage' />
                <span id = 'remoteConnectionMessage' />
                <div>
                    <div className = 'video_blurred_container'>
                        <video
                            autoPlay = { true }
                            id = 'largeVideoBackground'
                            muted = 'true' />
                    </div>
                    {

                        /**
                         * FIXME: the architecture of elements related to the
                         * large video and  the naming. The background is not
                         * part of largeVideoWrapper because we are controlling
                         * the size of the video through largeVideoWrapper.
                         * That's why we need another container for the the
                         * background and the largeVideoWrapper in order to
                         * hide/show them.
                         */
                    }
                    <div id = 'largeVideoWrapper'>
                        <video
                            autoPlay = { true }
                            id = 'largeVideo'
                            muted = { true } />
                    </div>
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
