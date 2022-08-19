// @ts-check
import {
  resolve
} from "path";
import express from "express";
import cookieParser from "cookie-parser";
import {
  Shopify,
  ApiVersion
} from "@shopify/shopify-api";
import "dotenv/config";

import applyAuthMiddleware from "./middleware/auth.js";
// @ts-ignore
import getProducts from "./middleware/fetch.js"
import verifyRequest from "./middleware/verify-request.js";
import FirebaseSessionHandler from "./middleware/firebase-session.js";
import db from '../src/firebase.js';
import {
  // @ts-ignore
  collection,
  // @ts-ignore
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
// @ts-ignore
import {
  stringify
} from "querystring";
import axios from "axios";


const USE_ONLINE_TOKENS = false;
const TOP_LEVEL_OAUTH_COOKIE = "shopify_top_level_oauth";

const PORT = parseInt(process.env.PORT || "8081", 10);
const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;


const sessionHandler = new FirebaseSessionHandler();
Shopify.Context.initialize({
  // @ts-ignore
  API_KEY: process.env.SHOPIFY_API_KEY,
  // @ts-ignore
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  // @ts-ignore
  SCOPES: process.env.SCOPES.split(","),
  // @ts-ignore
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.April22,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
    sessionHandler.storeCallback,
    sessionHandler.loadCallback,
    sessionHandler.deleteCallback
  ),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

async function updateOdersDB(order,shop, fulfillment_id, location_id){
  await setDoc(doc(db, "orders", shop + "-" + order.order_number), {
    "fulfillment_id": fulfillment_id,
    "id": order.id,
    "shop":shop,
    "admin_graphql_api_id": order.admin_graphql_api_id,
    "cancel_reason": order.cancel_reason,
    "cancelled_at": order.cancelled_at,
    "checkout_id": order.checkout_id,
    "closed_at": order.closed_at,
    "confirmed": order.confirmed,
    "contact_email": order.contact_email,
    "created_at": order.created_at,
    "delivery_at": new Date(new Date(order.created_at).setMinutes(new Date(order.created_at).getMinutes() + 30)).toLocaleString("sv", { timeZone: "Europe/Berlin"}),
    "currency": order.currency,
    "email": order.email,
    "fulfillment_status": "open",
    "financial_status": order.financial_status,
    "line_items": order.line_items,
    "location_id": location_id,
    "order_number": order.order_number,
    "order_status_url": order.order_status_url,
    "processed_at": order.processed_at,
    "processing_method": order.processing_method,
    "shipping_lines": order.shipping_lines,
    "source_name": order.source_name,
    "subtotal_price_set": order.subtotal_price_set,
    "total_line_items_price": order.total_line_items_price,
    "total_price": order.total_price,
    "total_weight": order.total_weight,
    "shipping_address": order.shipping_address,
    "updated_at": order.updated_at
  });
  await setDoc(doc(db, "shops", `${shop}/orders/${order.order_number}`), {
    "fulfillment_id": fulfillment_id,
    "id": order.id,
    "shop":shop,
    "admin_graphql_api_id": order.admin_graphql_api_id,
    "cancel_reason": order.cancel_reason,
    "cancelled_at": order.cancelled_at,
    "checkout_id": order.checkout_id,
    "closed_at": order.closed_at,
    "confirmed": order.confirmed,
    "contact_email": order.contact_email,
    "created_at": order.created_at,
    "currency": order.currency,
    "email": order.email,
    "fulfillment_status": "open",
    "financial_status": order.financial_status,
    "line_items": order.line_items,
    "location_id": location_id,
    "order_number": order.order_number,
    "order_status_url": order.order_status_url,
    "processed_at": order.processed_at,
    "processing_method": order.processing_method,
    "shipping_lines": order.shipping_lines,
    "source_name": order.source_name,
    "subtotal_price_set": order.subtotal_price_set,
    "total_line_items_price": order.total_line_items_price,
    "total_price": order.total_price,
    "total_weight": order.total_weight,
    "shipping_address": order.shipping_address,
    "delivery_at": new Date(new Date(order.created_at).setMinutes(new Date(order.created_at).getMinutes() + 30)).toLocaleString("sv", { timeZone: "Europe/Berlin"}),
    "updated_at": order.updated_at
  });
}

Shopify.Webhooks.Registry.addHandler("ORDERS_CREATE", {
  path: "/webhooks",
  // @ts-ignore
  webhookHandler: async (topic, shop, body) => {
    let order = JSON.parse(body)
    const statsDocRef = doc(db, "stats", "orders");
    const statsDocSnap = await getDoc(statsDocRef);
    // @ts-ignore
    setDoc(doc(db, "stats", "orders"), {n_store_orders: statsDocSnap.data().n_store_orders+1}, { merge: true})
     if (order.shipping_lines.length ==! 0  && order.shipping_lines[0].code == "OneSpot") {
      let appdocRef = doc(db, "app-sessions", "offline_"+shop);
      let appdocSnap = await getDoc(appdocRef);
      let locationdocRef = doc(db, "shops", `${shop}/info/general`);
      let locationdocSnap = await getDoc(locationdocRef);
      if(appdocSnap.exists() && locationdocSnap.exists()){
        const app_session = appdocSnap.data();
        const location_id = locationdocSnap.data().location_id
        const data = {"fulfillment": { "location_id": location_id, "status": "open"}};
        const fulfillment = await axios.post(
          `https://0dfc15a9470679b09207ae8ba56a3354:472e3009fef7c56c7e90c596cef543e1@${app_session.shop}/admin/api/2022-04/orders/${order.id}/fulfillments.json`,
          data, {
            headers: {
              'X-Shopify-Access-Token': app_session.accessToken
            },
          }).catch(function (error) {
          console.log(error.response.data);
        });
        // @ts-ignore
        updateOdersDB(order,shop, fulfillment.data.fulfillment.id, location_id);
        // @ts-ignore
        setDoc(doc(db, "stats", "orders"), {n_store_orders_onespot: statsDocSnap.data().n_store_orders_onespot+1}, { merge: true})
        // @ts-ignore
        setDoc(doc(db, "stats", "orders"), {n_fulfillments_open: statsDocSnap.data().n_fulfillments_open+1}, { merge: true})
      }
    }
  },
});


Shopify.Webhooks.Registry.addHandler("FULFILLMENTS_CREATE", {
  path: "/webhooks",
  webhookHandler: async (topic, shop, body) => {
  },
});

Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED", {
  path: "/webhooks",
  // @ts-ignore
  // @ts-ignore
  webhookHandler: async (topic, shop, body) => {
    let appSessionsRef = doc(db, 'app-sessions', 'offline_' + shop);
    try {
      //set shop as unactive
      return true;
    } catch (err) {
      throw new Error(err);
    }
  },
});

