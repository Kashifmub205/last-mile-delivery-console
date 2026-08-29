import routeJson from './data/route.json';
import tplCommercialJson from './data/pod-templates/tpl-commercial.json';
import tplExceptionJson from './data/pod-templates/tpl-exception.json';
import tplResidentialJson from './data/pod-templates/tpl-residential.json';
import { parsePodTemplate, parseRoute } from './parse';

function loadFixture<T>(
  label: string,
  value: unknown,
  parser: (
    input: unknown,
  ) => { ok: true; value: T } | { ok: false; error: string },
): T {
  const result = parser(value);
  if (!result.ok) {
    throw new Error(`Invalid ${label} fixture: ${result.error}`);
  }

  return result.value;
}

export const ROUTE_FIXTURE = loadFixture('route', routeJson, parseRoute);

export const POD_TEMPLATE_FIXTURES = {
  residential: loadFixture(
    'tpl-residential',
    tplResidentialJson,
    parsePodTemplate,
  ),
  commercial: loadFixture(
    'tpl-commercial',
    tplCommercialJson,
    parsePodTemplate,
  ),
  exception: loadFixture('tpl-exception', tplExceptionJson, parsePodTemplate),
} as const;

export const POD_TEMPLATE_FIXTURE_BY_ID: Record<
  string,
  (typeof POD_TEMPLATE_FIXTURES)[keyof typeof POD_TEMPLATE_FIXTURES]
> = {
  [POD_TEMPLATE_FIXTURES.residential.templateId]:
    POD_TEMPLATE_FIXTURES.residential,
  [POD_TEMPLATE_FIXTURES.commercial.templateId]:
    POD_TEMPLATE_FIXTURES.commercial,
  [POD_TEMPLATE_FIXTURES.exception.templateId]: POD_TEMPLATE_FIXTURES.exception,
};
