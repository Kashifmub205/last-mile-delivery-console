export type RootStackParamList = {
  Route: { deliverySavedLocally?: boolean } | undefined;
  ProofOfDelivery: { stopId: string; templateId: string };
  Outbox: undefined;
};
