// @flow 

import React, { Component } from 'react';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';

import {
	BLUR_ENABLED,
	BUNNY_EARS_ENABLED, 
	FRAMED_FACE_GREY_ENABLED,
	FRAMED_FACE_RED_ENABLED,
	FRAMED_FACE_YELLOW_ENABLED,
	VIDEO_EFFECT_FILTERS_DISABLED 
} from '../actionTypes';

import { setVideoEffectFilter } from '../actions';


/**
 * The type of the React {@code Component} props of {@link VideoQualitySlider}.
 */
type Props = {

    /**
     * The currently selected video effect filter. 
     */
    _selectedVideoEffectFilter: String,

    /**
     * Invoked to request toggling of audio only mode.
    */ 
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

class VideoEffectFilterChooser extends Component<Props> {
	
	/**
     * Initializes a new {@code VideoQualitySlider} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
	constructor(props) {
        super(props);
        this.onRadioValueChange = this.onRadioValueChange.bind(this);
        
    }
    
    onRadioValueChange(event) {
		const { dispatch } = this.props;
		
		dispatch(setVideoEffectFilter(event.target.value));
	}
    
    /**
     * Implements React's {@link Component#render()}.
     * 
     * https://www.pluralsight.com/guides/how-to-use-radio-buttons-in-reactjs
     *  { t('video-effect-filters.title') } 
     * 
     * 
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
		const { _selectedVideoEffectFilter, t } = this.props;
		
		return (
			<div className="video-effect-filters-dialog">
				<div className="video-effect-filters-dialog-content">
					<label className="video-effect-filters-label">
					<input type="radio" className="video-effect-filters-radio"
						value = {BUNNY_EARS_ENABLED}
						checked = {_selectedVideoEffectFilter === BUNNY_EARS_ENABLED}
						onChange = {this.onRadioValueChange}
					/>
					Bunny-Ears
					</label><br/>
					<label className="video-effect-filters-label">
						<input type="radio" className="video-effect-filters-radio"
							value = {FRAMED_FACE_GREY_ENABLED}
							checked = {_selectedVideoEffectFilter === FRAMED_FACE_GREY_ENABLED}
							onChange = {this.onRadioValueChange}
						/>
						Framed Face - Grey
					</label><br/>
					<label className="video-effect-filters-label">
						<input type="radio" className="video-effect-filters-radio"
							value = {FRAMED_FACE_RED_ENABLED}
							checked = {_selectedVideoEffectFilter === FRAMED_FACE_RED_ENABLED}
							onChange = {this.onRadioValueChange}
						/>
						Framed Face - Red
					</label><br/>
					<label className="video-effect-filters-label">
						<input type="radio" className="video-effect-filters-radio"
							value = {FRAMED_FACE_YELLOW_ENABLED}
							checked = {_selectedVideoEffectFilter === FRAMED_FACE_YELLOW_ENABLED}
							onChange = {this.onRadioValueChange}
						/>
						Framed Face - Yellow
					</label><br/>
					<label className="video-effect-filters-label">
						<input type="radio" className="video-effect-filters-radio"
							value = {BLUR_ENABLED}
							checked = {_selectedVideoEffectFilter === BLUR_ENABLED}
							onChange = {this.onRadioValueChange}
						/>
						Background blur
					</label><br/>
					<label className="video-effect-filters-label">
						<input type="radio" className="video-effect-filters-radio"
							value = {VIDEO_EFFECT_FILTERS_DISABLED}
							checked = {	
								!_selectedVideoEffectFilter ||
								_selectedVideoEffectFilter === VIDEO_EFFECT_FILTERS_DISABLED 
							}
							onChange = {this.onRadioValueChange}
						/>
						No effect
					</label><br/>
				</div>
				
			</div>
		);
	}
	
	/**
	_onSelectionChange(): {
		this.props.dispatch();
	}
	*/
	
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code OverflowMenuVideoEffectFiltersItem} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoQuality: number
 * }}
 */
function _mapStateToProps(state) {
    return {
        _selectedVideoEffectFilter: state['features/video-effect-filters'].currentVideoEffectFilter
    };
}

export default translate(connect(_mapStateToProps)(VideoEffectFilterChooser));
