// @flow

import React, { Component } from 'react';
import { Platform } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { PagedList } from '../../base/react';
import { MeetingList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';

import { setWelcomePageListDefaultPage } from '../actions';

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

        this._onSelectPage = this._onSelectPage.bind(this);
    }

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, _defaultPage } = this.props;

        if (typeof _defaultPage === 'undefined') {
            return null;
        }

        return (
            <PagedList
                defaultPage = { _defaultPage }
                disabled = { disabled }
                onSelectPage = { this._onSelectPage }
                pages = { this.pages } />
        );
    }

    _onSelectPage: number => void

    /**
     * Callback for the {@code PagedList} page select action.
     *
     * @private
     * @param {number} pageIndex - The index of the selected page.
     * @returns {void}
     */
    _onSelectPage(pageIndex) {
        const { dispatch } = this.props;

        dispatch(setWelcomePageListDefaultPage(pageIndex));
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code WelcomePageLists}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     _hasRecentListEntries: boolean
 * }}
 */
function _mapStateToProps(state: Object) {
    const { defaultPage } = state['features/welcome'];
    const recentList = state['features/recent-list'];
    const _hasRecentListEntries = Boolean(recentList && recentList.length);

    return {
        _defaultPage: defaultPage === 'undefined'
            ? _hasRecentListEntries ? 0 : 1
            : defaultPage
    };
}

export default translate(connect(_mapStateToProps)(WelcomePageLists));
