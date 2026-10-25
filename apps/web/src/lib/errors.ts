export type ChatErrorCode =
  | "unauthorized:chat"
  | "unauthorized:session"
  | "forbidden:subscription"
  | "forbidden:tokens"
  | "not_found:chatbot"
  | "not_found:chat"
  | "rate_limit:chat"
  | "internal:error";

export class ChatSDKError extends Error {
  code: ChatErrorCode;
  statusCode: number;
  cause?: any;

  constructor(code: ChatErrorCode, message: string, statusCode: number = 400, cause?: any) {
    super(message);
    this.name = "ChatSDKError";
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        code: this.code,
        message: this.message,
        cause: this.cause,
      }),
      {
        status: this.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
