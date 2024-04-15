import type { Options } from "markdown-it";
import type Renderer from "markdown-it/lib/renderer.mjs";
import type Token from "markdown-it/lib/token.mjs";

export interface MarkdownItTabData {
  /**
   * Title of tab
   *
   * Tab 标题
   */
  title: string;

  /**
   * Tab index
   *
   * Tab 索引
   */
  index: number;

  /**
   * Identifier of tab
   *
   * Tab 标识符
   */
  id?: string;

  /**
   * Whether the tab is active
   *
   * Tab 是否激活
   */
  isActive?: boolean;
}

export interface MarkdownItTabInfo {
  /**
   * Which tab is active
   *
   * @description -1 means no tab is active
   *
   * 激活的 Tab
   *
   * @description -1 表示没有 Tab 激活
   */
  active: number;

  /**
   * Data of tabs
   *
   * Tab 数据
   */
  data: MarkdownItTabData[];
}

export interface MarkdownItTabOptions {
  /**
   * The name of the tab container.
   *
   * Tab 容器的名称。
   */
  name: string;

  /**
   * Tabs open renderer
   */
  tabsOpenRenderer?: (
    info: MarkdownItTabInfo,
    tokens: Token[],
    index: number,
    options: Options,
    env: unknown,
    self: Renderer,
  ) => string;

  /**
   * Tabs close renderer
   */
  tabsCloseRenderer?: (
    tokens: Token[],
    index: number,
    options: Options,
    env: unknown,
    self: Renderer,
  ) => string;

  /**
   * tab open renderer
   */
  tabOpenRenderer?: (
    data: MarkdownItTabData,
    tokens: Token[],
    index: number,
    options: Options,
    env: unknown,
    self: Renderer,
  ) => string;

  /**
   * tab close renderer
   */
  tabCloseRenderer?: (
    tokens: Token[],
    index: number,
    options: Options,
    env: unknown,
    self: Renderer,
  ) => string;
}
