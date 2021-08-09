export * from './functions';
export { default as MiddlewareRegistry } from './MiddlewareRegistry';
export { default as PersistenceRegistry } from './PersistenceRegistry';
export { default as ReducerRegistry } from './ReducerRegistry';
export { default as StateListenerRegistry } from './StateListenerRegistry';

// /**
//  *
//  */
// MiddlewareRegistry.register(() => next => action => {
//     if (performance.mark === undefined) {
//         return next(action);
//     }
//     performance.mark(`${action.type}_start`);

//     const result = next(action);

//     performance.mark(`${action.type}_end`);
//     performance.measure(
//       `${action.type}`,
//       `${action.type}_start`,
//       `${action.type}_end`,
//     );

//     return result;
// });
