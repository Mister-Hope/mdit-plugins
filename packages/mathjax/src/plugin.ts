/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Forked from https://github.com/tani/markdown-it-mathjax3/blob/master/index.ts
 */

import { createRequire } from "node:module";

import { tex } from "@mdit/plugin-tex";
import { type PluginWithOptions } from "markdown-it";
import { type LiteDocument } from "mathjax-full/cjs/adaptors/lite/Document.js";
import {
  type LiteElement,
  type LiteNode,
} from "mathjax-full/cjs/adaptors/lite/Element.js";
import { type LiteText } from "mathjax-full/cjs/adaptors/lite/Text.js";
import { type LiteAdaptor } from "mathjax-full/cjs/adaptors/liteAdaptor.js";
import { type MathDocument } from "mathjax-full/cjs/core/MathDocument.js";
import { type TeX } from "mathjax-full/cjs/input/tex.js";
import { type CHTML } from "mathjax-full/cjs/output/chtml.js";
import { type SVG } from "mathjax-full/cjs/output/svg.js";
// import path from "upath";

import { type MarkdownItMathjaxOptions } from "./options.js";

const require = createRequire(import.meta.url);

export interface DocumentOptions {
  InputJax: TeX<LiteElement, string, HTMLElement>;
  OutputJax:
    | CHTML<LiteElement, string, HTMLElement>
    | SVG<LiteElement, string, HTMLElement>;
  enableAssistiveMml: boolean;
}

export const getDocumentOptions = (
  options: MarkdownItMathjaxOptions,
): DocumentOptions | null => {
  try {
    const { AllPackages } = <
      typeof import("mathjax-full/cjs/input/tex/AllPackages.js")
    >require("mathjax-full/cjs/input/tex/AllPackages.js");

    const { TeX } = <typeof import("mathjax-full/cjs/input/tex.js")>(
      require("mathjax-full/cjs/input/tex.js")
    );
    const { CHTML } = <typeof import("mathjax-full/cjs/output/chtml.js")>(
      require("mathjax-full/cjs/output/chtml.js")
    );
    const { SVG } = <typeof import("mathjax-full/cjs/output/svg.js")>(
      require("mathjax-full/cjs/output/svg.js")
    );

    require("mathjax-full/cjs/util/asyncLoad/node.js");

    const OutputJax =
      options.output === "chtml"
        ? new CHTML<LiteElement, string, HTMLElement>({
            adaptiveCSS: true,
            ...options.chtml,
          })
        : new SVG<LiteElement, string, HTMLElement>({
            fontCache: "none",
            ...options.svg,
          });

    OutputJax.font.loadDynamicFilesSync();

    return {
      InputJax: new TeX<LiteElement, string, HTMLElement>({
        packages: AllPackages,
        ...options.tex,
      }),
      OutputJax,
      enableAssistiveMml: options.a11y !== false,
    };
  } catch (err) {
    console.error('[@mdit/mathjax] "mathjax-full" is not installed!');

    return null;
  }
};

/**
 * Mathjax instance
 */
export interface MathjaxInstance
  extends Required<
    Pick<MarkdownItMathjaxOptions, "allowInlineWithSpace" | "mathFence">
  > {
  /**
   * Mathjax adaptor
   */
  adaptor: LiteAdaptor;

  /**
   * Mathjax document options
   */
  documentOptions: DocumentOptions;

  /**
   * Clear style cache
   */
  clearStyle: () => void;

  /**
   * Output style for rendered content and clears it
   *
   * @returns style
   */
  outputStyle: () => string;

  /**
   * Reset tex (including labels)
   */
  reset: () => void;

  /**
   * @private
   */
  vPre: boolean;
}

export const createMathjaxInstance = (
  options: MarkdownItMathjaxOptions = {},
): MathjaxInstance | null => {
  const documentOptions = getDocumentOptions(options);

  if (!documentOptions) return null;

  const { OutputJax, InputJax } = documentOptions;

  const { CHTML } = <typeof import("mathjax-full/cjs/output/chtml.js")>(
    require("mathjax-full/cjs/output/chtml.js")
  );
  const adaptor = (<typeof import("mathjax-full/cjs/adaptors/liteAdaptor.js")>(
    require("mathjax-full/cjs/adaptors/liteAdaptor.js")
  )).liteAdaptor();
  const registerHTMLHandler = (<
    typeof import("mathjax-full/cjs/handlers/html.js")
  >require("mathjax-full/cjs/handlers/html.js")).RegisterHTMLHandler;
  const assistiveMmlHandler = (<
    typeof import("mathjax-full/cjs/a11y/assistive-mml.js")
  >require("mathjax-full/cjs/a11y/assistive-mml.js")).AssistiveMmlHandler;
  const { mathjax } = <typeof import("mathjax-full/cjs/mathjax.js")>(
    require("mathjax-full/cjs/mathjax.js")
  );

  const handler = registerHTMLHandler(adaptor);

  if (options.a11y !== false)
    assistiveMmlHandler<LiteNode, LiteText, LiteDocument>(handler);

  const clearStyle = (): void => {
    // clear style cache
    if (OutputJax instanceof CHTML) OutputJax.clearCache();
  };

  const reset = (): void => {
    InputJax.reset();
  };

  const outputStyle = (): string => {
    const style = adaptor.innerHTML(
      OutputJax.styleSheet(
        <MathDocument<LiteElement, string, HTMLElement>>(
          mathjax.document("", documentOptions)
        ),
      ),
    );

    clearStyle();

    return style;
  };

  return {
    adaptor,
    documentOptions,
    allowInlineWithSpace: options.allowInlineWithSpace ?? false,
    mathFence: options.mathFence ?? false,
    clearStyle,
    reset,
    outputStyle,
    vPre: options.vPre ?? false,
  };
};

export const mathjax: PluginWithOptions<MathjaxInstance> = (md, instance) => {
  const { mathjax } = <typeof import("mathjax-full/cjs/mathjax.js")>(
    require("mathjax-full/cjs/mathjax.js")
  );
  const { allowInlineWithSpace, adaptor, documentOptions, mathFence, vPre } =
    instance!;

  md.use(tex, {
    allowInlineWithSpace,
    mathFence,
    render: (content, displayMode) => {
      const mathDocument = <LiteElement>(
        mathjax.document(content, documentOptions).convert(content, {
          display: displayMode,
        })
      );

      const result = adaptor.outerHTML(mathDocument);

      return vPre
        ? result.replace(/^<mjx-container/, "<mjx-container v-pre")
        : result;
    },
  });
};
