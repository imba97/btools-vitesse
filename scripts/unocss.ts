import Color from 'color'

export function generateColors(colors: Record<string, string>) {
  return Object.keys(colors).reduce((acc, key) => {
    const defaultColor = colors[key]

    acc[key] = {
      DEFAULT: defaultColor,
      100: Color(defaultColor).lighten(0.8).hex(),
      200: Color(defaultColor).lighten(0.6).hex(),
      300: Color(defaultColor).lighten(0.4).hex(),
      400: Color(defaultColor).lighten(0.2).hex(),
    }

    return acc
  }, {} as Record<string, Record<string, string>>)
}
