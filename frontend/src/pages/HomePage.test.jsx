import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'

describe('Home Page', () => {
  it('renders hero string correctly', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    expect(screen.getByText(/Smart Hostel Living/i)).toBeInTheDocument()
  })
  
  it('renders links to login and register', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    expect(screen.getByText(/Book a Room/i)).toBeInTheDocument()
    expect(screen.getByText(/Resident Portal/i)).toBeInTheDocument()
  })
})
