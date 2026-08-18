import React from "react";
import ErrorBoundary from "../src/components/ui/ErrorBoundary";

describe("ErrorBoundary Component Unit Tests", () => {
  test("getDerivedStateFromError updates state to hasError: true with error details", () => {
    const testError = new Error("Simulated component render failure");
    const derivedState = ErrorBoundary.getDerivedStateFromError(testError);

    expect(derivedState.hasError).toBe(true);
    expect(derivedState.error).toBe(testError);
    expect(derivedState.error?.message).toBe("Simulated component render failure");
  });

  test("ErrorBoundary renders children when there is no error", () => {
    const boundary = new ErrorBoundary({ children: "Normal content" });
    boundary.state = { hasError: false, error: null };

    const rendered = boundary.render();
    expect(rendered).toBe("Normal content");
  });

  test("ErrorBoundary renders fallback UI when hasError is true", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    const boundary = new ErrorBoundary({ children: "Normal content" });
    const simulatedError = new Error("Critical UI Render Exception");
    
    boundary.componentDidCatch(simulatedError, { componentStack: "at CrashingComponent" });
    boundary.state = { hasError: true, error: simulatedError };

    const rendered = boundary.render() as React.ReactElement;
    expect(rendered).toBeDefined();
    expect(rendered.type).toBe("div");
    expect(rendered.props.className).toContain("error-boundary-container");

    consoleSpy.mockRestore();
  });

  test("ErrorBoundary respects custom fallback prop if provided", () => {
    const customFallback = React.createElement("div", { id: "custom-fallback" }, "Custom Error");
    const boundary = new ErrorBoundary({ 
      children: "Normal content", 
      fallback: customFallback 
    });
    boundary.state = { hasError: true, error: new Error("Crash") };

    const rendered = boundary.render();
    expect(rendered).toBe(customFallback);
  });
});
