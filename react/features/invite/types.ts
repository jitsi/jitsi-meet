import { MultiSelectItem } from '../base/ui/components/types';

export interface IInvitee {
    address: string;
    allowed?: boolean;
    id?: string;
    name?: string;
    number: string;
    originalEntry?: string;
    phone?: string;
    showCountryCodeReminder?: boolean;
    type: string;
    user_id?: string;
}

export type InviteSelectItem = MultiSelectItem & {
    filterValues?: string[];
    item: IInvitee;
    tag?: any;
};
