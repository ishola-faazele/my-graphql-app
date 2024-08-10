import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

// Create an HTTP link to your GraphQL server
const httpLink = new HttpLink({
  uri: "https://api.studio.thegraph.com/query/84868/analytics-usdt/version/latest", // Replace with your GraphQL endpoint
});

// Create an Apollo Client instance
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
