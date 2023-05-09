import logger from './logger';
import {
    ACTION_HOOK_TYPE_NAME,
    COMMANDS,
    EVENT_TYPE,
    HOOK_STATUS,
    IDeviceInfo,
    INPUT_REPORT_EVENT_NAME
} from './types';
import {
    DEVICE_USAGE,
    TELEPHONY_DEVICE_USAGE_PAGE,
    requestTelephonyHID
} from './utils';

/**
 * WebHID manager that incorporates all hid specific logic.
 *
 * @class WebHidManager
 */
export default class WebHidManager extends EventTarget {
    hidSupport: boolean;
    deviceInfo: IDeviceInfo;
    availableDevices: HIDDevice[];
    isParseDescriptorsSuccess: boolean;
    outputEventGenerators: { [key: string]: Function; };
    deviceCommand = {
        outputReport: {
            mute: {
                reportId: 0,
                usageOffset: -1
            },
            offHook: {
                reportId: 0,
                usageOffset: -1
            },
            ring: {
                reportId: 0,
                usageOffset: 0
            },
            hold: {
                reportId: 0,
                usageOffset: 0
            }
        },
        inputReport: {
            hookSwitch: {
                reportId: 0,
                usageOffset: -1,
                isAbsolute: false
            },
            phoneMute: {
                reportId: 0,
                usageOffset: -1,
                isAbsolute: false
            }
        }
    };

    private static instance: WebHidManager;

    /**
     *  WebHidManager getInstance.
     *
     * @static
     * @returns {WebHidManager}  - WebHidManager instance.
     */
    static getInstance(): WebHidManager {
        if (!this.instance) {
            this.instance = new WebHidManager();
        }

        return this.instance;
    }

    /**
     * Creates an instance of WebHidManager.
     *
     */
    constructor() {
        super();

        this.deviceInfo = {} as IDeviceInfo;
        this.hidSupport = this.isSupported();
        this.availableDevices = [];
        this.isParseDescriptorsSuccess = false;
        this.outputEventGenerators = {};
    }

    /**
     * Check support of hid in navigator.
     * - experimental API in Chrome.
     *
     * @returns {boolean} - True if supported, otherwise false.
     */
    isSupported(): boolean {
        // @ts-ignore
        return Boolean(window.navigator.hid?.requestDevice);
    }

    /**
     * Handler for requesting telephony hid devices.
     *
     * @returns {HIDDevice[]|null}
     */
    async requestHidDevices() {
        if (!this.hidSupport) {
            logger.warn('The WebHID API is NOT supported!');

            return null;
        }

        if (this.deviceInfo?.device && this.deviceInfo.device.opened) {
            await this.close();
        }

        // @ts-ignore
        const devices = await navigator.hid.requestDevice(requestTelephonyHID);

        if (!devices?.length) {
            logger.warn('No HID devices selected.');

            return false;
        }

        this.availableDevices = devices;

        return devices;
    }

    /**
     * Handler for listen to already connected hid.
     *
     * @returns {void}
     */
    async listenToConnectedHid() {
        const devices = await this.loadPairedDevices();

        if (!devices?.length) {
            logger.warn('No hid device found.');

            return;
        }

        const telephonyDevice = this.getTelephonyDevice(devices);

        if (!telephonyDevice) {
            logger.warn('No HID device to request');

            return;
        }

        await this.open(telephonyDevice);

        // restore the default state of hook and mic LED
        this.resetDeviceState();

        // switch headsets to OFF_HOOK for mute/unmute commands
        this.sendDeviceReport({ command: COMMANDS.OFF_HOOK });
    }

    /**
     * Get first telephony device from availableDevices.
     *
     * @param {HIDDevice[]} availableDevices -.
     * @returns {HIDDevice} -.
     */
    private getTelephonyDevice(availableDevices: HIDDevice[]) {
        if (!availableDevices?.length) {
            logger.warn('No HID device to request');

            return undefined;
        }

        return availableDevices?.find(device => this.findTelephonyCollectionInfo(device.collections));
    }

