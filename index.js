const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;
const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_PASSWORD}@cluster1.19ohfxv.mongodb.net/?appName=Cluster1`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_DOMAIN],
    credentials: true,
    optionSuccessStatus: 200,
  }),
);

async function run() {
  try {
    // await client.connect();
    const bd = client.db("localChefBazaar");
    const usersCollection = bd.collection("users");
    const chefOrAdminCollection = bd.collection("chefOrAdmin");
    const mealsCollection = bd.collection("meals");

    // Users Related APi .............
    // User Post To Data Base...........
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      userInfo.createAt = new Date();
      userInfo.role = "user";

      const query = { email: userInfo.email };
      const duplicateFound = await usersCollection.findOne(query);
      if (duplicateFound) {
        return res.send({ message: "you are already registered" });
      }

      const result = await usersCollection.insertOne(userInfo);
      res.status(201).send(result);
    });

    // Get User API ................
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      res.status(201).send(result);
    });

    // User Role Update API
    app.patch("/user/role", async (req, res) => {
      const userInfo = req.body;
      const query = { email: userInfo.email };

      if (userInfo.role === "chef") {
        userInfo.chefID = `chef_${Math.floor(Math.random() * 100) + 1}`;
      }

      const updateInfo = {
        $set: {
          role: userInfo.role,
          chefID: userInfo.chefID,
        },
      };

      const result = await usersCollection.updateOne(query, updateInfo);
      res.send(result);
    });

    // Chef Or Admin Collection API

    app.post("/chefOrAdmin", async (req, res) => {
      const chefOrAdminInfo = req.body;
      chefOrAdminInfo.createAt = new Date();
      const query = { email: chefOrAdminInfo.email };
      const duplicateFound = await chefOrAdminCollection.findOne(query);
      if (duplicateFound) {
        return res.send({ message: "you are already Applied" });
      }

      const result = await ChefOrAdminCollection.insertOne(chefOrAdminInfo);
      res.status(201).send(result);
    });
    app.get("/chefOrAdmin", async (req, res) => {
      const result = await chefOrAdminCollection.find().toArray();
      res.status(201).send(result);
    });

    app.post("/chefOrAdmin/delete", async (req, res) => {
      const { email } = req.body;
      const query = { email };
      const result = await chefOrAdminCollection.deleteOne(query);
      res.send(result);
    });

    // Meals collection Related API...................
    app.post("/meals", async (req, res) => {
      const mealsInfo = req.body;
      mealsInfo.createAt = new Date();
      const result = await mealsCollection.insertOne(mealsInfo);
      res.status(200).send(result);
    });

    // Image Upload API..
    app.patch("/meals/image", async (req, res) => {
      const mealsImgInfo = req.body;
      const query = {foodName : mealsImgInfo.foodName}
      const imgUpload = {
        $set:{foodImage : mealsImgInfo.foodImage}
      }
      const result = await mealsCollection.updateOne(query,imgUpload);
      res.status(200).send(result);
    });

    // ALL Meals GET API......
    app.get("/allMeals",async (req,res)=>{
      const result = await mealsCollection.find().toArray()
      res.status(202).send(result)
    })
    app.get("/allMeals/descending",async (req,res)=>{
      const result = await mealsCollection.find().sort({price:-1}).toArray()
      res.status(202).send(result)
    })
    app.get("/allMeals/ascending",async (req,res)=>{
      const result = await mealsCollection.find().sort({price:1}).toArray()
      res.status(202).send(result)
    })

    // Meal Details API........
    app.get("/mealDetails/:id",async (req,res)=>{
      const {id} = req.params
      console.log(id)
      const query = {_id :new ObjectId(id)}
      const result = await mealsCollection.findOne(query)
      res.send(result)
    })














    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
