// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link AbstractPagedList}.
 */
type Props = {

    /**
     * The zero-based index of the page that should be rendered (selected) by
     * default.
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
     * Callback to execute on page change.
     */
    onSelectPage: ?Function,

    /**
     * The pages of the PagedList component to be rendered.
     *
     * Note: An element's {@code component} may be {@code undefined} and then it
     * won't need to be rendered.
     */
    pages: Array<{
        component: ?Object,
        icon: string | number,
        title: string
    }>
};

/**
 * The type of the React {@code Component} state of {@link AbstractPagedList}.
 */
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
     * Initializes a new {@code AbstractPagedList} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            pageIndex: this._validatePageIndex(props.defaultPage)
        };

        // Bind event handlers so they are only bound once per instance.
        this._maybeRefreshSelectedPage
            = this._maybeRefreshSelectedPage.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._maybeRefreshSelectedPage();
    }

    /**
     * Renders the component.
     *
     * @inheritdoc
     */
    render() {
        const { disabled } = this.props;
        const pages = this.props.pages.filter(({ component }) => component);

        return (
            <View
                style = { [
                    styles.pagedListContainer,
                    disabled ? styles.pagedListContainerDisabled : null
                ] }>
                {
                    pages.length > 1
                        ? this._renderPagedList(disabled)
                        : pages.length === 1
                            ? React.createElement(

                                // $FlowExpectedError
                                /* type */ pages[0].component,
                                /* props */ {
                                    disabled,
                                    style: styles.pagedList
                                })
                            : null
                }
            </View>
        );
    }

    _maybeRefreshSelectedPage: () => void;

    /**
     * Components that this PagedList displays may have a refresh function to
     * refresh its content when displayed (or based on custom logic). This
     * function invokes this logic if it's present.
     *
     * @private
     * @returns {void}
     */
    _maybeRefreshSelectedPage() {
        const selectedPage = this.props.pages[this.state.pageIndex];
        let component;

        if (selectedPage && (component = selectedPage.component)) {
            const { refresh } = component;

            typeof refresh === 'function'
                && refresh.call(component, this.props.dispatch);
        }
    }

    _renderPagedList: boolean => React$Node;

    _selectPage: number => void;

    /**
     * Sets the selected page.
     *
     * @param {number} pageIndex - The index of the selected page.
     * @protected
     * @returns {void}
     */
    _selectPage(pageIndex: number) {
        // eslint-disable-next-line no-param-reassign
        pageIndex = this._validatePageIndex(pageIndex);

        const { onSelectPage } = this.props;

        typeof onSelectPage === 'function' && onSelectPage(pageIndex);

        this.setState({ pageIndex }, this._maybeRefreshSelectedPage);
    }

    _validatePageIndex: number => number;

    /**
     * Validates the requested page index and returns a safe value.
     *
     * @private
     * @param {number} pageIndex - The requested page index.
     * @returns {number}
     */
    _validatePageIndex(pageIndex) {
        // pageIndex may point to a non-existing page if some of the pages are
        // disabled (their component property is undefined).
        const maxPageIndex
            = this.props.pages.filter(({ component }) => component).length - 1;

        return Math.max(0, Math.min(maxPageIndex, pageIndex));
    }
}
