import { withSupabase } from 'npm:@supabase/server';

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed.' },
        { status: 405, headers: { Allow: 'POST' } }
      );
    }

    const userId = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;

    if (!userId) {
      return Response.json(
        { error: 'Invalid or expired session.' },
        { status: 401 }
      );
    }

    const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('delete-account failed', {
        userId,
        message: error.message,
      });

      return Response.json(
        { error: 'Could not delete account.' },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  }),
};
