export class PayloadClientError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'PayloadClientError';
    this.status = status;
    this.details = details;
  }
}

