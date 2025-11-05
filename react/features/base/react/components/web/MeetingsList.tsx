import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { getLocalizedDateFormatter, getLocalizedDurationFormatter } from '../../../i18n/dateUtil';
import { translate } from '../../../i18n/functions';
import Icon from '../../../icons/components/Icon';
import { IconTrash } from '../../../icons/svg';

import Container from './Container';
import Text from './Text';

interface IMeeting {
    date: Date;
    duration?: number;
    elementAfter?: React.ReactElement;
    time: Date[];
    title: string;
    url: string;
}

interface IProps extends WithTranslation {

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean;

    /**
     * Indicates if the URL should be hidden or not.
     */
    hideURL?: boolean;

    /**
     * Rendered when the list is empty. Should be a rendered element.
     */
    listEmptyComponent: React.ReactNode;

    /**
     * An array of meetings.
     */
    meetings: IMeeting[];

    /**
     * Handler for deleting an item.
     */
    onItemDelete?: Function;

    /**
     * Function to be invoked when an item is pressed. The item's URL is passed.
     */
    onPress: Function;
}

/**
 * Generates a date string for a given date.
 *
 * @param {Object} date - The date.
 * @private
 * @returns {string}
 */
function _toDateString(date: Date) {
    return getLocalizedDateFormatter(date).format('ll');
}


/**
 * Generates a time (interval) string for a given times.
 *
 * @param {Array<Date>} times - Array of times.
 * @private
 * @returns {string}
 */
function _toTimeString(times: Date[]) {
    if (times && times.length > 0) {
        return (
            times
                .map(time => getLocalizedDateFormatter(time).format('LT'))
                .join(' - '));
    }

    return undefined;
}

/**
 * Implements a React/Web {@link Component} for displaying a list with
 * meetings.
 *
 * @augments Component
 */
class MeetingsList extends Component<IProps> {
    /**
     * Constructor of the MeetingsList component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onPress = this._onPress.bind(this);
        this._renderItem = this._renderItem.bind(this);
    }

    /**
     * Renders the content of this component.
     *
     * @returns {React.ReactNode}
     */
    override render() {
        const { listEmptyComponent, meetings } = this.props;

        /**
         * If there are no recent meetings we don't want to display anything.
         */
        if (meetings) {
            return (
                <Container className = 'meetings-list'>
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

    /**
     * Returns a function that is used in the onPress callback of the items.
     *
     * @param {string} url - The URL of the item to navigate to.
     * @private
     * @returns {Function}
     */
    _onPress(url: string) {
        const { disabled, onPress } = this.props;

        if (!disabled && url && typeof onPress === 'function') {
            return () => onPress(url);
        }

        return undefined;
    }

    /**
     * Returns a function that is used in the onPress callback of the items.
     *
     * @param {string} url - The URL of the item to navigate to.
     * @private
     * @returns {Function}
     */
    _onKeyPress(url: string) {
        const { disabled, onPress } = this.props;

        if (!disabled && url && typeof onPress === 'function') {
            return (e: React.KeyboardEvent) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    onPress(url);
                }
            };
        }

        return undefined;
    }

    /**
     * Returns a function that is used on the onDelete callback.
     *
     * @param {Object} item - The item to be deleted.
     * @private
     * @returns {Function}
     */
    _onDelete(item: Object) {
        const { onItemDelete } = this.props;

        return (evt?: React.MouseEvent) => {
            evt?.stopPropagation();

            onItemDelete?.(item);
        };
    }

    /**
     * Returns a function that is used on the onDelete keypress callback.
     *
     * @param {Object} item - The item to be deleted.
     * @private
     * @returns {Function}
     */
    _onDeleteKeyPress(item: Object) {
        const { onItemDelete } = this.props;

        return (e: React.KeyboardEvent) => {
            if (onItemDelete && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                e.stopPropagation();
                onItemDelete(item);
            }
        };
    }

    /**
     * Renders an item for the list.
     *
     * @param {Object} meeting - Information about the meeting.
     * @param {number} index - The index of the item.
     * @returns {Node}
     */
    _renderItem(meeting: IMeeting, index: number) {
        const {
            date,
            duration,
            elementAfter,
            time,
            title,
            url
        } = meeting;
        const { hideURL = false, onItemDelete, t } = this.props;
        const onPress = this._onPress(url);
        const onKeyPress = this._onKeyPress(url);
        const rootClassName
            = `item ${
                onPress ? 'with-click-handler' : 'without-click-handler'}`;

        return (
            <Container
                className = { rootClassName }
                key = { index }
                onClick = { onPress }
                tabIndex = { 0 }>
                <Container className = 'right-column'>
                    <Text
                        className = 'title'
                        onClick = { onPress }
                        onKeyPress = { onKeyPress }
                        role = 'button'>
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
                <Container className = 'left-column'>
                    <Text className = 'title'>
                        { _toDateString(date) }
                    </Text>
                    <Text className = 'subtitle'>
                        { _toTimeString(time) }
                    </Text>
                </Container>
                <Container className = 'actions'>
                    { elementAfter || null }

                    { onItemDelete && <Icon
                        ariaLabel = { t('welcomepage.recentListDelete') }
                        className = 'delete-meeting'
                        onClick = { this._onDelete(meeting) }
                        onKeyPress = { this._onDeleteKeyPress(meeting) }
                        role = 'button'
                        src = { IconTrash }
                        tabIndex = { 0 } />}
                </Container>
            </Container>
        );
    }
}

export default translate(MeetingsList);
