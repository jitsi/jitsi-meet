// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import EmojiIcon from './EmojiIcon';

type Props = {
    _reaction: string
};

/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * the conference participant who is on the local stage) on Web/React.
 *
 * @extends Component
 */
class ReactionsCanvas extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const reaction = this.props._reaction;

        if (!reaction) {
            return null;
        }

        // FIXME The use of key bellow is somewhat of a hack/workaround for
        // EmojiIcon: EmojiIcon doesn't seem to restart its animation upon
        // changing its emojiName value. So the key will force a new EmojiIcon
        // instance upon different reactions.

        return (
            <div className = 'emotionsCanvas'>
                <EmojiIcon
                    emojiName = { reaction }
                    key = { reaction } />
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated ReactionsCanvas' props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _reaction: string
 * }}
 */
function _mapStateToProps(state) { // eslint-disable-line no-unused-vars
    const stateFeatureReactions = state['features/reactions'];
    const receivedReactions
        = stateFeatureReactions && stateFeatureReactions.receivedReactions;

    // TODO Eventually and wherever appropriate (which is definitely not here),
    // pop reactions which have been rendered.
    const reaction
        = receivedReactions && receivedReactions.length
            ? receivedReactions[0]
            : undefined;

    return {
        _reaction: reaction
    };
}

export default connect(_mapStateToProps)(ReactionsCanvas);
