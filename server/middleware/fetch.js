import {
    useAppBridge,
  } from "@shopify/app-bridge-react";
  import { authenticatedFetch } from "@shopify/app-bridge-utils";


  function userLoggedInFetch(app) {
    const fetchFunction = authenticatedFetch(app);
  
    return async (uri, options) => {
      const response = await fetchFunction(uri, options);
  
      if (
        response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1"
      ) {
        const authUrlHeader = response.headers.get(
          "X-Shopify-API-Request-Failure-Reauthorize-Url"
        );
  
        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/auth`);
        return null;
      }
  
      return response;
    };
  };
  
  
  
  export default function getProducts(){
        const app = useAppBridge();
        const fetch = userLoggedInFetch(app);
        let products  = null;
        fetch("/products").then((res) => res.json()).then(data => console.log(data));
     }; 

