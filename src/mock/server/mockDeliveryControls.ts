export type MockDeliveryControlMode =
  | 'none'
  | 'network'
  | '400'
  | '500'
  | 'fail_first_n';

export type MockApiLatencyMs = 0 | 500 | 1500;

export const MOCK_API_LATENCY_OPTIONS = [
  0, 500, 1500,
] as const satisfies readonly MockApiLatencyMs[];

export type MockDeliveryControls = {
  mode: MockDeliveryControlMode;
  message: string;
  failFirstN: number;
  latencyMs: MockApiLatencyMs;
};

export type MockDeliveryFailureInjection =
  | { kind: 'none' }
  | { kind: 'network' }
  | { kind: 'http'; status: number; message: string };

const DEFAULT_MESSAGE = 'Mock delivery failure';

const DEFAULT_CONTROLS: MockDeliveryControls = {
  mode: 'none',
  message: DEFAULT_MESSAGE,
  failFirstN: 3,
  latencyMs: 0,
};

let controls: MockDeliveryControls = { ...DEFAULT_CONTROLS };

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

export function resetMockDeliveryControls(): MockDeliveryControls {
  controls = { ...DEFAULT_CONTROLS };
  attemptCountByIdempotencyKey.clear();
  return getMockDeliveryControls();
}

export function resetMockDeliveryAttemptCounts(): void {
  attemptCountByIdempotencyKey.clear();
}

export async function waitForConfiguredMockLatency(): Promise<void> {
  const ms = controls.latencyMs;

  if (ms <= 0) {
    return;
  }

  await new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
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
