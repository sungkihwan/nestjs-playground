import { Logger } from '@nestjs/common';
import { DynamodbErrorResponse } from '@libs/dynamodb/dynamodb.error.response';

export class DynamodbErrorHandler {
  public logger: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  async handleGetItemError(err) {
    let hasErr = false;
    let errorMessage = '';

    if (!err) {
      this.logger.error('Encountered error object was empty');
      errorMessage = 'Encountered error object was empty';
      hasErr = true;
    }
    if (!err.name) {
      this.logger.error(
        `An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(
          err,
        )}`,
      );
      throw err;
    }

    if (hasErr) {
      return new DynamodbErrorResponse(
        err.name ?? '',
        errorMessage,
        err.$metadata ? err.$metadata.httpStatusCode ?? 500 : 500,
        new Date(),
      );
    }

    // here are no API specific errors to handle for GetItem, common DynamoDB API errors are handled below
    return this.handleCommonErrors(err);
  }

  async handleUpdateItemError(err) {
    let hasErr = false;
    let errorMessage = '';

    if (!err) {
      this.logger.error('Encountered error object was empty');
      hasErr = true;
      errorMessage = 'Encountered error object was empty';
    }
    if (!err.name) {
      this.logger.error(
        `An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(
          err,
        )}`,
      );
      throw err;
    }

    switch (err.name) {
      case 'ConditionalCheckFailedException':
        this.logger.error(
          `Condition check specified in the operation failed, review and update the condition check before retrying. Error: ${err.message}`,
        );
        if (
          err.$metadata &&
          err.$metadata.httpStatusCode &&
          err.$metadata.httpStatusCode == 400
        ) {
          errorMessage = `${err.message}, 잘못된 요청입니다. 이미 존재하는 key인지 확인해주세요.`;
          hasErr = true;
          break;
        }
        throw err;
      case 'TransactionConflictException':
        this.logger
          .error(`Operation was rejected because there is an ongoing transaction for the item, generally safe to retry ' +
        'with exponential back-off. Error: ${err.message}`);
        throw err;
      case 'ItemCollectionSizeLimitExceededException':
        this.logger.error(
          `An item collection is too large, you're using Local Secondary Index and exceeded size limit of` +
            `items per partition key. Consider using Global Secondary Index instead. Error: ${err.message}`,
        );
        hasErr = true;
        errorMessage =
          `An item collection is too large, you're using Local Secondary Index and exceeded size limit of` +
          `items per partition key. Consider using Global Secondary Index instead. Error: ${err.message}`;
        break;
      default:
        break;
      // Common DynamoDB API errors are handled below
    }

    if (hasErr) {
      return new DynamodbErrorResponse(
        err.name ?? '',
        errorMessage,
        err.$metadata ? err.$metadata.httpStatusCode ?? 500 : 500,
        new Date(),
      );
    }

    return this.handleCommonErrors(err);
  }

  async handlePutItemError(err) {
    let hasErr = false;
    let errorMessage = '';

    if (!err) {
      this.logger.error('Encountered error object was empty');
      hasErr = true;
      errorMessage = 'Encountered error object was empty';
    }
    if (!err.name) {
      this.logger.error(
        `An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(
          err,
        )}`,
      );
      throw err;
    }
    switch (err.name) {
      case 'ConditionalCheckFailedException':
        this.logger.error(
          `Condition check specified in the operation failed, review and update the condition check before retrying. Error: ${err.message}`,
        );
        hasErr = true;
        errorMessage = `Condition check specified in the operation failed, review and update the condition check before retrying. Error: ${err.message}`;
        break;
      case 'TransactionConflictException':
        this.logger
          .error(`Operation was rejected because there is an ongoing transaction for the item, generally safe to retry ' +
        'with exponential back-off. Error: ${err.message}`);
        throw err;
      case 'ItemCollectionSizeLimitExceededException':
        this.logger.error(
          `An item collection is too large, you're using Local Secondary Index and exceeded size limit of` +
            `items per partition key. Consider using Global Secondary Index instead. Error: ${err.message}`,
        );
        hasErr = true;
        errorMessage =
          `An item collection is too large, you're using Local Secondary Index and exceeded size limit of` +
          `items per partition key. Consider using Global Secondary Index instead. Error: ${err.message}`;
        break;
      default:
        break;
      // Common DynamoDB API errors are handled below
    }

    if (hasErr) {
      return new DynamodbErrorResponse(
        err.name ?? '',
        errorMessage,
        err.$metadata ? err.$metadata.httpStatusCode ?? 500 : 500,
        new Date(),
      );
    }

    return this.handleCommonErrors(err);
  }

