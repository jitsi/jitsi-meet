// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { appNavigate } from '../../app';
import { getLocalizedDateFormatter, translate } from '../../base/i18n';
import { NavigateSectionList } from '../../base/react';

import { refreshCalendar } from '../actions';

import { isCalendarEnabled } from '../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractCalendarList}.
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
    renderListEmptyComponent: Function,

    /**
     * The translate function.
     */
    t: Function
};

/**
 * Component to display a list of events from a connected calendar.
 */
class AbstractCalendarList extends Component<Props> {
    /**
     * Default values for the component's props.
     */
    static defaultProps = {
        _eventList: []
    };

    /**
     * Public API method for {@code Component}s rendered in
     * {@link AbstractPagedList}. When invoked, refreshes the calendar entries
     * in the app.
     *
     * Note: It is a static method as the {@code Component} may not be
     * initialized yet when the UI invokes refresh (e.g. {@link TabBarIOS} tab
     * change).
     *
     * @param {Function} dispatch - The Redux dispatch function.
     * @param {boolean} isInteractive - If true this refresh was caused by
     * direct user interaction, false otherwise.
     * @public
     * @returns {void}
     */
    static refresh(dispatch, isInteractive) {
        dispatch(refreshCalendar(false, isInteractive));
    }

    /**
     * Initializes a new {@code CalendarList} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onPress = this._onPress.bind(this);
        this._onRefresh = this._onRefresh.bind(this);
        this._toDateString = this._toDateString.bind(this);
        this._toDisplayableItem = this._toDisplayableItem.bind(this);
        this._toDisplayableList = this._toDisplayableList.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, renderListEmptyComponent } = this.props;

        return (
            <NavigateSectionList
                disabled = { disabled }
                onPress = { this._onPress }
                onRefresh = { this._onRefresh }
                renderListEmptyComponent
                    = { renderListEmptyComponent }
                sections = { this._toDisplayableList() } />
        );
    }

    _onPress: string => Function;

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {string} url - The url string to navigate to.
     * @returns {void}
     */
    _onPress(url) {
        this.props.dispatch(appNavigate(url));
    }

    _onRefresh: () => void;

    /**
     * Callback to execute when the list is doing a pull-to-refresh.
     *
     * @private
     * @returns {void}
     */
    _onRefresh() {
        this.props.dispatch(refreshCalendar(true));
    }

    _toDateString: Object => string;

    /**
     * Generates a date (interval) string for a given event.
     *
     * @param {Object} event - The event.
     * @private
     * @returns {string}
     */
    _toDateString(event) {
        const startDateTime
            = getLocalizedDateFormatter(event.startDate).format('lll');
        const endTime
            = getLocalizedDateFormatter(event.endDate).format('LT');

        return `${startDateTime} - ${endTime}`;
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
            key: `${event.id}-${event.startDate}`,
            lines: [
                event.url,
                this._toDateString(event)
            ],
            title: event.title,
            url: event.url
        };
    }

    _toDisplayableList: () => Array<Object>;

    /**
     * Transforms the event list to a displayable list with sections.
     *
     * @private
     * @returns {Array<Object>}
     */
    _toDisplayableList() {
        const { _eventList, t } = this.props;

        const now = Date.now();

        const { createSection } = NavigateSectionList;
        const nowSection = createSection(t('calendarSync.now'), 'now');
        const nextSection = createSection(t('calendarSync.next'), 'next');
        const laterSection = createSection(t('calendarSync.later'), 'later');

        for (const event of _eventList) {
            const displayableEvent = this._toDisplayableItem(event);

            if (event.startDate < now && event.endDate > now) {
                nowSection.data.push(displayableEvent);
            } else if (event.startDate > now) {
                if (nextSection.data.length
                    && nextSection.data[0].startDate !== event.startDate) {
                    laterSection.data.push(displayableEvent);
                } else {
                    nextSection.data.push(displayableEvent);
                }
            }
        }

        const sectionList = [];

        for (const section of [
            nowSection,
            nextSection,
            laterSection
        ]) {
            section.data.length && sectionList.push(section);
        }

        return sectionList;
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
    const { events } = state['features/calendar-sync'];

    return {
        _eventList: events
    };
}

export default isCalendarEnabled()
    ? translate(connect(_mapStateToProps)(AbstractCalendarList))
    : undefined;
