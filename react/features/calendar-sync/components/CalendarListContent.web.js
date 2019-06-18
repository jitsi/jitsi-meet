// @flow

import React, { Component } from 'react';

import { appNavigate } from '../../app';
import {
    createCalendarClickedEvent,
    createCalendarSelectedEvent,
    sendAnalytics
} from '../../analytics';
import { MeetingsList } from '../../base/react';
import { connect } from '../../base/redux';

import AddMeetingUrlButton from './AddMeetingUrlButton';
import JoinButton from './JoinButton';

/**
 * The type of the React {@code Component} props of
 * {@link CalendarListContent}.
 */
type Props = {

    /**
     * The calendar event list.
     */
    _eventList: Array<Object>,

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     *
     */
    listEmptyComponent: React$Node,
};

/**
 * Component to display a list of events from a connected calendar.
 */
class CalendarListContent extends Component<Props> {
    /**
     * Default values for the component's props.
     */
    static defaultProps = {
        _eventList: []
    };

    /**
     * Initializes a new {@code CalendarListContent} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
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
    componentDidMount() {
        sendAnalytics(createCalendarSelectedEvent());
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, listEmptyComponent } = this.props;
        const { _eventList = [] } = this.props;
        const meetings = _eventList.map(this._toDisplayableItem);

        return (
            <MeetingsList
                disabled = { disabled }
                listEmptyComponent = { listEmptyComponent }
                meetings = { meetings }
                onPress = { this._onPress } />
        );
    }

    _onJoinPress: (Object, string) => Function;

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {Object} event - The click event.
     * @param {string} url - The url string to navigate to.
     * @returns {void}
     */
    _onJoinPress(event, url) {
        event.stopPropagation();

        this._onPress(url, 'calendar.meeting.join');
    }

    _onPress: (string, ?string) => Function;

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {string} url - The url string to navigate to.
     * @param {string} analyticsEventName - Тhe name of the analytics event
     * associated with this action.
     * @returns {void}
     */
    _onPress(url, analyticsEventName = 'calendar.meeting.tile') {
        sendAnalytics(createCalendarClickedEvent(analyticsEventName));

        this.props.dispatch(appNavigate(url));
    }

    _toDisplayableItem: Object => Object;

    /**
     * Creates a displayable object from an event.
     *
     * @param {Object} event - The calendar event.
     * @private
     * @returns {Object}
     */
    _toDisplayableItem(event) {
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
function _mapStateToProps(state: Object) {
    return {
        _eventList: state['features/calendar-sync'].events
    };
}

export default connect(_mapStateToProps)(CalendarListContent);
