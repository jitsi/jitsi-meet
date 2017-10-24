// @flow

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
class WaitForOwnerDialog extends Component<*> {
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
                        this._renderHTML(t('dialog.WaitForHostMsg', { room }))
                    }
                </Text>
            </Dialog>
        );
    }

    _onCancel: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(cancelWaitForOwner());
    }

    _onLogin: () => void;

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
     * Renders a specific {@code string} which may contain HTML.
     *
     * @param {string|undefined} html - The {@code string} which may
     * contain HTML to render.
     * @returns {ReactElement[]|string}
     */
    _renderHTML(html: ?string) {
        if (typeof html === 'string') {
            // At the time of this writing, the specified HTML contains a couple
            // of spaces one after the other. They do not cause a visible
            // problem on Web, because the specified HTML is rendered as, well,
            // HTML. However, we're not rendering HTML here.

            // eslint-disable-next-line no-param-reassign
            html = html.replace(/\s{2,}/gi, ' ');

            // Render text in <b>text</b> in bold.
            const opening = /<\s*b\s*>/gi;
            const closing = /<\s*\/\s*b\s*>/gi;
            let o;
            let c;
            let prevClosingLastIndex = 0;
            const r = [];

            // eslint-disable-next-line no-cond-assign
            while (o = opening.exec(html)) {
                closing.lastIndex = opening.lastIndex;

                // eslint-disable-next-line no-cond-assign
                if (c = closing.exec(html)) {
                    r.push(html.substring(prevClosingLastIndex, o.index));
                    r.push(
                        <Text style = { styles.boldDialogText }>
                            { html.substring(opening.lastIndex, c.index) }
                        </Text>);
                    opening.lastIndex
                        = prevClosingLastIndex
                        = closing.lastIndex;
                } else {
                    break;
                }
            }
            if (prevClosingLastIndex < html.length) {
                r.push(html.substring(prevClosingLastIndex));
            }

            return r;
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
    const { authRequired } = state['features/base/conference'];

    return {
        _room: authRequired && authRequired.getName()
    };
}

export default translate(connect(_mapStateToProps)(WaitForOwnerDialog));
