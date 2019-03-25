import { Context } from 'react';
import 'react-relay';
import { CRelayContext } from 'relay-runtime';

declare module 'react-relay' {
  export const ReactRelayContext: Context<CRelayContext>;
}
