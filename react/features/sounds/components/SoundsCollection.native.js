// @flow

import React, { Component } from 'react';

import BaseSoundsCollection from './BaseSoundsCollection';

/**
 * Points to the sound file which will be played when new participant joins
 * the conference.
 */
const _JOINED_SOUND = require('../../../../sounds/joined.wav');

/**
 * Points to the sound file which will be played when any participant leaves
 * the conference.
 */
const _LEFT_SOUND = require('../../../../sounds/left.wav');

/**
 * The sounds collection for the mobile app.
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
                participantJoinedSound = { _JOINED_SOUND }
                participantLeftSound = { _LEFT_SOUND } />
        );
    }
}

