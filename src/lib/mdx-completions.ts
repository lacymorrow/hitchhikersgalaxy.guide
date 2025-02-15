import { languages } from 'monaco-editor';

export const MDX_COMPLETIONS: languages.CompletionItem[] = [
  // Markdown Completions
  {
    label: 'frontmatter',
    kind: languages.CompletionItemKind.Snippet,
    insertText: [
      '---',
      'title: ${1:Title}',
      'description: ${2:Description}',
      'date: ${3:YYYY-MM-DD}',
      'tags: [${4:tag1}, ${5:tag2}]',
      '---\n',
      '$0'
    ].join('\n'),
    documentation: 'Insert frontmatter block',
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
  },
  {
    label: 'code',
    kind: languages.CompletionItemKind.Snippet,
    insertText: ['```${1:language}', '${2:code}', '```'].join('\n'),
    documentation: 'Insert code block',
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
  },
  {
    label: 'table',
    kind: languages.CompletionItemKind.Snippet,
    insertText: [
      '| ${1:Header 1} | ${2:Header 2} |',
      '|------------|------------|',
      '| ${3:Cell 1}  | ${4:Cell 2}  |',
    ].join('\n'),
    documentation: 'Insert table',
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
  },

  // React/MDX Component Completions
  {
    label: 'import',
    kind: languages.CompletionItemKind.Snippet,
    insertText: 'import { ${2:Component} } from "${1:package}"',
    documentation: 'Import statement',
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
  },
  {
    label: 'component',
    kind: languages.CompletionItemKind.Snippet,
    insertText: [
      '<${1:Component}',
      '  ${2:prop}={${3:value}}',
      '>',
      '  ${4:children}',
      '</${1:Component}>'
    ].join('\n'),
    documentation: 'Insert component with props',
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
  },

  // Common MDX Patterns
  {
    label: 'callout',
    kind: languages.CompletionItemKind.Snippet,
    insertText: [
      '<Callout type="${1|info,warning,error|}">',
      '  ${2:content}',
      '</Callout>'
    ].join('\n'),
    documentation: 'Insert callout component',
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
  },
  {
    label: 'image',
    kind: languages.CompletionItemKind.Snippet,
    insertText: '<Image src="${1:path}" alt="${2:description}" ${3:width={${4:width}}} ${5:height={${6:height}}} />',
    documentation: 'Insert image component',
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
  },

  // Export Patterns
  {
    label: 'export-meta',
    kind: languages.CompletionItemKind.Snippet,
    insertText: [
      'export const meta = {',
      '  title: "${1:Title}",',
      '  description: "${2:Description}",',
      '  date: "${3:YYYY-MM-DD}",',
      '  tags: [${4:tags}],',
      '}'
    ].join('\n'),
    documentation: 'Export metadata object',
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
  },
];

export const MDX_TRIGGER_CHARACTERS = ['<', '{', '[', '`', '*', '>', '#', '|', '-', '+'];

export function configureMDXCompletions(monaco: any) {
  monaco.languages.registerCompletionItemProvider('mdx', {
    provideCompletionItems: () => {
      return {
        suggestions: MDX_COMPLETIONS,
      };
    },
    triggerCharacters: MDX_TRIGGER_CHARACTERS,
  });
}
