import { NativeModules, NativeEventEmitter } from 'react-native';

import { getName } from '../../app/functions';

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
let CallKit = NativeModules.RNCallKit;

// XXX Rather than wrapping RNCallKit in a new class and forwarding the many
// methods of the latter to the former, add the one additional method that we
// need to RNCallKit.
if (CallKit) {
    const eventEmitter = new NativeEventEmitter(CallKit);

    CallKit = {
        ...CallKit,
        addListener: eventEmitter.addListener.bind(eventEmitter),
        registerSubscriptions(context, delegate) {
            CallKit.setProviderConfiguration({
                iconTemplateImageName: 'CallKitIcon',
                localizedName: getName()
            });

            return [
                CallKit.addListener(
                    'performEndCallAction',
                    delegate._onPerformEndCallAction,
                    context),
                CallKit.addListener(
                    'performSetMutedCallAction',
                    delegate._onPerformSetMutedCallAction,
                    context),

                // According to CallKit's documentation, when the system resets
                // we should terminate all calls. Hence, providerDidReset is
                // the same to us as performEndCallAction.
                CallKit.addListener(
                    'providerDidReset',
                    delegate._onPerformEndCallAction,
                    context)
            ];
        }
    };
}

export default CallKit;
