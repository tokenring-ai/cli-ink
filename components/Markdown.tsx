import {Box, Newline, Text} from 'ink';
import SyntaxHighlight from 'ink-syntax-highlight';
import {Lexer, Token, Tokens} from 'marked';
import React, {ReactNode} from 'react';

const validLanguages = {
  // Popular Programming Languages
  python: "python",
  javascript: "javascript",
  js: "javascript",
  jsx: "javascript",
  java: "java",
  cpp: "cpp",
  cxx: "cpp",
  "c++": "cpp",
  hpp: "hpp",
  hxx: "hpp",
  "h++": "hpp",
  c: "c",
  h: "h",
  csharp: "csharp",
  cs: "csharp",
  go: "go",
  golang: "go",
  ruby: "ruby",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  rust: "rust",
  typescript: "typescript",
  ts: "typescript",
  tsx: "typescript",
  scala: "scala",
  perl: "perl",
  haskell: "haskell",
  hs: "haskell",
  lua: "lua",

  // Web Development Languages and Technologies
  html: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  xml: "xml",
  json: "json",
  yaml: "yaml",
  yml: "yaml",

  // Scripting and Shell Languages
  bash: "bash",
  sh: "bash",
  powershell: "powershell",
  ps1: "powershell",
  sql: "sql",
  r: "r",

  // Other
  markdown: "markdown",
  md: "markdown",
  diff: "diff",
  ini: "ini",
  toml: "toml",
  dockerfile: "dockerfile",
  mermaid: "mermaid",
}


// Types for styling options
export interface InkMarkdownOptions {
  /** Width for code blocks and horizontal rules */
  width?: number;
  /** Indentation string for nested elements */
  indent?: string;
  /** Show heading prefix (# symbols) */
  showHeadingPrefix?: boolean;
  /** Text color **/
  textColor?: string;
}

const defaultOptions: Required<InkMarkdownOptions> = {
  width: 80,
  indent: '  ',
  showHeadingPrefix: true,
  textColor: 'green',
};

// Inline token renderer
function renderInlineTokens(tokens: Token[], key: string = '', options: Required<InkMarkdownOptions>): ReactNode[] {
  return tokens.map((token, index) => {
    const tokenKey = `${key}-${index}`;

    switch (token.type) {
      case 'text':
        return <Text key={tokenKey} color={options.textColor}>{(token as Tokens.Text).text}</Text>;

      case 'strong':
        return (
          <Text key={tokenKey} bold>
            {renderInlineTokens((token as Tokens.Strong).tokens, tokenKey, options)}
          </Text>
        );

      case 'em':
        return (
          <Text key={tokenKey} italic>
            {renderInlineTokens((token as Tokens.Em).tokens, tokenKey, options)}
          </Text>
        );

      case 'codespan':
        return (
          <Text key={tokenKey} color="yellow">
            {(token as Tokens.Codespan).text}
          </Text>
        );

      case 'del':
        return (
          <Text key={tokenKey} strikethrough dimColor>
            {renderInlineTokens((token as Tokens.Del).tokens, tokenKey, options)}
          </Text>
        );

      case 'link': {
        const linkToken = token as Tokens.Link;
        const linkText = linkToken.tokens ? renderInlineTokens(linkToken.tokens, tokenKey, options) : linkToken.text;
        return (
          <Text key={tokenKey} color="blue">
            {linkText}
            <Text dimColor> ({linkToken.href})</Text>
          </Text>
        );
      }

      case 'image': {
        const imgToken = token as Tokens.Image;
        return (
          <Text key={tokenKey} color="cyan">
            [Image: {imgToken.title || imgToken.href}]
          </Text>
        );
      }

      case 'br':
        return <Newline key={tokenKey}/>;

      case 'escape':
        return <Text key={tokenKey}>{(token as Tokens.Escape).text}</Text>;

      default:
        // Handle raw text that might be in tokens
        if ('text' in token && typeof (token as any).text === 'string') {
          return <Text key={tokenKey}>{(token as any).text}</Text>;
        }
        if ('raw' in token && typeof (token as any).raw === 'string') {
          return <Text key={tokenKey}>{(token as any).raw}</Text>;
        }
        return null;
    }
  });
}

