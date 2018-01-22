// @flow

import React, { Component } from 'react';

import { Audio } from '../../base/media';
import { Container } from '../../base/react';

import {
    PARTICIPANT_JOINED_SOUND_ID,
    PARTICIPANT_LEFT_SOUND_ID
} from '../constants';

/**
 * {@links BaseSoundsCollection}'s properties.
 */
type Props = {

    /**
     * The children to be displayed within this BaseSoundsCollection.
     * Usually this would contain sounds specific only to the one of
     * the platforms.
     */
    children?: React$Node,

    /**
     * The sound file reference/path for the participant joined event.
     */
    participantJoinedSound: any,

    /**
     * The sound file reference/path for the participant left event.
     */
    participantLeftSound: any
}

/**
 * Collections of all global sounds used by the app for playing audio
 * notifications in response to various events.
 */
export default class BaseSoundsCollection extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Container>
                {/*
                  * The audio resources used for playing sounds for various
                  * events during the conference.
                  */}
                <Audio
                    audioId = { PARTICIPANT_JOINED_SOUND_ID }
                    src = { this.props.participantJoinedSound } />
                <Audio
                    audioId = { PARTICIPANT_LEFT_SOUND_ID }
                    src = { this.props.participantLeftSound } />
                { this.props.children }
            </Container>
        );
    }
}

