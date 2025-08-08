import { IContext } from './helpers/types';
import { ITestProperties } from './helpers/TestProperties';

declare global {
    const ctx: IContext;
    const testProperties: ITestProperties;
}
