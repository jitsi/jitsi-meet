// @flow

import React, { Component } from 'react';
import { Image } from 'react-native';

/**
 * The type of the React {@code Component} props of {@link Image}.
 */
type Props = {

    /**
     * The ImageSource to be rendered as image.
     */
    src: Object,

    /**
     * The component's external style
     */
    style: Object
};

/**
 * A component rendering aN IMAGE.
 *
 * @extends Component
 */
export default class ImageImpl extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Image
                source = { this.props.src }
                style = { this.props.style } />
        );
    }
}
