// @flow

import React, { Component } from 'react';

type Props = {
    onClose: Function
};

/**
 * The list of supported reactions (i.e. reaction buttons).
 */
const REACTIONS = [
];

// FIXME Pretend there's a list of supported reactions (i.e. reaction buttons).
for (let i = 1; i < 21; ++i) {
    REACTIONS.push(`smiley${i}`);
}

/**
 * Represents the dialog in the terms of {@link ToolbarButtonWithDialog} which
 * renders the list of supported reactions (i.e. reaction buttons).
 */
export default class ReactionsDialog extends Component<Props> {
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
    _onClick(reaction) { // eslint-disable-line no-unused-vars
        // Close this ReactionsDialog.
        this.props.onClose();
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
                    src = { `images/smileys/${reaction}.svg` } />
            );

            /* eslint-enable react/jsx-no-bind */
        }

        return contents;
    }
}
