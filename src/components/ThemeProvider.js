import React, { useState, useEffect, Fragment } from 'react'

const query = window.matchMedia('(prefers-color-scheme: dark)')
const root = document.documentElement
const getTheme = isDark => (isDark ? 'dark' : 'light')

root.classList.add(`theme-${getTheme(query.matches)}`)

// Listens for changes in the color scheme of the user's system
// and passes that theme as a render prop to its children.
const ThemeProvider = props => {
  const [theme, setTheme] = useState(getTheme(query.matches))

  const toggleTheme = event => {
    const newTheme = getTheme(event.matches)
    root.classList.toggle('theme-light')
    root.classList.toggle('theme-dark')
    setTheme(newTheme)
  }

  useEffect(() => {
    query.addEventListener('change', toggleTheme)
    return () => query.removeEventListener('change', toggleTheme)
  }, [])

  return <Fragment>{props.children(theme)}</Fragment>
}

export default ThemeProvider
