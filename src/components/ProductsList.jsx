import {
  Page,
  Card,
  DataTable,
} from "@shopify/polaris";
import { useEffect} from 'react';
import { doc, query, collection, where, getDoc } from "firebase/firestore";
import db from '../firebase';


export function ProductsList({products}) {


    async function makeRow(item){
      //const q = query(
        //collection(db, "warehouses"),
        //where("warehouse", "==", categoryDocRef)
      //);
      let docRef = doc(db, "warehouses", new Map(Object. entries(item.get('inventory')[0])).get('warehouse'));
      let docSnap = await getDoc(docRef); 
      let row = [item.get('sku'), item.get('title'), new Map(Object. entries(docSnap.data())).get('adress'), new Map(Object. entries(item.get('inventory')[0])).get('inventory_quantity')];
      rows.push(row);
      console.log(rows);
      if(new Map(Object. entries(item.get('inventory'))).size > 1){
        makeRowWarehouse(Object.values(item.get('inventory')))
      };
    };
    async function makeRowWarehouse(item){
      for (let i = 1; i < new Map(Object.entries(Object.values(item))).size; i++){
        let docRef = doc(db, "warehouses", new Map(Object.entries(Object.values(item)[i])).get('warehouse'));
        let docSnap = await getDoc(docRef); 
        rows.push(["", "", new Map(Object. entries(docSnap.data())).get('adress'), new Map(Object.entries(Object.values(item)[i])).get('inventory_quantity')]);
      } 
      //console.log(rows);
    };


    let rows = [];
    
    useEffect(() => {
      products.forEach(item => {
        makeRow(item);
      });
    }, []);

    return (
        <Card>
          <DataTable
            columnContentTypes={[
              'text',
              'text',
              'text',
              'numeric',
            ]}
            headings={[
              'SKU Number',
              'Name',
              'Warehouse',
              'Stock',
            ]}
            rows={rows}
            hasZebraStripingOnData = {true}
            increasedTableDensity = {true}
          />
        </Card>
    );
  }
