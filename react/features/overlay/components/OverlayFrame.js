import React, { Component } from 'react';

declare var interfaceConfig: Object;

/**
 * Implements a React Component for the frame of the overlays.
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
    };

    /**
     * Initializes a new AbstractOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Indicates whether the filmstrip only mode is enabled or not.
             *
             * @type {boolean}
             */
            filmstripOnly: interfaceConfig.filmStripOnly
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
