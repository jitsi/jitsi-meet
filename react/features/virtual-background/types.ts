import { IVirtualBackground } from './reducer';

export interface VirtualBackgroundOptions extends IVirtualBackground {
    enabled: boolean;
    url?: string;
}