    /**
     * Find telephony collection info from a list of collection infos.
     *
     * @private
     * @param {HIDCollectionInfo[]} deviceCollections -.
     * @returns {HIDCollectionInfo} - Hid collection info.
     */
    private findTelephonyCollectionInfo(deviceCollections: HIDCollectionInfo[]) {
        return deviceCollections?.find(
                (collection: HIDCollectionInfo) => collection.usagePage === TELEPHONY_DEVICE_USAGE_PAGE
        );
    }

    /**
     * Open the hid device and start listening to inputReport events.
     *
     * @param {HIDDevice} telephonyDevice -.
     * @returns {void} -.
     */
    private async open(telephonyDevice: HIDDevice) {
        try {
            this.deviceInfo = { device: telephonyDevice } as IDeviceInfo;

            if (!this.deviceInfo?.device) {
                logger.warn('no HID device found');

                return;
            }

            if (!this.deviceInfo.device.opened) {
                await this.deviceInfo.device.open();
            }

            this.isParseDescriptorsSuccess = await this.parseDeviceDescriptors(this.deviceInfo.device);

            if (!this.isParseDescriptorsSuccess) {
                logger.warn('Failed to parse webhid');

                return;
            }

            this.dispatchEvent(new CustomEvent(EVENT_TYPE.INIT_DEVICE, { detail: {
                deviceInfo: {
                    ...this.deviceInfo
                } as IDeviceInfo } }));

            //  listen for input reports by registering an oninputreport event listener
            this.deviceInfo.device.oninputreport = await this.handleInputReport.bind(this);

            this.resetDeviceState();
        } catch (e) {
            logger.error(`Error content open device:${e}`);
        }
    }

    /**
     * Close device and reset state.
     *
     * @returns {void}.
     */
    async close() {
        try {
            await this.resetDeviceState();

            if (this.availableDevices) {
                logger.info('clear available devices list');
                this.availableDevices = [];
            }

            if (!this.deviceInfo) {
                return;
            }

            if (this.deviceInfo?.device?.opened) {
                await this.deviceInfo.device.close();
            }

            if (this.deviceInfo.device) {
                this.deviceInfo.device.oninputreport = null;
            }
            this.deviceInfo = {} as IDeviceInfo;
        } catch (e) {
            logger.error(e);
        }
    }

    /**
     * Get paired hid devices.
     *
     * @returns {HIDDevice[]}
     */
    async loadPairedDevices() {
        try {
            // @ts-ignore
            const devices = await navigator.hid.getDevices();

            this.availableDevices = devices;

            return devices;
        } catch (e) {
            logger.error('loadPairedDevices error:', e);
        }
    }

    /**
     * Parse device descriptors - input and output reports.
     *
     * @param {HIDDevice} device -.
     * @returns {boolean} - True if descriptors have been parsed with success.
     */
    parseDeviceDescriptors(device: HIDDevice) {
        try {
            this.outputEventGenerators = {};

            if (!device?.collections) {
                logger.error('Undefined device collection');

                return false;
            }

            const telephonyCollection = this.findTelephonyCollectionInfo(device.collections);

            if (!telephonyCollection || Object.keys(telephonyCollection).length === 0) {
                logger.error('No telephony collection');

                return false;
            }

            if (telephonyCollection.inputReports) {
                if (!this.parseInputReports(telephonyCollection.inputReports)) {
                    logger.warn('parse inputReports failed');

                    return false;
                }
                logger.warn('parse inputReports success');

            }

            if (telephonyCollection.outputReports) {
                if (!this.parseOutputReports(telephonyCollection.outputReports)) {
                    logger.warn('parse outputReports failed');

                    return false;
                }
                logger.warn('parse outputReports success');

                return true;

            }

            logger.warn('parseDeviceDescriptors: returns false, end');

            return false;
        } catch (e) {
            logger.error(`parseDeviceDescriptors error:${JSON.stringify(e, null, '    ')}`);

            return false;
        }
    }

