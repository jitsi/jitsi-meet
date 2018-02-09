// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { sendReaction } from '../actions';

type Props = {
    _onSendReaction: Function,

    onClose: Function
};

/**
 * The list of supported reactions (i.e. reaction buttons).
 */
const REACTIONS = [
];

// FIXME Pretend there's a list of supported reactions (i.e. reaction buttons).
REACTIONS.push('heart');
REACTIONS.push('poop');
REACTIONS.push('thumbsup');
REACTIONS.push('thumbsdown');
REACTIONS.push('bulb');
REACTIONS.push('clap');
REACTIONS.push('fistbump');
REACTIONS.push('highfive');
REACTIONS.push('perfect');
REACTIONS.push('sleep');
REACTIONS.push('star');
for (let i = 1; i < 11; ++i) {

    REACTIONS.push(`smiley${i}`);
}

/**
 * Represents the dialog in the terms of {@link ToolbarButtonWithDialog} which
 * renders the list of supported reactions (i.e. reaction buttons).
 */
class ReactionsDialog extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        return (
            <div className = 'reactions-dialog'>
                <h3 className = 'reactions-dialog-title'>
                    Reactions
                </h3>
                <div className = 'reactions-dialog-contents'>
                    { this._renderContents() }
                </div>
            </div>
        );
    }

    /**
     * Handles the click on a reaction (button).
     *
     * @param {*} reaction - The reaction (button) which was clicked.
     * @returns {void}
     */
    _onClick(reaction) {
        // this.props.onClose();
        this.props._onSendReaction(reaction);
    }

    /**
     * Renders the contents of this ReactionsDialog minus its title.
     *
     * @returns {React$Node}
     */
    _renderContents() {
        const contents = [];

        for (const reaction of REACTIONS) {
            /* eslint-disable react/jsx-no-bind */

            contents.push(
                <img
                    className = 'reactions-dialog-cell'
                    onClick = { this._onClick.bind(this, reaction) }
                    src = { `images/emojis/${reaction}.png` } />
            );

            /* eslint-enable react/jsx-no-bind */
        }

        return contents;
    }
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 * }}
 */
function _mapDispatchToProps(dispatch) {
    return {
        /**
         * Sends a specific reaction of the local participant to the remote
         * participants.
         *
         * @param {string} reaction - The reaction of the local participant to
         * send to the remote participants.
         * @private
         * @returns {void}
         */
        _onSendReaction(reaction) {
            dispatch(sendReaction(reaction));
        }
    };
}

/**
 * Maps (parts of) the redux state to the associated ReactionsDialog's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state) { // eslint-disable-line no-unused-vars
    return {
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(ReactionsDialog);
