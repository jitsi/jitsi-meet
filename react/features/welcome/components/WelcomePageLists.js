// @flow

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { IconEventNote, IconRestore } from '../../base/icons';
import { PagedList } from '../../base/react';
import { connect } from '../../base/redux';
import { CalendarList, isCalendarEnabled } from '../../calendar-sync';
import { RecentList } from '../../recent-list';
import { setWelcomePageListsDefaultPage } from '../actions';

/**
 * The type of the React {@code Component} props of {@link WelcomePageLists}.
 */
type Props = {

    /**
     * Whether the calendar functionality is enabled or not.
     */
    _calendarEnabled: boolean,

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
 * Implements the lists displayed on the mobile welcome screen.
 */
class WelcomePageLists extends Component<Props> {
    /**
     * Initializes a new {@code WelcomePageLists} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSelectPage = this._onSelectPage.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _calendarEnabled, _defaultPage, t } = this.props;

        if (typeof _defaultPage === 'undefined') {
            return null;
        }

        const pages = [
            {
                component: RecentList,
                icon: IconRestore,
                title: t('welcomepage.recentList')
            }
        ];

        if (_calendarEnabled) {
            pages.push(
                {
                    component: CalendarList,
                    icon: IconEventNote,
                    title: t('welcomepage.calendar')
                }
            );
        }

        return (
            <PagedList
                defaultPage = { _defaultPage }
                disabled = { this.props.disabled }
                onSelectPage = { this._onSelectPage }
                pages = { pages } />
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
 *     _calendarEnabled: boolean,
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
        _calendarEnabled: isCalendarEnabled(state),
        _defaultPage: defaultPage
    };
}

export default translate(connect(_mapStateToProps)(WelcomePageLists));
