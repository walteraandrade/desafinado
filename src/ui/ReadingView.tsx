import {
  createElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { type MarkdownNode, markdownTree } from '../reading/markdown-tree'

const attributesOf = (
  node: Extract<MarkdownNode, { kind: 'element' }>,
): Record<string, unknown> =>
  node.tag === 'input'
    ? {
        type: 'checkbox',
        checked: node.attrs.checked === true,
        disabled: true,
        'aria-label': node.attrs.checked === true ? 'Done' : 'Not done',
      }
    : node.tag === 'pre' && typeof node.attrs.language === 'string'
      ? { 'data-language': node.attrs.language }
      : node.tag === 'ol' && typeof node.attrs.start === 'string'
        ? { start: Number(node.attrs.start) }
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
  const content = useMemo(() => {
    try {
      return render(markdownTree(text))
    } catch {
      return [createElement('pre', { key: 'raw' }, text)]
    }
  }, [text])
  const article = useRef<HTMLElement>(null)
  useEffect(() => article.current?.focus({ preventScroll: true }), [])
  return (
    <article
      ref={article}
      tabIndex={-1}
      className="reading-view focus:outline-none"
      aria-label="Reading view"
    >
      {content}
    </article>
  )
}
