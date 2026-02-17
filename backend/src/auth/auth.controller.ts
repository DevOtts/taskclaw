import { Controller, Post, Body, Get, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, ForgotPasswordDto, UpdatePasswordDto } from './dto/auth.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('signup')
    async signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @Post('logout')
    async logout(@Req() req: Request) {
        const token = this.extractTokenFromHeader(req);
        if (!token) return { success: true }; // Already logged out effectively
        return this.authService.logout(token);
    }

    @Get('me')
    async getMe(@Req() req: Request) {
        const token = this.extractTokenFromHeader(req);
        if (!token) throw new UnauthorizedException('No token provided');
        return this.authService.getMe(token);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.resetPasswordForEmail(dto.email, dto.redirectTo || '');
    }

    @Post('update-password')
    async updatePassword(@Req() req: Request, @Body() dto: UpdatePasswordDto) {
        const token = this.extractTokenFromHeader(req);
        if (!token) throw new UnauthorizedException('No token provided');
        return this.authService.updateUser(token, { password: dto.password });
    }

    @Post('exchange-code')
    async exchangeCode(@Body() body: { code: string }) {
        return this.authService.exchangeCodeForSession(body.code);
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
