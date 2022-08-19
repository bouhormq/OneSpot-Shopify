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

export const LOAD_STORE_DUPLICATE = gql`
  query product {
    product @rest(type: "product", path: "") {
      if
    }
  }
`;