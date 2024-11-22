import { atomWithStorage } from "jotai/utils";
import { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { Store } from "@tauri-apps/plugin-store";

class MyStore implements AsyncStorage<any> {
  public store!: Store;

  public async init() {
    this.store = await Store.load("app.bin");
  }

  public async getItem(key: string, initialValue: any) {
    if (!(await this.store.has(key))) {
      return this.store.set(key, initialValue);
    } else return this.store.get(key);
  }

  public async setItem(key: string, newValue: any) {
    console.log("set", key, newValue);
    this.store.set(key, newValue);
  }

  public async removeItem(key: string) {
    this.store.delete(key);
  }
}

export const store = new MyStore();
await store.init();

export const userAtom = atomWithStorage(
  "user",
  { name: "Guest", email: "me", avatar: "/avatars/shadcn.jpg" },
  store,
  { getOnInit: false }
);
