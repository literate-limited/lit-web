// Minimal stubs for credit sync hooks used by the axios client.
// The full TelepromptTV credit sync system is out of scope for this Debatica MVP.

export function shouldSyncCreditsForRequest(_config) {
  return false;
}

export function triggerTtvCreditSync(_reason) {}

export function recordTtvLedgerEvent(_event) {}

