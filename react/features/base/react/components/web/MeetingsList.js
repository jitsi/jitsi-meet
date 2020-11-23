// @flow

import React, { Component } from 'react';

import {
    getLocalizedDateFormatter,
    getLocalizedDurationFormatter,
    translate
} from '../../../i18n';
import { Icon, IconTrash } from '../../../icons';

import Container from './Container';
import Text from './Text';

type Props = {

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * Indicates if the URL should be hidden or not.
     */
    hideURL: boolean,

    /**
     * Function to be invoked when an item is pressed. The item's URL is passed.
     */
    onPress: Function,

    /**
     * Rendered when the list is empty. Should be a rendered element.
     */
    listEmptyComponent: Object,

    /**
     * An array of meetings.
     */
    meetings: Array<Object>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Handler for deleting an item.
     */
    onItemDelete?: Function
};

/**
 * Generates a date string for a given date.
 *
 * @param {Object} date - The date.
 * @param {string} fmt - Custom date format
 * @private
 * @returns {string}
 */
function _toDateString(date, fmt) {
    let newFormat = fmt;

    if (newFormat === undefined || newFormat === null || newFormat.length === 0) {
        newFormat = 'MMM Do, YYYY';
    }

    return getLocalizedDateFormatter(date).format(newFormat);
}


/**
 * Generates a time (interval) string for a given times.
 *
 * @param {Array<Date>} times - Array of times.
 * @param {string} fmt - Custom time format
 * @private
 * @returns {string}
 */
function _toTimeString(times, fmt) {
    let newFormat = fmt;

    if (fmt === undefined || fmt === null || fmt.length === 0) {
        newFormat = 'LT';
    }

    if (times && times.length > 0) {
        return (
            times
                .map(time => getLocalizedDateFormatter(time).format(newFormat))
                .join(' - '));
    }

    return undefined;
}

/**
 * Implements a React/Web {@link Component} for displaying a list with
 * meetings.
 *
 * @extends Component
 */
//export default class MeetingsList extends Component<Props> {
class MeetingsList extends Component<Props> {
		/**
     * Constructor of the MeetingsList component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onPress = this._onPress.bind(this);
        this._renderItem = this._renderItem.bind(this);
    }

    /**
     * Renders the content of this component.
     *
     * @returns {React.ReactNode}
     */
    render() {
        const { listEmptyComponent, meetings } = this.props;

        /**
         * If there are no recent meetings we don't want to display anything
         */
        if (meetings) {
            return (
                <Container
                    className = 'meetings-list'>
                    {
                        meetings.length === 0
                            ? listEmptyComponent
                            : meetings.map(this._renderItem)
                    }
                </Container>
            );
        }

        return null;
    }

    _onPress: string => Function;

    /**
     * Returns a function that is used in the onPress callback of the items.
     *
     * @param {string} url - The URL of the item to navigate to.
     * @private
     * @returns {Function}
     */
    _onPress(url) {
        const { disabled, onPress } = this.props;

        if (!disabled && url && typeof onPress === 'function') {
            return () => onPress(url);
        }

        return null;
    }

    _onDelete: Object => Function;

    /**
     * Returns a function that is used on the onDelete callback.
     *
     * @param {Object} item - The item to be deleted.
     * @private
     * @returns {Function}
     */
    _onDelete(item) {
        const { onItemDelete } = this.props;

        return evt => {
            evt.stopPropagation();

            onItemDelete && onItemDelete(item);
        };
    }

    _renderItem: (Object, number) => React$Node;

    /**
     * Renders an item for the list.
     *
     * @param {Object} meeting - Information about the meeting.
     * @param {number} index - The index of the item.
     * @returns {Node}
     */
    _renderItem(meeting, index) {
        const {
            date,
            duration,
            elementAfter,
            time,
            title,
            url
        } = meeting;
        const { hideURL = false, onItemDelete } = this.props;
        const { t } = this.props;
        const onPress = this._onPress(url);
        const rootClassName
            = `item ${
                onPress ? 'with-click-handler' : 'without-click-handler'}`;
        return (
            <Container
                className = { rootClassName }
                key = { index }
                onClick = { onPress }>
                <Container className = 'left-column'>
                    <Text className = 'title'>
                        { _toDateString(date, (t('meetingsList.dateFormat') === 'meetingsList.dateFormat' ? null : t('meetingsList.dateFormat'))) }
                    </Text>
                    <Text className = 'subtitle'>
                        { _toTimeString(time, (t('meetingsList.timeFormat') === 'meetingsList.timeFormat' ? null : t('meetingsList.timeFormat'))) }
                    </Text>
                </Container>
                <Container className = 'right-column'>
                    <Text className = 'title'>
                        { title }
                    </Text>
                    {
                        hideURL || !url ? null : (
                            <Text>
                                { url }
                            </Text>)
                    }
                    {
                        typeof duration === 'number' ? (
                            <Text className = 'subtitle'>
                                { getLocalizedDurationFormatter(duration) }
                            </Text>) : null
                    }
                </Container>
                <Container className = 'actions'>
                    { elementAfter || null }

                    { onItemDelete && <Icon
                        className = 'delete-meeting'
                        onClick = { this._onDelete(meeting) }
                        src = { IconTrash } />}
                </Container>
            </Container>
        );
    }
}

export default translate(MeetingsList);
