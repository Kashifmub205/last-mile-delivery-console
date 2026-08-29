import { POD_TEMPLATE_FIXTURES } from '@/mock/fixtures';
import { parsePodTemplate } from '@/mock/parse';
import type { PodField, PodTemplate } from '@/types/pod';

import {
  sanitizePodAnswers,
  sanitizePodAnswersFromFields,
} from '../sanitizeAnswers';
import type { PodAnswers } from '../types';
import { validatePodForm } from '../validation';
import { getVisibleFields, isFieldVisible } from '../visibility';

const residentialTemplate = POD_TEMPLATE_FIXTURES.residential;

function filledResidentialAnswers(
  overrides: Partial<PodAnswers> = {},
): PodAnswers {
  return {
    recipient_name: 'Ayesha Khan',
    handed_to: 'Customer',
    photo_not_required_ack: ['Confirmed'],
    ...overrides,
  };
}

function residentialField(id: string): PodField {
  const field = residentialTemplate.fields.find(item => item.id === id);
  if (!field) {
    throw new Error(`Missing residential field: ${id}`);
  }

  return field;
}

describe('pod form visibility', () => {
  it('shows fields without visibleWhen', () => {
    expect(isFieldVisible(residentialField('recipient_name'), {})).toBe(true);
  });

  it('becomes visible when visibleWhen dependency matches', () => {
    const safePlaceField = residentialField('safe_place_location');

    expect(isFieldVisible(safePlaceField, { handed_to: 'Customer' })).toBe(
      false,
    );
    expect(isFieldVisible(safePlaceField, { handed_to: 'Safe place' })).toBe(
      true,
    );
  });

  it('hides a conditional field when the dependency changes', () => {
    const answers: PodAnswers = {
      handed_to: 'Safe place',
      safe_place_location: 'Behind gate',
    };

    expect(
      isFieldVisible(residentialField('safe_place_location'), answers),
    ).toBe(true);

    const updatedAnswers: PodAnswers = {
      ...answers,
      handed_to: 'Customer',
    };

    expect(
      isFieldVisible(residentialField('safe_place_location'), updatedAnswers),
    ).toBe(false);
    expect(
      getVisibleFields(residentialTemplate.fields, updatedAnswers),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'recipient_name' }),
        expect.objectContaining({ id: 'handed_to' }),
      ]),
    );
    expect(
      getVisibleFields(residentialTemplate.fields, updatedAnswers).some(
        field => field.id === 'safe_place_location',
      ),
    ).toBe(false);
  });
});

describe('pod form validation', () => {
  it('fails when a required visible field is empty', () => {
    const errors = validatePodForm(residentialTemplate.fields, {});

    expect(errors.recipient_name).toBe('Recipient name is required');
    expect(errors.handed_to).toBe('Handed to is required');
    expect(errors.photo_not_required_ack).toBe(
      'I confirm the parcel is visible and secure is required',
    );
  });

  it('succeeds when required visible fields are filled', () => {
    const errors = validatePodForm(
      residentialTemplate.fields,
      filledResidentialAnswers(),
    );

    expect(errors).toEqual({});
  });

  it('does not validate a hidden required field', () => {
    const errors = validatePodForm(
      residentialTemplate.fields,
      filledResidentialAnswers({
        handed_to: 'Customer',
      }),
    );

    expect(errors.safe_place_location).toBeUndefined();
  });

  it('skips unsupported fields during validation', () => {
    const exceptionTemplate = POD_TEMPLATE_FIXTURES.exception;
    const errors = validatePodForm(exceptionTemplate.fields, {
      exception_reason: 'Refused',
      exception_notes: 'Customer declined delivery',
    });

    expect(errors.signature).toBeUndefined();
    expect(
      exceptionTemplate.fields.some(field => field.id === 'signature'),
    ).toBe(true);
  });
});

