import Color from 'color'

export function generateColors(colors: Record<string, string>) {
  return Object.keys(colors).reduce((acc, key) => {
    const defaultColor = colors[key]

    acc[key] = {
      DEFAULT: defaultColor,
      100: Color(defaultColor).lighten(1.5).hex(),
      200: Color(defaultColor).lighten(1.25).hex(),
      300: Color(defaultColor).lighten(1).hex(),
      400: Color(defaultColor).lighten(0.75).hex(),
    }

    return acc
  }, {} as Record<string, Record<string, string>>)
}