    /**
     * HandleInputReport.
     *
     * @param {HIDInputReportEvent} event -.
     * @returns {void} -.
     */
    handleInputReport(event: HIDInputReportEvent) {
        try {
            const { data, device, reportId } = event;

            if (reportId === 0) {
                logger.warn('handleInputReport: ignore invalid reportId');

                return;
            }

            const inputReport = this.deviceCommand.inputReport;

            logger.warn(`current inputReport:${JSON.stringify(inputReport, null, '    ')}, reporId: ${reportId}`);
            if (reportId !== inputReport.hookSwitch.reportId && reportId !== inputReport.phoneMute.reportId) {
                logger.warn('handleInputReport:ignore unknown reportId');

                return;
            }

            let hookStatusChange = false;
            let muteStatusChange = false;

            const reportData = new Uint8Array(data.buffer);
            const needReply = true;

            if (reportId === inputReport.hookSwitch.reportId) {
                const item = inputReport.hookSwitch;
                const byteIndex = Math.trunc(item.usageOffset / 8);
                const bitPosition = item.usageOffset % 8;
                // eslint-disable-next-line no-bitwise
                const usageOn = (data.getUint8(byteIndex) & (0x01 << bitPosition)) !== 0;

                logger.warn('recv hookSwitch ', usageOn ? HOOK_STATUS.OFF : HOOK_STATUS.ON);
                if (inputReport.hookSwitch.isAbsolute) {
                    if (this.deviceInfo.hookStatus === HOOK_STATUS.ON && usageOn) {
                        this.deviceInfo.hookStatus = HOOK_STATUS.OFF;
                        hookStatusChange = true;
                    } else if (this.deviceInfo.hookStatus === HOOK_STATUS.OFF && !usageOn) {
                        this.deviceInfo.hookStatus = HOOK_STATUS.ON;
                        hookStatusChange = true;
                    }
                } else if (usageOn) {
                    this.deviceInfo.hookStatus = this.deviceInfo.hookStatus === HOOK_STATUS.OFF
                        ? HOOK_STATUS.ON : HOOK_STATUS.OFF;
                    hookStatusChange = true;
                }
            }

            if (reportId === inputReport.phoneMute.reportId) {
                const item = inputReport.phoneMute;
                const byteIndex = Math.trunc(item.usageOffset / 8);
                const bitPosition = item.usageOffset % 8;
                // eslint-disable-next-line no-bitwise
                const usageOn = (data.getUint8(byteIndex) & (0x01 << bitPosition)) !== 0;

                logger.warn('recv phoneMute ', usageOn ? HOOK_STATUS.ON : HOOK_STATUS.OFF);
                if (inputReport.phoneMute.isAbsolute) {
                    if (this.deviceInfo.muted !== usageOn) {
                        this.deviceInfo.muted = usageOn;
                        muteStatusChange = true;
                    }
                } else if (usageOn) {
                    this.deviceInfo.muted = !this.deviceInfo.muted;
                    muteStatusChange = true;
                }
            }

            const inputReportData = {
                productName: device.productName,
                reportId: this.getHexByte(reportId),
                reportData,
                eventName: '',
                isMute: false,
                hookStatus: ''
            };

            if (hookStatusChange) {
                // Answer key state change
                inputReportData.eventName = INPUT_REPORT_EVENT_NAME.ON_DEVICE_HOOK_SWITCH;
                inputReportData.hookStatus = this.deviceInfo.hookStatus;
                logger.warn(`hook status change: ${this.deviceInfo.hookStatus}`);
            }

            if (muteStatusChange) {
                // Mute key state change
                inputReportData.eventName = INPUT_REPORT_EVENT_NAME.ON_DEVICE_MUTE_SWITCH;
                inputReportData.isMute = this.deviceInfo.muted;
                logger.warn(`mute status change: ${this.deviceInfo.muted}`);
            }

            const actionResult = this.extractActionResult(inputReportData);

            this.dispatchEvent(
                new CustomEvent(EVENT_TYPE.UPDATE_DEVICE, {
                    detail: {
                        actionResult,
                        deviceInfo: this.deviceInfo
                    }
                })
            );

            logger.warn(
                `hookStatusChange=${
                    hookStatusChange
                }, muteStatusChange=${
                    muteStatusChange
                }, needReply=${
                    needReply}`
            );
            if (needReply && (hookStatusChange || muteStatusChange)) {
                let newOffHook;

                if (this.deviceInfo.hookStatus === HOOK_STATUS.OFF) {
                    newOffHook = true;
                } else if (this.deviceInfo.hookStatus === HOOK_STATUS.ON) {
                    newOffHook = false;
                } else {
                    logger.warn('Invalid hook status');

                    return;
                }
                this.sendReplyReport(reportId, newOffHook, this.deviceInfo.muted);
            } else {
                logger.warn(`Not sending reply report: needReply ${needReply},
                hookStatusChange: ${hookStatusChange}, muteStatusChange: ${muteStatusChange}`);
            }
        } catch (e) {
            logger.error(e);
        }
    }

