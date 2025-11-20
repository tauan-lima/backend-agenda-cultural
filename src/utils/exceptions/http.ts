export class HttpError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class HttpUnauthorized extends HttpError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401);
    this.name = 'HttpUnauthorized';
  }
}

export class HttpNotFound extends HttpError {
  constructor(message: string = 'Não encontrado') {
    super(message, 404);
    this.name = 'HttpNotFound';
  }
}

export class HttpBadRequest extends HttpError {
  constructor(message: string = 'Requisição inválida') {
    super(message, 400);
    this.name = 'HttpBadRequest';
  }
}

export class HttpForbidden extends HttpError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403);
    this.name = 'HttpForbidden';
  }
}

