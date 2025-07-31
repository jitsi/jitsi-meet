import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { SPATIAL_AUDIO_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconOrbitAlt } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { toggleSpatialAudio } from '../../../video-layout/actions.any';

/**
 * The type of the React {@code Component} props of {@link SpatialAudioButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether spatial audio is currently enabled.
     */
    _spatialAudioEnabled: boolean;
}

/**
 * An implementation of a button to toggle spatial audio.
 */
class SpatialAudioButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.spatialAudio';
    icon = IconOrbitAlt;
    label = 'toolbar.switchToSpatial';
    toggledLabel = 'toolbar.switchToMono';
    tooltip = 'toolbar.spatialAudioToggle';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, _spatialAudioEnabled } = this.props;

        sendAnalytics(createToolbarEvent(
            'spatial.button',
            {
                'is_enabled': _spatialAudioEnabled
            }));

        dispatch(toggleSpatialAudio());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._spatialAudioEnabled;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @returns {Props}
 */
function _mapStateToProps(state: any, ownProps: any) {
    const enabled = getFeatureFlag(state, SPATIAL_AUDIO_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _spatialAudioEnabled: (window as any).spatialAudio,
        visible
    };
}

export default translate(connect(_mapStateToProps)(SpatialAudioButton)); 