import { ROUTE_FIXTURE } from '@/mock/fixtures';
import type { Route } from '@/types/route';

export type MockGetRouteResponse = {
  status: 200;
  data: Route;
};

export function getRoute(): MockGetRouteResponse {
  return {
    status: 200,
    data: ROUTE_FIXTURE,
  };
}
