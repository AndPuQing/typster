export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface Space {
  name: string;
  icon: string; // emoji
  url: string; // url or path
}

export interface Favorite {
  name: string; // file name
  url: string; // url or path
  emoji: string;
}

export interface WorkspaceEntry {
  name: string; // directory name
  emoji: string;
  pages: {
    name: string; // file name
    url: string; // url or path
    emoji: string;
  }[];
  children?: WorkspaceEntry[];
}