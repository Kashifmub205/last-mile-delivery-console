export type DeliveryFailureKind = 'retryable' | 'non_retryable';

export function classifyDeliveryFailureStatus(
  status: number,
): DeliveryFailureKind {
  if (status === 0) {
    return 'retryable';
  }

  if (status >= 500 && status <= 599) {
    return 'retryable';
  }

  if (status >= 400 && status <= 499) {
    return 'non_retryable';
  }

  return 'retryable';
}
