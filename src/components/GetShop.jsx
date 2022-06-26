import React, { useEffect, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { LOAD_STORE } from "../GraphQL/Queries";

function GetShop() {
  const { error, loading, data } = useQuery(LOAD_STORE);
  const [store, setStore] = useState([]);
  useEffect(() => {
    if (data) {
        setStore(data.shop);
    }
  }, [data]);

  return (
    <div>
      {console.log(store)}
    </div>
  );
}

export default GetShop;