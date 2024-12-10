import './react/index.native';
import notifee, {EventType} from '@notifee/react-native';
import logger from './react/features/app/logger';

// Needs to be registered outside any React components as early as possible
await notifee.registerForegroundService(() => {
    return new Promise(resolve => {
        logger.warn('Foreground service running');

        notifee.onBackgroundEvent(async event => {
            if (event.type === EventType.ACTION_PRESS && event.detail.pressAction.id === 'hang-up') {
                console.log('HANG UP BUTTON PRESSED BACKGROUND');
            }

            return resolve();
        });

        notifee.onForegroundEvent(async ({ type, detail }) => {
            if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'hang-up') {
                console.log('HANG UP BUTTON PRESSED');
            }

            return resolve();
        });
    });
});
