import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Spinner from '../../../base/ui/components/web/Spinner';
import { bootstrapCalendarIntegration, clearCalendarIntegration, signIn } from '../../../calendar-sync/actions';
import MicrosoftSignInButton from '../../../calendar-sync/components/MicrosoftSignInButton';
import { CALENDAR_TYPE } from '../../../calendar-sync/constants';
import { isCalendarEnabled } from '../../../calendar-sync/functions';
import GoogleSignInButton from '../../../google-api/components/GoogleSignInButton';
import logger from '../../logger';

/**
 * The type of the React {@code Component} props of {@link CalendarTab}.
 */
interface IProps extends WithTranslation {

    /**
     * The name given to this Jitsi Application.
     */
    _appName: string;

    /**
     * Whether or not to display a button to sign in to Google.
     */
    _enableGoogleIntegration: boolean;

    /**
     * Whether or not to display a button to sign in to Microsoft.
     */
    _enableMicrosoftIntegration: boolean;

    /**
     * The current calendar integration in use, if any.
     */
    _isConnectedToCalendar: boolean;

    /**
     * The email address associated with the calendar integration in use.
     */
    _profileEmail?: string;

    /**
     * CSS classes object.
     */
    classes: any;

    /**
     * Invoked to change the configured calendar integration.
     */
    dispatch: IStore['dispatch'];
}

/**
 * The type of the React {@code Component} state of {@link CalendarTab}.
 */
interface IState {

    /**
     * Whether or not any third party APIs are being loaded.
     */
    loading: boolean;
}

const styles = (theme: Theme) => {
    return {
        container: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '100px',
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        },

        button: {
            marginTop: theme.spacing(4)
        }
    };
};

/**
 * React {@code Component} for modifying calendar integration.
 *
 * @augments Component
 */
class CalendarTab extends Component<IProps, IState> {
    /**
     * Initializes a new {@code CalendarTab} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onClickDisconnect = this._onClickDisconnect.bind(this);
        this._onClickGoogle = this._onClickGoogle.bind(this);
        this._onClickMicrosoft = this._onClickMicrosoft.bind(this);
    }

    /**
     * Loads third party APIs as needed and bootstraps the initial calendar
     * state if not already set.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.props.dispatch(bootstrapCalendarIntegration())
            .catch((err: any) => logger.error('CalendarTab bootstrap failed', err))
            .then(() => this.setState({ loading: false }));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { classes } = this.props;
        let view;

        if (this.state.loading) {
            view = this._renderLoadingState();
        } else if (this.props._isConnectedToCalendar) {
            view = this._renderSignOutState();
        } else {
            view = this._renderSignInState();
        }

        return (
            <div className = { classes.container }>
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
    _attemptSignIn(type: string) {
        this.props.dispatch(signIn(type));
    }

    /**
     * Dispatches an action to sign out of the currently connected third party
     * used for calendar integration.
     *
     * @private
     * @returns {void}
     */
    _onClickDisconnect() {
        // We clear the integration state instead of actually signing out. This
        // is for two primary reasons. Microsoft does not support a sign out and
        // instead relies on clearing of local auth data. Google signout can
        // also sign the user out of YouTube. So for now we've decided not to
        // do an actual sign out.
        this.props.dispatch(clearCalendarIntegration());
    }

    /**
     * Starts the sign in flow for Google calendar integration.
     *
     * @private
     * @returns {void}
     */
    _onClickGoogle() {
        this._attemptSignIn(CALENDAR_TYPE.GOOGLE);
    }

    /**
     * Starts the sign in flow for Microsoft calendar integration.
     *
     * @private
     * @returns {void}
     */
    _onClickMicrosoft() {
        this._attemptSignIn(CALENDAR_TYPE.MICROSOFT);
    }

    /**
     * Render a React Element to indicate third party APIs are being loaded.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLoadingState() {
        return (
            <Spinner />
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
            classes,
            t
        } = this.props;

        return (
            <>
                <p>
                    { t('settings.calendar.about',
                        { appName: _appName || '' }) }
                </p>
                { _enableGoogleIntegration
                    && <div className = { classes.button }>
                        <GoogleSignInButton
                            onClick = { this._onClickGoogle }
                            text = { t('liveStreaming.signIn') } />
                    </div> }
                { _enableMicrosoftIntegration
                    && <div className = { classes.button }>
                        <MicrosoftSignInButton
                            onClick = { this._onClickMicrosoft }
                            text = { t('settings.calendar.microsoftSignIn') } />
                    </div> }
            </>
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
        const { _profileEmail, classes, t } = this.props;

        return (
            <>
                { t('settings.calendar.signedIn',
                        { email: _profileEmail }) }
                <Button
                    className = { classes.button }
                    id = 'calendar_logout'
                    label = { t('settings.calendar.disconnect') }
                    onClick = { this._onClickDisconnect } />
            </>
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
function _mapStateToProps(state: IReduxState) {
    const calendarState = state['features/calendar-sync'] || {};
    const {
        googleApiApplicationClientID,
        microsoftApiApplicationClientID
    } = state['features/base/config'];
    const calendarEnabled = isCalendarEnabled(state);

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

export default withStyles(styles)(translate(connect(_mapStateToProps)(CalendarTab)));
