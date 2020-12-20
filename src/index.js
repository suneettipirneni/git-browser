import './style/index.scss'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import ThemeProvider from './components/ThemeProvider'
import { Provider } from 'react-redux'
import store from './store'

if (module.hot) {
  module.hot.accept()
}

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <ThemeProvider>{theme => <App theme={theme} />}</ThemeProvider>
    </React.StrictMode>
  </Provider>,
  document.getElementById('app')
)
