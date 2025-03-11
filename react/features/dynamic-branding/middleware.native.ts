import { SET_CONFIG } from '../base/config/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomBrandingData } from './actions.native';

import './middleware.any';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG: {
        const result = next(action);

        store.dispatch(fetchCustomBrandingData());

        return result;
    }

    case SET_DYNAMIC_BRANDING_DATA: {
        const {
            avatarBackgrounds = [],
            backgroundColor,
            backgroundImageUrl,
            brandedIcons,
            customParticipantMenuButtons,
            customToolbarButtons,
            didPageUrl,
            downloadAppsUrl,
            etherpadBase,
            inviteDomain,
            labels,
            liveStreamingDialogUrls,
            peopleSearchUrl,
            salesforceUrl,
            sharedVideoAllowedURLDomains,
            supportUrl,
            userDocumentationUrl,
        } = action.value;

        action.value = {
            avatarBackgrounds,
            backgroundColor,
            backgroundImageUrl,
            brandedIcons,
            customParticipantMenuButtons,
            customToolbarButtons,
            didPageUrl,
            downloadAppsUrl,
            etherpadBase,
            inviteDomain,
            labels,
            liveStreamingDialogUrls,
            peopleSearchUrl,
            salesforceUrl,
            sharedVideoAllowedURLDomains,
            supportUrl,
            userDocumentationUrl
        };

        // The backend may send an empty string, make sure we skip that.
        if (Array.isArray(avatarBackgrounds)) {
            // TODO: implement support for gradients.
            action.value.avatarBackgrounds = avatarBackgrounds.filter(
                (color: string) => !color.includes('linear-gradient')
            );
        }

        break;
    }
    }

    return next(action);
});
