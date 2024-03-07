import { Component } from "react";
import {
  IconClose,
  IconGithubLogo,
  IconMaximize,
  IconMinus,
} from "@douyinfe/semi-icons";
import { appWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/tauri";

export default class Titlebar extends Component {
  render() {
    return (
      <div
        className="flex items-center w-full fixed top-0 left-0 right-0"
        data-tauri-drag-region
      >
        <div
          className="left-0 items-center flex p-4 absolute top-0"
          data-tauri-drag-region
        >
          <IconGithubLogo />
        </div>
        <div
          className="right-0 items-center flex absolute top-0"
          data-tauri-drag-region
        >
          <div
            id="titlebar-minimize"
            className="flex p-4 items-center hover:bg-gray-200"
            onClick={() => {
              appWindow.minimize();
            }}
          >
            <IconMinus />
          </div>
          <div
            id="titlebar-maximize"
            className="flex p-4 items-center hover:bg-gray-200"
            onClick={() => {
              appWindow.toggleMaximize();
            }}
          >
            <IconMaximize />
          </div>
          <div
            id="titlebar-close"
            className="flex p-4 items-center hover:bg-red-500"
            onClick={() => {
              appWindow.close();
            }}
          >
            <IconClose />
          </div>
        </div>
      </div>
    );
  }
}
