import { IVirtualBackground } from './reducer';

export interface IVirtualBackgroundOptions extends IVirtualBackground {
    enabled: boolean;
    url?: string;
}
