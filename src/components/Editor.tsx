import { Monaco, loader } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";
import { useRef } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { invoke } from "@tauri-apps/api/core";

class TypstState implements monaco.languages.IState {
  clone(): monaco.languages.IState {
    return new TypstState();
  }

  equals(_other: monaco.languages.IState): boolean {
    return true;
  }
}

class TypstToken implements monaco.languages.IToken {
  scopes: string;
  startIndex: number;
  constructor(ruleName: String, startIndex: number) {
    this.scopes = ruleName.toLowerCase();
    this.startIndex = startIndex;
  }
}

class TypstLineTokens implements monaco.languages.ILineTokens {
  endState: monaco.languages.IState;
  tokens: monaco.languages.IToken[];
  constructor(tokens: monaco.languages.IToken[]) {
    this.endState = new TypstState();
    this.tokens = tokens;
  }
}

// class TypstTokensProvider implements monaco.languages.TokensProvider {
//   private _tokens: monaco.languages.IToken[];

//   constructor() {
//     this._tokens = [];
//   }

//   getInitialState(): monaco.languages.IState {
//     return new TypstState();
//   }

//   tokensForLine(input: string): monaco.languages.ILineTokens {
//     if (input === "") {
//       return new TypstLineTokens([]);
//     }
//     let myTokens: monaco.languages.IToken[] = [];

//     invoke("tokenize_code", { code: input }).then((tokens) => {
//       // @ts-ignore
//       tokens.forEach((token) => {
//         myTokens.push(new TypstToken(token.type_, token.start_id));
//       });
//       this._tokens = myTokens;
//     });
//     return new TypstLineTokens(this._tokens);
//   }

//   tokenize(
//     line: string,
//     state: monaco.languages.IState
//   ): monaco.languages.ILineTokens {
//     return this.tokensForLine(line);
//   }
// }

export default function EditorSpace() {
  const monacoRef = useRef(null);

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

    monacoinstance.languages.registerDocumentSemanticTokensProvider("typst", {
      provideDocumentSemanticTokens(
        model: monaco.editor.ITextModel,
        lastResultId,
        token
      ) {
        invoke("tokenize_code", { code: model.getValue() }).then((tokens) => {
          console.log("tokens", tokens);
        });
        return {
          resultId: "",
          data: new Uint32Array(),
        };
      },
      getLegend: function (): monaco.languages.SemanticTokensLegend {
        return {
          tokenTypes: ["adsf"],
          tokenModifiers: [""],
        };
      },
      releaseDocumentSemanticTokens: function (
        resultId: string | undefined
      ): void {
        throw new Error("Function not implemented.");
      },
    });

    // Define a new theme that contains only rules that match this language
    monacoinstance.editor.defineTheme("myCoolTheme", {
      base: "vs",
      inherit: false,
      rules: [
        { token: "comment.typst", foreground: "#a6b5b8" },
        { token: "punctuation.typst", fontStyle: "#a6b5b8" },
        { token: "constant.character.escape.typst", foreground: "#FFA500" },
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
        { token: "punctuation.definition.math.typst", foreground: "#18ac31" },
        { token: "keyword.operator.math.typst", foreground: "#000000" },
        {
          token: "markup.heading.typst",
          foreground: "#000000",
          fontStyle: "bold",
        },
        { token: "punctuation.definition.list.typst", foreground: "#ed4a76" },
        { token: "markup.list.term.typst", foreground: "#000000" },
        { token: "entity.name.label.typst", foreground: "#000000" },
        { token: "markup.other.reference.typst", foreground: "#000000" },
        { token: "keyword.typst", foreground: "#9244ec" },
        { token: "keyword.operator.typst", foreground: "#a6b5b8" },
        { token: "constant.numeric.typst", foreground: "#000000" },
        { token: "string.quoted.double.typst", foreground: "#000000" },
        { token: "entity.name.function.typst", foreground: "#00afc2" },
        { token: "meta.interpolation.typst", foreground: "#000000" },
        { token: "invalid.typst", foreground: "#ff0000" },
      ],
      colors: {
        "editor.foreground": "#000000",
      },
    });
  }

  function handleEditorDidMount(
    _editor: monaco.editor.IStandaloneCodeEditor,
    monaco: any
  ) {
    monacoRef.current = monaco;
    _editor.updateOptions({ "semanticHighlighting.enabled": true });
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
    />
  );
}
