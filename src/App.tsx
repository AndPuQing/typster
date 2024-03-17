import {
  Button,
  User,
  Listbox,
  ListboxItem,
  ListboxSection,
  NextUIProvider,
} from "@nextui-org/react";
import { ReactNode, useEffect, useState } from "react";
import {
  IconSidebar,
  IconServer,
  IconGlobe,
  IconFile,
  IconSetting,
  IconFolder,
} from "@douyinfe/semi-icons";
import { Divider } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import EditorSpace from "./components/Editor";
import { Tree } from "@douyinfe/semi-ui";
import { TreeNodeData } from "@douyinfe/semi-ui/lib/es/tree";
import { appDataDir } from "@tauri-apps/api/path";
import {
  BaseDirectory,
  writeFile,
  writeTextFile,
  exists,
  create,
  mkdir,
  readDir,
} from "@tauri-apps/plugin-fs";

enum WorkspaceType {
  LOCAL = "Local",
  REMOTE = "Remote",
}

interface Workspace {
  name: string;
  type: WorkspaceType;
}

function WorkspaceItem({ workspace }: { workspace: Workspace }) {
  return (
    <div className="flex items-center gap-2">
      {workspace.type === WorkspaceType.LOCAL ? <IconServer /> : <IconGlobe />}
      <span>{workspace.name}</span>
    </div>
  );
}

class ProjectTree implements TreeNodeData {
  label: string;
  key?: string | undefined;
  children?: ProjectTree[];
  icon?: ReactNode;
  isDirectory?: boolean;
  absolutePath?: string;
  constructor(label: string, isDirectory = false, absolutePath?: string) {
    this.label = label;
    this.key = label;
    this.icon = isDirectory ? <IconFolder /> : <IconFile />;
    this.isDirectory = isDirectory;
    this.absolutePath = absolutePath;
  }
}

export default function App() {
  // slide bar
  const [show_slide_bar, setShowSlideBar] = useState(true);
  const [projectDirTree, setProjectDirTree] = useState<TreeNodeData[]>();
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    createDefaultProject();
  }, []);

  async function processEntriesRecursive(parent: any, entries: any) {
    for (const entry of entries) {
      if (entry.isDirectory) {
        const child = new ProjectTree(entry.name, true);
        parent.children = parent.children || [];
        parent.children.push(child);
        processEntriesRecursive(
          child,
          await readDir(parent.label + "/" + entry.name, {
            baseDir: BaseDirectory.AppData,
          })
        );
      } else {
        const child = new ProjectTree(entry.name);
        child.absolutePath = parent.label + "/" + entry.name;
        parent.children = parent.children || [];
        parent.children.push(child);
      }
    }
  }

  const createDefaultProject = async () => {
    const exist = await exists("default", { baseDir: BaseDirectory.AppData });
    if (!exist) {
      await mkdir("default", {
        baseDir: BaseDirectory.AppData,
      });
    }
    await writeTextFile("default/main.typ", "= Start", {
      baseDir: BaseDirectory.AppData,
    });
    const entries = await readDir("default", {
      baseDir: BaseDirectory.AppData,
    });
    let tree = new ProjectTree("default", true);
    await processEntriesRecursive(tree, entries);
    setProjectDirTree([tree]);
  };

  return (
    <NextUIProvider navigate={navigate}>
      <div className="flex h-screen">
        {show_slide_bar && (
          <div className="w-64 h-full pt-14 px-4 flex flex-col gap-4">
            <Tree
              treeData={projectDirTree}
              // @ts-ignore
              onDoubleClick={(_e, node: ProjectTree) => {
                if (node.isDirectory) {
                  return;
                }
                // @ts-ignore
                setCurrentFile(node.absolutePath);
              }}
            />
          </div>
        )}

        <Divider orientation="vertical" />
        {/* main content */}
        <div className="w-full flex-1 flex-col">
          <main className="h-full w-full overflow-visible pt-2 px-4 flex flex-col">
            {/* <Tabs
              aria-label="Options"
              selectedKey={selected}
              className="self-center"
              onSelectionChange={setSelected}
            >
              <Tab key="photos" title="Project">
                <Card>
                  <CardBody>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="music" title="Favorites"></Tab>
            </Tabs> */}
            <EditorSpace file={currentFile} />
          </main>
          <Button
            className="bg-transparent hover:bg-gray-100 absolute left-4 top-2"
            onClick={() => setShowSlideBar(!show_slide_bar)}
            isIconOnly
          >
            <IconSidebar />
          </Button>
        </div>
      </div>
    </NextUIProvider>
  );
}
