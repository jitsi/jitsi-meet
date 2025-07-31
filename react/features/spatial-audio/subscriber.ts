import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getSpatialAudioManager } from './index';

/**
 * Listens for changes in the filmstrip participants to keep spatial audio synchronized
 * with all visible participants (including muted ones)
 */
StateListenerRegistry.register(
    /* selector */ state => ({
        remoteParticipants: state['features/filmstrip'].remoteParticipants,
        spatialAudioEnabled: true // We always want to sync, regardless of spatial audio state
    }),
    /* listener */ ({ remoteParticipants }) => {
        // Only sync if there are participants to avoid unnecessary processing
        if (remoteParticipants && remoteParticipants.length > 0) {
            console.log(`Spatial Audio Subscriber: Detected ${remoteParticipants.length} participants in filmstrip:`, remoteParticipants);
            
            try {
                const spatialAudioManager = getSpatialAudioManager();
                spatialAudioManager.synchronizeWithAllParticipants(remoteParticipants);
            } catch (error) {
                console.error('Spatial Audio Subscriber: Error synchronizing participants:', error);
            }
        } else {
            console.log('Spatial Audio Subscriber: No remote participants to synchronize');
        }
    },
    {
        deepEquals: true
    }
); 