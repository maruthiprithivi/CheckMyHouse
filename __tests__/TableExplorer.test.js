
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableExplorer from '@/app/tables/page';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useRequireAuth: jest.fn(),
}));

jest.mock('react-syntax-highlighter', () => {
  const Light = ({ children }) => <pre>{children}</pre>;
  Light.registerLanguage = jest.fn();
  return { Light };
});

jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/sql', () => ({}));
jest.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => ({ github: {} }));

// Mock fetch
global.fetch = jest.fn();

describe('TableExplorer Navigation', () => {
  let mockRouter;
  let mockSearchParams;

  beforeEach(() => {
    mockRouter = { push: jest.fn() };
    mockSearchParams = new URLSearchParams();

    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(mockSearchParams);
    useRequireAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    // Mock fetch responses
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        databases: [{ name: 'default', table_count: 5 }],
        tables: [{ name: 'test_table', engine: 'MergeTree' }],
      }),
    });
  });

  it('updates URL when a table is clicked', async () => {
    // Simulate being on a database page
    const params = new URLSearchParams();
    params.set('database', 'default');
    useSearchParams.mockReturnValue(params);

    render(<TableExplorer />);

    // Wait for tables to load
    await waitFor(() => screen.getByText('test_table'));

    // Click table
    fireEvent.click(screen.getByText('test_table'));

    // Verify router push with correct params
    expect(mockRouter.push).toHaveBeenCalled();
    const args = mockRouter.push.mock.calls[0][0];
    expect(args).toContain('table=test_table');
  });

  it('auto-selects first database if not in URL', async () => {
    render(<TableExplorer />);

    await waitFor(() => {
      // Should trigger database change which pushes to router
      expect(mockRouter.push).toHaveBeenCalled();
      const args = mockRouter.push.mock.calls[0][0];
      expect(args).toContain('database=default');
    });
  });
});
