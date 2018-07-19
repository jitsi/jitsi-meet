// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { appNavigate, getDefaultURL } from '../../app';
import {
    getLocalizedDateFormatter,
    getLocalizedDurationFormatter,
    translate
} from '../../base/i18n';
import { NavigateSectionList } from '../../base/react';
import { parseURIString } from '../../base/util';

/**
 * The type of the React {@code Component} props of {@link RecentList}
 */
type Props = {

    /**
     * Renders the list disabled.
     */
    disabled: boolean,

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: Dispatch<*>,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * The default server URL.
     */
    _defaultServerURL: string,

    /**
     * The recent list from the Redux store.
     */
    _recentList: Array<Object>
};

/**
 * The native container rendering the list of the recently joined rooms.
 *
 */
class RecentList extends Component<Props> {
    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onPress = this._onPress.bind(this);
        this._toDateString = this._toDateString.bind(this);
        this._toDurationString = this._toDurationString.bind(this);
        this._toDisplayableItem = this._toDisplayableItem.bind(this);
        this._toDisplayableList = this._toDisplayableList.bind(this);
    }

    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    render() {
        const { disabled } = this.props;

        return (
            <NavigateSectionList
                disabled = { disabled }
                onPress = { this._onPress }
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
        const { dispatch } = this.props;

        dispatch(appNavigate(url));
    }

    _toDisplayableItem: Object => Object;

    /**
     * Creates a displayable list item of a recent list entry.
     *
     * @private
     * @param {Object} item - The recent list entry.
     * @returns {Object}
     */
    _toDisplayableItem(item) {
        const { _defaultServerURL } = this.props;
        const location = parseURIString(item.conference);
        const baseURL = `${location.protocol}//${location.host}`;
        const serverName = baseURL === _defaultServerURL ? null : location.host;

        return {
            colorBase: serverName,
            key: `key-${item.conference}-${item.date}`,
            lines: [
                this._toDateString(item.date),
                this._toDurationString(item.duration),
                serverName
            ],
            title: location.room,
            url: item.conference
        };
    }

    _toDisplayableList: () => Array<Object>;

    /**
     * Transforms the history list to a displayable list
     * with sections.
     *
     * @private
     * @returns {Array<Object>}
     */
    _toDisplayableList() {
        const { _recentList, t } = this.props;
        const { createSection } = NavigateSectionList;
        const todaySection = createSection(t('recentList.today'), 'today');
        const yesterdaySection
            = createSection(t('recentList.yesterday'), 'yesterday');
        const earlierSection
            = createSection(t('recentList.earlier'), 'earlier');
        const today = new Date().toDateString();
        const yesterdayDate = new Date();

        yesterdayDate.setDate(yesterdayDate.getDate() - 1);

        const yesterday = yesterdayDate.toDateString();

        for (const item of _recentList) {
            const itemDay = new Date(item.date).toDateString();
            const displayableItem = this._toDisplayableItem(item);

            if (itemDay === today) {
                todaySection.data.push(displayableItem);
            } else if (itemDay === yesterday) {
                yesterdaySection.data.push(displayableItem);
            } else {
                earlierSection.data.push(displayableItem);
            }
        }

        const displayableList = [];

        if (todaySection.data.length) {
            todaySection.data.reverse();
            displayableList.push(todaySection);
        }
        if (yesterdaySection.data.length) {
            yesterdaySection.data.reverse();
            displayableList.push(yesterdaySection);
        }
        if (earlierSection.data.length) {
            earlierSection.data.reverse();
            displayableList.push(earlierSection);
        }

        return displayableList;
    }

    _toDateString: number => string;

    /**
     * Generates a date string for the item.
     *
     * @private
     * @param {number} itemDate - The item's timestamp.
     * @returns {string}
     */
    _toDateString(itemDate) {
        const date = new Date(itemDate);
        const m = getLocalizedDateFormatter(itemDate);

        if (date.toDateString() === new Date().toDateString()) {
            // The date is today, we use fromNow format.
            return m.fromNow();
        }

        return m.format('lll');
    }

    _toDurationString: number => string;

    /**
     * Generates a duration string for the item.
     *
     * @private
     * @param {number} duration - The item's duration.
     * @returns {string}
     */
    _toDurationString(duration) {
        if (duration) {
            return getLocalizedDurationFormatter(duration).humanize();
        }

        return null;
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *     _defaultServerURL: string,
 *     _recentList: Array
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _defaultServerURL: getDefaultURL(state),
        _recentList: state['features/recent-list']
    };
}

export default translate(connect(_mapStateToProps)(RecentList));
