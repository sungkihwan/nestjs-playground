import * as Airtable from 'airtable';
import { Base, Record as AirtableRecord, Records } from 'airtable';
import { QueryParams } from 'airtable/lib/query_params';
import { FieldSet } from 'airtable/lib/field_set';
import * as _ from 'lodash';

import { AirtableFormulaPolicy } from '@libs/airtable/airtable.formula.policy';
import { Logger } from '@nestjs/common';

export interface IAirtableConfig {
  apiKey: string;
  baseId: string;
  tableId: string;
}

export type IAirtableRecord = Record<string, IAirtableValue> & { id: string };

export type IAirtableValue = string | number | string[] | boolean | any;

export class AirtableService {
  private readonly logger = new Logger(AirtableService.name);

  private readonly airtableBase: Base;
  private defaultTableId: string;
  private readonly policy = new AirtableFormulaPolicy();

  constructor({ apiKey, baseId, tableId }: IAirtableConfig) {
    this.airtableBase = new Airtable({
      apiKey,
    }).base(baseId);
    this.defaultTableId = tableId;
  }

  tableId(tableId: string): this {
    this.defaultTableId = tableId;
    return this;
  }

  getTable() {
    return this.airtableBase.table(this.defaultTableId);
  }

  findOneById(id: string, usingFieldId = false): Promise<AirtableRecord<any>> {
    if (usingFieldId) {
      return this.getTable()
        .select({
          filterByFormula: `RECORD_ID() = '${id}'`,
          returnFieldsByFieldId: true,
          maxRecords: 1,
        })
        .firstPage()
        .then((data) => data?.[0]);
    }
    return this.getTable().find(id);
  }

  findBy(
    where: Record<string, IAirtableValue>,
    options?: QueryParams<FieldSet>,
  ): Promise<Records<any>> {
    return this.getTable()
      .select({
        filterByFormula: this.policy.mapJsonToFormula(where),
        ...options,
      })
      .all();
  }

  async findForSchedulingJob(
    where: Record<string, IAirtableValue>,
    options?: QueryParams<FieldSet>,
  ): Promise<Records<any>> {
    return this.getTable()
      .select({
        filterByFormula: this.policy.mapJsonToFormulaV2(where),
        ...options,
      })
      .all();
  }

  async findOneV2By(
    where: Record<string, IAirtableValue>,
    options?: QueryParams<FieldSet>,
  ): Promise<AirtableRecord<any>> {
    const records = await this.getTable()
      .select({
        filterByFormula: this.policy.mapJsonToFormulaV2(where),
        ...options,
      })
      .firstPage();
    return _.first(records);
  }

  findAll(options?: QueryParams<FieldSet>): Promise<Records<any>> {
    return this.getTable()
      .select({
        ...options,
      })
      .all();
  }

  async findOneBy(
    where: Record<string, IAirtableValue>,
    options?: QueryParams<FieldSet>,
  ): Promise<AirtableRecord<any>> {
    const records = await this.getTable()
      .select({
        filterByFormula: this.policy.mapJsonToFormula(where),
        ...options,
      })
      .firstPage();
    return _.first(records);
  }

  async create(
    where: Record<string, IAirtableValue>,
  ): Promise<AirtableRecord<any>> {
    return this.getTable().create(where, { typecast: true });
  }

  async updateOne(
    id: string,
    where: Record<string, IAirtableValue>,
  ): Promise<AirtableRecord<any>> {
    return this.getTable().update(id, where, { typecast: true });
  }

  async update(entities: IAirtableRecord[]): Promise<Records<any>> {
    const records = entities.map(({ id, ...fields }) => ({
      id,
      fields,
    }));
    return this.getTable().update(records, { typecast: true });
  }

  async deleteById(id: string): Promise<AirtableRecord<any>> {
    return this.getTable().destroy(id);
  }

  async deleteByIds(ids: string[]) {
    await this.getTable().destroy(ids);
  }
}
