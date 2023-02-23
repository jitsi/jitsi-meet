// @flow

import React, { Component } from 'react';

import { appNavigate } from '../../app/actions.native';
import { getURLWithoutParamsNormalized } from '../../base/connection';
import { getLocalizedDateFormatter, translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { BUTTON_TYPES } from '../../base/ui/constants.native';
import {
    CALENDAR_NOTIFICATION_ID,
    NOTIFICATION_ICON,
    hideNotification
} from '../../notifications';
import Notification from '../../notifications/components/native/Notification';

const ALERT_MILLISECONDS = 5 * 60 * 1000;


/**
 * The type of the React {@code Component} props of
 * {@link ConferenceNotification}.
 */
type Props = {

    /**
     * The URL of the current conference without params.
     */
    _currentConferenceURL: string,

    /**
     * The calendar event list.
     */
    _eventList: Array<Object>,

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
 * The type of the React {@code Component} state of
 * {@link ConferenceNotification}.
 */
type State = {

    /**
     * The event object to display the notification for.
     */
    event?: Object
};

/**
 * Component to display a permanent badge-like notification on the conference
 * screen when another meeting is about to start.
 */
class ConferenceNotification extends Component<Props, State> {
    updateIntervalId: IntervalID;

    /**
     * Constructor of the ConferenceNotification component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            event: undefined
        };

        // Bind event handlers so they are only bound once per instance.
        this._maybeDisplayNotification
            = this._maybeDisplayNotification.bind(this);
        this._onGoToNext = this._onGoToNext.bind(this);
        this._onDismissed = this._onDismissed.bind(this);
    }

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.updateIntervalId = setInterval(
            this._maybeDisplayNotification,
            10 * 1000
        );
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        clearInterval(this.updateIntervalId);
    }

    /**
     * Implements the React Components's render.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;
        const { event } = this.state;
        const customActionNameKey = [ 'notify.joinMeeting' ];
        const customActionType = [ BUTTON_TYPES.PRIMARY ];
        const customActionHandler = [ this._onGoToNext ];
        const now = Date.now();

        if (event) {
            const title = event.startDate < now && event.endDate > now
                ? 'calendarSync.ongoingMeeting'
                : 'calendarSync.nextMeeting';
            const description = getLocalizedDateFormatter(event.startDate).fromNow();

            return (
                <Notification
                    customActionHandler = { customActionHandler }
                    customActionNameKey = { customActionNameKey }
                    customActionType = { customActionType }
                    description = { description }
                    icon = { NOTIFICATION_ICON.WARNING }
                    onDismissed = { this._onDismissed }
                    title = { t(title) }
                    uid = { CALENDAR_NOTIFICATION_ID } />
            );
        }

        return null;
    }

    _maybeDisplayNotification: () => void;

    /**
     * Periodically checks if there is an event in the calendar for which we
     * need to show a notification.
     *
     * @private
     * @returns {void}
     */
    _maybeDisplayNotification() {
        const { _currentConferenceURL, _eventList } = this.props;
        let eventToShow;

        if (_eventList && _eventList.length) {
            const now = Date.now();

            for (const event of _eventList) {
                const eventUrl
                    = event?.url
                        && getURLWithoutParamsNormalized(new URL(event.url));

                if (eventUrl && eventUrl !== _currentConferenceURL) {
                    if ((!eventToShow
                                && event.startDate > now
                                && event.startDate < now + ALERT_MILLISECONDS)
                            || (event.startDate < now && event.endDate > now)) {
                        eventToShow = event;
                    }
                }
            }
        }

        this.setState({
            event: eventToShow
        });
    }

    _onDismissed: number => void;

    /**
     * Emits an action to remove the notification from the redux store so it
     * stops displaying.
     *
     * @param {number} uid - The id of the notification to be removed.
     * @private
     * @returns {void}
     */
    _onDismissed() {
        clearInterval(this.updateIntervalId);
        this.setState({
            event: !this.state.event
        })
    }

    _onGoToNext: () => void;

    /**
     * Opens the meeting URL that the notification shows.
     *
     * @private
     * @returns {void}
     */
    _onGoToNext() {
        const { event } = this.state;

        if (event?.url) {
            this.props.dispatch(appNavigate(event.url));
        }
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *     _aspectRatio: Symbol,
 *     _currentConferenceURL: string,
 *     _eventList: Array
 * }}
 */
function _mapStateToProps(state: Object) {
    const { locationURL } = state['features/base/connection'];

    return {
        _currentConferenceURL:
            locationURL ? getURLWithoutParamsNormalized(locationURL) : '',
        _eventList: state['features/calendar-sync'].events
    };
}

export default translate(connect(_mapStateToProps)(ConferenceNotification));
