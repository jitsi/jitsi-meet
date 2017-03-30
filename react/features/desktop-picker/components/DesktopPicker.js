/* global config */

import Tabs from '@atlaskit/tabs';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import {
    resetDesktopSources,
    obtainDesktopSources
} from '../actions';
import DesktopPickerPane from './DesktopPickerPane';

const updateInterval = 1000;
const thumbnailSize = {
    height: 300,
    width: 300
};
const tabConfigurations = [
    {
        label: 'dialog.yourEntireScreen',
        type: 'screen',
        isDefault: true
    },
    {
        label: 'dialog.applicationWindow',
        type: 'window'
    }
];

const validTypes = tabConfigurations.map(configuration => configuration.type);
const configuredTypes = config.desktopSharingChromeSources || [];

const tabsToPopulate = tabConfigurations.filter(configuration =>
    configuredTypes.includes(configuration.type)
    && validTypes.includes(configuration.type)
);
const typesToFetch = tabsToPopulate.map(configuration => configuration.type);

/**
 * React component for DesktopPicker.
 *
 * @extends Component
 */
class DesktopPicker extends Component {
    /**
     * DesktopPicker component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Used to request DesktopCapturerSources.
         */
        dispatch: React.PropTypes.func,

        /**
         * The callback to be invoked when the component is closed or
         * when a DesktopCapturerSource has been chosen.
         */
        onSourceChoose: React.PropTypes.func,

        /**
         * An object with arrays of DesktopCapturerSources. The key
         * should be the source type.
         */
        sources: React.PropTypes.object,

        /**
         * Used to obtain translations.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new DesktopPicker instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            selectedSourceId: ''
        };

        this._poller = null;
        this._onCloseModal = this._onCloseModal.bind(this);
        this._onPreviewClick = this._onPreviewClick.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._updateSources = this._updateSources.bind(this);
    }

    /**
     * Perform an immediate update request for DesktopCapturerSources and
     * begin requesting updates at an interval.
     *
     * @inheritdoc
     */
    componentWillMount() {
        this._updateSources();
        this._startPolling();
    }

    /**
     * Clean up component and DesktopCapturerSource store state.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._stopPolling();
        this.props.dispatch(resetDesktopSources());
    }

    /**
     * Notifies this mounted React Component that it will receive new props.
     * Sets a default selected source if one is not already set.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only React Component props that this
     * instance will receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        if (!this.state.selectedSourceId
            && nextProps.sources.screen.length) {
            this.setState({ selectedSourceId: nextProps.sources.screen[0].id });
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Dialog
                isModal = { false }
                okTitleKey = 'dialog.Share'
                onCancel = { this._onCloseModal }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.shareYourScreen'
                width = 'medium' >
                { this._renderTabs() }
            </Dialog>);
    }

    /**
     * Dispatches an action to get currently available DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _updateSources() {
        this.props.dispatch(obtainDesktopSources(
            typesToFetch,
            {
                thumbnailSize
            }
        ));
    }

    /**
     * Create an interval to update knwon available DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _startPolling() {
        this._stopPolling();
        this._poller = window.setInterval(this._updateSources,
            updateInterval);
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
     * Sets the currently selected DesktopCapturerSource.
     *
     * @param {string} id - The id of DesktopCapturerSource.
     * @returns {void}
     */
    _onPreviewClick(id) {
        this.setState({ selectedSourceId: id });
    }

    /**
     * Request to close the modal and execute callbacks
     * with the selected source id.
     *
     * @returns {void}
     */
    _onSubmit() {
        this._onCloseModal(this.state.selectedSourceId);
    }

    /**
     * Dispatches an action to hide the DesktopPicker and invokes
     * the passed in callback with a selectedSourceId, if any.
     *
     * @param {string} id - The id of the DesktopCapturerSource to pass into
     * the onSourceChoose callback.
     * @returns {void}
     */
    _onCloseModal(id = '') {
        this.props.onSourceChoose(id);
        this.props.dispatch(hideDialog());
    }

    /**
     * Configures and renders the tabs for display.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderTabs() {
        const tabs = tabsToPopulate.map(tabConfig => {
            const type = tabConfig.type;

            return {
                label: this.props.t(tabConfig.label),
                defaultSelected: tabConfig.isDefault,
                content: <DesktopPickerPane
                    key = { type }
                    onClick = { this._onPreviewClick }
                    onDoubleClick = { this._onCloseModal }
                    selectedSourceId = { this.state.selectedSourceId }
                    sources = { this.props.sources[type] || [] }
                    type = { type } />
            };
        });

        return <Tabs tabs = { tabs } />;
    }
}

/**
 * Maps (parts of) the Redux state to the associated DesktopPicker's props.
 *
 * @param {Object} state - Redux state.
 * @protected
 * @returns {{
 *     sources: Object
 * }}
 */
function mapStateToProps(state) {
    return {
        sources: state['features/desktop-picker/sources']
    };
}

export default translate(connect(mapStateToProps)(DesktopPicker));
