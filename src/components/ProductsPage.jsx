import {
  Page,
  Layout,
} from "@shopify/polaris";

import { useEffect, useState} from 'react';
import { collection, getDoc, doc, getDocs, query } from 'firebase/firestore';
import {
  Provider as AppBridgeProvider,
  useAppBridge,
} from "@shopify/app-bridge-react";
import { userLoggedInFetch } from "../App"
import { useCallback } from "react";



import { ProductsList } from "./ProductsList";
import db from '../firebase';


export function ProductsPage() {
  const [products, setProducts] = useState();
  const [warehouses, setWarehouses] = useState();

  const getProducts = async () => {
    const docRef = doc(db, "shops", "548380009");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const productCollectionRef = collection(db,"shops/548380009","products")
      const ProductDoc = await getDocs(productCollectionRef); //getting all docs for particular user in sub-collection(groups)
      const map = new Map();
      ProductDoc.forEach((product) => {
        map.set(product.id , new Map(Object. entries(product.data())));
      }); // loop through each document in group for each user so that we got nested data 
      map.forEach((product) => {
        let inventory = product.get("inventory");
        let warehouses = [];
        for (let i = 0; i < inventory.length ; ++i){
          warehouses.push(new Map(Object.entries(inventory[i])));
        }
        product.set("inventory",warehouses);
      });
      setProducts(map);
    } 
    else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }};

    const getWarehouses = async () => {
        const warehousesCollectionRef = collection(db,"warehouses")
        const WarehousesDoc = await getDocs(warehousesCollectionRef); //getting all docs for particular user in sub-collection(groups)
        const map = new Map();
        WarehousesDoc.forEach((item) => {
          map.set(item.id , new Map(Object.entries(item.data())));
        }); // loop through each document in group for each user so that we got nested data 
        setWarehouses(map);
      };

      const app = useAppBridge();
  const fetch = userLoggedInFetch(app);
  const updateProductCount = useCallback(async () => {
    const { count } = await fetch("/products").then((res) => res.json());
  }, []);

  useEffect(() => {
    getProducts();
    getWarehouses();
    updateProductCount();
  }, []);






  return (
    <Page fullWidth title="Products Overview">
      <Layout>
        <Layout.Section>
          {products && (
          <ProductsList products={products} warehouses={warehouses}/>
        )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
