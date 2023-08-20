export class DynamodbErrorResponse {
  private errorCode: string;
  private errorMessage: string;
  private statusCode?: number;
  private created: Date;

  constructor(
    errorCode: string,
    errorMessage: string,
    statusCode?: number,
    created: Date = new Date(),
  ) {
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.statusCode = statusCode;
    this.created = created;
  }
}
