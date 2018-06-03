import * as secrets from "./secrets";
import * as searcher from "./searcher";
import * as cron from "cron";
import { default as Queue, QueueDocument } from "../models/Database/Queue";
import Bluebird from "bluebird";

export let start = () => {

  const search = () => {
    console.log("Starting search for all queued items");

    Queue.find({}).exec().then((queue: QueueDocument[]) => {
      Bluebird.each(queue, (item: QueueDocument) => {
        return searcher.search(item).then(console.log).catch(console.error);
      });
    });
  };

  return new cron.CronJob({
    cronTime: secrets.SEARCH_SCHEDULE,
    onTick: search,
    start: true,
    runOnInit: true,
    timeZone: secrets.TZ
  });

};
