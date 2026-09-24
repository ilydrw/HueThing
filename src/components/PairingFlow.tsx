import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HueState } from '../types';
import { DiscoverBridgeStep } from './pairing/DiscoverBridgeStep';
import { ManualIpStep } from './pairing/ManualIpStep';
import { PairingShell } from './pairing/PairingShell';
import { PairingStateStep } from './pairing/PairingStateStep';
import { DISCOVERY_TIMEOUT_MS, isValidBridgeIp } from './pairing/pairingUtils';
import { useHueStoreActions, useHueStoreState } from '../state';

export default function PairingFlow({ hueState, onPaired }: { hueState: HueState; onPaired: () => void }) {
  const { discoveredBridges, pairStatus } = useHueStoreState();
  const actions = useHueStoreActions();
  const [step, setStep] = useState<'discover' | 'manual-ip' | 'press-button' | 'success' | 'error'>('discover');
  const [isSearching, setIsSearching] = useState(true);
  const [manualIpStr, setManualIpStr] = useState('');
  const [logs, setLogs] = useState<string[]>(['Initializing Hue...']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const discoveryTimeout = useRef<NodeJS.Timeout | null>(null);

  const addLog = (msg: string) => setLogs((prev) => {
    const entry = `> ${msg}`;
    return prev[prev.length - 1] === entry ? prev : [...prev.slice(-2), entry];
  });
  const canSubmitManualIp = isValidBridgeIp(manualIpStr);

  const clearDiscoveryTimers = useCallback(() => {
    if (discoveryTimeout.current) {
      clearTimeout(discoveryTimeout.current);
      discoveryTimeout.current = null;
    }
  }, []);

  const startDiscovery = useCallback(() => {
    clearDiscoveryTimers();
    setIsSearching(true);
    setErrorMessage(null);
    addLog('Scanning network...');
    actions.discoverBridges();

    discoveryTimeout.current = setTimeout(() => {
      setIsSearching(false);
      addLog('No bridge found yet. Try manual IP or rescan.');
    }, DISCOVERY_TIMEOUT_MS);
  }, [actions, clearDiscoveryTimers]);

  const openManualEntry = useCallback(() => {
    setErrorMessage(null);
    setStep('manual-ip');
  }, []);

  const resetToDiscovery = useCallback(() => {
    setErrorMessage(null);
    setStep('discover');
  }, []);

  const cancelPairing = useCallback(() => {
    actions.cancelPairing();
    resetToDiscovery();
  }, [actions, resetToDiscovery]);

  const handlePairingRequest = useCallback((ip: string) => {
    const normalizedIp = ip.trim();
    if (!isValidBridgeIp(normalizedIp)) {
      setErrorMessage('Enter a valid IPv4 address for your Hue Bridge.');
      setStep('error');
      return;
    }

    clearDiscoveryTimers();
    setErrorMessage(null);
    addLog(`Linking with ${normalizedIp}...`);
    setStep('press-button');
    actions.pairBridge({ bridgeIp: normalizedIp });
  }, [actions, clearDiscoveryTimers]);

  useEffect(() => {
    if (discoveredBridges.length > 0) {
      clearDiscoveryTimers();
      setIsSearching(false);
      setErrorMessage(null);
      addLog(`${discoveredBridges.length} bridge${discoveredBridges.length === 1 ? '' : 's'} spotted.`);
    }
  }, [clearDiscoveryTimers, discoveredBridges]);

  useEffect(() => {
    if (pairStatus?.success) {
      setErrorMessage(null);
      setStep('success');
      return;
    }

    const nextError = pairStatus?.error;
    if (!nextError) return;

    addLog(nextError);
    if (/press the bridge button/i.test(nextError)) {
      return;
    }

    setErrorMessage(nextError);
    setStep('error');
  }, [pairStatus]);

  useEffect(() => () => clearDiscoveryTimers(), [clearDiscoveryTimers]);

  useEffect(() => {
    if (step !== 'discover') {
      clearDiscoveryTimers();
      return;
    }

    startDiscovery();
    return () => clearDiscoveryTimers();
  }, [step, startDiscovery, clearDiscoveryTimers]);

  const content = (() => {
    switch (step) {
      case 'discover':
        return (
          <DiscoverBridgeStep
            bridgeIp={hueState.bridgeIp}
            bridges={discoveredBridges}
            isSearching={isSearching}
            logs={logs}
            onRetry={startDiscovery}
            onManual={openManualEntry}
            onConnect={handlePairingRequest}
          />
        );
      case 'manual-ip':
        return (
          <ManualIpStep
            manualIp={manualIpStr}
            canSubmit={canSubmitManualIp}
            onChange={(updater) => setManualIpStr(updater)}
            onBack={resetToDiscovery}
            onSubmit={() => handlePairingRequest(manualIpStr)}
            onClear={() => setManualIpStr('')}
          />
        );
      case 'press-button':
        return <PairingStateStep variant="press-button" logs={logs} onPrimary={cancelPairing} />;
      case 'success':
        return <PairingStateStep variant="success" onPrimary={onPaired} />;
      case 'error':
        return <PairingStateStep variant="error" message={errorMessage} onPrimary={resetToDiscovery} onSecondary={openManualEntry} />;
      default:
        return <p style={{ color: '#fff' }}>Initializing...</p>;
    }
  })();

  return (
    <PairingShell alignment={step === 'manual-ip' ? 'center' : 'center'}>
      {content}
    </PairingShell>
  );
}
