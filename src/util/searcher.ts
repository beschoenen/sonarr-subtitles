import { default as Queue, QueueDocument } from "../models/Database/Queue";
import { providerManager } from "./providerManager";
import Bluebird from "bluebird";
import SearchResult from "../models/SearchResult";
import * as fs from "fs";
import { sendMessage } from "./telegram";
import logger from "./logger";

export function search(queue: QueueDocument): Bluebird<string> {
  logger.debug(`Searching for ${queue.sceneName}`);

  if (!fs.existsSync(`${queue.folder}/${queue.fileName}`)) {
    Queue.deleteOne({_id: queue._id}).exec(); // TODO handle promise
    return Bluebird.reject("Video file does not exist anymore");
  }

  return providerManager
    .search(queue.sceneName)
    .then(results => {
      if (results.length < 1) {
        throw `No result for: ${queue.sceneName}`;
      }

      results.sort(compare);

      return results[0];
    })
    .then(result => result.provider.download(result, queue))
    .then(() => Queue.deleteOne({_id: queue._id}).exec())
    .then(() => sendMessage(`Subtitles downloaded for ${queue.title}`))
    .then(() => `Subtitles downloaded for ${queue.sceneName}`);
}

function compare(a: SearchResult, b: SearchResult) {
  if (a.score < b.score) return -1;
  if (a.score > b.score) return 1;

  return 0;
}
