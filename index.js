const admin = require('firebase-admin');
const fs = require('fs');
const csvSync = require('csv-parse/lib/sync');
require('dotenv').config();

/* 認証 */
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_CERT_URI,
    client_x509_cert_url: process.env.CLIENT_CERT_URL,
  }),
  databaseURL: `https://${process.env.PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();

const file = './test.csv';
const data = fs.readFileSync(file);
const responses = csvSync(data);
const objects = [];

/* data import */
responses.forEach(function (data) {
  objects.push({
    _id: data[0],
  });
}, this);

objects.shift(); //ヘッダもインポートされてしまうから、配列の一番最初のelementは削除します。

/* data add */
return db
  .runTransaction(function (transaction) {
    return transaction.get(db.collection('ReceiptDetail')).then((doc) => {
      objects.forEach(function (object) {
        if (object['_id'] != '') {
          let id = object['_id'];
          delete object._id;
          transaction.set(db.collection('ReceiptDetail').doc(id), object);
        } else {
          delete object._id;
          transaction.set(db.collection('ReceiptDetail').doc(), object);
        }
      }, this);
    });
  })
  .then(function () {
    console.log('success');
  })
  .catch(function (error) {
    console.log('Failed', error);
  });
