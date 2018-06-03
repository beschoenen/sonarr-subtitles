import { Request, Response } from "express";
import Queue, { QueueDocument } from "../models/Database/Queue";
import * as searcher from "../util/searcher";

/**
 * POST /queue/:queue/search
 * Search subtitles for a queued item.
 */
export let search = (req: Request, res: Response) => {
  if (!req.params.queue) {
    res.status(400);
    return res.send("No queue item selected");
  }

  Queue.findOne({_id: req.params.queue}).exec().then((queue: QueueDocument) => {
    searcher.search(queue).then(result => {
      console.log(result);
      res.json({success: true, message: result});
    }).catch(result => {
      console.log(result);
      res.json({success: false, message: result});
    });
  }).catch(error => {
    console.error(error);
    res.status(500);
    res.json({success: false, message: "An error occurred", error});
  });
};

/**
 * POST /queue/:queue/remove
 * Remove a queued item from the list.
 */
export let remove = (req: Request, res: Response) => {
  if (!req.params.queue) {
    res.status(400);
    return res.send("No queue item selected");
  }

  Queue.deleteOne({_id: req.params.queue}).exec().then(() => {
    res.json({success: true, message: "Item deleted"});
  }).catch(error => {
    console.error(error);
    res.status(500);
    res.json({success: false, message: "An error occurred", error});
  });
};
