import {
  Page,
  Card,
  DataTable,
} from "@shopify/polaris";
import { useEffect, useState} from 'react';
import { doc, query, collection, where, getDoc } from "firebase/firestore";
import db from '../firebase';
import { ProvidedRequiredArgumentsOnDirectivesRule } from "graphql/validation/rules/ProvidedRequiredArgumentsRule";


export function ProductsList({products, warehouses}) {

  const [table, setTable] = useState([]);

    function populateTable(){
      let rows = [];
      let row = [];
      let productSKU = "";
      products.forEach((product) => {
        product.get('inventory').forEach((inventory)=>{
          if(productSKU != product.get('sku')){
            row = [product.get('sku'), product.get('title'), warehouses.get(inventory.get('warehouse')).get('adress'), inventory.get('inventory_quantity')];
            productSKU = product.get('sku');
          }
          else{
            row = [" ", " ", warehouses.get(inventory.get('warehouse')).get('adress'), inventory.get('inventory_quantity')];
          }
          rows.push(row);
        });
      }); 
      setTable(rows)
    };

    async function makeRow(item){
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
    
    
    useEffect(() => {
      populateTable();
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
            rows={table}
            hasZebraStripingOnData = {true}
            increasedTableDensity = {true}
          />
        </Card>
    );
  }
