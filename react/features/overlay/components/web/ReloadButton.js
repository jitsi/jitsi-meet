// @flow

import React, { Component } from 'react';

import { reloadNow } from '../../../app';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

/**
 * The type of the React {@code Component} props of {@link ReloadButton}.
 */
type Props = {

    /**
     * Reloads the page.
     */
    _reloadNow: Function,

    /**
     * The function to translate human-readable text.
     */
    t: Function,

    /**
     * The translation key for the text in the button.
     */
    textKey: string
};

/**
 * Implements a React Component for button for the overlays that will reload
 * the page.
 */
class ReloadButton extends Component<Props> {
    /**
     * Renders the button for relaod the page if necessary.
     *
     * @private
     * @returns {ReactElement}
     */
    render() {
        const className
            = 'button-control button-control_overlay button-control_center';

        /* eslint-disable react/jsx-handler-names */

        return (
            <button
                className = { className }
                onClick = { this.props._reloadNow }>
                { this.props.t(this.props.textKey) }
            </button>
        );

        /* eslint-enable react/jsx-handler-names */
    }
}

/**
 * Maps part of redux actions to component's props.
 *
 * @param {Function} dispatch - Redux's {@code dispatch} function.
 * @private
 * @returns {Object}
 */
function _mapDispatchToProps(dispatch: Function): Object {
    return {
        /**
         * Dispatches the redux action to reload the page.
         *
         * @protected
         * @returns {Object} Dispatched action.
         */
        _reloadNow() {
            dispatch(reloadNow());
        }
    };
}

export default translate(connect(undefined, _mapDispatchToProps)(ReloadButton));
