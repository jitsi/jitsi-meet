import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getSpatialAudioManager } from '../SpatialAudioManager';
import { 
    toggleSpatialAudio, 
    setSpatialAudioType, 
    updateSpatialAudioSettings 
} from '../actions';
import { SpatialAudioType, ISpatialAudioSettings } from '../types';

interface IProps {
    /**
     * Current spatial audio settings from Redux state
     */
    spatialAudioSettings: ISpatialAudioSettings;

    /**
     * Dispatch function
     */
    dispatch: any;
}

interface IState {
    /**
     * Local settings for real-time updates
     */
    localSettings: ISpatialAudioSettings;
}

/**
 * Component for controlling spatial audio settings
 */
class SpatialAudioControls extends Component<IProps, IState> {
    private spatialAudioManager = getSpatialAudioManager();

    constructor(props: IProps) {
        super(props);

        this.state = {
            localSettings: this.spatialAudioManager.getSettings()
        };
    }

    componentDidMount() {
        // Listen for settings updates from the manager
        this.spatialAudioManager.addEventListener('settingsUpdated', this.handleSettingsUpdate);
    }

    componentWillUnmount() {
        // Clean up event listeners
        this.spatialAudioManager.removeEventListener('settingsUpdated', this.handleSettingsUpdate);
    }

    handleSettingsUpdate = (data: { settings: ISpatialAudioSettings }) => {
        this.setState({
            localSettings: data.settings
        });
    }

    handleToggleSpatialAudio = () => {
        this.props.dispatch(toggleSpatialAudio());
    }

    handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = event.target.value as SpatialAudioType;
        this.props.dispatch(setSpatialAudioType(newType));
    }

    handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        this.props.dispatch(updateSpatialAudioSettings({ masterVolume: newVolume }));
    }

    render() {
        const { localSettings } = this.state;
        const participants = this.spatialAudioManager.getAllParticipants();

        return (
            <div style={{ 
                padding: '20px', 
                border: '1px solid #ccc', 
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                margin: '10px'
            }}>
                <h3>🎧 Spatial Audio Controls</h3>
                
                <div style={{ marginBottom: '15px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.enabled}
                            onChange={this.handleToggleSpatialAudio}
                            style={{ marginRight: '8px' }}
                        />
                        Enable Spatial Audio
                    </label>
                </div>

                {localSettings.enabled && (
                    <>
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="spatial-audio-type" style={{ display: 'block', marginBottom: '5px' }}>
                                Audio Strategy:
                            </label>
                            <select
                                id="spatial-audio-type"
                                value={localSettings.type}
                                onChange={this.handleTypeChange}
                                style={{ padding: '5px', minWidth: '150px' }}
                            >
                                <option value="none">None (Mono)</option>
                                <option value="stereo">Stereo Panning</option>
                                <option value="equalpower">Equalpower Panning</option>
                                <option value="hrtf">HRTF (3D Audio)</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="master-volume" style={{ display: 'block', marginBottom: '5px' }}>
                                Master Volume: {Math.round(localSettings.masterVolume * 100)}%
                            </label>
                            <input
                                id="master-volume"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={localSettings.masterVolume}
                                onChange={this.handleVolumeChange}
                                style={{ width: '200px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <h4>📊 Participant Overview ({participants.length})</h4>
                            {participants.length > 0 ? (
                                <div style={{ 
                                    maxHeight: '200px', 
                                    overflowY: 'auto',
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    backgroundColor: 'white'
                                }}>
                                    {participants.map((participant, index) => (
                                        <div key={participant.participantId} style={{ 
                                            padding: '4px 0',
                                            borderBottom: index < participants.length - 1 ? '1px solid #eee' : 'none'
                                        }}>
                                            <strong>{participant.displayName || participant.participantId}</strong>
                                            <br />
                                            <small>
                                                Position: ({participant.position.x.toFixed(2)}, {participant.position.y.toFixed(2)})
                                                {participant.isMuted && ' • 🔇 Muted'}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>
                                    No participants detected
                                </p>
                            )}
                        </div>
                    </>
                )}

                <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    borderTop: '1px solid #ddd',
                    paddingTop: '10px',
                    marginTop: '15px'
                }}>
                    <strong>Current Strategy:</strong> {localSettings.type.toUpperCase()}
                    <br />
                    <strong>Audio Context State:</strong> {this.spatialAudioManager.getAudioContext().state}
                </div>
            </div>
        );
    }
}

/**
 * Maps Redux state to component props
 */
function mapStateToProps(state: any) {
    return {
        spatialAudioSettings: state['features/spatial-audio']?.spatialAudio || {
            enabled: false,
            type: 'none',
            masterVolume: 1.0,
            listenerPosition: { x: 0, y: 0, z: 1 },
            listenerOrientation: {
                forward: { x: 0, y: 0, z: -1 },
                up: { x: 0, y: 1, z: 0 }
            }
        }
    };
}

export default connect(mapStateToProps)(SpatialAudioControls); 