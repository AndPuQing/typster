import {
  Button,
  User,
  Listbox,
  ListboxItem,
  ListboxSection,
  NextUIProvider,
} from "@nextui-org/react";
import { useState } from "react";
import {
  IconSidebar,
  IconServer,
  IconGlobe,
  IconFile,
  IconSetting,
} from "@douyinfe/semi-icons";
import { Divider } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import EditorSpace from "./components/Editor";
import { Tree } from "@douyinfe/semi-ui";
import { documentDir, appDataDir, desktopDir } from "@tauri-apps/api/path";

import { readDir, BaseDirectory } from "@tauri-apps/plugin-fs";

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

export interface Project {
  absolutePath: string;
  defaultOpenFile: string | null;
}

export default function App() {
  // slide bar
  const [show_slide_bar, setShowSlideBar] = useState(true);
  const navigate = useNavigate();

  const tempProject: Project = {
    absolutePath: "/home/happy/Documents/typster",
    defaultOpenFile: null,
  };

  const readDirAsync = async () => {
    const dir = await desktopDir();
    console.log(dir);
  };
  readDirAsync();

  const treeData = [
    {
      label: "Asia",
      value: "Asia",
      key: "0",
      children: [
        {
          label: "China",
          value: "China",
          key: "0-0",
          children: [
            {
              label: "Beijing",
              value: "Beijing",
              key: "0-0-0",
            },
            {
              label: "Shanghai",
              value: "Shanghai",
              key: "0-0-1",
            },
          ],
        },
        {
          label: "Japan",
          value: "Japan",
          key: "0-1",
          children: [
            {
              label: "Osaka",
              value: "Osaka",
              key: "0-1-0",
            },
          ],
        },
      ],
    },
    {
      label: "North America",
      value: "North America",
      key: "1",
      children: [
        {
          label: "United States",
          value: "United States",
          key: "1-0",
        },
        {
          label: "Canada",
          value: "Canada",
          key: "1-1",
        },
      ],
    },
  ];
  return (
    <NextUIProvider navigate={navigate}>
      <div className="flex h-screen">
        {show_slide_bar && (
          <div className="w-64 h-full pt-14 px-4 flex flex-col gap-4">
            <Tree treeData={treeData} directory />
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
            <EditorSpace {...tempProject} />
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
