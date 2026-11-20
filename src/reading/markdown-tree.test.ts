import { describe, expect, it } from 'vitest'
import { type MarkdownNode, markdownTree } from './markdown-tree'

const text = (value: string): MarkdownNode => ({ kind: 'text', text: value })
const el = (
  tag: string,
  children: readonly MarkdownNode[] = [],
  attrs: Record<string, string | boolean> = {},
): MarkdownNode => ({ kind: 'element', tag, attrs, children }) as MarkdownNode

describe('markdownTree', () => {
  it('turns headings and paragraphs into elements, without their marks', () => {
    expect(markdownTree('# Title\n\nSome text.\n\nSetext\n---\n')).toEqual([
      el('h1', [text('Title')]),
      el('p', [text('Some text.')]),
      el('h2', [text('Setext')]),
    ])
  })

  it('leaves out a frontmatter', () => {
    expect(markdownTree('---\ntitle: Notes\n---\n\nBody.\n')).toEqual([
      el('p', [text('Body.')]),
    ])
  })

  it('renders inline marks', () => {
    expect(markdownTree('A **b** *c* `d` ~~e~~\n')).toEqual([
      el('p', [
        text('A '),
        el('strong', [text('b')]),
        text(' '),
        el('em', [text('c')]),
        text(' '),
        el('code', [text('d')]),
        text(' '),
        el('del', [text('e')]),
      ]),
    ])
  })

  it('keeps the link target as a title and never as an href', () => {
    expect(
      markdownTree('See [the guide](https://example.com "Guide").\n'),
    ).toEqual([
      el('p', [
        text('See '),
        el('a', [text('the guide')], { title: 'https://example.com' }),
        text('.'),
      ]),
    ])
  })

  it('shows an image as its alt text', () => {
    expect(markdownTree('![a cat](cat.png)\n')).toEqual([
      el('p', [el('span', [text('a cat')], { image: true })]),
    ])
  })

  it('renders lists, tasks and quotes', () => {
    expect(
      markdownTree('- [x] done\n- open\n\n1. first\n\n> quoted\n> more\n'),
    ).toEqual([
      el('ul', [
        el('li', [el('input', [], { checked: true }), text('done')]),
        el('li', [text('open')]),
      ]),
      el('ol', [el('li', [text('first')])]),
      el('blockquote', [el('p', [text('quoted\n more')])]),
    ])
  })

  it('renders fenced and indented code as text', () => {
    expect(markdownTree('```js\nconst a = 1\n```\n\n    indented\n')).toEqual([
      el('pre', [el('code', [text('const a = 1')])], { language: 'js' }),
      el('pre', [el('code', [text('indented')])]),
    ])
  })

  it('renders a rule, a hard break, escapes and entities', () => {
    expect(markdownTree('a\\*b &amp; c  \nd\n\n---\n')).toEqual([
      el('p', [text('a*b & c'), el('br'), text('d')]),
      el('hr'),
    ])
  })

  it('renders a table', () => {
    expect(markdownTree('| a | b |\n|---|---|\n| 1 | 2 |\n')).toEqual([
      el('table', [
        el('thead', [el('tr', [el('th', [text('a')]), el('th', [text('b')])])]),
        el('tbody', [el('tr', [el('td', [text('1')]), el('td', [text('2')])])]),
      ]),
    ])
  })

  it('shows HTML as text', () => {
    expect(markdownTree('<b>x</b>\n')).toEqual([el('p', [text('<b>x</b>')])])
  })

  it('keeps the paragraphs of a loose list item apart', () => {
    expect(markdownTree('- first\n\n  second\n')).toEqual([
      el('ul', [
        el('li', [el('p', [text('first')]), el('p', [text('second')])]),
      ]),
    ])
  })

  it('keeps the number an ordered list starts at', () => {
    expect(markdownTree('3. third\n4. fourth\n')).toEqual([
      el('ol', [el('li', [text('third')]), el('li', [text('fourth')])], {
        start: '3',
      }),
    ])
  })

  it('decodes numeric and common named character references', () => {
    expect(markdownTree('&#65;&#x42; &copy; &mdash; &bogus;\n')).toEqual([
      el('p', [text('AB © — &bogus;')]),
    ])
  })

  it('keeps every line of code inside lists, quotes and indented blocks', () => {
    expect(markdownTree('    a\n    b\n\n\n    c\n')).toEqual([
      el('pre', [el('code', [text('a\nb\n\n\nc')])]),
    ])
    expect(markdownTree('> ```\n> a\n>\n> b\n> ```\n')).toEqual([
      el('blockquote', [el('pre', [el('code', [text('a\n\nb')])])]),
    ])
  })

  it('leaves out link definitions and comment blocks', () => {
    expect(
      markdownTree(
        '[foo][bar]\n\n[bar]: http://x "T"\n\n<!--\nx\n-->\n\ntext\n',
      ),
    ).toEqual([
      el('p', [el('a', [text('foo')], { title: 'http://x' })]),
      el('p', [text('text')]),
    ])
  })

  it('keeps empty table cells in their column', () => {
    expect(markdownTree('|a|b|\n|-|-|\n||2|\n')).toEqual([
      el('table', [
        el('thead', [el('tr', [el('th', [text('a')]), el('th', [text('b')])])]),
        el('tbody', [el('tr', [el('td'), el('td', [text('2')])])]),
      ]),
    ])
  })

  it('reads CRLF and a byte order mark, frontmatter included', () => {
    expect(markdownTree('\uFEFF---\r\ntitle: x\r\n---\r\n# H\r\n')).toEqual([
      el('h1', [text('H')]),
    ])
  })

  it('leaves a surrogate reference as written', () => {
    expect(markdownTree('&#xD800;\n')).toEqual([el('p', [text('&#xD800;')])])
  })

  it('keeps brackets that are not links', () => {
    expect(markdownTree('[not a link] and [a][nope]\n')).toEqual([
      el('p', [text('[not a link] and [a][nope]')]),
    ])
  })

  it('resolves a shortcut reference link', () => {
    expect(markdownTree('[Baz]\n\n[baz]: https://b.example\n')).toEqual([
      el('p', [el('a', [text('Baz')], { title: 'https://b.example' })]),
    ])
  })

  it('hides HTML comments, as a rendered page would', () => {
    expect(markdownTree('a <!-- note --> b\n')).toEqual([
      el('p', [text('a  b')]),
    ])
  })
})
