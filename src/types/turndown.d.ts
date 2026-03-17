declare module "turndown" {
  interface TurndownOptions {
    headingStyle?: "setext" | "atx";
    hr?: string;
    br?: string;
    codeBlockStyle?: "indented" | "fenced";
    fence?: string;
    emDelimiter?: "*" | "_";
    strongDelimiter?: "**" | "__";
    linkStyle?: "inlined" | "referenced";
    linkReferenceStyle?: "full" | "collapsed" | "shortcut";
    preformattedCode?: boolean;
    treatAsChunk?: string[];
    bulletListMarker?: "-" | "*" | "+";
    rules?: Record<string, any>;
  }

  class TurndownService {
    constructor(options?: TurndownOptions);
    turndown(html: string | HTMLElement): string;
    addRule(name: string, rule: any): TurndownService;
    remove(tagName: string | string[]): TurndownService;
    escape(string: string): string;
  }

  export = TurndownService;
}
