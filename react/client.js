export let client;

export const initClient = async () => {
    // eslint-disable-next-line new-cap
    client = await RpcAepp({
        name: 'Superhero-Jitsi',
        nodes: [ {
            name: 'mainnet',
            instance: await Node({
                url: nodeUrl,
                internalUrl: nodeUrl
            })
        } ],
        compilerUrl
    });
}