/* @flow */

import React, { Component } from 'react';

import EmojiIcon from './EmojiIcon';


/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * the conference participant who is on the local stage) on Web/React.
 *
 * @extends Component
 */
export default class ReactionsCanvas extends Component<*> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'emotionsCanvas'>
                <EmojiIcon
                    emojiName = 'thumbsup' />
            </div>
        );
    }
}

