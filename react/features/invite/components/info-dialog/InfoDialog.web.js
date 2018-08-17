import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setPassword } from '../../../base/conference';
import { getInviteURL } from '../../../base/connection';
import { translate } from '../../../base/i18n';
import { isLocalParticipantModerator } from '../../../base/participants';

import { getDialInfoPageURL } from '../../functions';
import DialInNumber from './DialInNumber';
import PasswordForm from './PasswordForm';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * A React Component with the contents for a dialog that shows information about
 * the current conference.
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
         * Whether or not the current user can modify the current password.
         */
        _canEditPassword: PropTypes.bool,

        /**
         * The JitsiConference for which to display a lock state and change the
         * password.
         *
         * @type {JitsiConference}
         */
        _conference: PropTypes.object,

        /**
         * The name of the current conference. Used as part of inviting users.
         */
        _conferenceName: PropTypes.string,

        /**
         * The current url of the conference to be copied onto the clipboard.
         */
        _inviteURL: PropTypes.string,

        /**
         * The value for how the conference is locked (or undefined if not
         * locked) as defined by room-lock constants.
         */
        _locked: PropTypes.string,

        /**
         * The current known password for the JitsiConference.
         */
        _password: PropTypes.string,

        /**
         * The object representing the dialIn feature.
         */
        dialIn: PropTypes.object,

        /**
         * Invoked to open a dialog for adding participants to the conference.
         */
        dispatch: PropTypes.func,

        /**
         * The current known URL for a live stream in progress.
         */
        liveStreamViewURL: PropTypes.string,

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
        phoneNumber: ''
    };

    /**
     * Initializes new {@code InfoDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        const { defaultCountry, numbers } = props.dialIn;

        if (numbers) {
            this.state.phoneNumber
                = this._getDefaultPhoneNumber(numbers, defaultCountry);
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
        this._onCopyInviteURL = this._onCopyInviteURL.bind(this);
        this._onPasswordRemove = this._onPasswordRemove.bind(this);
        this._onPasswordSubmit = this._onPasswordSubmit.bind(this);
        this._onTogglePasswordEditState
            = this._onTogglePasswordEditState.bind(this);
        this._setCopyElement = this._setCopyElement.bind(this);
    }

    /**
     * Implements React's {@link Component#componentWillReceiveProps()}. Invoked
     * before this mounted component receives new props.
     *
     * @inheritdoc
     * @param {Props} nextProps - New props component will receive.
     */
    componentWillReceiveProps(nextProps) {
        if (!this.props._password && nextProps._password) {
            this.setState({ passwordEditEnabled: false });
        }

        if (!this.state.phoneNumber && nextProps.dialIn.numbers) {
            const { defaultCountry, numbers } = nextProps.dialIn;

            this.setState({
                phoneNumber:
                    this._getDefaultPhoneNumber(numbers, defaultCountry)
            });
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { liveStreamViewURL, onMouseOver, t } = this.props;

        return (
            <div
                className = 'info-dialog'
                onMouseOver = { onMouseOver } >
                <div className = 'info-dialog-column'>
                    <h4 className = 'info-dialog-icon'>
                        <i className = 'icon-info' />
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
                                className = 'info-dialog-url-text'
                                href = { this.props._inviteURL }
                                onClick = { this._onClickURLText } >
                                { this._getURLToDisplay() }
                            </a>
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
                            password = { this.props._password } />
                    </div>
                    <div className = 'info-dialog-action-links'>
                        <div className = 'info-dialog-action-link'>
                            <a
                                className = 'info-copy'
                                onClick = { this._onCopyInviteURL }>
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
            </div>
        );
    }

    /**
     * Sets the internal state of which dial-in number to display.
     *
     * @param {Array<string>|Object} dialInNumbers - The array or object of
     * numbers to choose a number from.
     * @param {string} defaultCountry - The country code for the country
     * whose phone number should display.
     * @private
     * @returns {string|null}
     */
    _getDefaultPhoneNumber(dialInNumbers, defaultCountry = 'US') {
        if (Array.isArray(dialInNumbers)) {
            // Dumbly return the first number if an array.
            return dialInNumbers[0];
        } else if (Object.keys(dialInNumbers).length > 0) {
            const defaultNumbers = dialInNumbers[defaultCountry];

            if (defaultNumbers) {
                return defaultNumbers[0];
            }

            const firstRegion = Object.keys(dialInNumbers)[0];

            return firstRegion && firstRegion[0];
        }

        return null;
    }

    /**
     * Generates the URL for the static dial in info page.
     *
     * @private
     * @returns {string}
     */
    _getDialInfoPageURL() {
        return getDialInfoPageURL(
            encodeURIComponent(this.props._conferenceName));
    }

    /**
     * Creates a message describing how to dial in to the conference.
     *
     * @private
     * @returns {string}
     */
    _getTextToCopy() {
        const { liveStreamViewURL, t } = this.props;

        let invite = t('info.inviteURL', {
            url: this.props._inviteURL
        });

        if (liveStreamViewURL) {
            const liveStream = t('info.inviteLiveStream', {
                url: liveStreamViewURL
            });

            invite = `${invite}\n${liveStream}`;
        }

        if (this._shouldDisplayDialIn()) {
            const dial = t('info.invitePhone', {
                number: this.state.phoneNumber,
                conferenceID: this.props.dialIn.conferenceID
            });
            const moreNumbers = t('info.invitePhoneAlternatives', {
                url: this._getDialInfoPageURL()
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
     * Callback invoked to unlock the current JitsiConference.
     *
     * @private
     * @returns {void}
     */
    _onPasswordRemove() {
        this._onPasswordSubmit('');
    }

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
        if (!this._shouldDisplayDialIn()) {
            return null;
        }

        return (
            <div>
                <DialInNumber
                    conferenceID = { this.props.dialIn.conferenceID }
                    phoneNumber = { this.state.phoneNumber } />
                <a
                    className = 'more-numbers'
                    href = { this._getDialInfoPageURL() }
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

    /**
     * Returns whether or not dial-in related UI should be displayed.
     *
     * @private
     * @returns {boolean}
     */
    _shouldDisplayDialIn() {
        const { conferenceID, numbers, numbersEnabled } = this.props.dialIn;
        const { phoneNumber } = this.state;

        return Boolean(
            conferenceID
            && numbers
            && numbersEnabled
            && phoneNumber);
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
 *     _canEditPassword: boolean,
 *     _conference: Object,
 *     _conferenceName: string,
 *     _inviteURL: string,
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

    return {
        _canEditPassword: isLocalParticipantModerator(state),
        _conference: conference,
        _conferenceName: room,
        _inviteURL: getInviteURL(state),
        _locked: locked,
        _password: password
    };
}

export default translate(connect(_mapStateToProps)(InfoDialog));
