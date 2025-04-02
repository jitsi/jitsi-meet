/* eslint-disable lines-around-comment */

import Slider from '@react-native-community/slider';
import { throttle } from 'lodash-es';
import React, { PureComponent } from 'react';
import { View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconVolumeUp } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getTrackByMediaTypeAndParticipant,
    getTrackState
} from '../../../base/tracks/functions.native';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { setVolume } from '../../../participants-pane/actions.native';
import { NATIVE_VOLUME_SLIDER_SCALE } from '../../constants';

import styles from './styles';


/**
 * The type of the React {@code Component} props of {@link VolumeSlider}.
 */
interface IProps {

    /**
     * Whether the participant enters the conference silent.
     */
    _startSilent?: boolean;

    /**
     * Remote audio track.
     */
    _track?: any;

    /**
     * The volume level for the participant.
     */
    _volume?: number;

    /**
     * The redux dispatch function.
     */
    dispatch?: Function;

    /**
     * The ID of the participant.
     */
    participantID?: string;
}

/**
 * The type of the React {@code Component} state of {@link VolumeSlider}.
 */
interface IState {

    /**
     * The volume of the participant's audio element. The value will
     * be represented by a slider.
     */
    volumeLevel: number;
}

/**
 * Component that renders the volume slider.
 *
 * @returns {React$Element<any>}
 */
class VolumeSlider extends PureComponent<IProps, IState> {

    _originalVolumeChange: Function;

    /**
     * Initializes a new {@code VolumeSlider} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            volumeLevel: props._volume || Math.ceil(NATIVE_VOLUME_SLIDER_SCALE / 2)
        };

        this._originalVolumeChange = this._onVolumeChange;

        this._onVolumeChange = throttle(
            volumeLevel => this._originalVolumeChange(volumeLevel), 500
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { _startSilent } = this.props;
        const { volumeLevel } = this.state;
        const onVolumeChange = _startSilent ? undefined : this._onVolumeChange;

        return (
            <View style = { styles.volumeSliderContainer as ViewStyle } >
                <Icon
                    size = { 24 }
                    src = { IconVolumeUp } />
                <Slider
                    maximumTrackTintColor = { BaseTheme.palette.ui10 }
                    maximumValue = { NATIVE_VOLUME_SLIDER_SCALE }
                    minimumTrackTintColor = { BaseTheme.palette.action01 }
                    minimumValue = { 0 }
                    onValueChange = { onVolumeChange }
                    style = { styles.sliderContainer as ViewStyle }
                    thumbTintColor = { BaseTheme.palette.ui10 }
                    value = { volumeLevel } />
            </View>

        );
    }

    /**
     * Sets the internal state of the volume level for the volume slider.
     * Invokes the prop onVolumeChange to notify of volume changes.
     *
     * @param {number} volumeLevel - Selected volume on slider.
     * @private
     * @returns {void}
     */
    _onVolumeChange(volumeLevel: any) {
        const { _track, dispatch, participantID } = this.props;
        const audioTrack = _track?.jitsiTrack.track;

        let newVolumeLevel;

        if (volumeLevel <= 10) {
            newVolumeLevel = volumeLevel / 10;
        } else {
            newVolumeLevel = volumeLevel - 9;
        }

        audioTrack?._setVolume(newVolumeLevel);

        // @ts-ignore
        dispatch(setVolume(participantID, newVolumeLevel));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VolumeSlider} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState, ownProps: IProps) {
    const { participantID } = ownProps;
    const { participantsVolume } = state['features/filmstrip'];
    const { startSilent } = state['features/base/config'];
    const tracks = getTrackState(state);

    return {
        _startSilent: Boolean(startSilent),
        _track: getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantID),
        _volume: participantID && participantsVolume[participantID]
    };
}

// @ts-ignore
export default connect(mapStateToProps)(VolumeSlider);
