import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../../config/configuration";

@Injectable()
export class MailService {
  private readonly logger = new Logger("MailService");

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  sendPasswordReset(email: string, token: string): Promise<void> {
    const mail = this.config.get("mail", { infer: true });
    const link = `/reset-password?token=${token}`;
    if (!mail.host || !mail.user) {
      this.logger.log(`[dev] Reset link for ${email}: ${link}`);
      return Promise.resolve();
    }
    this.logger.log(`Password reset requested for ${email}`);
    return Promise.resolve();
  }
}
