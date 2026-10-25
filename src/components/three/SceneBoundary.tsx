"use client";

import { Component, type ReactNode } from "react";

interface SceneBoundaryProps {
  onError: () => void;
  children: ReactNode;
}

/** Catches 3D render failures so the hero switches to its 2D rendering instead of breaking. */
export class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Inference network failed to render; showing the 2D version.", error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
