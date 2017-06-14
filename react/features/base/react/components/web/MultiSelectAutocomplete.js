import React, { Component } from 'react';
import { StatelessMultiSelect } from '@atlaskit/multi-select';
import AKInlineDialog from '@atlaskit/inline-dialog';
import Spinner from '@atlaskit/spinner';
import InlineDialogFailure from './InlineDialogFailure';

/**
 *
 */
class MultiSelectAutocomplete extends Component {

    /**
     * {@code MultiSelectAutocomplete} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         *
         */
        defaultValue: React.PropTypes.array,

        /**
         *
         */
        isDisabled: React.PropTypes.bool,

        /**
         *
         */
        noMatchesFound: React.PropTypes.string,

        /**
         *
         */
        onSelectionChange: React.PropTypes.func,

        /**
         *
         */
        placeholder: React.PropTypes.string,

        /**
         *
         */
        resourceClient: React.PropTypes.shape({
            makeQuery: React.PropTypes.func,
            parseResults: React.PropTypes.func
        }).isRequired,

        /**
         *
         */
        shouldFitContainer: React.PropTypes.bool,

        /**
         *
         */
        shouldFocus: React.PropTypes.bool,
    };

    /**
     *
     * @param props
     */
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
            filterValue: '',
            loading: false,
            error: false,
            items: [],
            selectedItems: [ ...props.defaultValue ] || []
        };

        this._onFilterChange = this._onFilterChange.bind(this);
        this._onSelectionChange = this._onSelectionChange.bind(this);
    }

    /**
     *
     */
    clear() {
        this.setState({
            selectedItems: []
        });
    }

    /**
     *
     * @param filterValue
     * @private
     */
    _onFilterChange(filterValue) {
        this.setState({
            filterValue,
            isOpen: Boolean(this.state.items.length) && Boolean(filterValue),
            items: filterValue ? this.state.items : []
        });
        if (filterValue) {
            this.sendQuery(filterValue);
        }
    }

    /**
     *
     * @param text
     */
    sendQuery(text) {
        this.setState({
            loading: true,
            error: false
        });
        this.props.resourceClient.makeQuery(text).success(response => {
            if (this.state.filterValue !== text) {
                this.setState({
                    loading: false,
                    error: false
                });

                return;
            }
            const itemGroups = [
                {
                    items: this.props.resourceClient.parseResults(response)
                }
            ];

            this.setState({
                items: itemGroups,
                isOpen: true,
                loading: false,
                error: false
            });

        })
        .error(error => {
            this.setState({
                error: true,
                loading: false,
                isOpen: false
            });
        });

        // then((results) => {
        //     if (this.state.filterValue !== text) {
        //         this.setState({
        //             loading: false,
        //             error: false
        //         });
        //         return;
        //     }
        //     const itemGroups = [
        //         {
        //             items: this.props.resourceClient.parseResults(results)
        //         }
        //     ];
        //     this.setState({
        //         items: itemGroups,
        //         isOpen: true,
        //         loading: false,
        //         error: false
        //     });
        // })
        //     .catch(() => {
        //         this.setState({
        //             error: true,
        //             loading: false,
        //             isOpen: false
        //         });
        //     });
    }

    /**
     *
     * @param item
     * @private
     */
    _onSelectionChange(item) {
        const existing
            = this.state.selectedItems.find(k => k.value === item.value);
        let selectedItems = this.state.selectedItems;

        if (existing) {
            selectedItems = selectedItems.filter(k => k !== existing);
        } else {
            selectedItems.push(item);
        }
        this.setState({
            isOpen: false,
            selectedItems
        });
        this.props.onSelectionChange(selectedItems);
    }

    /**
     *
     * @returns {XML}
     */
    render() {
        const shouldFitContainer = this.props.shouldFitContainer || false;
        const shouldFocus = this.props.shouldFocus || false;
        const isDisabled = this.props.isDisabled || false;
        const placeholder = this.props.placeholder || '';
        const noMatchesFound = this.props.noMatchesFound || '';
        const onSelectionChange = this.props.onSelectionChange || null;
        const resourceClient = this.props.resourceClient || {
            makeQuery: () => Promise.resolve([]),
            parseResults: results => results
        };
        const defaultValue = this.props.defaultValue || [];

        return (
            <div>
                <StatelessMultiSelect
                    isOpen = { this.state.isOpen }
                    filterValue = { this.state.filterValue }
                    items = { this.state.items }
                    selectedItems = { this.state.selectedItems }
                    placeholder = { this.props.placeholder }
                    noMatchesFound = { this.props.noMatchesFound }
                    shouldFitContainer = { this.props.shouldFitContainer }
                    shouldFocus = { this.props.shouldFocus }
                    isDisabled = { this.props.isDisabled }
                    onFilterChange = { this._onFilterChange }
                    onSelected = { this._onSelectionChange }
                    onRemoved = { this._onSelectionChange } />
                { this.renderLoadingIndicator() }
                { this.renderError() }
            </div>
        );
    }

    /**
     *
     * @returns {*}
     */
    renderLoadingIndicator() {
        if (!(this.state.loading
            && !this.state.items.length
            && this.state.filterValue.length)) {
            return null;
        }
        const content
            = <div className = "autocomplete-loading">
                <Spinner size = 'large' isCompleting = { false } />
            </div>

        ;


        return (
            <AKInlineDialog
                isOpen = { true }
                content = { content } />
        );
    }

    /**
     *
     * @returns {*}
     */
    renderError() {
        if (!this.state.error) {
            return null;
        }
        const content
            = <div className = "autocomplete-error">
                <InlineDialogFailure
                    retry = { () => this.sendQuery(this.state.filterValue) } />
            </div>

        ;


        return (
            <AKInlineDialog
                isOpen = { true }
                content = { content } />
        );
    }

}

export default MultiSelectAutocomplete;
