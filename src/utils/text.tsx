import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Parses plain text containing URLs and simple markdown (**bold**, *italic*, `code`)
 * into interactive, styled React elements.
 */
export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  // Split lines to preserve newlines
  const lines = text.split('\n');

  return (
    <span className="inline-block space-y-1 w-full max-w-full break-words break-all [overflow-wrap:anywhere]">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <span key={lineIdx} className="block h-2" />;
        }

        // Regex to match URLs, **bold**, *italic*, and `code`
        const tokenRegex = /(https?:\/\/[^\s]+)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)/g;
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = tokenRegex.exec(line)) !== null) {
          // Push text before match
          if (match.index > lastIndex) {
            elements.push(line.substring(lastIndex, match.index));
          }

          const matchedStr = match[0];

          if (match[1]) {
            // URL
            const url = matchedStr;
            let displayUrl = url.replace(/^https?:\/\//, '');
            if (displayUrl.length > 30) displayUrl = displayUrl.substring(0, 28) + '...';

            elements.push(
              <a
                key={`url-${match.index}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[var(--color-accent)] underline hover:opacity-80 font-medium break-all [overflow-wrap:anywhere]"
              >
                <span className="break-all">{displayUrl}</span>
                <ExternalLink className="w-2.5 h-2.5 inline flex-shrink-0" />
              </a>
            );
          } else if (match[2]) {
            // Bold **text**
            const boldText = matchedStr.slice(2, -2);
            elements.push(
              <strong key={`b-${match.index}`} className="font-bold text-[var(--color-text-primary)] break-words [overflow-wrap:anywhere]">
                {boldText}
              </strong>
            );
          } else if (match[3]) {
            // Italic *text*
            const italicText = matchedStr.slice(1, -1);
            elements.push(
              <em key={`i-${match.index}`} className="italic break-words [overflow-wrap:anywhere]">
                {italicText}
              </em>
            );
          } else if (match[4]) {
            // Inline code `text`
            const codeText = matchedStr.slice(1, -1);
            elements.push(
              <code
                key={`c-${match.index}`}
                className="px-1 py-0.5 rounded text-[11px] font-mono bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border)] break-all [overflow-wrap:anywhere]"
              >
                {codeText}
              </code>
            );
          }

          lastIndex = tokenRegex.lastIndex;
        }

        // Push remainder of line
        if (lastIndex < line.length) {
          elements.push(line.substring(lastIndex));
        }

        return (
          <span key={lineIdx} className="block leading-relaxed break-words break-all [overflow-wrap:anywhere]">
            {elements}
          </span>
        );
      })}
    </span>
  );
}