    /**
     * Extract action result.
     *
     * @private
     * @param {*} data -.
     * @returns {{eventName: string}} - EventName.
     */
    private extractActionResult(data: any) {
        switch (data.eventName) {
        case INPUT_REPORT_EVENT_NAME.ON_DEVICE_HOOK_SWITCH:
            return {
                eventName: data.hookStatus === HOOK_STATUS.ON
                    ? ACTION_HOOK_TYPE_NAME.HOOK_SWITCH_ON : ACTION_HOOK_TYPE_NAME.HOOK_SWITCH_OFF
            };
        case INPUT_REPORT_EVENT_NAME.ON_DEVICE_MUTE_SWITCH:
            return {
                eventName: data.isMute ? ACTION_HOOK_TYPE_NAME.MUTE_SWITCH_ON : ACTION_HOOK_TYPE_NAME.MUTE_SWITCH_OFF
            };
        case 'ondevicevolumechange':
            return {
                eventName: data.volumeStatus === 'up'
                    ? ACTION_HOOK_TYPE_NAME.VOLUME_CHANGE_UP : ACTION_HOOK_TYPE_NAME.VOLUME_CHANGE_DOWN
            };
        default:
            break;
        }
    }

    /**
     * Reset device state.
     *
     * @returns {void} -.
     */
    resetDeviceState() {
        if (!this.deviceInfo?.device || !this.deviceInfo?.device?.opened) {
            return;
        }

        this.deviceInfo.hookStatus = HOOK_STATUS.ON;
        this.deviceInfo.muted = false;
        this.deviceInfo.ring = false;
        this.deviceInfo.hold = false;

        this.sendDeviceReport({ command: COMMANDS.ON_HOOK });
        this.sendDeviceReport({ command: COMMANDS.MUTE_OFF });
    }

