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
      schemas: [movieServiceSchema, cosmicJsServiceSchema]
    });

    return {
      schema: schema,
      graphiql: true,
      context: { req, res }
    };
  })
);

const PORT = 4000;

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(PORT, () => {
  console.log(`Server available at ${PORT}`);
});
