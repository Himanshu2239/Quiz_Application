import { useState, useEffect, useRef, useCallback } from "react";

// Enhanced timer hook with support for persistence and auto-save
export default function useTimer(initialSeconds = 0, onTimeUpdate?: (seconds: number) => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  
  // Last persisted time
  const lastPersistedTimeRef = useRef(initialSeconds);

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
      autoSaveRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      
      // Main countdown interval
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            clearIntervalRef();
            setIsRunning(false);
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
      
      // Auto-save interval (every 30 seconds)
      if (onTimeUpdate) {
        autoSaveRef.current = setInterval(() => {
          // Get the current time directly from state using a callback
          setSeconds(currentTime => {
            // Only persist if time has changed by at least 10 seconds
            if (Math.abs(lastPersistedTimeRef.current - currentTime) >= 10) {
              onTimeUpdate(currentTime);
              lastPersistedTimeRef.current = currentTime;
            }
            return currentTime; // Return unchanged to avoid re-render
          });
        }, 30000);
      }
    }
  }, [isRunning, clearIntervalRef, onTimeUpdate]);

  const pauseTimer = useCallback(() => {
    clearIntervalRef();
    setIsRunning(false);
    
    // Persist the current time when paused
    if (onTimeUpdate && Math.abs(lastPersistedTimeRef.current - seconds) >= 1) {
      onTimeUpdate(seconds);
      lastPersistedTimeRef.current = seconds;
    }
  }, [clearIntervalRef, onTimeUpdate, seconds]);

  const resetTimer = useCallback(() => {
    clearIntervalRef();
    setIsRunning(false);
    setSeconds(initialSeconds);
    lastPersistedTimeRef.current = initialSeconds;
    
    // Notify about reset
    if (onTimeUpdate) {
      onTimeUpdate(initialSeconds);
    }
  }, [clearIntervalRef, initialSeconds, onTimeUpdate]);

  const updateTime = useCallback((newSeconds: number) => {
    setSeconds(newSeconds);
    lastPersistedTimeRef.current = newSeconds;
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Save time before unmounting
      if (onTimeUpdate && isRunning) {
        onTimeUpdate(seconds);
      }
      clearIntervalRef();
    };
  }, [clearIntervalRef, onTimeUpdate, seconds, isRunning]);

  return {
    seconds,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    updateTime
  };
}
