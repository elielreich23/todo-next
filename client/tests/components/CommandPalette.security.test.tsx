import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import CommandPalette from "../../src/components/CommandPalette/CommandPalette";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("CommandPalette security", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("navigates only to safe internal paths", () => {
    const items = [
      { id: "safe", label: "Safe", href: "/dashboard/profile" },
      { id: "unsafe1", label: "Unsafe 1", href: "javascript:alert(1)" },
      { id: "unsafe2", label: "Unsafe 2", href: "//evil.example.com" },
      { id: "unsafe3", label: "Unsafe 3", href: "https://evil.example.com" },
    ];

    render(<CommandPalette isOpen onClose={jest.fn()} items={items} />);

    fireEvent.click(screen.getByText("Safe"));
    expect(pushMock).toHaveBeenCalledWith("/dashboard/profile");

    fireEvent.click(screen.getByText("Unsafe 1"));
    fireEvent.click(screen.getByText("Unsafe 2"));
    fireEvent.click(screen.getByText("Unsafe 3"));

    expect(pushMock).toHaveBeenCalledTimes(1);
  });
});
