import React, { Component } from 'react';
import { Image } from 'react-native';

import { styles } from './styles';

/**
 * Display a participant avatar.
 */
export default class Avatar extends Component {
    /**
     * Avatar component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The optional style to add to an Avatar in order to customize its base
         * look (and feel).
         */
        style: React.PropTypes.object,
        uri: React.PropTypes.string
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Image

                // XXX Avatar is expected to display the whole image.
                resizeMode = 'contain'
                source = {{ uri: this.props.uri }}
                style = { [ styles.avatar, this.props.style ] } />
        );
    }
}
