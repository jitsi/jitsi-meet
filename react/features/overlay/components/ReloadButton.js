import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import { reconnectNow } from '../functions';

/**
 * Implements a React Component for button for the overlays that will reload
 * the page.
 */
class ReloadButton extends Component {
    /**
     * PageReloadOverlay component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The function to translate human-readable text.
         *
         * @public
         * @type {Function}
         */
        t: React.PropTypes.func,

        /**
         * The translation key for the text in the button.
         *
         * @type {string}
         */
        textKey: React.PropTypes.string.isRequired
    }

    /**
     * Renders the button for relaod the page if necessary.
     *
     * @returns {ReactElement|null}
     * @private
     */
    render() {
        const className
            = 'button-control button-control_overlay button-control_center';
        const { t } = this.props;

        /* eslint-disable react/jsx-handler-names */

        return (
            <button
                className = { className }
                onClick = { reconnectNow }>
                { t(this.props.textKey) }
            </button>
        );

        /* eslint-enable react/jsx-handler-names */
    }

}

export default translate(ReloadButton);
