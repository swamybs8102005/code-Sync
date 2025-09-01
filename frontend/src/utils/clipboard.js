export async function copyText(text) {
  // Try Async Clipboard API first
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // continue to fallbacks
  }

  // Fallback 1: execCommand with copy event
  try {
    const onCopy = (e) => {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', text);
    };
    document.addEventListener('copy', onCopy);
    const ok = document.execCommand('copy');
    document.removeEventListener('copy', onCopy);
    if (ok) return true;
  } catch (_) {
    // continue to next fallback
  }

  // Fallback 2: temporary textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (ok) return true;
  } catch (_) {
    // ignore
  }

  return false;
}
