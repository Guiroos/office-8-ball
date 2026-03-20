import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "@/components/ui/button"

describe("Button variants", () => {
  it("default variant applies gold gradient and brand shadow", () => {
    render(<Button>Click</Button>)
    const btn = screen.getByRole("button", { name: "Click" })
    expect(btn).toHaveClass("btn-gold-gradient")
    expect(btn).toHaveClass("text-foreground")
    expect(btn).toHaveClass("shadow-brand")
    expect(btn).toHaveClass("rounded-xl")
  })

  it("team-alpha variant applies blue gradient and bold weight", () => {
    render(<Button variant="team-alpha">Frontend</Button>)
    const btn = screen.getByRole("button", { name: "Frontend" })
    expect(btn).toHaveClass("from-blue-700")
    expect(btn).toHaveClass("to-blue-500")
    expect(btn).toHaveClass("text-foreground-inverse")
    expect(btn).toHaveClass("rounded-xl")
  })

  it("team-beta variant applies red gradient", () => {
    render(<Button variant="team-beta">Backend</Button>)
    const btn = screen.getByRole("button", { name: "Backend" })
    expect(btn).toHaveClass("from-red-700")
    expect(btn).toHaveClass("to-red-500")
    expect(btn).toHaveClass("text-foreground-inverse")
  })

  it("ghost variant applies surface-muted background and border", () => {
    render(<Button variant="ghost">Cancel</Button>)
    const btn = screen.getByRole("button", { name: "Cancel" })
    expect(btn).toHaveClass("bg-surface-muted")
    expect(btn).toHaveClass("border")
    expect(btn).toHaveClass("border-border")
  })

  it("sidebar variant applies sidebar tokens", () => {
    render(<Button variant="sidebar">Dashboard</Button>)
    const btn = screen.getByRole("button", { name: "Dashboard" })
    expect(btn).toHaveClass("bg-sidebar-hover")
    expect(btn).toHaveClass("text-sidebar-foreground")
    expect(btn).toHaveClass("border-sidebar-border")
  })

  it("sm size applies correct height and padding", () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole("button", { name: "Small" })
    expect(btn).toHaveClass("h-9")
    expect(btn).toHaveClass("px-4")
  })

  it("lg size applies correct height and padding", () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole("button", { name: "Large" })
    expect(btn).toHaveClass("h-13")
    expect(btn).toHaveClass("px-6")
  })

  it("disabled state keeps pointer-events-none and opacity", () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole("button", { name: "Disabled" })
    expect(btn).toHaveClass("disabled:pointer-events-none")
    expect(btn).toHaveClass("disabled:opacity-50")
  })
})
