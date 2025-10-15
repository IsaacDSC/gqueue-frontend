import { useState, useEffect } from "react";

export interface Router {
  currentPath: string;
  navigate: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
}

export const useRouter = (): Router => {
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname;
  });

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log("PopState event:", event);
      setCurrentPath(window.location.pathname);
    };

    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen for browser back/forward buttons
    window.addEventListener("popstate", handlePopState);

    // Listen for programmatic navigation
    window.addEventListener("pushstate", handleLocationChange);
    window.addEventListener("replacestate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pushstate", handleLocationChange);
      window.removeEventListener("replacestate", handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    console.log("Navigating to:", path);

    if (path === currentPath) {
      console.log("Already on this path");
      return;
    }

    // Update browser history
    window.history.pushState({ path }, "", path);

    // Update local state
    setCurrentPath(path);

    // Dispatch custom event for any listeners
    const event = new CustomEvent("pushstate", { detail: { path } });
    window.dispatchEvent(event);

    console.log("Navigation completed. Current path:", path);
  };

  const goBack = () => {
    console.log("Going back");
    window.history.back();
  };

  const goForward = () => {
    console.log("Going forward");
    window.history.forward();
  };

  // Debug logging
  useEffect(() => {
    console.log("useRouter - Current path changed to:", currentPath);
  }, [currentPath]);

  return {
    currentPath,
    navigate,
    goBack,
    goForward,
  };
};
