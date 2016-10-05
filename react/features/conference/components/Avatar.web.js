import React, { Component } from 'react';

import { styles } from './styles';

/**
 * Display a participant avatar.
 */
export default class Avatar extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const style = {

            // XXX Avatar is expected to display the whole image.
            objectFit: 'contain',

            ...styles.avatar,
            ...this.props.style
        };

        return (
            <img
                src = { this.props.uri }
                style = { style } />
        );
    }
}

/**
 * Avatar component's property types.
 *
 * @static
 */
Avatar.propTypes = {

    /**
     * The optional style to add to an Avatar in order to customize its base
     * look (and feel).
     */
    style: React.PropTypes.object,
    uri: React.PropTypes.string
};
