function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

type SuperBlockLayout = "col" | "row";
type NormalizationMode = "mdx" | "plain" | "quartz";

function isCodeFenceBoundary(line: string) {
  return /^```/.test(line);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readHtmlAttribute(attributes: string, name: string) {
  const match = attributes.match(new RegExp(`${name}="([^"]*)"`, "u"));
  return match ? decodeHtmlEntities(match[1]) : undefined;
}

function transformOutsideCodeFences(markdown: string, transform: (segment: string) => string) {
  const lines = markdown.split("\n");
  const output: string[] = [];
  const buffer: string[] = [];
  let inCodeFence = false;

  const flushBuffer = () => {
    if (buffer.length === 0) {
      return;
    }

    output.push(transform(buffer.join("\n")));
    buffer.length = 0;
  };

  for (const line of lines) {
    if (isCodeFenceBoundary(line)) {
      if (!inCodeFence) {
        flushBuffer();
      }

      output.push(line);
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) {
      output.push(line);
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();
  return output.join("\n");
}

function renderTextMark(attributes: string, content: string, mode: NormalizationMode) {
  const rawTypes = readHtmlAttribute(attributes, "data-type");
  if (!rawTypes) {
    return content;
  }

  const types = rawTypes
    .split(/\s+/u)
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);
  const href = readHtmlAttribute(attributes, "data-href");
  let normalizedContent = normalizeInlineHtmlMarks(content, mode).trim();

  if (types.includes("code")) {
    normalizedContent = `\`${normalizedContent}\``;
  }

  if (types.includes("strong")) {
    normalizedContent = `**${normalizedContent}**`;
  }

  if (types.includes("em")) {
    normalizedContent = `*${normalizedContent}*`;
  }

  if (types.includes("s")) {
    normalizedContent = `~~${normalizedContent}~~`;
  }

  if (types.includes("mark")) {
    normalizedContent = `==${normalizedContent}==`;
  }

  if (types.includes("u")) {
    normalizedContent = `<u>${normalizedContent}</u>`;
  }

  if (types.includes("sub")) {
    normalizedContent = `<sub>${normalizedContent}</sub>`;
  }

  if (types.includes("sup")) {
    normalizedContent = `<sup>${normalizedContent}</sup>`;
  }

  if (types.includes("tag") && !normalizedContent.startsWith("#")) {
    normalizedContent = `#${normalizedContent}`;
  }

  if (types.includes("a") && href) {
    normalizedContent = `[${normalizedContent}](${href})`;
  }

  return normalizedContent;
}

function normalizeInlineHtmlMarks(markdown: string, mode: NormalizationMode) {
  return transformOutsideCodeFences(markdown, (segment) => {
    let normalized = segment;
    let previous = "";

    while (normalized !== previous) {
      previous = normalized;
      normalized = normalized.replace(/<span([^>]*)>([\s\S]*?)<\/span>/gu, (_match, attributes, content) =>
        renderTextMark(attributes, content, mode)
      );
    }

    return normalized.replace(/<br\s*\/?>/giu, mode === "plain" ? "\n" : "<br />");
  });
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

function renderPlainQuote(content: string, source: string) {
  const quoteLines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `> ${line}`);

  if (source) {
    quoteLines.push(">", `> —— ${source}`);
  }

  return quoteLines.join("\n");
}

function renderQuartzCallout(type: string, title: string, content: string, collapsible: boolean) {
  const lines = content
    .split("\n")
    .map((line) => line.trimEnd());
  const marker = collapsible ? "-" : "";
  const titleSegment = title ? ` ${title}` : "";
  const output = [`> [!${type}]${marker}${titleSegment}`.trimEnd()];

  for (const line of lines) {
    output.push(line ? `> ${line}` : ">");
  }

  return output.join("\n");
}

function renderSuperBlock(layout: SuperBlockLayout, content: string, mode: NormalizationMode) {
  if (layout === "col") {
    return renderColumns(content, mode);
  }

  return normalizeSiyuanStructures(content, mode).trim();
}

function splitColumnSegments(markdown: string, mode: NormalizationMode) {
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
        segments.push(normalizeSiyuanStructures(block.content.trim(), mode).trim());
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
      const rendered = renderSuperBlock(block.layout, block.content, mode).trim();
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

function renderColumns(content: string, mode: NormalizationMode) {
  const segments = splitColumnSegments(content, mode);
  const normalizedSegments = (segments.length > 0 ? segments : [content])
    .map((segment) => normalizeSiyuanStructures(segment, mode).trim())
    .filter(Boolean);

  if (normalizedSegments.length === 0) {
    return "";
  }

  if (mode === "plain") {
    return normalizedSegments.join("\n\n");
  }

  return [
    "<Columns>",
    ...normalizedSegments.map(
      (segment) => `<div class="mdx-columns__column">\n\n${segment}\n\n</div>`
    ),
    "</Columns>"
  ].join("\n\n");
}

function renderDirectiveBlock(
  name: string,
  argument: string,
  content: string,
  mode: NormalizationMode
) {
  const normalizedContent = normalizeSiyuanStructures(content, mode).trim();

  switch (name) {
    case "fold":
      if (mode === "plain") {
        return [argument || "展开查看", "", normalizedContent].filter(Boolean).join("\n");
      }
      if (mode === "quartz") {
        return renderQuartzCallout("note", argument || "展开查看", normalizedContent, true);
      }
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
      if (mode === "plain") {
        return normalizedContent;
      }
      if (mode === "quartz") {
        return renderQuartzCallout(name, "", normalizedContent, false);
      }
      return `<Callout type="${escapeHtmlAttribute(name)}">\n\n${normalizedContent}\n\n</Callout>`;
    case "quote":
      if (mode === "plain") {
        return renderPlainQuote(normalizedContent, argument);
      }
      if (mode === "quartz") {
        return renderQuartzCallout("quote", argument, normalizedContent, false);
      }
      return `<QuoteBlock${argument ? ` source="${escapeHtmlAttribute(argument)}"` : ""}>\n\n${normalizedContent}\n\n</QuoteBlock>`;
    case "embed":
      if (mode === "plain") {
        return normalizedContent;
      }
      if (mode === "quartz") {
        return [
          '<aside class="embed-card">',
          normalizedContent,
          "</aside>"
        ].join("\n\n");
      }
      return `<EmbedCard kind="${escapeHtmlAttribute(argument || "block-ref")}">\n\n${normalizedContent}\n\n</EmbedCard>`;
    case "columns":
      return renderColumns(content, mode);
    default:
      return `::: ${name}${argument ? ` ${argument}` : ""}\n${content}\n:::`;
  }
}

export function normalizeSiyuanStructures(markdown: string, mode: NormalizationMode = "mdx") {
  const lines = normalizeInlineHtmlMarks(stripSiyuanIAL(markdown), mode).split("\n");
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

      const rendered = renderSuperBlock(block.layout, block.content, mode);
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

    output.push(renderDirectiveBlock(block.directive.name, block.directive.argument, block.content, mode));
    index = block.nextIndex;
  }

  return output.join("\n");
}
