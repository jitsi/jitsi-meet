// @flow

import React, { Component } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '../../../icons';
import { connect } from '../../../redux';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link PagedList}.
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
     * NOTE 1: An element's {@code component} may be {@code undefined} and then
     * it won't need to be rendered.
     *
     * NOTE 2: There must be at least one page available and enabled.
     */
    pages: Array<{
        component: ?Object,
        icon: string | number,
        title: string
    }>
};

/**
 * The type of the React {@code Component} state of {@link PagedList}.
 */
type State = {

    /**
     * The currently selected page.
     */
    pageIndex: number
};

/**
 * A component that renders a paged list.
 *
 * @augments PagedList
 */
class PagedList extends Component<Props, State> {

    /**
     * Initializes a new {@code PagedList} instance.
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
                        : React.createElement(

                            // $FlowExpectedError
                            /* type */ pages[0].component,
                            /* props */ {
                                disabled,
                                style: styles.pagedList
                            })
                }
            </View>
        );
    }

    /**
     * Constructs the style of an indicator.
     *
     * @param {number} indicatorIndex - The index of the indicator.
     * @private
     * @returns {Object}
     */
    _getIndicatorStyle(indicatorIndex) {
        if (this.state.pageIndex === indicatorIndex) {
            return styles.pageIndicatorActive;
        }

        return null;
    }

    _maybeRefreshSelectedPage: ?boolean => void;

    /**
     * Components that this PagedList displays may have a refresh function to
     * refresh its content when displayed (or based on custom logic). This
     * function invokes this logic if it's present.
     *
     * @private
     * @param {boolean} isInteractive - If true this refresh was caused by
     * direct user interaction, false otherwise.
     * @returns {void}
     */
    _maybeRefreshSelectedPage(isInteractive: boolean = true) {
        const selectedPage = this.props.pages[this.state.pageIndex];
        let component;

        if (selectedPage && (component = selectedPage.component)) {
            // react-i18n / react-redux wrap components and thus we cannot access
            // the wrapped component's static methods directly.
            const component_ = component.WrappedComponent || component;
            const { refresh } = component_;

            refresh.call(component, this.props.dispatch, isInteractive);
        }
    }

    /**
     * Sets the selected page.
     *
     * @param {number} pageIndex - The index of the selected page.
     * @protected
     * @returns {void}
     */
    _onSelectPage(pageIndex: number) {
        return () => {
            // eslint-disable-next-line no-param-reassign
            pageIndex = this._validatePageIndex(pageIndex);

            const { onSelectPage } = this.props;

            onSelectPage && onSelectPage(pageIndex);

            this.setState({ pageIndex }, this._maybeRefreshSelectedPage);
        };
    }

    /**
     * Renders a single page of the page list.
     *
     * @private
     * @param {Object} page - The page to render.
     * @param {boolean} disabled - Renders the page disabled.
     * @returns {React$Node}
     */
    _renderPage(page, disabled) {
        if (!page.component) {
            return null;
        }

        return (
            <View style = { styles.pageContainer }>
                {
                    React.createElement(
                        page.component,
                        {
                            disabled
                        })
                }
            </View>
        );
    }

    /**
     * Renders the paged list if multiple pages are to be rendered.
     *
     * @param {boolean} disabled - True if the rendered lists should be
     * disabled.
     * @returns {ReactElement}
     */
    _renderPagedList(disabled) {
        const { pages } = this.props;
        const { pageIndex } = this.state;

        return (
            <View style = { styles.pagedListContainer }>
                {
                    this._renderPage(pages[pageIndex], disabled)
                }
                <SafeAreaView style = { styles.pageIndicatorContainer }>
                    {
                        pages.map((page, index) => this._renderPageIndicator(
                            page, index, disabled
                        ))
                    }
                </SafeAreaView>
            </View>
        );
    }

    /**
     * Renders a page indicator (icon) for the page.
     *
     * @private
     * @param {Object} page - The page the indicator is rendered for.
     * @param {number} index - The index of the page the indicator is rendered
     * for.
     * @param {boolean} disabled - Renders the indicator disabled.
     * @returns {React$Node}
     */
    _renderPageIndicator(page, index, disabled) {
        if (!page.component) {
            return null;
        }

        return (
            <TouchableOpacity
                disabled = { disabled }
                key = { index }
                onPress = { this._onSelectPage(index) }
                style = { styles.pageIndicator } >
                <View style = { styles.pageIndicatorContent }>
                    <Icon
                        src = { page.icon }
                        style = { [
                            styles.pageIndicatorIcon,
                            this._getIndicatorStyle(index)
                        ] } />
                    <Text
                        style = { [
                            styles.pageIndicatorText,
                            this._getIndicatorStyle(index)
                        ] }>
                        { page.title }
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

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

export default connect()(PagedList);
