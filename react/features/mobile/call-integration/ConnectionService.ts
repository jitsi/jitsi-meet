import { NativeEventEmitter, NativeModules } from 'react-native';

const RNConnectionService = NativeModules.ConnectionService;

// Use a proxy because spreading a new arch native module silently loses its methods.
let ConnectionService: any;

if (RNConnectionService) {
    const eventEmitter = new NativeEventEmitter(RNConnectionService);
    const augmented: Record<string, any> = {
        addListener: eventEmitter.addListener.bind(eventEmitter),
        registerSubscriptions(context: any, delegate: any) {
            return [
                eventEmitter.addListener(
                    'org.jitsi.meet:features/connection_service#disconnect',
                    delegate._onPerformEndCallAction,
                    context),
                eventEmitter.addListener(
                    'org.jitsi.meet:features/connection_service#abort',
                    delegate._onPerformEndCallAction,
                    context)
            ];
        },
        setMuted() {
            // Currently no-op, but remember to remove when implemented on
            // the native side
        }
    };

    ConnectionService = new Proxy(RNConnectionService, {
        get(target, prop, receiver) {
            if (prop in augmented) {
                return augmented[prop as string];
            }

            return Reflect.get(target, prop, receiver);
        }
    });
}

export default ConnectionService;
