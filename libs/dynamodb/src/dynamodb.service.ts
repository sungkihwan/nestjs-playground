import { Model } from 'nestjs-dynamoose';
import { DynamodbErrorHandler } from '@libs/dynamodb/dynamodb.error.handler';
import { DynamodbErrorResponse } from '@libs/dynamodb/dynamodb.error.response';
import { plainToInstance } from 'class-transformer';

export class DynamodbService<
  Data,
  Key,
  CombinedData extends Data & Key,
> extends DynamodbErrorHandler {
  constructor(private model: Model<Data, Key>) {
    super();
  }

  async create(
    data: CombinedData,
  ): Promise<CombinedData | DynamodbErrorResponse> {
    const result = await this.retryWithExponentialBackoff(
      () => this.model.create(data),
      this.handleUpdateItemError.bind(this),
    );

    if (result instanceof DynamodbErrorResponse) {
      this.logger.error(`create data : ${JSON.stringify(data)}`);
    }

    return result;
  }

  //     await User.update({"id": 1}, {"$SET": {"name": "Bob"}, "$ADD": {"age": 1}});
  // // This will set the item name to Bob and increase the age by 1 for the user where id = 1
  //     await User.update({"id": 1}, {"$REMOVE": ["address"]});
  //     await User.update({"id": 1}, {"$REMOVE": {"address": null}});
  // // These two function calls will delete the `address` attribute for the item where id = 1
  //     await User.update({"id": 1}, {"$SET": {"name": "Bob"}, "$ADD": {"friends": "Tim"}});
  //     await User.update({"id": 1}, {"$SET": {"name": "Bob"}, "$ADD": {"friends": ["Tim"]}});
  // // This will set the item name to Bob and append Tim to the list/array/set of friends where id = 1
  //     await User.update({"id": 1}, {"$DELETE": {"friends": ["Tim"]}});
  // This will delete the element Tim from the friends set on the item where id = 1
  async update(
    key: Key,
    data: Partial<Data>,
  ): Promise<CombinedData | DynamodbErrorResponse> {
    const result = await this.retryWithExponentialBackoff(
      () => this.model.update(key, data),
      this.handlePutItemError.bind(this),
    );

    if (result instanceof DynamodbErrorResponse) {
      this.logger.error(
        `update key : ${JSON.stringify(key)}, data : ${JSON.stringify(data)}`,
      );
    }

    return result;
  }

  async findOne(
    key: Key,
    attributes: string[] = undefined,
  ): Promise<CombinedData | DynamodbErrorResponse> {
    const result = await this.retryWithExponentialBackoff(
      () => this.model.get(key, { return: 'item', attributes: attributes }),
      this.handleGetItemError.bind(this),
      1,
      200,
    );

    if (result instanceof DynamodbErrorResponse) {
      this.logger.error(`findOne key : ${JSON.stringify(key)}`);
    }
    return result;
  }

  async findOneWithType<D>(
    key: Key,
    attributes: string[] = undefined,
    type: new () => D,
  ): Promise<D | DynamodbErrorResponse> {
    const result = await this.retryWithExponentialBackoff(
      () => this.model.get(key, { return: 'item', attributes: attributes }),
      this.handleGetItemError.bind(this),
      1,
      200,
    );

    if (result instanceof DynamodbErrorResponse) {
      this.logger.error(`findOne key : ${JSON.stringify(key)}`);
    }

    return plainToInstance(type, result, { excludeExtraneousValues: true });
  }

  async delete(key: Key): Promise<undefined | DynamodbErrorResponse> {
    const result = await this.retryWithExponentialBackoff(
      () => this.model.delete(key),
      this.handleDeleteItemError.bind(this),
    );

    if (result instanceof DynamodbErrorResponse) {
      this.logger.error(`delete key : ${JSON.stringify(key)}`);
    }

    return result;
  }

  async batchGet(keys: Key[], attributes: string[] = undefined) {
    const result = await this.retryWithExponentialBackoff(
      () =>
        this.model.batchGet(keys, { return: 'items', attributes: attributes }),
      this.handleGetItemError.bind(this),
      0,
    );

    if (result instanceof DynamodbErrorResponse) {
      this.logger.error(`batchGet keys : ${JSON.stringify(keys)}`);
    }

    return result;
  }

  async batchDelete(keys: Key[]) {
    const result = await this.retryWithExponentialBackoff(
      () => this.model.batchDelete(keys),
      this.handleDeleteItemError.bind(this),
      0,
    );

    if (result instanceof DynamodbErrorResponse) {
      this.logger.error(`batchDelete keys : ${JSON.stringify(keys)}`);
    }

    return result;
  }

  async batchPut(users: CombinedData[]) {
    const result = await this.retryWithExponentialBackoff(
      () => this.model.batchPut(users),
      this.handlePutItemError.bind(this),
      0,
    );

    if (result instanceof DynamodbErrorResponse) {
      this.logger.error(`batchDelete data : ${JSON.stringify(users)}`);
    }

    return result;
  }

  async findAll() {
    return this.model
      .scan()
      .exec()
      .catch((e) => {
        this.handleScanError(e);
      });
  }
}
