import { Editor, Monaco, loader } from "@monaco-editor/react";
import { useRef } from "react";
import { TypstDocumentSemanticTokensProvider } from "../language";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

type EditorProps = {
  absolutePath: string;
  defaultOpenFile: string | null;
};

export default function EditorSpace(props: EditorProps) {
  const monacoRef = useRef(null);
  const editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor> =
    useRef(null);

  function handleEditorWillMount(monacoinstance: Monaco) {
    monacoinstance.languages.register({ id: "typst", extensions: [".typ"] });

    monacoinstance.languages.setLanguageConfiguration("typst", {
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"],
      },
      brackets: [
        ["[", "]"],
        ["{", "}"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "[", close: "]" },
        { open: "{", close: "}" },
        { open: "(", close: ")" },
        { open: '"', close: '"', notIn: ["string"] },
        { open: "$", close: "$", notIn: ["string"] },
      ],
      autoCloseBefore: "$ \n\t",
      surroundingPairs: [
        { open: "[", close: "]" },
        { open: "{", close: "}" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "*", close: "*" },
        { open: "`", close: "`" },
        { open: "$", close: "$" },
        { open: "_", close: "_" },
      ],
    });

    monacoinstance.languages.registerDocumentSemanticTokensProvider(
      "typst",
      new TypstDocumentSemanticTokensProvider()
    );

    // Define a new theme that contains only rules that match this language
    monacoinstance.editor.defineTheme("myCoolTheme", {
      base: "vs",
      inherit: true,
      colors: {},
      rules: [
        { token: "comment.typst", foreground: "#a6b5b8" },
        { token: "punctuation.typst", fontStyle: "#a6b5b8" },
        { token: "constant.character.escape.typst", foreground: "#1d6c76" },
        {
          token: "markup.bold.typst",
          foreground: "#000000",
          fontStyle: "bold",
        },
        {
          token: "markup.italic.typst",
          foreground: "#000000",
          fontStyle: "italic",
        },
        {
          token: "markup.underline.link.typst",
          foreground: "#0000FF",
          fontStyle: "underline",
        },
        { token: "markup.raw.typst", foreground: "#000000" },
        { token: "punctuation.definition.math.typst", foreground: "#2a8f10" },
        { token: "keyword.operator.math.typst", foreground: "#000000" },
        {
          token: "markup.heading.typst",
          foreground: "#000000",
          fontStyle: "bold underline",
        },
        { token: "punctuation.definition.list.typst", foreground: "#8b41b1" },
        { token: "markup.list.term.typst", foreground: "#000000" },
        { token: "entity.name.label.typst", foreground: "#1d6c76" },
        { token: "markup.other.reference.typst", foreground: "#1d6c76" },
        { token: "keyword.typst", foreground: "#e03a49" },
        { token: "keyword.operator.typst", foreground: "#a6b5b8" },
        { token: "constant.numeric.typst", foreground: "#b30e58" },
        { token: "string.quoted.double.typst", foreground: "#2a8f10" },
        { token: "entity.name.function.typst", foreground: "#4b69c6" },
        { token: "meta.interpolation.typst", foreground: "#8b41b1" },
        { token: "invalid.typst", foreground: "#ff0000" },
      ],
    });
  }

  function handleEditorDidMount(
    _editor: monaco.editor.IStandaloneCodeEditor,
    monacoinstance: Monaco
  ) {
    // @ts-ignore
    monacoRef.current = monacoinstance;
    // @ts-ignore
    editorRef.current = _editor;

    _editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      _editor.trigger("", "editor.action.fontZoomIn", null as any);
    });

    _editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      _editor.trigger("", "editor.action.fontZoomOut", null as any);
    });
  }

  function handleEditorChange(
    value: string | undefined,
    ev: monaco.editor.IModelContentChangedEvent
  ) {
    if (monacoRef.current) {
    }
  }

  loader.config({
    paths: {
      vs: "node_modules/monaco-editor/min/vs",
    },
  });

  return (
    <Editor
      height="90vh"
      defaultLanguage="typst"
      defaultValue=""
      theme="myCoolTheme"
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      options={{
        "semanticHighlighting.enabled": true,
      }}
      onChange={handleEditorChange}
    />
  );
}
