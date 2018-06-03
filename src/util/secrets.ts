import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
} else {
    logger.debug("Using .env.example file to supply config environment variables");
    dotenv.config({ path: ".env.example" });  // you can delete this after you create your own .env file!
}

export const ENVIRONMENT = process.env.NODE_ENV;
export const MONGO_HOST = process.env["MONGO_HOST"];
export const AVISTAZ_USERNAME = process.env["AVISTAZ_USERNAME"];
export const AVISTAZ_PASSWORD = process.env["AVISTAZ_PASSWORD"];
export const SEARCH_SCHEDULE = process.env["SEARCH_SCHEDULE"] || "0 0 0 */15 * *";
export const TZ = process.env["TZ"] || "Europe/Amsterdam";

if (!MONGO_HOST) {
    logger.error("No mongo connection string. Set MONGO_HOST environment variable.");
    process.exit(1);
}

if (!AVISTAZ_USERNAME) {
    logger.error("No AvistaZ username. Set AVISTAZ_USERNAME environment variable.");
    process.exit(1);
}

if (!AVISTAZ_PASSWORD) {
    logger.error("No AvistaZ password. Set AVISTAZ_PASSWORD environment variable.");
    process.exit(1);
}
