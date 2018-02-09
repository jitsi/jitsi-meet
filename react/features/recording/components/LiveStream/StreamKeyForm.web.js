import ChevronDownIcon from '@atlaskit/icon/glyph/chevron-down';
import { DropdownMenuStateless } from '@atlaskit/dropdown-menu';
import { FieldTextStateless } from '@atlaskit/field-text';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * A React Component for entering a key for starting a YouTube live stream.
 * It also features a dropdown to select a YouTube broadcast if any broadcasts
 * are passed in.
 *
 * @extends Component
 */
class StreamKeyForm extends Component {
    /**
     * Default values for {@code StreamKeyForm} component's properties.
     *
     * @static
     */
    static defaultProps = {
        broadcasts: []
    };

    /**
     * {@code StreamKeyForm} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Broadcasts available for selection.
         */
        broadcasts: PropTypes.array,

        /**
         * The URL to the page with more information for manually finding the
         * stream key for a YouTube broadcast.
         */
        helpURL: PropTypes.string,

        /**
         * Callback invoked when the entered stream key has changed.
         */
        onChange: PropTypes.func,

        /**
         * Callback invoked when one of the passed in broadcasts is clicked to
         * indicate its stream key should be used.
         */
        onStreamSelected: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * The stream key value to display as having been entered so far.
         */
        value: PropTypes.string
    };

    /**
     * The initial state of a {@code StreamKeyForm} instance.
     *
     * @type {{
     *     isDropdownOpen: boolean
     * }}
     */
    state = {
        isDropdownOpen: false
    };

    /**
     * Initializes a new {@code StreamKeyForm} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyForm} instance with.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onDropdownOpenChange = this._onDropdownOpenChange.bind(this);
        this._onInputChange = this._onInputChange.bind(this);
        this._onOpenHelp = this._onOpenHelp.bind(this);
        this._onSelect = this._onSelect.bind(this);
    }

    /**
     * Closes the dropdown menu if stream key has been updated.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        if (this.props.value !== nextProps.value) {
            this.setState({ isDropdownOpen: false });
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { broadcasts, t } = this.props;
        const dropdownItems = this._formatBroadcasts(broadcasts);
        const rootClassNames = `stream-key-form ${dropdownItems.length
            ? 'with-dropdown' : 'without-dropdown'}`;

        return (
            <div className = { rootClassNames }>
                <DropdownMenuStateless
                    isOpen = { this.state.isDropdownOpen }
                    items = { [ { items: dropdownItems } ] }
                    onItemActivated = { this._onSelect }
                    onOpenChange = { this._onDropdownOpenChange }
                    shouldFitContainer = { true }>
                    <div className = 'stream-key-form-trigger'>
                        <FieldTextStateless
                            autoFocus = { true }
                            compact = { true }
                            label = { t('dialog.streamKey') }
                            name = 'streamId'
                            okDisabled = { !this.props.value }
                            onChange = { this._onInputChange }
                            placeholder = { t('liveStreaming.enterStreamKey') }
                            shouldFitContainer = { true }
                            type = 'text'
                            value = { this.props.value } />
                        { dropdownItems.length
                            ? <span className = 'broadcasts-available'>
                                <ChevronDownIcon
                                    label = 'expand'
                                    size = 'large' />
                            </span>
                            : null }
                    </div>
                </DropdownMenuStateless>
                { this.props.helpURL
                    ? <div className = 'form-footer'>
                        <a
                            className = 'helper-link'
                            onClick = { this._onOpenHelp }>
                            { t('liveStreaming.streamIdHelp') }
                        </a>
                    </div>
                    : null
                }
            </div>
        );
    }

    /**
     * Transforms the passed in broadcasts into an array of objects that can
     * be parsed by {@code DropdownMenuStateless}.
     *
     * @param {Array<Object>} broadcasts - The YouTube broadcasts to display.
     * @private
     * @returns {Array<Object>}
     */
    _formatBroadcasts(broadcasts) {
        return broadcasts.map(broadcast => {
            return {
                content: broadcast.title,
                value: broadcast
            };
        });
    }

    /**
     * Callback invoked when the value of the input field has updated through
     * user input.
     *
     * @param {Object} event - DOM Event for value change.
     * @private
     * @returns {void}
     */
    _onInputChange(event) {
        this.props.onChange(event);
    }

    /**
     * Sets the dropdown to be displayed or not based on the passed in event.
     * If no broadcasts are present, then the dropdown will never display.
     *
     * @param {Object} dropdownEvent - The event passed from
     * {@code DropdownMenuStateless} indicating if the dropdown should be open
     * or closed.
     * @private
     * @returns {void}
     */
    _onDropdownOpenChange(dropdownEvent) {
        this.setState({
            isDropdownOpen: Boolean(this.props.broadcasts.length)
                && dropdownEvent.isOpen
        });
    }

    /**
     * Opens a new tab with information on how to manually locate a YouTube
     * broadcast stream key.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelp() {
        window.open(this.props.helpURL, 'noopener');
    }

    /**
     * Callback invoked when an item has been clicked in the dropdown menu.
     *
     * @param {Object} selection - Event from choosing a dropdown option.
     * @private
     * @returns {void}
     */
    _onSelect(selection) {
        const { boundStreamID } = selection.item.value;

        this.props.onStreamSelected(boundStreamID);
    }
}

export default translate(StreamKeyForm);
