// @flow

import React, { Component } from 'react';
import { View } from 'react-native';
import { isCalendarEnabled } from '../../calendar-sync';
import { RecentList } from '../../recent-list';

import styles from './styles';

/**
 * The page to be displayed on render.
 */
export const DEFAULT_PAGE = 0;

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
     * The i18n translate function
     */
    t: Function
}

type State = {

    /**
     * The currently selected page.
     */
    pageIndex: number
}

/**
 * Abstract class for the platform specific paged lists.
 */
export default class AbstractPagedList extends Component<Props, State> {
    /**
     * True if the calendar feature is enabled on the platform, false otherwise.
     */
    _calendarEnabled: boolean

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._calendarEnabled = isCalendarEnabled();

        this.state = {
            pageIndex: DEFAULT_PAGE
        };
    }

    /**
     * Renders the component.
     *
     * @inheritdoc
     */
    render() {
        const { disabled } = this.props;

        return (
            <View
                style = { [
                    styles.pagedListContainer,
                    disabled ? styles.pagedListContainerDisabled : null
                ] }>
                {
                    (this._calendarEnabled && this._renderPagedList(disabled))
                    || <RecentList
                        disabled = { disabled }
                        style = { styles.pagedList } />
                }
            </View>
        );
    }

    _renderPagedList: boolean => Object

}
