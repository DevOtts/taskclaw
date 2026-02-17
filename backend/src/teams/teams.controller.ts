import { Body, Controller, Delete, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('accounts/:accountId')
@UseGuards(AuthGuard)
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Get('members')
    getAccountMembers(@Param('accountId') accountId: string, @Request() req) {
        const token = req.headers.authorization?.split(' ')[1];
        return this.teamsService.getAccountMembers(accountId, req.user.id, token);
    }

    @Get('invitations')
    getAccountInvitations(@Param('accountId') accountId: string, @Request() req) {
        const token = req.headers.authorization?.split(' ')[1];
        return this.teamsService.getAccountInvitations(accountId, req.user.id, token);
    }

    @Post('invitations')
    inviteUser(
        @Param('accountId') accountId: string,
        @Body('email') email: string,
        @Body('role') role: string,
        @Request() req,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        return this.teamsService.inviteUser(accountId, email, role, req.user.id, token);
    }

    @Delete('invitations/:invitationId')
    deleteInvitation(@Param('invitationId') invitationId: string, @Request() req) {
        const token = req.headers.authorization?.split(' ')[1];
        return this.teamsService.deleteInvitation(invitationId, req.user.id, token);
    }
}
