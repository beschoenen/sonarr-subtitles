import { Request, Response } from "express";
import Queue from "../models/Database/Queue";
import * as searcher from "../util/searcher";
import logger from "../util/logger";
import Bluebird from "bluebird";

/**
 * POST /queue/:queue/search
 * Search subtitles for a queued item.
 */
export let search = (req: Request, res: Response) => {
  if (!req.params.queue) {
    return res.status(400).send({success: false, message: "No queue item selected"});
  }

  Queue.findOne({_id: req.params.queue}).exec().then(searcher.search, error => {
    logger.error(error);
    res.status(500).json({success: false, message: "An error occurred"});

    return Bluebird.reject(error);
  }).then(result => {
    logger.debug(result);
    res.json({success: true, message: result});
  }, result => {
    logger.error(result);
    res.status(500).json({success: false, message: result});
  });
};

/**
 * POST /queue/:queue/remove
 * Remove a queued item from the list.
 */
export let remove = (req: Request, res: Response) => {
  if (!req.params.queue) {
    return res.status(400).send({success: false, message: "No queue item selected"});
  }

  Queue.deleteOne({_id: req.params.queue}).exec().then(() => {
    logger.debug("Item deleted");
    res.json({success: true, message: "Item deleted"});
  }, error => {
    logger.error(error);
    res.status(500).json({success: false, message: "An error occurred"});
  });
};
