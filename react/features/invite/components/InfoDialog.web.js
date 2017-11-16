/* global interfaceConfig */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { getInviteURL } from '../../base/connection';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import AddPeopleDialog from './AddPeopleDialog';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * A React Component with the contents for a dialog that shows information about
 * the current conference and provides ways to invite other participants.
 *
 * @extends Component
 */
class InfoDialog extends Component {
    /**
     * {@code InfoDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The current url of the conference to be copied onto the clipboard.
         */
        _inviteURL: PropTypes.string,

        /**
         * Whether or not the link to open the {@code AddPeopleDialog} should be
         * displayed.
         */
        _showAddPeople: PropTypes.bool,

        /**
         * Invoked to open a dialog for adding participants to the conference.
         */
        dispatch: PropTypes.func,

        /**
         * Callback invoked when the dialog should be closed.
         */
        onClose: PropTypes.func,

        /**
         * Callback invoked when a mouse-related event has been detected.
         */
        onMouseOver: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes new {@code InfoDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to the DOM/HTML element backing the React
         * {@code Component} input. It is necessary for the implementation
         * of copying to the clipboard.
         *
         * @private
         * @type {HTMLInputElement}
         */
        this._copyElement = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onCopyInviteURL = this._onCopyInviteURL.bind(this);
        this._onOpenInviteDialog = this._onOpenInviteDialog.bind(this);
        this._setCopyElement = this._setCopyElement.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'info-dialog'
                onMouseOver = { this.props.onMouseOver } >
                <div className = 'info-dialog-column'>
                    <h4 className = 'info-dialog-icon'>
                        <i className = 'icon-info' />
                    </h4>
                </div>
                <div className = 'info-dialog-column'>
                    <div className = 'info-dialog-title'>
                        { this.props.t('info.title') }
                    </div>
                    <div
                        className = 'info-dialog-conference-url'
                        ref = { this._inviteUrlElement }>
                        { this.props._inviteURL }
                        <input
                            className = 'info-dialog-copy-element'
                            readOnly = { true }
                            ref = { this._setCopyElement }
                            tabIndex = '-1'
                            value = { this.props._inviteURL } />
                    </div>
                    <div className = 'info-dialog-action-links'>
                        <div className = 'info-dialog-action-link'>
                            <a onClick = { this._onCopyInviteURL }>
                                { this.props.t('info.copy') }
                            </a>
                        </div>
                        { this.props._showAddPeople
                            ? <div className = 'info-dialog-action-link'>
                                <a onClick = { this._onOpenInviteDialog }>
                                    { this.props.t('info.invite', {
                                        app: interfaceConfig.ADD_PEOPLE_APP_NAME
                                    }) }
                                </a>
                            </div>
                            : null }
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Callback invoked to copy the contents of {@code this._copyElement} to the
     * clipboard.
     *
     * @private
     * @returns {void}
     */
    _onCopyInviteURL() {
        try {
            this._copyElement.select();
            document.execCommand('copy');
            this._copyElement.blur();
        } catch (err) {
            logger.error('error when copying the text', err);
        }
    }

    /**
     * Callback invoked to open the {@code AddPeople} dialog.
     *
     * @private
     * @returns {void}
     */
    _onOpenInviteDialog() {
        this.props.dispatch(openDialog(AddPeopleDialog));

        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    /**
     * Sets the internal reference to the DOM/HTML element backing the React
     * {@code Component} input.
     *
     * @param {HTMLInputElement} element - The DOM/HTML element for this
     * {@code Component}'s input.
     * @private
     * @returns {void}
     */
    _setCopyElement(element) {
        this._copyElement = element;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code InfoDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _inviteURL: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _inviteURL: getInviteURL(state),
        _showAddPeople: !state['features/base/jwt'].isGuest
    };
}

export default translate(connect(_mapStateToProps)(InfoDialog));
