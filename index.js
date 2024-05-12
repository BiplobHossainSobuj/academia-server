const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = "mongodb+srv://<username>:<password>@cluster0.bswbr7l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bswbr7l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const serviceCollection = client.db('academiaDB').collection("services");
    const servicePurchasedCollection= client.db('academiaDB').collection("purchased")
    // all services 
    app.get('/services',async(req,res)=>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.post('/services',async(req,res)=>{
      const serviceDetails = req.body;
      const result = await serviceCollection.insertOne(serviceDetails);
      res.send(result);
    })
    
    // get service by id 
    app.get('/services/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await serviceCollection.findOne(query);
      res.send(result);
    })

    // purchase survices
    app.post('/servicePurchased',async(req,res)=>{
      const purchaseDetails = req.body;
      const result = await servicePurchasedCollection.insertOne(purchaseDetails);
      res.send(result);
    })
    //manage services
    app.get('/manageServices',async(req,res)=>{
      let query = {};
      if(req.query?.email){
        query={providerEmail:req.query.email}
      }
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    })
    // delete service 
    app.delete('/delete/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send("academia is comming soon");
})

app.listen(port,()=>{
    console.log(`server is runing on port ${port}`);
})