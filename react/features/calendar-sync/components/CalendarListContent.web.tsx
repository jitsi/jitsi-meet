import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createCalendarClickedEvent, createCalendarSelectedEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { appNavigate } from '../../app/actions.web';
import { IReduxState, IStore } from '../../app/types';
import MeetingsList from '../../base/react/components/web/MeetingsList';
import { setCalendarTimerDuration } from '../../time-timer/actions';

import AddMeetingUrlButton from './AddMeetingUrlButton.web';
import JoinButton from './JoinButton.web';

/**
 * The type of the React {@code Component} props of
 * {@link CalendarListContent}.
 */
interface IProps {

    /**
     * The calendar event list.
     */
    _eventList: Array<Object>;

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     *
     */
    listEmptyComponent: React.ReactNode;
}

/**
 * Component to display a list of events from a connected calendar.
 */
class CalendarListContent extends Component<IProps> {
    /**
     * Default values for the component's props.
     */
    static defaultProps = {
        _eventList: []
    };

    _urlDurationMap: Map<string, number> | undefined;

    /**
     * Initializes a new {@code CalendarListContent} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onJoinPress = this._onJoinPress.bind(this);
        this._onPress = this._onPress.bind(this);
        this._toDisplayableItem = this._toDisplayableItem.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        sendAnalytics(createCalendarSelectedEvent());
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { disabled, listEmptyComponent } = this.props;
        const { _eventList = [] } = this.props;
        const meetings = _eventList.map(this._toDisplayableItem);

        this._urlDurationMap = new Map(
            (_eventList as any[])
                .filter(e => e.url && e.endDate && e.startDate)
                .map(e => [ e.url, Math.round((e.endDate - e.startDate) / 1000) ])
        );

        return (
            <MeetingsList
                disabled = { disabled }
                listEmptyComponent = { listEmptyComponent }
                meetings = { meetings }
                onPress = { this._onPress } />
        );
    }

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {Object} event - The click event.
     * @param {string} url - The url string to navigate to.
     * @returns {void}
     */
    _onJoinPress(event: React.KeyboardEvent, url: string) {
        event.stopPropagation();

        this._onPress(url, 'meeting.join');
    }

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {string} url - The url string to navigate to.
     * @param {string} analyticsEventName - Тhe name of the analytics event
     * associated with this action.
     * @returns {void}
     */
    _onPress(url: string, analyticsEventName = 'meeting.tile') {
        sendAnalytics(createCalendarClickedEvent(analyticsEventName));

        const durationSeconds = this._urlDurationMap?.get(url);

        this.props.dispatch(setCalendarTimerDuration(durationSeconds));
        this.props.dispatch(appNavigate(url));
    }

    /**
     * Creates a displayable object from an event.
     *
     * @param {Object} event - The calendar event.
     * @private
     * @returns {Object}
     */
    _toDisplayableItem(event: any) {
        return {
            elementAfter: event.url
                ? <JoinButton
                    onPress = { this._onJoinPress }
                    url = { event.url } />
                : (<AddMeetingUrlButton
                    calendarId = { event.calendarId }
                    eventId = { event.id } />),
            date: event.startDate,
            time: [ event.startDate, event.endDate ],
            description: event.url,
            title: event.title,
            url: event.url
        };
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *     _eventList: Array<Object>
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _eventList: state['features/calendar-sync'].events
    };
}

export default connect(_mapStateToProps)(CalendarListContent);