describe('pod form sanitization', () => {
  it('excludes stale answers from hidden fields', () => {
    const answers = filledResidentialAnswers({
      handed_to: 'Safe place',
      safe_place_location: 'Behind gate',
      photo_not_required_ack: ['Confirmed'],
    });

    const visibleOnly = sanitizePodAnswers(
      residentialTemplate,
      filledResidentialAnswers({
        handed_to: 'Customer',
        safe_place_location: 'Behind gate',
      }),
    );

    expect(visibleOnly).toEqual(
      expect.arrayContaining([
        { fieldId: 'recipient_name', value: 'Ayesha Khan' },
        { fieldId: 'handed_to', value: 'Customer' },
        { fieldId: 'photo_not_required_ack', value: ['Confirmed'] },
      ]),
    );
    expect(
      visibleOnly.some(answer => answer.fieldId === 'safe_place_location'),
    ).toBe(false);

    const withStaleHiddenValue = sanitizePodAnswers(residentialTemplate, {
      ...answers,
      handed_to: 'Customer',
    });

    expect(
      withStaleHiddenValue.some(
        answer => answer.fieldId === 'safe_place_location',
      ),
    ).toBe(false);
  });

  it('omits unsupported fields from sanitized submission', () => {
    const exceptionTemplate = POD_TEMPLATE_FIXTURES.exception;
    const sanitized = sanitizePodAnswers(exceptionTemplate, {
      exception_reason: 'Refused',
      exception_notes: 'Customer declined delivery',
      signature: 'stale-signature-value',
    });

    expect(sanitized).toEqual([
      { fieldId: 'exception_reason', value: 'Refused' },
      { fieldId: 'exception_notes', value: 'Customer declined delivery' },
    ]);
  });

  it('handles malformed template data without crashing', () => {
    const parsed = parsePodTemplate({
      templateId: 'tpl-broken',
      name: 'Broken template',
      fields: [
        {
          id: 'broken_dropdown',
          type: 'DROPDOWN',
          label: 'Broken dropdown',
          isRequired: true,
        },
        {
          id: 'unknown_type',
          type: 'PHOTO',
          label: 'Photo',
          isRequired: true,
        },
      ],
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const template: PodTemplate = parsed.value;
    const answers: PodAnswers = {};

    expect(() => validatePodForm(template.fields, answers)).not.toThrow();
    expect(() => sanitizePodAnswers(template, answers)).not.toThrow();
    expect(sanitizePodAnswersFromFields(template.fields, answers)).toEqual([]);
  });
});

describe('pod field maxLength', () => {
  function parseSingleField(field: Record<string, unknown>): PodField {
    const parsed = parsePodTemplate({
      templateId: 'tpl-max-length',
      name: 'Max length',
      fields: [field],
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(parsed.error);
    }

    const parsedField = parsed.value.fields[0];
    if (!parsedField) {
      throw new Error('Expected a parsed field');
    }

    return parsedField;
  }

  it('preserves a valid positive maxLength on TEXT and TEXTAREA fields', () => {
    expect(
      parseSingleField({
        id: 'notes',
        type: 'TEXTAREA',
        label: 'Notes',
        isRequired: false,
        maxLength: 500,
      }),
    ).toEqual({
      id: 'notes',
      type: 'TEXTAREA',
      label: 'Notes',
      isRequired: false,
      maxLength: 500,
    });

    expect(
      parseSingleField({
        id: 'name',
        type: 'TEXT',
        label: 'Name',
        isRequired: false,
        maxLength: 40,
      }),
    ).toEqual({
      id: 'name',
      type: 'TEXT',
      label: 'Name',
      isRequired: false,
      maxLength: 40,
    });
  });

  it('ignores malformed maxLength values instead of failing the field', () => {
    const malformedValues = [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      '500',
      null,
      {},
      [],
      true,
    ];

    for (const maxLength of malformedValues) {
      const field = parseSingleField({
        id: 'notes',
        type: 'TEXTAREA',
        label: 'Notes',
        isRequired: false,
        maxLength,
      });

      expect(field).toEqual({
        id: 'notes',
        type: 'TEXTAREA',
        label: 'Notes',
        isRequired: false,
      });
      expect(field).not.toHaveProperty('maxLength');
    }
  });

  it('omits maxLength when the template does not define one', () => {
    const field = parseSingleField({
      id: 'notes',
      type: 'TEXTAREA',
      label: 'Notes',
      isRequired: false,
    });

    expect(field).toEqual({
      id: 'notes',
      type: 'TEXTAREA',
      label: 'Notes',
      isRequired: false,
    });
    expect(field).not.toHaveProperty('maxLength');
  });

  it('exposes maxLength 500 on Delivery Notes from the mock templates', () => {
    expect(residentialField('delivery_notes')).toEqual(
      expect.objectContaining({
        type: 'TEXTAREA',
        maxLength: 500,
      }),
    );
    expect(
      POD_TEMPLATE_FIXTURES.commercial.fields.find(
        field => field.id === 'delivery_notes',
      ),
    ).toEqual(
      expect.objectContaining({
        type: 'TEXTAREA',
        maxLength: 500,
      }),
    );
  });
});
