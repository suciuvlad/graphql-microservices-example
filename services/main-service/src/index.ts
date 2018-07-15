import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import {
  makeRemoteExecutableSchema,
  mergeSchemas,
  introspectSchema
} from 'graphql-tools';
import { createHttpLink } from 'apollo-link-http';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { ApolloEngine } from 'apollo-engine';

const app = express();

app.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(async (req, res) => {
    const movieServiceLink = createHttpLink({
      uri: `http://localhost:3000/graphql`,
      fetch
    });

    const cosmicJsServiceLink = createHttpLink({
      uri: `https://graphql.cosmicjs.com/v1`,
      fetch
    });

    const createCosmicJsServiceSchema = async () => {
      const schema = await introspectSchema(cosmicJsServiceLink);

      return makeRemoteExecutableSchema({
        schema,
        link: cosmicJsServiceLink
      });
    };

    const createMovieServiceSchema = async () => {
      const schema = await introspectSchema(movieServiceLink);

      return makeRemoteExecutableSchema({
        schema,
        link: movieServiceLink
      });
    };

    const movieServiceSchema = await createMovieServiceSchema();
    const cosmicJsServiceSchema = await createCosmicJsServiceSchema();

    const schema = mergeSchemas({
      schemas: [movieServiceSchema, cosmicJsServiceSchema],
      resolvers: {
        Query: {
          movies(parent, args, context, info) {
            info.cacheControl.setCacheHint({ maxAge: 1000 });
            return info.mergeInfo.delegateToSchema({
              fieldName: 'movies',
              schema: movieServiceSchema,
              operation: 'query',
              context,
              info
            });
          }
        }
      }
    });

    return {
      schema: schema,
      graphiql: true,
      tracing: true,
      cacheControl: {
        defaultMaxAge: 3500
      },
      context: { req, res }
    };
  })
);

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

const engine = new ApolloEngine({
  apiKey: 'service:microservices-example:-kee_qJAX8UKDLPjI7JVjw',
  // Instruct engine to keep the extensions
  frontends: [
    {
      extensions: {
        strip: ['tracing']
      }
    }
  ]
});

engine.listen({
  port: 4000,
  expressApp: app
});
