import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new ForbiddenException();
        }

        if (user.role === 'ADMIN') {
            return user;
        }

        throw new ForbiddenException('Brak uprawnień administratora.');
    }
}