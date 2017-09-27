import Tabs from '@atlaskit/tabs';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import { obtainDesktopSources, resetDesktopSources } from '../actions';
import DesktopPickerPane from './DesktopPickerPane';

const THUMBNAIL_SIZE = {
    height: 300,
    width: 300
};
const UPDATE_INTERVAL = 1000;

const TAB_CONFIGURATIONS = [
    {
        /**
         * The indicator which determines whether this tab configuration is
         * selected by default.
         *
         * @type {boolean}
         */
        defaultSelected: true,
        label: 'dialog.yourEntireScreen',
        type: 'screen'
    },
    {
        label: 'dialog.applicationWindow',
        type: 'window'
    }
];
const VALID_TYPES = TAB_CONFIGURATIONS.map(c => c.type);

/**
 * React component for DesktopPicker.
 *
 * @extends Component
 */
class DesktopPicker extends Component {
    /**
     * Default values for DesktopPicker component's properties.
     *
     * @static
     */
    static defaultProps = {
        options: {}
    };

    /**
     * DesktopPicker component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Used to request DesktopCapturerSources.
         */
        dispatch: PropTypes.func,

        /**
         * The callback to be invoked when the component is closed or when
         * a DesktopCapturerSource has been chosen.
         */
        onSourceChoose: PropTypes.func,

        /**
         * An object with options related to desktop sharing.
         */
        options: PropTypes.object,

        /**
         * An object with arrays of DesktopCapturerSources. The key should be
         * the source type.
         */
        sources: PropTypes.object,

        /**
         * Used to obtain translations.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new DesktopPicker instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            selectedSource: {},
            tabsToPopulate: [],
            typesToFetch: []
        };

        this._poller = null;
        this._onCloseModal = this._onCloseModal.bind(this);
        this._onPreviewClick = this._onPreviewClick.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._updateSources = this._updateSources.bind(this);
    }

    /**
     * Perform an immediate update request for DesktopCapturerSources and begin
     * requesting updates at an interval.
     *
     * @inheritdoc
     */
    componentWillMount() {
        const { desktopSharingSources } = this.props.options;

        this._onSourceTypesConfigChanged(
            desktopSharingSources);
        this._updateSources();
        this._startPolling();
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
        if (!this.state.selectedSource.id
                && nextProps.sources.screen.length) {
            this.setState({
                selectedSource: {
                    id: nextProps.sources.screen[0].id,
                    type: 'screen'
                }
            });
        }

        const { desktopSharingSources } = this.props.options;

        this._onSourceTypesConfigChanged(
            desktopSharingSources);
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
            </Dialog>
        );
    }

    /**
     * Dispatches an action to hide the DesktopPicker and invokes the passed in
     * callback with a selectedSource, if any.
     *
     * @param {string} id - The id of the DesktopCapturerSource to pass into the
     * onSourceChoose callback.
     * @param {string} type - The type of the DesktopCapturerSource to pass into
     * the onSourceChoose callback.
     * @returns {void}
     */
    _onCloseModal(id = '', type) {
        this.props.onSourceChoose(id, type);
        this.props.dispatch(hideDialog());
    }

    /**
     * Sets the currently selected DesktopCapturerSource.
     *
     * @param {string} id - The id of DesktopCapturerSource.
     * @param {string} type - The type of DesktopCapturerSource.
     * @returns {void}
     */
    _onPreviewClick(id, type) {
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
        const { id, type } = this.state.selectedSource;

        this._onCloseModal(id, type);
    }

    /**
     * Configures and renders the tabs for display.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTabs() {
        const { selectedSource } = this.state;
        const { sources, t } = this.props;
        const tabs
            = this.state.tabsToPopulate.map(
                ({ defaultSelected, label, type }) => {
                    return {
                        content: <DesktopPickerPane
                            key = { type }
                            onClick = { this._onPreviewClick }
                            onDoubleClick = { this._onCloseModal }
                            selectedSourceId = { selectedSource.id }
                            sources = { sources[type] || [] }
                            type = { type } />,
                        defaultSelected,
                        label: t(label)
                    };
                });

        return <Tabs tabs = { tabs } />;
    }

    /**
     * Create an interval to update knwon available DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _startPolling() {
        this._stopPolling();
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
     * Handles changing of allowed desktop sharing source types.
     *
     * @param {Array<string>} desktopSharingSourceTypes - The types that will be
     * fetched and displayed.
     * @returns {void}
     */
    _onSourceTypesConfigChanged(desktopSharingSourceTypes = []) {
        const tabsToPopulate = TAB_CONFIGURATIONS.filter(
            c => desktopSharingSourceTypes.includes(c.type)
                && VALID_TYPES.includes(c.type)
        );

        this.setState({
            tabsToPopulate,
            typesToFetch: tabsToPopulate.map(c => c.type)
        });
    }

    /**
     * Dispatches an action to get currently available DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _updateSources() {
        this.props.dispatch(obtainDesktopSources(
            this.state.typesToFetch,
            {
                THUMBNAIL_SIZE
            }
        ));
    }
}

/**
 * Maps (parts of) the Redux state to the associated DesktopPicker's props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     sources: Object
 * }}
 */
function _mapStateToProps(state) {
    return {
        sources: state['features/desktop-picker']
    };
}

export default translate(connect(_mapStateToProps)(DesktopPicker));
