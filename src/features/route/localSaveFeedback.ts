export const LOCAL_SAVE_FEEDBACK_TITLE = 'Delivery saved locally';

export const LOCAL_SAVE_FEEDBACK_BODY =
  'It will sync automatically when a connection is available.';

export const LOCAL_SAVE_FEEDBACK_DISMISS_MS = 5000;

export type RouteLocalSaveParams = {
  deliverySavedLocally?: boolean;
};

export function shouldShowLocalSaveFeedback(
  params: RouteLocalSaveParams | undefined,
): boolean {
  return params?.deliverySavedLocally === true;
}
