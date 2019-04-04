import invariant from 'invariant';
import React, { useCallback, useContext, useState } from 'react';
import { ReactRelayContext, commitMutation } from 'react-relay';
import {
  MutationConfig as BaseMutationConfig,
  Environment,
  OperationBase,
} from 'relay-runtime';

import { Omit, WithOptionalFields } from './typeHelpers';

export type MutationState<T extends OperationBase> = {
  loading: boolean;
  data: T['response'] | null;
  error?: Error | null;
};

type MutationConfig<T extends OperationBase> = WithOptionalFields<
  Omit<BaseMutationConfig<T>, 'mutation'>,
  'variables'
>;

export type Mutate<T extends OperationBase> = (
  config?: Partial<MutationConfig<T>>,
) => Promise<T['response']>;

export function useMutation<T extends OperationBase>(
  mutation: BaseMutationConfig<T>['mutation'],
  userConfig: MutationConfig<T> = {},
  /** if not provided, the context environment will be used. */
  environment?: Environment,
): [Mutate<T>, MutationState<T>] {
  const [state, setState] = useState<MutationState<T>>({
    loading: false,
    data: null,
    error: null,
  });

  const relayContext = useContext(ReactRelayContext);
  const resolvedEnvironment = environment || relayContext.environment;
  const {
    configs,
    variables,
    uploadables,
    onCompleted,
    onError,
    optimisticUpdater,
    optimisticResponse,
    updater,
  } = userConfig;

  const mutate = useCallback(
    (config?: Partial<MutationConfig<T>>) => {
      const mergedConfig = {
        configs,
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
        function handleError(error: any) {
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
        }
        commitMutation(resolvedEnvironment, {
          ...mergedConfig,
          mutation,
          variables: mergedConfig.variables!,
          onCompleted: (response, error) => {
            if (error) {
              handleError(error);
              return;
            }

            setState({
              loading: false,
              data: response,
              error: null,
            });

            resolve(response);
            if (mergedConfig.onCompleted) {
              mergedConfig.onCompleted(response, undefined);
            }
          },
          onError: handleError,
        });
      });
    },
    [
      resolvedEnvironment,
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

export type MutationProps<T extends OperationBase> = MutationConfig<T> & {
  children: (mutate: Mutate<T>, state: MutationState<T>) => React.ReactNode;
  mutation: BaseMutationConfig<T>['mutation'];
  /** if not provided, the context environment will be used. */
  environment?: Environment;
};

export function Mutation<T extends OperationBase>({
  children,
  mutation,
  environment,
  ...config
}: MutationProps<T>) {
  const [mutate, state] = useMutation(mutation, config, environment);
  return children(mutate, state) as React.ReactElement<any>;
}
