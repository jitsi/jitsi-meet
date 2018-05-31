// @flow

import React, { Component } from 'react';
import { Platform } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { PagedList } from '../../base/react';
import { MeetingList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';

type Props = {

    /**
     * True if the calendar feature has fetched entries, false otherwise
     */
    _hasCalendarEntries: boolean,

    /**
     * Renders the lists disabled.
     */
    disabled: boolean,

    /**
     * The i18n translate function.
     */
    t: Function
};

/**
 * Icon to be used for the calendar page on iOS.
 */
const IOS_CALENDAR_ICON = require('../../../../images/calendar.png');

/**
 * Icon to be used for the recent list page on iOS.
 */
const IOS_RECENT_LIST_ICON = require('../../../../images/history.png');

/**
 * Implements the lists displayed on the mobile welcome screen.
 */
class WelcomePageLists extends Component<Props> {
    /**
     * The pages to be rendered.
     * Note: The component field may be undefined if a feature (such as
     * Calendar) is disabled, and that means that the page must not be rendered.
     */
    pages: Array<{
        component: Object,
        icon: string | number,
        title: string
    }>

    /**
     * Component contructor.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        const { t } = props;
        const isAndroid = Platform.OS === 'android';

        this.pages = [ {
            component: RecentList,
            icon: isAndroid ? 'restore' : IOS_RECENT_LIST_ICON,
            title: t('welcomepage.recentList')
        }, {
            component: MeetingList,
            icon: isAndroid ? 'event_note' : IOS_CALENDAR_ICON,
            title: t('welcomepage.calendar')
        } ];
    }

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, _hasCalendarEntries } = this.props;

        return (
            <PagedList
                defaultPage = { _hasCalendarEntries ? 1 : 0 }
                disabled = { disabled }
                pages = { this.pages } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code WelcomePageLists}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     _hasCalendarEntries: boolean
 * }}
 */
function _mapStateToProps(state: Object) {
    const { events } = state['features/calendar-sync'];

    return {
        _hasCalendarEntries: Boolean(events && events.length)
    };
}

export default translate(connect(_mapStateToProps)(WelcomePageLists));
