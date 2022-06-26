import { gql } from "@apollo/client";

export const LOAD_STORE = gql`
  query {
    shop {
    name
    currencyCode
    checkoutApiSupported
    taxesIncluded
    }
  }
`;
