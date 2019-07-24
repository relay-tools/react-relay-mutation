import invariant from 'invariant';
import React, { useCallback, useContext, useState } from 'react';
import { ReactRelayContext, commitMutation } from 'react-relay';
import {
  MutationConfig as BaseMutationConfig,
  Environment,
  OperationType,
} from 'relay-runtime';
import useMounted from '@restart/hooks/useMounted';

export type MutationState<TOperation extends OperationType> = {
  loading: boolean;
  data: TOperation['response'] | null;
  error: Error | null;
};

export type MutationNode<
  TOperation extends OperationType
> = BaseMutationConfig<TOperation>['mutation'];

export type MutationConfig<TOperation extends OperationType> = Partial<
  Omit<BaseMutationConfig<TOperation>, 'mutation' | 'onCompleted'>
> & {
  onCompleted?(response: TOperation['response']): void;
};

export type Mutate<TOperation extends OperationType> = (
  config?: Partial<MutationConfig<TOperation>>,
) => Promise<TOperation['response']>;

export function useMutation<TOperation extends OperationType>(
  mutation: MutationNode<TOperation>,
  userConfig: MutationConfig<TOperation> = {},
  /** if not provided, the context environment will be used. */
  environment?: Environment,
): [Mutate<TOperation>, MutationState<TOperation>] {
  const [state, setState] = useState<MutationState<TOperation>>({
    loading: false,
    data: null,
    error: null,
  });

  const isMounted = useMounted();

  const relayContext = useContext(ReactRelayContext);
  const resolvedEnvironment = environment || relayContext!.environment;
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

  const mutate: Mutate<TOperation> = useCallback(
    config => {
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
          if (isMounted()) {
            setState({
              loading: false,
              data: null,
              error,
            });
          }

          if (mergedConfig.onError) {
            mergedConfig.onError(error);
            resolve();
          } else {
            reject(error);
          }
        }

        commitMutation(resolvedEnvironment, {
          ...mergedConfig,
          mutation,
          variables: mergedConfig.variables!,
          onCompleted: (response, errors) => {
            if (errors) {
              // FIXME: This isn't right. onError expects a single error.
              handleError(errors);
              return;
            }

            if (isMounted()) {
              setState({
                loading: false,
                data: response,
                error: null,
              });
            }

            if (mergedConfig.onCompleted) {
              mergedConfig.onCompleted(response);
            }
            resolve(response);
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
      isMounted,
    ],
  );

  return [mutate, state];
}

export type MutationProps<TOperation extends OperationType> = MutationConfig<
  TOperation
> & {
  children: (
    mutate: Mutate<TOperation>,
    state: MutationState<TOperation>,
  ) => React.ReactNode;
  mutation: MutationNode<TOperation>;
  /** if not provided, the context environment will be used. */
  environment?: Environment;
};

export function Mutation<TOperation extends OperationType>({
  children,
  mutation,
  environment,
  ...config
}: MutationProps<TOperation>) {
  const [mutate, state] = useMutation(mutation, config, environment);
  return children(mutate, state) as React.ReactElement;
}
