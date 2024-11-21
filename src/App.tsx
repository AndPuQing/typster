import {
  Button,
  Listbox,
  ListboxItem,
  NextUIProvider,
  Tab,
  Tabs,
} from "@nextui-org/react";

import { Divider } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { load } from "@tauri-apps/plugin-store";
import FileTree from "./components/FileTree";
import { BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";

import { PanelRightClose, PanelRightOpen, Plus, X } from "lucide-react";

interface TabList {
  filename: string;
}

export default function App() {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [tabList, setTabList] = useState<TabList[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const store = await load("store.json", { autoSave: true });
      // const lastWorkspace = await store.get<string>("lastWorkspace");
      const lastWorkspace = null;
      if (!lastWorkspace) {
        try {
          await mkdir("defaultWorkspace", { baseDir: BaseDirectory.Desktop });
        } catch (e) {
          console.log(e);
        }
        await store.set("lastWorkspace", "defaultWorkspace");
        setWorkspace("defaultWorkspace");
      } else {
        setWorkspace(lastWorkspace);
      }
    };
    fetchData();
  }, []);

  return (
    <NextUIProvider navigate={navigate}>
      <div className="grid grid-rows-[auto_1fr] h-screen">
        <div className="flex bg-gray-50 border-b justify-start">
          <Button isIconOnly className="bg-gray-50">
            <PanelRightClose />
          </Button>
          <Listbox
            items={tabList}
            aria-label="Dynamic Actions"
            onAction={(key) => alert(key)}
          >
            {(item) => (
              <ListboxItem key={item.filename} color={"default"}>
                {item.filename}
              </ListboxItem>
            )}
          </Listbox>

          {/* <Tabs variant="light" color="primary">
            {tabList.map((tab, index) => (
              <Tab
                key={index}
                title={
                  <div className="flex items-center space-x-2">
                    <span>{tab.filename}</span>
                    <Button
                      isIconOnly
                      color="primary"
                      size="sm"
                      onClick={() => {
                        console.log(tabList);
                        setTabList(tabList.filter((_, i) => i !== index));
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                }
                className="text-sm"
              />
            ))}
          </Tabs> */}
          <Button
            isIconOnly
            className="bg-gray-50"
            onClick={() => {
              setTabList([...tabList, { filename: "New File" }]);
            }}
          >
            <Plus />
          </Button>
        </div>
        <div className="grid grid-cols-[1fr_auto_3fr]">
          <div className="bg-gray-50 p-4 border-r overflow-y-auto">
            <FileTree workspace={workspace} />
          </div>

          <Divider orientation="vertical" />

          {/* 右侧内容区域 */}
          <div className="p-4 overflow-y-auto">
            {/* <Container>
              <h1 className="text-2xl font-bold">
                Welcome to the Knowledge Base
              </h1>
              <p className="text-gray-600">
                Select a file from the left to start editing.
              </p>
            </Container> */}
          </div>
        </div>
      </div>
    </NextUIProvider>
  );
}
