type AcceptedDelivery = {
  deliveryId: string;
};

const acceptedByIdempotencyKey = new Map<string, AcceptedDelivery>();

export function findAcceptedDelivery(
  idempotencyKey: string,
): AcceptedDelivery | undefined {
  return acceptedByIdempotencyKey.get(idempotencyKey);
}

export function rememberAcceptedDelivery(
  idempotencyKey: string,
  deliveryId: string,
): void {
  acceptedByIdempotencyKey.set(idempotencyKey, { deliveryId });
}
