import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import {
    getTutorModeAllowedAudioSources,
    shouldIsolateLocalParticipant
} from './functions';

/**
 * Keeps the bridge-side remote audio subscription aligned with tutor mode.
 */
StateListenerRegistry.register(
    state => {
        const { conference } = state['features/base/conference'];
        const isolate = shouldIsolateLocalParticipant(state);
        const include = isolate ? getTutorModeAllowedAudioSources(state).sort() : [];

        return {
            conference,
            include,
            isolate
        };
    },
    ({ conference, include, isolate }) => {
        if (!conference) {
            return;
        }

        conference.setAudioSubscriptionMode({
            all: !isolate,
            exclude: [],
            include
        });
    },
    {
        deepEquals: true
    }
);
