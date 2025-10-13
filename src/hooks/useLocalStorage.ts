import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing localStorage with TypeScript support
 * Provides automatic JSON serialization/deserialization and error handling
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get value from localStorage on initial load
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // Function to remove the key from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue) as T;
          setStoredValue(newValue);
        } catch (error) {
          console.warn(
            `Error parsing localStorage value for key "${key}":`,
            error,
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook specifically for managing metrics control state
 */
export function useMetricsLocalStorage() {
  const [selectedPublisher, setSelectedPublisher, clearPublisher] =
    useLocalStorage<string>("metricsControl_selectedPublisher", "");

  const [selectedConsumers, setSelectedConsumers, clearConsumers] =
    useLocalStorage<string[]>("metricsControl_selectedConsumers", []);

  const clearAll = useCallback(() => {
    clearPublisher();
    clearConsumers();
  }, [clearPublisher, clearConsumers]);

  // Validation helpers
  const validatePublisher = useCallback(
    (availablePublishers: Array<{ id: string }>) => {
      if (
        selectedPublisher &&
        !availablePublishers.some((p) => p.id === selectedPublisher)
      ) {
        setSelectedPublisher("");
        return false;
      }
      return true;
    },
    [selectedPublisher, setSelectedPublisher],
  );

  const validateConsumers = useCallback(
    (availableConsumers: Array<{ id: string }>) => {
      if (selectedConsumers.length > 0) {
        const validConsumers = selectedConsumers.filter((consumerId) =>
          availableConsumers.some((c) => c.id === consumerId),
        );

        if (validConsumers.length !== selectedConsumers.length) {
          setSelectedConsumers(validConsumers);
          return false;
        }
      }
      return true;
    },
    [selectedConsumers, setSelectedConsumers],
  );

  return {
    selectedPublisher,
    selectedConsumers,
    setSelectedPublisher,
    setSelectedConsumers,
    clearAll,
    validatePublisher,
    validateConsumers,
  };
}

/**
 * Utility function to get localStorage usage info
 */
export function getLocalStorageInfo() {
  if (typeof window === "undefined") {
    return { used: 0, remaining: 0, total: 0 };
  }

  try {
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    // Estimate total storage (usually 5-10MB, we'll use 5MB as conservative estimate)
    const estimatedTotal = 5 * 1024 * 1024; // 5MB in bytes

    return {
      used: totalSize,
      remaining: estimatedTotal - totalSize,
      total: estimatedTotal,
      usedPercentage: (totalSize / estimatedTotal) * 100,
    };
  } catch (error) {
    console.warn("Error calculating localStorage usage:", error);
    return { used: 0, remaining: 0, total: 0, usedPercentage: 0 };
  }
}
