// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { setPassword } from '../../../../base/conference';
import { getInviteURL } from '../../../../base/connection';
import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { Icon, IconInfo, IconCopy } from '../../../../base/icons';
import { connect } from '../../../../base/redux';
import {
    isLocalParticipantModerator,
    getLocalParticipant
} from '../../../../base/participants';

import {
    _decodeRoomURI,
    _getDefaultPhoneNumber,
    getDialInfoPageURL,
    shouldDisplayDialIn
} from '../../../functions';
import logger from '../../../logger';
import DialInNumber from './DialInNumber';
import PasswordForm from './PasswordForm';


/**
 * The type of the React {@code Component} props of {@link InfoDialog}.
 */
type Props = {

    /**
     * Whether or not the current user can modify the current password.
     */
    _canEditPassword: boolean,

    /**
     * The JitsiConference for which to display a lock state and change the
     * password.
     */
    _conference: Object,

    /**
     * The name of the current conference. Used as part of inviting users.
     */
    _conferenceName: string,

    /**
     * The number of digits to be used in the password.
     */
    _passwordNumberOfDigits: ?number,

    /**
     * The current url of the conference to be copied onto the clipboard.
     */
    _inviteURL: string,

    /**
     * The redux representation of the local participant.
     */
    _localParticipantName: ?string,

    /**
     * The current location url of the conference.
     */
    _locationURL: Object,

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    _locked: string,

    /**
     * The current known password for the JitsiConference.
     */
    _password: string,

    /**
     * The object representing the dialIn feature.
     */
    dialIn: Object,

    /**
     * Invoked to open a dialog for adding participants to the conference.
     */
    dispatch: Dispatch<any>,

    /**
     * Whether is Atlaskit InlineDialog or a normal dialog.
     */
    isInlineDialog: boolean,

    /**
     * The current known URL for a live stream in progress.
     */
    liveStreamViewURL: string,

    /**
     * Callback invoked when the dialog should be closed.
     */
    onClose: Function,

    /**
     * Callback invoked when a mouse-related event has been detected.
     */
    onMouseOver: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link InfoDialog}.
 */
type State = {

    /**
     * Whether or not to show the password in editing mode.
     */
    passwordEditEnabled: boolean,

    /**
     * The conference dial-in number to display.
     */
    phoneNumber: ?string
};

/**
 * A React Component with the contents for a dialog that shows information about
 * the current conference.
 *
 * @extends Component
 */
