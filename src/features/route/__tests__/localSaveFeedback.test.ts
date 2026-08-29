import {
  LOCAL_SAVE_FEEDBACK_OFFLINE_BODY,
  LOCAL_SAVE_FEEDBACK_OFFLINE_TITLE,
  LOCAL_SAVE_FEEDBACK_ONLINE_BODY,
  LOCAL_SAVE_FEEDBACK_ONLINE_TITLE,
  getLocalSaveFeedbackCopy,
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

  it('uses online wording when connectivity is online', () => {
    expect(getLocalSaveFeedbackCopy(true)).toEqual({
      title: LOCAL_SAVE_FEEDBACK_ONLINE_TITLE,
      body: LOCAL_SAVE_FEEDBACK_ONLINE_BODY,
    });
    expect(LOCAL_SAVE_FEEDBACK_ONLINE_TITLE).toBe('Delivery saved');
    expect(LOCAL_SAVE_FEEDBACK_ONLINE_BODY).toBe(
      'Syncing automatically in the background.',
    );
  });

  it('uses local-first wording when offline', () => {
    expect(getLocalSaveFeedbackCopy(false)).toEqual({
      title: LOCAL_SAVE_FEEDBACK_OFFLINE_TITLE,
      body: LOCAL_SAVE_FEEDBACK_OFFLINE_BODY,
    });
    expect(LOCAL_SAVE_FEEDBACK_OFFLINE_TITLE).toBe('Delivery saved locally');
    expect(LOCAL_SAVE_FEEDBACK_OFFLINE_BODY).toBe(
      "It will sync automatically when you're back online.",
    );
  });

  it('uses local-first wording when connectivity is unknown', () => {
    expect(getLocalSaveFeedbackCopy(null)).toEqual({
      title: LOCAL_SAVE_FEEDBACK_OFFLINE_TITLE,
      body: LOCAL_SAVE_FEEDBACK_OFFLINE_BODY,
    });
  });

  it('never claims the delivery already synced', () => {
    for (const isOnline of [true, false, null] as const) {
      const { title, body } = getLocalSaveFeedbackCopy(isOnline);
      expect(title.toLowerCase()).not.toContain('synced');
      expect(body.toLowerCase()).not.toContain('synced');
      expect(title.toLowerCase()).not.toContain('sent successfully');
      expect(body.toLowerCase()).not.toContain('sent successfully');
    }
  });
});
