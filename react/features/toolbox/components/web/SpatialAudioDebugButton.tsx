import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconGear } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

/**
 * The type of the React {@code Component} props of {@link SpatialAudioDebugButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether spatial audio is currently enabled.
     */
    _spatialAudioEnabled: boolean;
}

/**
 * An implementation of a button to manually trigger spatial audio position recalculation for debugging.
 */
class SpatialAudioDebugButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.spatialAudioDebug';
    icon = IconGear;
    label = 'toolbar.spatialAudioDebug';
    tooltip = 'toolbar.spatialAudioDebug';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _spatialAudioEnabled } = this.props;

        sendAnalytics(createToolbarEvent(
            'spatial.debug.button',
            {
                'spatial_audio_enabled': _spatialAudioEnabled
            }));

        // Only trigger recalculation if spatial audio is enabled
        if (_spatialAudioEnabled && (window as any).spatialAudio) {
            console.log('🔧 Spatial-Audio Debug: Manually triggering position recalculation...');

            const audioTracks = document.querySelectorAll('.audio-track');

            console.log(`🔧 Spatial-Audio Debug: Found ${audioTracks.length} audio tracks`);

            if (audioTracks.length > 0) {
                console.log('🔧 Spatial-Audio Debug: Triggering global position recalculation...');

                // Manually trigger recalculation for all audio tracks
                audioTracks.forEach((track, index) => {
                    const audioElement = track.querySelector('audio');

                    if (audioElement) {
                        console.log(`🔧 Spatial-Audio Debug: Processing track ${index + 1}/${audioTracks.length}: ${audioElement.id}`);
                    }
                });

                // Dispatch a custom event that AudioTrack components can listen to
                const recalculateEvent = new CustomEvent('spatialAudioRecalculate', {
                    detail: { manually_triggered: true }
                });

                window.dispatchEvent(recalculateEvent);

                console.log('🔧 Spatial-Audio Debug: Recalculation event dispatched!');
                console.log('🔧 Spatial-Audio Debug: Check console for detailed position logs from AudioTrack components');
            } else {
                console.warn('🔧 Spatial-Audio Debug: No audio tracks found to recalculate');
            }
        } else {
            console.warn('🔧 Spatial-Audio Debug: Spatial audio is not enabled - skipping recalculation');
        }
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        // Button is disabled if spatial audio is not enabled
        return !this.props._spatialAudioEnabled;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} _state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(_state: IReduxState) {
    return {
        _spatialAudioEnabled: (window as any).spatialAudio || false
    };
}

export default translate(connect(mapStateToProps)(SpatialAudioDebugButton));