import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Modal, Text, View } from 'react-native';

import { translate } from '../../base/i18n';
import { _showLoginDialog, cancelWaitForOwner } from '../actions';
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
         * Redux store dispatch function.
         */
        dispatch: React.PropTypes.func,

        /**
         * The name of the conference room (without the domain part).
         */
        roomName: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new WaitForWonderDialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onLogin = this._onLogin.bind(this);
        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            roomName,
            t
        } = this.props;

        return (
            <Modal
                onRequestClose = { this._onCancel }
                style = { styles.outerArea }
                transparent = { true } >
                <View style = { styles.dialogBox } >
                    <Text>
                        { t(
                            'dialog.WaitForHostMsg',
                            { room: roomName })
                        }
                    </Text>
                    <Button
                        onPress = { this._onLogin }
                        title = { t('dialog.IamHost') } />
                    <Button
                        onPress = { this._onCancel }
                        title = { t('dialog.Cancel') } />
                </View>
            </Modal>
        );
    }

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        this.props.dispatch(_showLoginDialog());
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
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code WaitForOwnerDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     roomName: string
 * }}
 */
function _mapStateToProps(state) {
    const {
        authRequired
    } = state['features/base/conference'];

    return {
        roomName: authRequired && authRequired.getName()
    };
}

export default translate(connect(_mapStateToProps)(WaitForOwnerDialog));
