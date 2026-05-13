function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

type SuperBlockLayout = "col" | "row";

function isCodeFenceBoundary(line: string) {
  return /^```/.test(line);
}

function stripSiyuanIAL(markdown: string) {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (isCodeFenceBoundary(line)) {
      inCodeFence = !inCodeFence;
      output.push(line);
      continue;
    }

    if (inCodeFence) {
      output.push(line);
      continue;
    }

    if (/^\s*(?:\{:\s*[^{}\n]*\})+\s*$/u.test(line)) {
      continue;
    }

    output.push(line.replace(/\s*(?:\{:\s*[^{}\n]*\})+\s*$/u, ""));
  }

  return output.join("\n");
}

function isDirectiveStart(line: string) {
  const match = line.match(/^:::\s*([a-z-]+)(?:\s+(.*))?$/u);
  if (!match) {
    return null;
  }

  return {
    name: match[1].trim().toLowerCase(),
    argument: match[2]?.trim() ?? ""
  };
}

function isDirectiveEnd(line: string) {
  return /^:::\s*$/u.test(line);
}

function consumeDirectiveBlock(lines: string[], startIndex: number) {
  const start = isDirectiveStart(lines[startIndex]);
  if (!start) {
    return null;
  }

  let depth = 1;
  const contentLines: string[] = [];
  let inCodeFence = false;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (isCodeFenceBoundary(line)) {
      inCodeFence = !inCodeFence;
      contentLines.push(line);
      continue;
    }

    if (inCodeFence) {
      contentLines.push(line);
      continue;
    }

    if (isDirectiveStart(line)) {
      depth += 1;
      contentLines.push(line);
      continue;
    }

    if (isDirectiveEnd(line)) {
      depth -= 1;
      if (depth === 0) {
        return {
          directive: start,
          content: contentLines.join("\n"),
          nextIndex: index + 1
        };
      }
      contentLines.push(line);
      continue;
    }

    contentLines.push(line);
  }

  return null;
}

function isSuperBlockStart(line: string) {
  const match = line.match(/^\{\{\{\s*(col|row)\s*$/u);
  if (!match) {
    return null;
  }

  return {
    layout: match[1].trim().toLowerCase() as SuperBlockLayout
  };
}

function isSuperBlockEnd(line: string) {
  return /^\s*\}\}\}\s*$/u.test(line);
}

function consumeSuperBlock(lines: string[], startIndex: number) {
  const start = isSuperBlockStart(lines[startIndex]);
  if (!start) {
    return null;
  }

  let depth = 1;
  const contentLines: string[] = [];
  let inCodeFence = false;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (isCodeFenceBoundary(line)) {
      inCodeFence = !inCodeFence;
      contentLines.push(line);
      continue;
    }

    if (inCodeFence) {
      contentLines.push(line);
      continue;
    }

    if (isSuperBlockStart(line)) {
      depth += 1;
      contentLines.push(line);
      continue;
    }

    if (isSuperBlockEnd(line)) {
      depth -= 1;
      if (depth === 0) {
        return {
          layout: start.layout,
          content: contentLines.join("\n"),
          nextIndex: index + 1
        };
      }
      contentLines.push(line);
      continue;
    }

    contentLines.push(line);
  }

  return null;
}

function splitLooseColumnSegments(markdown: string) {
  return markdown
    .split(/\n{2,}/u)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function renderSuperBlock(layout: SuperBlockLayout, content: string) {
  if (layout === "col") {
    return renderColumns(content);
  }

  return normalizeSiyuanStructures(content).trim();
}

function splitColumnSegments(markdown: string) {
  const lines = markdown.split("\n");
  const segments: string[] = [];
  const looseLines: string[] = [];
  let inCodeFence = false;

  const flushLooseLines = () => {
    const content = looseLines.join("\n").trim();
    if (content) {
      segments.push(...splitLooseColumnSegments(content));
    }
    looseLines.length = 0;
  };

  let index = 0;
  while (index < lines.length) {
    if (isCodeFenceBoundary(lines[index])) {
      inCodeFence = !inCodeFence;
      looseLines.push(lines[index]);
      index += 1;
      continue;
    }

    if (inCodeFence) {
      looseLines.push(lines[index]);
      index += 1;
      continue;
    }

    const directive = isDirectiveStart(lines[index]);
    if (directive?.name === "column") {
      flushLooseLines();
      const block = consumeDirectiveBlock(lines, index);
      if (!block) {
        looseLines.push(lines[index]);
        index += 1;
        continue;
      }
      if (block.content.trim()) {
        segments.push(block.content.trim());
      }
      index = block.nextIndex;
      continue;
    }

    const superBlock = isSuperBlockStart(lines[index]);
    if (superBlock) {
      flushLooseLines();
      const block = consumeSuperBlock(lines, index);
      if (!block) {
        looseLines.push(lines[index]);
        index += 1;
        continue;
      }
      const rendered = renderSuperBlock(block.layout, block.content).trim();
      if (rendered) {
        segments.push(rendered);
      }
      index = block.nextIndex;
      continue;
    }

    looseLines.push(lines[index]);
    index += 1;
  }

  flushLooseLines();
  return segments;
}

function renderColumns(content: string) {
  const segments = splitColumnSegments(content);
  const normalizedSegments = (segments.length > 0 ? segments : [content])
    .map((segment) => normalizeSiyuanStructures(segment).trim())
    .filter(Boolean);

  if (normalizedSegments.length === 0) {
    return "";
  }

  return [
    "<Columns>",
    ...normalizedSegments.map(
      (segment) => `<div class="mdx-columns__column">\n\n${segment}\n\n</div>`
    ),
    "</Columns>"
  ].join("\n\n");
}

function renderDirectiveBlock(name: string, argument: string, content: string) {
  const normalizedContent = normalizeSiyuanStructures(content).trim();

  switch (name) {
    case "fold":
      return [
        '<details class="blog-fold">',
        `<summary>${escapeHtmlAttribute(argument || "展开查看")}</summary>`,
        "",
        normalizedContent,
        "",
        "</details>"
      ].join("\n");
    case "tip":
    case "note":
    case "warning":
    case "info":
      return `<Callout type="${escapeHtmlAttribute(name)}">\n\n${normalizedContent}\n\n</Callout>`;
    case "quote":
      return `<QuoteBlock${argument ? ` source="${escapeHtmlAttribute(argument)}"` : ""}>\n\n${normalizedContent}\n\n</QuoteBlock>`;
    case "embed":
      return `<EmbedCard kind="${escapeHtmlAttribute(argument || "block-ref")}">\n\n${normalizedContent}\n\n</EmbedCard>`;
    case "columns":
      return renderColumns(content);
    default:
      return `::: ${name}${argument ? ` ${argument}` : ""}\n${content}\n:::`;
  }
}

export function normalizeSiyuanStructures(markdown: string) {
  const lines = stripSiyuanIAL(markdown).split("\n");
  const output: string[] = [];
  let index = 0;
  let inCodeFence = false;

  while (index < lines.length) {
    const line = lines[index];

    if (isCodeFenceBoundary(line)) {
      inCodeFence = !inCodeFence;
      output.push(line);
      index += 1;
      continue;
    }

    if (inCodeFence) {
      output.push(line);
      index += 1;
      continue;
    }

    const superBlock = isSuperBlockStart(line);
    if (superBlock) {
      const block = consumeSuperBlock(lines, index);
      if (!block) {
        output.push(line);
        index += 1;
        continue;
      }

      const rendered = renderSuperBlock(block.layout, block.content);
      if (rendered) {
        output.push(rendered);
      }
      index = block.nextIndex;
      continue;
    }

    const directive = isDirectiveStart(line);
    if (!directive || directive.name === "column") {
      output.push(line);
      index += 1;
      continue;
    }

    const block = consumeDirectiveBlock(lines, index);
    if (!block) {
      output.push(line);
      index += 1;
      continue;
    }

    output.push(renderDirectiveBlock(block.directive.name, block.directive.argument, block.content));
    index = block.nextIndex;
  }

  return output.join("\n");
}
