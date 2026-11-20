import { createElement, type ReactNode, useMemo } from 'react'
import { type MarkdownNode, markdownTree } from '../reading/markdown-tree'

const attributesOf = (
  node: Extract<MarkdownNode, { kind: 'element' }>,
): Record<string, unknown> =>
  node.tag === 'input'
    ? {
        type: 'checkbox',
        checked: node.attrs.checked === true,
        disabled: true,
        readOnly: true,
      }
    : node.tag === 'pre' && typeof node.attrs.language === 'string'
      ? { 'data-language': node.attrs.language }
      : node.tag === 'a'
        ? { title: node.attrs.title }
        : node.tag === 'span' && node.attrs.image === true
          ? { className: 'reading-image' }
          : {}

const render = (nodes: readonly MarkdownNode[]): ReactNode[] =>
  nodes.map((node, index) =>
    node.kind === 'text'
      ? node.text
      : createElement(
          node.tag,
          { key: index, ...attributesOf(node) },
          ...(node.children.length === 0 ? [] : render(node.children)),
        ),
  )

export function ReadingView({ text }: { readonly text: string }) {
  const content = useMemo(() => render(markdownTree(text)), [text])
  return (
    <article className="reading-view" aria-label="Reading view">
      {content}
    </article>
  )
}
