import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { invoke } from "@tauri-apps/api/core";

export class TypstDocumentSemanticTokensProvider
  implements monaco.languages.DocumentSemanticTokensProvider
{
  private _legend: monaco.languages.SemanticTokensLegend;
  private _tokens: monaco.languages.SemanticTokens;

  constructor() {
    this._legend = {
      tokenTypes: [],
      tokenModifiers: [],
    };
    this._tokens = {
      resultId: "",
      data: new Uint32Array(),
    };
  }

  async provideDocumentSemanticTokens(
    model: monaco.editor.ITextModel,
    _lastResultId: string | null,
    _token: monaco.CancellationToken
  ): Promise<monaco.languages.SemanticTokens> {
    await invoke("tokenize_tauri", { code: model.getValue() }).then(
      (tokens) => {
        this._tokens = {
          resultId: undefined,
          // @ts-ignore
          data: new Uint32Array(tokens),
        };
      }
    );
    return this._tokens;
  }
  getLegend(): monaco.languages.SemanticTokensLegend {
    invoke("get_legend").then((legend) => {
      // @ts-ignore
      this._legend.tokenTypes = legend;
    });
    return this._legend;
  }

  releaseDocumentSemanticTokens(_resultId: string | undefined): void {}
}
