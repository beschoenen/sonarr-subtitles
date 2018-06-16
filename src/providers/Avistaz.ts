import SearchResult from "../models/SearchResult";
import BaseProvider from "./BaseProvider";
import Bluebird from "bluebird";
import request, { CookieJar, RequestResponse, UrlOptions } from "request";
import cheerio from "cheerio";
import * as secrets from "../util/secrets";
import rp, { RequestPromiseOptions } from "request-promise";
import { StatusCodeError } from "request-promise/errors";

interface AvistazLogin {
  _token?: string;
  email_username: string;
  password: string;
  remember: string;
}

export interface AvistazRelease {
  release: string;
  subLanguage: string;
  url: string;
}

export default class Avistaz extends BaseProvider {

  private readonly baseUrl: string;
  private readonly testUrl: string;
  private readonly loginUrl: string;
  private readonly searchUrl: string;

  private readonly cookieJar: CookieJar;

  constructor() {
    super();

    console.log("Initializing AvistaZ");

    this.baseUrl = "https://avistaz.to";
    this.testUrl = `${this.baseUrl}/torrents`;
    this.loginUrl = `${this.baseUrl}/auth/login`;
    this.searchUrl = `${this.baseUrl}/torrents?search`;
    this.cookieJar = request.jar();
  }

  public search(phrase: string): Bluebird<SearchResult[]> {
    console.log(`Searching AvistaZ for ${phrase}`);

    return this.test()
      .catch(() => this.login())
      .then(() => this.findReleases(phrase))
      .then(releases => this.getReleases(releases));
  }

  protected getFile(result: SearchResult): Bluebird<string> {
    console.log(`Downloading subtitle file from AvistaZ`);

    const options: RequestPromiseOptions & UrlOptions = {
      url: result.url,
      jar: this.cookieJar
    };

    return this.test()
      .catch(() => this.login())
      .then(() => rp(options));
  }

  private getReleases(releases: AvistazRelease[]): Bluebird<SearchResult[]> {
    return Bluebird.map(releases, release => this.getReleasePage(release))
      .then(results => [].concat.apply([], results));
  }

  private getReleasePage(release: AvistazRelease): Bluebird<SearchResult[]> {
    const options: RequestPromiseOptions & UrlOptions = {
      url: release.url,
      jar: this.cookieJar,
      transform: body => cheerio.load(body)
    };

    return rp(options).then($ => this.parseReleasePage($));
  }

  private parseReleasePage($: CheerioStatic): SearchResult[] {
    const results: SearchResult[] = [];

    $("table").last().find("tbody tr").each((index, element) => {
      results.push({
        description: $(element).find("i.fa-commenting-o").data("title"),
        language: $($(element).find("td")[0]).text().trim(),
        size: $($(element).find("td")[2]).text(),
        score: parseInt($("td div.likes span.count").text()),
        url: $($(element).find("td")[1]).find("a").attr("href"),
        ext: $($(element).find("td")[1]).find("a").attr("href").split(".").pop(),
        provider: this
      });
    });

    return results;
  }

  private findReleases(phrase: string): Bluebird<AvistazRelease[]> {
    const options: RequestPromiseOptions & UrlOptions = {
      url: `${this.searchUrl}=${Avistaz.sanitizePhrase(phrase)}`,
      jar: this.cookieJar,
      transform: body => cheerio.load(body)
    };

    return rp(options)
      .catch(console.error)
      .then(this.parseReleases);
  }

  private parseReleases($: CheerioStatic): AvistazRelease[] {
    const releases: AvistazRelease[] = [];

    $("table").first().find("tbody > tr").each((index, element) => {
      const elements = $(element).find("div.badge-extra").filter(function () {
        return $(this).find("strong").text() === "Sub:";
      });

      if (elements.length < 1) return;

      releases.push({
        release: $(element).find("a.torrent-filename").first().text().trim(),
        subLanguage: $(elements).first().find("a").first().attr("title"),
        url: $(element).find("a.torrent-filename").first().attr("href"),
      });
    });

    return releases;
  }

  private login(): Bluebird<void> {
    console.log("Logging into AvistaZ");

    const info: AvistazLogin = {
      email_username: secrets.AVISTAZ_USERNAME,
      password: secrets.AVISTAZ_PASSWORD,
      remember: "1"
    };

    const options: RequestPromiseOptions & UrlOptions = {
      url: this.loginUrl,
      jar: this.cookieJar,
      resolveWithFullResponse: true,
      method: "POST",
      form: info
    };

    return this.getToken()
      .then(token => info._token = token)
      .then(() => rp(options))
      .then((response: RequestResponse) => {
        if (response.request.uri.href === this.loginUrl) {
          throw "Could not login";
        }
      }).catch((error: StatusCodeError) => {
        error.response.headers["set-cookie"].forEach(cookie => this.cookieJar.setCookie(cookie, this.baseUrl));
      });
  }

  private getToken(): Bluebird<string> {
    const tokenRegex = /<meta name="_token" content="(.*?)">/;
    const options: RequestPromiseOptions & UrlOptions = {
      url: this.loginUrl,
      jar: this.cookieJar,
      resolveWithFullResponse: true
    };

    return rp(options).then((response: RequestResponse) => {
      response.headers["set-cookie"].forEach(cookie => {
        this.cookieJar.setCookie(cookie, this.baseUrl);
      });

      const regex = tokenRegex.exec(response.body);

      if (!regex || !regex[1]) {
        throw "Invalid HTML";
      }

      return regex[1];
    });
  }

  private test(): Bluebird<void> {
    const options: RequestPromiseOptions & UrlOptions = {
      url: this.testUrl,
      jar: this.cookieJar,
      resolveWithFullResponse: true
    };

    return rp(options).then((response: RequestResponse) => {
      if (response.request.uri.href === this.loginUrl) {
        throw "Could not login";
      }
    });
  }

  /**
   * Removes the extension and replace points as well as changes the resolution to 720p.
   * @param {string} phrase
   * @returns {string}
   */
  private static sanitizePhrase(phrase: string): string {
    const split = phrase.split(".");
    split.pop(); // Remove extension

    let newPhrase = split.join(" ");

    newPhrase = newPhrase.replace(/[0-9]{2}[0-1][0-9][0-3][0-9]\s/, "");
    newPhrase = newPhrase.replace(/(36|45|54|108|)0p/, "720p");

    return newPhrase;
  }

}
