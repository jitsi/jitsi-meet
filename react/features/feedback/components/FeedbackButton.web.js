/* @flow */

import Tooltip from '@atlaskit/tooltip';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';

import { openFeedbackDialog } from '../actions';

/**
 * Implements a Web/React Component which renders a feedback button.
 */
class FeedbackButton extends Component {
    _onClick: Function;

    static propTypes = {
        /**
         * The JitsiConference for which the feedback will be about.
         *
         * @type {JitsiConference}
         */
        _conference: PropTypes.object,

        dispatch: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * From which side of the button the tooltip should appear from.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Initializes a new FeedbackButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div id = 'feedbackButton'>
                <Tooltip
                    description = { this.props.t('welcomepage.sendFeedback') }
                    position = { this.props.tooltipPosition } >
                    <a
                        className = 'button icon-feedback'
                        onClick = { this._onClick } />
                </Tooltip>
            </div>
        );
    }

    /**
     * Dispatches an action to open a dialog requesting call feedback.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { _conference, dispatch } = this.props;

        dispatch(openFeedbackDialog(_conference));
    }
}

/**
 * Maps (parts of) the Redux state to the associated Conference's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * The JitsiConference for which the feedback will be about.
         *
         * @private
         * @type {JitsiConference}
         */
        _conference: state['features/base/conference'].conference
    };
}

export default translate(connect(_mapStateToProps)(FeedbackButton));
