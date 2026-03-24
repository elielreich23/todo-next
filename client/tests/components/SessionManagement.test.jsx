import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import SessionManagement from '../../src/components/SessionManagement/SessionManagement';

jest.mock('../../src/lib/api', () => ({
  api: jest.fn(),
}));

const { api } = require('../../src/lib/api');

describe('SessionManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders current and other sessions from API', async () => {
    api.mockResolvedValueOnce({
      success: true,
      sessions: [
        {
          id: '1',
          device_name: 'Windows 10/11 Desktop',
          browser: 'Chrome 120',
          os: 'Windows 10/11',
          ip_address: '1.2.3.4',
          location: 'Local Network',
          is_current: true,
          last_activity: new Date().toISOString(),
          is_active: true,
        },
        {
          id: '2',
          device_name: 'macOS Desktop',
          browser: 'Safari 17',
          os: 'macOS 14.0',
          ip_address: '5.6.7.8',
          location: 'Location Unknown',
          is_current: false,
          last_activity: new Date(Date.now() - 60_000).toISOString(),
          is_active: true,
        },
      ],
    });

    render(<SessionManagement />);

    expect(screen.getByText(/Loading sessions/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Current Session/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Other Sessions \(1\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Browser:/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/OS:/i).length).toBeGreaterThanOrEqual(1);
  });

  it('revokes a session and removes it from list', async () => {
    api
      .mockResolvedValueOnce({
        success: true,
        sessions: [
          {
            id: '1',
            device_name: 'Windows Desktop',
            browser: 'Chrome 120',
            os: 'Windows 10/11',
            is_current: true,
            last_activity: new Date().toISOString(),
            is_active: true,
          },
          {
            id: '2',
            device_name: 'macOS Desktop',
            browser: 'Safari 17',
            os: 'macOS 14.0',
            is_current: false,
            last_activity: new Date().toISOString(),
            is_active: true,
          },
        ],
      })
      .mockResolvedValueOnce({ success: true });

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<SessionManagement />);

    await waitFor(() => expect(screen.getByText(/Other Sessions \(1\)/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^Revoke$/i }));

    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));

    await waitFor(() => {
      expect(screen.queryByText(/Other Sessions/i)).not.toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });
});
