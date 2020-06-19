import { RpcAepp, Node } from '@aeternity/aepp-sdk/es';

export let client;

export const initClient = async () => {

    const nodeUrl = 'https://mainnet.aeternity.io';
    const compilerUrl = 'https://latest.compiler.aepps.com';

    // eslint-disable-next-line new-cap
    client = await RpcAepp({
        name: 'Superhero-league',
        nodes: [ {
            name: 'mainnet',
            instance: await Node({
                url: nodeUrl,
                internalUrl: nodeUrl
            })
        } ],
        compilerUrl
    });

    return;
};
