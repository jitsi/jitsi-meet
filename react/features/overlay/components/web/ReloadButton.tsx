import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { reloadNow } from '../../../app/actions.web';
import { IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';

/**
 * The type of the React {@code Component} props of {@link ReloadButton}.
 */
interface IProps extends WithTranslation {

    /**
     * Reloads the page.
     */
    _reloadNow: () => void;

    /**
     * The translation key for the text in the button.
     */
    textKey: string;
}

/**
 * Implements a React Component for button for the overlays that will reload
 * the page.
 */
class ReloadButton extends Component<IProps> {
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
function _mapDispatchToProps(dispatch: IStore['dispatch']) {
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
