/* global APP */

import React, { Component } from 'react';

/**
 * Implements an abstract React Component for overlay - the components which are
 * displayed on top of the application covering the whole screen.
 *
 * @abstract
 */
export default class AbstractOverlay extends Component {
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
             * Indicates the CSS style of the overlay. If true, then ighter;
             * darker, otherwise.
             *
             * @type {boolean}
             */
            isLightOverlay: false
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const containerClass
            = this.state.isLightOverlay
                ? 'overlay__container-light'
                : 'overlay__container';

        return (
            <div
                className = { containerClass }
                id = 'overlay'>
                <div className = 'overlay__content'>
                    {
                        this._renderOverlayContent()
                    }
                </div>
            </div>
        );
    }

    /**
     * Reloads the page.
     *
     * @returns {void}
     * @protected
     */
    _reconnectNow() {
        // FIXME: In future we should dispatch an action here that will result
        // in reload.
        APP.ConferenceUrl.reload();
    }

    /**
     * Abstract method which should be used by subclasses to provide the overlay
     * content.
     *
     * @returns {ReactElement|null}
     * @protected
     */
    _renderOverlayContent() {
        return null;
    }
}