    /**
     * Parse input reports.
     *
     * @param {HIDReportInfo[]} inputReports -.
     * @returns {void} -.
     */
    private parseInputReports(inputReports: HIDReportInfo[]) {
        inputReports.forEach(report => {
            if (!report?.items?.length || report.reportId === undefined) {
                return;
            }

            let usageOffset = 0;

            report.items.forEach((item: HIDReportItem) => {
                if (
                    item.usages === undefined
                    || item.reportSize === undefined
                    || item.reportCount === undefined
                    || item.isAbsolute === undefined
                ) {
                    logger.warn('parseInputReports invalid parameters!');

                    return;
                }

                const reportSize = item.reportSize ?? 0;
                const reportId = report.reportId ?? 0;

                item.usages.forEach((usage: number, i: number) => {
                    switch (usage) {
                    case DEVICE_USAGE.hookSwitch.usageId:
                        this.deviceCommand.inputReport.hookSwitch = {
                            reportId,
                            usageOffset: usageOffset + (i * reportSize),
                            isAbsolute: item.isAbsolute ?? false
                        };
                        break;
                    case DEVICE_USAGE.phoneMute.usageId:
                        this.deviceCommand.inputReport.phoneMute = {
                            reportId,
                            usageOffset: usageOffset + (i * reportSize),
                            isAbsolute: item.isAbsolute ?? false
                        };
                        break;
                    default:
                        break;
                    }
                });

                usageOffset += item.reportCount * item.reportSize;
            });
        });

        if (!this.deviceCommand.inputReport.phoneMute || !this.deviceCommand.inputReport.hookSwitch) {
            logger.warn('parseInputReports - no phoneMute or hookSwitch. Skip. Returning false');

            return false;
        }

        return true;
    }

    /**
     * Parse output reports.
     *
     * @private
     * @param {HIDReportInfo[]} outputReports -.
     * @returns {void} -.
     */
    private parseOutputReports(outputReports: HIDReportInfo[]) {
        outputReports.forEach((report: HIDReportInfo) => {
            if (!report?.items?.length || report.reportId === undefined) {
                return;
            }

            let usageOffset = 0;
            const usageOffsetMap: Map<number, number> = new Map();

            report.items.forEach(item => {
                if (item.usages === undefined || item.reportSize === undefined || item.reportCount === undefined) {
                    logger.warn('parseOutputReports  invalid parameters!');

                    return;
                }

                const reportSize = item.reportSize ?? 0;
                const reportId = report.reportId ?? 0;

                item.usages.forEach((usage: number, i: number) => {
                    switch (usage) {
                    case DEVICE_USAGE.mute.usageId:
                        this.deviceCommand.outputReport.mute = {
                            reportId,
                            usageOffset: usageOffset + (i * reportSize)
                        };
                        usageOffsetMap.set(usage, usageOffset + (i * reportSize));
                        break;
                    case DEVICE_USAGE.offHook.usageId:
                        this.deviceCommand.outputReport.offHook = {
                            reportId,
                            usageOffset: usageOffset + (i * reportSize)
                        };
                        usageOffsetMap.set(usage, usageOffset + (i * reportSize));
                        break;
                    case DEVICE_USAGE.ring.usageId:
                        this.deviceCommand.outputReport.ring = {
                            reportId,
                            usageOffset: usageOffset + (i * reportSize)
                        };
                        usageOffsetMap.set(usage, usageOffset + (i * reportSize));
                        break;
                    case DEVICE_USAGE.hold.usageId:
                        this.deviceCommand.outputReport.hold = {
                            reportId,
                            usageOffset: usageOffset = i * reportSize
                        };
                        usageOffsetMap.set(usage, usageOffset + (i * reportSize));
                        break;
                    default:
                        break;
                    }
                });

                usageOffset += item.reportCount * item.reportSize;
            });

            const reportLength = usageOffset;

            for (const [ usage, offset ] of usageOffsetMap) {
                this.outputEventGenerators[usage] = (val: number) => {
                    const reportData = new Uint8Array(reportLength / 8);

                    if (offset >= 0 && val) {
                        const byteIndex = Math.trunc(offset / 8);
                        const bitPosition = offset % 8;

                        // eslint-disable-next-line no-bitwise
                        reportData[byteIndex] = 1 << bitPosition;
                    }

                    return reportData;
                };
            }
        });

        let hook, mute, ring;

        for (const item in this.outputEventGenerators) {
            if (Object.prototype.hasOwnProperty.call(this.outputEventGenerators, item)) {
                let newItem = this.getHexByte(item);

                newItem = `0x0${newItem}`;
                if (DEVICE_USAGE.mute.usageId === Number(newItem)) {
                    mute = this.outputEventGenerators[DEVICE_USAGE.mute.usageId];
                } else if (DEVICE_USAGE.offHook.usageId === Number(newItem)) {
                    hook = this.outputEventGenerators[DEVICE_USAGE.offHook.usageId];
                } else if (DEVICE_USAGE.ring.usageId === Number(newItem)) {
                    ring = this.outputEventGenerators[DEVICE_USAGE.ring.usageId];
                }
            }
        }
        if (!mute && !ring && !hook) {
            return false;
        }

        return true;
    }

