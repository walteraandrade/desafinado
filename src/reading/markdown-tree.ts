import { markdownLanguage } from '@codemirror/lang-markdown'
import { findFrontmatter } from '../blocks/frontmatter'

type SyntaxNode = ReturnType<typeof markdownLanguage.parser.parse>['topNode']

export type MarkdownTag =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'strong'
  | 'em'
  | 'del'
  | 'code'
  | 'pre'
  | 'a'
  | 'span'
  | 'ul'
  | 'ol'
  | 'li'
  | 'input'
  | 'blockquote'
  | 'hr'
  | 'br'
  | 'table'
  | 'thead'
  | 'tbody'
  | 'tr'
  | 'th'
  | 'td'

export type MarkdownNode =
  | { readonly kind: 'text'; readonly text: string }
  | {
      readonly kind: 'element'
      readonly tag: MarkdownTag
      readonly attrs: Readonly<Record<string, string | boolean>>
      readonly children: readonly MarkdownNode[]
    }

const SKIPPED = new Set([
  'HeaderMark',
  'EmphasisMark',
  'CodeMark',
  'CodeInfo',
  'QuoteMark',
  'ListMark',
  'LinkMark',
  'LinkTitle',
  'LinkLabel',
  'StrikethroughMark',
  'TableDelimiter',
  'Comment',
  'ProcessingInstruction',
])

const BLOCK_CONTAINERS = new Set([
  'Document',
  'BulletList',
  'OrderedList',
  'ListItem',
  'Blockquote',
])

const TRIMMED: ReadonlySet<MarkdownTag> = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'li',
  'th',
  'td',
  'a',
  'span',
])

const VOID: ReadonlySet<MarkdownTag> = new Set(['br', 'hr', 'input'])

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  deg: '°',
  times: '×',
  middot: '·',
  bull: '•',
  euro: '€',
}

const NUMERIC = /^&#(?:x([0-9a-f]+)|([0-9]+));$/i

const decodeEntity = (raw: string): string => {
  const numeric = NUMERIC.exec(raw)
  if (numeric !== null) {
    const hex = numeric[1]
    const code = Number.parseInt(hex ?? numeric[2] ?? '', hex ? 16 : 10)
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : raw
  }
  return ENTITIES[raw.slice(1, -1)] ?? raw
}

const HEADINGS: Readonly<Record<string, MarkdownTag>> = {
  ATXHeading1: 'h1',
  ATXHeading2: 'h2',
  ATXHeading3: 'h3',
  ATXHeading4: 'h4',
  ATXHeading5: 'h5',
  ATXHeading6: 'h6',
  SetextHeading1: 'h1',
  SetextHeading2: 'h2',
}

const SIMPLE: Readonly<Record<string, MarkdownTag>> = {
  ...HEADINGS,
  Paragraph: 'p',
  HTMLBlock: 'p',
  StrongEmphasis: 'strong',
  Emphasis: 'em',
  Strikethrough: 'del',
  InlineCode: 'code',
  BulletList: 'ul',
  OrderedList: 'ol',
  ListItem: 'li',
  Blockquote: 'blockquote',
  HorizontalRule: 'hr',
  HardBreak: 'br',
  TableCell: 'td',
}

const text = (value: string): MarkdownNode => ({ kind: 'text', text: value })

const element = (
  tag: MarkdownTag,
  children: readonly MarkdownNode[] = [],
  attrs: Readonly<Record<string, string | boolean>> = {},
): MarkdownNode => ({
  kind: 'element',
  tag,
  attrs,
  children: VOID.has(tag)
    ? []
    : TRIMMED.has(tag)
      ? trimEdges(children)
      : children,
})

const mergeText = (nodes: readonly MarkdownNode[]): readonly MarkdownNode[] =>
  nodes.flatMap((node, index) => {
    const previous = nodes[index - 1]
    if (node.kind === 'text' && previous?.kind === 'text') return []
    if (node.kind !== 'text') return [node]
    const run = nodes.slice(index).findIndex((next) => next.kind !== 'text')
    const texts = nodes.slice(index, run === -1 ? undefined : index + run)
    return [
      text(
        texts.map((next) => (next.kind === 'text' ? next.text : '')).join(''),
      ),
    ]
  })

const trimEdges = (nodes: readonly MarkdownNode[]): readonly MarkdownNode[] =>
  nodes
    .map((node, index) =>
      node.kind !== 'text'
        ? node
        : text(
            [
              (value: string) => (index === 0 ? value.trimStart() : value),
              (value: string) =>
                index === nodes.length - 1 ? value.trimEnd() : value,
            ].reduce((value, trim) => trim(value), node.text),
          ),
    )
    .filter((node) => node.kind !== 'text' || node.text !== '')

const childNodes = (node: SyntaxNode): readonly SyntaxNode[] => {
  const children: SyntaxNode[] = []
  for (let child = node.firstChild; child; child = child.nextSibling)
    children.push(child)
  return children
}

const named = (node: SyntaxNode, name: string): SyntaxNode | undefined =>
  childNodes(node).find((child) => child.name === name)

type Source = { readonly text: string }

