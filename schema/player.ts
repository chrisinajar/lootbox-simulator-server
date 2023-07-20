import gql from 'graphql-tag';

// export a basic query for player object
export default gql`
  type Query {
    player: Int
  }
`;
