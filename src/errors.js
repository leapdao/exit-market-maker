
class ExtendableError extends Error {
  constructor(message) {
    super();
    const prefix = this.constructor.name.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    this.message = `${prefix}: ${message}`;
    this.errName = this.constructor.name;
  }
}

class Unauthorized extends ExtendableError {}

class Forbidden extends ExtendableError {}

class BadRequest extends ExtendableError {}

class NotFound extends ExtendableError {}

class Conflict extends ExtendableError {}

class EnhanceYourCalm extends ExtendableError {}

class ServerError extends ExtendableError {}

class Teapot extends ExtendableError {}

export { Unauthorized, NotFound, BadRequest, Forbidden, Conflict, ServerError, EnhanceYourCalm, Teapot };