class InfoDialog extends Component<Props, State> {
    _copyElement: ?Object;
    _copyUrlElement: ?Object;

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props, state) {
        let phoneNumber = state.phoneNumber;

        if (!state.phoneNumber && props.dialIn.numbers) {
            phoneNumber = _getDefaultPhoneNumber(props.dialIn.numbers);
        }

        return {
            // Exit edit mode when a password is set locally or remotely.
            passwordEditEnabled: state.passwordEditEnabled && props._password
                ? false : state.passwordEditEnabled,
            phoneNumber
        };
    }

    /**
     * {@code InfoDialog} component's local state.
     *
     * @type {Object}
     * @property {boolean} passwordEditEnabled - Whether or not to show the
     * {@code PasswordForm} in its editing state.
     * @property {string} phoneNumber - The number to display for dialing into
     * the conference.
     */
    state = {
        passwordEditEnabled: false,
        phoneNumber: undefined
    };

    /**
     * Initializes new {@code InfoDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        if (props.dialIn && props.dialIn.numbers) {
            this.state.phoneNumber
                = _getDefaultPhoneNumber(props.dialIn.numbers);
        }

        /**
         * The internal reference to the DOM/HTML element backing the React
         * {@code Component} text area. It is necessary for the implementation
         * of copying to the clipboard.
         *
         * @private
         * @type {HTMLTextAreaElement}
         */
        this._copyElement = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onClickURLText = this._onClickURLText.bind(this);
        this._onCopyInviteInfo = this._onCopyInviteInfo.bind(this);
        this._onCopyInviteUrl = this._onCopyInviteUrl.bind(this);
        this._onPasswordRemove = this._onPasswordRemove.bind(this);
        this._onPasswordSubmit = this._onPasswordSubmit.bind(this);
        this._onTogglePasswordEditState
            = this._onTogglePasswordEditState.bind(this);
        this._setCopyElement = this._setCopyElement.bind(this);
        this._setCopyUrlElement = this._setCopyUrlElement.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            isInlineDialog,
            liveStreamViewURL,
            onMouseOver,
            t
        } = this.props;

        const inlineDialog = (
            <div
                className = 'info-dialog'
                onMouseOver = { onMouseOver } >
                <div className = 'info-dialog-column'>
                    <h4 className = 'info-dialog-icon'>
                        <Icon src = { IconInfo } />
                    </h4>
                </div>
                <div className = 'info-dialog-column'>
                    <div className = 'info-dialog-title'>
                        { t('info.title') }
                    </div>
                    <div className = 'info-dialog-conference-url'>
                        <span className = 'info-label'>
                            { t('info.conferenceURL') }
                        </span>
                        <span className = 'spacer'>&nbsp;</span>
                        <span className = 'info-value'>
                            <a
                                className = 'info-dialog-url-text info-dialog-url-text-unselectable'
                                href = { this.props._inviteURL }
                                onClick = { this._onClickURLText } >
                                { decodeURI(this._getURLToDisplay()) }
                            </a>
                        </span>
                        <span className = 'info-dialog-url-icon'>
                            <Icon
                                onClick = { this._onCopyInviteUrl }
                                size = { 18 }
                                src = { IconCopy } />
                        </span>
                    </div>
                    <div className = 'info-dialog-dial-in'>
                        { this._renderDialInDisplay() }
                    </div>
                    { liveStreamViewURL && this._renderLiveStreamURL() }
                    <div className = 'info-dialog-password'>
                        <PasswordForm
                            editEnabled = { this.state.passwordEditEnabled }
                            locked = { this.props._locked }
                            onSubmit = { this._onPasswordSubmit }
                            password = { this.props._password }
                            passwordNumberOfDigits = { this.props._passwordNumberOfDigits } />
                    </div>
                    <div className = 'info-dialog-action-links'>
                        <div className = 'info-dialog-action-link'>
                            <a
                                className = 'info-copy'
                                onClick = { this._onCopyInviteInfo }>
                                { t('dialog.copy') }
                            </a>
                        </div>
                        { this._renderPasswordAction() }
                    </div>
                </div>
                <textarea
                    className = 'info-dialog-copy-element'
                    readOnly = { true }
                    ref = { this._setCopyElement }
                    tabIndex = '-1'
                    value = { this._getTextToCopy() } />
                <textarea
                    className = 'info-dialog-copy-element'
                    readOnly = { true }
                    ref = { this._setCopyUrlElement }
                    tabIndex = '-1'
                    value = { this.props._inviteURL } />
            </div>
        );

        if (isInlineDialog) {
            return inlineDialog;
        }

        return (
            <Dialog
                cancelTitleKey = 'dialog.close'
                submitDisabled = { true }
                titleKey = 'info.label'
                width = 'small'>
                { inlineDialog }
            </Dialog>
        );
    }

    /**
     * Creates a message describing how to dial in to the conference.
     *
     * @private
     * @returns {string}
     */
    _getTextToCopy() {
        const { _localParticipantName, liveStreamViewURL, t } = this.props;
        const _inviteURL = _decodeRoomURI(this.props._inviteURL);

        let invite = _localParticipantName
            ? t('info.inviteURLFirstPartPersonal', { name: _localParticipantName })
            : t('info.inviteURLFirstPartGeneral');

        invite += t('info.inviteURLSecondPart', {
            url: _inviteURL
        });

        if (liveStreamViewURL) {
            const liveStream = t('info.inviteLiveStream', {
                url: liveStreamViewURL
            });

            invite = `${invite}\n${liveStream}`;
        }

        if (shouldDisplayDialIn(this.props.dialIn)) {
            const dial = t('info.invitePhone', {
                number: this.state.phoneNumber,
                conferenceID: this.props.dialIn.conferenceID
            });
            const moreNumbers = t('info.invitePhoneAlternatives', {
                url: getDialInfoPageURL(
                    this.props._conferenceName,
                    this.props._locationURL
                ),
                silentUrl: `${_inviteURL}#config.startSilent=true`
            });

            invite = `${invite}\n${dial}\n${moreNumbers}`;
        }

        return invite;
    }

    /**
     * Modifies the inviteURL for display in the modal.
     *
     * @private
     * @returns {string}
     */
    _getURLToDisplay() {
        return this.props._inviteURL.replace(/^https?:\/\//i, '');
    }

    _onClickURLText: (Object) => void;

    /**
     * Callback invoked when a displayed URL link is clicked to prevent actual
     * navigation from happening. The URL links have an href to display the
     * action "Copy Link Address" in the context menu but otherwise it should
     * not behave like links.
     *
     * @param {Object} event - The click event from clicking on the link.
     * @private
     * @returns {void}
     */
    _onClickURLText(event) {
        event.preventDefault();
    }

    _onCopyInviteInfo: () => void;

    /**
     * Callback invoked to copy the contents of {@code this._copyElement} to the
     * clipboard.
     *
     * @private
     * @returns {void}
     */
    _onCopyInviteInfo() {
        try {
            if (!this._copyElement) {
                throw new Error('No element to copy from.');
            }

            this._copyElement && this._copyElement.select();
            document.execCommand('copy');
            this._copyElement && this._copyElement.blur();
        } catch (err) {
            logger.error('error when copying the text', err);
        }
    }

    _onCopyInviteUrl: () => void;

    /**
     * Callback invoked to copy the contents of {@code this._copyUrlElement} to the clipboard.
     *
     * @private
     * @returns {void}
     */
    _onCopyInviteUrl() {
        try {
            if (!this._copyUrlElement) {
                throw new Error('No element to copy from.');
            }

            this._copyUrlElement && this._copyUrlElement.select();
            document.execCommand('copy');
            this._copyUrlElement && this._copyUrlElement.blur();
        } catch (err) {
            logger.error('error when copying the text', err);
        }
    }

    _onPasswordRemove: () => void;

    /**
     * Callback invoked to unlock the current JitsiConference.
     *
     * @private
     * @returns {void}
     */
    _onPasswordRemove() {
        this._onPasswordSubmit('');
    }

    _onPasswordSubmit: (string) => void;

    /**
     * Callback invoked to set a password on the current JitsiConference.
     *
     * @param {string} enteredPassword - The new password to be used to lock the
     * current JitsiConference.
     * @private
     * @returns {void}
     */
    _onPasswordSubmit(enteredPassword) {
        const { _conference } = this.props;

        this.props.dispatch(setPassword(
            _conference,
            _conference.lock,
            enteredPassword
        ));
    }

    _onTogglePasswordEditState: () => void;

    /**
     * Toggles whether or not the password should currently be shown as being
     * edited locally.
     *
     * @private
     * @returns {void}
     */
    _onTogglePasswordEditState() {
        this.setState({
            passwordEditEnabled: !this.state.passwordEditEnabled
        });
    }

    /**
     * Returns a ReactElement for showing how to dial into the conference, if
     * dialing in is available.
     *
     * @private
     * @returns {null|ReactElement}
     */
    _renderDialInDisplay() {
        if (!shouldDisplayDialIn(this.props.dialIn)) {
            return null;
        }

        return (
            <div>
                <DialInNumber
                    conferenceID = { this.props.dialIn.conferenceID }
                    phoneNumber = { this.state.phoneNumber } />
                <a
                    className = 'more-numbers'
                    href = {
                        getDialInfoPageURL(
                            this.props._conferenceName,
                            this.props._locationURL
                        )
                    }
                    rel = 'noopener noreferrer'
                    target = '_blank'>
                    { this.props.t('info.moreNumbers') }
                </a>
            </div>
        );
    }

    /**
     * Returns a ReactElement for interacting with the password field.
     *
     * @private
     * @returns {null|ReactElement}
     */
    _renderPasswordAction() {
        const { t } = this.props;
        let className, onClick, textKey;


        if (!this.props._canEditPassword) {
            // intentionally left blank to prevent rendering anything
        } else if (this.state.passwordEditEnabled) {
            className = 'cancel-password';
            onClick = this._onTogglePasswordEditState;
            textKey = 'info.cancelPassword';
        } else if (this.props._locked) {
            className = 'remove-password';
            onClick = this._onPasswordRemove;
            textKey = 'dialog.removePassword';
        } else {
            className = 'add-password';
            onClick = this._onTogglePasswordEditState;
            textKey = 'info.addPassword';
        }

        return className && onClick && textKey
            ? <div className = 'info-dialog-action-link'>
                <a
                    className = { className }
                    onClick = { onClick }>
                    { t(textKey) }
                </a>
            </div>
            : null;
    }

    /**
     * Returns a ReactElement for display a link to the current url of a
     * live stream in progress.
     *
     * @private
     * @returns {null|ReactElement}
     */
    _renderLiveStreamURL() {
        const { liveStreamViewURL, t } = this.props;

        return (
            <div className = 'info-dialog-live-stream-url'>
                <span className = 'info-label'>
                    { t('info.liveStreamURL') }
                </span>
                <span className = 'spacer'>&nbsp;</span>
                <span className = 'info-value'>
                    <a
                        className = 'info-dialog-url-text'
                        href = { liveStreamViewURL }
                        onClick = { this._onClickURLText } >
                        { liveStreamViewURL }
                    </a>
                </span>
            </div>
        );
    }

    _setCopyElement: () => void;

    /**
     * Sets the internal reference to the DOM/HTML element backing the React
     * {@code Component} input.
     *
     * @param {HTMLInputElement} element - The DOM/HTML element for this
     * {@code Component}'s input.
     * @private
     * @returns {void}
     */
    _setCopyElement(element: Object) {
        this._copyElement = element;
    }

    _setCopyUrlElement: () => void;

    /**
     * Sets the internal reference to the DOM/HTML element backing the React
     * {@code Component} input.
     *
     * @param {HTMLInputElement} element - The DOM/HTML element for this
     * {@code Component}'s input.
     * @private
     * @returns {void}
     */
    _setCopyUrlElement(element: Object) {
        this._copyUrlElement = element;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code InfoDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _canEditPassword: boolean,
 *     _conference: Object,
 *     _conferenceName: string,
 *     _inviteURL: string,
 *     _localParticipantName: ?string,
 *     _locationURL: string,
 *     _locked: string,
 *     _password: string
 * }}
 */
function _mapStateToProps(state) {
    const {
        conference,
        locked,
        password,
        room
    } = state['features/base/conference'];
    const localParticipant = getLocalParticipant(state);

    return {
        _canEditPassword: isLocalParticipantModerator(state, state['features/base/config'].lockRoomGuestEnabled),
        _conference: conference,
        _conferenceName: room,
        _passwordNumberOfDigits: state['features/base/config'].roomPasswordNumberOfDigits,
        _inviteURL: getInviteURL(state),
        _localParticipantName: localParticipant?.name,
        _locationURL: state['features/base/connection'].locationURL,
        _locked: locked,
        _password: password
    };
}

export default translate(connect(_mapStateToProps)(InfoDialog));
