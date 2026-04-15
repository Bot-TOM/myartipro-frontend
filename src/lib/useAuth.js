import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from './AuthContext'

export default function useAuth() {
  const { user, loading } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  return { user, loading }
}
