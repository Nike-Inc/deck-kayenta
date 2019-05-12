export interface IDelegate {
  name: string;
}

export class DelegateService<T extends IDelegate> {
  private delegates: T[] = [];

  public register(delegate: T): void {
    this.delegates.push(delegate);
  }

  public getDelegate(name: string): T {
    return this.delegates.find(d => d.name === name);
  }
}

export const buildDelegateService = <T extends IDelegate>(): DelegateService<T> => {
  return new DelegateService<T>();
};
