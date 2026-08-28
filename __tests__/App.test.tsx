/**
 * @format
 */

jest.mock('@/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
