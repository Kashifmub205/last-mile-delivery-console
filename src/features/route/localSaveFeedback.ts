export const LOCAL_SAVE_FEEDBACK_ONLINE_TITLE = 'Delivery saved';

export const LOCAL_SAVE_FEEDBACK_ONLINE_BODY =
  'Syncing automatically in the background.';

export const LOCAL_SAVE_FEEDBACK_OFFLINE_TITLE = 'Delivery saved locally';

export const LOCAL_SAVE_FEEDBACK_OFFLINE_BODY =
  "It will sync automatically when you're back online.";

export const LOCAL_SAVE_FEEDBACK_DISMISS_MS = 5000;

export type RouteLocalSaveParams = {
  deliverySavedLocally?: boolean;
};

export type LocalSaveFeedbackCopy = {
  title: string;
  body: string;
};

export function getLocalSaveFeedbackCopy(
  isOnline: boolean | null,
): LocalSaveFeedbackCopy {
  if (isOnline === true) {
    return {
      title: LOCAL_SAVE_FEEDBACK_ONLINE_TITLE,
      body: LOCAL_SAVE_FEEDBACK_ONLINE_BODY,
    };
  }

  return {
    title: LOCAL_SAVE_FEEDBACK_OFFLINE_TITLE,
    body: LOCAL_SAVE_FEEDBACK_OFFLINE_BODY,
  };
}

export function shouldShowLocalSaveFeedback(
  params: RouteLocalSaveParams | undefined,
): boolean {
  return params?.deliverySavedLocally === true;
}
