import {
    IconRecordAccount,
    IconRecordContact,
    IconRecordLead,
    IconRecordOpportunity
} from '../base/icons/svg';

export const NOTES_MAX_LENGTH = 255;

export const NOTES_LINES = 4;

export const CONTENT_HEIGHT_OFFSET = 200;

export const LIST_HEIGHT_OFFSET = 250;

export const RECORD_TYPE: {
    [key: string]: {
        icon?: Function;
        label: string;
    };
} = {
    ACCOUNT: {
        label: 'record.type.account',
        icon: IconRecordAccount
    },
    CONTACT: {
        label: 'record.type.contact',
        icon: IconRecordContact
    },
    LEAD: {
        label: 'record.type.lead',
        icon: IconRecordLead
    },
    OPPORTUNITY: {
        label: 'record.type.opportunity',
        icon: IconRecordOpportunity
    },
    OWNER: {
        label: 'record.type.owner'
    }
};
