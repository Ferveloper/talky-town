let active: { cancel: () => void } | undefined;
/** Owns only a cancellation callback, never audio or conversation content. */
export function claimSpeech(cancel: () => void) {
  active?.cancel();
  const owner = { cancel };
  active = owner;
  return () => {
    if (active === owner) active = undefined;
  };
}
