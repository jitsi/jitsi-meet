import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import Label from '../../base/label/components/native/Label';
import { StyleType, combineStyles } from '../../base/styles/functions.native';

import styles from './styles';

interface IProps extends WithTranslation {

    /**
     * Whether or not the conference is in audio only mode.
     */
    _audioOnly: boolean;

    /**
     * Style of the component passed as props.
     */
    style?: StyleType;
}

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the displayed video state of the current conference.
 *
 * NOTE: Due to the lack of actual video quality information on mobile side,
 * this component currently only displays audio only indicator, but the naming
 * is kept consistent with web and in the future we may introduce the required
 * api and extend this component with actual quality indication.
 */
class VideoQualityLabel extends Component<IProps> {

    /**
     * Implements React {@link Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { _audioOnly, style, t } = this.props;

        if (!_audioOnly) {
            // We don't have info about the quality so no need for the indicator
            return null;
        }

        return (
            <Label // @ts-ignore
                style = { combineStyles(styles.indicatorAudioOnly, style) }
                text = { t('videoStatus.audioOnly') } />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractVideoQualityLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const { enabled: audioOnly } = state['features/base/audio-only'];

    return {
        _audioOnly: audioOnly
    };
}

export default translate(connect(_mapStateToProps)(VideoQualityLabel));
