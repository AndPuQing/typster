import React, { useEffect, useState } from "react";
import { readDir, BaseDirectory } from "@tauri-apps/plugin-fs";

interface FileTreeProps {
  workspace: string | null; // 根目录
  onFileClick?: (filePath: string) => void; // 点击文件的回调
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export default function FileTree({ workspace, onFileClick }: FileTreeProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!workspace) return;

    async function fetchEntries() {
      const entries = await readDir(workspace!, {
        baseDir: BaseDirectory.Desktop,
      });
      const tree = await buildFileTreeRecursive(workspace!, entries);
      setFileTree(tree);
    }

    async function buildFileTreeRecursive(
      parent: string,
      entries: any[]
    ): Promise<FileNode[]> {
      const tree: FileNode[] = [];
      for (const entry of entries) {
        const node: FileNode = {
          name: entry.name,
          path: `${parent}/${entry.name}`,
          isDirectory: entry.children !== undefined,
        };

        if (node.isDirectory) {
          node.children = await buildFileTreeRecursive(
            node.path,
            await readDir(node.path, { baseDir: BaseDirectory.Desktop })
          );
        }

        tree.push(node);
      }
      return tree;
    }

    fetchEntries();
  }, [workspace]);

  const toggleDirectory = (path: string) => {
    setExpandedDirs((prev) =>
      prev.has(path)
        ? new Set([...prev].filter((dir) => dir !== path))
        : new Set(prev).add(path)
    );
  };

  const renderTree = (nodes: FileNode[]) => {
    return nodes.map((node) => (
      <div key={node.path} className="pl-4 bg-red-400 min-w-10">
        {node.isDirectory ? (
          <>
            {/* 文件夹 */}
            <div
              className="cursor-pointer font-bold"
              onClick={() => toggleDirectory(node.path)}
            >
              {expandedDirs.has(node.path) ? "📂" : "📁"} {node.name}
            </div>
            {/* 子节点 */}
            {expandedDirs.has(node.path) && node.children && (
              <div className="pl-4">{renderTree(node.children)}</div>
            )}
          </>
        ) : (
          // 文件
          <div
            className="cursor-pointer hover:underline"
            onClick={() => onFileClick && onFileClick(node.path)}
          >
            📄 {node.name}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="file-tree">
      {workspace ? (
        renderTree(fileTree)
      ) : (
        <div className="text-gray-500">请选择一个工作区</div>
      )}
    </div>
  );
}
