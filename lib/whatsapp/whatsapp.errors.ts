export class WhatsAppError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "WhatsAppError";
  }
}

export class EvolutionConfigurationError extends WhatsAppError {
  constructor(message: string) {
    super(message, "EVOLUTION_CONFIGURATION");
    this.name = "EvolutionConfigurationError";
  }
}

export class EvolutionConnectionError extends WhatsAppError {
  constructor(message: string) {
    super(message, "EVOLUTION_CONNECTION");
    this.name = "EvolutionConnectionError";
  }
}

export class EvolutionAuthenticationError extends WhatsAppError {
  constructor(message: string) {
    super(message, "EVOLUTION_AUTHENTICATION");
    this.name = "EvolutionAuthenticationError";
  }
}

export class EvolutionMediaSendError extends WhatsAppError {
  constructor(message: string) {
    super(message, "EVOLUTION_MEDIA_SEND");
    this.name = "EvolutionMediaSendError";
  }
}

export class EvolutionWebhookError extends WhatsAppError {
  constructor(message: string) {
    super(message, "EVOLUTION_WEBHOOK");
    this.name = "EvolutionWebhookError";
  }
}

export class EvolutionRateLimitError extends WhatsAppError {
  constructor(message: string) {
    super(message, "EVOLUTION_RATE_LIMIT");
    this.name = "EvolutionRateLimitError";
  }
}
