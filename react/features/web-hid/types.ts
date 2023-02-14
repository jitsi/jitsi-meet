export const EVENT_TYPE = {
    INIT_DEVICE: 'INIT_DEVICE',
    UPDATE_DEVICE: 'UPDATE_DEVICE',
    MUTE_OFF: 'MUTE_OFF',
    MUTE_ON: 'MUTE_ON'
};

export interface IDeviceInfo {
    opened: boolean;
    productId: number;
    productName: string;
    vendorId: number;
}

export interface ITelephonyUsageReportList {
    reportSize: number;
    telephonyUsageId: number;
}

export interface IUsageReportItem {

    // @ts-ignore
    reportItem: HIDReportItem;
    telephonyUsageReportList: ITelephonyUsageReportList[];
}

export interface IReportItem {
    reportCountSize: number;
    reportId: number;
    usageReportItems: IUsageReportItem[];
}

export interface ISendReportConfig {

    // @ts-ignore
    currentDevice: HIDDevice;
    reportMapResult: Map<number, boolean>;
    reports: Map<string, IReportItem[]>;
    telephonyUsageActionId: number;
    valueAction: boolean;
}
