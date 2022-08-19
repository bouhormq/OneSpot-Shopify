import React, { useEffect, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { LOAD_STORE_DUPLICATE } from "../GraphQL/Queries";

function GetShopDuplicate() {
  const { error, loading, data } = useQuery(LOAD_STORE_DUPLICATE);
  const [store, setStore] = useState([]);
  useEffect(() => {
    if (data) {
        setStore(data.product);
    }
  }, [data]);

  return (
    <div>
      {console.log(store)}
    </div>
  );
}

export default GetShopDuplicate;