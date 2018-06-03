import express from "express";
import compression from "compression";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import * as schedule from "./util/schedule";
import expressValidator from "express-validator";
import bluebird from "bluebird";
import { MONGO_HOST } from "./util/secrets";
import { providerManager } from "./util/providerManager";

////////////
// Providers
import AvistaZProvider from "./providers/Avistaz";

providerManager.registerProvider(new AvistaZProvider());

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({path: ".env"});

////////////////////////
// Create Express server
const app = express();

/////////////////////
// Connect to MongoDB
mongoose.Promise = bluebird;
mongoose.connect(`mongodb://${MONGO_HOST}/sonarr-subtitles`, {useMongoClient: true}).then(() => {
  console.log("Connected to MongoDB.");
}).catch(error => {
  console.log(`MongoDB connection error. Please make sure MongoDB is running. ${error}`);
  process.exit(1);
});

////////////////////////
// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(express.static(path.join(__dirname, "public"), {maxAge: 31557600000}));

//////////////
// Controllers
import * as homeController from "./controllers/home";
import * as notificationController from "./controllers/notification";
import * as queueController from "./controllers/queue";

app.get("/", homeController.index);
app.post("/notifications/sonarr", notificationController.sonarr);
app.post("/queue/:queue/search", queueController.search);
app.post("/queue/:queue/remove", queueController.remove);

///////////////////
// Automatic Search
schedule.start();

export default app;
