import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import ShortcutHelpModal from '../../src/components/ShortcutHelpModal/ShortcutHelpModal';

describe('ShortcutHelpModal', () => {
  it('does not render when closed', () => {
    render(<ShortcutHelpModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByRole('dialog', { name: /Keyboard shortcuts/i })).not.toBeInTheDocument();
  });

  it('renders shortcuts when open', () => {
    render(<ShortcutHelpModal isOpen onClose={jest.fn()} />);

    expect(screen.getByRole('dialog', { name: /Keyboard shortcuts/i })).toBeInTheDocument();
    expect(screen.getByText(/Open command palette/i)).toBeInTheDocument();
    expect(screen.getByText(/Show keyboard shortcuts/i)).toBeInTheDocument();
  });

  it('calls onClose when pressing Escape', () => {
    const onClose = jest.fn();
    render(<ShortcutHelpModal isOpen onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on overlay click and not on modal content click', () => {
    const onClose = jest.fn();
    const { container } = render(<ShortcutHelpModal isOpen onClose={onClose} />);

    const overlay = screen.getByRole('dialog', { name: /Keyboard shortcuts/i });
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);

    const modal = container.querySelector('[tabindex="-1"]');
    expect(modal).toBeTruthy();
    if (modal) {
      fireEvent.click(modal);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
