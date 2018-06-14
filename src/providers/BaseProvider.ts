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
    return this.getFile(result).then(content => this.writeFile(queue.fileName, result.ext, queue.folder, content));
  }

  /**
   * Write the contents of the searchResult to a file
   * @param {string} fileName
   * @param {string} extension
   * @param {string} folder
   * @param {string} content
   * @returns {Bluebird<void>}
   */
  private writeFile(fileName: string, extension: string, folder: string, content: string): Bluebird<void> {
    return new Bluebird<void>((resolve, reject) => {
      const filename = fileName.split(".");
      filename.pop();

      fs.writeFile(
        path.join(folder, `${filename.join(".")}.${extension || "srt"}`),
        content,
        error => error ? reject(error) : resolve()
      );
    });
  }

}