const NO_SKIP: ReadonlySet<string> = new Set()

const inner = (
  node: SyntaxNode,
  source: Source,
  skip: ReadonlySet<string> = NO_SKIP,
): readonly MarkdownNode[] => {
  const block = BLOCK_CONTAINERS.has(node.name)
  const gap = (from: number, to: number): readonly MarkdownNode[] => {
    const slice = source.text.slice(from, to)
    return slice === '' || (block && slice.trim() === '') ? [] : [text(slice)]
  }
  const children = childNodes(node)
  const parts = children.flatMap((child, index) => [
    ...gap(children[index - 1]?.to ?? node.from, child.from),
    ...(skip.has(child.name) ? [] : convert(child, source)),
  ])
  const end = children.at(-1)?.to ?? node.from
  return mergeText([...parts, ...gap(end, node.to)])
}

const unwrapParagraphs = (
  nodes: readonly MarkdownNode[],
): readonly MarkdownNode[] =>
  nodes.flatMap((node) =>
    node.kind === 'element' && node.tag === 'p' ? node.children : [node],
  )

const tableRow = (
  row: SyntaxNode,
  source: Source,
  cell: MarkdownTag,
): MarkdownNode =>
  element(
    'tr',
    childNodes(row)
      .filter((child) => child.name === 'TableCell')
      .map((child) => element(cell, inner(child, source))),
  )

const convertTable = (node: SyntaxNode, source: Source): MarkdownNode => {
  const rows = childNodes(node)
  const header = rows.filter((row) => row.name === 'TableHeader')
  const body = rows.filter((row) => row.name === 'TableRow')
  return element('table', [
    element(
      'thead',
      header.map((row) => tableRow(row, source, 'th')),
    ),
    ...(body.length === 0
      ? []
      : [
          element(
            'tbody',
            body.map((row) => tableRow(row, source, 'td')),
          ),
        ]),
  ])
}

const codeText = (node: SyntaxNode, source: Source): string => {
  const code = named(node, 'CodeText')
  return code === undefined ? '' : source.text.slice(code.from, code.to)
}

const convertCode = (node: SyntaxNode, source: Source): MarkdownNode => {
  const info = named(node, 'CodeInfo')
  const language =
    info === undefined ? '' : source.text.slice(info.from, info.to).trim()
  return element(
    'pre',
    [element('code', [text(codeText(node, source))])],
    language === '' ? {} : { language },
  )
}

const LINK_PARTS: ReadonlySet<string> = new Set(['URL'])

const urlOf = (node: SyntaxNode, source: Source): string => {
  const url = named(node, 'URL')
  return url === undefined ? '' : source.text.slice(url.from, url.to)
}

const SPECIAL: Readonly<
  Record<string, (node: SyntaxNode, source: Source) => readonly MarkdownNode[]>
> = {
  Document: (node, source) => inner(node, source),
  Task: (node, source) => inner(node, source),
  TaskMarker: (node, source) => [
    element('input', [], {
      checked: /x/i.test(source.text.slice(node.from, node.to)),
    }),
  ],
  ListItem: (node, source) => {
    const children = inner(node, source)
    const paragraphs = children.filter(
      (child) => child.kind === 'element' && child.tag === 'p',
    )
    return [
      element(
        'li',
        paragraphs.length > 1 ? children : unwrapParagraphs(children),
      ),
    ]
  },
  FencedCode: (node, source) => [convertCode(node, source)],
  CodeBlock: (node, source) => [convertCode(node, source)],
  Table: (node, source) => [convertTable(node, source)],
  Link: (node, source) => [
    element('a', inner(node, source, LINK_PARTS), {
      title: urlOf(node, source),
    }),
  ],
  Image: (node, source) => [
    element('span', inner(node, source, LINK_PARTS), { image: true }),
  ],
  URL: (node, source) => [text(source.text.slice(node.from, node.to))],
  Escape: (node, source) => [text(source.text.slice(node.from + 1, node.to))],
  Entity: (node, source) => [
    text(decodeEntity(source.text.slice(node.from, node.to))),
  ],
  OrderedList: (node, source) => {
    const mark = node.firstChild && named(node.firstChild, 'ListMark')
    const start = mark
      ? Number.parseInt(source.text.slice(mark.from, mark.to), 10)
      : 1
    return [
      element(
        'ol',
        inner(node, source),
        Number.isNaN(start) || start === 1 ? {} : { start: String(start) },
      ),
    ]
  },
}

const convert = (node: SyntaxNode, source: Source): readonly MarkdownNode[] => {
  if (SKIPPED.has(node.name)) return []
  const special = SPECIAL[node.name]
  if (special) return special(node, source)
  const tag = SIMPLE[node.name]
  return tag === undefined
    ? inner(node, source)
    : [element(tag, inner(node, source))]
}

export const markdownTree = (markdown: string): readonly MarkdownNode[] => {
  const frontmatter = findFrontmatter(markdown)
  const body =
    frontmatter === undefined ? markdown : markdown.slice(frontmatter.to)
  const tree = markdownLanguage.parser.parse(body)
  return convert(tree.topNode, { text: body })
}
