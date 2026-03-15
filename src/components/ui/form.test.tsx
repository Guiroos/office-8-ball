import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FieldError, FieldLabel, Input } from "@/components/ui/form";

describe("form primitives", () => {
  it("renders an input with default accessible state", () => {
    render(<Input aria-label="Email" />);

    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).not.toHaveAttribute(
      "aria-invalid",
    );
  });

  it("marks the input as invalid when requested", () => {
    render(<Input aria-label="Senha" invalid />);

    expect(screen.getByLabelText("Senha")).toHaveAttribute("aria-invalid", "true");
  });

  it("renders the field error only when it has content", () => {
    const { rerender } = render(<FieldError id="email-error">Email invalido.</FieldError>);

    expect(screen.getByText("Email invalido.")).toBeInTheDocument();

    rerender(<FieldError id="email-error">{""}</FieldError>);

    expect(screen.queryByText("Email invalido.")).not.toBeInTheDocument();
  });

  it("associates labels through native htmlFor behavior", () => {
    render(
      <>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input id="username" />
      </>,
    );

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
  });
});
