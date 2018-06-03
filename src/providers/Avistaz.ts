import SearchResult from "../models/SearchResult";
import BaseProvider from "./BaseProvider";
import Bluebird from "bluebird";
import request, { CookieJar } from "request";
import cheerio from "cheerio";
import * as secrets from "../util/secrets";

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

    return new Bluebird<SearchResult[]>((resolve, reject) => {
      this.test().catch(() => this.login()).then(() => {
        this.findReleases(phrase)
          .then(releases => this.getReleasePages(releases))
          .then(results => resolve(results))
          .catch(console.error);
      });
    });
  }

  protected getFile(result: SearchResult): Bluebird<string> {
    console.log(`Downloading subtitle file from AvistaZ`);

    return new Bluebird((resolve, reject) => {
      this.test().catch(() => this.login()).then(() => {
        request(result.url, {jar: this.cookieJar}, function (error, response, body) {
          resolve(body);
        });
      });
    });
  }

  private getReleasePages(releases: AvistazRelease[]): Bluebird<SearchResult[]> {
    const results: SearchResult[] = [];

    return new Bluebird((resolve, reject) => {
      Bluebird.each(releases, async (release: AvistazRelease) => {
        const self = this;
        return new Bluebird<void>(async (resolve, reject) => {
          await request(release.url, {jar: this.cookieJar}, async function (error, response, body) {
            if (error) {
              return reject(error);
            }

            // .concat does not work
            const t = self.parseReleasePages(cheerio.load(body));
            t.forEach(e => results.push(e));

            await resolve();
          });
        });
      }).then(() => resolve(results));
    });
  }

  private parseReleasePages($: CheerioStatic): SearchResult[] {
    const results: SearchResult[] = [];

    $("table").last().find("tbody tr").each((index, element) => {
      results.push({
        description: $(element).find("i.fa-commenting-o").data("title"),
        language: $($(element).find("td")[0]).text().trim(),
        size: $($(element).find("td")[2]).text(),
        score: parseInt($("td div.likes span.count").text()),
        url: $($(element).find("td")[1]).find("a").attr("href"),
        ext: $($(element).find("td")[1]).find("a").attr("href").split(".").pop()
      });
    });

    return results;
  }

  private findReleases(phrase: string): Bluebird<AvistazRelease[]> {
    return new Bluebird((resolve, reject) => {
      request(`${this.searchUrl}=${Avistaz.sanitizePhrase(phrase)}`, {jar: this.cookieJar}, (error, response, body) => {
        resolve(this.parseReleases(cheerio.load(body)));
      });
    });
  }

  private parseReleases($: CheerioStatic): AvistazRelease[] {
    const releases: AvistazRelease[] = [];

    $("table").first().find("tbody > tr").each((index, element) => {
      const elements = $(element).find("div.badge-extra").filter(function () {
        return $(this).find("strong").text() === "Sub:";
      });

      if (elements.length > 0) {
        releases.push({
          release: $(element).find("a.torrent-filename").first().text().trim(),
          subLanguage: $(elements).first().find("a").first().attr("title"),
          url: $(element).find("a.torrent-filename").first().attr("href"),
        });
      }
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

    return new Bluebird((resolve, reject) => {
      this.getToken()
        .then(token => info._token = token).catch(reject)
        .then(() => {
          const self = this;
          request.post(this.loginUrl, {form: info, jar: this.cookieJar}, function (error, response, body) {
            if (error) {
              return reject(error);
            }

            // TODO
            // if (r.uri.href === self.loginUrl) {
            //   return reject("Could not log in");
            // }

            response.headers["set-cookie"].forEach(cookie => {
              self.cookieJar.setCookie(cookie, self.baseUrl);
            });

            resolve();
          });
        });
    });
  }

  private getToken(): Bluebird<string> {
    const tokenRegex = /<meta name="_token" content="(.*?)">/;

    return new Bluebird((resolve, reject) => {
      const self = this;
      request(this.loginUrl, {jar: this.cookieJar}, function (error, response, body) {
        if (error) {
          return reject(error);
        }

        response.headers["set-cookie"].forEach(cookie => {
          self.cookieJar.setCookie(cookie, self.baseUrl);
        });

        const regex = tokenRegex.exec(body);

        if (!regex || !regex[1]) {
          return reject();
        }

        resolve(regex[1]);
      });
    });
  }

  private test(): Bluebird<void> {
    return new Bluebird<void>((resolve, reject) => {
      const self = this;
      const r = request(this.testUrl, {jar: this.cookieJar}, function (error, response, body) {
        if (error) {
          return reject();
        }

        if (r.uri.href === self.loginUrl) {
          return reject();
        }

        resolve();
      });
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