// export for test use only
export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production"
) {
  const app = express();
  app.set("top-level-oauth-cookie", TOP_LEVEL_OAUTH_COOKIE);
  app.set("active-shopify-shops", ACTIVE_SHOPIFY_SHOPS);
  app.set("use-online-tokens", USE_ONLINE_TOKENS);

  app.use(cookieParser(Shopify.Context.API_SECRET_KEY));

  applyAuthMiddleware(app);



  app.post("/webhooks", async (req, res) => {
    try {
      await Shopify.Webhooks.Registry.process(req, res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
      if (!res.headersSent) {
        res.status(500).send(error.message);
      }
    }
  });


  //for products to work create "shops/" + vendor + "/products" collection and skus must be non empty
  app.get("/products", verifyRequest(app), async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, true);
    const {
      Product
    } = await import(
      `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
    );

    const products = await Product.all({
      session: session,
      fields: "variants, vendor"
    });


    const map = new Map();
    map.set('inventory_quantity', 0);
    map.set('warehouse', "");
    const inventory = Object.fromEntries(map);

    let vendor = "error";
    if (products.length > 0) {
      vendor = products[0].vendor.toLowerCase();
    }
    let collectionRefName = "shops/" + vendor + "/products"

    for (var i = 0; i < products.length; i++) {
      for (var j = 0; j < products[i].variants.length; j++) {

        if (products[i].variants[j].sku.length > 0) {
          let docRefF = await doc(db, collectionRefName, products[i].variants[j].sku)
          await setDoc(docRefF, {
            sku: products[i].variants[j].sku,
            product_id: products[i].variants[j].product_id,
            title: products[i].variants[j].title,
            price: products[i].variants[j].price,
            created_at: products[i].variants[j].created_at,
            updated_at: products[i].variants[j].updated_at,
            taxable: products[i].variants[j].taxable,
            barcode: products[i].variants[j].barcode,
            grams: products[i].variants[j].grams,
            image_id: products[i].variants[j].image_id,
            weight: products[i].variants[j].weight,
            weight_unit: products[i].variants[j].weight_unit,
            admin_graphql_api_id: products[i].variants[j].admin_graphql_api_id,
            inventory: [inventory]
          });
        }
      }
    }
    res.status(200).send(products);
  });



  app.post("/graphql", verifyRequest(app), async (req, res) => {
    try {
      const response = await Shopify.Utils.graphqlProxy(req, res);
      res.status(200).send(response.body);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.use(express.json());

  app.use((req, res, next) => {
    const shop = req.query.shop;
    if (Shopify.Context.IS_EMBEDDED_APP && shop) {
      res.setHeader(
        "Content-Security-Policy",
        `frame-ancestors https://${shop} https://admin.shopify.com;`
      );
    } else {
      res.setHeader("Content-Security-Policy", `frame-ancestors 'none';`);
    }
    next();
  });

  app.use("/*", (req, res, next) => {
    const {
      shop
    } = req.query;

    // Detect whether we need to reinstall the app, any request from Shopify will
    // include a shop in the query parameters.
    // @ts-ignore
    if (app.get("active-shopify-shops")[shop] === undefined && shop) {
      // @ts-ignore
      res.redirect(`/auth?${new URLSearchParams(req.query).toString()}`);
    } else {
      next();
    }
  });

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  if (!isProd) {
    vite = await import("vite").then(({
        createServer
      }) =>
      createServer({
        root,
        logLevel: isTest ? "error" : "info",
        server: {
          port: PORT,
          hmr: {
            protocol: "ws",
            host: "localhost",
            port: 64999,
            clientPort: 64999,
          },
          middlewareMode: "html",
        },
      })
    );
    app.use(vite.middlewares);
  } else {
    const compression = await import("compression").then(
      ({
        default: fn
      }) => fn
    );
    const serveStatic = await import("serve-static").then(
      ({
        default: fn
      }) => fn
    );
    const fs = await import("fs");
    app.use(compression());
    app.use(serveStatic(resolve("dist/client")));
    // @ts-ignore
    app.use("/*", (req, res, next) => {
      // Client-side routing will pick up on the correct route to render, so we always render the index here
      res
        .status(200)
        .set("Content-Type", "text/html")
        .send(fs.readFileSync(`${process.cwd()}/dist/client/index.html`));
    });
  }

  return {
    app,
    // @ts-ignore
    vite
  };
}

if (!isTest) {
  createServer().then(({
    app
  }) => app.listen(PORT));
}