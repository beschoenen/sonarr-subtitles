import SearchResult from "../models/SearchResult";
import Bluebird from "bluebird";
import { QueueModel } from "../models/Database/Queue";
import * as fs from "fs";
import * as path from "path";

export default abstract class BaseProvider {

  /**
   * Gives a list of possible subtitle files.
   * @param {string} phrase
   * @returns {Bluebird<SearchResult[]>}
   */
  public abstract search(phrase: string): Bluebird<SearchResult[]>;

  /**
   * Returns the raw text in the subtitle file.
   * @param {SearchResult} result
   * @returns {Bluebird<string>}
   */
  protected abstract getFile(result: SearchResult): Bluebird<string>;

  /**
   * Downloads and write the subtitle file.
   * @param {SearchResult} result
   * @param {QueueModel} queue
   * @returns {Bluebird<string>}
   */
  public download(result: SearchResult, queue: QueueModel): Bluebird<void> {
    return this.getFile(result).then(content => {
      const filename = queue.fileName.split(".");
      filename.pop();

      fs.writeFile(
        path.join(queue.folder, `${filename.join(".")}.${result.ext || "srt"}`),
        content,
        error => error ? Bluebird.reject(error) : Bluebird.resolve()
      );
    });
  }

}
