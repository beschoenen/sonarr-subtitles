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
    const items: SearchResult[] = [];

    return Bluebird.each(this.providers, (provider: BaseProvider) => {
      return provider.search(phrase).then(results => {
        results.forEach(result => {
          result.provider = provider;
          items.push(result);
        });
      });
    }).then(() => Bluebird.resolve(items));
  }
}

export let providerManager = new ProviderManager();
