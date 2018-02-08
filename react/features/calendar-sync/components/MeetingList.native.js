// @flow
import React, { Component } from 'react';
import {
    SafeAreaView,
    SectionList,
    Text,
    TouchableHighlight,
    View
} from 'react-native';
import { connect } from 'react-redux';

import { appNavigate } from '../../app';
import { translate } from '../../base/i18n';
import { getLocalizedDateFormatter } from '../../base/util';

import styles, { UNDERLAY_COLOR } from './styles';

type Props = {

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The calendar event list.
     */
    _eventList: Array<Object>,

    /**
     * The translate function.
     */
    t: Function
};

/**
 * Component to display a list of events from the (mobile) user's calendar.
 */
class MeetingList extends Component<Props> {

    /**
     * Constructor of the MeetingList component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._createSection = this._createSection.bind(this);
        this._getItemKey = this._getItemKey.bind(this);
        this._onJoin = this._onJoin.bind(this);
        this._onSelect = this._onSelect.bind(this);
        this._renderItem = this._renderItem.bind(this);
        this._renderSection = this._renderSection.bind(this);
        this._toDisplayableList = this._toDisplayableList.bind(this);
        this._toDateString = this._toDateString.bind(this);
    }

    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    render() {
        const { disabled } = this.props;

        return (
            <SafeAreaView
                style = { [
                    styles.container,
                    disabled ? styles.containerDisabled : null
                ] } >
                <SectionList
                    keyExtractor = { this._getItemKey }
                    renderItem = { this._renderItem }
                    renderSectionHeader = { this._renderSection }
                    sections = { this._toDisplayableList() }
                    style = { styles.list } />
            </SafeAreaView>
        );
    }

    _createSection: string => Object;

    /**
     * Creates a section object of a list of events.
     *
     * @private
     * @param {string} i18Title - The i18 title of the section.
     * @returns {Object}
     */
    _createSection(i18Title) {
        return {
            data: [],
            key: `key-${i18Title}`,
            title: this.props.t(i18Title)
        };
    }

    _getItemKey: (Object, number) => string;

    /**
     * Generates a unique id to every item.
     *
     * @private
     * @param {Object} item - The item.
     * @param {number} index - The item index.
     * @returns {string}
     */
    _getItemKey(item, index) {
        return `${index}-${item.id}-${item.startDate}`;
    }

    _onJoin: string => void;

    /**
     * Joins the selected URL.
     *
     * @param {string} url - The URL to join to.
     * @returns {void}
     */
    _onJoin(url) {
        const { disabled, dispatch } = this.props;

        !disabled && url && dispatch(appNavigate(url));
    }

    _onSelect: string => Function;

    /**
     * Creates a function that when invoked, joins the given URL.
     *
     * @private
     * @param {string} url - The URL to join to.
     * @returns {Function}
     */
    _onSelect(url) {
        return this._onJoin.bind(this, url);
    }

    _renderItem: Object => Object;

    /**
     * Renders a single item in the list.
     *
     * @private
     * @param {Object} listItem - The item to render.
     * @returns {Component}
     */
    _renderItem(listItem) {
        const { item } = listItem;

        return (
            <TouchableHighlight
                onPress = { this._onSelect(item.url) }
                underlayColor = { UNDERLAY_COLOR }>
                <View style = { styles.listItem }>
                    <View style = { styles.avatarContainer } >
                        <View style = { styles.avatar } >
                            <Text style = { styles.avatarContent }>
                                { item.title.substr(0, 1).toUpperCase() }
                            </Text>
                        </View>
                    </View>
                    <View style = { styles.listItemDetails }>
                        <Text
                            numberOfLines = { 1 }
                            style = { [
                                styles.listItemText,
                                styles.listItemTitle
                            ] }>
                            { item.title }
                        </Text>
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.listItemText }>
                            { item.url }
                        </Text>
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.listItemText }>
                            { this._toDateString(item) }
                        </Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    _renderSection: Object => Object;

    /**
     * Renders a section title.
     *
     * @private
     * @param {Object} section - The section being rendered.
     * @returns {Component}
     */
    _renderSection(section) {
        return (
            <View style = { styles.listSection }>
                <Text style = { styles.listSectionText }>
                    { section.section.title }
                </Text>
            </View>
        );
    }

    _toDisplayableList: () => Array<Object>

    /**
     * Transforms the event list to a displayable list
     * with sections.
     *
     * @private
     * @returns {Array<Object>}
     */
    _toDisplayableList() {
        const { _eventList } = this.props;
        const now = Date.now();
        const nowSection = this._createSection('calendarSync.now');
        const nextSection = this._createSection('calendarSync.next');
        const laterSection = this._createSection('calendarSync.later');

        if (_eventList && _eventList.length) {
            for (const event of _eventList) {
                if (event.startDate < now && event.endDate > now) {
                    nowSection.data.push(event);
                } else if (event.startDate > now) {
                    if (nextSection.data.length
                    && nextSection.data[0].startDate !== event.startDate) {
                        laterSection.data.push(event);
                    } else {
                        nextSection.data.push(event);
                    }
                }
            }
        }

        const sectionList = [];

        for (const section of [
            nowSection,
            nextSection,
            laterSection
        ]) {
            if (section.data.length) {
                sectionList.push(section);
            }
        }

        return sectionList;
    }

    _toDateString: Object => string;

    /**
     * Generates a date (interval) string for a given event.
     *
     * @private
     * @param {Object} event - The event.
     * @returns {string}
     */
    _toDateString(event) {
        /* eslint-disable max-len */
        return `${getLocalizedDateFormatter(event.startDate).format('lll')} - ${getLocalizedDateFormatter(event.endDate).format('LT')}`;
        /* eslint-enable max-len */
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *      _eventList: Array
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _eventList: state['features/calendar-sync'].events
    };
}

export default translate(connect(_mapStateToProps)(MeetingList));
