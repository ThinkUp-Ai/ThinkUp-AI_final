declare module "react-markdown" {
    import * as React from "react";
    const ReactMarkdown: React.ComponentType<{
      children?: React.ReactNode;
      remarkPlugins?: any[];
      components?: Record<string, React.ComponentType<any> | any>;
      linkTarget?: string | ((href: string, children: React.ReactNode, title?: string) => string | undefined);
      className?: string;
    }>;
    export default ReactMarkdown;
  }
  