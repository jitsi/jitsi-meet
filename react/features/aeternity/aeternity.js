import BigNumber from 'bignumber.js';
import TIPPING_INTERFACE from 'superhero-utls/src/contracts/TippingInterface.aes';

// base/util/createDeepLinkUrl
import { client } from '../../client';

export const URLS = {
    SUPER: 'https://superhero.com',
    RAENDOM: 'https://raendom-backend.z52da5wt.xyz'
};
export const CONTRACT_ADDRESS = 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z';

export const aeternity = {
    contract: null,
    async initTippingContractIfNeeded(): void {
        if (!client) {
            throw new Error('Init sdk first');
        }
        if (this.contract) {
            return;
        }

        this.contract = await client.getContractInstance(TIPPING_INTERFACE, { contractAddress: CONTRACT_ADDRESS });
    },
    async tip(url, title, amount): Promise {
        return this.initTippingContractIfNeeded().then(() => this.contract.methods.tip(url, title, { amount }));
    },
    util: {
        aeToAtoms(ae) {
            return (new BigNumber(ae)).times(new BigNumber(1000000000000000000));
        }
    }
};
