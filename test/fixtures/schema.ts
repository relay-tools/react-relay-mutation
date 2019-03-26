import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';

const doStuff = mutationWithClientMutationId({
  name: 'DoStuff',
  inputFields: {
    name: { type: GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    result: { type: GraphQLString },
  },

  mutateAndGetPayload: ({ name }) => {
    return {
      result: `you did it ${name}`
    }
  },
});

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    doStuff
  },
});

const query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    // XXX: relay-compiler chokes unless at least one type has an ID.
    dummy: { type: GraphQLID }
  },
});

export default new GraphQLSchema({ query: query, mutation });
