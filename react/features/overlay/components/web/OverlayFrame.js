// @flow

import React, { Component } from 'react';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link OverlayFrame}.
 */
type Props = {

    /**
     * The children components to be displayed into the overlay frame.
     */
    children: React$Node,

    /**
     * Indicates the css style of the overlay. If true, then lighter; darker,
     * otherwise.
     */
    isLightOverlay?: boolean
};

/**
 * The type of the React {@code Component} state of {@link OverlayFrame}.
 */
type State = {

    /**
     * Whether or not the application is currently displaying in filmstrip only
     * mode.
     */
    filmstripOnly: boolean
};

/**
 * Implements a React {@link Component} for the frame of the overlays.
 */
export default class OverlayFrame extends Component<Props, State> {
    /**
     * Initializes a new AbstractOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            /**
             * Indicates whether the filmstrip only mode is enabled or not.
             *
             * @type {boolean}
             */
            filmstripOnly:
                typeof interfaceConfig !== 'undefined'
                    && interfaceConfig.filmStripOnly
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        let containerClass = this.props.isLightOverlay
            ? 'overlay__container-light' : 'overlay__container';
        let contentClass = 'overlay__content';

        if (this.state.filmstripOnly) {
            containerClass += ' filmstrip-only';
            contentClass += ' filmstrip-only';
        }

        return (
            <div
                className = { containerClass }
                id = 'overlay'>
                <div className = { contentClass }>
                    {
                        this.props.children
                    }
                </div>
            </div>
        );
    }
}
