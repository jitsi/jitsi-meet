import PropTypes from 'prop-types';
import React, { Component } from 'react';

// Mobile friendly solution!
// import styled, { keyframes } from 'styled-components';
// import { merge, rollIn, zoomIn } from 'react-animations';

// const tadaFlip = merge(rollIn, zoomIn);
//
// const bounceAnimation = keyframes`${tadaFlip}`;
//
// const BouncySpan = styled.span`
//         animation: ${bounceAnimation} 2s;
//         animation-direction: alternate;
//     `;

/**
 * Implements a React {@link Component} to render an emoji icon.
 */
export default class EmojiIcon extends Component {
    /**
     * {@code Emoji}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The css style class name.
         */
        className: PropTypes.string,

        /**
         * The emoji name.
         */
        emojiName: PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const iconClassName
            = `emoji-icon emoji-icon-${this.props.emojiName} animation-target`;

        // Part of the mobile friendly solution!
        // return <BouncySpan className = { iconClassName } />;

        return <span className = { iconClassName } />;
    }
}

