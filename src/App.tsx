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

export default function App() {
  // slide bar
  const [show_slide_bar, setShowSlideBar] = useState(true);
  const navigate = useNavigate();
  return (
    <NextUIProvider navigate={navigate}>
      <div className="flex h-screen">
        {
          /* slide bar */
          show_slide_bar && (
            <div className="w-64 h-full pt-14 px-4 flex flex-col gap-4">
              <div className="grid gap-4">
                <div className="hover:bg-gray-100 rounded-lg pt-2 pb-1 px-2 items-center">
                  <User
                    name="Demo Workspace"
                    description={
                      <WorkspaceItem
                        workspace={{
                          name: "Local",
                          type: WorkspaceType.LOCAL,
                        }}
                      />
                    }
                    avatarProps={{
                      src: "https://i.pravatar.cc/150?u=a04258114e29026702d",
                    }}
                  />
                </div>

                <Listbox
                  aria-label="Actions"
                  onAction={(key) => alert(key)}
                  variant="solid"
                  className="p-0 gap-1"
                  itemClasses={{
                    base: "pl-2 rounded-lg h-10 data-[hover=true]:bg-default-100/80",
                  }}
                >
                  <ListboxItem key="allproject" startContent={<IconFile />}>
                    All Project
                  </ListboxItem>
                  <ListboxItem key="setting" startContent={<IconSetting />}>
                    Setting
                  </ListboxItem>
                  <ListboxSection title="Favorites">
                    <ListboxItem key="setting" startContent={<IconSetting />}>
                      Setting
                    </ListboxItem>
                  </ListboxSection>
                </Listbox>
              </div>
            </div>
          )
        }
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
            <EditorSpace />
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
