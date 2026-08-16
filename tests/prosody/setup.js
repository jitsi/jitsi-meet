import path from 'path';
import { DockerComposeEnvironment, Wait } from 'testcontainers';
import { fileURLToPath } from 'url';

import { setContainer } from './helpers/container.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let environment;

export const mochaHooks = {
    async beforeAll() {
        environment = await new DockerComposeEnvironment(
            path.join(__dirname, 'docker'),
            'docker-compose.yml'
        )
            .withBuild()
            .withWaitStrategy('prosody-1', Wait.forListeningPorts())
            .up();

        setContainer(environment.getContainer('prosody-1'));
    },

    async afterAll() {
        if (environment) {
            await environment.down({ removeVolumes: true });
        }
    }
};
