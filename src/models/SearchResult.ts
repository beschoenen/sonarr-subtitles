import BaseProvider from "../providers/BaseProvider";

export default interface SearchResult {

  /**
   * The description of the result.
   */
  description?: string;

  /**
   * The language of the result.
   */
  language: string;

  /**
   * The size of the result.
   */
  size: string;

  /**
   * The score for the result.
   */
  score?: number;

  /**
   * The url to the result.
   */
  url: string;

  /**
   * The extension of the subtitle file.
   */
  ext?: string;

  /**
   * The Provider on which the result was found.
   */
  provider: BaseProvider;

}
