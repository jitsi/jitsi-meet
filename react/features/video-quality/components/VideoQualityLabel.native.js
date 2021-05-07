// @flow

import React from 'react';

import { translate } from '../../base/i18n';
import { Label } from '../../base/label';
import { connect } from '../../base/redux';
import { combineStyles, type StyleType } from '../../base/styles';

import AbstractVideoQualityLabel, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from './AbstractVideoQualityLabel';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * Style of the component passed as props.
     */
    style: ?StyleType
};

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the displayed video state of the current conference.
 *
 * NOTE: Due to the lack of actual video quality information on mobile side,
 * this component currently only displays audio only indicator, but the naming
 * is kept consistent with web and in the future we may introduce the required
 * api and extend this component with actual quality indication.
 */
class VideoQualityLabel extends AbstractVideoQualityLabel<Props> {

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
            <Label
                style = { combineStyles(styles.indicatorAudioOnly, style) }
                text = { t('videoStatus.audioOnly') } />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code VideoQualityLabel}'s props.
 *
 * NOTE: This component has no props other than the abstract ones but keeping
 * the coding style the same for consistency reasons.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state: Object) {
    return {
        ..._abstractMapStateToProps(state)
    };
}

export default translate(connect(_mapStateToProps)(VideoQualityLabel));
