import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly configService: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException();
        }

        const supabase = this.supabaseService.getClient();

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('AuthGuard Error:', error);
            throw new UnauthorizedException();
        }

        // Attach user and token to request object
        request['user'] = user;
        request['accessToken'] = token;

        // Enforce user approval status (public.users.status)
        // Pending/suspended users must not access protected API routes.
        try {
            const adminSupabase = this.supabaseService.getAdminClient();
            const { data: profile, error: profileError } = await adminSupabase
                .from('users')
                .select('status')
                .eq('id', user.id)
                .single();

            if (!profileError) {
                const status = String(profile?.status || 'active').toLowerCase();
                if (status !== 'active') {
                    throw new UnauthorizedException('Your account is pending approval or suspended.');
                }
            } else {
                // Backwards-compat if migration wasn't applied yet
                const msg = (profileError as any)?.message?.toLowerCase?.() || '';
                if (!msg.includes('status')) {
                    console.error('AuthGuard status lookup error:', profileError);
                    throw new UnauthorizedException();
                }
            }
        } catch (e) {
            if (e instanceof UnauthorizedException) throw e;
            console.error('AuthGuard status check failed:', e);
            throw new UnauthorizedException();
        }

        // Also set the auth token for the supabase client to respect RLS if we were using a service role client,
        // but here we are just verifying. If we want to forward the user's session to DB calls, 
        // we might need to recreate the client with the token or use `auth.setSession`.
        // For now, we just verify the user exists.

        return true;
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
