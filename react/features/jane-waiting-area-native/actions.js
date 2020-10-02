import {
    ENABLE_JANE_WAITING_AREA_PAGE
} from './actionTypes';

export function enableJaneWaitingAreaPage(enableJaneWaitingAreaPage: ?boolean) {
    return {
        type: ENABLE_JANE_WAITING_AREA_PAGE,
        enableJaneWaitingAreaPage
    };
}

