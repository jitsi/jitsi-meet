// @flow

import React, { Component } from 'react';
import { Platform } from 'react-native';

import { translate } from '../../base/i18n';
import { PagedList } from '../../base/react';
import { MeetingList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';

type Props = {

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
        const { disabled } = this.props;

        return (
            <PagedList
                defaultPage = { 0 }
                disabled = { disabled }
                pages = { this.pages } />
        );
    }
}

export default translate(WelcomePageLists);
