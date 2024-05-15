const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');

// middleware 
// app.use(cors());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://academia-b4f7b.web.app",
      "https://academia-b4f7b.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bswbr7l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const verifyToken = (req, res, next) => {
  const token = req.cookies?.TOKEN;
  
  if (!token) {
    return res.status(401).send({ massage: 'unauthorized access' });
  }
  jwt.verify(token, 'secret', (err, decode) => {
    if (err) {
      return res.status(401).send({ massage: 'unautorized access' });
    }
    req.user = decode;
    next();
  })
  console.log('token in middle ware', token, req.user);
  // next()
}
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const serviceCollection = client.db('academiaDB').collection("services");
    const servicePurchasedCollection = client.db('academiaDB').collection("purchased")
    const requestedServiceCollection = client.db('academiaDB').collection("service-request")

    // user token genarate 
    app.post('/jwt', async (req, res) => {
      const loggedUser = req.body;
      //genarete token
      const token = jwt.sign(loggedUser, 'secret', { expiresIn: '1h' });
      //store in cookies
      console.log('user for tokenn',loggedUser,token);
      res.cookie('TOKEN', token, cookieOptions)
        .send({ success: true });
    })
    // clear cookies for token 
    app.post('/logout', async (req, res) => {
      const loggedUser = req.body;
      console.log(loggedUser, 'loging out user');
      res.clearCookie('TOKEN',{maxAge:0}).send({ success: true });
    })

    // all services 
    app.get('/services', async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.post('/services', async (req, res) => {
      const serviceDetails = req.body;
      const result = await serviceCollection.insertOne(serviceDetails);
      res.send(result);
    })
    // requested service 
    app.post('/requestedServices', async (req, res) => {
      const serviceDetails = req.body;
      const result = await requestedServiceCollection.insertOne(serviceDetails);
      res.send(result);
    })

    // get service by id 
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await serviceCollection.findOne(query);
      res.send(result);
    })

    // purchase survices
    app.get('/servicePurchased', verifyToken, async(req, res) => {
      let query = {};
      // console.log('token ownerrr',req.user,req.cookies,req.query.email);
      console.log("req.user.email",req.user.email,req.query.email);
      if(req.user.email !== req.query.email){
        return res.send({massage:'unauthorized access'});
      }
      if (req.query?.email) {
        query = { userEmail: req.query.email }
      }
      const result = await servicePurchasedCollection.find(query).toArray();
      res.send(result);
    })
    app.post('/servicePurchased', async (req, res) => {
      const purchaseDetails = req.body;
      const result = await servicePurchasedCollection.insertOne(purchaseDetails);
      res.send(result);
    })
    //service status-->handle service status
    app.get('/serviceToDo',verifyToken, async (req, res) => {
      console.log("req.user.email",req.user.email,req.query.email);
      let query = {};
      if(req.user.email !== req.query.email){
        return res.send({massage:'unauthorized access'});
    }
      if (req.query?.email) {
        query = { providerEmail: req.query.email }
      }
      const result = await servicePurchasedCollection.find(query).toArray();
      res.send(result);
    })
    // update status 
    app.patch('/serviceToDo/:id', async (req, res) => {
      const id = req.params.id;
      console.log(req.body);
      const doc = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          status: doc.serviceStatus
        }
      };
      const result = await servicePurchasedCollection.updateOne(filter, updatedDoc, option);
      // console.log(result);
      res.send(result);
    })
    //manage services
    app.get('/manageServices',verifyToken, async (req, res) => {
      let query = {};
      console.log("req.user.email",req.user.email,req.query.email);
      if(req.user.email !== req.query.email){
            return res.send({massage:'unauthorized access'});
        }
      if (req.query?.email) {
        query = { providerEmail: req.query.email }
      }
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    })
    // delete service 
    app.delete('/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    })
    //update service
    app.put('/services/:id', async (req, res) => {
      const id = req.params.id;
      const doc = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          serviceName: doc.serviceName,
          serviceImage: doc.serviceImage,
          serviceArea: doc.serviceArea,
          description: doc.description,
          servicePrice: doc.servicePrice
        }
      }
      const result = await serviceCollection.updateOne(filter, updatedDoc, option);
      // console.log(result);
      res.send(result);
    })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("academia is comming soon");
})

app.listen(port, () => {
  console.log(`server is runing on port ${port}`);
})