// Block token renderer
function renderBlockToken(
  token: Token,
  index: number,
  options: Required<InkMarkdownOptions>
): ReactNode {
  const key = `block-${index}`;

  switch (token.type) {
    case 'heading': {
      const headingToken = token as Tokens.Heading;
      const prefix = options.showHeadingPrefix ? '#'.repeat(headingToken.depth) + ' ' : '';
      const color = headingToken.depth === 1 ? 'magenta' : 'green';

      return (
        <Box key={key} marginBottom={1}>
          <Text color={color} bold underline={headingToken.depth === 1}>
            {prefix}
            {renderInlineTokens(headingToken.tokens, key, options)}
          </Text>
        </Box>
      );
    }

    case 'paragraph': {
      const paraToken = token as Tokens.Paragraph;
      return (
        <Box key={key}>
          <Text>{renderInlineTokens(paraToken.tokens, key, options)}</Text>
        </Box>
      );
    }

    case 'html':
      return (
        <Box key={key} flexDirection="column">
          <SyntaxHighlight code={token.text} language="html"/>
        </Box>
      );
    case 'code': {
      const codeToken = token as Tokens.Code;
      const language = validLanguages[codeToken.lang as keyof typeof validLanguages];

      return (
        <Box key={key} flexDirection="column">
          <Box flexDirection="row">
            <Box width={2} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false}/>
            <Text inverse italic>{(codeToken.lang ?? "code").toUpperCase()}</Text>
            <Box flexGrow={1} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false}/>
          </Box>
          <SyntaxHighlight code={codeToken.text} language={language}/>
        </Box>
      );
    }

    case 'blockquote': {
      const quoteToken = token as Tokens.Blockquote;
      return (
        <Box key={key} flexDirection="column" marginBottom={1} paddingLeft={2}>
          {quoteToken.tokens.map((t, i) => (
            <Box key={`${key}-quote-${i}`} flexDirection="row">
              <Text color="gray">│ </Text>
              <Box flexDirection="column">
                {renderBlockToken(t, i, options)}
              </Box>
            </Box>
          ))}
        </Box>
      );
    }

    case 'list': {
      const listToken = token as Tokens.List;
      return (
        <Box key={key} flexDirection="column">
          {listToken.items.map((item, itemIndex) => {
            const bullet = listToken.ordered ? `${itemIndex + 1}.` : '•';
            const checkbox = item.task
              ? item.checked
                ? '[✓] '
                : '[ ] '
              : bullet;

            return (
              <Box key={`${key}-item-${itemIndex}`} paddingLeft={2} flexDirection="row" gap={1}>
                <Text>{checkbox}</Text>
                <Box flexDirection="column">
                  {item.tokens.map((t, i) => {
                    if (t.type === 'text' && (t as Tokens.Text).tokens) {
                      return (
                        <Text key={`${key}-item-${itemIndex}-${i}`}>
                          {renderInlineTokens((t as Tokens.Text).tokens!, `${key}-item-${itemIndex}-${i}`, options)}
                        </Text>
                      );
                    }
                    if (t.type === 'paragraph' && (t as Tokens.Paragraph).tokens) {
                      return (
                        <Text key={`${key}-item-${itemIndex}-${i}`}>
                          {renderInlineTokens((t as Tokens.Paragraph).tokens, `${key}-item-${itemIndex}-${i}`, options)}
                        </Text>
                      );
                    }
                    if (t.type === 'checkbox') return null;
                    return renderBlockToken(t, i, options);
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      );
    }

    case 'checkbox': {
      const checkboxToken = token as Tokens.Checkbox;
      const checked = checkboxToken.checked;
      const checkboxIcon = checked ? '[✓]' : '[ ]';

      return (
        <Box key={key} marginBottom={1}>
          <Text>{checkboxIcon} </Text>
        </Box>
      );
    }

    case 'def': {
      const defToken = token as Tokens.Def;
      return (
        <Box key={key} marginBottom={1}>
          <Text dimColor italic>
            [{defToken.tag}]: {defToken.href}
            {defToken.title ? ` "${defToken.title}"` : ''}
          </Text>
        </Box>
      );
    }

    case 'hr':
      return <Box flexGrow={1} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false}/>;

    case 'table': {
      const tableToken = token as Tokens.Table;

      return (
        <Box key={key} flexDirection="column" marginBottom={1}>
          {/* Header */}
          <Box>
            {tableToken.header.map((cell, cellIndex) => (
              <Box key={`${key}-header-${cellIndex}`} width={20} paddingRight={2}>
                <Text bold>{renderInlineTokens(cell.tokens, `${key}-header-${cellIndex}`, options)}</Text>
              </Box>
            ))}
          </Box>
          {/* Separator */}
          <Box>
            {tableToken.header.map((_, cellIndex) => (
              <Box key={`${key}-sep-${cellIndex}`} width={20} paddingRight={2}>
                <Text dimColor>{'─'.repeat(18)}</Text>
              </Box>
            ))}
          </Box>
          {/* Rows */}
          {tableToken.rows.map((row, rowIndex) => (
            <Box key={`${key}-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <Box key={`${key}-row-${rowIndex}-cell-${cellIndex}`} width={20} paddingRight={2}>
                  <Text>{renderInlineTokens(cell.tokens, `${key}-row-${rowIndex}-cell-${cellIndex}`, options)}</Text>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      );
    }

    case 'space':
      return <Box key={key} marginBottom={1}/>;

    default:
      // Fallback for unknown token types
      if ('raw' in token && typeof (token as any).raw === 'string') {
        return (
          <Box key={key} marginBottom={1}>
            <Text>{(token as any).raw}</Text>
          </Box>
        );
      }
      return null;
  }
}

// Main component props
export interface InkMarkdownProps {
  /** Markdown string to render */
  children: string;
  /** Rendering options */
  options?: InkMarkdownOptions;
}

/**
 * InkMarkdown - Renders markdown as native Ink components
 *
 * @example
 * ```tsx
 * import { InkMarkdown } from './ink-markdown';
 *
 * const App = () => (
 *   <InkMarkdown>
 *     {`
 * # Hello World
 *
 * This is **bold** and *italic* text.
 *
 * - List item 1
 * - List item 2
 *     `}
 *   </InkMarkdown>
 * );
 * ```
 */
export function InkMarkdown({children, options}: InkMarkdownProps): React.ReactElement {
  const mergedOptions = {...defaultOptions, ...options};

  // Parse markdown using marked's lexer
  const tokens = Lexer.lex(children);

  return (
    <Box flexDirection="column">
      {tokens.map((token, index) => renderBlockToken(token, index, mergedOptions))}
    </Box>
  );
}

export default InkMarkdown;