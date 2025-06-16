import { IReduxState, IStore } from '../../app/types';

export type IStateful = (() => IReduxState) | IStore | IReduxState;
