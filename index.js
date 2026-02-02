const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;
const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_PASSWORD}@cluster1.19ohfxv.mongodb.net/?appName=Cluster1`;

// Strip Url
const stripe = require("stripe")(process.env.STRIP_PASSWORD);

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
    const usersReviewCollection = bd.collection("review");
    const usersFavoriteFoodCollection = bd.collection("favoriteFood");
    const orderedFoodCollection = bd.collection("orderedFood");
    const paymentCollection = bd.collection("payment");

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
    app.get("/user/all", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.status(201).send(result);
    });

    // User Status Update............
    app.patch("/user/status", async (req, res) => {
      const userInfo = req.body;
      const query = { email: userInfo.email };

      const updateInfo = {
        $set: {
          userStatus: userInfo.userStatus,
        },
      };

      const result = await usersCollection.updateOne(query, updateInfo);
      res.send(result);
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

      const result = await chefOrAdminCollection.insertOne(chefOrAdminInfo);
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
      const query = {
        foodName: mealsInfo.foodName,
        chefName: mealsInfo.chefName,
      };
      const duplicateFound = await mealsCollection.findOne(query);
      if (duplicateFound) {
        return res.send({ message: "you are already Applied" });
      }
      const result = await mealsCollection.insertOne(mealsInfo);
      res.status(200).send(result);
    });

    // // Image Upload API..
    app.patch("/meals/image", async (req, res) => {
      const mealsImgInfo = req.body;
      const query = { foodName: mealsImgInfo.foodName };
      const imgUpload = {
        $set: { foodImage: mealsImgInfo.foodImage },
      };
      const result = await mealsCollection.updateOne(query, imgUpload);
      res.status(200).send(result);
    });

    // ALL Meals GET API......
    app.get("/allMeals", async (req, res) => {
      const result = await mealsCollection.find().toArray();
      res.status(202).send(result);
    });
    app.get("/allMeals/descending", async (req, res) => {
      const result = await mealsCollection.find().sort({ price: -1 }).toArray();
      res.status(202).send(result);
    });
    app.get("/allMeals/ascending", async (req, res) => {
      const result = await mealsCollection.find().sort({ price: 1 }).toArray();
      res.status(202).send(result);
    });

    // Meal Details API........
    app.get("/mealDetails/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.findOne(query);
      res.send(result);
    });

    // chef All Meals and update related API......
    app.get("/chefALLMeal", async (req, res) => {
      const { email } = req.query;

      const query = {
        chefEmail: email,
      };
      const result = await mealsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/chefMeal/:id", async (req, res) => {
      const { id } = req.params;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.find(query).toArray();
      console.log(result);
      res.status(202).send(result);
    });

    app.patch("/chefALLMeal", async (req, res) => {
      const chefMealUpdateInfo = req.body;
      chefMealUpdateInfo.updateTime = new Date();
      console.log(chefMealUpdateInfo);
      const query = {
        _id: new ObjectId(chefMealUpdateInfo.id),
      };
      const updateInfo = {
        $set: chefMealUpdateInfo,
        // $set: {
        //   price:chefMealUpdateInfo.price,
        //   rating:chefMealUpdateInfo.rating,
        //   ingredients:chefMealUpdateInfo.ingredients,
        //   estimatedDeliveryTime:chefMealUpdateInfo.estimatedDeliveryTime,
        //   chefExperience:chefMealUpdateInfo.chefExperience
        // },
      };
      const result = await mealsCollection.updateMany(query, updateInfo);
      res.send(result);
    });

    app.post("/chefALLMeal/delete", async (req, res) => {
      const { id } = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.deleteOne(query);
      res.status(202).send(result);
    });

    // User Review API..............

    app.post("/userReview", async (req, res) => {
      const reviewInfo = req.body;
      reviewInfo.createAt = new Date();
      const query = {
        reviewerName: reviewInfo.reviewerName,
        foodId: reviewInfo.foodId,
      };
      const duplicateFound = await usersReviewCollection.findOne(query);
      if (duplicateFound) {
        return res.send({ message: "you are already Applied" });
      }

      const result = await usersReviewCollection.insertOne(reviewInfo);
      res.status(202).send(result);
    });

    app.patch("/userReview/image", async (req, res) => {
      const reviewImgInfo = req.body;
      // console.log(typeof reviewImgInfo.reviewerImage);
      const query = {
        reviewerName: reviewImgInfo.reviewerName,
        foodId: reviewImgInfo.id,
      };
      const imgUpload = {
        $set: { reviewerImage: reviewImgInfo.reviewerImage },
      };
      const result = await usersReviewCollection.updateOne(query, imgUpload);
      res.status(200).send(result);
    });

    app.get("/userReview/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id);
      const query = { foodId: id };
      const result = await usersReviewCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/userReview", async (req, res) => {
      const result = await usersReviewCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });
    app.get("/userPersonalReview", async (req, res) => {
      const { name } = req.query;
      const query = {
        reviewerName: name,
      };
      const result = await usersReviewCollection.find(query).toArray();
      console.log(name);
      res.send(result);
    });
    app.patch("/userReviewUpdate", async (req, res) => {
      const updateReviewInfo = req.body;
      const query = { _id: new ObjectId(updateReviewInfo.id) };
      const updateInfo = {
        $set: {
          rating: updateReviewInfo.rating,
          comment: updateReviewInfo.comment,
        },
      };
      const result = await usersReviewCollection.updateOne(query, updateInfo);
      res.send(result);
    });

    app.post("/userReview/delete", async (req, res) => {
      const { id } = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await usersReviewCollection.deleteOne(query);
      res.status(202).send(result);
    });

    // FavoriteFood Section API...............
    app.post("/userFavoriteFood", async (req, res) => {
      const favoriteFoodInfo = req.body;
      // console.log("favoriteFoodInfo",favoriteFoodInfo.mealId)
      const query = {
        mealId: favoriteFoodInfo.mealId,
      };
      const duplicateFound = await usersFavoriteFoodCollection.findOne(query);
      if (duplicateFound) {
        return res.send({ message: "you are already Applied" });
      }
      const result =
        await usersFavoriteFoodCollection.insertOne(favoriteFoodInfo);
      res.status(202).send(result);
    });

    app.get("/userFavoriteFood", async (req, res) => {
      const { email } = req.query;
      const query = {
        userEmail: email,
      };
      const result = await usersFavoriteFoodCollection.find(query).toArray();

      res.send(result);
    });

    app.post("/userFavoriteFood/delete", async (req, res) => {
      const { id } = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await usersFavoriteFoodCollection.deleteOne(query);
      res.status(202).send(result);
    });

    // Order Related API....................
    app.post("/orderedFood", async (req, res) => {
      const orderedFood = req.body;
      orderedFood.orderStatus = "pending";
      orderedFood.paymentStatus = "pending";
      orderedFood.orderTime = new Date();

      const result = await orderedFoodCollection.insertOne(orderedFood);
      res.status(202).send(result);
    });

    app.get("/orderedFood", async (req, res) => {
      const { chefId } = req.query;
      // console.log(chefId);
      const query = {
        chefId: chefId,
      };
      const result = await orderedFoodCollection.find(query).toArray();

      res.send(result);
    });

    app.patch("/orderedFood/orderStatus", async (req, res) => {
      const updateOrderStatusInfo = req.body;
      const query = { _id: new ObjectId(updateOrderStatusInfo.id) };
      const updateInfo = {
        $set: {
          orderStatus: updateOrderStatusInfo.orderStatus,
        },
      };
      const result = await orderedFoodCollection.updateOne(query, updateInfo);
      res.send(result);
    });

    app.get("/orderedFood/myOrder", async (req, res) => {
      const { email } = req.query;

      const query = {
        userEmail: email,
      };
      const result = await orderedFoodCollection.find(query).toArray();

      res.send(result);
    });

    app.post("/orderedFood/delete", async (req, res) => {
      const { id } = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await orderedFoodCollection.deleteOne(query);
      res.status(202).send(result);
    });

    // Payment Related Api............
    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;
      console.log(paymentInfo);
      const amonut = parseInt(paymentInfo.foodPrice) * 100;
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "USD",
              product_data: {
                name: paymentInfo.foodName,
              },
              unit_amount: amonut,
            },

            quantity: 1,
          },
        ],
        metadata: {
          foodId: paymentInfo.id,
          foodName: paymentInfo.foodName,
        },
        customer_email: paymentInfo?.email,
        mode: "payment",
        success_url: `${process.env.CLIENT_DOMAIN}/dashboard/paymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_DOMAIN}/dashboard/paymentCancelled`,
      });
      console.log(session);
      res.send({ url: session.url });
    });

    // app.patch("/payment-success", async (req, res) => {
    //   const session_id = req.query.session_id;

    //   const session = await stripe.checkout.sessions.retrieve(session_id);
    //   const id = session.metadata.foodId;
    //   console.log(session);
    //   if (session.payment_status === "paid") {
    //     const query = { _id: new ObjectId(id) };
    //     const updateData = {
    //       $set: {
    //         paymentStatus: "paid",
    //       },
    //     };

    //     await orderedFoodCollection.updateOne(query, updateData);
    //     // res.send(result);

    //     const paymentInfo = {
    //       paymentStatus: session.payment_status,
    //       foodId: session.metadata.foodId,
    //       amountTotal: session.amount_total / 100,
    //       customerEmail: session.customer_email,
    //       transactionId: session.payment_intent,
    //       foodName: session.metadata.foodName,
    //       paidTime: new Date(),
    //       trackingId: Math.floor(Math.random() * (9900 - 5500 + 1)) + 5500,
    //     };
    //     // const queryNext = {
    //     //   foodId: session.metadata.foodId,
    //     // };
    //     const duplicateFound = await paymentCollection.findOne(query);
    //     if (duplicateFound) {
    //       return;
    //     }

    //     const result = await paymentCollection.insertOne(paymentInfo);

    //     res.send(result);
    //   }

    //   res.send({ Payment: "Not Fount" });
    // });

    app.patch("/payment-success", async (req, res) => {
      const session_id = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status !== "paid") {
        return res.status(400).send({ message: "Payment not completed" });
      }

      const foodId = session.metadata.foodId;

      await orderedFoodCollection.updateOne(
        { _id: new ObjectId(foodId) },
        { $set: { paymentStatus: "paid" } },
      );

      const paymentInfo = {
        paymentStatus: session.payment_status,
        foodId,
        amountTotal: session.amount_total / 100,
        customerEmail: session.customer_email,
        transactionId: session.payment_intent,
        foodName: session.metadata.foodName,
        paidTime: new Date(),
        trackingId: Math.floor(Math.random() * (9900 - 5500 + 1)) + 5500,
      };

      const duplicateFound = await paymentCollection.findOne({
        transactionId: session.payment_intent,
      });

      if (duplicateFound) {
        return res.send({ message: "Payment already recorded" });
      }

      const result = await paymentCollection.insertOne(paymentInfo);
      return res.send(result);
    });

    app.get("/paymentInformation", async (req, res) => {
      const { email } = req.query;
      console.log(email);
      const query = {
        customerEmail: email,
      };

      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/paymentInformation/delete", async (req, res) => {
      const { id } = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await paymentCollection.deleteOne(query);
      res.status(202).send(result);
    });

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