    /**
     * Send device report.
     *
     * @param {{ command: string }} data -.
     * @returns {void} -.
     */
    async sendDeviceReport(data: { command: string; }) {
        if (!data?.command || !this.deviceInfo
            || !this.deviceInfo.device || !this.deviceInfo.device.opened || !this.isParseDescriptorsSuccess) {
            logger.warn('There are currently non-compliant conditions');

            return;
        }

        logger.warn(`sendDeviceReport data.command: ${data.command}`);

        if (data.command === COMMANDS.MUTE_ON || data.command === COMMANDS.MUTE_OFF) {
            if (!this.outputEventGenerators[DEVICE_USAGE.mute.usageId]) {
                logger.warn('current no parse mute event');

                return;
            }
        } else if (data.command === COMMANDS.ON_HOOK || data.command === COMMANDS.OFF_HOOK) {
            if (!this.outputEventGenerators[DEVICE_USAGE.offHook.usageId]) {
                logger.warn('current no parse offHook event');

                return;
            }
        } else if (data.command === COMMANDS.ON_RING || data.command === COMMANDS.OFF_RING) {
            if (!this.outputEventGenerators[DEVICE_USAGE.ring.usageId]) {
                logger.warn('current no parse ring event');

                return;
            }
        }

        let oldOffHook;
        let newOffHook;
        let newMuted;
        let newRing;
        let newHold;
        let offHookReport;
        let muteReport;
        let ringReport;
        let holdReport;
        let reportData = new Uint8Array();

        const reportId = this.matchReportId(data.command);

        if (reportId === 0) {
            logger.warn(`Unsupported command ${data.command}`);

            return;
        }

        /* keep old status. */
        const oldMuted = this.deviceInfo.muted;

        if (this.deviceInfo.hookStatus === HOOK_STATUS.OFF) {
            oldOffHook = true;
        } else if (this.deviceInfo.hookStatus === HOOK_STATUS.ON) {
            oldOffHook = false;
        } else {
            logger.warn('Invalid hook status');

            return;
        }

        const oldRing = this.deviceInfo.ring;
        const oldHold = this.deviceInfo.hold;

        logger.warn(
            `send device command: old_hook=${oldOffHook}, old_muted=${oldMuted}, old_ring=${oldRing}`
        );

        /* get new status. */
        switch (data.command) {
        case COMMANDS.MUTE_ON:
            newMuted = true;
            break;
        case COMMANDS.MUTE_OFF:
            newMuted = false;
            break;
        case COMMANDS.ON_HOOK:
            newOffHook = false;
            break;
        case COMMANDS.OFF_HOOK:
            newOffHook = true;
            break;
        case COMMANDS.ON_RING:
            newRing = true;
            break;
        case COMMANDS.OFF_RING:
            newRing = false;
            break;
        case COMMANDS.ON_HOLD:
            newHold = true;
            break;
        case COMMANDS.OFF_HOLD:
            newHold = false;
            break;
        default:
            logger.info(`Unknown command ${data.command}`);

            return;
        }
        logger.warn(
            `send device command: new_hook = ${newOffHook}, new_muted = ${newMuted},
             new_ring = ${newRing} new_hold = ${newHold}`
        );

        if (this.outputEventGenerators[DEVICE_USAGE.mute.usageId]) {
            if (newMuted === undefined) {
                muteReport = this.outputEventGenerators[DEVICE_USAGE.mute.usageId](oldMuted);
            } else {
                muteReport = this.outputEventGenerators[DEVICE_USAGE.mute.usageId](newMuted);
            }
        }

        if (this.outputEventGenerators[DEVICE_USAGE.offHook.usageId]) {
            if (newOffHook === undefined) {
                offHookReport = this.outputEventGenerators[DEVICE_USAGE.offHook.usageId](oldOffHook);
            } else {
                offHookReport = this.outputEventGenerators[DEVICE_USAGE.offHook.usageId](newOffHook);
            }
        }

        if (this.outputEventGenerators[DEVICE_USAGE.ring.usageId]) {
            if (newRing === undefined) {
                ringReport = this.outputEventGenerators[DEVICE_USAGE.ring.usageId](oldRing);
            } else {
                ringReport = this.outputEventGenerators[DEVICE_USAGE.ring.usageId](newRing);
            }
        }

        if (this.outputEventGenerators[DEVICE_USAGE.hold.usageId]) {
            holdReport = this.outputEventGenerators[DEVICE_USAGE.hold.usageId](oldHold);
        }

        if (reportId === this.deviceCommand.outputReport.mute.reportId) {
            reportData = new Uint8Array(muteReport);
        }

        if (reportId === this.deviceCommand.outputReport.offHook.reportId) {
            reportData = new Uint8Array(offHookReport);
        }

        if (reportId === this.deviceCommand.outputReport.ring.reportId) {
            reportData = new Uint8Array(ringReport);
        }

        if (reportId === this.deviceCommand.outputReport.hold.reportId) {
            reportData = new Uint8Array(holdReport);
        }

        logger.warn(`[sendDeviceReport] send device command (before call webhid API)
         ${data.command}: reportId=${reportId}, reportData=${reportData}`);
        logger.warn(`reportData is ${JSON.stringify(reportData, null, '    ')}`);
        await this.deviceInfo.device.sendReport(reportId, reportData);

        /* update new status. */
        this.updateDeviceStatus(data);
    }

