import { Request, Response } from "express";
import { default as Queue, QueueDocument } from "../models/Database/Queue";
import Sonarr from "../parsers/Sonarr";
import * as searcher from "../util/searcher";

/**
 * POST /notifications/sonarr
 * Receive notifications from sonarr.
 */
export let sonarr = (req: Request, res: Response) => {
  if (req.body.eventType === "Test") {
    console.log("Got test request from Sonarr");
    return res.send("Sonarr test successful. :)");
  }

  if (req.body.eventType !== "Download") {
    console.error("Got unsupported event type request from Sonarr");

    res.status(400);
    return res.send(`Unsupported event type: ${req.body.eventType}`);
  }

  const model = Sonarr.fromPayload(req.body);

  if (!model) {
    console.error("Could not create a model");

    res.status(400);
    return res.send("Something is wrong with the payload.");
  }

  Queue.create(model).catch(console.error).then((queue: QueueDocument) => {
    console.log(`Added ${model.sceneName} to queue`);
    res.send("Sub grad queued.");

    searcher.search(queue).then(console.log).catch(console.error);
  });
};
