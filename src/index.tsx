import invariant from 'invariant';
import React, { useCallback, useContext, useState } from 'react';
import { ReactRelayContext, commitMutation } from 'react-relay';
import { MutationConfig, OperationBase } from 'relay-runtime';

import { Omit, WithOptionalFields } from './typeHelpers';

export type MutationState<T extends OperationBase> = {
  loading: boolean;
  data: T['response'] | null;
  error?: Error | null;
};

export type Mutate<T extends OperationBase> = (
  config?: Partial<MutationConfig<T>>,
) => void;

type MutationConfigWithOptionalVariables<
  T extends OperationBase
> = WithOptionalFields<MutationConfig<T>, 'variables'>;

export function useMutation<T extends OperationBase>(
  userConfig: MutationConfigWithOptionalVariables<T>,
): [Mutate<T>, MutationState<T>] {
  const [state, setState] = useState<MutationState<T>>({
    loading: false,
    data: null,
    error: null,
  });

  const { environment } = useContext(ReactRelayContext);
  const {
    configs,
    mutation,
    variables,
    uploadables,
    onCompleted,
    onError,
    optimisticUpdater,
    optimisticResponse,
    updater,
  } = userConfig;

  const mutate = useCallback(
    (config?: Partial<Omit<MutationConfig<T>, 'mutation'>>) => {
      const mergedConfig = {
        configs,
        mutation,
        variables,
        uploadables,
        onCompleted,
        onError,
        optimisticUpdater,
        optimisticResponse,
        updater,
        ...config,
      };

      invariant(mergedConfig.variables, 'you must specify variables');

      setState({
        loading: true,
        data: null,
        error: null,
      });

      return new Promise((resolve, reject) => {
        commitMutation(environment, {
          ...mergedConfig,
          variables: mergedConfig.variables!,
          onCompleted: (response, error) => {
            invariant(!error, 'mutation unexpectedly completed with error');

            setState({
              loading: false,
              data: response,
              error: null,
            });

            if (mergedConfig.onCompleted) {
              mergedConfig.onCompleted(response, undefined);
            } else {
              resolve(response);
            }
          },
          onError: error => {
            setState({
              loading: false,
              data: null,
              error,
            });

            if (!mergedConfig.onError) {
              reject(error);
            } else {
              mergedConfig.onError(error);
            }
          },
        });
      });
    },
    [
      environment,
      configs,
      mutation,
      variables,
      uploadables,
      onCompleted,
      onError,
      optimisticUpdater,
      optimisticResponse,
      updater,
    ],
  );

  return [mutate, state];
}

export type MutationProps<
  T extends OperationBase
> = MutationConfigWithOptionalVariables<T> & {
  children: (mutate: Mutate<T>, state: MutationState<T>) => React.ReactNode;
};

export default function Mutation<T extends OperationBase>({
  children,
  ...rest
}: MutationProps<T>) {
  const [mutate, state] = useMutation(rest);
  return children(mutate, state) as React.ReactElement<any>;
}