    /**
     * Update device status.
     *
     * @private
     * @param {{ command: string; }} data -.
     * @returns {void}
     */
    private updateDeviceStatus(data: { command: string; }) {
        switch (data.command) {
        case COMMANDS.MUTE_ON:
            this.deviceInfo.muted = true;
            break;
        case COMMANDS.MUTE_OFF:
            this.deviceInfo.muted = false;
            break;
        case COMMANDS.ON_HOOK:
            this.deviceInfo.hookStatus = HOOK_STATUS.ON;
            break;
        case COMMANDS.OFF_HOOK:
            this.deviceInfo.hookStatus = HOOK_STATUS.OFF;
            break;
        case COMMANDS.ON_RING:
            this.deviceInfo.ring = true;
            break;
        case COMMANDS.OFF_RING:
            this.deviceInfo.ring = false;
            break;
        case COMMANDS.ON_HOLD:
            this.deviceInfo.hold = true;
            break;
        case 'offHold':
            this.deviceInfo.hold = false;
            break;
        default:
            logger.warn(`Unknown command ${data.command}`);
            break;
        }
        logger.warn(
            `[updateDeviceStatus] device status after send command: hook=${this.deviceInfo.hookStatus},
            muted=${this.deviceInfo.muted}, ring=${this.deviceInfo.ring}`
        );
    }

    /**
     * Math given command with known commands.
     *
     * @private
     * @param {string} command -.
     * @returns {number} ReportId.
     */
    private matchReportId(command: string) {
        switch (command) {
        case COMMANDS.MUTE_ON:
        case COMMANDS.MUTE_OFF:
            return this.deviceCommand.outputReport.mute.reportId;
        case COMMANDS.ON_HOOK:
        case COMMANDS.OFF_HOOK:
            return this.deviceCommand.outputReport.offHook.reportId;
        case COMMANDS.ON_RING:
        case COMMANDS.OFF_RING:
            return this.deviceCommand.outputReport.ring.reportId;
        case COMMANDS.ON_HOLD:
        case COMMANDS.OFF_HOLD:
            return this.deviceCommand.outputReport.hold.reportId;
        default:
            logger.info(`Unknown command ${command}`);

            return 0;
        }
    }

