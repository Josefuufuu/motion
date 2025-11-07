import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './App.css'


import { RoleProvider } from './components/Sidebar/RoleContext.jsx'

import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import PropTypes from 'prop-types'

function AuthInitializer({ children }) {
  const { restoreSession } = useAuth()

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  return children
}

AuthInitializer.propTypes = {
  children: PropTypes.node,
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthInitializer>
        <RoleProvider>
          <App />
        </RoleProvider>
      </AuthInitializer>
    </AuthProvider>
  </React.StrictMode>,

)
