/* @flow */

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import React, { PureComponent } from 'react';

import { translate } from '../../base/i18n';
import { getFieldValue } from '../../base/react';
import { connect } from '../../base/redux';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsSearch}.
 */
type Props = {

    /**
     * The speakerStatsSearch config setting.
     */
    _speakerStatsSearch: Boolean,

    /**
     * The function to initiate the change in the speaker stats table.
     */
    onSearch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

type State = {

    /**
     * The current value of the field.
     */
    value: string

};

/**
 * React component for display an individual user's speaker stats.
 *
 * @extends Component
 */
class SpeakerStatsSearch extends PureComponent<Props, State> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            value: ''
        };

        this._onChange = this._onChange.bind(this);
    }

    _onChange: Object => void;

    /**
     * Callback for the onChange event of the field.
     *
     * @param {Object} evt - The static event.
     * @returns {void}
     */
    _onChange(evt) {
        const value = getFieldValue(evt);

        this.setState({
            value
        });

        const { onSearch } = this.props;

        onSearch && onSearch(value);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _speakerStatsSearch } = this.props;

        if (!_speakerStatsSearch) {
            return null;
        }

        return (
            <div className = 'speaker-stats-search'>
                <TextField
                    autoComplete = 'off'
                    autoFocus = { false }
                    compact = { true }
                    name = 'speakerStatsSearch'
                    onChange = { this._onChange }
                    placeholder = { this.props.t('speakerStats.search') }
                    shouldFitContainer = { false }
                    type = 'text'
                    value = { this.state.value } />
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated SpeakerStatsSearch's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _speakerStatsSearch: ?string
 * }}
 */
function _mapStateToProps(state) {
    const config = state['features/base/config'];

    return {
        /**
         * The speakerStatsSearch config setting.
         *
         * @private
         * @type {boolean|undefined}
         */
        _speakerStatsSearch: config.speakerStatsSearch
    };
}

export default translate(connect(_mapStateToProps)(SpeakerStatsSearch));

