import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../../base/i18n/functions';
import Select from '../../../../base/ui/components/web/Select';
import { YOUTUBE_LIVE_DASHBOARD_URL } from '../constants';

/**
 * The type of the React {@code Component} props of {@link StreamKeyPicker}.
 */
interface IProps extends WithTranslation {

    /**
     * Broadcasts available for selection. Each broadcast item should be an
     * object with a title for display in the dropdown and a boundStreamID to
     * return in the {@link onBroadcastSelected} callback.
     */
    broadcasts: Array<{
        boundStreamID: string;
        title: string;
    }>;

    /**
     * Callback invoked when an item in the dropdown is selected. The selected
     * broadcast's boundStreamID will be passed back.
     */
    onBroadcastSelected: Function;

    /**
     * The boundStreamID of the broadcast that should display as selected in the
     * dropdown.
     */
    selectedBoundStreamID?: string;
}

/**
 * A dropdown to select a YouTube broadcast.
 *
 * @augments Component
 */
class StreamKeyPicker extends PureComponent<IProps> {
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
    override state = {
        isDropdownOpen: false
    };

    /**
     * Initializes a new {@code StreamKeyPicker} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyPicker} instance with.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSelect = this._onSelect.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
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
            = broadcasts.map(broadcast => {
                return {
                    value: broadcast.boundStreamID,
                    label: broadcast.title
                };
            });

        return (
            <div className = 'broadcast-dropdown dropdown-menu'>
                <Select
                    id = 'streamkeypicker-select'
                    label = { t('liveStreaming.choose') }
                    onChange = { this._onSelect }
                    options = { dropdownItems }
                    value = { selectedBoundStreamID ?? '' } />
            </div>
        );
    }

    /**
     * Callback invoked when an item has been clicked in the dropdown menu.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const streamId = e.target.value;

        this.props.onBroadcastSelected(streamId);
    }
}

export default translate(StreamKeyPicker);
