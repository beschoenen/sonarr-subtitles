import BaseProvider from "../providers/BaseProvider";
import SearchResult from "../models/SearchResult";
import Bluebird from "bluebird";

class ProviderManager {

  public providers: BaseProvider[];

  constructor() {
    this.providers = [];
  }

  public registerProvider(provider: BaseProvider) {
    this.providers.push(provider);
  }

  public search(phrase: string): Bluebird<SearchResult[]> {
    return Bluebird.map(this.providers, (provider: BaseProvider) => provider.search(phrase))
      .then(results => [].concat(...results));
  }
}

export let providerManager = new ProviderManager();
