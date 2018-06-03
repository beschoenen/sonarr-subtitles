import { QueueModel } from "../models/Database/Queue";
import * as path from "path";

export default class Sonarr {

  public static fromPayload(payload: any): QueueModel | undefined {

    let queue: QueueModel | undefined;

    const pathSplit = payload.episodeFile.relativePath.split("/");
    const file = pathSplit.pop();

    const show = payload.series.title;
    const season = payload.episodes[0].seasonNumber;
    const episode = Sonarr.pad(payload.episodes[0].episodeNumber, 2);

    try {
      queue = {
        title: `${show} ${season}x${episode}`,
        sceneName: payload.episodeFile.path.split("/").pop(),
        fileName: file,
        folder: path.join(payload.series.path, pathSplit.join("/"))
      };
    } catch (error) {
      console.log(error);
    }

    return queue;
  }

  private static pad (value: string, pad: number): string {
    if (value.length >= pad) return value;

    return this.pad(`0${value}`, pad);
  }

}
