import React, { Component } from 'react';

import { translate } from '../../base/i18n';

declare var AJS: Object;

/**
 * Implements a React Component for the reload timer. Starts counter from
 * props.start, adds props.step to the current value on every props.interval
 * seconds until the current value reaches props.end. Also displays progress
 * bar.
 */
class ReloadTimer extends Component {
    /**
     * ReloadTimer component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The end of the timer. When this.state.current reaches this value the
         * timer will stop and call onFinish function.
         *
         * @public
         * @type {number}
         */
        end: React.PropTypes.number,

        /**
         * The interval in sec for adding this.state.step to this.state.current.
         *
         * @public
         * @type {number}
         */
        interval: React.PropTypes.number,

        /**
         * The function that will be executed when timer finish (when
         * this.state.current === this.props.end)
         */
        onFinish: React.PropTypes.func,

        /**
         * The start of the timer. The initial value for this.state.current.
         *
         * @public
         * @type {number}
         */
        start: React.PropTypes.number,

        /**
         * The value which will be added to this.state.current on every step.
         *
         * @public
         * @type {number}
         */
        step: React.PropTypes.number,

        /**
         * The function to translate human-readable text.
         *
         * @public
         * @type {Function}
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new ReloadTimer instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Current value(time) of the timer.
             *
             * @type {number}
             */
            current: this.props.start,

            /**
             * The absolute value of the time from the start of the timer until
             * the end of the timer.
             *
             * @type {number}
             */
            time: Math.abs(this.props.end - this.props.start)
        };
    }

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     * @protected
     */
    componentDidMount() {
        AJS.progressBars.update('#reloadProgressBar', 0);

        const intervalId
            = setInterval(
                () => {
                    if (this.state.current === this.props.end) {
                        clearInterval(intervalId);
                        this.props.onFinish();
                    } else {
                        this.setState((prevState, props) => {
                            return {
                                current: prevState.current + props.step
                            };
                        });
                    }
                },
                Math.abs(this.props.interval) * 1000);
    }

    /**
     * React Component method that executes once component is updated.
     *
     * @inheritdoc
     * @returns {void}
     * @protected
     */
    componentDidUpdate() {
        AJS.progressBars.update(
            '#reloadProgressBar',
            Math.abs(this.state.current - this.props.start) / this.state.time);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     * @public
     */
    render() {
        const { t } = this.props;

        return (
            <div>
                <div
                    className = 'aui-progress-indicator'
                    id = 'reloadProgressBar'>
                    <span className = 'aui-progress-indicator-value' />
                </div>
                <span className = 'reload_overlay_text'>
                    {
                        this.state.current
                    }
                    <span>
                        { t('dialog.conferenceReloadTimeLeft') }
                    </span>
                </span>
            </div>
        );
    }
}

export default translate(ReloadTimer);
