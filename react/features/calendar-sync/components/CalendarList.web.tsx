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
import { openSettingsDialog } from '../../settings/actions.web';
import { SETTINGS_TABS } from '../../settings/constants';
import { refreshCalendar } from '../actions.web';
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
     * Whether or not a calendar may be connected for fetching calendar events.
     */
    _hasIntegrationSelected: boolean;

    /**
     * Whether or not events have been fetched from a calendar.
     */
    _hasLoadedEvents: boolean;

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
        this._onKeyPressOpenSettings = this._onKeyPressOpenSettings.bind(this);
        this._onRefreshEvents = this._onRefreshEvents.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
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
        const { _calendarError = { error: undefined }, t } = this.props;

        let errorMessageKey = 'calendarSync.error.generic';
        let showRefreshButton = true;
        let showSettingsButton = true;

        if (_calendarError.error === ERRORS.GOOGLE_APP_MISCONFIGURED) {
            errorMessageKey = 'calendarSync.error.appConfiguration';
            showRefreshButton = false;
            showSettingsButton = false;
        } else if (_calendarError.error === ERRORS.AUTH_FAILED) {
            errorMessageKey = 'calendarSync.error.notSignedIn';
            showRefreshButton = false;
        }

        return (
            <div className = 'meetings-list-empty'>
                <p className = 'description'>
                    { t(errorMessageKey) }
                </p>
                <div className = 'calendar-action-buttons'>
                    { showSettingsButton
                        && <div
                            className = 'button'
                            onClick = { this._onOpenSettings }>
                            { t('calendarSync.permissionButton') }
                        </div>
                    }
                    { showRefreshButton
                        && <div
                            className = 'button'
                            onClick = { this._onRefreshEvents }>
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
            _hasIntegrationSelected,
            _hasLoadedEvents,
            t
        } = this.props;

        if (_calendarError) {
            return this._getErrorMessage();
        } else if (_hasIntegrationSelected && _hasLoadedEvents) {
            return (
                <div className = 'meetings-list-empty'>
                    <p className = 'description'>
                        { t('calendarSync.noEvents') }
                    </p>
                    <div
                        className = 'button'
                        onClick = { this._onRefreshEvents }>
                        { t('calendarSync.refresh') }
                    </div>
                </div>
            );
        } else if (_hasIntegrationSelected && !_hasLoadedEvents) {
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
                    onKeyPress = { this._onKeyPressOpenSettings }
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
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPressOpenSettings(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onOpenSettings();
        }
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
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code CalendarList} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _calendarError: Object,
 *     _hasIntegrationSelected: boolean,
 *     _hasLoadedEvents: boolean
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
        _hasIntegrationSelected: Boolean(integrationType),
        _hasLoadedEvents: Boolean(events) || !isLoadingEvents
    };
}

export default translate(connect(_mapStateToProps)(CalendarList));
