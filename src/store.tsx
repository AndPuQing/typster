import { atomWithStorage } from "jotai/utils";
import { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { Store } from "@tauri-apps/plugin-store";
import { Space, User, Favorite } from "@/schemes";

class MyStore implements AsyncStorage<any> {
  public store!: Store;

  public async init() {
    this.store = await Store.load("app.bin");
  }

  public async getItem(key: string, initialValue: any): Promise<any> {
    if (!(await this.store.has(key))) {
      await this.store.set(key, initialValue);
      return initialValue;
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

export const userAtom = atomWithStorage<User>(
  "user",
  { name: "Guest", email: "example@mail.com", avatar: "/avatars/shadcn.jpg" },
  store,
  { getOnInit: true }
);

export const lastOpenSpaceAtom = atomWithStorage<number>(
  "lastOpenSpace",
  0,
  store,
  { getOnInit: true }
);

export const spacesAtom = atomWithStorage<Space[]>(
  "spaces",
  [
    {
      name: "Personal",
      icon: "🏠",
      url: "/",
    },
  ],
  store,
  { getOnInit: true }
);

export const favoritesAtom = atomWithStorage<Favorite[]>(
  "favorites",
  [],
  store,
  { getOnInit: true }
);
