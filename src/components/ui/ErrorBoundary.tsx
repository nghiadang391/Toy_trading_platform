"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime render error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container">
          <div className="error-card">
            <div className="error-icon">🛡️</div>
            <h2>Something went wrong</h2>
            <p className="error-desc">
              ToyTrade encountered an unexpected render issue. Don't worry, your wallet funds and on-chain escrow states are completely safe.
            </p>
            {this.state.error && (
              <pre className="error-details">
                {this.state.error.message || "Unknown error"}
              </pre>
            )}
            <div className="error-actions">
              <button onClick={this.handleReset} className="retry-btn">
                Reload Application
              </button>
              <a href="/" className="home-btn">
                Return to Home
              </a>
            </div>
          </div>

          <style jsx>{`
            .error-boundary-container {
              min-height: 60vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 40px 24px;
              font-family: Inter, system-ui, sans-serif;
            }
            .error-card {
              background: #141a20;
              border: 1px solid rgba(255, 71, 87, 0.35);
              border-radius: 16px;
              padding: 40px;
              max-width: 520px;
              width: 100%;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 71, 87, 0.1);
            }
            .error-icon {
              font-size: 2.5rem;
              margin-bottom: 16px;
            }
            h2 {
              font-size: 1.5rem;
              font-weight: 800;
              color: #ffffff;
              margin-bottom: 12px;
            }
            .error-desc {
              font-size: 0.95rem;
              color: rgba(255, 255, 255, 0.7);
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .error-details {
              background: #0a0e12;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 12px;
              font-size: 0.8rem;
              color: #ff4757;
              text-align: left;
              overflow-x: auto;
              margin-bottom: 24px;
              font-family: monospace;
            }
            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
            }
            .retry-btn {
              background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
              color: #0a0a0a;
              border: none;
              font-weight: 700;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              transition: transform 0.2s, opacity 0.2s;
            }
            .retry-btn:hover {
              transform: translateY(-1px);
              opacity: 0.95;
            }
            .home-btn {
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.15);
              color: #ffffff;
              font-weight: 600;
              padding: 10px 20px;
              border-radius: 8px;
              text-decoration: none;
              transition: background 0.2s;
            }
            .home-btn:hover {
              background: rgba(255, 255, 255, 0.12);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
