import StyleValidator from '../src/StyleValidator'

describe('StyleValidator', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns an error when strict and an unknown style prop is used', () => {
    const val = new StyleValidator()
    const result = val.validate({ content: 'none' }, '<Test>')
    expect(result instanceof Error).toBe(true)
    expect(result.message).toBe('Unknown style property `content` supplied to `<Test>`.')
  })

  it('does not return an error when not strict and an unknown style prop is used', () => {
    const val = new StyleValidator({ strict: false })
    const result = val.validate({ content: 'none' }, '<Test>')
    expect(result).toBe(undefined)
  })

  it('returns an error when an unsupported style prop is used', () => {
    const val = new StyleValidator()
    const result = val.validate({ listStylePosition: 'inside' }, '<Test>')
    expect(result instanceof Error).toBe(true)
    expect(result.message).toBe('Style property `list-style-position` supplied to `<Test>` unsupported in: outlook.')
  })

  it('does not return an error when not strict and an unsupported style prop is used', () => {
    const val = new StyleValidator({ strict: false })
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    const result = val.validate({ a: 'test', listStylePosition: 'inside', fontVariant: 'small-caps' }, '<Test>')
    expect(spy).toHaveBeenCalledWith('Warning: Style property `font-variant` supplied to `<Test>`, in yahoo-mail, outlook, outlook-legacy: partial. supports css2 values, but not css3.')
    expect(result).toBe(undefined)
  })

  it('does not return an error when no platforms specified', () => {
    const val = new StyleValidator({ platforms: [] })
    const result = val.validate({ listStylePosition: 'inside' }, '<Test>')
    expect(result).toBe(undefined)
  })

  it('does not return an error on a known property, but warns with comments', () => {
    const val = new StyleValidator({ platforms: ['outlook-legacy', 'yahoo-mail'] })
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    const result = val.validate({ fontVariant: 'small-caps' }, '<Test>')
    expect(spy).toHaveBeenCalledWith('Warning: Style property `font-variant` supplied to `<Test>`, in outlook-legacy, yahoo-mail: partial. supports css2 values, but not css3.')
    expect(result).toBe(undefined)
  })

  it('does not output warnings when they are disabled', () => {
    const val = new StyleValidator({ warn: false, platforms: ['gmail-android', 'yahoo-mail'] })
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    const result = val.validate({ backgroundSize: '11px' }, '<Test>')
    expect(spy).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

  it('treats hyphenated-lowercase property names the same as camelCase', () => {
    const val = new StyleValidator()
    const result = val.validate({ listStylePosition: 'inside' }, '<Test>')
    const result2 = val.validate({ listStylePosition: 'inside' }, '<Test>')
    expect(result instanceof Error).toBe(true)
    expect(result2 instanceof Error).toBe(true)
    expect(result.message).toBe(result2.message)
  })

  it('changes requirements after setConfig called', () => {
    const val = new StyleValidator()
    const result = val.validate({ listStylePosition: 'inside' }, '<Test>')
    expect(result instanceof Error).toBe(true)
    expect(result.message).toBe('Style property `list-style-position` supplied to `<Test>` unsupported in: outlook.')
    val.setConfig({ platforms: ['gmail'] })
    const result2 = val.validate({ listStylePosition: 'inside' }, '<Test>')
    expect(result2).toBe(undefined)
  })
})
