import { IStore } from '../app/types';
import { APP_WILL_MOUNT } from '../base/app/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_DYNAMIC_BRANDING_DATA, SET_SELECTED_THEME } from './actionTypes';
import { fetchCustomBrandingData, setDynamicBrandingData } from './actions.any';
import { createMuiBrandingTheme } from './functions.web';

import './middleware.any';

MiddlewareRegistry.register((store: IStore) => next => action => {
    if (action.type === SET_DYNAMIC_BRANDING_DATA) {
        const { customTheme } = action.value;

        if (customTheme) {
            action.value.muiBrandedTheme = createMuiBrandingTheme(customTheme);
        }
    }

    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT: {
        const { selectedThemeContent } = store.getState()['features/dynamic-branding'];

        if (selectedThemeContent) {
            // Apply the theme directly from the state.
            store.dispatch(setDynamicBrandingData(selectedThemeContent));
        } else {
            // No saved theme, run Jitsi's default branding logic.
            store.dispatch(setDynamicBrandingData({}));
            store.dispatch(fetchCustomBrandingData());
        }
        break;
    }

    case SET_SELECTED_THEME: {
        const { content } = action.payload;

        // Apply the new theme to the UI for the current session.
        store.dispatch(setDynamicBrandingData(content || {}));
        break;
    }
    }

    return result;
});
