import { IReduxState, IStore } from '../../app/types';

export type IStateful = Function | IStore | IReduxState;
