export function handleKeyDown(e, setInputValue, handleCheckAnswer, keyMapping = {}) {
  const key = e?.key;

  if (key === 'Enter') {
    e.preventDefault?.();
    handleCheckAnswer?.();
    return;
  }

  if (key === 'Backspace') {
    e.preventDefault?.();
    setInputValue?.((prev) => String(prev || '').slice(0, -1));
    return;
  }

  if (typeof key === 'string' && key.length === 1) {
    const mapped = keyMapping[key] || key;
    setInputValue?.((prev) => `${String(prev || '')}${mapped}`);
  }
}