  async handleDeleteItemError(err) {
    let hasErr = false;
    let errorMessage = '';
    const statusCode = err.$metadata
      ? err.$metadata.httpStatusCode ?? 500
      : 500;

    if (!err) {
      this.logger.error('Encountered error object was empty');
      hasErr = true;
      errorMessage = 'Encountered error object was empty';
    }
    if (!err.name) {
      this.logger.error(
        `An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(
          err,
        )}`,
      );
      throw err;
    }
    switch (err.name) {
      case 'ConditionalCheckFailedException':
        this.logger.error(
          `Condition check specified in the operation failed, review and update the condition check before retrying. Error: ${err.message}`,
        );
        hasErr = true;
        errorMessage = `Condition check specified in the operation failed, review and update the condition check before retrying. Error: ${err.message}`;
        break;
      case 'TransactionConflictException':
        this.logger
          .error(`Operation was rejected because there is an ongoing transaction for the item, generally safe to retry ' +
        'with exponential back-off. Error: ${err.message}`);
        throw err;
      case 'ItemCollectionSizeLimitExceededException':
        this.logger.error(
          `An item collection is too large, you're using Local Secondary Index and exceeded size limit of` +
            `items per partition key. Consider using Global Secondary Index instead. Error: ${err.message}`,
        );
        hasErr = true;
        errorMessage = 'Encountered error object was empty';
        break;
      default:
        break;
      // Common DynamoDB API errors are handled below
    }

    if (hasErr) {
      return new DynamodbErrorResponse(
        err.name ?? '',
        errorMessage,
        statusCode,
        new Date(),
      );
    }

    return this.handleCommonErrors(err);
  }

  async handleTransactGetItemsError(err) {
    if (!err) {
      this.logger.error('Encountered error object was empty');
      return;
    }
    if (!err.name) {
      this.logger.error(
        `An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(
          err,
        )}`,
      );
      return;
    }
    switch (err.name) {
      case 'TransactionCanceledException':
        this.logger.error(
          `Transaction Cancelled, implies a client issue, fix before retrying. Error: ${err.message}`,
        );
        return;
      default:
        break;
      // Common DynamoDB API errors are handled below
    }
    return this.handleCommonErrors(err);
  }

  async handleTransactWriteItemsError(err) {
    if (!err) {
      this.logger.error('Encountered error object was empty');
      return;
    }
    if (!err.name) {
      this.logger.error(
        `An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(
          err,
        )}`,
      );
      return;
    }
    switch (err.name) {
      case 'TransactionCanceledException':
        this.logger.error(
          `Transaction Cancelled, implies a client issue, fix before retrying. Error: ${err.message}`,
        );
        return;
      case 'TransactionInProgressException':
        this.logger
          .error(`The transaction with the given request token is already in progress,' +
        ' consider changing retry strategy for this type of error. Error: ${err.message}`);
        return;
      case 'IdempotentParameterMismatchException':
        this.logger
          .error(`Request rejected because it was retried with a different payload but with a request token that was already used, ' +
        'change request token for this payload to be accepted. Error: ${err.message}`);
        return;
      default:
        break;
      // Common DynamoDB API errors are handled below
    }
    return this.handleCommonErrors(err);
  }

  async handleScanError(err) {
    if (!err) {
      console.error('Encountered error object was empty');
      return;
    }
    if (!err.name) {
      console.error(
        `An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(
          err,
        )}`,
      );
      return;
    }
    // here are no API specific errors to handle for Scan, common DynamoDB API errors are handled below
    return this.handleCommonErrors(err);
  }

  async handleExecuteStatementError(err) {
    if (!err) {
      this.logger.error('Encountered error object was empty');
      return;
    }
    if (!err.name) {
      this.logger.error(
        `An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(
          err,
        )}`,
      );
      return;
    }
    switch (err.name) {
      case 'ConditionalCheckFailedException':
        this.logger.error(
          `Condition check specified in the operation failed, review and update the condition check before retrying. Error: ${err.message}`,
        );
        return;
      case 'TransactionConflictException':
        this.logger
          .error(`Operation was rejected because there is an ongoing transaction for the item, generally safe to retry ' +
        'with exponential back-off. Error: ${err.message}`);
        return;
      case 'ItemCollectionSizeLimitExceededException':
        this.logger.error(
          `An item collection is too large, you're using Local Secondary Index and exceeded size limit of` +
            `items per partition key. Consider using Global Secondary Index instead. Error: ${err.message}`,
        );
        return;
      default:
        break;
      // Common DynamoDB API errors are handled below
    }

    return this.handleCommonErrors(err);
  }

