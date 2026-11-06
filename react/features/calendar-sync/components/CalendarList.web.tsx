import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { createCalendarClickedEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState, IStore } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconCalendar } from '../../base/icons/svg';
import AbstractPage from '../../base/react/components/AbstractPage';
import Spinner from '../../base/ui/components/web/Spinner';
import { onActivationKey } from '../../base/ui/functions.web';
import { openSettingsDialog } from '../../settings/actions.web';
import { SETTINGS_TABS } from '../../settings/constants';
import { refreshCalendar, signIn } from '../actions.web';
import { ERRORS } from '../constants';

import CalendarListContent from './CalendarListContent.web';

/**
 * The type of the React {@code Component} props of {@link CalendarList}.
 */
interface IProps extends WithTranslation {

    /**
     * The error object containing details about any error that has occurred
     * while interacting with calendar integration.
     */
    _calendarError?: { error: string; };

    /**
     * Whether or not events have been fetched from a calendar.
     */
    _hasLoadedEvents: boolean;

    /**
     * The selected calendar integration type, if any.
     */
    _integrationType?: string;

    /**
     * Indicates if the list is disabled or not.
     */
    disabled?: boolean;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * Component to display a list of events from the user's calendar.
 */
class CalendarList extends AbstractPage<IProps> {
    /**
     * Initializes a new {@code CalendarList} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._getRenderListEmptyComponent
            = this._getRenderListEmptyComponent.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
        this._onRefreshEvents = this._onRefreshEvents.bind(this);
        this._onSignIn = this._onSignIn.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { disabled } = this.props;

        return (
            CalendarListContent
                ? <CalendarListContent
                    disabled = { Boolean(disabled) }
                    listEmptyComponent
                        = { this._getRenderListEmptyComponent() } />
                : null
        );
    }

    /**
     * Returns a component for showing the error message related to calendar
     * sync.
     *
     * @private
     * @returns {React$Component}
     */
    _getErrorMessage() {
        const {
            _calendarError = { error: undefined },
            _integrationType,
            t
        } = this.props;

        let errorMessageKey = 'calendarSync.error.generic';
        let showRefreshButton = true;
        let showSettingsButton = true;
        let showSignInButton = false;

        if (_calendarError.error === ERRORS.GOOGLE_APP_MISCONFIGURED) {
            errorMessageKey = 'calendarSync.error.appConfiguration';
            showRefreshButton = false;
            showSettingsButton = false;
        } else if (_calendarError.error === ERRORS.AUTH_FAILED) {
            showRefreshButton = false;

            // The selected calendar is kept, so this only needs a new sign in.
            if (_integrationType) {
                errorMessageKey = 'calendarSync.signInAgainMessage';
                showSignInButton = true;
            } else {
                errorMessageKey = 'calendarSync.error.notSignedIn';
            }
        }

        return (
            <div className = 'meetings-list-empty'>
                <p className = 'description'>
                    { t(errorMessageKey) }
                </p>
                <div className = 'calendar-action-buttons'>
                    { showSignInButton
                        && <div
                            className = 'button'
                            onClick = { this._onSignIn }>
                            { t('calendarSync.signInAgain') }
                        </div>
                    }
                    { showSettingsButton
                        && <div
                            className = 'button'
                            onClick = { this._onOpenSettings }
                            onKeyDown = { onActivationKey(this._onOpenSettings) }
                            role = 'button'
                            tabIndex = { 0 }>
                            { t('calendarSync.permissionButton') }
                        </div>
                    }
                    { showRefreshButton
                        && <div
                            className = 'button'
                            onClick = { this._onRefreshEvents }
                            onKeyDown = { onActivationKey(this._onRefreshEvents) }
                            role = 'button'
                            tabIndex = { 0 }>
                            { t('calendarSync.refresh') }
                        </div>
                    }
                </div>
            </div>
        );
    }

    /**
     * Returns a list empty component if a custom one has to be rendered instead
     * of the default one in the {@link NavigateSectionList}.
     *
     * @private
     * @returns {React$Component}
     */
    _getRenderListEmptyComponent() {
        const {
            _calendarError,
            _hasLoadedEvents,
            _integrationType,
            t
        } = this.props;

        if (_calendarError) {
            return this._getErrorMessage();
        } else if (_integrationType && _hasLoadedEvents) {
            return (
                <div className = 'meetings-list-empty'>
                    <p className = 'description'>
                        { t('calendarSync.noEvents') }
                    </p>
                    <div
                        className = 'button'
                        onClick = { this._onRefreshEvents }
                        onKeyDown = { onActivationKey(this._onRefreshEvents) }
                        role = 'button'
                        tabIndex = { 0 }>
                        { t('calendarSync.refresh') }
                    </div>
                </div>
            );
        } else if (_integrationType && !_hasLoadedEvents) {
            return (
                <div className = 'meetings-list-empty'>
                    <Spinner />
                </div>
            );
        }

        return (
            <div className = 'meetings-list-empty'>
                <div className = 'meetings-list-empty-image'>
                    <img
                        alt = { t('welcomepage.logo.calendar') }
                        src = './images/calendar.svg' />
                </div>
                <div className = 'description'>
                    { t('welcomepage.connectCalendarText', {
                        app: interfaceConfig.APP_NAME,
                        provider: interfaceConfig.PROVIDER_NAME
                    }) }
                </div>
                <div
                    className = 'meetings-list-empty-button'
                    onClick = { this._onOpenSettings }
                    onKeyDown = { onActivationKey(this._onOpenSettings) }
                    role = 'button'
                    tabIndex = { 0 }>
                    <Icon
                        className = 'meetings-list-empty-icon'
                        src = { IconCalendar } />
                    <span>{ t('welcomepage.connectCalendarButton') }</span>
                </div>
            </div>
        );
    }

    /**
     * Opens {@code SettingsDialog}.
     *
     * @private
     * @returns {void}
     */
    _onOpenSettings() {
        sendAnalytics(createCalendarClickedEvent('connect'));

        this.props.dispatch(openSettingsDialog(SETTINGS_TABS.CALENDAR));
    }

    /**
     * Gets an updated list of calendar events.
     *
     * @private
     * @returns {void}
     */
    _onRefreshEvents() {
        this.props.dispatch(refreshCalendar(true));
    }

    /**
     * Signs in again to the selected calendar integration.
     *
     * @private
     * @returns {void}
     */
    _onSignIn() {
        const { _integrationType, dispatch } = this.props;

        _integrationType && dispatch(signIn(_integrationType))
            .catch(() => {
                // The error is already logged by signIn.
            });
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code CalendarList} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _calendarError: Object,
 *     _hasLoadedEvents: boolean,
 *     _integrationType: string
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const {
        error,
        events,
        integrationType,
        isLoadingEvents
    } = state['features/calendar-sync'];

    return {
        _calendarError: error,
        _hasLoadedEvents: Boolean(events) || !isLoadingEvents,
        _integrationType: integrationType
    };
}

export default translate(connect(_mapStateToProps)(CalendarList));
