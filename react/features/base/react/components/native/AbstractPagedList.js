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

        this.state = {
            pageIndex: this._validatePageIndex(props.defaultPage)
        };
    }

    /**
     * Implements React {@code Component}'s componentWillReceiveProps.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(newProps: Props) {
        const { defaultPage } = newProps;

        if (defaultPage !== this.props.defaultPage) {
            // Default page changed due to a redux update. This is likely to
            // happen after APP_WILL_MOUNT. So we update the active tab.
            this._platformSpecificPageSelect(defaultPage);
        }
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

    _platformSpecificPageSelect: number => void

    /**
     * Method to be overriden by the components implementing this abstract class
     * to handle platform specific actions on page select.
     *
     * @protected
     * @param {number} pageIndex - The selected page index.
     * @returns {void}
     */
    _platformSpecificPageSelect(pageIndex) {
        this._selectPage(pageIndex);
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
        const validatedPageIndex = this._validatePageIndex(pageIndex);

        this.setState({
            pageIndex: validatedPageIndex
        });

        // The page's Component may have a refresh(dispatch) function which we
        // invoke when the page is selected.
        const selectedPage = this.props.pages[validatedPageIndex];

        if (selectedPage && selectedPage.component) {
            const { refresh } = selectedPage.component;

            typeof refresh === 'function' && refresh(this.props.dispatch);
        }
    }

    _validatePageIndex: number => number

    /**
     * Validates the requested page index and returns a safe value.
     *
     * @private
     * @param {number} pageIndex - The requested page index.
     * @returns {number}
     */
    _validatePageIndex(pageIndex) {
        // pageIndex may point to a non existing page if some of the pages are
        // disabled (their component property is undefined).
        const maxPageIndex
            = this.props.pages.filter(page => page.component).length - 1;

        return Math.max(0, Math.min(maxPageIndex, pageIndex));
    }
}
