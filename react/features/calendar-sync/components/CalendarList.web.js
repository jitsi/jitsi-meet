// @flow

import Spinner from '@atlaskit/spinner';
import React from 'react';

import {
    createCalendarClickedEvent,
    sendAnalytics
} from '../../analytics';
import { translate } from '../../base/i18n';
import { AbstractPage } from '../../base/react';
import { connect } from '../../base/redux';
import { openSettingsDialog, SETTINGS_TABS } from '../../settings';
import { refreshCalendar } from '../actions';
import { ERRORS } from '../constants';

import CalendarListContent from './CalendarListContent';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link CalendarList}.
 */
type Props = {

    /**
     * The error object containing details about any error that has occurred
     * while interacting with calendar integration.
     */
    _calendarError: ?Object,

    /**
     * Whether or not a calendar may be connected for fetching calendar events.
     */
    _hasIntegrationSelected: boolean,

    /**
     * Whether or not events have been fetched from a calendar.
     */
    _hasLoadedEvents: boolean,

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The translate function.
     */
    t: Function
};

/**
 * Component to display a list of events from the user's calendar.
 */
class CalendarList extends AbstractPage<Props> {
    /**
     * Initializes a new {@code CalendarList} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._getRenderListEmptyComponent
            = this._getRenderListEmptyComponent.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
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
                    disabled = { disabled }
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
        const { _calendarError = {}, t } = this.props;

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

    _getRenderListEmptyComponent: () => Object;

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
                    <Spinner
                        invertColor = { true }
                        isCompleting = { false }
                        size = 'medium' />
                </div>
            );
        }

        return (
            <div className = 'meetings-list-empty'>
                <p className = 'description'>
                    { t('welcomepage.connectCalendarText', {
                        app: interfaceConfig.APP_NAME,
                        provider: interfaceConfig.PROVIDER_NAME
                    }) }
                </p>
                <div
                    className = 'button'
                    onClick = { this._onOpenSettings }>
                    { t('welcomepage.connectCalendarButton') }
                </div>
            </div>
        );
    }

    _onOpenSettings: () => void;

    /**
     * Opens {@code SettingsDialog}.
     *
     * @private
     * @returns {void}
     */
    _onOpenSettings() {
        sendAnalytics(createCalendarClickedEvent('calendar.connect'));

        this.props.dispatch(openSettingsDialog(SETTINGS_TABS.CALENDAR));
    }

    _onRefreshEvents: () => void;


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
function _mapStateToProps(state) {
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
