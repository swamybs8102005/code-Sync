/**
 * Compute the delta between two text contents for real-time collaboration
 * @param {string} prev - Previous text content
 * @param {string} next - New text content
 * @returns {Object|null} Delta object with start, end, and text properties, or null if no changes
 */
export function computeDelta(prev, next) {
  if (prev === next) return null;
  
  let start = 0;
  while (start < prev.length && start < next.length && prev[start] === next[start]) {
    start++;
  }
  
  let endPrev = prev.length - 1;
  let endNext = next.length - 1;
  while (endPrev >= start && endNext >= start && prev[endPrev] === next[endNext]) {
    endPrev--;
    endNext--;
  }
  
  const removedLength = endPrev - start + 1;
  const insertedText = next.slice(start, endNext + 1);
  
  return {
    start: start,
    end: start + removedLength,
    text: insertedText
  };
}

/**
 * Apply a delta to existing content
 * @param {string} content - Current content
 * @param {Object} delta - Delta object with start, end, and text
 * @returns {string} Updated content
 */
export function applyDelta(content, delta) {
  const start = content.slice(0, delta.start);
  const end = content.slice(delta.end);
  return start + delta.text + end;
}

/**
 * Generate a unique room ID
 * @returns {string} Unique room identifier
 */
export function generateRoomId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'room-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

/**
 * Debounce function for saving content
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
