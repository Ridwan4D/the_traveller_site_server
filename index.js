const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 7000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGODB_USER_ID}:${process.env.MONGODB_USER_PASS}@cluster0.yyjvuyt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db("theTravellerSite").collection("users");
    const packageCollection = client
      .db("theTravellerSite")
      .collection("packages");
    const tourTypeCollection = client
      .db("theTravellerSite")
      .collection("tourTypes");
    const sliderCollection = client
      .db("theTravellerSite")
      .collection("sliders");
    const guideReviewCollection = client
      .db("theTravellerSite")
      .collection("guideReviews");

    // ========================================   jwt api start    ========================================
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // ========================================   jwt api end    ========================================
    // ========================================   middle wares start    ========================================
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // ========================================   middle wares end    ========================================

    // ========================================   user collection start    ========================================
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      // console.log({ admin });
      res.send({ admin });
    });
    app.get("/users/guide/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      let guide = false;
      if (user) {
        guide = user?.role === "guide";
      }
      // console.log({ guide });
      res.send({ guide });
    });

    app.get("/guides", async (req, res) => {
      const role = req.query.role;
      const query = { role: role };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { userEmail: user.userEmail };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.put("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const userInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: userInfo.role,
          requested: userInfo.requested,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const userInfo = req.body;
      const filter = { userEmail: email };
      const options = { upsert: true };
      // console.log(userInfo.userName);
      const updateDoc = {
        $set: {
          userName: userInfo.userName,
          phone: userInfo.phone,
          education: userInfo.education,
          experience: userInfo.experience,
          languages: userInfo.languages,
          address: userInfo.address,
          userImage: userInfo.image,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.patch("/user/:email", async (req, res) => {
      const email = req.params.email;
      const requestInfo = req.body;
      const filter = { userEmail: email };
      const options = { upsert: true };
      console.log(requestInfo.requesterRole);
      const updateDoc = {
        $set: {
          requested: requestInfo.requested,
          requestedRole: requestInfo.requestedRole,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });
    // ========================================   user collection end    ========================================

    // ========================================   package collection start    ========================================
    app.get("/packages", async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    });
    app.post("/packages", async (req, res) => {
      const packageInfo = req.body;
      const result = await packageCollection.insertOne(packageInfo);
      res.send(result);
    });
    app.put("/packages/:id", async (req, res) => {
      const id = req.params.id;
      const packageInfo = req.body;
      console.log(id, packageInfo);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          tour_name: packageInfo.tour_name,
          trip_type: packageInfo.trip_type,
          price: packageInfo.price,
          duration: packageInfo.duration,
          tour_plan: packageInfo.tour_plan,
          description: packageInfo.description,
          images: packageInfo.images,
        },
      };
      const result = await packageCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/packages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packageCollection.deleteOne(query);
      res.send(result);
    });
    // ========================================   package collection end    ========================================

    // ========================================   tour type collection start    ========================================
    app.get("/tourTypes", async (req, res) => {
      const result = await tourTypeCollection.find().toArray();
      res.send(result);
    });
    app.post("/tourTypes", async (req, res) => {
      const tourTypesInfo = req.body;
      const result = await tourTypeCollection.insertOne(tourTypesInfo);
      res.send(result);
    });
    // ========================================   tour type collection end    ========================================

    // ========================================   slider type collection start    ========================================
    app.get("/sliders", async (req, res) => {
      const result = await sliderCollection.find().toArray();
      res.send(result);
    });

    app.post("/sliders", async (req, res) => {
      const bannerInfo = req.body;
      const result = await sliderCollection.insertOne(bannerInfo);
      res.send(result);
    });

    app.delete("/sliders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sliderCollection.deleteOne(query);
      res.send(result);
    });
    // ========================================   slider type collection end    ========================================

    // ========================================   guide review type collection start    ========================================
    app.get("/guideReviews", async (req, res) => {
      const result = await guideReviewCollection.find().toArray();
      res.send(result);
    });

    app.post("/guideReviews", async (req, res) => {
      const reviewInfo = req.body;
      const result = await guideReviewCollection.insertOne(reviewInfo);
      res.send(result);
    });
    // ========================================   guide review type collection end    ========================================

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send(`Traveller site is running`);
});

app.listen(port, () => {
  console.log(`Traveller site Server is running on port: ${port}`);
});
