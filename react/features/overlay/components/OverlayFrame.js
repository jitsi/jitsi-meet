import React, { Component } from 'react';

/**
 * Implements an abstract React Component for overlay - the components which are
 * displayed on top of the application covering the whole screen.
 *
 * @abstract
 */
export default class OverlayFrame extends Component {
    /**
     * OverlayFrame component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The children components to be displayed into the overlay frame.
         */
        children: React.PropTypes.node.isRequired,

        /**
         * Indicates the css style of the overlay. If true, then lighter;
         * darker, otherwise.
         *
         * @type {boolean}
         */
        isLightOverlay: React.PropTypes.bool
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const containerClass = this.props.isLightOverlay
            ? 'overlay__container-light' : 'overlay__container';

        return (
            <div
                className = { containerClass }
                id = 'overlay'>
                <div className = 'overlay__content'>
                    {
                        this.props.children
                    }
                </div>
            </div>
        );
    }
}
