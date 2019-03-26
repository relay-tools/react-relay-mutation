import { createFetch } from 'relay-local-schema';
import { Environment, Network, RecordSource, Store } from 'relay-runtime';

import schema from './fixtures/schema';

export function createFakeFetch() {
  return createFetch({ schema });
}

export function timeout(delay: number) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

export function createSyncEnvironment(
  fetch = createFakeFetch(),
  records: any,
) {
  return new Environment({
    network: Network.create(fetch),
    store: new Store(new RecordSource(records)),
  });
}

export function createEnvironment(fetch = createFakeFetch(), records?: any) {
  return createSyncEnvironment(async (...args: any) => {
    // // Delay field resolution to exercise async data fetching logic.
    await timeout(5);
    return fetch(...args);
  }, records);
}
