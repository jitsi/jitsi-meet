// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { escapeRegexp } from '../../../base/util';
import { initSearch, resetSearchCriteria, toggleFacialExpressions } from '../../actions';

import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsList from './SpeakerStatsList';
import SpeakerStatsSearch from './SpeakerStatsSearch';
import ToggleFacialExpressionsButton from './ToggleFacialExpressionsButton';

/**
 * The type of the React {@code Component} props of {@link SpeakerStats}.
 */
type Props = {

    /**
     * The flag which shows if the facial recognition is enabled, obtained from the redux store.
     * If enabled facial expressions can be expanded.
     */
    _enableFacialRecognition: boolean,

    /**
     * The flag which shows if the facial expressions are displayed or not.
     */
    _showFacialExpressions: boolean,

    /**
     * True if the client width is less than 750.
     */
    _reduceExpressions: boolean,

    /**
     * The search criteria.
     */
    _criteria: string | null,

    /**
     * Redux store dispatch method.
     */
    dispatch: Dispatch<any>,

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * React component for displaying a list of speaker stats.
 *
 * @augments Component
 */
class SpeakerStats extends Component<Props> {

    /**
     * Initializes a new SpeakerStats instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSearch = this._onSearch.bind(this);
        this._onToggleFacialExpressions = this._onToggleFacialExpressions.bind(this);
    }

    /**
     * Resets the search criteria when component will unmount.
     *
     * @private
     * @returns {void}
     */
    componentWillUnmount() {
        this.props.dispatch(resetSearchCriteria());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                cancelKey = 'dialog.close'
                submitDisabled = { true }
                titleKey = 'speakerStats.speakerStats'
                width = { this.props._showFacialExpressions ? 'large' : 'medium' }>
                <div className = 'speaker-stats'>
                    <SpeakerStatsSearch onSearch = { this._onSearch } />
                    { this.props._enableFacialRecognition
                    && <ToggleFacialExpressionsButton
                        onClick = { this._onToggleFacialExpressions }
                        showFacialExpressions = { this.props._showFacialExpressions } />
                    }
                    <SpeakerStatsLabels
                        reduceExpressions = { this.props._reduceExpressions }
                        showFacialExpressions = { this.props._showFacialExpressions ?? false } />
                    <SpeakerStatsList />
                </div>
            </Dialog>
        );
    }

    _onSearch: () => void;

    /**
     * Search the existing participants by name.
     *
     * @returns {void}
     * @param {string} criteria - The search parameter.
     * @protected
     */
    _onSearch(criteria = '') {
        this.props.dispatch(initSearch(escapeRegexp(criteria)));
    }

    _onToggleFacialExpressions: () => void;

    /**
     * Toggle the facial expressions grid from speaker stats.
     *
     * @returns {void}
     * @protected
     */
    _onToggleFacialExpressions() {
        this.props.dispatch(toggleFacialExpressions());
    }
}

/**
 * Maps (parts of) the redux state to the associated SpeakerStats's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _showFacialExpressions: ?boolean,
 *     _reduceExpressions: boolean,
 * }}
 */
function _mapStateToProps(state) {
    const { enableFacialRecognition } = state['features/base/config'];
    const { showFacialExpressions } = state['features/speaker-stats'];
    const { clientWidth } = state['features/base/responsive-ui'];

    return {
        /**
         * The local display name.
         *
         * @private
         * @type {string|undefined}
         */
        _enableFacialRecognition: enableFacialRecognition,
        _showFacialExpressions: showFacialExpressions,
        _reduceExpressions: clientWidth < 750
    };
}

export default translate(connect(_mapStateToProps)(SpeakerStats));
