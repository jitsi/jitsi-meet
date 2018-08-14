// @flow

import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import {
    CALENDAR_TYPE,
    MicrosoftSignInButton,
    bootstrapCalendarIntegration,
    isCalendarEnabled,
    signIn,
    signOut
} from '../../../calendar-sync';
import { GoogleSignInButton } from '../../../google-api';

const logger = require('jitsi-meet-logger').getLogger(__filename);

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link CalendarTab}.
 */
type Props = {

    /**
     * The name given to this Jitsi Application.
     */
    _appName: string,

    /**
     * Whether or not to display a button to sign in to Google.
     */
    _enableGoogleIntegration: boolean,

    /**
     * Whether or not to display a button to sign in to Microsoft.
     */
    _enableMicrosoftIntegration: boolean,

    /**
     * The current calendar integration in use, if any.
     */
    _isConnectedToCalendar: boolean,

    /**
     * The email address associated with the calendar integration in use.
     */
    _profileEmail: string,

    /**
     * Invoked to change the configured calendar integration.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link CalendarTab}.
 */
type State = {

    /**
     * Whether or not any third party APIs are being loaded.
     */
    loading: boolean
};

/**
 * React {@code Component} for modifying calendar integration.
 *
 * @extends Component
 */
class CalendarTab extends Component<Props, State> {
    /**
     * Initializes a new {@code CalendarTab} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            loading: true
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onClickGoogle = this._onClickGoogle.bind(this);
        this._onClickMicrosoft = this._onClickMicrosoft.bind(this);
        this._onClickSignOut = this._onClickSignOut.bind(this);
    }

    /**
     * Loads third party APIs as needed and bootstraps the initial calendar
     * state if not already set.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.props.dispatch(bootstrapCalendarIntegration())
            .catch(err => logger.error('CalendarTab bootstrap failed', err))
            .then(() => this.setState({ loading: false }));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        let view;

        if (this.state.loading) {
            view = this._renderLoadingState();
        } else if (this.props._isConnectedToCalendar) {
            view = this._renderSignOutState();
        } else {
            view = this._renderSignInState();
        }

        return (
            <div className = 'calendar-tab'>
                { view }
            </div>
        );
    }

    /**
     * Dispatches the action to start the sign in flow for a given calendar
     * integration type.
     *
     * @param {string} type - The calendar type to try integrating with.
     * @private
     * @returns {void}
     */
    _attemptSignIn(type) {
        this.props.dispatch(signIn(type));
    }

    _onClickGoogle: () => void;

    /**
     * Starts the sign in flow for Google calendar integration.
     *
     * @private
     * @returns {void}
     */
    _onClickGoogle() {
        this._attemptSignIn(CALENDAR_TYPE.GOOGLE);
    }

    _onClickMicrosoft: () => void;

    /**
     * Starts the sign in flow for Microsoft calendar integration.
     *
     * @private
     * @returns {void}
     */
    _onClickMicrosoft() {
        this._attemptSignIn(CALENDAR_TYPE.MICROSOFT);
    }

    _onClickSignOut: (Object) => void;

    /**
     * Dispatches an action to sign out of the currently connected third party
     * used for calendar integration.
     *
     * @private
     * @returns {void}
     */
    _onClickSignOut() {
        this.props.dispatch(signOut());
    }

    /**
     * Render a React Element to indicate third party APIs are being loaded.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLoadingState() {
        return (
            <Spinner
                isCompleting = { false }
                size = 'medium' />
        );
    }

    /**
     * Render a React Element to sign into a third party for calendar
     * integration.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSignInState() {
        const {
            _appName,
            _enableGoogleIntegration,
            _enableMicrosoftIntegration,
            t
        } = this.props;

        return (
            <div>
                <p>
                    { t('settings.calendar.about',
                        { appName: _appName || '' }) }
                </p>
                { _enableGoogleIntegration
                    && <div className = 'calendar-tab-sign-in'>
                        <GoogleSignInButton
                            onClick = { this._onClickGoogle }
                            text = { t('liveStreaming.signIn') } />
                    </div> }
                { _enableMicrosoftIntegration
                    && <div className = 'calendar-tab-sign-in'>
                        <MicrosoftSignInButton
                            onClick = { this._onClickMicrosoft }
                            text = { t('settings.calendar.microsoftSignIn') } />
                    </div> }
            </div>
        );
    }

    /**
     * Render a React Element to sign out of the currently connected third
     * party used for calendar integration.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSignOutState() {
        const { _profileEmail, t } = this.props;

        return (
            <div>
                <div className = 'sign-out-cta'>
                    { t('settings.calendar.signedIn',
                        { email: _profileEmail }) }
                </div>
                <Button
                    appearance = 'primary'
                    id = 'calendar_logout'
                    onClick = { this._onClickSignOut }
                    type = 'button'>
                    Sign Out
                </Button>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code CalendarTab} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _appName: string,
 *     _enableGoogleIntegration: boolean,
 *     _enableMicrosoftIntegration: boolean,
 *     _isConnectedToCalendar: boolean,
 *     _profileEmail: string
 * }}
 */
function _mapStateToProps(state) {
    const calendarState = state['features/calendar-sync'] || {};
    const {
        googleApiApplicationClientID,
        microsoftApiApplicationClientID
    } = state['features/base/config'];
    const calendarEnabled = isCalendarEnabled();

    return {
        _appName: interfaceConfig.APP_NAME,
        _enableGoogleIntegration: Boolean(
            calendarEnabled && googleApiApplicationClientID),
        _enableMicrosoftIntegration: Boolean(
            calendarEnabled && microsoftApiApplicationClientID),
        _isConnectedToCalendar: calendarState.integrationReady,
        _profileEmail: calendarState.profileEmail
    };
}

export default translate(connect(_mapStateToProps)(CalendarTab));
