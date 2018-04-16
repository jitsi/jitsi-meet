// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { MeetingList } from '../../calendar-sync';
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
};

type State = {

    /**
     * The currently selected page.
     */
    pageIndex: number
};

/**
 * Abstract class for the platform specific paged lists.
 */
export default class AbstractPagedList extends Component<Props, State> {
    /**
     * The list of pages displayed in the component, referenced by page index.
     */
    _pages: Array<Object>;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._pages = [];
        for (const component of [ RecentList, MeetingList ]) {
            // XXX Certain pages may be contributed by optional features. For
            // example, MeetingList is contributed by the calendar feature and
            // apps i.e. SDK consumers may not enable the calendar feature.
            component && this._pages.push(component);
        }

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
                    this._pages.length > 1
                        ? this._renderPagedList(disabled)
                        : React.createElement(
                            /* type */ this._pages[0],
                            /* props */ {
                                disabled,
                                style: styles.pagedList
                            })
                }
            </View>
        );
    }

    _renderPagedList: boolean => React$Node;

    _selectPage: number => void;

    /**
     * Sets the selected page.
     *
     * @param {number} pageIndex - The index of the active page.
     * @protected
     * @returns {void}
     */
    _selectPage(pageIndex: number) {
        this.setState({
            pageIndex
        });

        // The page's Component may have a refresh(dispatch) function which we
        // invoke when the page is selected.
        const selectedPageComponent = this._pages[pageIndex];

        if (selectedPageComponent) {
            const { refresh } = selectedPageComponent;

            typeof refresh === 'function' && refresh(this.props.dispatch);
        }
    }
}
