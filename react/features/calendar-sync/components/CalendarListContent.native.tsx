import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { createCalendarClickedEvent, createCalendarSelectedEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { appNavigate } from '../../app/actions.native';
import { IReduxState, IStore } from '../../app/types';
import { getLocalizedDateFormatter } from '../../base/i18n/dateUtil';
import { translate } from '../../base/i18n/functions';
import NavigateSectionList from '../../base/react/components/native/NavigateSectionList';
import { openUpdateCalendarEventDialog, refreshCalendar } from '../actions.native';


/**
 * The type of the React {@code Component} props of
 * {@link CalendarListContent}.
 */
interface IProps extends WithTranslation {

    /**
     * The calendar event list.
     */
    _eventList: Array<any>;

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
    listEmptyComponent: React.ReactElement<any>;
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

    /**
     * Initializes a new {@code CalendarListContent} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onPress = this._onPress.bind(this);
        this._onRefresh = this._onRefresh.bind(this);
        this._onSecondaryAction = this._onSecondaryAction.bind(this);
        this._toDateString = this._toDateString.bind(this);
        this._toDisplayableItem = this._toDisplayableItem.bind(this);
        this._toDisplayableList = this._toDisplayableList.bind(this);
        this._toTimeString = this._toTimeString.bind(this);
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

        return (
            <NavigateSectionList
                disabled = { disabled }
                onPress = { this._onPress }
                onRefresh = { this._onRefresh }
                onSecondaryAction = { this._onSecondaryAction }
                renderListEmptyComponent
                    = { listEmptyComponent }
                sections = { this._toDisplayableList() } />
        );
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

        this.props.dispatch(appNavigate(url));
    }

    /**
     * Callback to execute when the list is doing a pull-to-refresh.
     *
     * @private
     * @returns {void}
     */
    _onRefresh() {
        this.props.dispatch(refreshCalendar(true));
    }

    /**
     * Handles the list's secondary action.
     *
     * @private
     * @param {string} id - The ID of the item on which the secondary action was
     * performed.
     * @returns {void}
     */
    _onSecondaryAction(id: string) {
        this.props.dispatch(openUpdateCalendarEventDialog(id));
    }

    /**
     * Generates a date string for a given event.
     *
     * @param {Object} event - The event.
     * @private
     * @returns {string}
     */
    _toDateString(event: any) {
        const startDateTime
            = getLocalizedDateFormatter(event.startDate).format('MMM Do, YYYY');

        return `${startDateTime}`;
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
            id: event.id,
            key: `${event.id}-${event.startDate}`,
            lines: [
                event.url,
                this._toTimeString(event)
            ],
            title: event.title,
            url: event.url
        };
    }

    /**
     * Transforms the event list to a displayable list with sections.
     *
     * @private
     * @returns {Array<Object>}
     */
    _toDisplayableList() {
        const { _eventList, t } = this.props;

        const now = new Date();

        const { createSection } = NavigateSectionList;
        const TODAY_SECTION = 'today';
        const sectionMap = new Map();

        for (const event of _eventList) {
            const displayableEvent = this._toDisplayableItem(event);
            const startDate = new Date(event.startDate).getDate();

            if (startDate === now.getDate()) {
                let todaySection = sectionMap.get(TODAY_SECTION);

                if (!todaySection) {
                    todaySection
                        = createSection(t('calendarSync.today'), TODAY_SECTION);
                    sectionMap.set(TODAY_SECTION, todaySection);
                }

                todaySection.data.push(displayableEvent);
            } else if (sectionMap.has(startDate)) {
                const section = sectionMap.get(startDate);

                if (section) {
                    section.data.push(displayableEvent);
                }
            } else {
                const newSection
                    = createSection(this._toDateString(event), startDate);

                sectionMap.set(startDate, newSection);
                newSection.data.push(displayableEvent);
            }
        }

        return Array.from(sectionMap.values());
    }

    /**
     * Generates a time (interval) string for a given event.
     *
     * @param {Object} event - The event.
     * @private
     * @returns {string}
     */
    _toTimeString(event: any) {
        const startDateTime
            = getLocalizedDateFormatter(event.startDate).format('lll');
        const endTime
            = getLocalizedDateFormatter(event.endDate).format('LT');

        return `${startDateTime} - ${endTime}`;
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _eventList: state['features/calendar-sync'].events
    };
}

export default translate(connect(_mapStateToProps)(CalendarListContent));
