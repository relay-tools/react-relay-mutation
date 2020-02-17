import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { graphql } from 'react-relay';
import { Environment } from 'relay-runtime';

import { Mutation, useMutation } from '../src';
import { indexTestMutation } from './__generated__/indexTestMutation.graphql';
import { createEnvironment, timeout } from './helpers';

Enzyme.configure({ adapter: new Adapter() });

let environment: Environment;

beforeEach(() => {
  environment = createEnvironment();
});

const mutation = graphql`
  mutation indexTestMutation($input: DoStuffInput!) {
    doStuff(input: $input) {
      result
    }
  }
`;

describe('render prop', () => {
  it('should fire onCompleted', async () => {
    const renderedStates: any[] = [];
    const onCompleted = jest.fn();
    const onError = jest.fn();

    const element = shallow(
      <Mutation<indexTestMutation>
        mutation={mutation}
        environment={environment}
        variables={{ input: { name: 'Mr. Foo' } }}
        onCompleted={onCompleted}
        onError={onError}
      >
        {(mutate, mutationState) => {
          renderedStates.push(mutationState);
          return (
            <button type="button" onClick={() => mutate()}>
              click
            </button>
          );
        }}
      </Mutation>,
    );

    element.find('button').simulate('click');

    await timeout(10);

    expect(onCompleted.mock.calls).toMatchSnapshot('onCompleted');
    expect(onError.mock.calls).toMatchSnapshot('onError');
    expect(renderedStates).toMatchSnapshot('state');
  });

  it('should fire onError', async () => {
    const onCompleted = jest.fn();
    const onError = jest.fn();
    const renderedStates: any[] = [];

    const element = shallow(
      <Mutation<indexTestMutation>
        mutation={mutation}
        environment={environment}
        variables={{ wrongInput: 1 } as any}
        onCompleted={onCompleted}
        onError={onError}
      >
        {(mutate, mutationState) => {
          renderedStates.push(mutationState);
          return (
            <button type="button" onClick={() => mutate()}>
              click
            </button>
          );
        }}
      </Mutation>,
    );

    element.find('button').simulate('click');

    await timeout(10);

    expect(onCompleted.mock.calls).toMatchSnapshot('onCompleted');
    expect(onError.mock.calls).toMatchSnapshot('onError');
    expect(renderedStates).toMatchSnapshot('state');
  });
});

describe('hook', () => {
  it('should work', async () => {
    const onCompleted = jest.fn();
    const onError = jest.fn();
    const renderedStates: any[] = [];

    const Component = () => {
      const [mutate, mutationState] = useMutation<indexTestMutation>(
        mutation,
        { onCompleted, onError },
        environment,
      );
      renderedStates.push(mutationState);

      return (
        <button
          type="button"
          onClick={() =>
            mutate({
              variables: { input: { name: 'Mr. Bar' } },
            })
          }
        >
          click me
        </button>
      );
    };

    const element = shallow(<Component />);

    element.find('button').simulate('click');

    await timeout(10);

    expect(onCompleted.mock.calls).toMatchSnapshot('onCompleted');
    expect(onError.mock.calls).toMatchSnapshot('onError');
    expect(renderedStates).toMatchSnapshot('state');
  });

  it('should succeed with promises', async () => {
    let called = false;

    const Component = () => {
      const [mutate] = useMutation<indexTestMutation>(
        mutation,
        {},
        environment,
      );

      return (
        <button
          type="button"
          onClick={async () => {
            const result = await mutate({
              variables: { input: { name: 'Mr. Bar' } },
            });
            expect(result).toMatchSnapshot();
            called = true;
          }}
        >
          click me
        </button>
      );
    };

    const element = shallow(<Component />);

    element.find('button').simulate('click');

    await timeout(10);

    expect(called).toBe(true);
  });

  it('should fail with promises', async () => {
    let called = false;

    const Component = () => {
      const [mutate] = useMutation<indexTestMutation>(
        mutation,
        {},
        environment,
      );

      return (
        <button
          type="button"
          onClick={async () => {
            try {
              await mutate({
                variables: { wrongInput: 1 } as any,
              });
            } catch (e) {
              expect(e).toMatchSnapshot();
              called = true;
            }
          }}
        >
          click me
        </button>
      );
    };

    const element = shallow(<Component />);

    element.find('button').simulate('click');

    await timeout(10);

    expect(called).toBe(true);
  });

  it('should resolve promise on error when onError is set', async () => {
    let called = false;

    const Component = () => {
      const [mutate] = useMutation<indexTestMutation>(
        mutation,
        {
          onError: jest.fn(),
        },
        environment,
      );

      return (
        <button
          type="button"
          onClick={async () => {
            const result = await mutate({
              variables: { wrongInput: 1 } as any,
            });
            expect(result).toMatchSnapshot();
            called = true;
          }}
        >
          click me
        </button>
      );
    };

    const element = shallow(<Component />);

    element.find('button').simulate('click');

    await timeout(10);

    expect(called).toBe(true);
  });
});
