import {
  LOCAL_SAVE_FEEDBACK_BODY,
  LOCAL_SAVE_FEEDBACK_TITLE,
  shouldShowLocalSaveFeedback,
} from '@/features/route/localSaveFeedback';

describe('localSaveFeedback', () => {
  it('shows feedback only when the navigation param is true', () => {
    expect(shouldShowLocalSaveFeedback(undefined)).toBe(false);
    expect(shouldShowLocalSaveFeedback({})).toBe(false);
    expect(shouldShowLocalSaveFeedback({ deliverySavedLocally: false })).toBe(
      false,
    );
    expect(shouldShowLocalSaveFeedback({ deliverySavedLocally: true })).toBe(
      true,
    );
  });

  it('uses truthful wording that does not claim sync success', () => {
    expect(LOCAL_SAVE_FEEDBACK_TITLE).toBe('Delivery saved locally');
    expect(LOCAL_SAVE_FEEDBACK_BODY).toBe(
      'It will sync automatically when a connection is available.',
    );
    expect(LOCAL_SAVE_FEEDBACK_TITLE.toLowerCase()).not.toContain('synced');
    expect(LOCAL_SAVE_FEEDBACK_BODY.toLowerCase()).not.toContain('synced');
    expect(LOCAL_SAVE_FEEDBACK_TITLE.toLowerCase()).not.toContain(
      'sent successfully',
    );
    expect(LOCAL_SAVE_FEEDBACK_BODY.toLowerCase()).not.toContain(
      'sent successfully',
    );
  });
});
