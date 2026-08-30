import { createClient } from '@/lib/supabase';

const supabase = createClient();

// Thrown by AdminService's server-route calls so callers can tell "you're
// not an admin" (expected, not worth logging as an error — nothing gates
// the admin panel by role, so this happens for any non-admin session that
// browses there) apart from a genuine failure.
export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

export function isUnauthorizedError(err: unknown): err is AdminApiError {
  return err instanceof AdminApiError && err.status === 401;
}

async function throwAdminApiError(response: Response, fallbackMessage: string): Promise<never> {
  const body = await response.json().catch(() => ({}));
  throw new AdminApiError(body.error || fallbackMessage, response.status);
}

export const AdminService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error logging in admin:', error.message);
      throw new Error(error.message);
    }

    if (data.user) {
      // Verify if the user profile role is 'admin' (or similar administrative role)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error verifying profile role:', profileError.message);
        await supabase.auth.signOut();
        throw new Error('Access denied. Failed to retrieve user role.');
      }

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Only administrators are allowed to sign in.');
      }
    }

    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
      throw new Error(error.message);
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      throw new Error(error.message);
    }
    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // No active session is a normal, expected state — not a failure.
      if (error.name === 'AuthSessionMissingError') return null;
      console.error('Error getting user:', error.message);
      throw new Error(error.message);
    }
    return data.user;
  },

  // Every platform user (buyers, sellers, admins). Goes through a server
  // route using the service-role key so the full list always comes back,
  // regardless of whichever session's RLS would otherwise apply.
  async getAllUsers() {
    const response = await fetch('/api/admin/users');
    if (!response.ok) {
      await throwAdminApiError(response, 'Failed to fetch users');
    }
    return response.json();
  },

  // Get all drone requests via server route to bypass RLS
  async getAllDroneRequests() {
    const response = await fetch('/api/admin/drone-requests/show');
    if (!response.ok) {
      await throwAdminApiError(response, 'Failed to fetch drone requests');
    }
    return response.json();
  },

  async updateDroneRequestStatus(requestId: string, status: string, adminNotes: string) {
    const response = await fetch('/api/admin/drone-requests/update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId,
        status,
        adminNotes,
      }),
    });
    if (!response.ok) {
      await throwAdminApiError(response, 'Failed to update drone request');
    }
    return response.json();
  }
};