    /**
     * Send reply report to device.
     *
     * @param {number} inputReportId -.
     * @param {(string | boolean | undefined)} curOffHook -.
     * @param {(string | undefined)} curMuted -.
     * @returns {void} -.
     */
    private async sendReplyReport(
            inputReportId: number,
            curOffHook: string | boolean | undefined,
            curMuted: boolean | string | undefined
    ) {
        const reportId = this.retriveInputReportId(inputReportId);


        if (!this.deviceInfo?.device || !this.deviceInfo?.device?.opened) {
            logger.warn('[sendReplyReport] device is not opened or does not exist');

            return;
        }

        if (reportId === 0 || curOffHook === undefined || curMuted === undefined) {
            logger.warn(`[sendReplyReport] return, provided data not valid,
                reportId: ${reportId}, curOffHook: ${curOffHook}, curMuted: ${curMuted}`);

            return;
        }

        let reportData = new Uint8Array();
        let muteReport;
        let offHookReport;
        let ringReport;

        if (this.deviceCommand.outputReport.offHook.reportId === this.deviceCommand.outputReport.mute.reportId) {
            muteReport = this.outputEventGenerators[DEVICE_USAGE.mute.usageId](curMuted);
            offHookReport = this.outputEventGenerators[DEVICE_USAGE.offHook.usageId](curOffHook);
            reportData = new Uint8Array(offHookReport);
            for (const [ i, data ] of muteReport.entries()) {
                // eslint-disable-next-line no-bitwise
                reportData[i] |= data;
            }
        } else if (reportId === this.deviceCommand.outputReport.offHook.reportId) {
            offHookReport = this.outputEventGenerators[DEVICE_USAGE.offHook.usageId](curOffHook);
            reportData = new Uint8Array(offHookReport);
        } else if (reportId === this.deviceCommand.outputReport.mute.reportId) {
            muteReport = this.outputEventGenerators[DEVICE_USAGE.mute.usageId](curMuted);
            reportData = new Uint8Array(muteReport);
        } else if (reportId === this.deviceCommand.outputReport.ring.reportId) {
            ringReport = this.outputEventGenerators[DEVICE_USAGE.mute.usageId](curMuted);
            reportData = new Uint8Array(ringReport);
        }

        logger.warn(`[sendReplyReport] send device reply: reportId=${reportId}, reportData=${reportData}`);
        await this.deviceInfo.device.sendReport(reportId, reportData);
    }

    /**
     * Retrieve input report id.
     *
     * @private
     * @param {number} inputReportId -.
     * @returns {number} ReportId -.
     */
    private retriveInputReportId(inputReportId: number) {
        let reportId = 0;

        if (this.deviceCommand.outputReport.offHook.reportId === this.deviceCommand.outputReport.mute.reportId) {
            reportId = this.deviceCommand.outputReport.offHook.reportId;
        } else if (inputReportId === this.deviceCommand.inputReport.hookSwitch.reportId) {
            reportId = this.deviceCommand.outputReport.offHook.reportId;
        } else if (inputReportId === this.deviceCommand.inputReport.phoneMute.reportId) {
            reportId = this.deviceCommand.outputReport.mute.reportId;
        }

        return reportId;
    }

    /**
     * Get the hexadecimal bytes.
     *
     * @param {number|string} data -.
     * @returns {string}
     */
    getHexByte(data: number | string) {
        let hex = Number(data).toString(16);

        while (hex.length < 2) {
            hex = `0${hex}`;
        }

        return hex;
    }
}