  async handleCommonErrors(err) {
    let errorMessage = err.message;
    let statusCode = err.$metadata ? err.$metadata.httpStatusCode ?? 500 : 500;
    switch (err.name) {
      case 'InternalServerError':
        this.logger.error(
          `Internal Server Error, generally safe to retry with exponential back-off. Error: ${err.message}`,
        );
        throw err;
      case 'ProvisionedThroughputExceededException':
        this.logger.error(
          `Request rate is too high. If you're using a custom retry strategy make sure to retry with exponential back-off. ` +
            `Otherwise consider reducing frequency of requests or increasing provisioned capacity for your table or secondary index. Error: ${err.message}`,
        );
        throw err;
      case 'ResourceNotFoundException':
        this.logger.error(
          `One of the tables was not found, verify table exists before retrying. Error: ${err.message}`,
        );
        errorMessage = `One of the tables was not found, verify table exists before retrying. Error: ${err.message}`;
        break;
      case 'ServiceUnavailable':
        this.logger.error(
          `Had trouble reaching DynamoDB. generally safe to retry with exponential back-off. Error: ${err.message}`,
        );
        throw err;
      case 'ThrottlingException':
        this.logger.error(
          `Request denied due to throttling, generally safe to retry with exponential back-off. Error: ${err.message}`,
        );
        throw err;
      case 'UnrecognizedClientException':
        this.logger.error(
          `The request signature is incorrect most likely due to an invalid AWS access key ID or secret key, fix before retrying. ` +
            `Error: ${err.message}`,
        );
        errorMessage =
          `The request signature is incorrect most likely due to an invalid AWS access key ID or secret key, fix before retrying. ` +
          `Error: ${err.message}`;
        break;
      case 'ValidationException':
        this.logger.error(
          `The input fails to satisfy the constraints specified by DynamoDB, ` +
            `fix input before retrying. Error: ${err.message}`,
        );
        errorMessage =
          `The input fails to satisfy the constraints specified by DynamoDB, ` +
          `fix input before retrying. Error: ${err.message}`;
        break;
      case 'RequestLimitExceeded':
        this.logger.error(
          `Throughput exceeds the current throughput limit for your account, ` +
            `increase account level throughput before retrying. Error: ${err.message}`,
        );
        errorMessage =
          `Throughput exceeds the current throughput limit for your account, ` +
          `increase account level throughput before retrying. Error: ${err.message}`;
        break;
      case 'ValidationError':
        this.logger.error('Schema Validation에서 실패했습니다.');
        errorMessage = 'Schema Validation에서 실패했습니다.';
        statusCode = 400;
        break;
      case 'TypeError':
        this.logger.error('잘못된 인수를 전달했습니다.');
        errorMessage = '잘못된 인수를 전달했습니다.';
        statusCode = 400;
        break;
      case 'TypeMismatch':
        this.logger.error('스키마가 올바른지 확인해주세요.');
        errorMessage = '잘못된 인수를 전달했습니다.';
        statusCode = 400;
        break;
      default:
        this.logger.error(
          `An exception occurred, investigate and configure retry strategy. Error: ${err.message}`,
        );
        throw err;
    }

    return new DynamodbErrorResponse(
      err.name ?? '',
      errorMessage,
      statusCode,
      new Date(),
    );
  }

  async retryWithExponentialBackoff(
    fn: () => Promise<any>,
    cbErr: (err) => Promise<any>,
    retries = 3,
    interval = 300,
  ): Promise<any> {
    try {
      return await fn();
    } catch (e) {
      try {
        return await cbErr(e);
      } catch (err) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, interval));
          return this.retryWithExponentialBackoff(
            fn,
            cbErr,
            retries - 1,
            interval * 2,
          );
        } else {
          this.logger.error(
            `retryWithExponentialBackoff error, retries : ${retries}, error : ${JSON.stringify(
              e,
            )}`,
          );
          return new DynamodbErrorResponse(
            e.name ?? '',
            e.message ?? '',
            e.$metadata ? e.$metadata.httpStatusCode ?? 500 : 500,
            new Date(),
          );
        }
      }
    }
  }
}
