// @flow

import { Component } from 'react';
import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { cancelWaitForOwner } from '../actions';

/**
 * The type of the React {@code Component} props of {@link WaitForOwnerDialog}.
 */
export type Props = {

    /**
     * The name of the conference room (without the domain part).
     */
    room: string,

    /**
     * Function to be invoked on authentication.
     */
    onAuthNow: ?Function,

    /**
    * Redux store dispatch function.
    */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements an abstract class for {@code WaitForOwnerDialog}.
 */
class AbstractWaitForOwnerDialog<S: *> extends Component < Props, S > {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._onLogin = this._onLogin.bind(this);
    }

    _onCancel: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        return this.props.dispatch(cancelWaitForOwner());
    }

    _onLogin: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        const { onAuthNow } = this.props;

        onAuthNow();
        console.log('Login');
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code WaitForOwnerDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _room: string
 * }}
 */
function _mapStateToProps(state) {
    const { authRequired } = state['features/base/conference'];

    return {
        room: authRequired && authRequired.getName()
    };
}

export default translate(connect(_mapStateToProps)(AbstractWaitForOwnerDialog));


