import { NativeEventEmitter, NativeModules } from 'react-native';

import { getName } from '../../app/functions.native';

/**
 * Thin wrapper around Apple's CallKit functionality.
 *
 * In CallKit requests are performed via actions (either user or system started)
 * and async events are reported via dedicated methods. This class exposes that
 * functionality in the form of methods and events. One important thing to note
 * is that even if an action is started by the system (because the user pressed
 * the "end call" button in the CallKit view, for example) the event will be
 * emitted in the same way as it would if the action originated from calling
 * the "endCall" method in this class, for example.
 *
 * Emitted events:
 * - performAnswerCallAction: The user pressed the answer button.
 * - performEndCallAction: The call should be ended.
 * - performSetMutedCallAction: The call muted state should change. The
 *   ancillary `data` object contains a `muted` attribute.
 * - providerDidReset: The system has reset, all calls should be terminated.
 *   This event gets no associated data.
 *
 * All events get a `data` object with a `callUUID` property, unless stated
 * otherwise.
 */
const RNCallKit = NativeModules.RNCallKit;

// Use a proxy because spreading a new arch native module silently loses its methods.
let CallKit: any;

if (RNCallKit) {
    const eventEmitter = new NativeEventEmitter(RNCallKit);
    const augmented: Record<string, any> = {
        addListener: eventEmitter.addListener.bind(eventEmitter),
        registerSubscriptions(context: any, delegate: any) {
            RNCallKit.setProviderConfiguration({
                iconTemplateImageName: 'CallKitIcon',
                localizedName: getName()
            });

            return [
                eventEmitter.addListener(
                    'performEndCallAction',
                    delegate._onPerformEndCallAction,
                    context),
                eventEmitter.addListener(
                    'performSetMutedCallAction',
                    delegate._onPerformSetMutedCallAction,
                    context),

                // According to CallKit's documentation, when the system resets
                // we should terminate all calls. Hence, providerDidReset is
                // the same to us as performEndCallAction.
                eventEmitter.addListener(
                    'providerDidReset',
                    delegate._onPerformEndCallAction,
                    context)
            ];
        }
    };

    CallKit = new Proxy(RNCallKit, {
        get(target, prop, receiver) {
            if (prop in augmented) {
                return augmented[prop as string];
            }

            return Reflect.get(target, prop, receiver);
        }
    });
}

export default CallKit;
