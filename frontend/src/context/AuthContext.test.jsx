import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

// Dummy component to test context values
const TestComponent = () => {
  const { user, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="user-role">{user ? user.role : 'null'}</div>
      <div data-testid="user-name">{user ? user.name : 'null'}</div>
      <button onClick={() => login({ access: 'token123', refresh: 'refresh123', role: 'resident', full_name: 'Test Resident' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('initializes with null user if no localStorage token', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    expect(screen.getByTestId('user-role')).toHaveTextContent('null')
  })

  it('restores user from localStorage on mount', () => {
    localStorage.setItem('access', 'sometoken')
    localStorage.setItem('role', 'admin')
    localStorage.setItem('user_name', 'Test Admin')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-role')).toHaveTextContent('admin')
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test Admin')
  })

  it('updates state and localStorage on login', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      screen.getByText('Login').click()
    })

    expect(screen.getByTestId('user-role')).toHaveTextContent('resident')
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test Resident')
    expect(localStorage.getItem('access')).toBe('token123')
  })

  it('clears state and localStorage on logout', () => {
    localStorage.setItem('access', 'sometoken')
    localStorage.setItem('role', 'resident')
    localStorage.setItem('user_name', 'Test')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('user-role')).toHaveTextContent('resident')

    act(() => {
      screen.getByText('Logout').click()
    })

    expect(screen.getByTestId('user-role')).toHaveTextContent('null')
    expect(localStorage.getItem('access')).toBeNull()
  })
})
