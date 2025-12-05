import { IStore } from '../../../app/types';
import { showErrorNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../../../notifications/constants';
import operatingSystemService from './operating-system.service';

const INTERNXT_BASE_URL = 'https://internxt.com';

async function getDownloadAppUrl(): Promise<string | null> {
    const fetchDownloadResponse = await fetch(`${INTERNXT_BASE_URL}/api/download`, {
        method: 'GET',
    });

    const response = await fetchDownloadResponse.json();

    switch (operatingSystemService.getOperatingSystem()) {
        case 'Linux':
        case 'UNIX':
            return response.platforms.Linux ?? `${INTERNXT_BASE_URL}/downloads/drive.deb`;
        case 'Windows':
            return response.platforms.Windows ?? `${INTERNXT_BASE_URL}/downloads/drive.exe`;
        case 'macOS':
            return response.platforms.MacOS ?? `${INTERNXT_BASE_URL}/downloads/drive.dmg`;
        default:
            return null;
    }
}

async function openDownloadAppUrl(dispatch: IStore["dispatch"], translate: (key: string, props?: Record<string, unknown>) => string) {
    const download = await getDownloadAppUrl();
    if (download) {
        window.open(download, '_self');
    } else {
        dispatch(showErrorNotification({
            description: translate('errors.downloadingDesktopApp'),
            appearance: NOTIFICATION_TYPE.ERROR
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
    }
}

const desktopService = {
    getDownloadAppUrl,
    openDownloadAppUrl,
};

export default desktopService;