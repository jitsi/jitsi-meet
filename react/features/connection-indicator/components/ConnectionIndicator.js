import React, { Component } from 'react';

import JitsiPopover from '../../../../modules/UI/util/JitsiPopover';

import { JitsiParticipantConnectionStatus } from '../../base/lib-jitsi-meet';
import { ConnectionStatsTable } from '../../connection-stats';

declare var $: Object;
declare var interfaceConfig: Object;

// Converts the percent for connection quality into a string recognized for CSS.
const QUALITY_TO_WIDTH = [

    // Full (5 bars)
    {
        percent: 80,
        width: '100%'
    },

    // 4 bars
    {
        percent: 60,
        width: '80%'
    },

    // 3 bars
    {
        percent: 40,
        width: '55%'
    },

    // 2 bars
    {
        percent: 20,
        width: '40%'
    },

    // 1 bar
    {
        percent: 0,
        width: '20%'
    }

    // Note: we never show 0 bars.
];

/**
 * Implements a React {@link Component} which displays the current connection
 * quality percentage and has a popover to show more detailed connection stats.
 *
 * @extends {Component}
 */
class ConnectionIndicator extends Component {
    /**
     * {@code ConnectionIndicator} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the displays stats are for local video.
         */
        isLocalVideo: React.PropTypes.bool,

        /**
         * The callback to invoke when the hover state over the popover changes.
         */
        onHover: React.PropTypes.func,

        /**
         * Whether or not the popover should display a link that can toggle
         * a more detailed view of the stats.
         */
        showMoreLink: React.PropTypes.bool,

        /**
         * An object that contains statistics related to connection quality.
         *
         * {
         *     bandwidth: Object,
         *     bitrate: Object,
         *     connectionStatus: String,
         *     framerate: Object,
         *     packetLoss: Object,
         *     percent: Number,
         *     resolution: Object,
         *     transport:  Array
         * }
         */
        stats: React.PropTypes.object,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to topmost DOM/HTML element backing the React
         * {@code Component}. Accessed directly for associating an element as
         * the trigger for a popover.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._rootElement = null;

        this.state = {
            /**
             * Whether or not the popover content should display additional
             * statistics.
             *
             * @type {boolean}
             */
            showMoreStats: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onToggleShowMore = this._onToggleShowMore.bind(this);
        this._setRootElement = this._setRootElement.bind(this);
    }

    /**
     * Creates a popover instance to display when the component is hovered.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        this.popover = new JitsiPopover($(this._rootElement), {
            content: this._renderStatisticsTable(),
            skin: 'black',
            position: interfaceConfig.VERTICAL_FILMSTRIP ? 'left' : 'top'
        });

        this.popover.addOnHoverPopover(this.props.onHover);
    }

    /**
     * Updates the contents of the popover. This is done manually because the
     * popover is not a React Component yet and so is not automatiucally aware
     * of changed data.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate() {
        this.popover.updateContent(this._renderStatisticsTable());
    }

    /**
     * Cleans up any popover instance that is linked to the component.
     *
     * @inheritdoc
     * returns {void}
     */
    componentWillUnmount() {
        this.popover.forceHide();
        this.popover.remove();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'connection-indicator indicator'
                ref = { this._setRootElement }>
                <div className = 'connection indicatoricon'>
                    { this._renderIcon() }
                </div>
            </div>
        );
    }

    /**
     * Callback to invoke when the show more link in the popover content is
     * clicked. Sets the state which will determine if the popover should show
     * additional statistics about the connection.
     *
     * @returns {void}
     */
    _onToggleShowMore() {
        this.setState({ showMoreStats: !this.state.showMoreStats });
    }

    /**
     * Creates a ReactElement for displaying an icon that represents the current
     * connection quality.
     *
     * @returns {ReactElement}
     */
    _renderIcon() {
        switch (this.props.stats.connectionStatus) {
        case JitsiParticipantConnectionStatus.INTERRUPTED:
            return (
                <span className = 'connection_lost'>
                    <i className = 'icon-connection-lost' />
                </span>
            );
        case JitsiParticipantConnectionStatus.INACTIVE:
            return (
                <span className = 'connection_ninja'>
                    <i className = 'icon-ninja' />
                </span>
            );
        default: {
            const { percent } = this.props.stats;
            const width = QUALITY_TO_WIDTH.find(x => percent >= x.percent);
            const iconWidth = width && width.width
                ? { width: width && width.width } : {};

            return [
                <span
                    className = 'connection_empty'
                    key = 'icon-empty'>
                    <i className = 'icon-connection' />
                </span>,
                <span
                    className = 'connection_full'
                    key = 'icon-full'
                    style = { iconWidth }>
                    <i className = 'icon-connection' />
                </span>
            ];
        }
        }
    }

    /**
     * Creates a {@code ConnectionStatisticsTable} instance.
     *
     * @returns {ReactElement}
     */
    _renderStatisticsTable() {
        const {
            bandwidth,
            bitrate,
            framerate,
            packetLoss,
            resolution,
            transport
        } = this.props.stats;

        return (
            <ConnectionStatsTable
                bandwidth = { bandwidth }
                bitrate = { bitrate }
                framerate = { framerate }
                isLocalVideo = { this.props.isLocalVideo }
                onShowMore = { this._onToggleShowMore }
                packetLoss = { packetLoss }
                resolution = { resolution }
                shouldShowMore = { this.state.showMoreStats }
                transport = { transport } />
        );
    }

    /**
     * Sets an internal reference to the component's root element.
     *
     * @param {Object} element - The highest DOM element in the component.
     * @private
     * @returns {void}
     */
    _setRootElement(element) {
        this._rootElement = element;
    }
}

export default ConnectionIndicator;
