import { makeExecutableSchema } from 'graphql-tools';
import gql from 'graphql-tag';

interface Movie {
  id: number;
  title: string;
  releaseDate: number;
}

const movies: Movie[] = [
  { id: 1, title: 'American Pie 2', releaseDate: 1980 },
  { id: 2, title: 'Iron Man', releaseDate: 2001 }
];

const typeDefs = gql`
  type Query {
    movies: [Movie]
    movie(movieId: ID!): Movie
  }

  type Movie {
    id: ID
    title: String
    releaseDate: Int
  }

`;

const resolvers = {
  Query: {
    movies: (): Movie[] => movies,
    movie(parent, args, context, info) {
      return movies.find((movie: Movie) => movie.id == args.movieId);
    }
  }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

export default schema;
