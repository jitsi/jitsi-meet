import {
    EVENT_TYPE,
    IDeviceInfo,
    IReportItem,
    ISendReportConfig,
    ITelephonyUsageReportList,
    IUsageReportItem
} from './types';
import {
    TELEPHONY_DEVICE_USAGE_PAGE,
    TELEPHONY_USAGE_ACTIONS,
    decode,
    encode,
    mapTelephonyUsageToReportId,
    requestTelephonyHID
} from './utils';

/**
 * WebHID manager that incorporates all hid specific logic.
 *
 * @class WebHidManager
 */
export default class WebHidManager extends EventTarget {
    private static instance: WebHidManager;
    private reportResultMap = new Map([
        [ 0, false ],
        [ 1, false ],
        [ 2, false ],
        [ 3, false ]
    ]);
    private telephonyDevice: HIDDevice;

    /**
     *  WebHidManager getInstance.
     *
     * @static
     * @returns {WebHidManager}  - WebHidManager instance.
     * @memberof WebHidManager
     */
    static getInstance(): WebHidManager {
        if (!this.instance) {
            this.instance = new WebHidManager();
        }

        return this.instance;
    }

    /**
     *  Current HIDDevice.
     *
     * @returns {HIDDevice} - HIDDevice.
     * @memberof WebHidManager
     */
    getTelephonyDevice() {
        return this.telephonyDevice;
    }

    /**
     * Check support of hid in navigator.
     * - experimental API in Chrome.
     *
     * @returns {boolean} - True if supported, otherwise false.
     * @memberof WebHidManager
     */
    isSupported(): boolean {
        return 'hid' in navigator;
    }

    /**
     * Handler for listen to already connected hid.
     *
     * @returns {void}
     */
    async requestHidDevice() {
        try {
            // @ts-ignore
            const devices = await navigator.hid.requestDevice(requestTelephonyHID);

            if (devices.length) {
                this.telephonyDevice = devices[0];

                return devices[0];
            }

            return null;
        } catch (er) {
            return null;
        }
    }

    /**
     * Handler for listen to already connected hid.
     *
     * @returns {void}
     */
    async listenToConnectedHid() {
        // @ts-ignore
        const devices = await navigator.hid.getDevices();
        const devicesWithCollections = devices.filter((device: HIDDevice) => device.collections);

        for (const device of devicesWithCollections) {
            const usagePageCollection = device.collections.some(
                (collection: HIDCollectionInfo) => collection.usagePage === TELEPHONY_DEVICE_USAGE_PAGE
            );

            // if any telephony device page, than handle it
            if (usagePageCollection) {
                this.telephonyDevice = device;

                // open the device
                this.handleHidDevice(device);

                break;
            }
        }
    }

    /**
     * Open current device and add listen handler.
     *
     * @param {HIDDevice} device - Hid device.
     * @returns {void}
     */
    async handleHidDevice(device: HIDDevice) {
        if (!device.opened) {
            await device.open();
        }

        device.oninputreport = this.handleInputReport.bind(this);

        this.dispatchEvent(new CustomEvent(EVENT_TYPE.INIT_DEVICE, { detail: {
            deviceInfo: {
                opened: device.opened,
                productId: device.productId,
                productName: device.productName,
                vendorId: device.vendorId
            } as IDeviceInfo } }));

        // set device in on-call state in order to synchronize state of conference audio with headsets audio state
        device.sendReport(3, new Uint8Array([ 0 ]));
        device.sendReport(4, new Uint8Array([ 1 ]));
    }

    /**
     * HandleInputReport.
     *
     * @param {HIDInputReportEvent} e - Input report event.
     * @returns {void}
     */
    handleInputReport(e: HIDInputReportEvent) {
        const { data, device, reportId } = e;

        if (reportId === 1) {
            const reports = this.getReports(device);

            if (!reports) {
                return;
            }

            this.dispatchEvent(new CustomEvent(EVENT_TYPE.UPDATE_DEVICE, {
                detail: {
                    updatedDeviceInfo: {
                        opened: device.opened
                    } as Partial<IDeviceInfo>
                }
            }));
            this.handleReportAudio(reports, data, this.reportResultMap);
        }
    }


    /**
     * Gather all reports from provided device collections.
     *
     * @param {HIDDevice} device - HIDDevice.
     * @returns {Map<string, IReportItem[]>} - Reports of provided device.
     */
    getReports(device: HIDDevice) {
        if (!device || !device.collections) {
            return;
        }

        const results = new Map();

        for (const collection of device.collections) {
            if (collection.outputReports) {
                for (const report of collection.outputReports) {
                    const outputReportResults = this.handleReport(report, '1');

                    outputReportResults.forEach((val, key) => {
                        results.set(key, val);
                    });
                }
            }
            if (collection.inputReports) {
                for (const report of collection.inputReports) {
                    const inputReports = this.handleReport(report, '0');

                    inputReports.forEach((val, key) => {
                        results.set(key, val);
                    });
                }
            }
        }

        return results;
    }

