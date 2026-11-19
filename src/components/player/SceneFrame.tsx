'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type {
  HostToParentMessage,
  ParentToHostMessage,
  SceneOpts,
} from '@/types/scene-api';

export interface SceneFrameProps {
  bundleUrl?: string;
  opts?: Partial<SceneOpts>;
  sceneId?: string;
  paused?: boolean;
  speed?: number;
  tau?: number;
  className?: string;
  onReady?: () => void;
  onMounted?: (sceneId?: string) => void;
  onError?: (error: { message: string; stack?: string }) => void;
}

export const SceneFrame: React.FC<SceneFrameProps> = ({
  bundleUrl,
  opts,
  sceneId,
  paused = false,
  speed = 1.0,
  tau,
  className = '',
  onReady,
  onMounted,
  onError,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isHostReady, setIsHostReady] = useState(false);
  const lastLoadedBundleRef = useRef<string | null>(null);

  // Send message to sandboxed iframe using strict origin check
  const sendMessage = useCallback((msg: ParentToHostMessage) => {
    if (iframeRef.current?.contentWindow) {
      // Sandboxed iframe without allow-same-origin has an opaque origin, so targetOrigin '*' is required
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  }, []);

  // Listen to messages from host
  useEffect(() => {
    const handleMessage = (event: MessageEvent<HostToParentMessage>) => {
      // Security check: ensure event originates from our iframe content window
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      const data = event.data;
      if (!data || typeof data.type !== 'string') return;

      switch (data.type) {
        case 'HOST_READY':
          setIsHostReady(true);
          onReady?.();
          break;

        case 'SCENE_MOUNTED':
          onMounted?.(data.sceneId);
          break;

        case 'SCENE_ERROR':
          onError?.({ message: data.message, stack: data.stack });
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onReady, onMounted, onError]);

  // Load scene when host is ready and bundleUrl changes
  useEffect(() => {
    if (!isHostReady || !bundleUrl) return;

    if (lastLoadedBundleRef.current !== bundleUrl) {
      lastLoadedBundleRef.current = bundleUrl;
      const fullOpts: SceneOpts = {
        seed: opts?.seed ?? 42,
        dayLengthSec: opts?.dayLengthSec ?? 900,
        startTau: opts?.startTau ?? 0.5,
        reducedMotion: opts?.reducedMotion ?? false,
      };

      sendMessage({
        type: 'LOAD_SCENE',
        bundleUrl,
        opts: fullOpts,
        sceneId,
      });
    }
  }, [isHostReady, bundleUrl, opts, sceneId, sendMessage]);

  // Handle play/pause state
  useEffect(() => {
    if (!isHostReady) return;
    sendMessage({
      type: 'SET_PLAY_STATE',
      paused,
    });
  }, [isHostReady, paused, sendMessage]);

  // Handle animation speed
  useEffect(() => {
    if (!isHostReady) return;
    sendMessage({
      type: 'SET_SPEED',
      speed,
    });
  }, [isHostReady, speed, sendMessage]);

  // Handle dynamic time of day (tau)
  useEffect(() => {
    if (!isHostReady || tau === undefined) return;
    sendMessage({
      type: 'UPDATE_TAU',
      tau,
    });
  }, [isHostReady, tau, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sendMessage({ type: 'DESTROY' });
    };
  }, [sendMessage]);

  return (
    <iframe
      ref={iframeRef}
      src="/scene-host.html"
      sandbox="allow-scripts"
      className={`w-full h-full border-0 absolute inset-0 pointer-events-none select-none ${className}`}
      tabIndex={-1}
      aria-hidden="true"
      title="TimeDrift Scene Viewport"
    />
  );
};

export default SceneFrame;
