export async function withRequestDeadline<T>(timeoutMs: number, operation: (signal: AbortSignal) => Promise<T>, timeoutMessage: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new Error(timeoutMessage);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
