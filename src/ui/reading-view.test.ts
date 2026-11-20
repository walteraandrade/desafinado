import { describe, expect, it } from 'vitest'
import { attributesOf } from './ReadingView'

describe('attributesOf', () => {
  it('gives a link a title and never an href', () => {
    const props = attributesOf({
      kind: 'element',
      tag: 'a',
      attrs: { title: 'javascript:alert(1)' },
      children: [],
    })
    expect(props).toEqual({ title: 'javascript:alert(1)' })
    expect(props).not.toHaveProperty('href')
  })

  it('renders a task marker as a disabled, labelled checkbox', () => {
    expect(
      attributesOf({
        kind: 'element',
        tag: 'input',
        attrs: { checked: true },
        children: [],
      }),
    ).toEqual({
      type: 'checkbox',
      checked: true,
      disabled: true,
      'aria-label': 'Done',
    })
  })

  it('keeps the start of an ordered list', () => {
    expect(
      attributesOf({
        kind: 'element',
        tag: 'ol',
        attrs: { start: '3' },
        children: [],
      }),
    ).toEqual({ start: 3 })
  })
})
