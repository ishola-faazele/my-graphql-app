import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

// Create an HTTP link to your GraphQL server
const httpLink = new HttpLink({
  uri: "https://your-graph-endpoint.com/graphql", // Replace with your GraphQL endpoint
});

// Create an Apollo Client instance
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
