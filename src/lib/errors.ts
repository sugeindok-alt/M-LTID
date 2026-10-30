export class AppError extends Error {
  constructor(
    public message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export class SourceError extends AppError {
  constructor(source: string) {
    super(`${source} svarar ikkje som venta. Prøv igjen om litt.`, 502);
  }
}
