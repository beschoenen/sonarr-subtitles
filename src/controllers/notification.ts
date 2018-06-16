import { Request, Response } from "express";
import { default as Queue } from "../models/Database/Queue";
import Sonarr from "../parsers/Sonarr";
import * as searcher from "../util/searcher";
import logger from "../util/logger";
import Bluebird from "bluebird";

/**
 * POST /notifications/sonarr
 * Receive notifications from sonarr.
 */
export let sonarr = (req: Request, res: Response) => {
  if (req.body.eventType === "Test") {
    logger.debug("Got test request from Sonarr");
    return res.json({success: true, message: "Sonarr test successful"});
  }

  if (req.body.eventType !== "Download") {
    logger.warning("Got unsupported event type request from Sonarr");
    return res.status(400).json({success: false, message: `Unsupported event type: ${req.body.eventType || "none"}`});
  }

  const model = Sonarr.fromPayload(req.body);

  if (!model) {
    logger.error("Could not parse payload to model");
    return res.status(400).json({success: false, message: "Something is wrong with the payload"});
  }

  Queue.create(model).then(queue => {
    logger.debug(`Added ${model.sceneName} to queue`);
    res.json({success: true, message: "Subtitle queued for download"});

    return queue;
  }, error => {
    logger.error(error);
    res.status(500).json({success: false, message: "An error occurred"});

    return Bluebird.reject(error);
  }).then(searcher.search);
};
