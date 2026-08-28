import type { AxiosResponse } from 'axios';
import type { PodSubmission } from '@/types/pod';
import { axiosClient } from '@/api/axiosClient';
import { postRouteDelivery } from '@/api/deliveryApi';

jest.mock('@/api/axiosClient', () => ({
  axiosClient: {
    post: jest.fn(),
  },
}));

const mockPost = axiosClient.post as jest.MockedFunction<
  typeof axiosClient.post
>;

const submission: PodSubmission = {
  stopId: 'stop-001',
  templateId: 'residential-v1',
  clientDeliveryId: 'client-delivery-1',
  completedAt: '2026-08-28T10:00:00.000Z',
  location: { latitude: 51.5, longitude: -0.12 },
  response: [{ fieldId: 'recipient_name', value: 'Test Recipient' }],
};

function mockResolvedResponse(
  status: number,
  data: unknown,
): AxiosResponse<unknown> {
  return {
    data,
    status,
    statusText: 'Mock',
    headers: {},
    config: {} as AxiosResponse['config'],
  };
}

describe('postRouteDelivery', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('returns failed with server message for resolved 400 responses', async () => {
    mockPost.mockResolvedValue(
      mockResolvedResponse(400, { message: 'Invalid stop payload' }),
    );

    const result = await postRouteDelivery(
      'route-001',
      submission,
      'idem-key-1',
    );

    expect(result).toEqual({
      outcome: 'failed',
      message: 'Invalid stop payload',
      status: 400,
      retryable: false,
    });
  });

  it('returns failed with server message for resolved 500 responses', async () => {
    mockPost.mockResolvedValue(
      mockResolvedResponse(500, { message: 'Mock server unavailable' }),
    );

    const result = await postRouteDelivery(
      'route-001',
      submission,
      'idem-key-2',
    );

    expect(result).toEqual({
      outcome: 'failed',
      message: 'Mock server unavailable',
      status: 500,
      retryable: true,
    });
  });

  it('treats resolved 409 with deliveryId as duplicate success', async () => {
    mockPost.mockResolvedValue(
      mockResolvedResponse(409, {
        deliveryId: 'server-delivery-1',
        message: 'Delivery already accepted',
      }),
    );

    const result = await postRouteDelivery(
      'route-001',
      submission,
      'idem-key-3',
    );

    expect(result).toEqual({
      outcome: 'synced',
      deliveryId: 'server-delivery-1',
      duplicate: true,
    });
  });

  it('returns generic error when success response omits deliveryId', async () => {
    mockPost.mockResolvedValue(
      mockResolvedResponse(201, { message: 'Created' }),
    );

    const result = await postRouteDelivery(
      'route-001',
      submission,
      'idem-key-4',
    );

    expect(result).toEqual({
      outcome: 'failed',
      message: 'Delivery response did not include deliveryId',
      status: 201,
      retryable: true,
    });
  });
});
