import { languages } from 'monaco-editor';

export function configureMDXFormatting(monaco: any) {
  monaco.languages.registerDocumentFormattingEditProvider('mdx', {
    provideDocumentFormattingEdits(model: any) {
      const text = model.getValue();
      const formatted = formatMDXContent(text);
      
      return [{
        range: model.getFullModelRange(),
        text: formatted,
      }];
    },
  });
}

function formatMDXContent(content: string): string {
  const lines = content.split('\n');
  let inCodeBlock = false;
  let inFrontmatter = false;
  let formattedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle frontmatter
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter;
      formattedLines.push(line);
      continue;
    }

    // Handle code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      formattedLines.push(line);
      continue;
    }

    if (inCodeBlock || inFrontmatter) {
      formattedLines.push(line);
      continue;
    }

    // Format JSX/TSX content
    if (line.includes('<') && line.includes('>')) {
      line = formatJSXLine(line);
    }

    // Format lists
    if (line.match(/^[\s]*[-*+]\s/)) {
      line = line.replace(/^(\s*)[-*+]\s+/, '$1- ');
    }

    // Format headings
    if (line.match(/^#+\s/)) {
      line = line.replace(/^(#+)\s*/, '$1 ');
    }

    // Format blockquotes
    if (line.match(/^>\s/)) {
      line = line.replace(/^>\s*/, '> ');
    }

    // Format links and images
    line = line.replace(/\[\s*([^\]]+)\s*\]\(\s*([^)]+)\s*\)/g, '[$1]($2)');
    line = line.replace(/!\[\s*([^\]]*)\s*\]\(\s*([^)]+)\s*\)/g, '![$1]($2)');

    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}

function formatJSXLine(line: string): string {
  // Basic JSX formatting
  line = line.replace(/\s*=\s*{/g, '={');
  line = line.replace(/}\s+/g, '} ');
  line = line.replace(/\s+>/g, '>');
  line = line.replace(/(\S)<\//g, '$1 </');
  
  // Format self-closing tags
  line = line.replace(/\s+\/>/g, ' />');
  
  return line;
}
