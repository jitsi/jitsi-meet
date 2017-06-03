/* global config */

import Tabs from '@atlaskit/tabs';
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
const CONFIGURED_TYPES = config.desktopSharingChromeSources || [];
const VALID_TYPES = TAB_CONFIGURATIONS.map(c => c.type);
const TABS_TO_POPULATE
    = TAB_CONFIGURATIONS.filter(
        c => CONFIGURED_TYPES.includes(c.type) && VALID_TYPES.includes(c.type));
const TYPES_TO_FETCH = TABS_TO_POPULATE.map(c => c.type);

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
         * The callback to be invoked when the component is closed or when
         * a DesktopCapturerSource has been chosen.
         */
        onSourceChoose: React.PropTypes.func,

        /**
         * An object with arrays of DesktopCapturerSources. The key should be
         * the source type.
         */
        sources: React.PropTypes.object,

        /**
         * Used to obtain translations.
         */
        t: React.PropTypes.func
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
            selectedSourceId: ''
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
        if (!this.state.selectedSourceId
                && nextProps.sources.screen.length) {
            this.setState({
                selectedSourceId: nextProps.sources.screen[0].id
            });
        }
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
     * callback with a selectedSourceId, if any.
     *
     * @param {string} id - The id of the DesktopCapturerSource to pass into the
     * onSourceChoose callback.
     * @returns {void}
     */
    _onCloseModal(id = '') {
        this.props.onSourceChoose(id);
        this.props.dispatch(hideDialog());
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
     * Request to close the modal and execute callbacks with the selected source
     * id.
     *
     * @returns {void}
     */
    _onSubmit() {
        this._onCloseModal(this.state.selectedSourceId);
    }

    /**
     * Configures and renders the tabs for display.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTabs() {
        const { selectedSourceId } = this.state;
        const { sources, t } = this.props;
        const tabs
            = TABS_TO_POPULATE.map(({ defaultSelected, label, type }) => {
                return {
                    content: <DesktopPickerPane
                        key = { type }
                        onClick = { this._onPreviewClick }
                        onDoubleClick = { this._onCloseModal }
                        selectedSourceId = { selectedSourceId }
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
     * Dispatches an action to get currently available DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _updateSources() {
        this.props.dispatch(obtainDesktopSources(
            TYPES_TO_FETCH,
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
