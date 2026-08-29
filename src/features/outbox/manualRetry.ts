export function retryFailedDeliveryAndRequestSync(
  clientDeliveryId: string,
  retryFailedDelivery: (clientDeliveryId: string) => void,
  requestSyncPass: () => unknown,
): void {
  retryFailedDelivery(clientDeliveryId);
  void requestSyncPass();
}
