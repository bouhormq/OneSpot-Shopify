import {
  Page,
  Layout,
} from "@shopify/polaris";

import { useEffect, useState} from 'react';
import { collection, getDoc, doc, getDocs, query } from 'firebase/firestore';



import { ProductsList } from "./ProductsList";
import db from '../firebase';


export function ProductsPage() {
  const [products, setProducts] = useState();

  const getProducts = async () => {
    const docRef = doc(db, "shops", "548380009");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const productCollectionRef = collection(db,"shops/548380009","products")
      const ProductDoc = await getDocs(productCollectionRef); //getting all docs for particular user in sub-collection(groups)
      const map = new Map();
      ProductDoc.forEach((item) => {
        map.set(item.id , new Map(Object. entries(item.data())));
        setProducts(map);
      }
      ); // loop through each document in group for each user so that we got nested data 
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
  };
    useEffect(() => {
      getProducts();
    }, []);


  return (
    <Page fullWidth title="Products Overview">
      <Layout>
        <Layout.Section>
          {products && (
          <ProductsList products={products}/>
        )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
