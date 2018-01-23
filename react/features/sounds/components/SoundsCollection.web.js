// @flow

import React, { Component } from 'react';

import { Audio } from '../../base/media';

import { INCOMING_MSG_SOUND_ID } from '../constants';
import BaseSoundsCollection from './BaseSoundsCollection';

/**
 * The sounds collection for the web app.
 */
export default class SoundsCollection extends Component<*> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <BaseSoundsCollection
                participantJoinedSound = 'sounds/joined.wav'
                participantLeftSound = { 'sounds/left.wav' } >
                <Audio
                    audioId = { INCOMING_MSG_SOUND_ID }
                    src = 'sounds/incomingMessage.wav' />
            </BaseSoundsCollection>
        );
    }
}

