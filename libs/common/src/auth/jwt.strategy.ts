/**
 * Estrategia JWT para Passport
 * @module Common/Auth
 */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload, UserAuth } from "../interfaces/auth.interface";

/**
 * Estrategia para validar tokens JWT
 * @class JwtStrategy
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Constructor de la estrategia JWT
   * @param jwtSecret - Secreto para verificar tokens JWT
   */
  constructor(private readonly jwtSecret: string) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Valida el payload del token JWT
   * @param payload - Payload extraído del token
   * @returns Usuario autenticado
   * @throws UnauthorizedException - Si el token no es válido
   */
  async validate(payload: JwtPayload): Promise<UserAuth> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException("Token inválido");
    }

    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}
