/**
 * Utility function to conditionally join class names together
 * @param  {...string} classes - Class names to be joined
 * @returns {string} - Combined class names with extra spaces removed
 */
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
} 