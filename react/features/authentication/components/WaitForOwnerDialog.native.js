import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import { cancelWaitForOwner, _openLoginDialog } from '../actions';
import styles from './styles';

/**
 * The dialog is display in XMPP password + guest access configuration, after
 * user connects from anonymous domain and the conference does not exist yet.
 *
 * See {@link LoginDialog} description for more details.
 */
class WaitForOwnerDialog extends Component {
    /**
     * WaitForOwnerDialog component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The name of the conference room (without the domain part).
         */
        _room: PropTypes.string,

        /**
         * Redux store dispatch function.
         */
        dispatch: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new WaitForWonderDialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onLogin = this._onLogin.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _room: room,
            t
        } = this.props;

        return (
            <Dialog
                okTitleKey = { 'dialog.IamHost' }
                onCancel = { this._onCancel }
                onSubmit = { this._onLogin }
                titleKey = 'dialog.WaitingForHost'>
                <Text style = { styles.waitForOwnerDialog }>
                    {
                        this.renderHTML(t('dialog.WaitForHostMsg', { room }))
                    }
                </Text>
            </Dialog>
        );
    }

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(cancelWaitForOwner());
    }

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        this.props.dispatch(_openLoginDialog());
    }

    /**
     * Renders a specific <tt>string</tt> which may contain HTML.
     *
     * @param {string} html - The <tt>string</tt> which may contain HTML to
     * render.
     * @returns {string}
     */
    _renderHTML(html) {
        if (typeof html === 'string') {
            // TODO Limited styling may easily be provided by utilizing Text
            // with style.
            return html.replace(/<\\?b>/gi, '');
        }

        return html;
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
    const {
        authRequired
    } = state['features/base/conference'];

    return {
        _room: authRequired && authRequired.getName()
    };
}

export default translate(connect(_mapStateToProps)(WaitForOwnerDialog));
