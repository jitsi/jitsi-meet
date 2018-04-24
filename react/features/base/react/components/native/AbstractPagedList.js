// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import styles from './styles';

type Props = {

    /**
     * The index (starting from 0) of the page that should be rendered
     * active as default.
     */
    defaultPage: number,

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The pages of the PagedList component to be rendered.
     * Note: page.component may be undefined and then they don't need to be
     * rendered.
     */
    pages: Array<{
        component: Object,
        icon: string | number,
        title: string
    }>
};

type State = {

    /**
     * The currently selected page.
     */
    pageIndex: number
};

/**
 * Abstract class containing the platform independent logic of the paged lists.
 */
export default class AbstractPagedList extends Component<Props, State> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // props.defaultPage may point to a non existing page if some of the
        // pages are disabled.
        const maxPageIndex
            = props.pages.filter(page => page.component).length - 1;

        this.state = {
            pageIndex: Math.max(0, Math.min(maxPageIndex, props.defaultPage))
        };
    }

    /**
     * Renders the component.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, pages } = this.props;
        const enabledPages = pages.filter(page => page.component);

        return (
            <View
                style = { [
                    styles.pagedListContainer,
                    disabled ? styles.pagedListContainerDisabled : null
                ] }>
                {
                    enabledPages.length > 1
                        ? this._renderPagedList(disabled)
                        : enabledPages.length === 1
                            ? React.createElement(
                                /* type */ enabledPages[0].component,
                                /* props */ {
                                    disabled,
                                    style: styles.pagedList
                                }) : null
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
        const selectedPage = this.props.pages[pageIndex];

        if (selectedPage && selectedPage.component) {
            const { refresh } = selectedPage.component;

            typeof refresh === 'function' && refresh(this.props.dispatch);
        }
    }
}
