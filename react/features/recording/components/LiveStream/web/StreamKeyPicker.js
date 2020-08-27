/* @flow */

import {
    DropdownItem,
    DropdownItemGroup,
    DropdownMenuStateless
} from '@atlaskit/dropdown-menu';
import React, { PureComponent } from 'react';

import { translate } from '../../../../base/i18n';
import { YOUTUBE_LIVE_DASHBOARD_URL } from '../constants';

/**
 * The type of the React {@code Component} props of {@link StreamKeyPicker}.
 */
type Props = {

    /**
     * Broadcasts available for selection. Each broadcast item should be an
     * object with a title for display in the dropdown and a boundStreamID to
     * return in the {@link onBroadcastSelected} callback.
     */
    broadcasts: Array<Object>,

    /**
     * Callback invoked when an item in the dropdown is selected. The selected
     * broadcast's boundStreamID will be passed back.
     */
    onBroadcastSelected: Function,

    /**
     * The boundStreamID of the broadcast that should display as selected in the
     * dropdown.
     */
    selectedBoundStreamID: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link StreamKeyPicker}.
 */
type State = {

    /**
     * Whether or not to display the dropdown menu to pick a YouTube broadcast.
     */
    isDropdownOpen: boolean
};

/**
 * A dropdown to select a YouTube broadcast.
 *
 * @extends Component
 */
class StreamKeyPicker extends PureComponent<Props, State> {
    /**
     * Default values for {@code StreamKeyForm} component's properties.
     *
     * @static
     */
    static defaultProps = {
        broadcasts: []
    };

    /**
     * The initial state of a {@code StreamKeyForm} instance.
     */
    state = {
        isDropdownOpen: false
    };

    /**
     * Initializes a new {@code StreamKeyPicker} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyPicker} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onDropdownOpenChange = this._onDropdownOpenChange.bind(this);
        this._onSelect = this._onSelect.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { broadcasts, selectedBoundStreamID, t } = this.props;

        if (!broadcasts.length) {
            return (
                <a
                    className = 'warning-text'
                    href = { YOUTUBE_LIVE_DASHBOARD_URL }
                    rel = 'noopener noreferrer'
                    target = '_blank'>
                    { t('liveStreaming.getStreamKeyManually') }
                </a>
            );
        }

        const dropdownItems
            = broadcasts.map(broadcast => (
                <DropdownItem
                    key = { broadcast.boundStreamID }

                    // eslint-disable-next-line react/jsx-no-bind
                    onClick = { () => this._onSelect(broadcast.boundStreamID) }>
                    { broadcast.title }
                </DropdownItem>));
        const selected
            = this.props.broadcasts.find(
                broadcast => broadcast.boundStreamID === selectedBoundStreamID);
        const triggerText
            = (selected && selected.title) || t('liveStreaming.choose');

        return (
            <div className = 'broadcast-dropdown'>
                <DropdownMenuStateless
                    isOpen = { this.state.isDropdownOpen }
                    onItemActivated = { this._onSelect }
                    onOpenChange = { this._onDropdownOpenChange }
                    shouldFitContainer = { true }
                    trigger = { triggerText }
                    triggerButtonProps = {{
                        className: 'broadcast-dropdown-trigger',
                        shouldFitContainer: true
                    }}
                    triggerType = 'button'>
                    <DropdownItemGroup>
                        { dropdownItems }
                    </DropdownItemGroup>
                </DropdownMenuStateless>
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

    _onDropdownOpenChange: (Object) => void;

    /**
     * Sets the dropdown to be displayed or not based on the passed in event.
     *
     * @param {Object} dropdownEvent - The event passed from
     * {@code DropdownMenuStateless} indicating if the dropdown should be open
     * or closed.
     * @private
     * @returns {void}
     */
    _onDropdownOpenChange(dropdownEvent) {
        this.setState({
            isDropdownOpen: dropdownEvent.isOpen
        });
    }

    _onSelect: (string) => void;

    /**
     * Callback invoked when an item has been clicked in the dropdown menu.
     *
     * @param {Object} boundStreamID - The bound stream ID for the selected
     * broadcast.
     * @returns {void}
     */
    _onSelect(boundStreamID) {
        this.props.onBroadcastSelected(boundStreamID);
    }
}

export default translate(StreamKeyPicker);
