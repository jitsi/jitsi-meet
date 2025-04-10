import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../app/types';
import { hideDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { DesktopSharingSourceType } from '../../base/tracks/types';
import Dialog from '../../base/ui/components/web/Dialog';
import Tabs from '../../base/ui/components/web/Tabs';
import { THUMBNAIL_SIZE } from '../constants';
import { obtainDesktopSources } from '../functions';
import logger from '../logger';

import DesktopPickerPane from './DesktopPickerPane';

/**
 * The sources polling interval in ms.
 *
 * @type {int}
 */
const UPDATE_INTERVAL = 2000;

/**
 * The default selected tab.
 *
 * @type {string}
 */
const DEFAULT_TAB_TYPE = 'screen';

const TAB_LABELS = {
    screen: 'dialog.yourEntireScreen',
    window: 'dialog.applicationWindow'
};

const VALID_TYPES = Object.keys(TAB_LABELS) as DesktopSharingSourceType[];

/**
 * The type of the React {@code Component} props of {@link DesktopPicker}.
 */
interface IProps extends WithTranslation {

    /**
     * An array with desktop sharing sources to be displayed.
     */
    desktopSharingSources: Array<DesktopSharingSourceType>;

    /**
     * Used to request DesktopCapturerSources.
     */
    dispatch: IStore['dispatch'];

    /**
     * The callback to be invoked when the component is closed or when a
     * DesktopCapturerSource has been chosen.
     */
    onSourceChoose: Function;
}

/**
 * The type of the React {@code Component} state of {@link DesktopPicker}.
 */
interface IState {

    /**
     * The state of the audio screen share checkbox.
     */
    screenShareAudio: boolean;

    /**
     * The currently highlighted DesktopCapturerSource.
     */
    selectedSource: any;

    /**
     * The desktop source type currently being displayed.
     */
    selectedTab: string;

    /**
     * An object containing all the DesktopCapturerSources.
     */
    sources: any;

    /**
     * The desktop source types to fetch previews for.
     */
    types: Array<DesktopSharingSourceType>;
}


/**
 * React component for DesktopPicker.
 *
 * @augments Component
 */
class DesktopPicker extends PureComponent<IProps, IState> {
    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps) {
        return {
            types: DesktopPicker._getValidTypes(props.desktopSharingSources)
        };
    }

    /**
     * Extracts only the valid types from the passed {@code types}.
     *
     * @param {Array<string>} types - The types to filter.
     * @private
     * @returns {Array<string>} The filtered types.
     */
    static _getValidTypes(types: DesktopSharingSourceType[] = []) {
        return types.filter(
            type => VALID_TYPES.includes(type));
    }

    _poller: any = null;

    override state: IState = {
        screenShareAudio: false,
        selectedSource: {},
        selectedTab: DEFAULT_TAB_TYPE,
        sources: {},
        types: []
    };

    /**
     * Initializes a new DesktopPicker instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCloseModal = this._onCloseModal.bind(this);
        this._onPreviewClick = this._onPreviewClick.bind(this);
        this._onShareAudioChecked = this._onShareAudioChecked.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onTabSelected = this._onTabSelected.bind(this);
        this._updateSources = this._updateSources.bind(this);

        this.state.types
            = DesktopPicker._getValidTypes(this.props.desktopSharingSources);
    }

    /**
     * Starts polling.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        this._startPolling();
    }

    /**
     * Clean up component and DesktopCapturerSource store state.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this._stopPolling();
    }


    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const { selectedTab, selectedSource, sources, types } = this.state;

        return (
            <Dialog
                ok = {{
                    disabled: Boolean(!this.state.selectedSource.id),
                    translationKey: 'dialog.Share'
                }}
                onCancel = { this._onCloseModal }
                onSubmit = { this._onSubmit }
                size = 'large'
                titleKey = 'dialog.shareYourScreen'>
                { this._renderTabs() }
                {types.map(type => (
                    <div
                        aria-labelledby = { `${type}-button` }
                        className = { selectedTab === type ? undefined : 'hide' }
                        id = { `${type}-panel` }
                        key = { type }
                        role = 'tabpanel'
                        tabIndex = { 0 }>
                        {selectedTab === type && (
                            <DesktopPickerPane
                                key = { selectedTab }
                                onClick = { this._onPreviewClick }
                                onDoubleClick = { this._onSubmit }
                                onShareAudioChecked = { this._onShareAudioChecked }
                                selectedSourceId = { selectedSource.id }
                                sources = { sources[selectedTab as keyof typeof sources] }
                                type = { selectedTab } />
                        )}
                    </div>
                ))}

            </Dialog>
        );
    }

    /**
     * Computes the selected source.
     *
     * @param {Object} sources - The available sources.
     * @param {string} selectedTab - The selected tab.
     * @returns {Object} The selectedSource value.
     */
    _getSelectedSource(sources: any = {}, selectedTab?: string) {
        const { selectedSource } = this.state;

        const currentSelectedTab = selectedTab ?? this.state.selectedTab;

        /**
         * If there are no sources for this type (or no sources for any type)
         * we can't select anything.
         */
        if (!Array.isArray(sources[currentSelectedTab as keyof typeof sources])
            || sources[currentSelectedTab as keyof typeof sources].length <= 0) {
            return {};
        }

        /**
         * Select the first available source for this type in the following
         * scenarios:
         * 1) Nothing is yet selected.
         * 2) Tab change.
         * 3) The selected source is no longer available.
         */
        if (!selectedSource // scenario 1)
                || selectedSource.type !== currentSelectedTab // scenario 2)
                || !sources[currentSelectedTab].some( // scenario 3)
                        (source: any) => source.id === selectedSource.id)) {
            return {
                id: sources[currentSelectedTab][0].id,
                type: currentSelectedTab
            };
        }

        /**
         * For all other scenarios don't change the selection.
         */
        return selectedSource;
    }

    /**
     * Dispatches an action to hide the DesktopPicker and invokes the passed in
     * callback with a selectedSource, if any.
     *
     * @param {string} [id] - The id of the DesktopCapturerSource to pass into
     * the onSourceChoose callback.
     * @param {string} type - The type of the DesktopCapturerSource to pass into
     * the onSourceChoose callback.
     * @param {boolean} screenShareAudio - Whether or not to add system audio to
     * screen sharing session.
     * @returns {void}
     */
    _onCloseModal(id = '', type?: string, screenShareAudio = false) {
        // Find the entire source object from the id. We need the name in order
        // to get getDisplayMedia working in Electron.
        const { sources } = this.state;

        // @ts-ignore
        const source = (sources?.screen ?? []).concat(sources?.window ?? []).find(s => s.id === id);

        this.props.onSourceChoose(id, type, screenShareAudio, source);
        this.props.dispatch(hideDialog());
    }

    /**
     * Sets the currently selected DesktopCapturerSource.
     *
     * @param {string} id - The id of DesktopCapturerSource.
     * @param {string} type - The type of DesktopCapturerSource.
     * @returns {void}
     */
    _onPreviewClick(id: string, type: string) {
        this.setState({
            selectedSource: {
                id,
                type
            }
        });
    }

    /**
     * Request to close the modal and execute callbacks with the selected source
     * id.
     *
     * @returns {void}
     */
    _onSubmit() {
        const { selectedSource: { id, type }, screenShareAudio } = this.state;

        this._onCloseModal(id, type, screenShareAudio);
    }

    /**
     * Stores the selected tab and updates the selected source via
     * {@code _getSelectedSource}.
     *
     * @param {string} id - The id of the newly selected tab.
     * @returns {void}
     */
    _onTabSelected(id: string) {
        const { sources } = this.state;

        // When we change tabs also reset the screenShareAudio state so we don't
        // use the option from one tab when sharing from another.
        this.setState({
            screenShareAudio: false,
            selectedSource: this._getSelectedSource(sources, id),

            // select type `window` or `screen` from id
            selectedTab: id
        });
    }

    /**
     * Set the screenSharingAudio state indicating whether or not to also share
     * system audio.
     *
     * @param {boolean} checked - Share audio or not.
     * @returns {void}
     */
    _onShareAudioChecked(checked: boolean) {
        this.setState({ screenShareAudio: checked });
    }

    /**
     * Configures and renders the tabs for display.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTabs() {
        const { types } = this.state;
        const { t } = this.props;
        const tabs
            = types.map(
                type => {
                    return {
                        accessibilityLabel: t(TAB_LABELS[type]),
                        id: `${type}`,
                        controlsId: `${type}-panel`,
                        label: t(TAB_LABELS[type])
                    };
                });

        return (
            <Tabs
                accessibilityLabel = { t('dialog.sharingTabs') }
                className = 'desktop-picker-tabs-container'
                onChange = { this._onTabSelected }
                selected = { `${this.state.selectedTab}` }
                tabs = { tabs } />
        );
    }

    /**
     * Create an interval to update known available DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _startPolling() {
        this._stopPolling();
        this._updateSources();
        this._poller = window.setInterval(this._updateSources, UPDATE_INTERVAL);
    }

    /**
     * Cancels the interval to update DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _stopPolling() {
        window.clearInterval(this._poller);
        this._poller = null;
    }

    /**
     * Obtains the desktop sources and updates state with them.
     *
     * @private
     * @returns {void}
     */
    _updateSources() {
        const { types } = this.state;
        const options = {
            types,
            thumbnailSize: THUMBNAIL_SIZE
        };


        if (types.length > 0) {
            obtainDesktopSources(options)
                .then((sources: any) => {
                    const selectedSource = this._getSelectedSource(sources);

                    this.setState({
                        selectedSource,
                        sources
                    });
                })
                .catch((error: any) => logger.log(error));
        }
    }
}

export default translate(connect()(DesktopPicker));
