export type MockDeliveryControlMode =
  | 'none'
  | 'network'
  | '400'
  | '500'
  | 'fail_first_n';

export type MockDeliveryControls = {
  mode: MockDeliveryControlMode;
  message: string;
  failFirstN: number;
};

export type MockDeliveryFailureInjection =
  | { kind: 'none' }
  | { kind: 'network' }
  | { kind: 'http'; status: number; message: string };

const DEFAULT_MESSAGE = 'Mock delivery failure';

let controls: MockDeliveryControls = {
  mode: 'none',
  message: DEFAULT_MESSAGE,
  failFirstN: 3,
};

const attemptCountByIdempotencyKey = new Map<string, number>();

export function getMockDeliveryControls(): MockDeliveryControls {
  return { ...controls };
}

export function setMockDeliveryControls(
  next: Partial<MockDeliveryControls>,
): MockDeliveryControls {
  controls = {
    ...controls,
    ...next,
  };

  if (next.mode !== undefined) {
    attemptCountByIdempotencyKey.clear();
  }

  return getMockDeliveryControls();
}

export function resetMockDeliveryAttemptCounts(): void {
  attemptCountByIdempotencyKey.clear();
}

function incrementAttemptCount(idempotencyKey: string): number {
  const nextCount = (attemptCountByIdempotencyKey.get(idempotencyKey) ?? 0) + 1;
  attemptCountByIdempotencyKey.set(idempotencyKey, nextCount);
  return nextCount;
}

export function resolveDeliveryFailureInjection(
  idempotencyKey: string,
): MockDeliveryFailureInjection {
  switch (controls.mode) {
    case 'network':
      return { kind: 'network' };
    case '400':
      return {
        kind: 'http',
        status: 400,
        message: controls.message,
      };
    case '500':
      return {
        kind: 'http',
        status: 500,
        message: controls.message,
      };
    case 'fail_first_n': {
      const attempt = incrementAttemptCount(idempotencyKey);

      if (attempt <= controls.failFirstN) {
        return {
          kind: 'http',
          status: 500,
          message: `${controls.message} (attempt ${attempt}/${controls.failFirstN})`,
        };
      }

      return { kind: 'none' };
    }
    default:
      return { kind: 'none' };
  }
}
