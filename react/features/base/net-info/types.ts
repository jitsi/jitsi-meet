import { NetInfoCellularGeneration, NetInfoStateType } from '@react-native-community/netinfo';

/**
 * Describes the structure which is used by jitsi-meet to store information about the current network type and
 * conditions.
 */
export type NetworkInfo = {

    /**
     * Any extra info provided by the OS. Should be JSON and is OS specific. Reported only by iOS and Android and
     * the format is whatever comes out of the 'react-native-netinfo' library which is network type dependent.
     */
    details?: {

        /**
         * If {@link networkType} is {@link NetInfoStateType.cellular} then it may provide the info about the type of
         * cellular network.
         */
        cellularGeneration?: NetInfoCellularGeneration | null;

        /**
         * Indicates whether or not the connection is expensive.
         */
        isConnectionExpensive?: boolean;
    } | null;

    /**
     * Tells whether or not the internet is reachable.
     */
    isOnline: boolean;

    /**
     * The network type. Currently reported only on Android/iOS. Can be one of the constants defined by
     * the 'react-native-netinfo' library.
     */
    networkType?: NetInfoStateType;
};
