// @flow

import React, { Component } from 'react';
import { Platform } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { PagedList } from '../../base/react';
import { MeetingList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';

import { setWelcomePageListsDefaultPage } from '../actions';

/**
 * The type of the React {@code Component} props of {@link WelcomePageLists}.
 */
type Props = {

    /**
     * The stored default page index.
     */
    _defaultPage: number,

    /**
     * Renders the lists disabled.
     */
    disabled: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

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
     *
     * Note: An element's  {@code component} may be {@code undefined} if a
     * feature (such as Calendar) is disabled, and that means that the page must
     * not be rendered.
     */
    pages: Array<{
        component: ?Object,
        icon: string | number,
        title: string
    }>;

    /**
     * Initializes a new {@code WelcomePageLists} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        const { t } = props;
        const android = Platform.OS === 'android';

        this.pages = [
            {
                component: RecentList,
                icon: android ? 'restore' : IOS_RECENT_LIST_ICON,
                title: t('welcomepage.recentList')
            },
            {
                component: MeetingList,
                icon: android ? 'event_note' : IOS_CALENDAR_ICON,
                title: t('welcomepage.calendar')
            }
        ];

        // Bind event handlers so they are only bound once per instance.
        this._onSelectPage = this._onSelectPage.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _defaultPage } = this.props;

        if (typeof _defaultPage === 'undefined') {
            return null;
        }

        return (
            <PagedList
                defaultPage = { _defaultPage }
                disabled = { this.props.disabled }
                onSelectPage = { this._onSelectPage }
                pages = { this.pages } />
        );
    }

    _onSelectPage: number => void;

    /**
     * Callback for the {@code PagedList} page select action.
     *
     * @private
     * @param {number} pageIndex - The index of the selected page.
     * @returns {void}
     */
    _onSelectPage(pageIndex) {
        this.props.dispatch(setWelcomePageListsDefaultPage(pageIndex));
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code WelcomePageLists}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     _defaultPage: number
 * }}
 */
function _mapStateToProps(state: Object) {
    let { defaultPage } = state['features/welcome'];

    if (typeof defaultPage === 'undefined') {
        const recentList = state['features/recent-list'];

        defaultPage = recentList && recentList.length ? 0 : 1;
    }

    return {
        _defaultPage: defaultPage
    };
}

export default translate(connect(_mapStateToProps)(WelcomePageLists));
