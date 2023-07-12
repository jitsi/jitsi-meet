import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import Label from '../../base/label/components/native/Label';

/**
 * The type of the React {@code Component} props of {@link TranscribingLabel}.
 */
export interface IProps extends WithTranslation {

    /**
     * True if the label needs to be rendered, false otherwise.
     */
    _showLabel: boolean;
}


/**
 * React {@code Component} for displaying a label when a transcriber is in the
 * conference.
 *
 * @augments Component
 */
class TranscribingLabel extends Component<IProps> {

    /**
     * Renders the platform-specific label component.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._showLabel) {
            return null;
        }

        return <Label text = { this.props.t('transcribing.tr') } />;
    }
}

/**
 * Maps (parts of) the redux state to the associated props of the
 * {@link AbstractTranscribingLabel} {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _showLabel: boolean
 * }}
 */
export function _mapStateToProps(state: IReduxState) {
    return {
        _showLabel: state['features/transcribing'].isTranscribing
    };
}

export default translate(connect(_mapStateToProps)(TranscribingLabel));