    /**
     *  Handle mute unmute toggle from collections.
     *
     * @param {Map<string, IReportItem[]>} results - .
     * @param {DataView} data - Current data view.
     * @param {Map<number,boolean>} reportMapResult - .
     * @returns {void}
     */
    handleReportAudio(
            results: Map<string, IReportItem[]>,
            data: DataView,
            reportMapResult: Map<number, boolean>
    ): void {
        const bufferArray = new Uint8Array(data.buffer);
        const reportMap = results.get('0');

        if (!reportMap) {
            return;
        }
        const report = reportMap.find((r: { reportId: number; }) => r.reportId === 1);
        const actions = [];

        if (!report) {
            return;
        }

        for (const usageReportItem of report.usageReportItems) {
            for (const telephonyUsageReportItem of usageReportItem.telephonyUsageReportList) {
                const reportValue = decode(telephonyUsageReportItem.reportSize, bufferArray);
                const reportId = mapTelephonyUsageToReportId(telephonyUsageReportItem.telephonyUsageId);
                const reportItem = reportMapResult.get(reportId);
                let reportValueResult;

                if (!usageReportItem.reportItem.isAbsolute && usageReportItem.reportItem.hasPreferredState) {
                    if (reportValue > 0) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    reportValueResult = !reportItem;
                } else if (usageReportItem.reportItem.isAbsolute) {
                    reportValueResult = reportValue === 1;
                } else {
                    break;
                }

                reportMapResult.set(reportId, reportValueResult);
                actions.push({
                    reportId,
                    enabled: reportValueResult,
                    reportItem
                });
            }
        }

        for (const action of actions) {
            if (action.reportId === 0) {
                if (action.enabled) {
                    this.dispatchEvent(new CustomEvent(EVENT_TYPE.MUTE_ON,
                        { detail: { reportHidMap: reportMapResult } }));
                } else {
                    this.dispatchEvent(new CustomEvent(EVENT_TYPE.MUTE_OFF,
                        { detail: { reportHidMap: reportMapResult } }));
                }
            }
        }
    }

    /**
     * Handle a single report.
     *
     * @param {HIDReportInfo} report - HIDReportInfo.
     * @param {string} key - Report key.
     * @returns {Map<string, IReportItem[]>} -.
     */
    handleReport(report: HIDReportInfo, key: string) {
        const result = new Map<string, IReportItem[]>();
        let reportCountSize = 0;
        const usageReportItems: IUsageReportItem[] = [];
        let telephonyUsageReportList: ITelephonyUsageReportList[];

        if (!report.items) {
            return result;
        }

        const valuesOfTelephonyUsageActions = Object.values(TELEPHONY_USAGE_ACTIONS);

        for (const reportItem of report.items) {
            const usages = reportItem.usages ? reportItem.usages : [];
            const reportSize = reportItem.reportSize ? reportItem.reportSize : 0;

            telephonyUsageReportList = [];

            for (let q = 0; q < usages.length; q++) {
                if (valuesOfTelephonyUsageActions.includes(usages[q])) {
                    telephonyUsageReportList.push({
                        telephonyUsageId: usages[q],
                        reportSize: reportCountSize + (q * reportSize)
                    });
                }
            }

            if (telephonyUsageReportList.length > 0) {
                usageReportItems.push({
                    reportItem,
                    telephonyUsageReportList
                });
            }

            reportCountSize += reportSize * (reportItem.reportCount ? reportItem.reportCount : 0);
        }

        if (usageReportItems.length) {
            if (!result.has(key)) {
                result.set(key, []);
            }

            const reportId = report.reportId ? report.reportId : 0;

            reportCountSize = Math.ceil(reportCountSize / 8);

            const reportItems = result.get(key) as IReportItem[];

            reportItems.push({
                reportCountSize,
                reportId,
                usageReportItems
            } as IReportItem);
            result.set(key, reportItems);
        }

        return result;
    }

    /**
     * GetDataFromReports.
     *
     * @param {Map<string, IReportItem[]>} reports - .
     * @param {number} telephonyAction - .
     * @returns {*}
     * @memberof WebHidManager
     */
    getDataFromReports(reports: Map<string, IReportItem[]>, telephonyAction: number) {
        const reportItems = reports.get('1');

        if (!reportItems) {
            return;
        }

        for (const reportItem of reportItems) {
            for (const usageReportItem of reportItem.usageReportItems) {
                if (usageReportItem.telephonyUsageReportList.some(
                    (telephonyUsageReportItem: ITelephonyUsageReportList) =>
                        telephonyUsageReportItem.telephonyUsageId === telephonyAction)) {
                    return reportItem;
                }
            }
        }
    }

    /**
     * Send report to hid device.
     *
     * @param {ISendReportConfig} sendReportConfig -.
     * @returns {void}
     * @memberof WebHidManager
     */
    async sendReportToDevice(sendReportConfig: ISendReportConfig) {
        const reportData = this.getDataFromReports(sendReportConfig.reports, sendReportConfig.telephonyUsageActionId);

        if (!reportData) {
            return;
        }

        const valueActionNumber = sendReportConfig.valueAction ? 1 : 0;
        const telephonyActionResultList = [],
            telephonyReportSizeList = [];

        for (const usageReportItem of reportData.usageReportItems) {
            for (const telephonyUsageReportItem of usageReportItem.telephonyUsageReportList) {
                telephonyReportSizeList.push(telephonyUsageReportItem.reportSize);

                if (telephonyUsageReportItem.telephonyUsageId === sendReportConfig.telephonyUsageActionId) {
                    telephonyActionResultList.push(valueActionNumber);
                } else {
                    const reportId = mapTelephonyUsageToReportId(telephonyUsageReportItem.telephonyUsageId);
                    const reportIdValue = sendReportConfig.reportMapResult.get(reportId);

                    telephonyActionResultList.push(reportIdValue ? 1 : 0);
                }
            }
        }
        const encodedTelephonyUsageActionId = encode(
            telephonyReportSizeList,
            telephonyActionResultList,
            reportData.reportCountSize);

        try {
            await sendReportConfig.currentDevice.sendReport(reportData.reportId, encodedTelephonyUsageActionId);
        } catch {
            //
        }
    }
}
