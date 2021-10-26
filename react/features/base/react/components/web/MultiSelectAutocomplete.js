// @flow

import AKInlineDialog from '@atlaskit/inline-dialog';
import { MultiSelectStateless } from '@atlaskit/multi-select';
import _debounce from 'lodash/debounce';
import React, { Component } from 'react';

import logger from '../../logger';

import InlineDialogFailure from './InlineDialogFailure';

/**
 * The type of the React {@code Component} props of
 * {@link MultiSelectAutocomplete}.
 */
type Props = {

    /**
     * The default value of the selected item.
     */
    defaultValue: Array<Object>,

    /**
     * Optional footer to show as a last element in the results.
     * Should be of type {content: <some content>}
     */
    footer: Object,

    /**
     * Indicates if the component is disabled.
     */
    isDisabled: boolean,

    /**
     * Text to display while a query is executing.
     */
    loadingMessage: string,

    /**
     * The text to show when no matches are found.
     */
    noMatchesFound: string,

    /**
     * The function called immediately before a selection has been actually
     * selected. Provides an opportunity to do any formatting.
     */
    onItemSelected: Function,

    /**
     * The function called when the selection changes.
     */
    onSelectionChange: Function,

    /**
     * The placeholder text of the input component.
     */
    placeholder: string,

    /**
     * The service providing the search.
     */
    resourceClient: { makeQuery: Function, parseResults: Function },

    /**
     * Indicates if the component should fit the container.
     */
    shouldFitContainer: boolean,

    /**
     * Indicates if we should focus.
     */
    shouldFocus: boolean,

    /**
     * Indicates whether the support link should be shown in case of an error
     */
    showSupportLink: Boolean,
};

/**
 * The type of the React {@code Component} state of
 * {@link MultiSelectAutocomplete}.
 */
type State = {

    /**
     * Indicates if the dropdown is open.
     */
    isOpen: boolean,

    /**
     * The text that filters the query result of the search.
     */
    filterValue: string,

    /**
     * Indicates if the component is currently loading results.
     */
    loading: boolean,

    /**
     * Indicates if there was an error.
     */
    error: boolean,

    /**
     * The list of result items.
     */
    items: Array<Object>,

    /**
     * The list of selected items.
     */
    selectedItems: Array<Object>
};

/**
 * A MultiSelect that is also auto-completing.
 */
class MultiSelectAutocomplete extends Component<Props, State> {
    /**
     * Initializes a new {@code MultiSelectAutocomplete} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        const defaultValue = this.props.defaultValue || [];

        this.state = {
            isOpen: false,
            filterValue: '',
            loading: false,
            error: false,
            items: [],
            selectedItems: [ ...defaultValue ]
        };

        this._onFilterChange = this._onFilterChange.bind(this);
        this._onRetry = this._onRetry.bind(this);
        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._sendQuery = _debounce(this._sendQuery.bind(this), 200);
    }

    /**
     * Sets the items to display as selected.
     *
     * @param {Array<Object>} selectedItems - The list of items to display as
     * having been selected.
     * @returns {void}
     */
    setSelectedItems(selectedItems: Array<Object> = []) {
        this.setState({ selectedItems });
    }

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        const shouldFitContainer = this.props.shouldFitContainer || false;
        const shouldFocus = this.props.shouldFocus || false;
        const isDisabled = this.props.isDisabled || false;
        const placeholder = this.props.placeholder || '';
        const noMatchesFound = this.props.noMatchesFound || '';

        return (
            <div>
                <MultiSelectStateless
                    filterValue = { this.state.filterValue }
                    footer = { this.props.footer }
                    icon = { null }
                    isDisabled = { isDisabled }
                    isLoading = { this.state.loading }
                    isOpen = { this.state.isOpen }
                    items = { this.state.items }
                    loadingMessage = { this.props.loadingMessage }
                    noMatchesFound = { noMatchesFound }
                    onFilterChange = { this._onFilterChange }
                    onRemoved = { this._onSelectionChange }
                    onSelected = { this._onSelectionChange }
                    placeholder = { placeholder }
                    selectedItems = { this.state.selectedItems }
                    shouldFitContainer = { shouldFitContainer }
                    shouldFocus = { shouldFocus } />
                { this._renderError() }
            </div>
        );
    }

    _onFilterChange: (string) => void;

    /**
     * Sets the state and sends a query on filter change.
     *
     * @param {string} filterValue - The filter text value.
     * @private
     * @returns {void}
     */
    _onFilterChange(filterValue) {
        this.setState({
            // Clean the error if the filterValue is empty.
            error: this.state.error && Boolean(filterValue),
            filterValue,
            isOpen: Boolean(this.state.items.length) && Boolean(filterValue),
            items: filterValue ? this.state.items : [],
            loading: Boolean(filterValue)
        });
        if (filterValue) {
            this._sendQuery(filterValue);
        }
    }

    _onRetry: () => void;

    /**
     * Retries the query on retry.
     *
     * @private
     * @returns {void}
     */
    _onRetry() {
        this._sendQuery(this.state.filterValue);
    }

    _onSelectionChange: (Object) => void;

    /**
     * Updates the selected items when a selection event occurs.
     *
     * @param {Object} item - The selected item.
     * @private
     * @returns {void}
     */
    _onSelectionChange(item) {
        const existing
            = this.state.selectedItems.find(k => k.value === item.value);
        let selectedItems = this.state.selectedItems;

        if (existing) {
            selectedItems = selectedItems.filter(k => k !== existing);
        } else {
            selectedItems.push(this.props.onItemSelected(item));
        }
        this.setState({
            isOpen: false,
            selectedItems
        });

        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(selectedItems);
        }
    }

    /**
     * Renders the error UI.
     *
     * @returns {ReactElement|null}
     */
    _renderError() {
        if (!this.state.error) {
            return null;
        }
        const content = (
            <div className = 'autocomplete-error'>
                <InlineDialogFailure
                    onRetry = { this._onRetry }
                    showSupportLink = { this.props.showSupportLink } />
            </div>
        );

        return (
            <AKInlineDialog
                content = { content }
                isOpen = { true } />
        );
    }

    _sendQuery: (string) => void;

    /**
     * Sends a query to the resourceClient.
     *
     * @param {string} filterValue - The string to use for the search.
     * @returns {void}
     */
    _sendQuery(filterValue) {
        if (!filterValue) {
            return;
        }

        this.setState({
            error: false
        });

        const resourceClient = this.props.resourceClient || {
            makeQuery: () => Promise.resolve([]),
            parseResults: results => results
        };

        resourceClient.makeQuery(filterValue)
            .then(results => {
                if (this.state.filterValue !== filterValue) {
                    this.setState({
                        error: false
                    });

                    return;
                }
                const itemGroups = [
                    {
                        items: resourceClient.parseResults(results)
                    }
                ];

                this.setState({
                    items: itemGroups,
                    isOpen: true,
                    loading: false,
                    error: false
                });
            })
            .catch(error => {
                logger.error('MultiSelectAutocomplete error in query', error);

                this.setState({
                    error: true,
                    loading: false,
                    isOpen: false
                });
            });
    }
}

export default MultiSelectAutocomplete;
