// @flow
import { StateListenerRegistry } from '../base/redux';

import {
    greenScreenMaskUpdated
} from './actions';

StateListenerRegistry.register(state => state['features/green-screen/settings'].image, (settings, store) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        store.dispatch(greenScreenMaskUpdated(ctx.getImageData(0, 0, canvas.width, canvas.height)));
    };

    img.src = settings.data;
});
