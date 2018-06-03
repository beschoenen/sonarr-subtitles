import { Request, Response } from "express";
import { providerManager } from "../util/providerManager";
import Queue, { QueueDocument } from "../models/Database/Queue";

/**
 * GET /
 * Home page.
 */
export let index = (req: Request, res: Response) => {
  Queue.find({}).exec().then((result: QueueDocument[]) => {
    res.render("home", {
      title: "Sonarr Subtitles",
      providers: providerManager.providers,
      queue: result,
    });
  });
};
