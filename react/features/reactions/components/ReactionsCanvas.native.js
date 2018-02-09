/* @flow */

import React, { Component } from 'react';
import { View } from 'react-native';

import EmojiIcon from './EmojiIcon';

/**
 * Base style for the {@code TintedView} component.
 */
const BASE_STYLE = {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
};

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
            <View style = { BASE_STYLE }>
                <EmojiIcon emojiName = 'thumbsup' />
            </View>
        );
    }
}

